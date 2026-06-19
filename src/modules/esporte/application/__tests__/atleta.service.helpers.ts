import AtletaService from "../use-case/atleta.service.js";
import Atleta from "../../domain/entity/Atleta.js";
import Municipe from "../../../municipe/domain/entity/Municipe.js";
import CarterinhaEsporte from "../../../carterinha-esporte/domain/entity/CarterinhaEsporte.js";
import Modalidade from "../../domain/entity/Modalidade.js";

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
  created: CarterinhaEsporte | null = null;
  query: any = null;
  queryByMunicipe: any = null;
  carterinhas: CarterinhaEsporte[] = [
    new CarterinhaEsporte(
      new Date("2026-01-01"),
      new Date("2028-01-01"),
      "mun-1",
      "Futebol",
      1,
      "cart-1",
    ),
  ];

  async list(query: any) {
    this.query = query;
    return { carterinhas: this.carterinhas, count: this.carterinhas.length };
  }

  async listByMunicipe(query: any) {
    this.queryByMunicipe = query;
    return { carterinhas: this.carterinhas, count: this.carterinhas.length };
  }

  async create(carterinha: CarterinhaEsporte) {
    this.created = carterinha;
    carterinha.uuid = "cart-1";
    return carterinha;
  }

  async findById(id: string) {
    return this.carterinhas.find((carterinha) => carterinha.uuid === id) ?? null;
  }
}

export class FakeModalidadeRepository {
  modalidade: Modalidade | null = new Modalidade("Futebol", "mod-1");

  async findOneModalidade() {
    return this.modalidade;
  }
}

export class FakeCreateCarterinhaEsporteUseCase {
  payload: any = null;
  author: string | number | null = null;

  async execute(payload: any, author: string | number) {
    this.payload = payload;
    this.author = author;
    return new CarterinhaEsporte(
      new Date("2026-01-01"),
      new Date("2028-01-01"),
      payload.municipe_uuid,
      payload.modalidade,
      author,
      "cart-1",
    );
  }
}

export class FakeListCarterinhasEsporteUseCase {
  constructor(private repo: FakeCarterinhaRepository) {}

  async execute(query: any) {
    return this.repo.list(query);
  }
}

export class FakeListCarterinhasEsporteByAtletaUseCase {
  constructor(private repo: FakeCarterinhaRepository) {}

  async execute(query: any) {
    return this.repo.listByMunicipe(query);
  }
}

export class FakeRenderCarterinhaEsportePdfUseCase {
  uuid: string | null = null;

  async execute(uuid: string) {
    this.uuid = uuid;
    return {
      file: Buffer.from("%PDF-"),
      contentType: "application/pdf",
      contentDisposition: `inline; filename="${uuid}.pdf"`,
    };
  }
}

export function makeService() {
  const atletaRepo = new FakeAtletaRepository();
  const municipeRepo = new FakeMunicipeRepository();
  const carterinhaRepo = new FakeCarterinhaRepository();
  const modalidadeRepo = new FakeModalidadeRepository();
  const createCarterinhaUseCase = new FakeCreateCarterinhaEsporteUseCase();
  const listCarterinhasUseCase = new FakeListCarterinhasEsporteUseCase(
    carterinhaRepo,
  );
  const listCarterinhasByAtletaUseCase =
    new FakeListCarterinhasEsporteByAtletaUseCase(carterinhaRepo);
  const renderPdfUseCase = new FakeRenderCarterinhaEsportePdfUseCase();
  const sha = {
    encrypt: async (value: string) => `hash:${value}`,
  };
  const aes = {
    decrypt: async (value: string) => value.replace(/^enc:/, ""),
  };
  return {
    atletaRepo,
    municipeRepo,
    carterinhaRepo,
    modalidadeRepo,
    createCarterinhaUseCase,
    renderPdfUseCase,
    service: new AtletaService(
      atletaRepo as any,
      modalidadeRepo as any,
      municipeRepo as any,
      createCarterinhaUseCase as any,
      listCarterinhasUseCase as any,
      listCarterinhasByAtletaUseCase as any,
      renderPdfUseCase as any,
      sha as any,
      aes as any,
    ),
  };
}
