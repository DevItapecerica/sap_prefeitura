import test from "node:test";
import assert from "node:assert/strict";
import { ChamadoService } from "../use-case/chamado.service.js";
import { Chamado, ChamadoPrioridade, ChamadoStatus, ChamadoTipo } from "../../domain/entity/Chamado.js";
import { User } from "../../../user/domain/entity/User.js";
import { Setor } from "../../../setor/domain/entity/Setor.js";
import AppError from "../../../../core/appError.js";

const logger = { info() {} };

class FakeChamadoRepository {
  chamados = new Map<string, Chamado>();

  async findOneChamado(id: string) {
    return this.chamados.get(id) ?? null;
  }

  async findAllChamado() {
    return [...this.chamados.values()];
  }

  async createChamado(chamado: Chamado) {
    this.chamados.set(chamado.id, chamado);
    return chamado;
  }

  async updateChamado(id: string, data: Partial<Chamado>) {
    const chamado = this.chamados.get(id);
    if (!chamado) return null;
    Object.assign(chamado, data);
    return chamado;
  }

  async deleteChamado(id: string) {
    return this.chamados.delete(id);
  }
}

class FakeUserRepository {
  users = new Map<number, User>([[1, new User("User", "user@itapecerica.sp.gov.br", "1", 1, 1, 1)]]);

  async getUserById(id: number) {
    return this.users.get(id) ?? null;
  }
}

class FakeSetorRepository {
  setores = new Map<number, Setor>([[1, new Setor(1, "TI", "Tecnologia")]]);

  async findOneSetor(id: number) {
    return this.setores.get(id) ?? null;
  }
}

function makeService() {
  const chamadoRepo = new FakeChamadoRepository();
  const userRepo = new FakeUserRepository();
  const setorRepo = new FakeSetorRepository();
  return {
    chamadoRepo,
    userRepo,
    setorRepo,
    service: new ChamadoService(chamadoRepo as any, userRepo as any, setorRepo as any, logger),
  };
}

function createPayload() {
  return {
    patrimonio: "PC-001",
    tipo: ChamadoTipo.SUPORTE,
    setorId: 1,
    solicitanteId: 1,
    descricao: "Computador nao liga",
    prioridade: ChamadoPrioridade.MEDIA,
  };
}

test("ChamadoService cria chamado e valida setor/solicitante", async () => {
  const { service, setorRepo, userRepo } = makeService();

  const chamado = await service.createChamado(createPayload());
  assert.equal(chamado.status, ChamadoStatus.ABERTO);

  setorRepo.setores.clear();
  await assert.rejects(() => service.createChamado(createPayload()), (error: AppError) => error.code === "SETOR_NOT_FOUND");

  setorRepo.setores.set(1, new Setor(1, "TI", "Tecnologia"));
  userRepo.users.clear();
  await assert.rejects(() => service.createChamado(createPayload()), (error: AppError) => error.code === "SOLICITANTE_NOT_FOUND");
});

test("ChamadoService busca, atualiza, atribui e remove chamado", async () => {
  const { service, chamadoRepo } = makeService();
  const chamado = await service.createChamado(createPayload());

  assert.equal((await service.findOneChamado(chamado.id)).id, chamado.id);
  assert.equal((await service.updateChamado(chamado.id, { status: ChamadoStatus.RESOLVIDO })).status, ChamadoStatus.RESOLVIDO);
  await assert.rejects(() => service.updateChamado(chamado.id, { observacoes: "Nao pode" }), (error: AppError) => error.code === "CHAMADO_FINALIZADO");

  const outro = await service.createChamado({ ...createPayload(), solicitanteId: null });
  assert.equal((await service.assignResponsavel(outro.id, 1)).status, ChamadoStatus.EM_PROGRESSO);
  assert.equal(await service.deleteChamado(outro.id), true);
  await assert.rejects(() => service.findOneChamado(outro.id), (error: AppError) => error.code === "CHAMADO_NOT_FOUND");

  chamadoRepo.chamados.clear();
  await assert.rejects(() => service.deleteChamado("missing"), (error: AppError) => error.code === "CHAMADO_NOT_FOUND");
});

test("ChamadoService gera relatorio de tempo medio", async () => {
  const { service, chamadoRepo } = makeService();
  chamadoRepo.chamados.set(
    "c1",
    new Chamado("c1", "PC-001", ChamadoStatus.RESOLVIDO, ChamadoTipo.SUPORTE, new Date("2026-01-01T00:00:00.000Z"), 1, 1, "Resolvido", ChamadoPrioridade.MEDIA, 1, null, new Date("2026-01-02T00:00:00.000Z")),
  );

  const report = await service.getAverageTimeReport({ year: 2026, period: "mensal" } as any);

  assert.equal(report.totalChamados, 1);
  assert.equal(report.tempoMedioHoras, 24);
});
