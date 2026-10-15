# Backend — folhas de presença

- Adicionar o tipo do lote a `ft_relatorio_arquivos`, preservando os registros existentes como `espelhos_ponto`.
- Expor a solicitação de folhas por edital e mês com permissão e auditoria do serviço 6.
- Fazer o worker selecionar o gerador pelo tipo e criar ZIP completo ou parcial com um PDF por bolsista.
- Selecionar vínculos que interceptem o mês e usar o mais recente quando houver histórico duplicado.
- Preencher a situação diária como `Normal`, `Folga`, `DSR` ou `Fora do vínculo`, sem carregar faltas ou demais dados de frequência.
- Atualizar OpenAPI e cobrir migração, fila, retry, falhas e regressão dos espelhos.
