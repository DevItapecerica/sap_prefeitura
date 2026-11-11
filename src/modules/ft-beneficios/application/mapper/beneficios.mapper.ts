import type { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import type {
  BenefitDelivery,
  BenefitPerson,
} from "../../domain/beneficios.contracts.js";

export class BeneficiosMapper {
  constructor(private readonly crypt: IAesCrypt) {}
  async person(record: BenefitPerson): Promise<BenefitPerson> {
    return { ...record, cpf: await this.crypt.decrypt(record.cpf) };
  }
  async operationResult(encrypted: string): Promise<BenefitDelivery> {
    return JSON.parse(await this.crypt.decrypt(encrypted)) as BenefitDelivery;
  }
  operationSnapshot(delivery: BenefitDelivery): Promise<string> {
    return this.crypt.encrypt(JSON.stringify(delivery));
  }
}
