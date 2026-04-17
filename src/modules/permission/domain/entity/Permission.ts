export class Permissions {
  constructor(
    public id: number,
    public role_id: number,
    public service_id: number,
    public read: boolean,
    public write: boolean,
    public edit: boolean,
    public del: boolean
  ) {}
}
