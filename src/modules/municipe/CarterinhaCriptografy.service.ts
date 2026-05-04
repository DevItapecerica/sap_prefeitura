import CryptData from "../../core/utils/CryptData.js";
import Carterinha from "../carterinhas/domain/entity/Carteirinha.js";

export default class CarterinhaCriptografy {
  private criptografy: CryptData;

  constructor(private carterinha: Carterinha) {
    this.criptografy = new CryptData();
  }

  async cript(): Promise<Carterinha> {
    let CarteirinhaData = this.carterinha.getSensitiveData();

    let data = new Carterinha(
      await this.criptografy.Encryption(CarteirinhaData.nome), //CarteirinhaData.nome,
      await this.criptografy.Encryption(CarteirinhaData.cpf), //CarteirinhaData.cpf,
      await this.criptografy.Encryption(CarteirinhaData.nascimento), //CarteirinhaData.nascimento,
      CarteirinhaData.telefone,
      CarteirinhaData.emissao,
      CarteirinhaData.validade,
      await this.criptografy.Encryption(CarteirinhaData.rua), //CarteirinhaData.rua,
      await this.criptografy.Encryption(CarteirinhaData.bairro), //CarteirinhaData.bairro,
      await this.criptografy.Encryption(CarteirinhaData.cidade), //CarteirinhaData.cidade,
      await this.criptografy.Encryption(CarteirinhaData.uf), //CarteirinhaData.uf,
      await this.criptografy.Encryption(CarteirinhaData.cep), //CarteirinhaData.cep,
      await this.criptografy.Encryption(CarteirinhaData.numero), //CarteirinhaData.numero,
      CarteirinhaData.complemento
        ? await this.criptografy.Encryption(CarteirinhaData.complemento)
        : null, //CarteirinhaData.complemento,
      CarteirinhaData.setor,
      CarteirinhaData.servico,

      CarteirinhaData.uuid,
      CarteirinhaData.numero_carterinha,

      CarteirinhaData.author,

      CarteirinhaData.createdAt,
      CarteirinhaData.updatedAt,
      CarteirinhaData.deletedAt,
    );

    return data;
  }

  async descript(): Promise<Carterinha> {
    let CarteirinhaData = this.carterinha.getSensitiveData();

    let data = new Carterinha(
      await this.criptografy.Decryption(CarteirinhaData.nome), //CarteirinhaData.nome,
      await this.criptografy.Decryption(CarteirinhaData.cpf), //CarteirinhaData.cpf,
      await this.criptografy.Decryption(CarteirinhaData.nascimento), //CarteirinhaData.nascimento,
      CarteirinhaData.telefone,
      CarteirinhaData.emissao,
      CarteirinhaData.validade,
      await this.criptografy.Decryption(CarteirinhaData.rua), //CarteirinhaData.rua,
      await this.criptografy.Decryption(CarteirinhaData.bairro), //CarteirinhaData.bairro,
      await this.criptografy.Decryption(CarteirinhaData.cidade), //CarteirinhaData.cidade,
      await this.criptografy.Decryption(CarteirinhaData.uf), //CarteirinhaData.uf,
      await this.criptografy.Decryption(CarteirinhaData.cep), //CarteirinhaData.cep,
      await this.criptografy.Decryption(CarteirinhaData.numero), //CarteirinhaData.numero,
      CarteirinhaData.complemento
        ? await this.criptografy.Decryption(CarteirinhaData.complemento)
        : null, //CarteirinhaData.complemento,
      CarteirinhaData.setor,
      CarteirinhaData.servico,

      CarteirinhaData.uuid,
      CarteirinhaData.numero_carterinha,

      CarteirinhaData.author,

      CarteirinhaData.createdAt,
      CarteirinhaData.updatedAt,
      CarteirinhaData.deletedAt,
    );

    return data;
  }
}
