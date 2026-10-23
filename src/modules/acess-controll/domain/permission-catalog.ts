import { permissionKey } from './permission-key.js';

export const MODULE_SERVICE_IDS = {
  usuarios: 1, setores: 2, servicos: 3, roles: 4, demandas_ti: 5,
  ft: 6, iptu: 7, municipes: 9, esporte: 10, auditoria: 11,
} as const;
export type PermissionModule = keyof typeof MODULE_SERVICE_IDS;
export type LegacyFlag = 'read' | 'write' | 'edit' | 'del';

// Migration-only metadata. Runtime authorization must use the persisted grants.
const matrix = {
  usuarios: { read: ['acessar', 'consultar_usuario'], write: ['cadastrar_usuario'], edit: ['editar_usuario', 'alterar_senha_usuario'], del: ['excluir_usuario'] },
  setores: { read: ['acessar', 'consultar_setor'], write: ['cadastrar_setor'], edit: ['editar_setor'], del: ['excluir_setor'] },
  servicos: { read: ['acessar', 'consultar_servico', 'consultar_permissoes'], write: [], edit: ['editar_servico', 'gerenciar_permissoes'], del: [] },
  roles: { read: ['acessar', 'consultar_role'], write: ['cadastrar_role'], edit: ['editar_role'], del: ['excluir_role'] },
  demandas_ti: { read: ['acessar'], write: [], edit: [], del: [] },
  ft: {
    read: ['acessar', 'consultar_bolsista', 'consultar_candidatos_vinculo', 'consultar_aniversariantes', 'consultar_vinculos_a_vencer', 'consultar_vinculos', 'consultar_historico_bolsista', 'consultar_faltas', 'consultar_ocorrencias', 'gerar_espelho_ponto', 'consultar_edital', 'gerar_relatorio_edital', 'gerar_relatorio_faltas', 'gerar_lista_presenca', 'consultar_downloads', 'baixar_relatorio', 'consultar_pagador', 'consultar_turno'],
    write: ['cadastrar_bolsista', 'registrar_falta', 'registrar_ocorrencia', 'cadastrar_edital', 'vincular_bolsista', 'solicitar_espelhos_ponto', 'solicitar_folhas_presenca', 'reprocessar_relatorio', 'cadastrar_pagador', 'cadastrar_turno'],
    edit: ['editar_bolsista', 'remover_bolsista', 'prorrogar_vinculo', 'editar_edital', 'editar_vinculo', 'editar_pagador', 'editar_turno'],
    del: ['excluir_bolsista', 'excluir_falta', 'excluir_ocorrencia', 'excluir_edital', 'excluir_pagador', 'excluir_turno'],
  },
  iptu: { read: ['acessar'], write: [], edit: [], del: [] },
  municipes: { read: ['acessar', 'consultar_municipe'], write: ['cadastrar_municipe'], edit: ['editar_municipe'], del: [] },
  esporte: { read: ['acessar', 'consultar_atleta', 'consultar_carteirinha', 'gerar_pdf_carteirinha', 'consultar_modalidade'], write: ['cadastrar_atleta', 'vincular_modalidade', 'emitir_carteirinha', 'cadastrar_modalidade'], edit: ['editar_atleta', 'editar_modalidade'], del: ['excluir_atleta', 'remover_modalidade', 'excluir_modalidade'] },
  auditoria: { read: ['acessar', 'consultar_auditoria'], write: ['exportar_auditoria'], edit: [], del: [] },
} as const;
export const FT_WORKFLOW_ACTIONS = ['cadastrar_inscricao_excecao', 'convocar_inscrito_excecao', 'consultar_inscricoes', 'cadastrar_inscricao', 'encaixar_inscricao', 'alterar_janela_inscricoes', 'convocar_inscrito', 'ativar_participacao', 'cancelar_participacao', 'encerrar_edital', 'consultar_configuracao_edital', 'editar_configuracao_edital', 'gerar_folha_presenca'] as const;
export type PermissionActionName = typeof matrix[PermissionModule][LegacyFlag][number] | typeof FT_WORKFLOW_ACTIONS[number];
export interface CatalogEntry {
  readonly module: PermissionModule;
  readonly action: PermissionActionName;
  readonly legacyFlag: LegacyFlag | null;
  readonly serviceId: number;
}
export const PERMISSION_CATALOG: readonly CatalogEntry[] = Object.freeze(
  [...(Object.keys(matrix) as PermissionModule[]).flatMap(module =>
    (Object.keys(matrix[module]) as LegacyFlag[]).flatMap(legacyFlag =>
      matrix[module][legacyFlag].map(action => {
        permissionKey(module, action);
        return Object.freeze({ module, action, legacyFlag, serviceId: MODULE_SERVICE_IDS[module] });
      }),
    ),
  ), ...FT_WORKFLOW_ACTIONS.map(action => Object.freeze({ module: 'ft' as const, action, legacyFlag: null, serviceId: 6 }))],
);
