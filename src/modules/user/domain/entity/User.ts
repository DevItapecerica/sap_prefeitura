export class User {
  constructor(
    public name: string,
    public email: string,
    public ramal: string | null,
    public setor_id: number | null,
    public role_id: number,

    public id?: number,
    public firstLogin?: boolean,
    public password?: string,
    public createdAt?: Date,
    public updatedAt?: Date,
    public deletedAt?: Date | null,
  ) {}

  IsValidEmail() {
    return String(this.email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );
  }
}
