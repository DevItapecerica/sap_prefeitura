export default class Municipe {
  constructor(
    private nome: string,
    private cpf: string,
    private nascimento: string,
    private telefone: string | null,
    private rua: string,
    private bairro: string,
    private cidade: string,
    private uf: string,
    private cep: string,
    private numero: string,
    private complemento: string | null,
    private author: string,

    private uuid?: string,
    private createdAt?: Date,
    private updatedAt?: Date,
    private deletedAt?: Date | null,
  ) {}

  getSensitiveData() {
    return {
      uuid: this.uuid,
      nome: this.nome,
      cpf: this.cpf,
      nascimento: this.nascimento,
      telefone: this.telefone,
      rua: this.rua,
      bairro: this.bairro,
      cidade: this.cidade,
      uf: this.uf,
      cep: this.cep,
      numero: this.numero,
      complemento: this.complemento,
      author: this.author,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
