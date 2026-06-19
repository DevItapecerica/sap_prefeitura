export default class CarterinhaEsporte {
  constructor(
    public emissao: Date,
    public validade: Date | null,
    public municipe_uuid: string,
    public modalidade: string,
    public author: string | number,
    public observacao?: string | null,
    public validade_exame?: Date | null,
    public uuid?: string,
    public createdAt?: Date,
    public updatedAt?: Date,
    public deletedAt?: Date | null,
  ) {}
}
