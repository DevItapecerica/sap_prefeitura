export class FtBolsistaEdital {
  constructor(
    public readonly bolsista_id: string,
    public readonly edital_id: string,
    public readonly data_vinculo: string | Date,
    public readonly status = "ativo",
    public readonly expire_at?: string | Date | null,
    public readonly prorrogated = false,
    public readonly id?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date | null,
  ) {}
}
