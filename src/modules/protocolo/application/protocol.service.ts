import { createHash, randomBytes, randomInt } from "node:crypto";
import jwt from "jsonwebtoken";
import { Op, Transaction, WhereOptions } from "sequelize";
import AppError from "../../../core/appError.js";
import { PROTOCOL_TOKEN_SECRET, PROTOCOL_CODE_TTL_MINUTES, PROTOCOL_PUBLIC_URL } from "../../../core/env.js";
import AesCryptService from "../../../core/security/aes/AesCrypt.service.js";
import Sha256CryptService from "../../../core/security/sha256/sha256.service.js";
import createMunicipeUseCase from "../../municipe/application/usecase/createMunicipe.use-case.js";
import MunicipePolicy from "../../municipe/domain/service/municipePolicy.service.js";
import { SequelizeMunicipeRepository } from "../../../infra/database/sequelize/repositories/sequelize.municipe.repository.js";
import db from "../../../infra/database/sequelize/index.js";
import { assertProtocolTransition, FormField, ProtocolState, validateFormAnswers, validateFormDefinition } from "../domain/protocolo.js";
import { ProtocolMailer } from "../infra/protocol.mailer.js";
import axios from "axios";
import { PDF_API_URL } from "../../../core/env.js";
import { allocateProtocolNumber } from "./protocol-number.js";
import { PROTOCOL_PRIVACY_NOTICE_VERSION } from "../domain/protocol-privacy.js";
import { assertProtocolTypeOpening, protocolTypePolicy, ProtocolType, PROTOCOL_TYPE_POLICY_VERSION } from "../domain/protocol-type.js";
import { withProtocolTransactionRetry } from "./protocol-transaction.js";
import {
  InternalProtocolOpeningInput,
  ProtocolCitizenInput,
  ProtocolCsvRow,
  ProtocolInternalUser,
  ProtocolListQuery,
  ProtocolOpeningInput,
  ProtocolRequirementInput,
  ProtocolServiceDraftInput,
  ProtocolServiceInput,
  ProtocolTransitionInput,
} from "./protocol.dto.js";
import { protocolModels, ProtocolDetailRow } from "../infra/protocol-model-registry.js";

const models = protocolModels;
const protocolSafeAttributes = { exclude: ["contactEmail", "contactEmailHash", "encryptedLegalHoldReason"] };
const hash = (value: string) => createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
const normalizeCpf = (cpf: string) => MunicipePolicy.normalizeCpf(cpf);
export function maskCitizenName(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Municipe";
  return [parts[0], ...parts.slice(1).map((part) => `${part[0]}.`)].join(" ");
}
export function formatProtocolCsv(rows: ProtocolCsvRow[]): string {
  const cell = (value: unknown) => { const raw = String(value ?? ""); const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw; return `"${safe.replaceAll('"', '""')}"`; };
  return ["numero;tipo;sigilo;assunto;estado;setor;responsavel;abertura;prazo", ...rows.map((row) => [row.publicNumber, row.protocolType, row.confidentiality, row.subject, row.state, row.currentSectorId, row.assigneeId, row.createdAt?.toISOString(), row.dueAt?.toISOString()].map(cell).join(";"))].join("\r\n");
}

export type CitizenSession = { kind: "protocol-citizen"; citizenId?: string; cpfHash: string; emailHash: string; email: string };

export class ProtocolService {
  constructor(private mailer = new ProtocolMailer(), private aes = new AesCryptService()) {}

  async listServices() {
    const m = models();
    return m.ProtocolServiceModel.findAll({ where: { active: true, publishedFormId: { [Op.not]: null } }, include: [{ model: m.ProtocolFormModel, as: "forms", where: { publishedAt: { [Op.not]: null } }, required: true }], order: [["name", "ASC"]] });
  }

  async listServiceCatalog() {
    const m = models();
    return m.ProtocolServiceModel.findAll({
      include: [{ model: m.ProtocolFormModel, as: "forms", required: false }],
      order: [["name", "ASC"], [{ model: m.ProtocolFormModel, as: "forms" }, "version", "DESC"]],
    });
  }

