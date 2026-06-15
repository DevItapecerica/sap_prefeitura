export default class Modalidade {
  constructor(
    public nome: string,
    public uuid?: string,
    public createdAt?: Date,
    public updatedAt?: Date,
    public deletedAt?: Date | null,
  ) {}
}
