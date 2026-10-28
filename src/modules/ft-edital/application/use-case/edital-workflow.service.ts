import { assertCompetenciasAbertas, nextCivilDay } from '../../domain/services/ft-folha-fechada.policy.js';
import { getVinculoOperationalEnd } from '../../domain/services/ft-vinculo-period.service.js';
import { Op, Transaction } from 'sequelize';
import { EditalInsightsService } from './edital-insights.service.js';
import { extensionEnd, paymentIssues } from '../../domain/services/edital-insights.policy.js';
import AppError from '../../../../core/appError.js';
import type { DbObject } from '../../../../core/types/DbTypes.js';
import AesCryptService from '../../../../core/security/aes/AesCrypt.service.js';
import { ftError } from '../../../ft-bolsista/application/utils/ft-error.js';
import { Answers, businessDate, dateOnly, eligible, participationEnd, registrationWindow, validateConfiguration, validateHistory, requireExceptionReason } from '../../domain/services/edital-workflow.policy.js';

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
      if (e.primeira_convocacao_em || await this.db.FtFolhaFechamento.count({ where: { edital_id: id }, transaction: t })) {
        for (const field of ['data_publicacao', 'vigencia_inicio', 'valor_bolsa', 'dia_pagamento', 'carga_semanal', 'carga_mensal', 'duracao_meses', 'prorrogacao_meses', 'permitir_participacao_anterior', 'permitir_retorno']) {
          const same = ['data_publicacao', 'vigencia_inicio'].includes(field) ? dateOnly(data[field]) === dateOnly(e[field]) : typeof data[field] === 'number' ? Number(data[field]) === Number(e[field]) : String(data[field]) === String(e[field]);
          if (!same) throw ftError(409, 'Condicoes bloqueadas apos convocacao ou fechamento de folha: ' + field);
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
        const affected = await this.db.BolsistasEdital.findAll({ where: { edital_id: id, status: occupied }, transaction: t });
        for (const participation of affected) if (participation.ativado_em) await this.assertEndChange(id, participation, t);
        for (const participation of affected) await this.event(t, actor, id, participation.id, participation.status === 'convocado' ? 'cancelar' : 'concluir', 'Edital encerrado');
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
    const result = await this.db[CONFIG_MODELS[kind]].findAndCountAll({ where: { edital_id: id, ...(query.search ? { nome: { [Op.like]: '%' + String(query.search).trim() + '%' } } : {}) }, ...pageOptions(query), order: [['nome', 'ASC']] });
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
  async inscriptions(id: string, query: any) { return new EditalInsightsService(this.db, this.crypto, this.clock).people(id, query, true); }
  async history(id: string, resource: string, inscriptions: boolean, query: any) { return new EditalInsightsService(this.db, this.crypto, this.clock).history(id, resource, inscriptions, query); }
  async call(id: string, inscriptionId: string, data: any, actor: WorkflowActor, exception = false) {
    if (exception) requireExceptionReason(data.motivo);
    const seed = await this.db.FtInscricao.findOne({ where: { id: inscriptionId, edital_id: id } });
    if (!seed) throw ftError(404, 'Inscricao nao encontrada');
    return this.withPerson(seed.bolsista_id, id, async (t, e) => {
      this.opened(e);
      const registration = await this.db.FtInscricao.findByPk(inscriptionId, { transaction: t, lock: t.LOCK.UPDATE });
      if (registration.status !== 'inscrito') throw ftError(409, 'Inscricao cancelada');
      const inicio = dateOnly(data.data_inicio);
      await assertCompetenciasAbertas(this.db, id, inicio, participationEnd(e, inicio), t);
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
  private async allocation(t: Transaction | undefined, e: any, data: any, excludeId?: string) {
    const pagador = await this.db.Pagador.findOne({ where: { uuid: data.pagador_id, edital_id: e.id }, transaction: t, ...(t ? { lock: t.LOCK.UPDATE } : {}) });
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
  async participations(id: string, query: any) { return new EditalInsightsService(this.db, this.crypto, this.clock).people(id, query, false); }
  async transition(id: string, participationId: string, operation: 'ativar' | 'cancelar' | 'concluir' | 'prorrogar' | 'alocar', data: any, actor: WorkflowActor) {
    const seed = await this.db.BolsistasEdital.findOne({ where: { id: participationId, edital_id: id } });
    if (!seed) throw ftError(404, 'Participacao nao encontrada');
    return this.withPerson(seed.bolsista_id, id, async (t, e) => {
      this.opened(e);
      const row = await this.db.BolsistasEdital.findByPk(participationId, { transaction: t, lock: t.LOCK.UPDATE });
      if (operation === 'ativar') {
        if (row.status !== 'convocado') throw ftError(409, 'Somente convocado pode ser ativado');
        const inicio = dateOnly(data.data_inicio);
        await assertCompetenciasAbertas(this.db, id, inicio, participationEnd(e, inicio), t);
        const exception = Boolean(row.excecao_em && row.excecao_autor_id && row.excecao_motivo);
        const registration = await this.db.FtInscricao.findByPk(row.inscricao_id, { transaction: t });
        const snapshot = JSON.parse(await this.crypto.decrypt(registration.snapshot));
        eligible(await this.crypto.decrypt(snapshot.nascimento), JSON.parse(await this.crypto.decrypt(registration.respostas)), inicio, e, exception);
        const history = await this.db.BolsistasEdital.findAll({ where: { bolsista_id: row.bolsista_id, id: { [Op.ne]: row.id } }, paranoid: false, transaction: t });
        validateHistory(e, history.map(plain), inicio, exception);
        await this.allocation(t, e, plain(row), row.id);
        const p = data.payment_info;
        if (paymentIssues(p).length) throw ftError(422, 'Dados de pagamento incompletos ou invalidos');
        const [payment] = await this.db.PaymentInfo.findOrCreate({ where: { bolsista_id: row.bolsista_id }, defaults: { ...p, bolsista_id: row.bolsista_id }, transaction: t });
        await payment.update(p, { transaction: t });
        await row.update({ status: 'ativo', ativado_em: this.clock(), data_vinculo: inicio + 'T12:00:00-03:00', expire_at: participationEnd(e, inicio) + 'T23:59:59-03:00' }, { transaction: t });
      } else if (operation === 'prorrogar') {
        const end = extensionEnd(e, row, this.clock());
        await assertCompetenciasAbertas(this.db, id, nextCivilDay(dateOnly(row.expire_at)), end, t);
        await row.update({ expire_at: end + 'T23:59:59-03:00', prorrogated: true }, { transaction: t });
      } else if (operation === 'alocar') {
        if (!occupied.includes(row.status)) throw ftError(409, 'Participacao encerrada');
        // Once active, changing allocation would rewrite past reports; reserve edits are safe.
        if (row.status !== 'convocado') throw ftError(409, 'Alocacao bloqueada apos ativacao');
        await row.update(await this.allocation(t, e, data, row.id), { transaction: t });
      } else {
        if (!data.motivo?.trim() || !occupied.includes(row.status) || (operation === 'concluir' && row.status !== 'ativo')) throw ftError(409, 'Transicao invalida ou motivo ausente');
        if (row.ativado_em) await this.assertEndChange(id, row, t);
        await row.update({ status: operation === 'concluir' ? 'concluido' : 'cancelado', [operation === 'concluir' ? 'concluded_at' : 'canceled_at']: this.clock(), observacao: data.motivo }, { transaction: t });
      }
      await this.event(t, actor, id, row.id, operation, data.motivo);
      return plain(row);
    });
  }
  private async assertEndChange(id: string, row: any, transaction: Transaction) {
    const today = businessDate(this.clock()), end = getVinculoOperationalEnd(row);
    const start = [nextCivilDay(today), dateOnly(row.data_vinculo)].sort().pop()!;
    await assertCompetenciasAbertas(this.db, id, start, end, transaction);
  }
  async prevalidate(id: string, operation: 'inscricao' | 'convocacao' | 'ativacao' | 'prorrogacao', data: any, mode: 'normal' | 'encaixe' | 'excecao' = 'normal') {
    const e = plain(await this.edital(id));
    const pendencias: Array<{ codigo: string; mensagem: string; campo: string | null }> = [];
    const check = async (codigo: string, campo: string | null, validate: () => any) => {
      try { await validate(); } catch (error) {
        if (!(error instanceof AppError)) throw error;
        pendencias.push({ codigo, campo, mensagem: error.message });
      }
    };
    const required = (field: string) => { if (!data[field]) { pendencias.push({ codigo: 'OBRIGATORIO', campo: field, mensagem: 'Preencha ' + field + '.' }); return false; } return true; };
    const output: any = { permitido: false, pendencias, data_referencia: businessDate(this.clock()) };
    let registration: any, person: any, row: any, bolsista: any;
    if (operation === 'inscricao') {
      await check('JANELA', null, () => registrationWindow(e, this.clock(), mode !== 'normal', data.motivo));
      if (mode === 'excecao') await check('JUSTIFICATIVA', 'motivo', () => requireExceptionReason(data.motivo));
      if (required('municipe_uuid')) {
        person = await this.db.MunicipeModel.findByPk(data.municipe_uuid);
        if (!person) throw ftError(404, 'Municipe nao encontrado');
        bolsista = await this.db.Bolsistas.findOne({ where: { municipe_uuid: data.municipe_uuid } });
        if (bolsista && await this.db.FtInscricao.findOne({ where: { edital_id: id, bolsista_id: bolsista.id }, paranoid: false })) pendencias.push({ codigo: 'INSCRICAO_DUPLICADA', campo: 'municipe_uuid', mensagem: 'Pessoa ja inscrita neste edital' });
        await check('RESIDENCIA', null, async () => {
          if ((await this.crypto.decrypt(person.cidade || '')).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() !== 'itapecerica da serra') throw ftError(422, 'Municipe deve residir em Itapecerica da Serra');
        });
      }
    } else {
      await check('VIGENCIA', null, () => this.opened(e));
      if (operation === 'convocacao') {
        if (required('inscricao_id')) registration = await this.db.FtInscricao.findOne({ where: { id: data.inscricao_id, edital_id: id } });
        if (data.inscricao_id && !registration) throw ftError(404, 'Inscricao nao encontrada neste edital');
        if (registration && registration.status !== 'inscrito') pendencias.push({ codigo: 'STATUS', campo: null, mensagem: 'Inscricao cancelada' });
        if (mode === 'excecao') await check('JUSTIFICATIVA', 'motivo', () => requireExceptionReason(data.motivo));
      } else {
        if (required('participacao_id')) row = await this.db.BolsistasEdital.findOne({ where: { id: data.participacao_id, edital_id: id } });
        if (data.participacao_id && !row) throw ftError(404, 'Participacao nao encontrada neste edital');
        if (row && operation === 'prorrogacao') await check('PRORROGACAO', null, async () => { output.novo_termino = extensionEnd(e, row, this.clock()); await assertCompetenciasAbertas(this.db, id, nextCivilDay(dateOnly(row.expire_at)), output.novo_termino); });
        if (row && operation === 'ativacao') {
          if (row.status !== 'convocado') pendencias.push({ codigo: 'STATUS', campo: null, mensagem: 'Somente convocado pode ser ativado' });
          registration = row.inscricao_id ? await this.db.FtInscricao.findOne({ where: { id: row.inscricao_id, edital_id: id } }) : null;
          if (!registration) pendencias.push({ codigo: 'INSCRICAO', campo: null, mensagem: 'Inscricao indisponivel para validar a ativacao' });
          pendencias.push(...paymentIssues(data.payment_info).map(issue => ({ ...issue, campo: issue.campo })));
        }
      }
      if (registration) bolsista = await this.db.Bolsistas.findByPk(registration.bolsista_id);
    }
    if (operation !== 'prorrogacao') {
      const exception = operation === 'ativacao' ? Boolean(row?.excecao_em && row.excecao_autor_id && row.excecao_motivo) : mode === 'excecao';
      const snapshot = registration ? JSON.parse(await this.crypto.decrypt(registration.snapshot)) : null;
      const birth = person?.nascimento || snapshot?.nascimento;
      const answers = operation === 'inscricao' ? data.respostas : registration ? JSON.parse(await this.crypto.decrypt(registration.respostas)) : null;
      const reference = operation === 'inscricao' ? businessDate(this.clock()) : data.data_inicio;
      if (operation !== 'inscricao') {
        required('data_inicio');
        if (data.data_inicio) await check('FOLHA_FECHADA', 'data_inicio', () => assertCompetenciasAbertas(this.db, id, dateOnly(data.data_inicio), participationEnd(e, dateOnly(data.data_inicio))));
      }
      if (person || registration) await check('REQUISITOS', null, async () => {
        if (!birth) throw ftError(422, 'Cadastre o nascimento do municipe');
        if (!answers?.inicio_residencia || !reference) throw ftError(422, 'Preencha as declaracoes e a data de referencia');
        eligible(await this.crypto.decrypt(birth), answers, reference, e, exception);
      });
      if (bolsista && reference) {
        const history = await this.db.BolsistasEdital.findAll({ where: { bolsista_id: bolsista.id, ...(row ? { id: { [Op.ne]: row.id } } : {}) }, paranoid: false });
        await check('HISTORICO', null, () => validateHistory(e, history.map(plain), reference, exception));
      }
      if (operation !== 'inscricao') {
        const allocation = row ? { ...plain(row), ...data } : data;
        for (const field of ['pagador_id', 'turno_id', 'local']) if (!allocation[field]) pendencias.push({ codigo: 'OBRIGATORIO', campo: field, mensagem: 'Preencha ' + field + '.' });
        if (allocation.pagador_id && allocation.turno_id && allocation.local) await check('ALOCACAO', null, () => this.allocation(undefined, e, allocation, row?.id));
        // Show the edital capacity before all allocation fields have been filled.
        if (!allocation.pagador_id || !allocation.turno_id || !allocation.local) {
          const where = { edital_id: id, status: occupied, ...(row ? { id: { [Op.ne]: row.id } } : {}) };
          if (await this.db.BolsistasEdital.count({ where }) >= e.vagas) pendencias.push({ codigo: 'VAGAS', campo: null, mensagem: 'Edital sem vagas disponiveis' });
          if (allocation.pagador_id) {
            const payer = await this.db.Pagador.findOne({ where: { uuid: allocation.pagador_id, edital_id: id } });
            if (!payer || await this.db.BolsistasEdital.count({ where: { ...where, pagador_id: allocation.pagador_id } }) >= payer.quantidade) pendencias.push({ codigo: 'CAPACIDADE', campo: 'pagador_id', mensagem: 'Pagador sem capacidade disponivel' });
          }
        }
        if (reference) await check('INICIO', 'data_inicio', () => { output.termino_previsto = participationEnd(e, reference); });
      }
    }
    output.permitido = pendencias.length === 0;
    return output;
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
        const date = dateOnly(item[kind === 'faltas' ? 'data_falta' : 'data_ocorrencia']);
        await assertCompetenciasAbertas(this.db, id, date, date, t);
        await item.destroy({ transaction: t });
      } else {
        this.opened(e);
        if (!row.ativado_em || (kind === 'faltas' && row.status !== 'ativo')) throw ftError(409, 'Registro exige participacao ativada; faltas exigem vinculo ativo');
        const date = dateOnly(data[kind === 'faltas' ? 'data_falta' : 'data_ocorrencia']);
        await assertCompetenciasAbertas(this.db, id, date, date, t);
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
