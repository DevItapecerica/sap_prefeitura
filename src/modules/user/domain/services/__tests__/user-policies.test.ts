import assert from "node:assert/strict";
import test from "node:test";
import { EmailPolicyService } from "../email-policy.service.js";
import { PasswordPolicyService } from "../password-policy.service.js";

test("EmailPolicyService accepts only configured institutional domains", () => {
  const policy = new EmailPolicyService();
  assert.equal(policy.isInstitutional("user@itapecerica.sp.gov.br"), true);
  assert.equal(policy.isInstitutional("USER@ITAPECERICA.GOV.BR"), true);
  assert.equal(policy.isInstitutional("user@gmail.com"), false);
});

test("PasswordPolicyService enforces all password rules", () => {
  const policy = new PasswordPolicyService();
  assert.equal(policy.isValid("Senha123"), true);
  assert.equal(policy.isValid("Senh123"), false);
  assert.equal(policy.isValid("senha123"), false);
  assert.equal(policy.isValid("SENHA123"), false);
  assert.equal(policy.isValid("SenhaForte"), false);
  assert.equal(policy.isValid("Senha 123"), false);
});
