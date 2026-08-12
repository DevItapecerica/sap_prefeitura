import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import routes from "../protocolo.routes.js";

async function app() {
  const instance = Fastify({ logger: false });
  await instance.register(routes, { prefix: "/protocolo" });
  await instance.ready();
  return instance;
}

test("rotas públicas rejeitam corpos fora do contrato antes do domínio", async (t) => {
  const instance = await app();
  t.after(() => instance.close());

  const access = await instance.inject({
    method: "POST",
    url: "/protocolo/public/access/request",
    payload: { cpf: "123", email: "nao-e-email", extra: true },
  });
  assert.equal(access.statusCode, 400);

  const opening = await instance.inject({
    method: "POST",
    url: "/protocolo/public/protocols",
    payload: { serviceId: 0, subject: "", answers: {}, unexpected: true },
  });
  assert.equal(opening.statusCode, 400);
});

test("rotas de recursos rejeitam identificadores que não são UUID", async (t) => {
  const instance = await app();
  t.after(() => instance.close());

  const detail = await instance.inject({
    method: "GET",
    url: "/protocolo/public/protocols/nao-e-uuid",
  });
  assert.equal(detail.statusCode, 400);

  const answer = await instance.inject({
    method: "POST",
    url: "/protocolo/public/protocols/nao-e-uuid/requirements/tambem-nao/answer",
    payload: { response: "Complemento" },
  });
  assert.equal(answer.statusCode, 400);
});

test("filtros internos rejeitam estado, datas e parâmetros desconhecidos", async (t) => {
  const instance = await app();
  t.after(() => instance.close());

  const response = await instance.inject({
    method: "GET",
    url: "/protocolo/internal/protocols?state=QUALQUER&from=ontem&extra=1",
  });
  assert.equal(response.statusCode, 400);
});

test("recursos públicos protegidos exigem sessão do cidadão", async (t) => {
  const instance = await app();
  t.after(() => instance.close());

  const list = await instance.inject({ method: "GET", url: "/protocolo/public/protocols" });
  const detail = await instance.inject({
    method: "GET",
    url: "/protocolo/public/protocols/123e4567-e89b-12d3-a456-426614174000",
  });

  assert.equal(list.statusCode, 401);
  assert.equal(detail.statusCode, 401);
});

test("fila interna exige autenticação administrativa", async (t) => {
  const instance = await app();
  t.after(() => instance.close());

  const response = await instance.inject({
    method: "GET",
    url: "/protocolo/internal/protocols?state=EM_TRIAGEM",
  });

  assert.equal(response.statusCode, 401);
});

test("readiness do protocolo confirma o ClamAV real", {
  skip: process.env.CLAMAV_TEST_HOST ? false : "CLAMAV_TEST_HOST nao configurado",
}, async (t) => {
  const instance = await app();
  t.after(() => instance.close());

  const response = await instance.inject({ method: "GET", url: "/protocolo/health/antivirus" });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { ok: true, service: "clamav" });
});
