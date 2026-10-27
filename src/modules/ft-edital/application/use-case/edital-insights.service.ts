import { Op } from 'sequelize';
import { createHash } from 'node:crypto';
import type { DbObject } from '../../../../core/types/DbTypes.js';
import AesCryptService from '../../../../core/security/aes/AesCrypt.service.js';
import { participationSignals, paymentIssues } from '../../domain/services/edital-insights.policy.js';
import { ftError } from '../../../ft-bolsista/application/utils/ft-error.js';

const plain = (row: any) => row?.toJSON?.() ?? row;
const pagination = (q: any) => { const limit = Math.min(50, Math.max(1, Number(q.limit) || 20)); return { limit, offset: Math.max(0, Number(q.page) || 0) * limit }; };
const lifecycle = ['inscrever', 'inscrever_excecao', 'convocar', 'convocar_excecao', 'ativar', 'alocar', 'prorrogar', 'cancelar', 'concluir', 'expirar'];
export class EditalInsightsService {
  constructor(private db: DbObject, private crypto = new AesCryptService(), private clock = () => new Date()) {}
  private filters(query: any, inscriptions: boolean) {
    const conditions: any[] = [];
    const search = String(query.search || '').trim();
    if (search) {
      const digits = search.replace(/\D/g, '');
      conditions.push(digits.length === 11 && /^[\d.\s-]+$/.test(search)
        ? { '$bolsista.municipe.cpfHash$': createHash('sha256').update(digits).digest('hex') }
        : { '$bolsista.municipe.nome$': { [Op.like]: '%' + search.replace(/[\\%_]/g, '\\$&') + '%' } });
    }
    const prefix = inscriptions ? 'participacoes.' : '';
    for (const field of ['pagador_id', 'turno_id']) if (query[field]) conditions.push({ [inscriptions ? '$' + prefix + field + '$' : field]: query[field] });
    if (query.status) conditions.push(inscriptions ? { [Op.or]: [
      { '$participacoes.status$': query.status }, { '$participacoes.id$': null, status: query.status },
    ] } : { status: query.status });
    const registrationException = inscriptions ? 'excecao_em' : '$inscricao.excecao_em$';
    const convocationException = inscriptions ? '$participacoes.excecao_em$' : 'excecao_em';
    if (query.excecao === 'inscricao') conditions.push({ [registrationException]: { [Op.ne]: null } });
    if (query.excecao === 'convocacao') conditions.push({ [convocationException]: { [Op.ne]: null } });
    if (query.excecao === 'qualquer') conditions.push({ [Op.or]: [{ [registrationException]: { [Op.ne]: null } }, { [convocationException]: { [Op.ne]: null } }] });
    if (query.excecao === 'nenhuma') conditions.push({ [registrationException]: null, [convocationException]: null });
    return conditions.length ? { [Op.and]: conditions } : {};
  }
  async people(id: string, query: any, inscriptions: boolean) {
    const e = plain(await this.db.Edital.findByPk(id));
    if (!e) throw ftError(404, 'Edital nao encontrado');
    const include: any[] = [{ model: this.db.Bolsistas, as: 'bolsista', paranoid: false, required: true,
      include: [{ model: this.db.MunicipeModel, as: 'municipe', paranoid: false, required: true, attributes: ['uuid', 'nome'] },
        ...(!inscriptions ? [{ model: this.db.PaymentInfo, as: 'payment_info' }] : [])] }];
    if (inscriptions) include.push({ model: this.db.BolsistasEdital, as: 'participacoes', required: false, duplicating: false,
      where: { edital_id: id, status: ['convocado', 'ativo'] } });
    else include.push({ model: this.db.FtInscricao, as: 'inscricao', required: false }, { model: this.db.Pagador, as: 'pagador', paranoid: false });
    const Model = inscriptions ? this.db.FtInscricao : this.db.BolsistasEdital;
    const result = await Model.findAndCountAll({ where: { edital_id: id, ...this.filters(query, inscriptions) }, include,
      distinct: true, subQuery: false, ...pagination(query), order: [['createdAt', 'DESC'], ['id', 'DESC']] });
    const rows = await Promise.all(result.rows.map(async (model: any) => {
      const row = plain(model), registration = inscriptions ? row : row.inscricao;
      const snapshot = registration?.snapshot ? JSON.parse(await this.crypto.decrypt(registration.snapshot)) : {};
      const current = inscriptions ? row.participacoes?.[0] : row;
      const base = { id: row.id, bolsista_id: row.bolsista_id, nome: row.bolsista?.municipe?.nome || snapshot.nome || 'Participante',
        nome_inscricao: snapshot.nome || null, status: row.status, situacao: current?.status || row.status,
        excecao_motivo: row.excecao_motivo, excecao_autor_id: row.excecao_autor_id, excecao_em: row.excecao_em,
        inscricao_excepcional: Boolean(registration?.excecao_em), convocacao_excepcional: Boolean(current?.excecao_em), createdAt: row.createdAt };
      if (inscriptions) return { ...base, respostas: JSON.parse(await this.crypto.decrypt(row.respostas)), pagador_id: current?.pagador_id, turno_id: current?.turno_id };
      const { bolsista: _b, inscricao: _i, pagador: _p, ...participation } = row;
      return { ...participation, ...base, pagador_nome: row.pagador?.nome || 'Pagador indisponível', ...participationSignals(e, row, this.clock()),
        pagamento_pendente: paymentIssues(row.bolsista?.payment_info).length > 0 };
    }));
    return { rows, count: result.count };
  }
  async history(id: string, resource: string, inscriptions: boolean, query: any) {
    const row = await (inscriptions ? this.db.FtInscricao : this.db.BolsistasEdital).findOne({ where: { id: resource, edital_id: id }, paranoid: false });
    if (!row) throw ftError(404, 'Registro nao encontrado neste edital');
    const registration = inscriptions ? row : row.inscricao_id ? await this.db.FtInscricao.findOne({ where: { id: row.inscricao_id, edital_id: id }, paranoid: false }) : null;
    const participations = registration ? await this.db.BolsistasEdital.findAll({ where: { inscricao_id: registration.id, edital_id: id }, paranoid: false }) : [row];
    const ids = [...new Set([registration?.id, ...participations.map((p: any) => p.id)].filter(Boolean))];
    const events = await this.db.FtWorkflowEvento.findAll({ where: { edital_id: id, recurso_id: { [Op.in]: ids }, acao: { [Op.in]: lifecycle } }, order: [['createdAt', 'ASC'], ['id', 'ASC']] });
    const actors = [...new Set(events.map((event: any) => String(event.ator_id)).filter((actor: string) => /^\d+$/.test(actor)))];
    const users = actors.length ? await this.db.UserModel.findAll({ where: { id: { [Op.in]: actors } }, attributes: ['id', 'name'], paranoid: false }) : [];
    const names = new Map(users.map((user: any) => [String(user.id), user.name]));
    const rows: any[] = events.map((event: any) => ({ id: event.id, recurso_id: event.recurso_id, acao: event.acao, data: event.createdAt,
      responsavel: event.ator_id === 'sistema' ? 'Sistema' : names.get(String(event.ator_id)) || 'Usuário ' + event.ator_id + ' (nome indisponível)', motivo: event.motivo || null, origem: 'evento' }));
    const fallback = (resourceId: string, action: string, date: any, reason?: string) => {
      if (!rows.some(event => event.recurso_id === resourceId && (event.acao === action || event.acao === action + '_excecao'))) rows.push({ id: 'marco-' + resourceId + '-' + action, recurso_id: resourceId, acao: action, data: date || null, responsavel: 'Não registrado', motivo: reason || null, origem: 'marco' });
    };
    if (registration) fallback(registration.id, 'inscrever', registration.createdAt);
    for (const p of participations) {
      fallback(p.id, 'convocar', p.inscricao_id ? p.createdAt : null);
      if (!p.ativado_em && (['ativo', 'concluido', 'expirado'].includes(p.status) || p.prorrogated)) fallback(p.id, 'ativar', null);
      for (const [field, action] of [['ativado_em', 'ativar'], ['canceled_at', 'cancelar'], ['concluded_at', 'concluir'], ['expired_at', 'expirar']]) if (p[field]) fallback(p.id, action!, p[field], p.observacao);
      if (p.prorrogated) fallback(p.id, 'prorrogar', null);
    }
    rows.sort((a, b) => String(a.data ? new Date(a.data).toISOString() : '9999').localeCompare(String(b.data ? new Date(b.data).toISOString() : '9999')) || String(a.id).localeCompare(String(b.id)));
    const { offset, limit } = pagination(query);
    return { rows: rows.slice(offset, offset + limit), count: rows.length };
  }
}
