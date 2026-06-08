export default class Municipe {
  constructor(
    public nome: string,
    public cpf: string,
    public nascimento: string,
    public telefone: string | null,
    public rua: string,
    public bairro: string,
    public cidade: string,
    public uf: string,
    public cep: string,
    public numero: string,
    public complemento: string | null,
    public author: string | number,

    public uuid?: string,
    public createdAt?: Date,
    public updatedAt?: Date,
    public deletedAt?: Date | null,
  ) {}
}
