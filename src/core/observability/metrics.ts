import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from "@prometheus-io/client";

export type Dependency =
  | "database"
  | "email"
  | "pdf"
  | "antivirus"
  | "audit";
export type DependencyResult = "success" | "error" | "not_configured";
export type DatabasePoolStats = {
  total: number;
  available: number;
  in_use: number;
  pending: number;
};
export type DatabasePoolStatsProvider = () => DatabasePoolStats | undefined;

const HISTOGRAM_BUCKETS = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

export const metricsRegistry = new Registry();
metricsRegistry.setDefaultLabels({ service: "sap-prefeitura" });
collectDefaultMetrics({ register: metricsRegistry });

const httpRequests = new Counter({
  name: "sap_http_requests_total",
  help: "HTTP responses by normalized route.",
  labelNames: ["method", "route", "status"] as const,
  registers: [metricsRegistry],
});

const httpRequestDuration = new Histogram({
  name: "sap_http_request_duration_seconds",
  help: "HTTP response latency by normalized route.",
  labelNames: ["method", "route", "status"] as const,
  buckets: HISTOGRAM_BUCKETS,
  registers: [metricsRegistry],
});

const authRequests = new Counter({
  name: "sap_auth_requests_total",
  help: "Authentication operations by result.",
  labelNames: ["operation", "result"] as const,
  registers: [metricsRegistry],
});

const dependencyOperations = new Counter({
  name: "sap_dependency_operations_total",
  help: "Dependency operations grouped by bounded dependency and result labels.",
  labelNames: ["dependency", "result"] as const,
  registers: [metricsRegistry],
});

const dependencyOperationDuration = new Histogram({
  name: "sap_dependency_operation_duration_seconds",
  help: "Dependency operation latency in seconds.",
  labelNames: ["dependency", "result"] as const,
  buckets: HISTOGRAM_BUCKETS,
  registers: [metricsRegistry],
});

const auditWorkerItems = new Counter({
  name: "sap_audit_worker_items_total",
  help: "Audit worker item outcomes.",
  labelNames: ["result"] as const,
  registers: [metricsRegistry],
});

const auditWorkerRuns = new Counter({
  name: "sap_audit_worker_runs_total",
  help: "Audit worker runs.",
  labelNames: ["result"] as const,
  registers: [metricsRegistry],
});

const auditBacklog = new Gauge({
  name: "sap_audit_backlog",
  help: "Audit outbox items waiting for processing.",
  registers: [metricsRegistry],
});

new Gauge({
  name: "sap_feature_available",
  help: "Whether an optional integration is configured.",
  labelNames: ["feature"] as const,
  registers: [metricsRegistry],
  collect() {
    this.set({ feature: "antivirus" }, 0);
  },
});

let databasePoolStatsProvider: DatabasePoolStatsProvider | undefined;

new Gauge({
  name: "sap_database_pool_connections",
  help: "Database pool connections by state.",
  labelNames: ["state"] as const,
  registers: [metricsRegistry],
  collect() {
    this.reset();
    const stats = databasePoolStatsProvider?.();
    if (!stats) return;
    for (const [state, value] of Object.entries(stats)) {
      this.set({ state }, value);
    }
  },
});

export const setDatabasePoolStatsProvider = (
  provider: DatabasePoolStatsProvider | undefined,
) => {
  databasePoolStatsProvider = provider;
};

export const recordHttpRequest = (
  labels: { method: string; route: string; status: string },
  seconds: number,
) => {
  httpRequests.inc(labels);
  httpRequestDuration.observe(labels, seconds);
};

export const recordAuthRequest = (
  operation: string,
  result: "success" | "error",
) => {
  authRequests.inc({ operation, result });
};

export const recordDependency = (
  dependency: Dependency,
  result: DependencyResult,
  seconds = 0,
) => {
  dependencyOperations.inc({ dependency, result });
  if (result !== "not_configured") {
    dependencyOperationDuration.observe({ dependency, result }, seconds);
  }
};

export const recordAuditWorkerRun = (
  processed: number,
  failed: number,
  backlog: number,
) => {
  if (processed > 0) auditWorkerItems.inc({ result: "processed" }, processed);
  if (failed > 0) auditWorkerItems.inc({ result: "failed" }, failed);
  auditWorkerRuns.inc({ result: failed > 0 ? "partial" : "success" });
  auditBacklog.set(backlog);
};
