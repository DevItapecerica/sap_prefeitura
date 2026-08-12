import { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import { ISha256Crypt } from "../../../../core/security/sha256/sha256.interface.js";
import Municipe from "../../domain/entity/Municipe.js";

export class MunicipeMapper {
  constructor(
    private aesCrypt: IAesCrypt,
    private sha256Crypt: ISha256Crypt,
  ) {}
  async toDomain(municipe: Municipe): Promise<Municipe> {
    const decryptNullable = (value: string | null) => value === null ? Promise.resolve(null) : this.aesCrypt.decrypt(value);
    return new Municipe(
      municipe.nome,
      await this.aesCrypt.decrypt(municipe.cpf),
      await this.aesCrypt.decrypt(municipe.nascimento),
      await decryptNullable(municipe.telefone),
      await this.aesCrypt.decrypt(municipe.rua),
      await this.aesCrypt.decrypt(municipe.bairro),
      await this.aesCrypt.decrypt(municipe.cidade),
      await this.aesCrypt.decrypt(municipe.uf),
      await this.aesCrypt.decrypt(municipe.cep),
      await this.aesCrypt.decrypt(municipe.numero),
      await decryptNullable(municipe.complemento),
      municipe.author,
      municipe.uuid,
      municipe.createdAt,
      municipe.updatedAt,
      municipe.deletedAt,
      municipe.cpfHash,
      municipe.cepHash,
    );
  }

  async toPersistence(
    municipe: Municipe,
  ): Promise<{ municipe: Municipe; cpfHash: string; cepHash: string }> {
    const encryptNullable = (value: string | null) => value === null ? Promise.resolve(null) : this.aesCrypt.encrypt(value);
    const cpfHash = await this.sha256Crypt.encrypt(municipe.cpf);
    const cepHash = await this.sha256Crypt.encrypt(municipe.cep);
    const persistence = new Municipe(
      municipe.nome,
      await this.aesCrypt.encrypt(municipe.cpf),
      await this.aesCrypt.encrypt(municipe.nascimento),
      await encryptNullable(municipe.telefone),
      await this.aesCrypt.encrypt(municipe.rua),
      await this.aesCrypt.encrypt(municipe.bairro),
      await this.aesCrypt.encrypt(municipe.cidade),
      await this.aesCrypt.encrypt(municipe.uf),
      await this.aesCrypt.encrypt(municipe.cep),
      await this.aesCrypt.encrypt(municipe.numero),
      await encryptNullable(municipe.complemento),
      municipe.author,
      municipe.uuid,
      municipe.createdAt,
      municipe.updatedAt,
      municipe.deletedAt,
      cpfHash,
      cepHash,
    );

    return {
      municipe: persistence,
      cpfHash,
      cepHash,
    };
  }
}
