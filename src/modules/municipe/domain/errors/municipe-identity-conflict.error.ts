export class MunicipeIdentityConflictError extends Error {
  constructor() {
    super("Municipe identity already exists");
    this.name = "MunicipeIdentityConflictError";
  }
}
