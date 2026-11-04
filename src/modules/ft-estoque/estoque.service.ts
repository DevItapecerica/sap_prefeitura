import { createHash } from 'node:crypto';
import { Op, Transaction, literal } from 'sequelize';
import type { DbObject } from '../../core/types/DbTypes.js';
import { ftError } from '../ft-bolsista/application/utils/ft-error.js';
import { businessDate, dateOnly } from '../ft-edital/domain/services/edital-workflow.policy.js';
import type { RecordAuditDto } from '../audit/application/dto/audit.dto.js';

type Actor = { id: string | number; requestId: string };
type Audit = { record(data: RecordAuditDto, transaction?: unknown): Promise<unknown> };
const plain = (row: any): any => row?.toJSON?.() ?? row;
export const tamanhoKey = (value: string) => value.trim().replace(/\s+/g, ' ').normalize('NFKC').toLocaleUpperCase('pt-BR');
export function cents(value: number) {
  const rounded = Math.round(value * 100);
  if (!Number.isFinite(value) || value < 0 || rounded > 999999999 || Math.abs(value * 100 - rounded) > 0.000001) throw ftError(422, 'Informe um custo válido, com até duas casas decimais.');
  return rounded;
}
export function reason(value: any) {
  if (typeof value !== 'string' || value.trim().length < 3 || value.trim().length > 1000) throw ftError(422, 'Informe uma justificativa de 3 a 1000 caracteres.');
  return value.trim();
}
const quantity = (value: any, signed = false) => {
  if (!Number.isInteger(value) || value === 0 || Math.abs(value) > 1000000 || (!signed && value < 0)) throw ftError(422, 'Informe uma quantidade inteira válida.');
  return value as number;
};
const text = (value: any, max: number) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw ftError(422, 'Texto obrigatório ou acima do limite permitido.');
  return value.trim().replace(/\s+/g, ' ');
};
const canonical = (value: any): any => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const hash = (data: unknown) => createHash('sha256').update(JSON.stringify(canonical(data))).digest('hex');
const pagination = (q: any) => { const limit = Math.min(50, Math.max(1, Number(q.limit) || 20)); return { limit, offset: Math.max(0, Number(q.page) || 0) * limit }; };
const like = (s: any) => '%' + String(s || '').trim().replace(/[\\%_]/g, '\\$&') + '%';

export class EstoqueService {
  constructor(private db: DbObject, private audit: Audit, private clock = () => new Date()) {}

