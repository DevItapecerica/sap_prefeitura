import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import UserService from "../use-case/user.use-case.js";
import { User } from "../../domain/entity/User.js";
import { EmailPolicyService } from "../../domain/services/email-policy.service.js";
import AppError from "../../../../core/appError.js";

const logger = { info() {} };

class FakeUserRepository {
  users = new Map<number, User>();
  duplicatedEmail = false;
  lastQuery: any;

  async getAllUser(query: any) {
    this.lastQuery = query;
    return { user: [...this.users.values()], count: this.users.size };
  }

  async getUserById(id: number) {
    return this.users.get(id) ?? null;
  }

  async getUserByEmail(email: string, excludeId?: number) {
    if (this.duplicatedEmail) return new User("Duplicado", email, "1", 1, 1, 99);
    return [...this.users.values()].find((user) => user.email === email && user.id !== excludeId) ?? null;
  }

  async createUser(data: any, password: string) {
    const user = new User(data.name, data.email, data.ramal, data.setor_id, data.role_id, 1, false, password);
    this.users.set(1, user);
    return user;
  }

  async updateUser(id: number, data: any) {
    const current = this.users.get(id)!;
    const updated = new User(data.name, data.email, data.ramal, data.setor_id, data.role_id, id, current.firstLogin, current.password);
    this.users.set(id, updated);
    return updated;
  }

  async alterarUserSenha(id: number, password: string) {
    const user = this.users.get(id)!;
    user.password = password;
    return true;
  }

  async deleteUser(id: number) {
    return this.users.delete(id);
  }
}

function makeService(repo = new FakeUserRepository()) {
  return {
    repo,
    service: new UserService(repo as any, new EmailPolicyService(), logger),
  };
}

test("EmailPolicyService aceita dominios institucionais", () => {
  const policy = new EmailPolicyService();

  assert.equal(policy.isInstitutional("user@itapecerica.sp.gov.br"), true);
  assert.equal(policy.isInstitutional("USER@ITAPECERICA.GOV.BR"), true);
  assert.equal(policy.isInstitutional("user@gmail.com"), false);
});

test("UserService rejeita email duplicado, invalido e nao institucional no cadastro", async () => {
  const { repo, service } = makeService();
  repo.duplicatedEmail = true;

  await assert.rejects(
    () => service.cadastrar({ name: "User", email: "user@itapecerica.sp.gov.br", ramal: "1", setor_id: 1, role_id: 1 }),
    (error: AppError) => error.code === "USER_EMAIL_EXISTS",
  );

  repo.duplicatedEmail = false;
  await assert.rejects(
    () => service.cadastrar({ name: "User", email: "email-invalido", ramal: "1", setor_id: 1, role_id: 1 }),
    (error: AppError) => error.code === "USER_EMAIL_INVALID",
  );

  await assert.rejects(
    () => service.cadastrar({ name: "User", email: "user@gmail.com", ramal: "1", setor_id: 1, role_id: 1 }),
    (error: AppError) => error.code === "USER_EMAIL_INSTITUTIONAL",
  );
});

test("UserService busca, pagina e ordena usuarios", async () => {
  const { repo, service } = makeService();
  repo.users.set(1, new User("User", "user@itapecerica.sp.gov.br", "1", 1, 1, 1));

  const user = await service.getOne(1);
  const all = await service.getAllByQuery({ page: 2, limit: 5, order: "name:asc" });

  assert.equal(user.id, 1);
  assert.equal(all.count, 1);
  assert.equal(repo.lastQuery.page, 1);
  await assert.rejects(() => service.getOne(99), (error: AppError) => error.code === "USER_NOT_FOUND");
  await assert.rejects(() => service.getAllByQuery({ page: 0 }), (error: AppError) => error.code === "INVALID_PAGE");
  await assert.rejects(() => service.getAllByQuery({ order: "password:desc" }), (error: AppError) => error.code === "INVALID_QUERY_ORDER");
});

test("UserService atualiza e remove usuario existente", async () => {
  const { repo, service } = makeService();
  repo.users.set(1, new User("User", "user@itapecerica.sp.gov.br", "1", 1, 1, 1));

  const updated = await service.update({ name: "Novo", email: "novo@itapecerica.sp.gov.br", ramal: "2", setor_id: 2, role_id: 2 }, 1);
  const deleted = await service.delete(1);

  assert.equal(updated.name, "Novo");
  assert.equal(deleted, true);
  await assert.rejects(() => service.delete(1), (error: AppError) => error.code === "USER_NOT_FOUND");
});

test("UserService valida troca de senha", async () => {
  const { repo, service } = makeService();
  const oldHash = await bcrypt.hash("SenhaAtual1", 4);
  repo.users.set(1, new User("User", "user@itapecerica.sp.gov.br", "1", 1, 1, 1, false, oldHash));

  await assert.rejects(() => service.alterPassword(1, "Errada1", "NovaSenha1"), (error: AppError) => error.code === "USER_PASSWORD_INCORRECT");
  await assert.rejects(() => service.alterPassword(1, "SenhaAtual1", "fraca"), (error: AppError) => error.code === "USER_PASSWORD_WEAK");
  await assert.rejects(() => service.alterPassword(1, "SenhaAtual1", "SenhaAtual1"), (error: AppError) => error.code === "USER_PASSWORD_REUSED");

  assert.equal(await service.alterPassword(1, "SenhaAtual1", "NovaSenha1"), true);
});
