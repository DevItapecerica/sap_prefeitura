export default class Carterinha {
  constructor(

    public emissao: Date,
    public validade: Date | null,
    public setor_uuid: string,
    public atividade_uuid: string | null,
    public municipe_uuid: string,

    public uuid?: string,
    public numero_carterinha?: string,
    public author?: string,
    public createdAt?: Date,
    public updatedAt?: Date,
    public deletedAt?: Date | null,
  ) {


  }


}
