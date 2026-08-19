import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../core/appError.js";
import {
  MailTransport,
  NodemailerUserPasswordNotifier,
} from "../nodemailer-user-password-notifier.js";

test("NodemailerUserPasswordNotifier sends the temporary password", async () => {
  let message: Record<string, string> | undefined;
  const transport: MailTransport = {
    sendMail: async (input) => { message = input; },
  };
  const notifier = new NodemailerUserPasswordNotifier(transport);

  await notifier.sendTemporaryPassword("user@example.com", "Temporaria1");
  assert.equal(message?.to, "user@example.com");
  assert.equal(message?.html.includes("Temporaria1"), true);
});

test("NodemailerUserPasswordNotifier normalizes transport failures", async () => {
  const notifier = new NodemailerUserPasswordNotifier({
    sendMail: async () => { throw new Error("offline"); },
  });
  await assert.rejects(
    () => notifier.sendTemporaryPassword("user@example.com", "Temporaria1"),
    (error: AppError) => error.code === "INTERNAL_ERROR",
  );
});
