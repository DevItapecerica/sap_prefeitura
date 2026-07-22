import { AuditResult } from "../entity/AuditEvent.js";

export const verifyAuditResult = (statusCode: number): AuditResult => {
  let result: AuditResult;
  switch (true) {
    case statusCode === 403:
      result = "DENIED";
      break;
    case statusCode >= 400 && statusCode != 403:
      result = "FAILURE";
      break;
    default:
      result = "SUCCESS";
  }
  return result;
};
