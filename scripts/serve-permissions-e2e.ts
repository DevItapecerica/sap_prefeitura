import { configurePermissionsTestEnvironment } from "./permissions-test-target.js";
import { randomUUID, createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// This runner only serves the synthetic, previously migrated disposable database.
try {
const target = configurePermissionsTestEnvironment();
if (!process.env.PERMISSIONS_E2E_FIXTURE) throw new Error("PERMISSIONS_E2E_FIXTURE output path is required");
const { default: db } = await import("../src/infra/database/sequelize/index.js");
const { default: Fastify } = await import("fastify");
const { default: cookie } = await import("@fastify/cookie");
const { default: jwt } = await import("jsonwebtoken");
const { default: App } = await import("../src/app.js");
const { default: ErrorHook } = await import("../src/core/hooks/ErrorHook.js");
const { default: notFoundHook } = await import("../src/core/hooks/notFoundHook.js");
const { default: rateLimit } = await import("../src/core/plugin/rateLimit.js");
const { default: AesCryptService } = await import("../src/core/security/aes/AesCrypt.service.js");
const { hash } = await import("bcryptjs");
await db.sequelize.authenticate();
const [[state]] = await db.sequelize.query("SELECT completed FROM permission_migration_state WHERE id=1");
if (!state || !state.completed) throw new Error("Disposable database must be migrated and seeded before E2E");
const fixtureName = `e2e_${randomUUID().slice(0, 8)}`;
const roles = await Promise.all(["target", "other"].map(name => db.RolesModel.create({ name: `${fixtureName}_${name}` })));
const [targetRole, otherRole] = roles;
const admin = await db.UserModel.findOne({ where: { email: "permissions@example.invalid" } });
if (!admin) throw new Error("Synthetic bootstrap administrator not found");
const password = await hash(randomUUID(), 4);
const users = [];
for (const [index, role] of [targetRole, targetRole, otherRole].entries()) {
  users.push(await db.UserModel.create({
    name: `Teste de permissões ${index + 1}`, email: `${fixtureName}_${index}@itapecerica.sp.gov.br`, ramal: "0000",
    password, setor_id: admin.get("setor_id"), role_id: role.get("id"), firstLogin: false,
  }));
}
const encrypt = new AesCryptService().encrypt;
const edital = await db.Edital.create({
  name: `${fixtureName}_edital`, data_publicacao: new Date("2026-01-01T12:00:00Z"),
  data_vencimento: new Date("2099-12-31T12:00:00Z"), dia_pagamento: 10, valor_bolsa: 1000, status: "ativo",
});
const pagador = await db.Pagador.create({ nome: `${fixtureName}_pagador`, quantidade: 100 });
const turno = await db.Turno.create({ nome: `${fixtureName}_turno`, hora_inicio: "08:00:00", hora_fim: "12:00:00" });
const bolsistas = [];
for (const [index] of users.entries()) {
  const plaintext = `synthetic_${fixtureName}_${index}`;
  const municipe = await db.MunicipeModel.create({
    nome: await encrypt(`Pessoa sintética ${index + 1}`), cpf: await encrypt(plaintext),
    nascimento: await encrypt("2000-01-01"), telefone: null,
    rua: await encrypt("Endereço sintético"), bairro: await encrypt("Bairro sintético"),
    cidade: await encrypt("Cidade sintética"), uf: await encrypt("SP"), cep: await encrypt("00000000"),
    numero: await encrypt("0"), author: String(admin.get("id")),
    cpfHash: createHash("sha256").update(plaintext).digest("hex"),
    cepHash: createHash("sha256").update("00000000").digest("hex"),
  });
  const bolsista = await db.Bolsistas.create({ municipe_uuid: municipe.get("uuid") });
  await db.BolsistasEdital.create({
    bolsista_id: bolsista.get("id"), edital_id: edital.get("id"), local: "Local sintético",
    pagador_id: pagador.get("uuid"), turno_id: turno.get("uuid"), status: "ativo", data_vinculo: new Date("2026-01-01T12:00:00Z"), expire_at: new Date("2099-12-31T12:00:00Z"),
  });
  bolsistas.push(bolsista);
}
const ftActions = await db.PermissionActionModel.findAll({ where: { module_key: "ft" } });
for (const action of ftActions) {
  await db.RolePermissionsModel.create({ role_id: targetRole.get("id"), permission_action_id: action.get("id"), allowed: ["acessar", "consultar_bolsista", "consultar_edital", "consultar_vinculos"].includes(String(action.get("action"))) });
}
const token = (user: any) => jwt.sign({ id: user.get("id"), role_id: user.get("role_id"), setor_id: user.get("setor_id"), name: user.get("name") }, process.env.SECRET_KEY!, { expiresIn: "1h" });
const fixture = {
  database: target.pathname.slice(1), apiUrl: "http://127.0.0.1:3099/api/v2", targetRoleId: targetRole.get("id"),
  otherRoleId: otherRole.get("id"), manager: { id: admin.get("id"), token: token(admin) },
  targetUsers: users.slice(0, 2).map((user, index) => ({ id: user.get("id"), token: token(user), bolsistaId: bolsistas[index].get("id"), profile: { name: user.get("name"), email: user.get("email"), ramal: "0000", setor_id: user.get("setor_id"), role_id: user.get("role_id") } })),
  otherRoleUser: { id: users[2].get("id"), token: token(users[2]), bolsistaId: bolsistas[2].get("id") },
  editalId: edital.get("id"), editBolsistaId: bolsistas[2].get("id"), pagadorId: pagador.get("uuid"), turnoId: turno.get("uuid"),
};
const app = Fastify({ logger: false });
await app.register(cookie);
await app.register(rateLimit);
await app.register(ErrorHook);
await app.register(notFoundHook);
app.get("/api/v2/__permissions-test", async () => ({ disposable: true, database: target.pathname.slice(1) }));
await app.register(App, { prefix: "/api/v2", runtimeWorkers: false });
await app.listen({ host: "127.0.0.1", port: 3099 });
await writeFile(resolve(process.env.PERMISSIONS_E2E_FIXTURE), `${JSON.stringify(fixture, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
console.log("PERMISSIONS_E2E_READY: isolated synthetic API on loopback:3099; fixture credentials not logged");
for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, async () => { await app.close(); await db.sequelize.close(); process.exit(0); });
} catch (error) {
  const message = error instanceof Error && error.message.startsWith("PERMISSIONS_TEST_TARGET_REFUSED") ? error.message : `PERMISSIONS_E2E_SETUP_FAILED: ${error instanceof Error ? error.name : "UnknownError"}`;
  console.error(message);
  if (error instanceof Error) for (const frame of (error.stack ?? '').split('\n').filter(line => /^\s+at /.test(line))) console.error(frame);
  process.exit(1);
}
