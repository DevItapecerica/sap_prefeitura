export class User {
  constructor(
    public id: number,
    public name: string,
    public email: string,
    public ramal: string,
    public password: string,
    public setor_id: number,
    public firstLogin: boolean,
    public role_id: number,

    public createdAt: Date,
    public updatedAt: Date,
    public deletedAt: Date | null,
  ) {}
}
