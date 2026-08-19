import { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import { ISha256Crypt } from "../../../../core/security/sha256/sha256.interface.js";
import Municipe from "../../domain/entity/Municipe.js";

export class MunicipeMapper {
  constructor(
    private aesCrypt: IAesCrypt,
    private sha256Crypt: ISha256Crypt,
  ) {}
  private fieldsToEncrypt = [
    "cpf",
    "nascimento",
    "telefone",
    "rua",
    "bairro",
    "cidade",
    "uf",
    "cep",
    "numero",
    "complemento",
  ];

  async toDomain(municipe: Municipe): Promise<Municipe> {
    const data: Record<string, any> = {};

    for (const [key, value] of Object.entries(municipe)) {
      if (value === null || !this.fieldsToEncrypt.includes(key)) {
        data[key] = value;
      } else if (value !== undefined) {
        data[key] = await this.aesCrypt.decrypt(String(value));
      }
    }

    return this.toEntity(data);
  }

  async toPersistence(
    municipe: any,
  ): Promise<{ municipe: Municipe; cpfHash: string; cepHash: string }> {
    const data: Record<string, any> = {};

    for (const [key, value] of Object.entries(municipe)) {
      if (value === null || !this.fieldsToEncrypt.includes(key)) {
        data[key] = value;
      } else if (value !== undefined) {
        data[key] = await this.aesCrypt.encrypt(String(value));
      }
    }

    data.cpfHash = await this.sha256Crypt.encrypt(String(municipe.cpf));
    data.cepHash = await this.sha256Crypt.encrypt(String(municipe.cep));

    return {
      municipe: this.toEntity(data),
      cpfHash: data.cpfHash,
      cepHash: data.cepHash,
    };
  }

  private toEntity(data: any): Municipe {
    return new Municipe(
      data.nome,
      data.cpf,
      data.nascimento,
      data.telefone,
      data.rua,
      data.bairro,
      data.cidade,
      data.uf,
      data.cep,
      data.numero,
      data.complemento,
      data.author,

      data.uuid,
      data.createdAt,
      data.updatedAt,
      data.deletedAt,
      data.cpfHash,
      data.cepHash,
    );
  }
}
