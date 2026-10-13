import { FtPaymentInfo } from "./FtPaymentInfo.js";

export class FtBolsista {
  public readonly municipe_uuid: string;
  public readonly municipe?: Record<string, any>;
  public readonly payment_info?: FtPaymentInfo;
  public readonly id?: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
  public readonly deletedAt?: Date | null;
  private readonly legacyLocal?: string;
  private readonly legacyStatus?: string;

  constructor(...args: any[]) {
    if (args.length > 7) {
      const [nome, cpf, local, cep, numero, logradouro, bairro, cidade, uf, telefone, status, paymentInfo, id, createdAt, updatedAt, deletedAt] = args;
      this.municipe_uuid = "";
      this.municipe = { nome, cpf, cep, numero, rua: logradouro, bairro, cidade, uf, telefone };
      this.legacyLocal = local;
      this.legacyStatus = status;
      this.payment_info = paymentInfo;
      this.id = id;
      this.createdAt = createdAt;
      this.updatedAt = updatedAt;
      this.deletedAt = deletedAt;
      return;
    }

    [this.municipe_uuid, this.municipe, this.payment_info, this.id, this.createdAt, this.updatedAt, this.deletedAt] = args;
  }

  get nome() { return this.municipe?.nome; }
  get cpf() { return this.municipe?.cpf; }
  get local() { return this.legacyLocal; }
  get status() { return this.legacyStatus; }
}
