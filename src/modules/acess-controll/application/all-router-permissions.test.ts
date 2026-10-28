import assert from 'node:assert/strict';
import test from 'node:test';
import Fastify from 'fastify';
import AppError from '../../../core/appError.js';
import AuthMiddleware from '../../auth/auth.middleware.js';
import { PERMISSION_CATALOG } from '../domain/permission-catalog.js';
import { AuthorizationUseCase } from './authorization.usecase.js';

test('every actual business router declares a known explicit guard, JWT runs first, and actions are isolated', async () => {
 const routers = [
  ['../../user/interface/routes/user.routes.js','default'],
  ['../../setor/interface/router/setor.router.js','default'],
  ['../../roles/interface/routes/roles.router.js','default'],
  ['../../services/interface/router/services.router.js','default'],
  ['../../permission/interface/routes/permission.router.js','default'],
  ['../../ft-bolsista/interface/router/frente-de-trabalho-bolsista.router.js','FrenteTrabalhoBolsistaRouter'],
  ['../../ft-edital/interface/router/ft-edital.router.js','FtEditalRouter'],
  ['../../ft-relatorio/interface/router/ft-relatorio.router.js','FtRelatorioRouter'],
  ['../../ft-pagador/pagador.router.js','PagadorRouter'],
  ['../../ft-turno/turno.router.js','TurnoRouter'],
  ['../../espelho-ponto/interface/router/espelho-ponto.router.js','EspelhoPontoRouter'],
  ['../../municipe/interface/routes/municipe.router.js','default'],
  ['../../esporte/interface/router/atleta.router.js','AtletaRouter'],
  ['../../esporte/interface/router/modalidade.router.js','ModalidadeRouter'],
  ['../../audit/interface/audit.routes.js','AuditRoutes'],
 ];
 const saved = AuthMiddleware.verifyJWT;
 let authenticated = false;
 let grants: string[] = [];
 const authorizer = new AuthorizationUseCase({user: async () => {
   assert.equal(authenticated,true,'JWT must run before authorization');
   return {role_id: 2,setor_id: 4};
 }, roleExists: async () => true, service: async module => ({id:6,module}), visible: async () => true, actions: async () => grants});
 AuthMiddleware.verifyJWT = async (request: any) => {authenticated = true; request.user = {id:10};};
 const app = Fastify({exposeHeadRoutes:false});
 app.decorate('permissionAuthorizer',authorizer);
 const routes: {method: any; url: string; permission?: {module:string;action:string}; permissions?: {module:string;action:string}[]}[] = [];
 let invoked = 0;
 app.addHook('onRoute', route => {
  const guards = Array.isArray(route.preHandler) ? route.preHandler : [route.preHandler];
  const permission = guards.find((guard:any) => guard?.permission) as any;
  routes.push({method:route.method,url:route.url,permission:permission?.permission,permissions:guards.filter((g:any) => g?.permission).map((g:any) => g.permission)});
  // Keep real router registration and hook chain; business effects are outside this authorization test.
  route.schema = undefined;
  route.preValidation = undefined;
  route.handler = async () => {invoked++; return {ok:true};};
 });
 try {
  for (let index=0;index<routers.length;index++) {
   const [path,name] = routers[index];
   const module = await import(path);
   assert.equal(typeof module[name],'function',path);
   await app.register(module[name],{prefix:`/r${index}`,controller: new Proxy({}, {get: () => async () => ({ok:true})})});
  }
  await app.ready();
  assert.ok(routes.length > 80);
  for (const route of routes) {
   const own = route.url === '/r3/user' || route.url === '/r4/me';
   assert.equal(Boolean(route.permission),!own,`${route.method} ${route.url}`);
   if (own) continue;
   for (const required of route.permissions!) assert.ok(PERMISSION_CATALOG.some(p => p.module === required.module && p.action === required.action),JSON.stringify(required));
   const url = route.url.replace(/:[^/]+/g,'00000000-0000-4000-8000-000000000001');
   grants = ['acessar']; authenticated=false;
   const denied = await app.inject({method:route.method,url});
   assert.equal(denied.statusCode,403,`${route.method} ${route.url}: ${denied.body}`);
   for (const missing of route.permissions!) {
    if (route.permissions!.length < 2) break;
    grants = ['acessar', ...route.permissions!.filter(p => p !== missing).map(p => p.action)]; authenticated=false;
    assert.equal((await app.inject({method:route.method,url})).statusCode,403,`missing ${missing.action}`);
   }
   grants = ['acessar',...route.permissions!.map(p => p.action)]; authenticated=false;
   const allowed = await app.inject({method:route.method,url});
   assert.equal(allowed.statusCode,200,`${route.method} ${route.url}: ${allowed.body}`);
  }
  assert.equal(invoked,routes.filter(route => route.permission).length);
 } finally {await app.close(); AuthMiddleware.verifyJWT=saved;}
});
