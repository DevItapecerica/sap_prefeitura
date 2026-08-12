import assert from "node:assert/strict";
import test from "node:test";
import { ClamAvScanner } from "../protocol.storage.js";

const host = process.env.CLAMAV_TEST_HOST;
const port = Number(process.env.CLAMAV_TEST_PORT || 3310);

test("ClamAV real aceita conteudo limpo e bloqueia EICAR", {
  skip: host ? false : "CLAMAV_TEST_HOST nao configurado",
  timeout: 30_000,
}, async () => {
  const scanner = new ClamAvScanner(host!, port, 20_000);
  await scanner.ping();
  await scanner.scan(Buffer.from("%PDF-1.7 arquivo de teste limpo"));

  const eicar = Buffer.from("X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*");
  await assert.rejects(
    scanner.scan(eicar),
    (error: any) => error?.code === "MALWARE_DETECTED" && error?.statusCode === 422,
  );
});
