export default class Carterinha {
  constructor(
    public emissao: string,
    public validade: string | null,
    public setor: string,
    public servico: string,
    public municipe_uuid: string,

    public uuid?: string,
    public numero_carterinha?: string,
    public author?: string,
    public createdAt?: Date,
    public updatedAt?: Date,
    public deletedAt?: Date | null,
  ) {}


}
