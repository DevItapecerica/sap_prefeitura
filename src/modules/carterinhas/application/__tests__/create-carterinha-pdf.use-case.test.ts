import test from "node:test";
import assert from "node:assert/strict";
import CreateCarterinhaPdfUseCase from "../use-case/createCarterinhaPdf.use-case.js";
import AppError from "../../../../core/appError.js";

test("CreateCarterinhaPdfUseCase envia payload para API PDF", async () => {
  const calls: any[] = [];
  const httpClient = {
    post: async (url: string, payload: any) => {
      calls.push({ url, payload });
      return { data: { id: "pdf-1" } };
    },
  };
  const useCase = new CreateCarterinhaPdfUseCase(
    "http://pdf.local/api/v1/",
    httpClient as any,
  );

  await useCase.execute({
    name: "carteirinha-maria-esporte",
    modelType: "esporte",
    entityData: {
      name: "Maria - esporte",
      identidade: "123",
      modalidade: "Futebol",
      nascimento: "2000-01-01",
      endereco: "Rua",
      numero: "1",
      bairro: "Centro",
      cep: "06850000",
    },
  });

  assert.equal(calls[0].url, "http://pdf.local/api/v1/pdf");
  assert.equal(calls[0].payload.modelType, "esporte");
  assert.equal(calls[0].payload.entityData.modalidade, "Futebol");
});

test("CreateCarterinhaPdfUseCase mapeia indisponibilidade da API PDF", async () => {
  const useCase = new CreateCarterinhaPdfUseCase("http://pdf.local/api/v1", {
    post: async () => {
      throw new Error("offline");
    },
  } as any);

  await assert.rejects(
    () =>
      useCase.execute({
        name: "carteirinha-maria-esporte",
        modelType: "esporte",
        entityData: {
          name: "Maria - esporte",
          identidade: "123",
          modalidade: "Futebol",
        },
      }),
    (error: AppError) => error.code === "PDF_SERVICE_UNAVAILABLE",
  );
});
