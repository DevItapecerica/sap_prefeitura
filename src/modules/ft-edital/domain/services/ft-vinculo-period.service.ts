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

export const getVinculoOperationalEnd = (source: any): string => {
  const vinculo = source?.toJSON?.() ?? source;
  return toDateOnly(
    vinculo?.canceled_at ||
      vinculo?.concluded_at ||
      vinculo?.expired_at ||
      vinculo?.expire_at,
  );
};

export const vinculoIntersectsPeriod = (
  vinculo: any,
  periodo: VinculoPeriodo,
): boolean => {
  const inicio = toDateOnly(vinculo?.data_vinculo);
  const fim = getVinculoOperationalEnd(vinculo);
  return (
    Boolean(inicio) && inicio <= periodo.fim && (!fim || fim >= periodo.inicio)
  );
};

export const selectLatestVinculoForPeriod = (
  vinculos: any[],
  periodo: VinculoPeriodo,
): any | null =>
  vinculos
    .map((item) => item?.toJSON?.() ?? item)
    .filter((item) => vinculoIntersectsPeriod(item, periodo))
    .sort((left, right) => {
      const byStart = toDateOnly(right.data_vinculo).localeCompare(
        toDateOnly(left.data_vinculo),
      );
      return (
        byStart ||
        toDateOnly(right.createdAt).localeCompare(toDateOnly(left.createdAt))
      );
    })[0] ?? null;

export const selectVinculosForPeriod = (
  vinculos: any[],
  periodo: VinculoPeriodo,
): any[] =>
  vinculos
    .map((item) => item?.toJSON?.() ?? item)
    .filter((item) => vinculoIntersectsPeriod(item, periodo))
    .sort((left, right) => {
      const byStart = toDateOnly(left.data_vinculo).localeCompare(
        toDateOnly(right.data_vinculo),
      );
      return (
        byStart ||
        String(left.createdAt ?? "").localeCompare(
          String(right.createdAt ?? ""),
        )
      );
    });

export const hasOverlappingVinculos = (vinculos: any[]): boolean => {
  const ordered = vinculos
    .map((item) => item?.toJSON?.() ?? item)
    .filter((item) => toDateOnly(item?.data_vinculo))
    .sort((left, right) =>
      toDateOnly(left.data_vinculo).localeCompare(
        toDateOnly(right.data_vinculo),
      ),
    );

  for (let index = 1; index < ordered.length; index += 1) {
    const previousEnd = getVinculoOperationalEnd(ordered[index - 1]);
    const currentStart = toDateOnly(ordered[index].data_vinculo);
    if (!previousEnd || currentStart <= previousEnd) return true;
  }
  return false;
};

export const selectCurrentVinculo = (vinculos: any[]): any | null =>
  vinculos
    .map((item) => item?.toJSON?.() ?? item)
    .filter(Boolean)
    .sort((left, right) => {
      const activePriority =
        Number(right.status === "ativo") - Number(left.status === "ativo");
      if (activePriority) return activePriority;
      const byStart = toDateOnly(right.data_vinculo).localeCompare(
        toDateOnly(left.data_vinculo),
      );
      if (byStart) return byStart;
      const byCreation = String(right.createdAt ?? "").localeCompare(
        String(left.createdAt ?? ""),
      );
      return (
        byCreation ||
        String(right.id ?? "").localeCompare(String(left.id ?? ""))
      );
    })[0] ?? null;

export const buildLegacyEditaisFromVinculos = (vinculos: any[]): any[] => {
  const grouped = new Map<string, any[]>();
  for (const source of vinculos) {
    const vinculo = source?.toJSON?.() ?? source;
    if (!vinculo?.edital_id) continue;
    const editalId = String(vinculo.edital_id);
    grouped.set(editalId, [...(grouped.get(editalId) ?? []), vinculo]);
  }

  return [...grouped.entries()].map(([editalId, links]) => {
    const selected = selectCurrentVinculo(links)!;
    const { edital: nestedEdital, ...through } = selected;
    const edital = nestedEdital?.toJSON?.() ?? nestedEdital ?? {};
    return {
      ...edital,
      id: edital.id ?? editalId,
      BolsistasEdital: through,
    };
  });
};

export const resolveTurnoSnapshot = (vinculo: any) => ({
  nome: vinculo?.turno_nome_snapshot || vinculo?.turno?.nome || null,
  hora_inicio:
    vinculo?.turno_hora_inicio_snapshot || vinculo?.turno?.hora_inicio || null,
  hora_fim:
    vinculo?.turno_hora_fim_snapshot || vinculo?.turno?.hora_fim || null,
});
