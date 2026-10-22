import assert from 'node:assert/strict';
import test from 'node:test';
import Fastify from 'fastify';
import AuthMiddleware from '../../../auth/auth.middleware.js';
import serviceRouter from './services.router.js';

test('service creation/deletion are absent; metadata PUT rejects legacy grants and immutable key', async () => {
 const saved = AuthMiddleware.verifyJWT;
 AuthMiddleware.verifyJWT = async (r: any) => { r.user = {id: 10}; };
 const app = Fastify();
 app.decorate('permissionAuthorizer', {authorize: async () => {}});
 await app.register(serviceRouter, {prefix:'/service',controller: new Proxy({}, {get: () => async () => ({ok:true})}) as any});
 try {
  assert.equal((await app.inject({method:'POST',url:'/service',payload:{}})).statusCode,404);
  assert.equal((await app.inject({method:'DELETE',url:'/service/6'})).statusCode,404);
  for (const extra of [{permissions:[]},{module_key:'ft'}]) {
   const response = await app.inject({method:'PUT',url:'/service/6',payload:{service:{name:'FT',description:'FT',url:'/ft'},...extra}});
   assert.equal(response.statusCode,400);
  }
 } finally {await app.close(); AuthMiddleware.verifyJWT = saved;}
});
