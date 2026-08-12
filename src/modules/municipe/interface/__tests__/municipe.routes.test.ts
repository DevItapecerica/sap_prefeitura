import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import MunicipeRouter from "../routes/municipe.router.js";

async function app() {
  const instance = Fastify({ logger: false });
  await instance.register(MunicipeRouter, { prefix: "/municipes" });
  await instance.ready();
  return instance;
}

test("contrato de municipe rejeita documentos malformados e campos desconhecidos", async (t) => {
  const instance = await app();
  t.after(() => instance.close());

  const create = await instance.inject({
    method: "POST",
    url: "/municipes/",
    payload: {
      nome: "Maria Silva",
      cpf: "123",
      nascimento: "2000-01-01",
      rua: "Rua A",
      bairro: "Centro",
      cidade: "Itapecerica da Serra",
      uf: "SP",
      cep: "06850000",
      numero: "10",
    },
  });
  assert.equal(create.statusCode, 400);

  const update = await instance.inject({
    method: "PUT",
    url: "/municipes/123e4567-e89b-12d3-a456-426614174000",
    payload: { campoInterno: "nao permitido" },
  });
  assert.equal(update.statusCode, 400);
});

test("contrato de municipe rejeita UUID, paginacao e ordenacao invalidos", async (t) => {
  const instance = await app();
  t.after(() => instance.close());

  const detail = await instance.inject({ method: "GET", url: "/municipes/nao-e-uuid" });
  const limit = await instance.inject({ method: "GET", url: "/municipes/?limit=101" });
  const order = await instance.inject({ method: "GET", url: "/municipes/?order=cpfHash:desc" });

  assert.equal(detail.statusCode, 400);
  assert.equal(limit.statusCode, 400);
  assert.equal(order.statusCode, 400);
});
