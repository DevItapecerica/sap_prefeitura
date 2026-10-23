import type { FastifyPluginAsync } from 'fastify';
import AuthMiddleware from '../../../auth/auth.middleware.js';
import { requirePermission } from '../../../acess-controll/interface/require-permission.js';
import { EditalWorkflowService, CONFIG_MODELS, ConfigKind } from '../../application/use-case/edital-workflow.service.js';
import AppError from '../../../../core/appError.js';
import errorResponseSchema from '../../../../core/schema/errorSchema.js';

const uuid = { type: 'string', format: 'uuid' };
const text = { type: 'string', minLength: 1, maxLength: 120 };
const date = { type: 'string', format: 'date' };
const instant = { type: 'string', format: 'date-time' };
const integer = (min = 0, max = 1000000) => ({ type: 'integer', minimum: min, maximum: max });
const object = (properties: Record<string, any>, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, required });
const motivo = { type: 'string', minLength: 3, maxLength: 1000, pattern: '\\S' };
const configuration = {
  idade_maxima: integer(18),
  name: text, data_publicacao: date, vigencia_inicio: date, data_vencimento: date,
  inscricoes_inicio: instant, inscricoes_fim: instant, vagas: integer(1), dia_pagamento: integer(1, 31),
  valor_bolsa: { type: 'number', minimum: 0, maximum: 99999999.99 },
  carga_semanal: { type: 'number', exclusiveMinimum: 0, maximum: 168 }, carga_mensal: { type: 'number', exclusiveMinimum: 0, maximum: 744 },
  duracao_meses: integer(1, 120), prorrogacao_meses: integer(0, 120),
  permitir_participacao_anterior: { type: 'boolean' }, permitir_retorno: { type: 'boolean' },
};
const answers = object({ desempregado: { type: 'boolean' }, possui_renda: { type: 'boolean' }, recebe_previdencia: { type: 'boolean' }, inicio_residencia: date,
  vulnerabilidade_atestada: { type: 'boolean' }, beneficiario_familiar: { type: 'boolean' }, aceite: { type: 'boolean' } });
const allocation = { pagador_id: uuid, turno_id: uuid, local: { type: 'string', minLength: 1, maxLength: 255, pattern: '\\S' } };
const payment = object({ bco: { type: 'string', pattern: '^\\d{1,3}$' }, ag: { type: 'string', pattern: '^\\d{1,4}$' }, dig_ag: { type: 'string', pattern: '^[0-9Xx]$' }, conta: { type: 'string', pattern: '^\\d{1,11}$' }, dig_conta: { type: 'string', pattern: '^[0-9Xx]$' } });
const itemProperties = {
  ...configuration, id: uuid, uuid, edital_id: uuid, inscricao_id: uuid, bolsista_id: uuid,
  idade_maxima: { type: ['integer', 'null'], minimum: 18 },
  nome: { type: 'string' }, status: { type: 'string' }, fase: { type: 'string' },
  situacao: { type: 'string' }, pagador_nome: { type: 'string' },
  quantidade: integer(), ocupacao: integer(), reservadas: integer(), ocupadas: integer(), disponiveis: integer(),
  respostas: answers, ...allocation,
  excecao_motivo: { type: ['string', 'null'] }, excecao_autor_id: { type: ['string', 'null'] }, excecao_em: { anyOf: [instant, { type: 'null' }] },
  data_vinculo: instant, expire_at: instant, ativado_em: { anyOf: [instant, { type: 'null' }] },
  turno_nome_snapshot: { type: 'string' }, prorrogated: { type: 'boolean' },
  descricao: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  data_falta: date, observacao: { anyOf: [{ type: 'string' }, { type: 'null' }] }, data_ocorrencia: date,
  hora_inicio: { type: 'string' }, hora_fim: { type: 'string' },
};
const item = { type: 'object', additionalProperties: true, properties: itemProperties };
const itemRef = { $ref: 'FtWorkflowItem#' };
const collection = { type: 'object', required: ['rows', 'count'], properties: { rows: { type: 'array', items: itemRef }, count: integer() } };
const query = object({ page: integer(), limit: integer(1, 50), search: { type: 'string', maxLength: 120 }, status: { type: 'string', enum: ['convocado', 'ativo', 'cancelado', 'concluido', 'expirado'] } }, []);

