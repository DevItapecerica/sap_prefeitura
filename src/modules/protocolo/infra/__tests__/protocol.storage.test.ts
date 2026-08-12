import test from "node:test";
import assert from "node:assert/strict";
import { assertCleanClamAvResponse, validateAttachmentMetadata } from "../protocol.storage.js";

const pdf = Buffer.from("%PDF-1.7 test");
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.from("data")]);

test("anexo exige correspondencia entre extensao, MIME e assinatura", () => {
  assert.doesNotThrow(() => validateAttachmentMetadata(pdf, "application/pdf", "pedido.pdf"));
  assert.doesNotThrow(() => validateAttachmentMetadata(png, "image/png", "foto.png"));
  assert.throws(() => validateAttachmentMetadata(pdf, "application/pdf", "pedido.exe"));
  assert.throws(() => validateAttachmentMetadata(pdf, "image/png", "pedido.png"));
  assert.throws(() => validateAttachmentMetadata(Buffer.from("<svg></svg>"), "image/png", "imagem.png"));
});

test("resposta do ClamAV precisa indicar arquivo limpo de forma exata", () => {
  assert.doesNotThrow(() => assertCleanClamAvResponse("stream: OK\0"));
  assert.throws(
    () => assertCleanClamAvResponse("stream: Win.Test.EICAR_HDB-1 FOUND\0"),
    (error: any) => error?.code === "MALWARE_DETECTED" && error?.statusCode === 422,
  );
  assert.throws(
    () => assertCleanClamAvResponse("stream: NOT OK\0"),
    (error: any) => error?.code === "ANTIVIRUS_SCAN_ERROR" && error?.statusCode === 503,
  );
  assert.throws(
    () => assertCleanClamAvResponse("stream: size limit exceeded. ERROR\0"),
    (error: any) => error?.code === "ANTIVIRUS_SCAN_ERROR" && error?.statusCode === 503,
  );
});
