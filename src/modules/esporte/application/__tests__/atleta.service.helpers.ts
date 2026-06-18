import AtletaService from "../use-case/atleta.service.js";
import Atleta from "../../domain/entity/Atleta.js";
import Municipe from "../../../municipe/domain/entity/Municipe.js";
import Carterinha from "../../../carterinhas/domain/entity/Carteirinha.js";
import Modalidade from "../../domain/entity/Modalidade.js";
import AppError from "../../../../core/appError.js";
import CreateCarterinhaUseCase from "../../../carterinhas/application/use-case/createCarterinha.use-case.js";

export class FakeAtletaRepository {
  atletas = new Map<string, Atleta>();
  activeByMunicipe: Atleta | null = null;
  lastQuery: any = null;

  async createAtleta(atleta: Atleta) {
    atleta.uuid = "atl-1";
    this.atletas.set("atl-1", atleta);
    return atleta;
  }

  async findAllAtletas(query?: any) {
    this.lastQuery = query;
    return { atletas: [...this.atletas.values()], count: this.atletas.size };
  }

  async findOneAtleta(uuid: string) {
    return this.atletas.get(uuid) ?? null;
  }

  async findActiveByMunicipe() {
    return this.activeByMunicipe;
  }

  async addModalidadeToAtleta(atleta_uuid: string, modalidade_uuid: string) {
    const atleta = this.atletas.get(atleta_uuid);
    if (!atleta) return null;
    if (
      atleta.modalidades?.some(
        (modalidade) => modalidade.uuid === modalidade_uuid,
      )
    ) {
      return null;
    }

    atleta.modalidades = [
      ...(atleta.modalidades || []),
      new Modalidade("Futebol", modalidade_uuid),
    ];
    return { restored: false };
  }

  async updateAtleta(uuid: string, data: any) {
    const atleta = this.atletas.get(uuid);
    if (!atleta) return null;
    Object.assign(atleta, data);
    return atleta;
  }

  async deleteAtleta(uuid: string) {
    return this.atletas.delete(uuid);
  }
}

export class FakeMunicipeRepository {
  municipe: Municipe | null = new Municipe(
    "Maria",
    "123",
    "2000-01-01",
    null,
    "Rua",
    "Bairro",
    "Cidade",
    "SP",
    "00000",
    "1",
    null,
    1,
    "mun-1",
  );

  async getMunicipeById() {
    return this.municipe;
  }
}

export class FakeCarterinhaRepository {
  created: Carterinha | null = null;
  query: any = null;
  queryByMunicipe: any = null;
  carterinhas: Carterinha[] = [
    new Carterinha(
      new Date("2026-01-01"),
      new Date("2028-01-01"),
      "esporte",
      null,
      "mun-1",
      1,
      "cart-1",
    ),
  ];

  async getCarterinhas(query: any) {
    this.query = query;
    return { carterinhas: this.carterinhas, count: this.carterinhas.length };
  }

  async getCarterinhasByMunicipe(query: any) {
    this.queryByMunicipe = query;
    return { carterinhas: this.carterinhas, count: this.carterinhas.length };
  }

  async postCarterinhas(carterinha: Carterinha) {
    this.created = carterinha;
    carterinha.uuid = "cart-1";
    return carterinha;
  }
}

export class FakeModalidadeRepository {
  modalidade: Modalidade | null = new Modalidade("Futebol", "mod-1");

  async findOneModalidade() {
    return this.modalidade;
  }
}

export class FakeCreateCarterinhaPdfUseCase {
  payload: any = null;
  shouldFail = false;

  async execute(payload: any) {
    if (this.shouldFail) {
      throw new AppError(
        "PDF service unavailable",
        502,
        "PDF_SERVICE_UNAVAILABLE",
      );
    }

    this.payload = payload;
  }
}

export function makeService() {
  const atletaRepo = new FakeAtletaRepository();
  const municipeRepo = new FakeMunicipeRepository();
  const carterinhaRepo = new FakeCarterinhaRepository();
  const modalidadeRepo = new FakeModalidadeRepository();
  const pdfUseCase = new FakeCreateCarterinhaPdfUseCase();
  const sha = {
    encrypt: async (value: string) => `hash:${value}`,
  };
  const aes = {
    decrypt: async (value: string) => value.replace(/^enc:/, ""),
  };
  const createCarterinhaUseCase = new CreateCarterinhaUseCase(
    municipeRepo as any,
    carterinhaRepo as any,
    pdfUseCase as any,
    aes as any,
    sha as any,
  );
  return {
    atletaRepo,
    municipeRepo,
    carterinhaRepo,
    modalidadeRepo,
    pdfUseCase,
    service: new AtletaService(
      atletaRepo as any,
      modalidadeRepo as any,
      municipeRepo as any,
      carterinhaRepo as any,
      createCarterinhaUseCase as any,
      sha as any,
      aes as any,
    ),
  };
}
