import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import {
  metricsRegistry,
  recordAuditWorkerRun,
  recordDependency,
} from "../../observability/metrics.js";
import metricsPlugin from "../metrics.js";

test.beforeEach(() => {
  metricsRegistry.resetMetrics();
});

test("metrics usa cliente oficial, rotas normalizadas e pool coletado no scrape", async (context) => {
  let poolStats = { total: 5, available: 3, in_use: 2, pending: 0 };
  const app = Fastify();
  context.after(() => app.close());
  await app.register(metricsPlugin, {
    token: "metrics-test-token",
    databasePoolStatsProvider: () => poolStats,
  });
  app.get("/items/:id", async () => ({ ok: true }));
  app.post("/login", async () => ({ ok: true }));

  await app.inject({ method: "GET", url: "/items/personal-id-123" });
  await app.inject({ method: "POST", url: "/login" });
  recordDependency("pdf", "success", 0.25);
  recordDependency("email", "error", 0.5);
  recordDependency("antivirus", "not_configured");
  recordAuditWorkerRun(2, 1, 3);

  const denied = await app.inject({ method: "GET", url: "/metrics" });
  const invalidToken = await app.inject({
    method: "GET",
    url: "/metrics",
    headers: { authorization: "Bearer wrong-token" },
  });
  const response = await app.inject({
    method: "GET",
    url: "/metrics",
    headers: { authorization: "Bearer metrics-test-token" },
  });

  assert.equal(denied.statusCode, 401);
  assert.equal(invalidToken.statusCode, 401);
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["content-type"], metricsRegistry.contentType);
  assert.match(response.body, /process_cpu_user_seconds_total/);
  assert.match(response.body, /nodejs_eventloop_lag_seconds/);
  assert.match(response.body, /sap_http_requests_total/);
  assert.match(response.body, /route="\/items\/:id"/);
  assert.match(response.body, /sap_http_request_duration_seconds_bucket/);
  assert.match(response.body, /sap_auth_requests_total/);
  assert.match(response.body, /dependency="pdf"/);
  assert.match(response.body, /dependency="email"/);
  assert.match(response.body, /dependency="antivirus"/);
  assert.match(response.body, /result="not_configured"/);
  assert.match(response.body, /sap_audit_worker_items_total/);
  assert.match(response.body, /sap_audit_worker_runs_total/);
  assert.match(response.body, /sap_audit_backlog\{service="sap-prefeitura"\} 3/);
  assert.match(
    response.body,
    /sap_feature_available\{feature="antivirus",service="sap-prefeitura"\} 0/,
  );
  assert.match(
    response.body,
    /sap_database_pool_connections\{state="total",service="sap-prefeitura"\} 5/,
  );
  assert.doesNotMatch(response.body, /personal-id-123/);
  assert.doesNotMatch(response.body, /route="\/metrics"/);
  assert.doesNotMatch(response.body, /metrics-test-token|wrong-token/);

  poolStats = { total: 8, available: 1, in_use: 7, pending: 4 };
  const updated = await app.inject({
    method: "GET",
    url: "/metrics",
    headers: { authorization: "Bearer metrics-test-token" },
  });
  assert.match(
    updated.body,
    /sap_database_pool_connections\{state="pending",service="sap-prefeitura"\} 4/,
  );
});

test("pool indisponivel omite series sem derrubar o scrape", async (context) => {
  const app = Fastify();
  context.after(() => app.close());
  await app.register(metricsPlugin, {
    token: "metrics-test-token",
    databasePoolStatsProvider: () => undefined,
  });

  const response = await app.inject({
    method: "GET",
    url: "/metrics",
    headers: { authorization: "Bearer metrics-test-token" },
  });

  assert.equal(response.statusCode, 200);
  assert.doesNotMatch(response.body, /sap_database_pool_connections\{/);
});

test("metrics permanece indisponivel sem segredo configurado", async (context) => {
  const app = Fastify();
  context.after(() => app.close());
  await app.register(metricsPlugin, { token: "" });
  const response = await app.inject({ method: "GET", url: "/metrics" });
  assert.equal(response.statusCode, 503);
});
