const plain = (value: any): Record<string, unknown> =>
  typeof value?.toJSON === "function" ? value.toJSON() : { ...value };

export const atletaAuditSnapshot = (atleta: any): Record<string, unknown> => {
  const snapshot = plain(atleta);
  delete snapshot.municipe;
  return snapshot;
};

export const modalidadeAuditSnapshot = (
  modalidade: any,
): Record<string, unknown> => plain(modalidade);

export const carterinhaAuditSnapshot = (
  carterinha: any,
): Record<string, unknown> => {
  const snapshot = plain(carterinha);
  delete snapshot.foto;
  return snapshot;
};