export function strictBody(schema: any, value: any): void {
  if (schema.type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (!schema.properties[key]) throw new AppError('Campo nao permitido: ' + key, 400);
      strictBody(schema.properties[key], child);
    }
  } else if (['boolean', 'number', 'integer', 'string'].includes(schema.type)) {
    const type = schema.type === 'integer' ? 'number' : schema.type;
    if (typeof value !== type) throw new AppError('Tipo de campo invalido', 400);
  }
}
export const EditalWorkflowRouter: FastifyPluginAsync<{ service?: EditalWorkflowService; audit?: () => Promise<void> }> = async (fastify, options) => {
  fastify.addSchema({ $id: 'FtWorkflowItem', ...item });
  const service = options.service ?? new EditalWorkflowService((await import('../../../../infra/database/sequelize/index.js')).default);
  fastify.addHook('preHandler', AuthMiddleware.verifyJWT);
  const allow = requirePermission('ft');
  const route = (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, action: string, body: any, handler: (r: any) => Promise<any>, list = false) => {
    const params = Object.fromEntries([...url.matchAll(/:([A-Za-z]+)/g)].map(m => [m[1], uuid]));
    fastify.route({ method, url,
      config: { audit: { failureAction: method === 'GET' ? 'VIEW' : method === 'POST' ? 'CREATE' : 'UPDATE', module: 'ft-edital', resourceType: 'edital_workflow', resourceIdParam: 'id', omitRequestedChanges: true } },
      schema: { tags: ['Frente de Trabalho - Edital'], security: [{ JWTToken: [] }], summary: action.replaceAll('_', ' '),
        ...(Object.keys(params).length ? { params: object(params) } : {}), ...(body ? { body } : {}), ...(method === 'GET' ? { querystring: query } : {}),
        response: { 200: list ? collection : itemRef, ...errorResponseSchema, 409: errorResponseSchema[400], 410: errorResponseSchema[400], 422: errorResponseSchema[400] } },
      preHandler: allow(action),
      preValidation: async r => { if (body) strictBody(body, r.body); },
      handler: async (r) => {
        const result = await handler(r);
        if (method !== 'GET') {
          // Durable, PII-free event is written in the business transaction. Central audit is a second sink.
          try {
            if (options.audit) await options.audit();
            else {
              const { makeAuditService } = await import('../../../audit/factories/makeAuditService.js');
              await makeAuditService().record({ actor: { userId: r.user.id }, action: method === 'POST' ? 'CREATE' : 'UPDATE', module: 'ft-edital', resourceType: 'edital_workflow', resourceId: String((r.params as any)?.id || result.id || ''), result: 'SUCCESS', requestId: r.id, metadata: { operation: action } });
            }
          } catch (err) { r.log.error({ err }, 'FT central audit unavailable; durable workflow event preserved'); }
        }
        return result;
      },
    });
  };
  const actor = (r: any) => ({ id: r.user.id, requestId: r.id });
  route('GET', '/', 'consultar_edital', null, r => service.list(r.query), true);
  route('POST', '/', 'cadastrar_edital', object(configuration), r => service.create(r.body, actor(r)));
  route('GET', '/:id', 'consultar_edital', null, r => service.detail(r.params.id));
  route('PUT', '/:id', 'editar_edital', object(configuration), r => service.update(r.params.id, r.body, actor(r)));
  route('PUT', '/:id/janela-inscricoes', 'alterar_janela_inscricoes', object({ inscricoes_inicio: instant, inscricoes_fim: instant, motivo }), r => service.window(r.params.id, r.body, actor(r)));
  route('POST', '/:id/abrir', 'editar_edital', null, r => service.phase(r.params.id, 'aberto', actor(r)));
  route('POST', '/:id/encerrar', 'encerrar_edital', null, r => service.phase(r.params.id, 'encerrado', actor(r)));
  for (const kind of Object.keys(CONFIG_MODELS) as ConfigKind[]) {
    const resource = kind === 'pagadores' ? 'pagador' : kind === 'turnos' ? 'turno' : 'configuracao_edital';
    const time = { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$' };
    const fields = kind === 'pagadores' ? { nome: text, quantidade: integer() } : kind === 'turnos' ? { nome: text, hora_inicio: time, hora_fim: time } : { nome: text, descricao: { type: 'string', maxLength: 2000 } };
    route('GET', '/:id/' + kind, 'consultar_' + resource, null, r => service.configs(r.params.id, kind, r.query), true);
    route('POST', '/:id/' + kind, resource === 'configuracao_edital' ? 'editar_configuracao_edital' : 'cadastrar_' + resource, object(fields), r => service.config(r.params.id, kind, undefined, r.body, actor(r)));
    route('PUT', '/:id/' + kind + '/:itemId', resource === 'configuracao_edital' ? 'editar_configuracao_edital' : 'editar_' + resource, object(fields), r => service.config(r.params.id, kind, r.params.itemId, r.body, actor(r)));
    route('DELETE', '/:id/' + kind + '/:itemId', resource === 'configuracao_edital' ? 'editar_configuracao_edital' : 'excluir_' + resource, null, r => service.config(r.params.id, kind, r.params.itemId, null, actor(r)));
  }
  route('GET', '/:id/inscricoes', 'consultar_inscricoes', null, r => service.inscriptions(r.params.id, r.query), true);
  const registration = object({ municipe_uuid: uuid, respostas: answers, motivo }, ['municipe_uuid', 'respostas']);
  route('POST', '/:id/inscricoes', 'cadastrar_inscricao', registration, r => service.register(r.params.id, r.body, actor(r), false));
  route('POST', '/:id/inscricoes/encaixe', 'encaixar_inscricao', object({ municipe_uuid: uuid, respostas: answers, motivo }), r => service.register(r.params.id, r.body, actor(r), true));
  route('POST', '/:id/inscricoes/excecao', 'cadastrar_inscricao_excecao', object({ municipe_uuid: uuid, respostas: answers, motivo }), r => service.register(r.params.id, r.body, actor(r), false, true));
  route('POST', '/:id/inscricoes/:inscricaoId/convocar', 'convocar_inscrito', object({ ...allocation, data_inicio: date }), r => service.call(r.params.id, r.params.inscricaoId, r.body, actor(r)));
  route('POST', '/:id/inscricoes/:inscricaoId/convocar-excecao', 'convocar_inscrito_excecao', object({ ...allocation, data_inicio: date, motivo }), r => service.call(r.params.id, r.params.inscricaoId, r.body, actor(r), true));
  route('GET', '/:id/participacoes', 'consultar_vinculos', null, r => service.participations(r.params.id, r.query), true);
  for (const [operation, action, body] of [
    ['ativar', 'ativar_participacao', object({ data_inicio: date, payment_info: payment })],
    ['cancelar', 'cancelar_participacao', object({ motivo })], ['concluir', 'cancelar_participacao', object({ motivo })],
    ['prorrogar', 'prorrogar_vinculo', object({})], ['alocar', 'editar_vinculo', object(allocation)],
  ] as const) route('POST', '/:id/participacoes/:participacaoId/' + operation, action, body, r => service.transition(r.params.id, r.params.participacaoId, operation, r.body, actor(r)));
  for (const kind of ['faltas', 'ocorrencias'] as const) {
    const singular = kind === 'faltas' ? 'falta' : 'ocorrencia';
    route('GET', '/:id/participacoes/:participacaoId/' + kind, 'consultar_' + kind, null, r => service.records(r.params.id, r.params.participacaoId, kind, r.query), true);
    const body = kind === 'faltas' ? object({ data_falta: date, observacao: { type: 'string', maxLength: 2000 } }, ['data_falta']) : object({ data_ocorrencia: date, descricao: { type: 'string', minLength: 1, maxLength: 2000 } });
    route('POST', '/:id/participacoes/:participacaoId/' + kind, 'registrar_' + singular, body, r => service.record(r.params.id, r.params.participacaoId, kind, r.body, actor(r)));
    route('DELETE', '/:id/participacoes/:participacaoId/' + kind + '/:itemId', 'excluir_' + singular, null, r => service.record(r.params.id, r.params.participacaoId, kind, {}, actor(r), r.params.itemId));
  }
  for (const kind of ['espelho-ponto', 'folha-presenca'] as const) {
    fastify.route<{ Params: { id: string; participacaoId: string }; Querystring: { mes: string } }>({
      method: "GET", url: '/:id/participacoes/:participacaoId/' + kind,
      config: { audit: { failureAction: 'EXPORT', module: 'ft-edital', resourceType: 'participacao_pdf', resourceIdParam: 'participacaoId' } },
      schema: { tags: ['Frente de Trabalho - Edital'], security: [{ JWTToken: [] }], params: object({ id: uuid, participacaoId: uuid }),
        querystring: object({ mes: { type: 'string', pattern: '^\\d{4}-(0[1-9]|1[0-2])$' } }),
        response: { 200: { description: 'PDF da participacao', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } }, ...errorResponseSchema, 409: errorResponseSchema[400] } },
      preHandler: allow(kind === 'espelho-ponto' ? 'gerar_espelho_ponto' : 'gerar_folha_presenca'),
      handler: async (r, reply) => {
        const person = await service.pdfParticipant(r.params.id, r.params.participacaoId, r.query.mes);
        const factory = kind === 'espelho-ponto' ? (await import('../../../ft-bolsista/factories/makeGerarEspelhoPontoBolsista.js')).makeGerarEspelhoPontoBolsista : (await import('../../../ft-bolsista/factories/makeGerarFolhaPresencaBolsista.js')).makeGerarFolhaPresencaBolsista;
        const pdf = await factory().execute(person, r.params.id, r.query.mes, r.id);
        return reply.type(pdf.contentType).header('Content-Disposition', pdf.contentDisposition).send(pdf.file);
      },
    });
  }
};
