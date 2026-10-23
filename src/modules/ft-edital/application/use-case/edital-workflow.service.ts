import { Op, Transaction } from 'sequelize';
import type { DbObject } from '../../../../core/types/DbTypes.js';
import AesCryptService from '../../../../core/security/aes/AesCrypt.service.js';
import { ftError } from '../../../ft-bolsista/application/utils/ft-error.js';
import { addMonths, Answers, businessDate, dateOnly, eligible, participationEnd, registrationWindow, validateConfiguration, validateHistory, requireExceptionReason } from '../../domain/services/edital-workflow.policy.js';

const occupied = ['convocado', 'ativo'];
const plain = (row: any) => row?.toJSON?.() ?? row;
const editalOutput = (row: any) => { const e = plain(row); return { ...e, data_publicacao: dateOnly(e.data_publicacao), data_vencimento: dateOnly(e.data_vencimento) }; };
const editalPersistence = (data: any) => ({ ...data, data_publicacao: dateOnly(data.data_publicacao) + 'T12:00:00-03:00', data_vencimento: dateOnly(data.data_vencimento) + 'T23:59:59-03:00' });
export const CONFIG_MODELS = { pagadores: 'Pagador', turnos: 'Turno', locais: 'FtEditalLocal', beneficios: 'FtEditalBeneficio' } as const;
export type ConfigKind = keyof typeof CONFIG_MODELS;
export type WorkflowActor = { id: number | string; requestId: string };
export const pageOptions = (query: any = {}) => ({ limit: Math.min(50, Math.max(1, Number(query.limit) || 20)), offset: Math.max(0, Number(query.page) || 0) * Math.min(50, Math.max(1, Number(query.limit) || 20)) });

export class EditalWorkflowService {
  constructor(private readonly db: DbObject, private readonly crypto = new AesCryptService(), private readonly clock = () => new Date()) {}

