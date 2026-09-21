import assert from "node:assert/strict";
import test from "node:test";

import AppError from "../../../core/appError.js";
import { AuthorizationUseCase } from "./authorization.usecase.js";

type Permission = { read: boolean; write: boolean; edit: boolean; del: boolean };

const makeSubject = ({
  permission = { read: true, write: true, edit: true, del: true },
  serviceExists = true,
  visible = true,
}: {
  permission?: Permission | null;
  serviceExists?: boolean;
  visible?: boolean;
} = {}) =>
  new AuthorizationUseCase(
    { getOneServices: async () => (serviceExists ? { id: 6 } : null) } as never,
    {
      findVisibilityByServiceAndSetor: async () => ({ visibility: visible }),
    } as never,
    { findById: async () => ({ id: 2 }) } as never,
    { findByRoleAndService: async () => permission } as never,
    {
      getUserById: async () => ({ id: 10, setor_id: 3, role_id: 2 }),
    } as never,
    { info: () => undefined },
  );

const expectStatus = async (operation: Promise<unknown>, status: number) => {
  await assert.rejects(operation, (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, status);
    return true;
  });
};

test("authorization applies the method x permission matrix", async () => {
  const matrix = [
    ["GET", "read"],
    ["POST", "write"],
    ["PUT", "edit"],
    ["DELETE", "del"],
  ] as const;

  for (const [method, field] of matrix) {
    const allowed = { read: false, write: false, edit: false, del: false };
    allowed[field] = true;
    await makeSubject({ permission: allowed }).authorize(10, 6, method);

    allowed[field] = false;
    await expectStatus(
      makeSubject({ permission: allowed }).authorize(10, 6, method),
      403,
    );
  }
});

test("authorization denies invisible, unknown and unconfigured services", async () => {
  await expectStatus(makeSubject({ visible: false }).authorize(10, 6, "GET"), 403);
  await expectStatus(makeSubject({ serviceExists: false }).authorize(10, 999, "GET"), 404);
  await expectStatus(makeSubject({ permission: null }).authorize(10, 6, "GET"), 404);
});

test("authorization rejects methods outside the explicit matrix", async () => {
  await expectStatus(makeSubject().authorize(10, 6, "PATCH"), 405);
});
