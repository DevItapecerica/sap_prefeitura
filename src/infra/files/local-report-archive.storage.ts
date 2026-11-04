import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readdir, rename, stat, unlink } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { ZipArchive } from "archiver";
import {
  ReportArchiveError,
  type ReportArchiveStorage,
  type ReportArchiveWriter,
} from "../../modules/ft-relatorio/application/ports/report-archive.storage.js";

export class LocalReportArchiveStorage implements ReportArchiveStorage {
  private root: string;
  constructor(directory: string) {
    this.root = resolve(directory);
  }
  private checked(path: string) {
    const absolute = resolve(path);
    if (!absolute.startsWith(this.root + sep))
      throw new ReportArchiveError("INVALID_PATH");
    return absolute;
  }
  async open(path: string) {
    const absolute = this.checked(path);
    try {
      return {
        path: absolute,
        size: (await stat(absolute)).size,
        stream: createReadStream(absolute),
      };
    } catch {
      throw new ReportArchiveError("UNAVAILABLE");
    }
  }
  async remove(path: string) {
    await unlink(this.checked(path)).catch(() => undefined);
  }
  async purgeTemporary(before: Date) {
    await mkdir(this.root, { recursive: true });
    for (const name of await readdir(this.root)) {
      if (!name.endsWith(".tmp")) continue;
      const path = this.checked(join(this.root, name)),
        metadata = await stat(path).catch(() => null);
      if (metadata && metadata.mtime < before) await this.remove(path);
    }
  }
  async create(id: string): Promise<ReportArchiveWriter> {
    await mkdir(this.root, { recursive: true });
    const temporary = this.checked(join(this.root, `${id}.tmp`)),
      finalPath = this.checked(join(this.root, `${id}.zip`));
    const output = createWriteStream(temporary, { flags: "wx" }),
      archive = new ZipArchive({ zlib: { level: 9 } });
    const completed = new Promise<void>((accept, reject) => {
      output.on("close", accept);
      output.on("error", reject);
      archive.on("error", reject);
    });
    // Keep the rejection observed even if PDF generation fails before finalization.
    void completed.catch(() => undefined);
    archive.pipe(output);
    return {
      append: (content, name) => {
        archive.append(content, { name });
      },
      finish: async () => {
        await archive.finalize();
        await completed;
        await rename(temporary, finalPath);
        return { path: finalPath, size: (await stat(finalPath)).size };
      },
      abort: async () => {
        archive.abort();
        output.destroy();
        await this.remove(temporary);
      },
    };
  }
}
