# Bootstrap para banco novo

Branch: feature/bootstrap-banco-novo. Pedido: substituir toda a sequencia historica de migrations/seeds por uma instalacao limpa.

## Escopo

- Criar o schema atual diretamente, preservando contratos, chaves estrangeiras, indices, criptografia e IDs dos servicos ativos.
- Remover tabelas auxiliares de conversao, permissoes CRUD legadas e estado de backfill; retirar os models/associacoes sem consumidores runtime.
- Nao cadastrar servicos aposentados, dados pessoais de exemplo, bolsistas, editais, pagadores ou entregas.
- Seeds separados para catalogos tecnicos, permissoes e administrador inicial. Outros perfis comecam sem concessoes. Bootstrap do primeiro administrador habilita o catalogo inicial; reexecucoes nao restauram revogacoes nem concedem futuras acoes automaticamente.
- Nova primeira migration recusa schema preexistente. Nao converter nem apagar a base corrente. IDs e URLs ativos permanecem estaveis.
- Substituir testes de conversao por testes de instalacao limpa, FKs, idempotencia e preservacao de dados; adaptar os harnesses de workflow, folha, estoque e permissoes.
- Atualizar README, exemplos, documentacao e CI pertinente. Implementacao inicialmente sem publicacao; commit e push autorizados posteriormente pelo usuario.

## Evidencias

- Instancia MariaDB 11.8 isolada em 127.0.0.1:33327, datadir exclusivo em .tmp; usuario de teste restrito aos schemas descartaveis.
- Sequencia anterior executada apenas nessa instancia para capturar o schema de referencia: 44 tabelas. A nova instalacao descartara as seis tabelas exclusivas do legado/conversao.
- Copia dos fontes anteriores preservada em .tmp/fresh-bootstrap-original-source para confronto local; nao sera publicada como migrations executaveis.

## Entrega

- Substituidas 45 migrations e 12 seeds historicas por sete migrations iniciais e tres seeds. Schema final com 38 tabelas; seis tabelas exclusivas de legado/conversao deixam de existir.
- Grupos: core/acesso, municipes, esporte, PEAAD, folha, estoque e auditoria/outbox. Preservados tipos, defaults, collations, FKs e indices da referencia; alteracoes intencionais: idade maxima NOT NULL sem default e unicidade setor/servico na visibilidade.
- Mantidos nove servicos ativos, IDs 1,2,3,4,6,7,9,10,11. Demandas TI e Chamados nao sao cadastrados. Catalogo atual com 108 acoes.
- Primeiro administrador exige BOOTSTRAP_ADMIN_EMAIL/PASSWORD em qualquer ambiente, hash e firstLogin; recebe concessoes iniciais persistidas. Outros perfis sem concessoes. Seeds repetidos preservam senhas, revogacoes, visibilidade, nomes e versao do controle de estoque. Acoes futuras nao recebem concessao automatica.
- Removidos model/associacoes CRUD sem uso. Harnesses SQL agora instalam a nova linha base. O harness de permissoes chama o CLI real e recusa schema preenchido, sem reset.
- Quality ganhou job MariaDB 10.11 descartavel com instalacao, seeds e autorizacao runtime. Esse job foi revisado localmente, nao executado no GitHub nesta entrega.
- READMEs da raiz/backend, guias de PEAAD/permissoes, .env.example e docs/bootstrap-banco-novo.md atualizados. Documentos historicos anteriores nao sao instrucoes de implantacao da linha base nova.

## Resultados de validacao — 2026-11-06

- Node 22.23.4: check, check:architecture e build aprovados; nao existe comando lint separado no backend.
- Suite completa: 411 testes aprovados, zero falhas. Cobertura: linhas/statements 93,14%, funcoes 96,08%, branches 90,15%; limites existentes mantidos.
- Safety: 22 testes aprovados; guardas recusam alvo ausente, remoto, privilegiado ou sem sufixo de teste antes de conectar.
- Tests novos de schema/seeds: 10 aprovados, incluindo idempotencia, credenciais, concessoes, rollback atomico e recusa de banco preenchido.
- MariaDB 11.8 isolado: referencia da cadeia anterior comparada com a instalacao direta; tipos/defaults/collations, todas as FKs e indices preservados nas 38 tabelas finais. Up/down/up vazio aprovado; tentativa sobre schema populado recusada sem DDL.
- CLI real: sete migrations e tres seeds executadas; reexecucao preservou contas/senhas, revogacoes, visibilidades e IDs. FK composta, unicidade, disputa concorrente e rollback aprovados.
- Autorizacao runtime SQL aprovada: revogacao, setor, servico oculto/excluido, usuario excluido, acoes independentes e rollback.
- Harness completo PEAAD aprovado: inscricoes/excecoes, ultima vaga, ativacao/rollback, pagamentos, prorrogacao, scheduler, encerramento, folha criptografada/imutavel, conflitos de versao, concorrencia fechamento/ativacao e estoque/kit unico/saldos/estorno/snapshots.
- OpenAPI regenerado e comparado: contrato publico identico; artefatos originais preservados sem diff cosmetico. YAML do workflow parseado e configuracao de banco/JWT conferida.
- Logs locais em .tmp/fresh-final-coverage.log, fresh-permissions-cli.log, fresh-permissions-runtime.log e fresh-peaad-workflow.log.
- Nenhuma migration ou seed aplicada a base corrente. Apos validacao, usuario autorizou separar commits e publicar a branch feature/bootstrap-banco-novo.
