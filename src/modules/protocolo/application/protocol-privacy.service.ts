import { Op, Transaction } from "sequelize";
import AppError from "../../../core/appError.js";
import { PROTOCOL_RETENTION_DAYS, PROTOCOL_RETENTION_POLICY_REFERENCE } from "../../../core/env.js";
import AesCryptService from "../../../core/security/aes/AesCrypt.service.js";
import db from "../../../infra/database/sequelize/index.js";
import type { CitizenSession } from "./protocol.service.js";
import { assessRetentionEligibility, PROTOCOL_PRIVACY_NOTICE, RetentionPolicy } from "../domain/protocol-privacy.js";
import { protocolModels, ProtocolPrivacyRequestRow } from "../infra/protocol-model-registry.js";

const terminalStatuses = new Set(["FULFILLED", "DENIED"]);

export class ProtocolPrivacyService {
  constructor(private readonly aes = new AesCryptService()) {}

  notice() { return PROTOCOL_PRIVACY_NOTICE; }

  async createRequest(session: CitizenSession, input: { requestType: string; details: string; protocolId?: string }) {
    if (!session.citizenId) throw new AppError("Cadastro do municipe obrigatorio", 409, "CITIZEN_REGISTRATION_REQUIRED");
    if (input.protocolId) {
      const owned = await protocolModels().ProtocolModel.count({ where: { id: input.protocolId, citizenId: session.citizenId } });
      if (!owned) throw new AppError("Protocolo nao encontrado", 404, "PROTOCOL_NOT_FOUND");
    }
    const request = await protocolModels().ProtocolPrivacyRequestModel.create({
      citizenId: session.citizenId,
      protocolId: input.protocolId || null,
      requestType: input.requestType,
      encryptedDetails: await this.aes.encrypt(input.details.trim()),
      status: "RECEIVED",
    });
    return this.publicView(request);
  }

  async listCitizen(session: CitizenSession) {
    if (!session.citizenId) return [];
    const rows = await protocolModels().ProtocolPrivacyRequestModel.findAll({ where: { citizenId: session.citizenId }, order: [["createdAt", "DESC"]] });
    return Promise.all(rows.map((row) => this.publicView(row)));
  }

  async listInternal(status?: string) {
    const rows = await protocolModels().ProtocolPrivacyRequestModel.findAll({
      where: status ? { status } : undefined,
      order: [["createdAt", "ASC"]],
      limit: 500,
    });
    return Promise.all(rows.map((row) => this.internalView(row)));
  }

  async updateRequest(id: string, input: { status: string; response?: string }, actorId: number) {
    return db.sequelize.transaction(async (transaction: Transaction) => {
      const row = await protocolModels().ProtocolPrivacyRequestModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!row) throw new AppError("Solicitacao de privacidade nao encontrada", 404, "PRIVACY_REQUEST_NOT_FOUND");
      if (terminalStatuses.has(row.status)) throw new AppError("Solicitacao de privacidade ja encerrada", 409, "PRIVACY_REQUEST_CLOSED");
      if (terminalStatuses.has(input.status) && !input.response?.trim()) throw new AppError("Resposta obrigatoria para encerrar a solicitacao", 400, "PRIVACY_RESPONSE_REQUIRED");
      row.status = input.status;
      row.handledBy = actorId;
      if (input.response?.trim()) row.encryptedResponse = await this.aes.encrypt(input.response.trim());
      row.completedAt = terminalStatuses.has(input.status) ? new Date() : null;
      await row.save({ transaction });
      return this.internalView(row);
    });
  }

  async setLegalHold(protocolId: string, active: boolean, reason: string | undefined, actorId: number) {
    if (active && !reason?.trim()) throw new AppError("Motivo da preservacao legal obrigatorio", 400, "LEGAL_HOLD_REASON_REQUIRED");
    return db.sequelize.transaction(async (transaction: Transaction) => {
      const protocol = await protocolModels().ProtocolModel.findByPk(protocolId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!protocol) throw new AppError("Protocolo nao encontrado", 404, "PROTOCOL_NOT_FOUND");
      protocol.legalHoldAt = active ? new Date() : null;
      protocol.encryptedLegalHoldReason = active ? await this.aes.encrypt(reason!.trim()) : null;
      protocol.retentionReviewAt = null;
      await protocol.save({ transaction });
      await protocolModels().ProtocolMovementModel.create({
        protocolId,
        fromSectorId: protocol.currentSectorId,
        toSectorId: protocol.currentSectorId,
        actorId,
        actorType: "USER",
        fromState: protocol.state,
        toState: protocol.state,
        internalMessage: active ? "Preservacao legal ativada" : "Preservacao legal encerrada",
      }, { transaction });
      return { id: protocol.id, publicNumber: protocol.publicNumber, legalHoldActive: active, legalHoldAt: protocol.legalHoldAt };
    });
  }

  async retentionPreview(now = new Date()) {
    const policy: RetentionPolicy = { reference: PROTOCOL_RETENTION_POLICY_REFERENCE, days: PROTOCOL_RETENTION_DAYS };
    if (!policy.reference || !policy.days) return { mode: "DRY_RUN", policyApproved: false, policy, candidates: [], scanned: 0 };
    const cutoff = new Date(now.getTime() - policy.days * 86_400_000);
    const rows = await protocolModels().ProtocolModel.findAll({
      where: { state: { [Op.in]: ["CONCLUIDO", "INDEFERIDO", "CANCELADO"] }, updatedAt: { [Op.lte]: cutoff } },
      include: [{ model: db.sequelize.models.ProtocolPrivacyRequestModel, as: "privacyRequests", attributes: ["status"], required: false }],
      attributes: ["id", "publicNumber", "state", "updatedAt", "legalHoldAt"],
      order: [["updatedAt", "ASC"]],
      limit: 500,
    });
    const candidates = rows.flatMap((row) => {
      const openPrivacyRequests = (row.privacyRequests || []).filter((item) => !terminalStatuses.has(item.status)).length;
      const assessment = assessRetentionEligibility({ ...row.get({ plain: true }), openPrivacyRequests }, policy, now);
      return assessment.eligible ? [{ id: row.id, publicNumber: row.publicNumber, state: row.state, updatedAt: row.updatedAt, reason: assessment.reason }] : [];
    });
    return { mode: "DRY_RUN", policyApproved: true, policy, candidates, scanned: rows.length };
  }

  private async publicView(row: ProtocolPrivacyRequestRow) {
    return {
      id: row.id,
      protocolId: row.protocolId,
      requestType: row.requestType,
      details: await this.aes.decrypt(row.encryptedDetails),
      status: row.status,
      response: row.encryptedResponse ? await this.aes.decrypt(row.encryptedResponse) : null,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private async internalView(row: ProtocolPrivacyRequestRow) {
    return { ...(await this.publicView(row)), citizenId: row.citizenId, handledBy: row.handledBy };
  }
}
