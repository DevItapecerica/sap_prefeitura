import axios from "axios";
import { PDF_API_URL } from "../../../core/env.js";
import db from "../../../infra/database/sequelize/index.js";
import { ProtocolStorage } from "../infra/protocol.storage.js";

export type ProtocolDependencyStatus = "UP" | "DOWN";

export type ProtocolReadinessDependencies = {
  database(): Promise<unknown>;
  antivirus(): Promise<unknown>;
  pdf(): Promise<unknown>;
};

const defaultStorage = new ProtocolStorage();

const defaultDependencies: ProtocolReadinessDependencies = {
  database: () => db.sequelize.authenticate(),
  antivirus: () => defaultStorage.assertAntivirusReady(),
  pdf: async () => {
    const response = await axios.get(`${PDF_API_URL}/health`, {
      timeout: 3_000,
      validateStatus: () => true,
    });
    if (response.status !== 200 || response.data?.ok !== true) {
      throw new Error("PDF service is not ready");
    }
  },
};

export class ProtocolReadinessService {
  constructor(private readonly dependencies: ProtocolReadinessDependencies = defaultDependencies) {}

  async check(now = new Date()) {
    const names = ["database", "antivirus", "pdf"] as const;
    const results = await Promise.allSettled(names.map((name) => this.dependencies[name]()));
    const checks = Object.fromEntries(
      names.map((name, index) => [name, results[index].status === "fulfilled" ? "UP" : "DOWN"]),
    ) as Record<(typeof names)[number], ProtocolDependencyStatus>;

    return {
      ready: Object.values(checks).every((status) => status === "UP"),
      checkedAt: now,
      checks,
    };
  }
}
