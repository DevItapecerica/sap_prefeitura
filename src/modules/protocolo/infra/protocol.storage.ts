import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import AppError from "../../../core/appError.js";
import {
  CLAMAV_HOST,
  CLAMAV_PORT,
  CLAMAV_TIMEOUT_MS,
  PROTOCOL_MAX_FILE_BYTES,
  PROTOCOL_STORAGE_DIR,
} from "../../../core/env.js";

const signatures: Record<string, (buffer: Buffer) => boolean> = {
  "application/pdf": (buffer) => buffer.subarray(0, 5).toString() === "%PDF-",
  "image/jpeg": (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9,
  "image/png": (buffer) => buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
};
const extensions: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

export function validateAttachmentMetadata(buffer: Buffer, mimeType: string, originalName: string): void {
  const extension = path.extname(originalName).toLowerCase();
  if (!extensions[mimeType]?.includes(extension)) throw new AppError("Extensao do arquivo invalida", 400, "INVALID_ATTACHMENT_EXTENSION");
  if (!signatures[mimeType] || !signatures[mimeType](buffer)) throw new AppError("Tipo real do arquivo invalido", 400, "INVALID_ATTACHMENT");
  if (!buffer.length || buffer.length > PROTOCOL_MAX_FILE_BYTES) throw new AppError("Arquivo excede o limite", 413, "ATTACHMENT_TOO_LARGE");
}

export function assertCleanClamAvResponse(rawResponse: string): void {
  const response = rawResponse.replace(/\0+$/g, "").trim();
  if (response === "stream: OK") return;
  if (/^stream: .+ FOUND$/s.test(response)) {
    throw new AppError("Arquivo rejeitado pelo antivirus", 422, "MALWARE_DETECTED");
  }
  throw new AppError("Falha na verificacao do arquivo", 503, "ANTIVIRUS_SCAN_ERROR");
}

type ClamAvClient = { scan(buffer: Buffer): Promise<void>; ping(): Promise<void> };

export class ClamAvScanner implements ClamAvClient {
  constructor(
    private readonly host = CLAMAV_HOST,
    private readonly port = CLAMAV_PORT,
    private readonly timeoutMs = CLAMAV_TIMEOUT_MS,
  ) {}

  async scan(buffer: Buffer): Promise<void> {
    const response = await this.exchange((socket) => {
      socket.write("zINSTREAM\0");
      for (let offset = 0; offset < buffer.length; offset += 64 * 1024) {
        const chunk = buffer.subarray(offset, Math.min(offset + 64 * 1024, buffer.length));
        const length = Buffer.allocUnsafe(4);
        length.writeUInt32BE(chunk.length);
        socket.write(length);
        socket.write(chunk);
      }
      socket.end(Buffer.alloc(4));
    });
    assertCleanClamAvResponse(response);
  }

  async ping(): Promise<void> {
    const response = (await this.exchange((socket) => socket.end("zPING\0"))).replace(/\0+$/g, "").trim();
    if (response !== "PONG") throw new AppError("Antivirus indisponivel", 503, "ANTIVIRUS_UNAVAILABLE");
  }

  private exchange(send: (socket: net.Socket) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host: this.host, port: this.port });
      let response = "";
      let settled = false;
      const finish = (error?: AppError) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        if (error) reject(error);
        else resolve(response);
      };
      socket.setTimeout(this.timeoutMs);
      socket.on("connect", () => send(socket));
      socket.on("data", (data) => {
        response += data.toString();
        if (response.length > 8_192) finish(new AppError("Resposta invalida do antivirus", 503, "ANTIVIRUS_SCAN_ERROR"));
      });
      socket.on("end", () => finish());
      socket.on("timeout", () => finish(new AppError("Antivirus indisponivel", 503, "ANTIVIRUS_UNAVAILABLE")));
      socket.on("error", () => finish(new AppError("Antivirus indisponivel", 503, "ANTIVIRUS_UNAVAILABLE")));
    });
  }
}

export class ProtocolStorage {
  constructor(private readonly scanner: ClamAvClient = new ClamAvScanner()) {}

  async store(buffer: Buffer, mimeType: string, originalName: string) {
    validateAttachmentMetadata(buffer, mimeType, originalName);
    const key = `${new Date().getFullYear()}/${randomUUID()}`;
    const quarantine = path.resolve(PROTOCOL_STORAGE_DIR, "quarantine", key);
    const available = path.resolve(PROTOCOL_STORAGE_DIR, "available", key);
    await mkdir(path.dirname(quarantine), { recursive: true });
    await writeFile(quarantine, buffer, { flag: "wx" });
    try {
      await this.scanner.scan(buffer);
      await mkdir(path.dirname(available), { recursive: true });
      await rename(quarantine, available);
    } catch (error) {
      await unlink(quarantine).catch(() => undefined);
      throw error;
    }
    return { key, size: buffer.length, sha256: createHash("sha256").update(buffer).digest("hex") };
  }

  read(key: string) {
    if (!/^[0-9]{4}\/[0-9a-f-]{36}$/.test(key)) throw new AppError("Chave de arquivo invalida", 400);
    return readFile(path.resolve(PROTOCOL_STORAGE_DIR, "available", key));
  }

  remove(key: string) {
    if (!/^[0-9]{4}\/[0-9a-f-]{36}$/.test(key)) return Promise.resolve();
    return unlink(path.resolve(PROTOCOL_STORAGE_DIR, "available", key)).catch(() => undefined);
  }

  assertAntivirusReady() {
    return this.scanner.ping();
  }
}
