import { FtPaymentInfo } from "./FtPaymentInfo.js";

export class FtBolsista {
  constructor(
    public readonly nome: string,
    public readonly cpf: string,
    public readonly local: string,
    public readonly cep: string,
    public readonly numero: string,
    public readonly logradouro: string,
    public readonly bairro: string,
    public readonly cidade: string,
    public readonly uf: string,
    public readonly telefone?: string | null,
    public readonly status = "inativo",
    public readonly payment_info?: FtPaymentInfo,
    public readonly id?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date | null,
  ) {}
}