  private async required(model: string, id: string, transaction?: Transaction) {
    const row = await this.db[model].findByPk(id, { transaction });
    if (!row) throw ftError(404, 'Registro não encontrado.');
    return row;
  }
  private async participant(id: string, transaction?: Transaction, eligible = true) {
    const seed = await this.required('BolsistasEdital', id);
    const edital = await this.db.Edital.findByPk(seed.edital_id, { transaction, ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}) });
    const row = await this.db.BolsistasEdital.findByPk(id, { transaction, ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}) });
    if (!edital || !row) throw ftError(404, 'Participação ou edital indisponível.');
    if (eligible) {
      const today = businessDate(this.clock());
      if (edital.fase !== 'aberto' || today < dateOnly(edital.vigencia_inicio || edital.data_publicacao) || today > dateOnly(edital.data_vencimento)) throw ftError(409, 'O edital deve estar aberto e vigente.');
      if (!['convocado', 'ativo'].includes(row.status) || (row.status === 'ativo' && (!row.expire_at || dateOnly(row.expire_at) < today))) throw ftError(409, 'Somente convocados ou ativos não vencidos podem receber itens.');
    }
    return row;
  }
  /** All writers lock the catalog row. Deliveries first lock edital/participation,
   * matching the existing workflow; catalog writers never wait for edital locks. */
  private async write(operation: string, data: any, actor: Actor, work: (t: Transaction, control: any, participation?: any) => Promise<any>, participationId?: string) {
    if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(data.operacao_id || '')) throw ftError(422, 'Identificador da operação obrigatório.');
    const signature = hash({ operation, actor: String(actor.id), data });
    return this.db.sequelize.transaction(async t => {
      const participant = participationId ? await this.participant(participationId, t, false) : undefined;
      const control = await this.db.FtEstoqueControle.findByPk(1, { transaction: t, lock: t.LOCK.UPDATE });
      if (!control) throw ftError(503, 'Estoque não inicializado.');
      const previous = await this.db.FtEstoqueOperacao.findByPk(data.operacao_id, { transaction: t });
      if (previous) {
        if (previous.assinatura !== signature) throw ftError(409, 'Identificador de operação já utilizado com outros dados.');
        return JSON.parse(previous.resultado);
      }
      const result = await work(t, control, participant);
      await this.audit.record({ actor: { userId: actor.id }, action: operation.startsWith('criar') || operation.startsWith('entregar') || operation === 'entrada' ? 'CREATE' : 'UPDATE',
        module: 'ft-estoque', resourceType: 'estoque', resourceId: String(result.id), result: 'SUCCESS', requestId: actor.requestId,
        metadata: { operation, operacao_id: data.operacao_id } }, t);
      await this.db.FtEstoqueOperacao.create({ id: data.operacao_id, assinatura: signature, resultado: JSON.stringify(result) }, { transaction: t });
      return result;
    });
  }
  async items(q: any = {}) {
    const where: any = { ...(q.situacao === 'todos' ? {} : { ativo: q.situacao !== 'inativos' }), ...(q.search ? { nome: { [Op.like]: like(q.search) } } : {}), ...(q.epi != null ? { epi: q.epi === true || q.epi === 'true' } : {}) };
    if (q.tamanho) where.id = { [Op.in]: literal('(SELECT item_id FROM ft_estoque_variacoes WHERE tamanho_chave=' + this.db.sequelize.escape(tamanhoKey(q.tamanho)) + (q.situacao === 'todos' ? '' : ' AND ativo=' + (q.situacao === 'inativos' ? '0' : '1')) + ')') };
    const result = await this.db.FtEstoqueItem.findAndCountAll({ where, ...pagination(q), order: [['nome', 'ASC'], ['id', 'ASC']] });
    const sizes = result.rows.length ? await this.db.FtEstoqueVariacao.findAll({ where: { item_id: { [Op.in]: result.rows.map((r: any) => r.id) }, ativo: true } }) : [];
    return { count: result.count, rows: result.rows.map((r: any) => { const variations = sizes.filter((v: any) => v.item_id === r.id); return { ...plain(r), tamanhos_ativos: variations.length, saldo_total: variations.reduce((sum: number, v: any) => sum + Number(v.saldo), 0) }; }) };
  }
  private itemValues(data: any) {
    if (typeof data.epi !== 'boolean') throw ftError(422, 'Informe se o item é EPI.');
    return { nome: text(data.nome, 120), epi: data.epi, ativo: data.ativo ?? true };
  }
  private variationValues(itemId: string, data: any) {
    const tamanho = text(data.tamanho, 40);
    return { item_id: itemId, tamanho, tamanho_chave: text(tamanhoKey(tamanho), 40), custo_centavos: cents(data.custo_unitario), ativo: data.ativo ?? true };
  }
  async createComplete(data: any, actor: Actor) {
    return this.write('criar_item_completo', data, actor, async (t, control) => {
      if (!Array.isArray(data.tamanhos) || !data.tamanhos.length || data.tamanhos.length > 100) throw ftError(422, 'Cadastre entre 1 e 100 tamanhos.');
      const keys = new Set<string>();
      const entries = data.tamanhos.map((size: any) => {
        const values = this.variationValues('', size), initial = size.quantidade_inicial ?? 0;
        if (initial !== 0) quantity(initial);
        if (keys.has(values.tamanho_chave)) throw ftError(409, 'Não repita tamanhos no cadastro.');
        keys.add(values.tamanho_chave); return { values, initial };
      });
      const item = await this.db.FtEstoqueItem.create(this.itemValues(data), { transaction: t });
      const variacoes = [];
      for (const entry of entries) {
        const row = await this.db.FtEstoqueVariacao.create({ ...entry.values, item_id: item.id, saldo: 0 }, { transaction: t });
        if (entry.initial) await this.move(t, row, entry.initial, 'entrada', actor);
        variacoes.push({ ...plain(row), custo_unitario: Number(row.custo_centavos) / 100 });
      }
      await control.increment('versao', { transaction: t });
      return { ...plain(item), variacoes };
    });
  }
  async item(id: string) { return plain(await this.required('FtEstoqueItem', id)); }
  async saveItem(id: string | undefined, data: any, actor: Actor, remove = false) {
    return this.write(id ? 'editar_item' : 'criar_item', { ...data, id }, actor, async (t, control) => {
      const row = id ? await this.required('FtEstoqueItem', id, t) : null;
      const values = remove ? { ativo: false } : this.itemValues(data);
      const result = row ? await row.update(values, { transaction: t }) : await this.db.FtEstoqueItem.create(values, { transaction: t });
      await control.increment('versao', { transaction: t }); return plain(result);
    });
  }
  async variations(q: any = {}) {
    const parent = q.item_id ? await this.required('FtEstoqueItem', q.item_id) : null;
    const where: any = { ...(q.item_id ? { item_id: q.item_id } : {}), ...(q.situacao === 'todos' ? {} : { ativo: q.situacao !== 'inativos' }), ...(q.tamanho ? { tamanho_chave: tamanhoKey(q.tamanho) } : {}) };
    const result = await this.db.FtEstoqueVariacao.findAndCountAll({ where, ...pagination(q), order: [['tamanho_chave', 'ASC'], ['id', 'ASC']] });
    return { ...result, rows: result.rows.map((row: any) => ({ ...plain(row), custo_unitario: Number(row.custo_centavos) / 100 })), item: plain(parent) };
  }
  async variation(id: string) { const row = await this.required('FtEstoqueVariacao', id); return { ...plain(row), custo_unitario: Number(row.custo_centavos) / 100 }; }
  async saveVariation(itemId: string, id: string | undefined, data: any, actor: Actor, remove = false) {
    return this.write(id ? 'editar_variacao' : 'criar_variacao', { ...data, itemId, id }, actor, async (t, control) => {
      const parent = await this.required('FtEstoqueItem', itemId, t);
      const row = id ? await this.required('FtEstoqueVariacao', id, t) : null;
      if (row && row.item_id !== itemId) throw ftError(404, 'Tamanho não pertence ao item.');
      if (!parent.ativo && !remove) throw ftError(409, 'Reative o item antes de alterar seus tamanhos.');
      let values: any = { ativo: false };
      if (!remove) {
        const normalized = this.variationValues(itemId, data), key = normalized.tamanho_chave;
        const duplicate = await this.db.FtEstoqueVariacao.findOne({ where: { item_id: itemId, tamanho_chave: key, ...(id ? { id: { [Op.ne]: id } } : {}) }, transaction: t });
        if (duplicate) throw ftError(409, 'Tamanho já cadastrado neste item; reative o existente se necessário.');
        values = normalized;
      }
      const result = row ? await row.update(values, { transaction: t }) : await this.db.FtEstoqueVariacao.create({ ...values, saldo: 0 }, { transaction: t });
      await control.increment('versao', { transaction: t });
      return { ...plain(result), custo_unitario: Number(result.custo_centavos) / 100 };
    });
  }
  private async move(t: Transaction, variation: any, delta: number, tipo: string, actor: Actor, motivo?: string, entregaId?: string) {
    const saldo = Number(variation.saldo) + delta;
    if (!Number.isSafeInteger(saldo) || saldo < 0 || saldo > 1000000000) throw ftError(409, 'Saldo insuficiente ou acima do limite para o tamanho ' + variation.tamanho + '.');
    await variation.update({ saldo }, { transaction: t });
    return this.db.FtEstoqueMovimento.create({ variacao_id: variation.id, entrega_id: entregaId || null, tipo, delta, saldo_apos: saldo, autor_id: String(actor.id), data: this.clock(), motivo: motivo || null }, { transaction: t });
  }
  async stock(id: string, data: any, actor: Actor, adjustment: boolean) {
    return this.write(adjustment ? 'ajuste' : 'entrada', { ...data, id }, actor, async t => {
      const row = await this.required('FtEstoqueVariacao', id, t), parent = await this.required('FtEstoqueItem', row.item_id, t);
      if (!adjustment && (!row.ativo || !parent.ativo)) throw ftError(409, 'Reative o item e seu tamanho antes de registrar entrada.');
      return plain(await this.move(t, row, quantity(data.quantidade, adjustment), adjustment ? 'ajuste' : 'entrada', actor, adjustment ? reason(data.justificativa) : undefined));
    });
  }
  async movements(q: any) {
    const result = await this.db.FtEstoqueMovimento.findAndCountAll({ where: q.variacao_id ? { variacao_id: q.variacao_id } : {}, ...pagination(q), order: [['data', 'DESC'], ['id', 'DESC']] });
    const variations = result.rows.length ? await this.db.FtEstoqueVariacao.findAll({ where: { id: { [Op.in]: result.rows.map((r: any) => r.variacao_id) } } }) : [];
    const [items, actors] = await Promise.all([
      variations.length ? this.db.FtEstoqueItem.findAll({ where: { id: { [Op.in]: variations.map((v: any) => v.item_id) } } }) : [],
      result.rows.length ? this.db.UserModel.findAll({ where: { id: { [Op.in]: [...new Set(result.rows.map((r: any) => r.autor_id))] } }, paranoid: false }) : [],
    ]);
    return { count: result.count, rows: result.rows.map((r: any) => { const v = variations.find((v: any) => v.id === r.variacao_id); return { ...plain(r), tamanho: v?.tamanho, nome: items.find((i: any) => i.id === v?.item_id)?.nome, responsavel: actors.find((a: any) => String(a.id) === r.autor_id)?.name || 'Usuário ' + r.autor_id }; }) };
  }
  async recipients(q: any) {
    const today = businessDate(this.clock()), start = new Date(today + 'T00:00:00-03:00'), end = new Date(today + 'T23:59:59-03:00');
    const search = String(q.search || '').trim(), digits = search.replace(/\D/g, '');
    const where: any = { [Op.or]: [{ status: 'convocado' }, { status: 'ativo', expire_at: { [Op.gte]: start } }] };
    const result = await this.db.BolsistasEdital.findAndCountAll({ where, ...pagination(q), order: [['createdAt', 'DESC'], ['id', 'DESC']],
      include: [{ model: this.db.Edital, as: 'edital', required: true, attributes: ['id', 'name'], where: { fase: 'aberto', [Op.or]: [{ vigencia_inicio: { [Op.lte]: today } }, { vigencia_inicio: null }], data_vencimento: { [Op.gte]: start }, data_publicacao: { [Op.lte]: end } } },
        { model: this.db.Bolsistas, as: 'bolsista', required: true, attributes: ['id'], include: [{ model: this.db.MunicipeModel, as: 'municipe', required: true, attributes: ['uuid', 'nome'],
          ...(search ? { where: digits.length === 11 && /^[\d.\s-]+$/.test(search) ? { cpfHash: createHash('sha256').update(digits).digest('hex') } : { nome: { [Op.like]: like(search) } } } : {}) }] }], distinct: true, subQuery: false });
    return { rows: result.rows.map((r: any) => ({ id: r.id, status: r.status, nome: r.bolsista.municipe.nome, edital_id: r.edital_id, edital_nome: r.edital.name })), count: result.count };
  }
  private async catalog(t?: Transaction) {
    const [control, products, variations] = await Promise.all([
      this.db.FtEstoqueControle.findByPk(1, { transaction: t, ...(t ? { lock: t.LOCK.UPDATE } : {}) }), this.db.FtEstoqueItem.findAll({ where: { ativo: true }, order: [['id', 'ASC']], transaction: t }),
      this.db.FtEstoqueVariacao.findAll({ where: { ativo: true }, order: [['id', 'ASC']], transaction: t }),
    ]);
    if (!control) throw ftError(503, 'Estoque não inicializado.');
    const rows = products.map((p: any) => ({ id: p.id, nome: p.nome, epi: p.epi, variacoes: variations.filter((v: any) => v.item_id === p.id).map((v: any) => ({ ...plain(v), custo_unitario: Number(v.custo_centavos) / 100 })) }));
    // Hash the actual catalog as well as its revision, so an unlocked preview cannot
    // authorize a mixed result while a concurrent catalog transaction commits.
    const signature = rows.map((p: any) => ({ id: p.id, nome: p.nome, epi: p.epi, variacoes: p.variacoes.map((v: any) => ({ id: v.id, tamanho: v.tamanho, custo_centavos: v.custo_centavos })) }));
    return { rows, versao: hash([Number(control.versao), signature]) };
  }
  async preview(participacaoId: string) {
    const p = await this.participant(participacaoId);
    const [catalog, kit, person, edital] = await Promise.all([this.catalog(), this.db.FtEstoqueEntrega.findOne({ where: { kit_ativo_participacao_id: p.id } }), this.required('Bolsistas', p.bolsista_id), this.required('Edital', p.edital_id)]);
    const municipe = await this.required('MunicipeModel', person.municipe_uuid);
    return { ...catalog, participante: { id: p.id, nome: municipe.nome, edital_nome: edital.name }, kit_entregue: Boolean(kit), kit_entrega_id: kit?.id || null };
  }
  async deliver(tipo: 'kit' | 'individual', data: any, actor: Actor) {
    return this.write('entregar_' + tipo, data, actor, async (t, _control, p) => {
      await this.participant(p.id, t);
      const catalog = await this.catalog(t);
      if (data.versao !== catalog.versao) throw ftError(409, 'O catálogo ou os custos mudaram. Confira novamente a entrega.');
      if (tipo === 'kit' && await this.db.FtEstoqueEntrega.findOne({ where: { kit_ativo_participacao_id: p.id }, transaction: t })) throw ftError(409, 'Esta participação já recebeu um kit. Utilize entrega individual justificada.');
      const selected = data.itens;
      if (!Array.isArray(selected) || !selected.length) throw ftError(422, 'Selecione os itens da entrega.');
      const ids = new Set(selected.map((i: any) => i.variacao_id));
      if (ids.size !== selected.length || (tipo === 'individual' && selected.length !== 1)) throw ftError(422, 'Seleção de itens inválida.');
      const lines = selected.map((i: any) => {
        const product = catalog.rows.find((product: any) => product.variacoes.some((v: any) => v.id === i.variacao_id));
        const variation = product?.variacoes.find((v: any) => v.id === i.variacao_id);
        if (!variation) throw ftError(409, 'Item ou tamanho inativo ou indisponível.');
        return { product, variation, quantidade: quantity(i.quantidade) };
      });
      if (tipo === 'kit') {
        const required = catalog.rows.filter((p: any) => p.epi);
        if (!required.length || lines.length !== required.length || new Set(lines.map((l: any) => l.product.id)).size !== required.length || lines.some((l: any) => !l.product.epi || l.quantidade !== 1)) throw ftError(422, 'O kit deve conter uma unidade de cada tipo de EPI ativo.');
      }
      const total = lines.reduce((sum: number, l: any) => sum + Number(l.variation.custo_centavos) * l.quantidade, 0);
      if (!Number.isSafeInteger(total)) throw ftError(422, 'Custo total acima do limite.');
      const delivery = await this.db.FtEstoqueEntrega.create({ participacao_id: p.id, edital_id: p.edital_id, bolsista_id: p.bolsista_id, kit_ativo_participacao_id: tipo === 'kit' ? p.id : null,
        tipo, autor_id: String(actor.id), entregue_em: this.clock(), total_centavos: total, justificativa: tipo === 'individual' ? reason(data.justificativa) : null }, { transaction: t });
      for (const line of lines.sort((a: any, b: any) => a.variation.id.localeCompare(b.variation.id))) {
        const row = await this.required('FtEstoqueVariacao', line.variation.id, t);
        await this.move(t, row, -line.quantidade, 'entrega', actor, undefined, delivery.id);
        await this.db.FtEstoqueEntregaItem.create({ entrega_id: delivery.id, variacao_id: row.id, nome: line.product.nome, tamanho: row.tamanho, quantidade: line.quantidade, custo_centavos: row.custo_centavos }, { transaction: t });
      }
      return plain(delivery);
    }, data.participacao_id);
  }
  async deliveries(q: any) {
    const where: any = { ...(q.participacao_id ? { participacao_id: q.participacao_id } : {}), ...(q.tipo ? { tipo: q.tipo } : {}), ...(q.situacao === 'estornadas' ? { estornado_em: { [Op.ne]: null } } : q.situacao === 'vigentes' ? { estornado_em: null } : {}) };
    const search = String(q.search || '').trim(), digits = search.replace(/\D/g, '');
    if (search) {
      const condition = digits.length === 11 && /^[\d.\s-]+$/.test(search)
        ? 'm.cpfHash=' + this.db.sequelize.escape(createHash('sha256').update(digits).digest('hex'))
        : 'm.nome LIKE ' + this.db.sequelize.escape(like(search));
      where.bolsista_id = { [Op.in]: literal('(SELECT b.id FROM bolsistas b INNER JOIN municipes m ON m.uuid=b.municipe_uuid WHERE ' + condition + ')') };
    }
    const result = await this.db.FtEstoqueEntrega.findAndCountAll({ where, ...pagination(q), order: [['entregue_em', 'DESC'], ['id', 'DESC']] });
    return { count: result.count, rows: await this.deliverySummaries(result.rows) };
  }
  private async deliverySummaries(rows: any[]) {
    if (!rows.length) return [];
    const [people, editais, actors] = await Promise.all([
      this.db.Bolsistas.findAll({ where: { id: { [Op.in]: rows.map(r => r.bolsista_id) } }, paranoid: false }),
      this.db.Edital.findAll({ where: { id: { [Op.in]: rows.map(r => r.edital_id) } }, attributes: ['id', 'name'], paranoid: false }),
      this.db.UserModel.findAll({ where: { id: { [Op.in]: [...new Set(rows.flatMap(r => [r.autor_id, r.estornado_por]).filter(Boolean))] } }, attributes: ['id', 'name'], paranoid: false }),
    ]);
    const municipes = people.length ? await this.db.MunicipeModel.findAll({ where: { uuid: { [Op.in]: people.map((p: any) => p.municipe_uuid) } }, attributes: ['uuid', 'nome'], paranoid: false }) : [];
    const names = new Map(actors.map((a: any) => [String(a.id), a.name]));
    return rows.map(r => { const person = people.find((p: any) => p.id === r.bolsista_id); return { ...plain(r), total_centavos: Number(r.total_centavos),
      nome: municipes.find((m: any) => m.uuid === person?.municipe_uuid)?.nome || 'Bolsista indisponível', edital_nome: editais.find((e: any) => e.id === r.edital_id)?.name || 'Edital indisponível',
      responsavel: names.get(String(r.autor_id)) || 'Usuário ' + r.autor_id, responsavel_estorno: names.get(String(r.estornado_por)) || r.estornado_por || null }; });
  }
  async delivery(id: string) {
    const row = await this.required('FtEstoqueEntrega', id);
    const itens = await this.db.FtEstoqueEntregaItem.findAll({ where: { entrega_id: id }, order: [['nome', 'ASC'], ['id', 'ASC']] });
    return { ...(await this.deliverySummaries([row]))[0], itens: itens.map(plain) };
  }
  async reverse(id: string, data: any, actor: Actor) {
    const seed = await this.required('FtEstoqueEntrega', id);
    return this.write('estornar_entrega', { ...data, id }, actor, async t => {
      const row = await this.required('FtEstoqueEntrega', id, t);
      if (row.estornado_em) throw ftError(409, 'Entrega já estornada.');
      const motivo = reason(data.justificativa), lines = await this.db.FtEstoqueEntregaItem.findAll({ where: { entrega_id: id }, order: [['variacao_id', 'ASC']], transaction: t });
      for (const line of lines) await this.move(t, await this.required('FtEstoqueVariacao', line.variacao_id, t), Number(line.quantidade), 'estorno', actor, motivo, id);
      await row.update({ estornado_em: this.clock(), estornado_por: String(actor.id), motivo_estorno: motivo, kit_ativo_participacao_id: null }, { transaction: t });
      return plain(row);
    }, seed.participacao_id);
  }
}
