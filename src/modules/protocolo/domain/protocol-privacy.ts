import { PROTOCOL_PRIVACY_CONTACT_URL } from "../../../core/env.js";

export const PROTOCOL_PRIVACY_NOTICE_VERSION = "2026-08-12.1";

export const PROTOCOL_PRIVACY_NOTICE = Object.freeze({
  version: PROTOCOL_PRIVACY_NOTICE_VERSION,
  effectiveAt: "2026-08-12",
  controller: "Município de Itapecerica da Serra",
  contactUrl: PROTOCOL_PRIVACY_CONTACT_URL,
  purposes: [
    "Receber, identificar, instruir, encaminhar e responder solicitações dirigidas à Prefeitura.",
    "Autenticar o munícipe, prevenir abuso e manter prova da tramitação administrativa.",
    "Comunicar exigências, movimentações relevantes e a decisão do protocolo.",
  ],
  legalBasis: "Finalidade pública, interesse público e execução das competências e atribuições legais do serviço público, nos termos do art. 23 da LGPD; a previsão setorial depende do serviço solicitado.",
  dataCategories: [
    "Identificação e contato do munícipe, inclusive CPF, e-mail, telefone e endereço.",
    "Assunto, respostas do formulário, mensagens, exigências e documentos anexados.",
    "Registros técnicos de autenticação, segurança, auditoria, acesso e tramitação.",
  ],
  sharing: [
    "Setores municipais competentes e servidores autorizados, conforme a finalidade do protocolo.",
    "Operadores técnicos necessários a e-mail, geração de PDF, hospedagem e segurança, sob instruções do controlador.",
    "Órgãos de controle ou autoridades quando houver obrigação ou autorização legal.",
  ],
  retention: "Os dados serão mantidos conforme a legislação aplicável e a tabela de temporalidade documental aprovada. O descarte automático permanece desabilitado enquanto esses prazos não estiverem formalmente configurados. Preservação legal suspende qualquer descarte.",
  rights: ["CONFIRMATION", "ACCESS", "CORRECTION", "ANONYMIZATION", "BLOCKING", "ERASURE", "SHARING_INFORMATION", "OPPOSITION"],
  automatedDecision: false,
});

export type RetentionPolicy = { reference: string | null; days: number | null };
export type RetentionSnapshot = {
  state: string;
  updatedAt: Date;
  legalHoldAt?: Date | null;
  openPrivacyRequests?: number;
};

export function assessRetentionEligibility(snapshot: RetentionSnapshot, policy: RetentionPolicy, now = new Date()) {
  if (!policy.reference || !policy.days) return { eligible: false, reason: "POLICY_NOT_APPROVED" as const };
  if (!["CONCLUIDO", "INDEFERIDO", "CANCELADO"].includes(snapshot.state)) return { eligible: false, reason: "PROTOCOL_NOT_TERMINAL" as const };
  if (snapshot.legalHoldAt) return { eligible: false, reason: "LEGAL_HOLD" as const };
  if ((snapshot.openPrivacyRequests || 0) > 0) return { eligible: false, reason: "OPEN_PRIVACY_REQUEST" as const };
  const cutoff = new Date(now.getTime() - policy.days * 86_400_000);
  if (snapshot.updatedAt > cutoff) return { eligible: false, reason: "RETENTION_PERIOD_ACTIVE" as const };
  return { eligible: true, reason: "ELIGIBLE_FOR_REVIEW" as const };
}

