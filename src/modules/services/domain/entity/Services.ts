export class Services {
  constructor(
    public id: number,
    public name: string,
    public description: string,
    public tag: string,
    public url: string,
    public createdAt: Date,
    public updatedAt: Date,
    public deletedAt: Date,
  ) {}
}
