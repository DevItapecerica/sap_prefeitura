export class FtBolsistaFalta {
  constructor(
    public readonly bolsista_id: string,
    public readonly edital_id: string,
    public readonly data_falta: string,
    public readonly observacao?: string | null,
    public readonly id?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date | null,
  ) {}
}
