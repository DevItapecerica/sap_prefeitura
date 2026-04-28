export default class Carterinha {
  constructor(
    private numero_carterinha: string,
    private nome: string,
    private cpf: string,
    private nascimento: string,
    private telefone: string | null,
    private emissao: string,
    private validade: string | null,
    private rua: string,
    private bairro: string,
    private cidade: string,
    private uf: string,
    private cep: string,
    private numero: string,
    private complemento: string | null,
    private setor: string,
    private servico: string,

    private uuid?: string,
    private author?: string,
    private createdAt?: Date,
    private updatedAt?: Date,
    private deletedAt?: Date | null,
  ) {}

  getMasked() {
    return {
      uuid: this.uuid,
      numero_carterinha: this.numero_carterinha,
      nome: this.nome[0] + "***",
      cpf: this.cpf.replace(/\d(?=\d{2})/g, "*"),
      nascimento: this.nascimento
        ? new Date(this.nascimento).getFullYear()
        : null,
      cidade: this.cidade,
      uf: this.uf,
      setor: this.setor,
      servico: this.servico,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      author: this.author,
    };
  }

  getSensitiveData() {
    return {
      uuid: this.uuid,
      numero_carterinha: this.numero_carterinha,
      nome: this.nome,
      cpf: this.cpf,
      nascimento: this.nascimento,
      telefone: this.telefone,
      emissao: this.emissao,
      validade: this.validade,
      rua: this.rua,
      bairro: this.bairro,
      cidade: this.cidade,
      uf: this.uf,
      cep: this.cep,
      numero: this.numero,
      complemento: this.complemento,
      setor: this.setor,
      servico: this.servico,
      author: this.author,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
