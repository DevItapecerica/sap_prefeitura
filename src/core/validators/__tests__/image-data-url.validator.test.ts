import test from "node:test";
import assert from "node:assert/strict";
import AppError from "../../appError.js";
import { validateImageDataUrl } from "../image-data-url.validator.js";

const PNG_FIXTURE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
const SVG_BASE64 = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
).toString("base64");

test("validateImageDataUrl valida e normaliza data URL de imagem", () => {
  assert.equal(
    validateImageDataUrl(PNG_FIXTURE, {
      required: true,
      minSizeInBytes: 32,
      maxSizeInBytes: 1024,
      allowedMimeTypes: ["image/png"],
      errorCodePrefix: "FOTO",
    }),
    PNG_FIXTURE,
  );
});

test("validateImageDataUrl rejeita imagem obrigatoria ausente", () => {
  assert.throws(
    () =>
      validateImageDataUrl(null, {
        required: true,
        errorCodePrefix: "FOTO",
      }),
    (error: AppError) => error.code === "FOTO_REQUIRED",
  );
});

test("validateImageDataUrl rejeita tipo ou base64 invalidos", () => {
  assert.throws(
    () =>
      validateImageDataUrl("data:text/plain;base64,Zm9v", {
        required: true,
        errorCodePrefix: "FOTO",
      }),
    (error: AppError) => error.code === "FOTO_INVALID",
  );

  assert.throws(
    () =>
      validateImageDataUrl("data:image/png;base64,abc", {
        required: true,
        errorCodePrefix: "FOTO",
      }),
    (error: AppError) => error.code === "FOTO_INVALID",
  );
});

test("validateImageDataUrl rejeita MIME declarado diferente do conteudo", () => {
  assert.throws(
    () =>
      validateImageDataUrl(PNG_FIXTURE.replace("image/png", "image/jpeg"), {
        required: true,
        errorCodePrefix: "FOTO",
      }),
    (error: AppError) => error.code === "FOTO_INVALID",
  );
});

test("validateImageDataUrl rejeita SVG puro ou disfarçado", () => {
  assert.throws(
    () =>
      validateImageDataUrl(`data:image/svg+xml;base64,${SVG_BASE64}`, {
        required: true,
        errorCodePrefix: "FOTO",
      }),
    (error: AppError) => error.code === "FOTO_INVALID",
  );

  assert.throws(
    () =>
      validateImageDataUrl(`data:image/png;base64,${SVG_BASE64}`, {
        required: true,
        errorCodePrefix: "FOTO",
      }),
    (error: AppError) => error.code === "FOTO_INVALID",
  );
});

test("validateImageDataUrl rejeita imagem acima do limite", () => {
  assert.throws(
    () =>
      validateImageDataUrl(`data:image/jpeg;base64,${"A".repeat(3 * 1024)}`, {
        required: true,
        maxSizeInBytes: 1024,
        errorCodePrefix: "FOTO",
      }),
    (error: AppError) => error.code === "FOTO_TOO_LARGE",
  );
});
