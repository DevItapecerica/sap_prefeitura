import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";

process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "mariadb://user:pass@localhost:3306/app_prefeitura_test";
process.env.SECRET_KEY ??= "12345678901234567890123456789012";
process.env.MAIL_ADRESS ??= "test@example.com";
process.env.MAIL_PASSWORD ??= "password";
process.env.MAIL_HOST ??= "localhost";
process.env.CORS_ORIGINS ??= "http://localhost:5173";
process.env.APPLICATION_PORT ??= "3000";

const logger = { info() {} };

async function verify(headers: Record<string, string> = {}, query: Record<string, string> = {}) {
  const { default: AuthMiddleware } = await import("../auth.middleware.js");
  const request = { headers, query, log: logger } as any;

  await AuthMiddleware.verifyJWT(request, {} as any);

  return request.user;
}

function validToken() {
  return jwt.sign(
    { id: 1, name: "User", role_id: 1, setor_id: 1 },
    process.env.SECRET_KEY!,
    { expiresIn: "5m" },
  );
}

test("AuthMiddleware aceita JWT válido somente no header Bearer", async () => {
  const user = await verify({ authorization: `Bearer ${validToken()}` });

  assert.equal(user.id, 1);
});

test("AuthMiddleware rejeita header ausente", async () => {
  await assert.rejects(() => verify(), (error: any) => {
    assert.equal(error.statusCode, 401);
    assert.equal(error.message, "Token não enviado");
    return true;
  });
});

for (const authorization of ["token", "Bearer", "Bearer ", "Basic token", "bearer token", "Bearer token extra"]) {
  test(`AuthMiddleware rejeita header malformado: ${JSON.stringify(authorization)}`, async () => {
    await assert.rejects(() => verify({ authorization }), (error: any) => {
      assert.equal(error.statusCode, 401);
      assert.equal(error.message, "Token inválido");
      return true;
    });
  });
}

test("AuthMiddleware rejeita JWT inválido", async () => {
  await assert.rejects(() => verify({ authorization: "Bearer token-invalido" }), (error: any) => {
    assert.equal(error.statusCode, 401);
    assert.equal(error.message, "Token inválido");
    return true;
  });
});

test("AuthMiddleware ignora token válido enviado somente na query", async () => {
  await assert.rejects(() => verify({}, { token: validToken() }), (error: any) => {
    assert.equal(error.statusCode, 401);
    assert.equal(error.message, "Token não enviado");
    return true;
  });
});

test("AuthMiddleware usa o header válido sem consultar a query", async () => {
  const user = await verify(
    { authorization: `Bearer ${validToken()}` },
    { token: "token-invalido" },
  );

  assert.equal(user.id, 1);
});
