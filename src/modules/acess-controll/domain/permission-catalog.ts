import { permissionKey } from "./permission-key.js";

export const MODULE_SERVICE_IDS = {
  usuarios: 1,
  setores: 2,
  servicos: 3,
  roles: 4,
  ft: 6,
  iptu: 7,
  municipes: 9,
  esporte: 10,
  auditoria: 11,
} as const;
export type PermissionModule = keyof typeof MODULE_SERVICE_IDS;
export const FT_ESTOQUE_ACTIONS = [
  "consultar_estoque",
  "cadastrar_item_estoque",
  "editar_item_estoque",
  "excluir_item_estoque",
  "registrar_entrada_estoque",
  "ajustar_estoque",
  "entregar_kit_epi",
  "entregar_item_estoque",
  "consultar_entregas_estoque",
  "estornar_entrega_estoque",
] as const;
export const FT_WORKFLOW_ACTIONS = [
  ...FT_ESTOQUE_ACTIONS,
  "fechar_folha_pagamento",
  "cadastrar_inscricao_excecao",
  "convocar_inscrito_excecao",
  "consultar_inscricoes",
  "cadastrar_inscricao",
  "encaixar_inscricao",
  "alterar_janela_inscricoes",
  "convocar_inscrito",
  "ativar_participacao",
  "cancelar_participacao",
  "encerrar_edital",
  "consultar_configuracao_edital",
  "editar_configuracao_edital",
  "gerar_folha_presenca",
] as const;
const moduleActions = {
  usuarios: [
    "acessar",
    "consultar_usuario",
    "cadastrar_usuario",
    "editar_usuario",
    "alterar_senha_usuario",
    "excluir_usuario",
  ],
  setores: [
    "acessar",
    "consultar_setor",
    "cadastrar_setor",
    "editar_setor",
    "excluir_setor",
  ],
  servicos: [
    "acessar",
    "consultar_servico",
    "consultar_permissoes",
    "editar_servico",
    "gerenciar_permissoes",
  ],
  roles: [
    "acessar",
    "consultar_role",
    "cadastrar_role",
    "editar_role",
    "excluir_role",
  ],
  ft: [
    "acessar",
    "consultar_bolsista",
    "consultar_candidatos_vinculo",
    "consultar_aniversariantes",
    "consultar_vinculos_a_vencer",
    "consultar_vinculos",
    "consultar_historico_bolsista",
    "consultar_faltas",
    "consultar_ocorrencias",
    "gerar_espelho_ponto",
    "consultar_edital",
    "gerar_relatorio_edital",
    "gerar_relatorio_faltas",
    "gerar_lista_presenca",
    "consultar_downloads",
    "baixar_relatorio",
    "consultar_pagador",
    "consultar_turno",
    "cadastrar_bolsista",
    "registrar_falta",
    "registrar_ocorrencia",
    "cadastrar_edital",
    "vincular_bolsista",
    "solicitar_espelhos_ponto",
    "solicitar_folhas_presenca",
    "reprocessar_relatorio",
    "cadastrar_pagador",
    "cadastrar_turno",
    "editar_bolsista",
    "remover_bolsista",
    "prorrogar_vinculo",
    "editar_edital",
    "editar_vinculo",
    "editar_pagador",
    "editar_turno",
    "excluir_bolsista",
    "excluir_falta",
    "excluir_ocorrencia",
    "excluir_edital",
    "excluir_pagador",
    "excluir_turno",
    ...FT_WORKFLOW_ACTIONS,
  ],
  iptu: ["acessar"],
  municipes: [
    "acessar",
    "consultar_municipe",
    "cadastrar_municipe",
    "editar_municipe",
  ],
  esporte: [
    "acessar",
    "consultar_atleta",
    "consultar_carteirinha",
    "gerar_pdf_carteirinha",
    "consultar_modalidade",
    "cadastrar_atleta",
    "vincular_modalidade",
    "emitir_carteirinha",
    "cadastrar_modalidade",
    "editar_atleta",
    "editar_modalidade",
    "excluir_atleta",
    "remover_modalidade",
    "excluir_modalidade",
  ],
  auditoria: ["acessar", "consultar_auditoria", "exportar_auditoria"],
} as const;
export const FT_ESTOQUE_ACTIONS = ['consultar_estoque', 'cadastrar_item_estoque', 'editar_item_estoque', 'excluir_item_estoque', 'registrar_entrada_estoque', 'ajustar_estoque', 'entregar_kit_epi', 'entregar_item_estoque', 'consultar_entregas_estoque', 'estornar_entrega_estoque'] as const;
export const FT_BENEFICIOS_ACTIONS = ['consultar_entregas_beneficios', 'entregar_beneficios', 'estornar_entrega_beneficios', 'gerar_relatorio_beneficios'] as const;
export const FT_WORKFLOW_ACTIONS = [...FT_ESTOQUE_ACTIONS, ...FT_BENEFICIOS_ACTIONS, 'fechar_folha_pagamento', 'cadastrar_inscricao_excecao', 'convocar_inscrito_excecao', 'consultar_inscricoes', 'cadastrar_inscricao', 'encaixar_inscricao', 'alterar_janela_inscricoes', 'convocar_inscrito', 'ativar_participacao', 'cancelar_participacao', 'encerrar_edital', 'consultar_configuracao_edital', 'editar_configuracao_edital', 'gerar_folha_presenca'] as const;
export type PermissionActionName = typeof matrix[PermissionModule][LegacyFlag][number] | typeof FT_WORKFLOW_ACTIONS[number];
export interface CatalogEntry {
  readonly module: PermissionModule;
  readonly action: PermissionActionName;
  readonly serviceId: number;
}
export const PERMISSION_CATALOG: readonly CatalogEntry[] = Object.freeze(
  (Object.keys(moduleActions) as PermissionModule[]).flatMap((module) =>
    moduleActions[module].map((action) => {
      permissionKey(module, action);
      return Object.freeze({
        module,
        action,
        serviceId: MODULE_SERVICE_IDS[module],
      });
    }),
  ),
);
