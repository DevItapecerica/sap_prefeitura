import test from "node:test";
import assert from "node:assert/strict";
import AppError from "../../../../core/appError.js";
import CarterinhaEsporte from "../../domain/entity/CarterinhaEsporte.js";
import CarterinhaEsporteRepository from "../../domain/repositories/carterinha-esporte.repository.js";
import CreateCarterinhaEsporteUseCase from "../use-case/create-carterinha-esporte.use-case.js";

const PNG_FIXTURE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
const SVG_BASE64 = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
).toString("base64");

class FakeCarterinhaRepository implements CarterinhaEsporteRepository {
  created: CarterinhaEsporte | null = null;

  async list() {
    return { carterinhas: [], count: 0 };
  }

  async listByMunicipe() {
    return { carterinhas: [], count: 0 };
  }

  async create(carterinha: CarterinhaEsporte) {
    this.created = carterinha;
    carterinha.uuid = "cart-1";
    return carterinha;
  }

  async findById() {
    return null;
  }
}

test("CreateCarterinhaEsporteUseCase valida e persiste foto normalizada", async () => {
  const repository = new FakeCarterinhaRepository();
  const useCase = new CreateCarterinhaEsporteUseCase(repository);

  const carterinha = await useCase.execute(
    {
      municipe_uuid: "mun-1",
      modalidade: "Futebol",
      foto: PNG_FIXTURE,
    },
    1,
  );

  assert.equal(carterinha.foto, PNG_FIXTURE);
  assert.equal(repository.created?.foto, PNG_FIXTURE);
});

test("CreateCarterinhaEsporteUseCase rejeita SVG puro ou disfarçado", async () => {
  const useCase = new CreateCarterinhaEsporteUseCase(
    new FakeCarterinhaRepository(),
  );

  await assert.rejects(
    () =>
      useCase.execute(
        {
          municipe_uuid: "mun-1",
          modalidade: "Futebol",
          foto: `data:image/svg+xml;base64,${SVG_BASE64}`,
        },
        1,
      ),
    (error: AppError) => error.code === "CARTERINHA_FOTO_INVALID",
  );

  await assert.rejects(
    () =>
      useCase.execute(
        {
          municipe_uuid: "mun-1",
          modalidade: "Futebol",
          foto: `data:image/jpeg;base64,${SVG_BASE64}`,
        },
        1,
      ),
    (error: AppError) => error.code === "CARTERINHA_FOTO_INVALID",
  );
});
