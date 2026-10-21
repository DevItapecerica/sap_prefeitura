import assert from 'node:assert/strict';
import test from 'node:test';
import { Op, ForeignKeyConstraintError, UniqueConstraintError } from 'sequelize';
import AppError from '../../../../../core/appError.js';
import { SequelizeActionPermissionRepository } from '../sequelize.action-permission.repository.js';

type Data = Record<string, any>;
const make = () => {
 const data: Record<string,Data[]> = {
  UserModel: [{id:10,role_id:2,setor_id:4}], RolesModel: [{id:2},{id:3}],
  ServiceModel: [{id:3,module_key:'servicos',name:'Serviços'},{id:6,module_key:'ft',name:'FT'}],
  ServiceVisibilities: [{setor_id:4,service_id:3,visibility:true},{setor_id:4,service_id:6,visibility:true}],
  PermissionActionModel: [{id:1,service_id:3,module_key:'servicos',action:'acessar'},{id:2,service_id:3,module_key:'servicos',action:'gerenciar_permissoes'},{id:3,service_id:6,module_key:'ft',action:'acessar'},{id:4,service_id:6,module_key:'ft',action:'remover_bolsista'},{id:5,service_id:6,module_key:'ft',action:'excluir_bolsista'}],
  RolePermissionsModel: [{id:1,role_id:2,permission_action_id:1,allowed:true},{id:2,role_id:2,permission_action_id:2,allowed:true},{id:3,role_id:2,permission_action_id:3,allowed:true},{id:4,role_id:2,permission_action_id:4,allowed:false}],
 };
 const log: {table:string; operation:string; options:any}[] = [];
 let failure: Error | undefined;
 let failAt = 1;
 let writeCount=0;
 const database: any = {};
 const matches = (row:Data,where:Data = {}) => Object.entries(where).every(([key,value]) => value && typeof value === 'object' && Op.in in value ? value[Op.in].includes(row[key]) : row[key] === value);
 const wrap = (row:Data) => ({get:()=>({...row}),update:async (input:Data) => {writeCount++; if(failure && writeCount >= failAt) throw failure; Object.assign(row,input);}});
 for (const table of Object.keys(data)) {
  const select = (options:any={}) => data[table].filter(row=>!row.deletedAt && matches(row,options.where)).sort((a,b)=>Number(a.id??0)-Number(b.id??0));
  database[table]={
   findByPk:async (id:number,options:any={})=>{log.push({table,operation:'findByPk',options:{...options,id}}); const row=select().find(r=>r.id===id);return row?wrap(row):null;},
   findOne:async (options:any={})=>{log.push({table,operation:'findOne',options});const row=select(options)[0];return row?wrap(row):null;},
   findAll:async (options:any={})=>{log.push({table,operation:'findAll',options});return select(options).map(wrap);},
   findAndCountAll:async (options:any={})=>{const rows=select(options); return {rows:rows.slice(options.offset,options.offset+options.limit).map(wrap),count:rows.length};},
   create:async (input:Data)=>{writeCount++;if(failure && writeCount >= failAt) throw failure;data[table].push({id:data[table].length+1,...input});},
  };
 }
 const transaction = {LOCK:{UPDATE:'UPDATE'}};
 database.sequelize={transaction:async (work:any)=>{const before=structuredClone(data);try{return await work(transaction);}catch(error){Object.assign(data,before);throw error;}}};
 return {repository:new SequelizeActionPermissionRepository(database),data,log,writeCount:()=>writeCount,fail:(error:Error,at=1)=>{failure=error;failAt=at;}};
};
const code = (expected:string) => (error:unknown)=>error instanceof AppError && error.code===expected;