  private async event(t: Transaction, actor: WorkflowActor, editalId: string, resource: string, action: string, motivo?: string) {
    await this.db.FtWorkflowEvento.create({ edital_id: editalId, recurso_id: resource, acao: action,
      ator_id: String(actor.id), request_id: actor.requestId, motivo: motivo || null }, { transaction: t });
  }
  private async edital(id: string, t?: Transaction) {
    const row = await this.db.Edital.findByPk(id, { transaction: t, ...(t ? { lock: t.LOCK.UPDATE } : {}) });
    if (!row) throw ftError(404, 'Edital nao encontrado');
    return row;
  }
  private opened(e: any) {
    if (e.fase !== 'aberto' || businessDate(this.clock()) > dateOnly(e.data_vencimento)) throw ftError(409, 'Edital nao esta vigente e aberto');
  }
  async list(query: any) {
    const result = await this.db.Edital.findAndCountAll({ ...pageOptions(query), order: [['createdAt', 'DESC']],
      where: query.search ? { name: { [Op.like]: '%' + query.search + '%' } } : {} });
    return { rows: result.rows.map(editalOutput), count: result.count };
  }
  async detail(id: string) {
    const edital = editalOutput(await this.edital(id));
    const [reservadas, ocupadas] = await Promise.all(['convocado', 'ativo'].map(status => this.db.BolsistasEdital.count({ where: { edital_id: id, status } })));
    return { ...edital, reservadas, ocupadas, disponiveis: Math.max(0, edital.vagas - reservadas - ocupadas) };
  }
  async create(data: any, actor: WorkflowActor) {
    validateConfiguration(data);
    return this.db.sequelize.transaction(async t => {
      const row = await this.db.Edital.create({ ...editalPersistence(data), fase: 'rascunho', status: 'ativo' }, { transaction: t });
      await this.event(t, actor, String(row.id), String(row.id), 'criar_edital');
      return editalOutput(row);
    });
  }
  async update(id: string, data: any, actor: WorkflowActor) {
    return this.db.sequelize.transaction(async t => {
      const row = await this.edital(id, t), e = plain(row);
      if (e.fase === 'encerrado') throw ftError(409, 'Edital encerrado');
      validateConfiguration(data);
      // Registration windows have a separate permission and endpoint.
      if (new Date(data.inscricoes_inicio).getTime() !== new Date(e.inscricoes_inicio).getTime() || new Date(data.inscricoes_fim).getTime() !== new Date(e.inscricoes_fim).getTime())
        throw ftError(409, 'Altere a janela pela operacao especifica');
      if (e.primeira_convocacao_em) {
        for (const field of ['data_publicacao', 'vigencia_inicio', 'valor_bolsa', 'dia_pagamento', 'carga_semanal', 'carga_mensal', 'duracao_meses', 'prorrogacao_meses', 'permitir_participacao_anterior', 'permitir_retorno']) {
          const same = ['data_publicacao', 'vigencia_inicio'].includes(field) ? dateOnly(data[field]) === dateOnly(e[field]) : typeof data[field] === 'number' ? Number(data[field]) === Number(e[field]) : String(data[field]) === String(e[field]);
          if (!same) throw ftError(409, 'Condicoes bloqueadas apos a primeira convocacao: ' + field);
        }
        if (dateOnly(data.data_vencimento) < dateOnly(e.data_vencimento)) throw ftError(409, 'Vigencia somente pode ser ampliada');
      }
      if (e.primeira_convocacao_em && e.idade_maxima != null && Number(data.idade_maxima) !== Number(e.idade_maxima)) throw ftError(409, 'Idade maxima bloqueada apos a primeira convocacao');
      const used = await this.db.BolsistasEdital.count({ where: { edital_id: id, status: occupied }, transaction: t });
      if (data.vagas < used) throw ftError(409, 'Vagas abaixo da ocupacao e reservas');
      await row.update(editalPersistence(data), { transaction: t });
      await this.event(t, actor, id, id, 'editar_edital');
      return editalOutput(row);
    });
  }
  async window(id: string, data: any, actor: WorkflowActor) {
    return this.db.sequelize.transaction(async t => {
      const row = await this.edital(id, t);
      if (row.fase === 'encerrado') throw ftError(409, 'Edital encerrado');
      validateConfiguration({ ...plain(row), ...data });
      await row.update({ inscricoes_inicio: data.inscricoes_inicio, inscricoes_fim: data.inscricoes_fim }, { transaction: t });
      await this.event(t, actor, id, id, 'alterar_janela', data.motivo);
      return editalOutput(row);
    });
  }
  async phase(id: string, phase: 'aberto' | 'encerrado', actor: WorkflowActor) {
    return this.db.sequelize.transaction(async t => {
      const row = await this.edital(id, t), e = plain(row);
      if (e.fase === 'encerrado' || e.fase === phase) throw ftError(409, 'Transicao de edital invalida');
      if (phase === 'aberto') {
        if (e.fase !== 'rascunho' || e.vagas < 1 || Number(e.carga_semanal) <= 0 || Number(e.carga_mensal) <= 0 || businessDate(this.clock()) > dateOnly(e.data_vencimento)) throw ftError(422, 'Configure vagas, cargas e vigencia antes de abrir');
      } else {
        await this.db.BolsistasEdital.update({ status: 'cancelado', canceled_at: this.clock(), observacao: 'Edital encerrado' }, { where: { edital_id: id, status: 'convocado' }, transaction: t });
        await this.db.BolsistasEdital.update({ status: 'concluido', concluded_at: this.clock() }, { where: { edital_id: id, status: 'ativo' }, transaction: t });
      }
      await row.update({ fase: phase, status: phase === 'encerrado' ? 'inativo' : 'ativo' }, { transaction: t });
      await this.event(t, actor, id, id, phase === 'aberto' ? 'abrir_edital' : 'encerrar_edital');
      return editalOutput(row);
    });
  }
  async configs(id: string, kind: ConfigKind, query: any) {
    await this.edital(id);
    const result = await this.db[CONFIG_MODELS[kind]].findAndCountAll({ where: { edital_id: id }, ...pageOptions(query), order: [['nome', 'ASC']] });
    if (kind === 'pagadores') for (const row of result.rows) row.setDataValue('ocupacao', await this.db.BolsistasEdital.count({ where: { edital_id: id, pagador_id: row.uuid, status: occupied } }));
    return result;
  }
  async config(id: string, kind: ConfigKind, itemId: string | undefined, data: any | null, actor: WorkflowActor) {
    if (data) {
      data = { ...data, nome: data.nome.trim() };
      if (!data.nome) throw ftError(422, 'Nome obrigatorio');
      if (kind === 'turnos' && data.hora_inicio >= data.hora_fim) throw ftError(422, 'Turno deve terminar depois do inicio');
    }
    return this.db.sequelize.transaction(async t => {
      const edital = await this.edital(id, t);
      if (edital.fase === 'encerrado') throw ftError(409, 'Edital encerrado');
      const Model = this.db[CONFIG_MODELS[kind]], pk = ['pagadores', 'turnos'].includes(kind) ? 'uuid' : 'id';
      const row = itemId ? await Model.findOne({ where: { [pk]: itemId, edital_id: id }, transaction: t, lock: t.LOCK.UPDATE }) : null;
      if (itemId && !row) throw ftError(404, 'Configuracao nao encontrada neste edital');
      if (edital.primeira_convocacao_em && (kind === 'beneficios' || (kind === 'turnos' && data))) throw ftError(409, 'Condicoes bloqueadas apos a primeira convocacao');
      if (edital.primeira_convocacao_em && row && data && data.nome !== row.nome) throw ftError(409, 'Nome bloqueado para preservar o historico');
      if (row && kind === 'pagadores' && data) {
        const used = await this.db.BolsistasEdital.count({ where: { edital_id: id, pagador_id: itemId, status: occupied }, transaction: t });
        if (data.quantidade < used) throw ftError(409, 'Capacidade abaixo da ocupacao e reservas');
      }
      if (row && !data) {
        const fk = kind === 'pagadores' ? 'pagador_id' : kind === 'turnos' ? 'turno_id' : 'local_id';
        if (kind !== 'beneficios' && await this.db.BolsistasEdital.count({ where: { edital_id: id, [fk]: itemId, status: occupied }, transaction: t })) throw ftError(409, 'Configuracao possui convocados ou ativos');
        await row.destroy({ transaction: t });
      } else if (row) await row.update(data, { transaction: t });
      const saved = row || await Model.create({ ...data, edital_id: id }, { transaction: t });
      await this.event(t, actor, id, String(saved[pk]), (data ? 'salvar_' : 'inativar_') + kind);
      return plain(saved);
    });
  }
  async register(id: string, data: { municipe_uuid: string; respostas: Answers; motivo?: string }, actor: WorkflowActor, encaixe: boolean, exception = false) {
    return this.db.sequelize.transaction(async t => {
      // Same identity lock is acquired by registration, convocation and activation.
      const person = await this.db.MunicipeModel.findByPk(data.municipe_uuid, { transaction: t, lock: t.LOCK.UPDATE });
      if (!person) throw ftError(404, 'Municipe nao encontrado');
      const e = plain(await this.edital(id, t));
      if (exception) requireExceptionReason(data.motivo);
      registrationWindow(e, this.clock(), encaixe || exception, data.motivo);
      if (!person.nascimento) throw ftError(422, 'Cadastre o nascimento do municipe antes da inscricao');
      const nascimento = await this.crypto.decrypt(person.nascimento);
      eligible(nascimento, data.respostas, businessDate(this.clock()), e, exception);
      if ((await this.crypto.decrypt(person.cidade || '')).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() !== 'itapecerica da serra') throw ftError(422, 'Municipe deve residir em Itapecerica da Serra');
      const [bolsista] = await this.db.Bolsistas.findOrCreate({ where: { municipe_uuid: data.municipe_uuid }, defaults: { municipe_uuid: data.municipe_uuid }, transaction: t });
      const history = await this.db.BolsistasEdital.findAll({ where: { bolsista_id: bolsista.id }, transaction: t, paranoid: false });
      validateHistory(e, history.map(plain), businessDate(this.clock()), exception);
      if (await this.db.FtInscricao.findOne({ where: { edital_id: id, bolsista_id: bolsista.id }, transaction: t, paranoid: false })) throw ftError(409, 'Pessoa ja inscrita neste edital');
      const row = await this.db.FtInscricao.create({ edital_id: id, bolsista_id: bolsista.id,
        respostas: await this.crypto.encrypt(JSON.stringify(data.respostas)),
        snapshot: await this.crypto.encrypt(JSON.stringify(plain(person))), criado_por: Number(actor.id),
        ...(exception ? { excecao_motivo: data.motivo!.trim(), excecao_autor_id: String(actor.id), excecao_em: this.clock() } : {}),
        encaixe_motivo: this.clock() > new Date(e.inscricoes_fim) ? data.motivo : null }, { transaction: t });
      await this.event(t, actor, id, row.id, exception ? 'inscrever_excecao' : 'inscrever', exception ? data.motivo!.trim() : row.encaixe_motivo);
      return { id: row.id, bolsista_id: bolsista.id, status: row.status };
    });
  }
  async inscriptions(id: string, query: any) {
    await this.edital(id);
    const result = await this.db.FtInscricao.findAndCountAll({ where: { edital_id: id }, ...pageOptions(query), order: [['createdAt', 'DESC']] });
    const rows = await Promise.all(result.rows.map(async (row: any) => {
      const snapshot = JSON.parse(await this.crypto.decrypt(row.snapshot));
      const current = await this.db.BolsistasEdital.findOne({ where: { inscricao_id: row.id, status: occupied } });
      return { id: row.id, bolsista_id: row.bolsista_id, nome: snapshot.nome, status: row.status, situacao: current?.status || row.status, respostas: JSON.parse(await this.crypto.decrypt(row.respostas)), excecao_motivo: row.excecao_motivo, excecao_autor_id: row.excecao_autor_id, excecao_em: row.excecao_em, createdAt: row.createdAt };
    }));
    return { rows, count: result.count };
  }
  async call(id: string, inscriptionId: string, data: any, actor: WorkflowActor, exception = false) {
    if (exception) requireExceptionReason(data.motivo);
    const seed = await this.db.FtInscricao.findOne({ where: { id: inscriptionId, edital_id: id } });
    if (!seed) throw ftError(404, 'Inscricao nao encontrada');
    return this.withPerson(seed.bolsista_id, id, async (t, e) => {
      this.opened(e);
      const registration = await this.db.FtInscricao.findByPk(inscriptionId, { transaction: t, lock: t.LOCK.UPDATE });
      if (registration.status !== 'inscrito') throw ftError(409, 'Inscricao cancelada');
      const inicio = dateOnly(data.data_inicio);
      const snapshot = JSON.parse(await this.crypto.decrypt(registration.snapshot));
      eligible(await this.crypto.decrypt(snapshot.nascimento), JSON.parse(await this.crypto.decrypt(registration.respostas)), inicio, e, exception);
      const history = await this.db.BolsistasEdital.findAll({ where: { bolsista_id: seed.bolsista_id }, transaction: t, paranoid: false });
      validateHistory(e, history.map(plain), inicio, exception);
      const allocations = await this.allocation(t, e, data);
      const row = await this.db.BolsistasEdital.create({ ...allocations, inscricao_id: inscriptionId, edital_id: id,
        bolsista_id: seed.bolsista_id, data_vinculo: inicio + 'T12:00:00-03:00',
        expire_at: participationEnd(e, inicio) + 'T23:59:59-03:00', status: 'convocado',
        ...(exception ? { excecao_motivo: data.motivo.trim(), excecao_autor_id: String(actor.id), excecao_em: this.clock() } : {}) }, { transaction: t });
      await this.db.Edital.update({ primeira_convocacao_em: e.primeira_convocacao_em || this.clock() }, { where: { id }, transaction: t });
      await this.event(t, actor, id, row.id, exception ? 'convocar_excecao' : 'convocar', exception ? data.motivo.trim() : undefined);
      return plain(row);
    });
  }
  private async withPerson(bolsistaId: string, editalId: string, action: (t: Transaction, e: any) => Promise<any>) {
    const identity = await this.db.Bolsistas.findByPk(bolsistaId);
    if (!identity) throw ftError(404, 'Bolsista nao encontrado');
    return this.db.sequelize.transaction(async t => {
      await this.db.MunicipeModel.findByPk(identity.municipe_uuid, { transaction: t, lock: t.LOCK.UPDATE });
      const e = plain(await this.edital(editalId, t));
      return action(t, e);
    });
  }
  private async allocation(t: Transaction, e: any, data: any, excludeId?: string) {
    const pagador = await this.db.Pagador.findOne({ where: { uuid: data.pagador_id, edital_id: e.id }, transaction: t, lock: t.LOCK.UPDATE });
    const turno = await this.db.Turno.findOne({ where: { uuid: data.turno_id, edital_id: e.id }, transaction: t });
    const local = typeof data.local === 'string' ? data.local.trim() : '';
    if (!local || local.length > 255) throw ftError(422, 'Informe um local de trabalho com ate 255 caracteres');
    if (!pagador || !turno) throw ftError(422, 'Pagador e turno devem estar ativos neste edital');
    const where = { edital_id: e.id, status: occupied, ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}) };
    if (await this.db.BolsistasEdital.count({ where, transaction: t }) >= e.vagas) throw ftError(409, 'Edital sem vagas disponiveis');
    if (await this.db.BolsistasEdital.count({ where: { ...where, pagador_id: pagador.uuid }, transaction: t }) >= pagador.quantidade) throw ftError(409, 'Pagador sem capacidade disponivel');
    return { pagador_id: pagador.uuid, turno_id: turno.uuid, local_id: null, local,
      turno_nome_snapshot: turno.nome, turno_hora_inicio_snapshot: turno.hora_inicio, turno_hora_fim_snapshot: turno.hora_fim };
  }
  async participations(id: string, query: any) {
    await this.edital(id);
    const result = await this.db.BolsistasEdital.findAndCountAll({ where: { edital_id: id, ...(query.status ? { status: query.status } : {}) }, ...pageOptions(query), order: [['createdAt', 'DESC']] });
    const rows = await Promise.all(result.rows.map(async (row: any) => {
      const registration = await this.db.FtInscricao.findByPk(row.inscricao_id);
      const snapshot = registration ? JSON.parse(await this.crypto.decrypt(registration.snapshot)) : {};
      const pagador = await this.db.Pagador.findByPk(row.pagador_id, { paranoid: false });
      return { ...plain(row), nome: snapshot.nome || 'Participante', pagador_nome: pagador?.nome || 'Pagador indisponivel' };
    }));
    return { rows, count: result.count };
  }
  async transition(id: string, participationId: string, operation: 'ativar' | 'cancelar' | 'concluir' | 'prorrogar' | 'alocar', data: any, actor: WorkflowActor) {
    const seed = await this.db.BolsistasEdital.findOne({ where: { id: participationId, edital_id: id } });
    if (!seed) throw ftError(404, 'Participacao nao encontrada');
    return this.withPerson(seed.bolsista_id, id, async (t, e) => {
      this.opened(e);
      const row = await this.db.BolsistasEdital.findByPk(participationId, { transaction: t, lock: t.LOCK.UPDATE });
      if (operation === 'ativar') {
        if (row.status !== 'convocado') throw ftError(409, 'Somente convocado pode ser ativado');
        const inicio = dateOnly(data.data_inicio);
        const exception = Boolean(row.excecao_em && row.excecao_autor_id && row.excecao_motivo);
        const registration = await this.db.FtInscricao.findByPk(row.inscricao_id, { transaction: t });
        const snapshot = JSON.parse(await this.crypto.decrypt(registration.snapshot));
        eligible(await this.crypto.decrypt(snapshot.nascimento), JSON.parse(await this.crypto.decrypt(registration.respostas)), inicio, e, exception);
        const history = await this.db.BolsistasEdital.findAll({ where: { bolsista_id: row.bolsista_id, id: { [Op.ne]: row.id } }, paranoid: false, transaction: t });
        validateHistory(e, history.map(plain), inicio, exception);
        await this.allocation(t, e, plain(row), row.id);
        const p = data.payment_info;
        for (const field of ['bco', 'ag', 'dig_ag', 'conta', 'dig_conta']) if (!p?.[field]?.trim()) throw ftError(422, 'Dados de pagamento incompletos');
        const [payment] = await this.db.PaymentInfo.findOrCreate({ where: { bolsista_id: row.bolsista_id }, defaults: { ...p, bolsista_id: row.bolsista_id }, transaction: t });
        await payment.update(p, { transaction: t });
        await row.update({ status: 'ativo', ativado_em: this.clock(), data_vinculo: inicio + 'T12:00:00-03:00', expire_at: participationEnd(e, inicio) + 'T23:59:59-03:00' }, { transaction: t });
      } else if (operation === 'prorrogar') {
        const months = Number(e.prorrogacao_meses);
        if (row.status !== 'ativo' || row.prorrogated || !Number.isInteger(months) || months < 1) throw ftError(409, 'Prorrogacao indisponivel');
        const currentEnd = dateOnly(row.expire_at);
        if (currentEnd < businessDate(this.clock())) throw ftError(409, 'Vinculo ja expirou');
        const end = [addMonths(currentEnd, months), dateOnly(e.data_vencimento)].sort()[0];
        if (end <= currentEnd) throw ftError(409, 'Participacao ja alcanca o termino do edital');
        await row.update({ expire_at: end + 'T23:59:59-03:00', prorrogated: true }, { transaction: t });
      } else if (operation === 'alocar') {
        if (!occupied.includes(row.status)) throw ftError(409, 'Participacao encerrada');
        // Once active, changing allocation would rewrite past reports; reserve edits are safe.
        if (row.status !== 'convocado') throw ftError(409, 'Alocacao bloqueada apos ativacao');
        await row.update(await this.allocation(t, e, data, row.id), { transaction: t });
      } else {
        if (!data.motivo?.trim() || !occupied.includes(row.status) || (operation === 'concluir' && row.status !== 'ativo')) throw ftError(409, 'Transicao invalida ou motivo ausente');
        await row.update({ status: operation === 'concluir' ? 'concluido' : 'cancelado', [operation === 'concluir' ? 'concluded_at' : 'canceled_at']: this.clock(), observacao: data.motivo }, { transaction: t });
      }
      await this.event(t, actor, id, row.id, operation, data.motivo);
      return plain(row);
    });
  }
  async records(id: string, pid: string, kind: 'faltas' | 'ocorrencias', query: any) {
    const row = await this.db.BolsistasEdital.findOne({ where: { id: pid, edital_id: id } });
    if (!row) throw ftError(404, 'Participacao nao encontrada');
    return this.db[kind === 'faltas' ? 'BolsistaFalta' : 'BolsistaOcorrencia'].findAndCountAll({ where: { bolsista_edital_id: pid }, ...pageOptions(query), order: [['createdAt', 'DESC']] });
  }
  async pdfParticipant(id: string, pid: string, mes: string) {
    const row = await this.db.BolsistasEdital.findOne({ where: { id: pid, edital_id: id } });
    if (!row || !row.ativado_em) throw ftError(409, 'PDF exige participacao ativada neste edital');
    const end = dateOnly(row.canceled_at || row.concluded_at || row.expired_at || row.expire_at);
    if (dateOnly(row.data_vinculo).slice(0, 7) > mes || end.slice(0, 7) < mes) throw ftError(409, 'Participacao fora do mes solicitado');
    return String(row.bolsista_id);
  }
  async record(id: string, pid: string, kind: 'faltas' | 'ocorrencias', data: any, actor: WorkflowActor, deleteId?: string) {
    const seed = await this.db.BolsistasEdital.findOne({ where: { id: pid, edital_id: id } });
    if (!seed) throw ftError(404, 'Participacao nao encontrada');
    return this.withPerson(seed.bolsista_id, id, async (t, e) => {
      const row = await this.db.BolsistasEdital.findByPk(pid, { transaction: t, lock: t.LOCK.UPDATE });
      const Model = this.db[kind === 'faltas' ? 'BolsistaFalta' : 'BolsistaOcorrencia'];
      if (deleteId) {
        const item = await Model.findOne({ where: { id: deleteId, bolsista_edital_id: pid }, transaction: t });
        if (!item) throw ftError(404, 'Registro nao encontrado');
        await item.destroy({ transaction: t });
      } else {
        this.opened(e);
        if (!row.ativado_em || (kind === 'faltas' && row.status !== 'ativo')) throw ftError(409, 'Registro exige participacao ativada; faltas exigem vinculo ativo');
        const date = dateOnly(data[kind === 'faltas' ? 'data_falta' : 'data_ocorrencia']);
        const end = dateOnly(row.canceled_at || row.concluded_at || row.expired_at || row.expire_at);
        if (date < dateOnly(row.data_vinculo) || date > end || date > businessDate(this.clock())) throw ftError(422, 'Data fora da participacao ou no futuro');
        if (kind === 'faltas' && await Model.count({ where: { bolsista_edital_id: pid, data_falta: date }, transaction: t })) throw ftError(409, 'Falta ja registrada nesta data');
        await Model.create({ ...data, bolsista_edital_id: pid, bolsista_id: row.bolsista_id, edital_id: id, author_id: Number(actor.id) }, { transaction: t });
      }
      await this.event(t, actor, id, pid, (deleteId ? 'excluir_' : 'registrar_') + kind);
      return { ok: true };
    });
  }
}