  async requestCode(cpf: string, email: string, requestIp: string): Promise<void> {
    const m = models(); const normalizedCpf = normalizeCpf(cpf); const normalizedEmail = email.trim().toLowerCase();
    if (!MunicipePolicy.cpfIsValid(normalizedCpf) || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new AppError("CPF ou e-mail invalido", 400, "INVALID_CONTACT");
    const cpfHash = hash(normalizedCpf); const emailHash = hash(normalizedEmail); const since = new Date(Date.now() - 15 * 60000);
    const recent = await m.ProtocolAccessCodeModel.count({ where: { [Op.or]: [{ cpfHash }, { emailHash }, { requestIp }], createdAt: { [Op.gte]: since } } });
    if (recent >= 3) throw new AppError("Muitas solicitacoes de codigo. Tente novamente mais tarde", 429, "ACCESS_CODE_RATE_LIMIT");
    await m.ProtocolAccessCodeModel.update({ usedAt: new Date() }, { where: { cpfHash, emailHash, usedAt: null } });
    const code = String(randomInt(100000, 1000000));
    await m.ProtocolAccessCodeModel.create({ cpfHash, emailHash, requestIp, encryptedEmail: await this.aes.encrypt(normalizedEmail), codeHash: hash(code), expiresAt: new Date(Date.now() + PROTOCOL_CODE_TTL_MINUTES * 60000) });
    await this.mailer.sendCode(normalizedEmail, code, PROTOCOL_CODE_TTL_MINUTES);
  }

  async verifyCode(cpf: string, email: string, code: string): Promise<{ token: string; citizenExists: boolean }> {
    const normalizedCpf = normalizeCpf(cpf); const normalizedEmail = email.trim().toLowerCase();
    if (!MunicipePolicy.cpfIsValid(normalizedCpf) || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new AppError("CPF ou e-mail invalido", 400, "INVALID_CONTACT");
    const m = models(); const canonicalCpfHash = hash(normalizedCpf); const emailHash = hash(normalizedEmail); const cpfHash = canonicalCpfHash;
    const record = await m.ProtocolAccessCodeModel.findOne({ where: { cpfHash, emailHash }, order: [["createdAt", "DESC"]] });
    if (!record || record.usedAt || record.expiresAt < new Date() || record.attempts >= 5) throw new AppError("Codigo invalido ou expirado", 401, "INVALID_ACCESS_CODE");
    if (record.codeHash !== hash(code)) { await record.increment("attempts"); throw new AppError("Codigo invalido", 401, "INVALID_ACCESS_CODE"); }
    const [consumed] = await m.ProtocolAccessCodeModel.update({ usedAt: new Date() }, { where: { id: record.id, usedAt: null, attempts: { [Op.lt]: 5 } } });
    if (consumed !== 1) throw new AppError("Codigo ja utilizado", 401, "INVALID_ACCESS_CODE");
    const citizen = await m.MunicipeModel.findOne({ where: { cpfHash: { [Op.in]: [...new Set([canonicalCpfHash, hash(cpf)])] } } });
    const payload: CitizenSession = { kind: "protocol-citizen", citizenId: citizen?.uuid, cpfHash: citizen?.cpfHash || canonicalCpfHash, emailHash, email: normalizedEmail };
    return { token: jwt.sign(payload, PROTOCOL_TOKEN_SECRET, { expiresIn: "30m", issuer: "sap-prefeitura", audience: "protocol-public" }), citizenExists: Boolean(citizen) };
  }

  verifyCitizenToken(token?: string): CitizenSession {
    if (!token) throw new AppError("Sessao publica nao enviada", 401, "PUBLIC_AUTH_REQUIRED");
    try { const value = jwt.verify(token.replace("Bearer ", ""), PROTOCOL_TOKEN_SECRET, { issuer: "sap-prefeitura", audience: "protocol-public" }) as CitizenSession; if (value.kind !== "protocol-citizen") throw new Error(); return value; }
    catch { throw new AppError("Sessao publica invalida", 401, "PUBLIC_AUTH_INVALID"); }
  }

  issueCitizenToken(session: CitizenSession, citizenId: string): string {
    return jwt.sign({ ...session, citizenId }, PROTOCOL_TOKEN_SECRET, { expiresIn: "30m", issuer: "sap-prefeitura", audience: "protocol-public" });
  }

  async registerCitizen(session: CitizenSession, data: ProtocolCitizenInput): Promise<string> {
    if (session.citizenId) return session.citizenId;
    if (hash(normalizeCpf(data.cpf)) !== session.cpfHash) throw new AppError("CPF difere da sessao validada", 403, "CPF_MISMATCH");
    const useCase = new createMunicipeUseCase(new SequelizeMunicipeRepository(), new AesCryptService(), new Sha256CryptService());
    const result = await useCase.execute(data, "PUBLIC_PROTOCOL");
    return result.municipe.uuid!;
  }

  async createProtocol(session: CitizenSession, input: ProtocolOpeningInput, openedByUserId?: number) {
    const m = models();
    if (!session.citizenId) throw new AppError("Cadastro do municipe obrigatorio", 409, "CITIZEN_REGISTRATION_REQUIRED");
    if (!String(input.subject || "").trim() || String(input.subject).length > 180) throw new AppError("Assunto invalido", 400, "INVALID_PROTOCOL_SUBJECT");
    return withProtocolTransactionRetry(() => db.sequelize.transaction(async (transaction: Transaction) => {
      const service = await m.ProtocolServiceModel.findByPk(input.serviceId, { transaction });
      if (!service?.active || !service.publishedFormId) throw new AppError("Servico indisponivel", 404, "PROTOCOL_SERVICE_NOT_FOUND");
      const form = await m.ProtocolFormModel.findByPk(service.publishedFormId, { transaction });
      if (!form) throw new AppError("Formulario publicado nao encontrado", 409, "PROTOCOL_FORM_NOT_FOUND");
      validateFormAnswers(form.fields as FormField[], input.answers || {});
      const protocolType = (service.protocolType || "REQUERIMENTO") as ProtocolType;
      const policy = protocolTypePolicy(protocolType);
      const relatedProtocol = input.relatedProtocolId
        ? await m.ProtocolModel.findByPk(input.relatedProtocolId, { attributes: ["id", "citizenId", "state"], transaction })
        : null;
      assertProtocolTypeOpening(protocolType, session.citizenId!, input.relatedProtocolId, relatedProtocol?.get({ plain: true }));
      const publicNumber = await allocateProtocolNumber(m.ProtocolCounterModel, transaction);
      const protocol = await m.ProtocolModel.create({ publicNumber, authenticityCode: randomBytes(24).toString("hex"), citizenId: session.citizenId, contactEmail: await this.aes.encrypt(session.email), contactEmailHash: session.emailHash, serviceId: service.id, formId: form.id, protocolType, confidentiality: policy.confidentiality, relatedProtocolId: input.relatedProtocolId || null, typePolicyVersion: PROTOCOL_TYPE_POLICY_VERSION, subject: input.subject, answers: input.answers || {}, currentSectorId: service.defaultSectorId, state: "EM_TRIAGEM", dueAt: new Date(Date.now() + service.deadlineDays * 86400000), privacyNoticeVersion: PROTOCOL_PRIVACY_NOTICE_VERSION }, { transaction });
      await m.ProtocolMovementModel.create({ protocolId: protocol.id, toSectorId: service.defaultSectorId, actorId: openedByUserId, actorType: openedByUserId ? "USER" : "CITIZEN", toState: "EM_TRIAGEM", publicMessage: "Protocolo aberto" }, { transaction });
      await this.enqueueNotification(protocol, `opened:${protocol.id}`, `Protocolo ${publicNumber} aberto`, `Seu protocolo foi recebido. Acompanhe em ${PROTOCOL_PUBLIC_URL}`, transaction);
      return protocol;
    }));
  }

  async createProtocolForCitizen(input: InternalProtocolOpeningInput, openedByUserId: number) {
    const citizen = await models().MunicipeModel.findByPk(input.citizenId);
    if (!citizen) throw new AppError("Municipe nao encontrado", 404, "CITIZEN_NOT_FOUND");
    const email = String(input.email || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new AppError("E-mail invalido", 400, "INVALID_CONTACT");
    return this.createProtocol({ kind: "protocol-citizen", citizenId: citizen.uuid, cpfHash: citizen.cpfHash, emailHash: hash(email), email }, input, openedByUserId);
  }

  async listCitizen(session: CitizenSession) { if (!session.citizenId) return []; return models().ProtocolModel.findAll({ where: { citizenId: session.citizenId }, attributes: protocolSafeAttributes, order: [["createdAt", "DESC"]] }); }

  async getCitizenProtocol(session: CitizenSession, id: string) {
    const m = models(); const protocol = await m.ProtocolModel.findOne({ where: { id, citizenId: session.citizenId }, attributes: protocolSafeAttributes, include: [{ model: m.ProtocolMovementModel, as: "movements", attributes: { exclude: ["internalMessage"] } }, { model: m.ProtocolRequirementModel, as: "requirements" }, { model: m.ProtocolAttachmentModel, as: "attachments", where: { status: "AVAILABLE" }, required: false, attributes: { exclude: ["storageKey"] } }] });
    if (!protocol) throw new AppError("Protocolo nao encontrado", 404); return protocol as ProtocolDetailRow;
  }

  async receipt(session: CitizenSession, id: string): Promise<Buffer> {
    const m = models(); const protocol = await m.ProtocolModel.findOne({ where: { id, citizenId: session.citizenId }, include: [{ model: m.ProtocolServiceModel, as: "service" }, { model: m.ProtocolAttachmentModel, as: "attachments", where: { status: "AVAILABLE" }, required: false }] });
    if (!protocol) throw new AppError("Protocolo nao encontrado", 404); const citizen = await m.MunicipeModel.findByPk(protocol.citizenId);
    const response = await axios.post(`${PDF_API_URL}/api/v1/protocolos/render`, { number: protocol.publicNumber, createdAt: protocol.createdAt, citizenName: maskCitizenName(citizen?.nome || "Municipe"), service: protocol.service?.name || "Protocolo Geral", protocolType: protocol.protocolType, subject: protocol.subject, attachments: protocol.attachments?.map((attachment: { originalName: string }) => attachment.originalName) || [], authenticityCode: protocol.authenticityCode }, { responseType: "arraybuffer" }); return Buffer.from(response.data);
  }

  async cancel(session: CitizenSession, id: string) { return this.transition(id, "CANCELADO", { actorType: "CITIZEN", citizenId: session.citizenId, publicMessage: "Cancelado pelo cidadao" }); }

  async listInternal(query: ProtocolListQuery, user: ProtocolInternalUser, allowRestricted = Number(user.role_id) === 1) {
    const where: WhereOptions = {}; if (query.state) where.state = query.state; if (query.sectorId) where.currentSectorId = Number(query.sectorId); else if (Number(user.role_id) !== 1 && user.setor_id) where.currentSectorId = Number(user.setor_id);
    if (!allowRestricted) where.confidentiality = { [Op.ne]: "RESTRICTED" };
    if (query.protocolType) where.protocolType = query.protocolType;
    if (query.assigneeId) where.assigneeId = Number(query.assigneeId); if (query.from || query.to) where.createdAt = { ...(query.from ? { [Op.gte]: new Date(query.from) } : {}), ...(query.to ? { [Op.lte]: new Date(query.to) } : {}) };
    return models().ProtocolModel.findAll({ where, attributes: protocolSafeAttributes, order: [["dueAt", "ASC"]] });
  }
  async getInternal(id: string) { const m = models(); const result = await m.ProtocolModel.findByPk(id, { attributes: protocolSafeAttributes, include: [{ model: m.ProtocolMovementModel, as: "movements" }, { model: m.ProtocolRequirementModel, as: "requirements" }, { model: m.ProtocolAttachmentModel, as: "attachments", attributes: { exclude: ["storageKey"] } }] }); if (!result) throw new AppError("Protocolo nao encontrado", 404); return result as ProtocolDetailRow; }

  async transition(id: string, to: ProtocolState, input: ProtocolTransitionInput) {
    const m = models(); const updated = await db.sequelize.transaction(async (transaction) => {
      const protocol = await m.ProtocolModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE }); if (!protocol) throw new AppError("Protocolo nao encontrado", 404);
      if (input.citizenId && protocol.citizenId !== input.citizenId) throw new AppError("Acesso negado", 403);
      if (input.requireAssignee && Number(protocol.assigneeId) !== Number(input.actorId)) throw new AppError("Operacao exclusiva do responsavel pelo protocolo", 403, "PROTOCOL_ASSIGNEE_DENIED");
      assertProtocolTransition(protocol.state, to); const from = protocol.state; const fromSector = protocol.currentSectorId;
      protocol.state = to; if (input.toSectorId !== undefined) protocol.currentSectorId = input.toSectorId; if (input.assigneeId !== undefined) protocol.assigneeId = input.assigneeId; await protocol.save({ transaction });
      const movement = await m.ProtocolMovementModel.create({ protocolId: id, fromSectorId: fromSector, toSectorId: protocol.currentSectorId, actorId: input.actorId, actorType: input.actorType || "USER", fromState: from, toState: to, publicMessage: input.publicMessage, internalMessage: input.internalMessage }, { transaction });
      await this.enqueueNotification(protocol, `movement:${movement.id}`, `Atualizacao do protocolo ${protocol.publicNumber}`, `Situacao: ${to}. ${input.publicMessage || "Consulte o portal para detalhes."}`, transaction); return protocol;
    });
    return updated;
  }

  async assume(id: string, user: ProtocolInternalUser) {
    return this.recordOperationalMovement(id, user, { assigneeId: Number(user.id), publicMessage: "Protocolo em atendimento", beginAnalysis: true, access: "CLAIM" });
  }

  async forward(id: string, toSectorId: number, user: ProtocolInternalUser, publicMessage?: string, internalMessage?: string) {
    if (!Number.isInteger(toSectorId) || toSectorId < 1) throw new AppError("Setor de destino invalido", 400);
    const sector = await models().SetorModel.findByPk(toSectorId); if (!sector) throw new AppError("Setor de destino nao encontrado", 404);
    return this.recordOperationalMovement(id, user, { toSectorId, assigneeId: null, publicMessage: publicMessage || "Protocolo encaminhado ao setor responsavel", internalMessage, beginAnalysis: true, access: "FORWARD" });
  }

  async returnToTriage(id: string, user: ProtocolInternalUser, message?: string) {
    return this.transition(id, "EM_TRIAGEM", { actorId: Number(user.id), actorType: "USER", toSectorId: null, assigneeId: null, publicMessage: message || "Protocolo devolvido para triagem", requireAssignee: Number(user.role_id) !== 1 });
  }

  async addInternalNote(id: string, user: ProtocolInternalUser, message: string) {
    if (!message?.trim()) throw new AppError("Nota interna obrigatoria", 400); return this.recordOperationalMovement(id, user, { internalMessage: message.trim(), access: "RESPONSIBLE" });
  }

  async exportInternal(query: ProtocolListQuery, user: ProtocolInternalUser, allowRestricted = Number(user.role_id) === 1): Promise<string> {
    return formatProtocolCsv(await this.listInternal(query, user, allowRestricted));
  }

  private async recordOperationalMovement(id: string, user: ProtocolInternalUser, changes: { toSectorId?: number; assigneeId?: number | null; publicMessage?: string; internalMessage?: string; beginAnalysis?: boolean; access?: "CLAIM" | "FORWARD" | "RESPONSIBLE" }) {
    const m = models(); return db.sequelize.transaction(async (transaction) => {
      const protocol = await m.ProtocolModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE }); if (!protocol) throw new AppError("Protocolo nao encontrado", 404);
      if (Number(user.role_id) !== 1) {
        const assignedToUser = protocol.assigneeId != null && Number(protocol.assigneeId) === Number(user.id);
        if (changes.access === "CLAIM" && protocol.assigneeId != null && !assignedToUser) throw new AppError("Protocolo ja atribuido a outro responsavel", 403, "PROTOCOL_ASSIGNEE_DENIED");
        if (changes.access === "RESPONSIBLE" && !assignedToUser) throw new AppError("Operacao exclusiva do responsavel pelo protocolo", 403, "PROTOCOL_ASSIGNEE_DENIED");
        if (changes.access === "FORWARD" && !(assignedToUser || (protocol.state === "EM_TRIAGEM" && protocol.assigneeId == null))) throw new AppError("Operacao exclusiva do responsavel pelo protocolo", 403, "PROTOCOL_ASSIGNEE_DENIED");
      }
      if (!["EM_TRIAGEM", "EM_ANALISE", "AGUARDANDO_COMPLEMENTO"].includes(protocol.state)) throw new AppError("Protocolo encerrado nao pode ser movimentado", 422, "CLOSED_PROTOCOL");
      const fromSectorId = protocol.currentSectorId; const fromState = protocol.state; if (changes.beginAnalysis) { if (!['EM_TRIAGEM', 'EM_ANALISE'].includes(protocol.state)) throw new AppError("Protocolo nao pode iniciar analise neste estado", 422); protocol.state = "EM_ANALISE"; } if (changes.toSectorId !== undefined) protocol.currentSectorId = changes.toSectorId; if (changes.assigneeId !== undefined) protocol.assigneeId = changes.assigneeId; await protocol.save({ transaction });
      const movement = await m.ProtocolMovementModel.create({ protocolId: id, fromSectorId, toSectorId: protocol.currentSectorId, actorId: Number(user.id), actorType: "USER", fromState, toState: protocol.state, publicMessage: changes.publicMessage, internalMessage: changes.internalMessage }, { transaction });
      if (changes.publicMessage) await this.enqueueNotification(protocol, `movement:${movement.id}`, `Movimentacao do protocolo ${protocol.publicNumber}`, changes.publicMessage, transaction); return protocol;
    });
  }

  async addRequirement(id: string, input: ProtocolRequirementInput, user: ProtocolInternalUser) {
    const dueAt = new Date(input.dueAt); if (!input.description?.trim() || Number.isNaN(dueAt.getTime()) || dueAt <= new Date()) throw new AppError("Exigencia ou prazo invalido", 400, "INVALID_REQUIREMENT");
    const m = models(); const result = await db.sequelize.transaction(async (transaction) => {
      const protocol = await m.ProtocolModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE }); if (!protocol) throw new AppError("Protocolo nao encontrado", 404);
      if (Number(user.role_id) !== 1 && Number(protocol.assigneeId) !== Number(user.id)) throw new AppError("Operacao exclusiva do responsavel pelo protocolo", 403, "PROTOCOL_ASSIGNEE_DENIED");
      assertProtocolTransition(protocol.state, "AGUARDANDO_COMPLEMENTO"); const from = protocol.state; protocol.state = "AGUARDANDO_COMPLEMENTO"; await protocol.save({ transaction });
      const requirement = await m.ProtocolRequirementModel.create({ protocolId: id, description: input.description.trim(), dueAt }, { transaction });
      const movement = await m.ProtocolMovementModel.create({ protocolId: id, fromSectorId: protocol.currentSectorId, toSectorId: protocol.currentSectorId, actorId: Number(user.id), actorType: "USER", fromState: from, toState: "AGUARDANDO_COMPLEMENTO", publicMessage: input.description.trim() }, { transaction });
      await this.enqueueNotification(protocol, `requirement:${requirement.id}:${movement.id}`, `Exigencia no protocolo ${protocol.publicNumber}`, input.description.trim(), transaction); return { requirement, protocol };
    });
    return result.requirement;
  }

  async answerRequirement(session: CitizenSession, id: string, requirementId: string, response: string) {
    if (!response?.trim()) throw new AppError("Resposta da exigencia obrigatoria", 400, "INVALID_REQUIREMENT_RESPONSE");
    const m = models();
    return db.sequelize.transaction(async (transaction) => {
      const protocol = await m.ProtocolModel.findOne({ where: { id, citizenId: session.citizenId }, transaction, lock: transaction.LOCK.UPDATE });
      if (!protocol) throw new AppError("Protocolo nao encontrado", 404);
      const requirement = await m.ProtocolRequirementModel.findOne({ where: { id: requirementId, protocolId: id, resolvedAt: null }, transaction, lock: transaction.LOCK.UPDATE });
      if (!requirement) throw new AppError("Exigencia nao encontrada", 404);
      assertProtocolTransition(protocol.state, "EM_ANALISE");
      const from = protocol.state;
      requirement.response = response.trim(); requirement.resolvedAt = new Date(); await requirement.save({ transaction });
      protocol.state = "EM_ANALISE"; await protocol.save({ transaction });
      const movement = await m.ProtocolMovementModel.create({ protocolId: id, fromSectorId: protocol.currentSectorId, toSectorId: protocol.currentSectorId, actorType: "CITIZEN", fromState: from, toState: "EM_ANALISE", publicMessage: "Exigencia respondida" }, { transaction });
      await this.enqueueNotification(protocol, `movement:${movement.id}`, `Atualizacao do protocolo ${protocol.publicNumber}`, "Exigencia respondida", transaction);
      return requirement;
    });
  }

  async createService(input: ProtocolServiceInput) { if (!input.name?.trim() || !input.description?.trim() || Number(input.deadlineDays) < 1) throw new AppError("Dados do servico invalidos", 400); protocolTypePolicy(input.protocolType || "REQUERIMENTO"); return models().ProtocolServiceModel.create({ ...input, protocolType: input.protocolType || "REQUERIMENTO" }); }
  async createServiceWithDraft(input: ProtocolServiceDraftInput) {
    if (!input.name?.trim() || !input.description?.trim() || Number(input.deadlineDays) < 1) throw new AppError("Dados do servico invalidos", 400);
    protocolTypePolicy(input.protocolType || "REQUERIMENTO");
    validateFormDefinition(input.fields);
    const m = models();
    return db.sequelize.transaction(async (transaction) => {
      const service = await m.ProtocolServiceModel.create({
        name: input.name.trim(),
        description: input.description.trim(),
        deadlineDays: Number(input.deadlineDays),
        defaultSectorId: input.defaultSectorId || null,
        active: true,
        protocolType: input.protocolType || "REQUERIMENTO",
      }, { transaction });
      const form = await m.ProtocolFormModel.create({ serviceId: service.id, version: 1, fields: input.fields }, { transaction });
      return { service, form };
    });
  }
  async createForm(serviceId: number, fields: FormField[]) {
    validateFormDefinition(fields);
    const m = models();
    return db.sequelize.transaction(async (transaction) => {
      const service = await m.ProtocolServiceModel.findByPk(serviceId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!service) throw new AppError("Servico nao encontrado", 404, "PROTOCOL_SERVICE_NOT_FOUND");
      const max = await m.ProtocolFormModel.max("version", { where: { serviceId }, transaction });
      return m.ProtocolFormModel.create({ serviceId, version: Number(max || 0) + 1, fields }, { transaction });
    });
  }
  async publishForm(serviceId: number, formId: number) {
    const m = models();
    return db.sequelize.transaction(async (transaction) => {
      const service = await m.ProtocolServiceModel.findByPk(serviceId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!service) throw new AppError("Servico nao encontrado", 404, "PROTOCOL_SERVICE_NOT_FOUND");
      const form = await m.ProtocolFormModel.findOne({ where: { id: formId, serviceId }, transaction, lock: transaction.LOCK.UPDATE });
      if (!form) throw new AppError("Formulario nao encontrado", 404, "PROTOCOL_FORM_NOT_FOUND");
      if (!form.publishedAt) { form.publishedAt = new Date(); await form.save({ transaction }); }
      service.publishedFormId = form.id;
      await service.save({ transaction });
      return form;
    });
  }

  private async enqueueNotification(protocol: { id: string; contactEmail: string }, idempotencyKey: string, subject: string, text: string, transaction?: Transaction) {
    await models().ProtocolNotificationModel.findOrCreate({ where: { idempotencyKey }, defaults: { protocolId: protocol.id, encryptedRecipient: protocol.contactEmail, subject, payload: { text }, status: "PENDING", attempts: 0, nextAttemptAt: new Date() }, transaction });
  }
}
