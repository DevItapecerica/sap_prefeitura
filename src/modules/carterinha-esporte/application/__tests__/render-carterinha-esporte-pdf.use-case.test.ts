import test from "node:test";
import assert from "node:assert/strict";

import Municipe from "../../../municipe/domain/entity/Municipe.js";
import CarterinhaEsporte from "../../domain/entity/CarterinhaEsporte.js";
import CarterinhaEsporteRepository from "../../domain/repositories/carterinha-esporte.repository.js";
import RenderCarterinhaEsportePdfUseCase from "../use-case/render-carterinha-esporte-pdf.use-case.js";
import MunicipeRepository from "../../../municipe/domain/repositories/Municipe.repository.js";

const FOTO_FIXTURE =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w==";

class FakeCarterinhaRepository implements CarterinhaEsporteRepository {
  carterinha = new CarterinhaEsporte(
    new Date("2026-06-19"),
    new Date("2027-06-19"),
    "mun-1",
    "Futebol",
    1,
    "Liberado para treino",
    new Date("2026-12-31"),
    FOTO_FIXTURE,
    "cart-1",
  );

  async list() {
    return { carterinhas: [this.carterinha], count: 1 };
  }

  async listByMunicipe() {
    return { carterinhas: [this.carterinha], count: 1 };
  }

  async create(carterinha: CarterinhaEsporte) {
    return carterinha;
  }

  async findById() {
    return this.carterinha;
  }
}

class FakeMunicipeRepository implements MunicipeRepository {
  municipe = new Municipe(
    "Maria Silva",
    "12345678900",
    "2000-01-02",
    null,
    "Rua Central",
    "Centro",
    "Itapecerica da Serra",
    "SP",
    "06850000",
    "123",
    null,
    1,
    "mun-1",
  );

  async getMunicipe() {
    return { municipe: [this.municipe], count: 1 };
  }

  async createMunicipe() {
    return this.municipe;
  }

  async updateMunicipe() {
    return this.municipe;
  }

  async deleteMunicipe() {
    return true;
  }

  async getMunicipeById() {
    return this.municipe;
  }

  async getMunicipeByCpf() {
    return this.municipe;
  }
}

test("RenderCarterinhaEsportePdfUseCase envia observacao e validade do exame ao PDF", async () => {
  let capturedPayload: any = null;
  const httpClient = {
    post: async (_url: string, payload: any) => {
      capturedPayload = payload;
      return {
        data: Buffer.from("%PDF-1.4"),
        headers: {
          "content-type": "application/pdf",
          "content-disposition": "inline; filename=\"carteirinha.pdf\"",
        },
      };
    },
  };

  const useCase = new RenderCarterinhaEsportePdfUseCase(
    new FakeCarterinhaRepository(),
    new FakeMunicipeRepository(),
    "http://pdf.local/api/v1",
    undefined,
    undefined,
    httpClient as any,
  );

  const response = await useCase.execute("cart-1");

  assert.equal(response.contentType, "application/pdf");
  assert.equal(capturedPayload.entityData.obs, "Liberado para treino");
  assert.equal(capturedPayload.entityData.exame, "2026-12-31");
  assert.equal(capturedPayload.entityData.modalidade, "Futebol");
  assert.equal(capturedPayload.entityData.foto, FOTO_FIXTURE);
});
