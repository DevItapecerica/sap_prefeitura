export interface VinculoPeriodo {
  inicio: string;
  fim: string;
}

export const toDateOnly = (value?: string | Date | null): string => {
  if (!value) return "";
  return value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value).slice(0, 10);
};

export const getVinculoOperationalEnd = (vinculo: any): string =>
  toDateOnly(
    vinculo?.canceled_at ||
      vinculo?.concluded_at ||
      vinculo?.expired_at ||
      vinculo?.expire_at,
  );

export const vinculoIntersectsPeriod = (
  vinculo: any,
  periodo: VinculoPeriodo,
): boolean => {
  const inicio = toDateOnly(vinculo?.data_vinculo);
  const fim = getVinculoOperationalEnd(vinculo);
  return Boolean(inicio) && inicio <= periodo.fim && (!fim || fim >= periodo.inicio);
};

export const selectLatestVinculoForPeriod = (
  vinculos: any[],
  periodo: VinculoPeriodo,
): any | null =>
  vinculos
    .map((item) => item?.toJSON?.() ?? item)
    .filter((item) => vinculoIntersectsPeriod(item, periodo))
    .sort((left, right) => {
      const byStart = toDateOnly(right.data_vinculo).localeCompare(toDateOnly(left.data_vinculo));
      return byStart || toDateOnly(right.createdAt).localeCompare(toDateOnly(left.createdAt));
    })[0] ?? null;

export const resolveTurnoSnapshot = (vinculo: any) => ({
  nome: vinculo?.turno_nome_snapshot || vinculo?.turno?.nome || null,
  hora_inicio:
    vinculo?.turno_hora_inicio_snapshot || vinculo?.turno?.hora_inicio || null,
  hora_fim: vinculo?.turno_hora_fim_snapshot || vinculo?.turno?.hora_fim || null,
});
