import test from "node:test";
import assert from "node:assert/strict";
import Sha256CryptService from "../sha256/sha256.service.js";
import { BcryptService } from "../bcrypt/bcrypt.service.js";
import { RandomPasswordGenerator } from "../password/random-password-generator.service.js";

process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "mariadb://user:pass@localhost:3306/app_prefeitura_test";
process.env.SECRET_KEY ??= "12345678901234567890123456789012";
process.env.MAIL_ADRESS ??= "test@example.com";
process.env.MAIL_PASSWORD ??= "password";
process.env.MAIL_HOST ??= "localhost";
process.env.CORS_ORIGINS ??= "http://localhost:5173";
process.env.APPLICATION_PORT ??= "3000";

test("Sha256CryptService gera hash deterministico e compara valores", async () => {
  const service = new Sha256CryptService();
  const hash = await service.encrypt("12345678900");

  assert.equal(hash.length, 64);
  assert.equal(await service.compare("12345678900", hash), true);
  assert.equal(await service.compare("00000000000", hash), false);
});

test("BcryptService gera hash e compara senha", async () => {
  const service = new BcryptService();
  const hash = await service.hash("SenhaForte1", 4);

  assert.notEqual(hash, "SenhaForte1");
  assert.equal(await service.compare("SenhaForte1", hash), true);
  assert.equal(await service.compare("OutraSenha1", hash), false);
});

test("RandomPasswordGenerator creates an eight-character password", () => {
  assert.equal(new RandomPasswordGenerator().generate().length, 8);
});

test("AesCryptService criptografa e descriptografa dados", async () => {
  const { default: AesCryptService } = await import("../aes/AesCrypt.service.js");
  const service = new AesCryptService();

  const encrypted = await service.encrypt("dado sensivel");
  const decrypted = await service.decrypt(encrypted);

  assert.notEqual(encrypted, "dado sensivel");
  assert.equal(decrypted, "dado sensivel");
});
