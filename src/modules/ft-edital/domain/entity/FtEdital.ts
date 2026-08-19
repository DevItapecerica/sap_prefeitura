export class FtEdital {
  constructor(
    public readonly name: string,
    public readonly data_publicacao: string | Date,
    public readonly data_vencimento: string | Date,
    public readonly dia_pagamento: number,
    public readonly valor_bolsa: number | string,
    public readonly status = "ativo",
    public readonly id?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date | null,
  ) {}
}
