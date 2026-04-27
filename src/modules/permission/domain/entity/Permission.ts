export class Permissions {
  constructor(
    public service_id: number,
    public role_id: number,
    public read: boolean,
    public write: boolean,
    public edit: boolean,
    public del: boolean,

    public id?: number,
  ) {}
}
