-- Diagnóstico somente leitura para o bloqueio da migration de permissões.
-- Não remove registros, não escolhe uma visibilidade e não altera o schema.
SELECT setor_id, service_id, COUNT(*) AS quantidade,
       SUM(visibility = 1) AS visiveis,
       SUM(visibility = 0) AS ocultos,
       SUM(visibility IS NULL) AS indefinidos,
       (COUNT(DISTINCT COALESCE(CAST(visibility AS CHAR), 'NULL')) > 1) AS conflitante,
       GROUP_CONCAT(CONCAT(id, ':', COALESCE(CAST(visibility AS CHAR), 'NULL')) ORDER BY id) AS registros
FROM service_visibilities
GROUP BY setor_id, service_id
HAVING COUNT(*) > 1;

-- Detalhes sem nomes de pessoas, setores ou serviços.
SELECT v.id, v.setor_id, v.service_id, v.visibility
FROM service_visibilities v
JOIN (
  SELECT setor_id, service_id
  FROM service_visibilities
  GROUP BY setor_id, service_id
  HAVING COUNT(*) > 1
) d ON d.setor_id = v.setor_id AND d.service_id = v.service_id
ORDER BY v.setor_id, v.service_id, v.id;

-- Verificar referências antes de propor QUALQUER reparo de duplicatas.
SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME = 'service_visibilities';