test('repository effective rights intersect current role, entry, visibility and active service; no CRUD flags',async()=>{
 const f=make();
 assert.deepEqual(await f.repository.effective(10),[
  {service_id:3,module:'servicos',actions:['acessar','gerenciar_permissoes']},
  {service_id:6,module:'ft',actions:['acessar']},
 ]);
 const visible=await f.repository.visibleServices(10);
 assert.equal(visible[1].module,'ft');assert.deepEqual(visible[1].actions,['acessar']);assert.ok(!('permissions' in visible[1]));
 f.data.UserModel[0].role_id=3; assert.deepEqual(await f.repository.effective(10),[]);
 f.data.UserModel[0].role_id=2; f.data.ServiceVisibilities[1].visibility=false;
 assert.equal((await f.repository.effective(10)).length,1);
 f.data.ServiceVisibilities[1].visibility=true; f.data.ServiceModel[1].deletedAt=new Date();
 assert.equal((await f.repository.effective(10)).length,1);
 f.data.UserModel[0].setor_id=null; assert.deepEqual(await f.repository.effective(10),[]);
 f.data.UserModel[0].role_id=99; await assert.rejects(f.repository.effective(10),code('NOT_PERMITTED'));
 f.data.UserModel=[]; await assert.rejects(f.repository.effective(10),code('UNAUTHENTICATED'));
 assert.equal(await f.repository.service('missing'),null);assert.equal(await f.repository.visible(999,6),false);
 assert.deepEqual(await f.repository.actions(2,999),[]);
});
test('effective service listing uses bounded batched queries, not per-module lookups', async () => {
 const f=make();
 const result=await f.repository.visibleServices(10);
 assert.equal(result.length,2);
 assert.equal(f.log.length,6);
 for(const table of ['ServiceModel','ServiceVisibilities','PermissionActionModel','RolePermissionsModel']) {
  assert.equal(f.log.filter(item=>item.table===table).length,1,table);
 }
});
test('catalog pages and role grants are LEFT JOIN with false defaults and stable ids',async()=>{
 const f=make();
 assert.deepEqual(await f.repository.catalog({page:1,limit:1,service_id:6}),{permission:[{id:4,service_id:6,module:'ft',action:'remover_bolsista'}],count:3});
 const grants=await f.repository.list({page:0,limit:100,role_id:2,service_id:6});
 assert.deepEqual(grants.permission.map((p:any)=>p.allowed),[true,false,false]);
 assert.ok(grants.permission.every((p:any)=>p.role_id===2));
 await assert.rejects(f.repository.list({page:0,limit:1,role_id:99}),code('ROLE_NOT_FOUND'));
 assert.equal((await f.repository.catalog({page:0,limit:100})).count,5);
});
test('batch locks roles in ascending order, updates atomically, allows self-edit and omits unchanged grants',async()=>{
 const f=make();
 const result=await f.repository.update(10,3,[{permission_action_id:5,allowed:true},{permission_action_id:4,allowed:true},{permission_action_id:3,allowed:false}]);
 assert.deepEqual(result,{role_id:3,changes:[{permission_action_id:4,before:false,after:true},{permission_action_id:5,before:false,after:true}]});
 const roleLocks=f.log.filter(l=>l.table==='RolesModel');
 assert.deepEqual(roleLocks.slice(0,2).map(l=>l.options.id),[2,3]);
 assert.ok(roleLocks.every(l=>l.options.lock==='UPDATE'));
 assert.equal(f.writeCount(),2);
 assert.deepEqual((await f.repository.update(10,3,[{permission_action_id:4,allowed:true}])).changes,[]);
 await f.repository.update(10,2,[{permission_action_id:2,allowed:false}]);
 await assert.rejects(f.repository.update(10,3,[{permission_action_id:4,allowed:false}]),code('NOT_PERMITTED'));
 assert.equal(f.data.RolePermissionsModel.find(r=>r.role_id===3&&r.permission_action_id===4)?.allowed,true);
});
test('batch revalidates deleted actor, target role, actor role, catalog and visibility without writing',async()=>{
 for(const mutate of [
  (f:ReturnType<typeof make>)=>{f.data.UserModel=[];},
  (f:ReturnType<typeof make>)=>{f.data.RolesModel=f.data.RolesModel.filter(r=>r.id!==3);},
  (f:ReturnType<typeof make>)=>{f.data.RolesModel=f.data.RolesModel.filter(r=>r.id!==2);},
  (f:ReturnType<typeof make>)=>{f.data.PermissionActionModel=f.data.PermissionActionModel.filter(r=>r.id!==4);},
  (f:ReturnType<typeof make>)=>{f.data.ServiceVisibilities[0].visibility=false;},
 ]) {const f=make();mutate(f);await assert.rejects(f.repository.update(10,3,[{permission_action_id:4,allowed:true}]));assert.equal(f.writeCount(),0);}
 const f=make();f.fail(new Error('simulated failure'),2);
 await assert.rejects(f.repository.update(10,3,[{permission_action_id:4,allowed:true},{permission_action_id:5,allowed:true}]));
 assert.ok(!f.data.RolePermissionsModel.some(r=>r.role_id===3));
});
test('repository rejects unsafe direct inputs and translates real integrity conflicts',async()=>{
 const f=make();
 await assert.rejects(f.repository.update(10,3,[{permission_action_id:4,allowed:'false'}] as any),code('VALIDATION_ERROR'));
 for(const error of [new ForeignKeyConstraintError({}),new UniqueConstraintError({})]) {
  const f=make();f.fail(error);
  await assert.rejects(f.repository.update(10,3,[{permission_action_id:4,allowed:true}]),code('PERMISSION_CONFLICT'));
 }
});
