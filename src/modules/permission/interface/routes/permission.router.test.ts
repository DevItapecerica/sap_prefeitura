import assert from 'node:assert/strict';
import test from 'node:test';
import Fastify from 'fastify';
import permissionRouter from './permission.router.js';
import AuthMiddleware from '../../../auth/auth.middleware.js';

test('HTTP rejects coercion, extras, duplicates and removed endpoints; actor is JWT identity', async () => {
 const saved = AuthMiddleware.verifyJWT;
 AuthMiddleware.verifyJWT = async (r: any) => { r.user = {id: 10}; };
 const calls: any[] = [];
 const app = Fastify();
 app.decorate('permissionAuthorizer', {authorize: async (...args: any[]) => {calls.push(args);}});
 await app.register(permissionRouter, {prefix: '/permissions', runtime: {
  catalog: async () => ({permission: [], count: 0}), list: async () => ({permission: [], count: 0}),
  effective: async () => [], update: async (...args: any[]) => { calls.push(args); return {role_id: 2, changes: []}; },
 }} as any);
 try {
  for (const payload of [
   {permissions: [{permission_action_id: 1, allowed: 'false'}]},
   {permissions: [{permission_action_id: 1, allowed: true, user_id: 1}]},
   {permissions: [{permission_action_id: 1, allowed: true}], role_id: 2},
   {permissions: [{permission_action_id: 1, allowed: true}, {permission_action_id: 1, allowed: false}]},
   {permissions: []},
   {permissions: Array.from({length:101}, (_,index) => ({permission_action_id:index+1,allowed:true}))},
   {permissions: [{permission_action_id: "1", allowed: true}]},
   {permissions: [{permission_action_id: 0, allowed: true}]},
  ]) assert.equal((await app.inject({method: 'PUT', url: '/permissions/role/2', payload})).statusCode, 400);
  assert.equal((await app.inject({method: 'PUT', url: '/permissions/role/2', payload: {permissions: [{permission_action_id: 1, allowed: false}]}})).statusCode,204);
  assert.deepEqual(calls.at(-1), [10, 2, [{permission_action_id: 1, allowed: false}]]);
  assert.equal((await app.inject('/permissions/me?user_id=2')).statusCode,400);
  assert.equal((await app.inject('/permissions/1')).statusCode,404);
  assert.equal((await app.inject({method:'PUT',url:'/permissions/1',payload:{}})).statusCode,404);
  assert.equal((await app.inject('/permissions/user/2')).statusCode,404);
 } finally { await app.close(); AuthMiddleware.verifyJWT = saved; }
});

test('HTTP catalog/list/me contracts are paginated, role-scoped and audited only for actual changes', async () => {
 const {EventBusAdapter} = await import('../../../../infra/event/event-bus.adapter.js');
 const {PERMISSION_EVENTS} = await import('../../application/events/permission.events.js');
 const saved = AuthMiddleware.verifyJWT;
 AuthMiddleware.verifyJWT = async (r: any) => { r.user = {id: 10,role_id:2,setor_id:4}; };
 const events: any[] = [];
 const bus = new EventBusAdapter<any>();
 const unsubscribe = bus.subscribe(PERMISSION_EVENTS.updated, async event => {events.push(event);});
 const app = Fastify();
 const queries: any[] = [];
 let changes: any[] = [];
 app.decorate('permissionAuthorizer', {authorize: async () => {}});
 await app.register(permissionRouter, {prefix:'/permissions',runtime:{
  catalog: async query => {queries.push(query);return {permission:[{id:4,service_id:6,module:'ft',action:'remover_bolsista'}],count:3};},
  list: async query => {queries.push(query);return {permission:[{permission_action_id:4,role_id:query.role_id,service_id:6,module:'ft',action:'remover_bolsista',allowed:false}],count:3};},
  effective: async userId => {assert.equal(userId,10);return [{service_id:6,module:'ft',actions:['acessar']}];},
  update: async () => ({role_id:2,changes}),
 }});
 try {
  const catalog = await app.inject('/permissions/catalog?service_id=6&page=1&limit=2');
  assert.equal(catalog.statusCode,200);assert.equal(catalog.json().count,3);
  assert.deepEqual(queries.at(-1),{service_id:6,page:1,limit:2});
  const grants = await app.inject('/permissions?role_id=2&service_id=6');
  assert.equal(grants.statusCode,200);assert.equal(grants.json().permission[0].allowed,false);
  assert.deepEqual(queries.at(-1),{role_id:2,service_id:6,page:0,limit:25});
  const me = await app.inject('/permissions/me');
  assert.deepEqual(me.json(),{permissions:[{service_id:6,module:'ft',actions:['acessar']}],ok:true});
  for(const path of ['/permissions','/permissions?role_id=0','/permissions?role_id=2&limit=101','/permissions/catalog?page=-1','/permissions/catalog?service_id=1.5','/permissions/catalog?user_id=2'])
    assert.equal((await app.inject(path)).statusCode,400,path);
  const payload={permissions:[{permission_action_id:4,allowed:true}]};
  assert.equal((await app.inject({method:'PUT',url:'/permissions/role/2',payload})).statusCode,204);
  assert.equal(events.length,0);
  changes=[{permission_action_id:4,before:false,after:true}];
  assert.equal((await app.inject({method:'PUT',url:'/permissions/role/2',payload})).statusCode,204);
  assert.equal(events.length,1);assert.equal(events[0].context.actor.id,10);
  assert.deepEqual(events[0].after,{id:2,role_id:2,permissions:[{permission_action_id:4,allowed:true}]});
 } finally {unsubscribe();await app.close();AuthMiddleware.verifyJWT=saved;}
});
