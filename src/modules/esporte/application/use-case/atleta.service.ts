import { AppError } from "../../../../core/appError.js";
import MunicipeRepository from "../../../municipe/domain/repositories/Municipe.repository.js";
import Carterinha from "../../../carterinhas/domain/entity/Carteirinha.js";
import CarterinhaRepository from "../../../carterinhas/domain/repositories/carterinha.repository.js";
import { QueryCarterinhasDto } from "../../../carterinhas/application/dto/queryCarterinhas.dto.js";
import GetCarterinhasByMunicipeUseCase from "../../../carterinhas/application/use-case/getCarterinhasByMunicipe.use-case.js";
import CreateCarterinhaUseCase from "../../../carterinhas/application/use-case/createCarterinha.use-case.js";
import Atleta from "../../domain/entity/Atleta.js";
import AtletaRepository from "../../domain/repository/atleta.repository.js";
import ModalidadeRepository from "../../domain/repository/modalidade.repository.js";
import {
  AddModalidadeAtletaDto,
  CreateAtletaDto,
  QueryAtletaDto,
  UpdateAtletaDto,
} from "../dto/atleta.dto.js";
import { ISha256Crypt } from "../../../../core/security/sha256/sha256.interface.js";
import { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import { MunicipeMapper } from "../../../municipe/application/mapper/municipe.mapper.js";

export default class AtletaService {
  constructor(
    private atletaRepository: AtletaRepository,
    private modalidadeRepository: ModalidadeRepository,
    private municipeRepository: MunicipeRepository,
    private carterinhaRepository: CarterinhaRepository,
    private createCarterinhaUseCase: CreateCarterinhaUseCase,
    private sha256Crypt?: ISha256Crypt,
    private aesCrypt?: IAesCrypt,
  ) {}

  private async decryptIncludedMunicipe(atleta: Atleta): Promise<Atleta> {
    if (!atleta.municipe || !this.aesCrypt || !this.sha256Crypt) {
      return atleta;
    }

    const municipeMapper = new MunicipeMapper(this.aesCrypt, this.sha256Crypt);
    atleta.municipe = await municipeMapper.toDomain(atleta.municipe);

    return atleta;
  }

  async createAtleta(
    data: CreateAtletaDto,
    author: string | number,
  ): Promise<Atleta> {
    const municipe = await this.municipeRepository.getMunicipeById(
      data.municipe_uuid,
    );

    if (!municipe) {
      throw new AppError("Municipe not found", 404, "MUNICIPE_NOT_FOUND");
    }

    const existingActive = await this.atletaRepository.findActiveByMunicipe(
      data.municipe_uuid,
    );

    if (existingActive) {
      throw new AppError(
        "Municipe already has an active athlete link",
        409,
        "ATLETA_ALREADY_EXISTS",
      );
    }

    const atleta = new Atleta(data.municipe_uuid, data.ativo ?? true, author);

    return this.atletaRepository.createAtleta(atleta);
  }

  async findAllAtletas(
    query?: QueryAtletaDto,
  ): Promise<{ atletas: Atleta[]; count: number }> {
    const searchDigits = String(query?.search || "").replace(/\D/g, "");
    const searchHash =
      this.sha256Crypt &&
      (searchDigits.length === 8 || searchDigits.length === 11)
        ? await this.sha256Crypt.encrypt(searchDigits)
        : undefined;

    const response = await this.atletaRepository.findAllAtletas({
      ...query,
      searchHash,
    });

    response.atletas = await Promise.all(
      response.atletas.map((atleta) => this.decryptIncludedMunicipe(atleta)),
    );

    return response;
  }

  async findOneAtleta(uuid: string): Promise<Atleta> {
    const atleta = await this.atletaRepository.findOneAtleta(uuid);

    if (!atleta) {
      throw new AppError("Atleta not found", 404, "ATLETA_NOT_FOUND");
    }

    return this.decryptIncludedMunicipe(atleta);
  }

  async findCarteirinhasEsporte(
    query?: Omit<QueryCarterinhasDto, "origem">,
  ): Promise<{ carterinhas: Carterinha[]; count: number }> {
    return this.carterinhaRepository.getCarterinhas({
      ...query,
      origem: "esporte",
    });
  }

  async findCarteirinhasByAtleta(
    uuid: string,
    query?: Omit<QueryCarterinhasDto, "origem">,
  ): Promise<{ carterinhas: Carterinha[]; count: number }> {
    const atleta = await this.findOneAtleta(uuid);
    const useCase = new GetCarterinhasByMunicipeUseCase(
      this.carterinhaRepository,
    );

    return useCase.execute({
      ...query,
      municipe_uuid: atleta.municipe_uuid,
      origem: "esporte",
    });
  }

  async addModalidadeToAtleta(
    uuid: string,
    data: AddModalidadeAtletaDto,
  ): Promise<Atleta> {
    const atleta = await this.atletaRepository.findOneAtleta(uuid);

    if (!atleta) {
      throw new AppError("Atleta not found", 404, "ATLETA_NOT_FOUND");
    }

    if (!this.modalidadeRepository) {
      throw new AppError(
        "Modalidade repository unavailable",
        500,
        "MODALIDADE_REPOSITORY_UNAVAILABLE",
      );
    }

    const modalidade = await this.modalidadeRepository.findOneModalidade(
      data.modalidade_uuid,
    );

    if (!modalidade) {
      throw new AppError("Modalidade not found", 404, "MODALIDADE_NOT_FOUND");
    }

    const linked = await this.atletaRepository.addModalidadeToAtleta(
      uuid,
      data.modalidade_uuid,
    );

    if (!linked) {
      throw new AppError(
        "Atleta already has this modalidade",
        409,
        "ATLETA_MODALIDADE_ALREADY_EXISTS",
      );
    }

    return this.findOneAtleta(uuid);
  }

  async updateAtleta(uuid: string, data: UpdateAtletaDto): Promise<Atleta> {
    const atleta = await this.atletaRepository.updateAtleta(uuid, data);

    if (!atleta) {
      throw new AppError("Atleta not found", 404, "ATLETA_NOT_FOUND");
    }

    return this.decryptIncludedMunicipe(atleta);
  }

  async deleteAtleta(uuid: string): Promise<boolean> {
    const deleted = await this.atletaRepository.deleteAtleta(uuid);

    if (!deleted) {
      throw new AppError("Atleta not found", 404, "ATLETA_NOT_FOUND");
    }

    return deleted;
  }

  async createCarteirinha(
    uuid: string,
    author: string | number,
  ): Promise<Carterinha> {
    const atleta = await this.findOneAtleta(uuid);
    const atividade = (atleta.modalidades || [])
      .map((modalidade) => modalidade.nome)
      .filter(Boolean)
      .join(", ");

    if (!atividade) {
      throw new AppError(
        "Atleta has no modalidade linked",
        400,
        "ATLETA_MODALIDADE_REQUIRED",
      );
    }

    return this.createCarterinhaUseCase.execute(
      {
        municipe_uuid: atleta.municipe_uuid,
        origem: "esporte",
        atividade,
      },
      author,
    );
  }
}
