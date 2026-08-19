import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import AppError from "../../appError.js";
import ErrorHook from "../ErrorHook.js";
import { HttpRequestFailedEvent } from "../../event/http-request-failed.events.js";
import { HTTP_REQUEST_FAILED_EVENT } from "../../event/http-request-failed.events.js";
import { makeHttpRequestFailedEventSubscriber } from "../../../factories/http-request-failed-events.factory.js";

const makeServer = async (
  statusCode: number,
  failureAction:
    | "LOGIN_FAILED"
    | "CREATE"
    | "UPDATE"
    | "VIEW",
) => {
  const app = Fastify({ logger: false });
  await app.register(ErrorHook);
  app.post(
    "/resource/:id",
    {
      config: {
        audit: {
          failureAction,
          module: failureAction === "LOGIN_FAILED" ? "auth" : "test",
          resourceType:
            failureAction === "LOGIN_FAILED" ? "session" : "resource",
          resourceIdParam: "id",
        },
      },
    },
    async () => {
      throw new AppError("declared failure", statusCode, "DECLARED_ERROR");
    },
  );
  return app;
};

test("ErrorHook publica login inválido sem credencial", async () => {
  const events: HttpRequestFailedEvent[] = [];
  const unsubscribe =
    makeHttpRequestFailedEventSubscriber().subscribe(HTTP_REQUEST_FAILED_EVENT, (event) => {
      events.push(event);
    });
  const app = await makeServer(401, "LOGIN_FAILED");

  try {
    const response = await app.inject({
      method: "POST",
      url: "/resource/login",
      payload: { email: "user@example.com", password: "secret" },
    });
    assert.equal(response.statusCode, 401);
    assert.equal(events[0]?.action, "LOGIN_FAILED");
    assert.equal(events[0]?.attemptedIdentity, "user@example.com");
    assert.equal(events[0]?.requestedChanges, undefined);
  } finally {
    unsubscribe();
    await app.close();
  }
});

test("ErrorHook converte 401 e 403 em acesso negado", async () => {
  for (const statusCode of [401, 403]) {
    const events: HttpRequestFailedEvent[] = [];
    const unsubscribe =
      makeHttpRequestFailedEventSubscriber().subscribe(HTTP_REQUEST_FAILED_EVENT, (event) => {
        events.push(event);
      });
    const app = await makeServer(statusCode, "VIEW");
    try {
      await app.inject({ method: "POST", url: "/resource/42" });
      assert.equal(events[0]?.action, "ACCESS_DENIED");
      assert.equal(events[0]?.resourceId, "42");
    } finally {
      unsubscribe();
      await app.close();
    }
  }
});

test("ErrorHook preserva ação e alterações solicitadas nas demais falhas", async () => {
  const events: HttpRequestFailedEvent[] = [];
  const unsubscribe =
    makeHttpRequestFailedEventSubscriber().subscribe(HTTP_REQUEST_FAILED_EVENT, (event) => {
      events.push(event);
    });
  const app = await makeServer(422, "UPDATE");

  try {
    const response = await app.inject({
      method: "POST",
      url: "/resource/7",
      payload: { name: "new value", password: "must be sanitized downstream" },
    });
    assert.equal(response.statusCode, 422);
    assert.equal(events[0]?.action, "UPDATE");
    assert.deepEqual(events[0]?.requestedChanges, {
      name: "new value",
      password: "must be sanitized downstream",
    });
  } finally {
    unsubscribe();
    await app.close();
  }
});

test("falha ao publicar auditoria não substitui o erro HTTP original", async () => {
  const unsubscribe =
    makeHttpRequestFailedEventSubscriber().subscribe(HTTP_REQUEST_FAILED_EVENT, () => {
      throw new Error("audit unavailable");
    });
  const app = await makeServer(400, "CREATE");

  try {
    const response = await app.inject({
      method: "POST",
      url: "/resource/1",
    });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().code, "DECLARED_ERROR");
  } finally {
    unsubscribe();
    await app.close();
  }
});
