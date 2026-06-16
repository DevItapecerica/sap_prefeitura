import test from "node:test";
import assert from "node:assert/strict";
import GetCarterinhaPdfUseCase from "../use-case/getCarterinhaPdf.use-case.js";
import AppError from "../../../../core/appError.js";

test("GetCarterinhaPdfUseCase busca PDF na API PDF e preserva headers", async () => {
  const client = {
    get: async (url: string, options: any) => {
      assert.equal(url, "http://pdf.local/api/v1/pdf/pdf-1");
      assert.equal(options.responseType, "arraybuffer");

      return {
        data: Buffer.from("%PDF-test"),
        headers: {
          "content-type": "application/pdf",
          "content-disposition": 'inline; filename="carteirinha.pdf"',
          "content-length": "9",
        },
      };
    },
  };

  const useCase = new GetCarterinhaPdfUseCase(
    "http://pdf.local/api/v1/",
    client as any,
  );

  const response = await useCase.execute("pdf-1");

  assert.equal(response.file.toString(), "%PDF-test");
  assert.equal(response.contentType, "application/pdf");
  assert.equal(response.contentDisposition, 'inline; filename="carteirinha.pdf"');
  assert.equal(response.contentLength, "9");
});

test("GetCarterinhaPdfUseCase mapeia erro 404 da API PDF", async () => {
  const client = {
    get: async () => {
      throw { response: { status: 404 } };
    },
  };

  const useCase = new GetCarterinhaPdfUseCase(
    "http://pdf.local/api/v1",
    client as any,
  );

  await assert.rejects(
    () => useCase.execute("missing"),
    (error: AppError) => error.code === "PDF_NOT_FOUND",
  );
});

test("GetCarterinhaPdfUseCase rejeita uuid vazio e indisponibilidade", async () => {
  const useCase = new GetCarterinhaPdfUseCase("http://pdf.local/api/v1", {
    get: async () => {
      throw new Error("network");
    },
  } as any);

  await assert.rejects(
    () => useCase.execute(""),
    (error: AppError) => error.code === "PDF_UUID_REQUIRED",
  );

  await assert.rejects(
    () => useCase.execute("pdf-1"),
    (error: AppError) => error.code === "PDF_SERVICE_UNAVAILABLE",
  );
});
