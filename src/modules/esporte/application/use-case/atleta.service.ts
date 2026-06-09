import { AppError } from "../../../../core/appError.js";
import Carterinha from "../../../carterinhas/domain/entity/Carteirinha.js";
import CarterinhaRepository from "../../../carterinhas/domain/repositories/carterinha.repository.js";
import { CarterinhaPolicy } from "../../../carterinhas/domain/service/carterinhaPolicy.js";
import MunicipeRepository from "../../../municipe/domain/repositories/Municipe.repository.js";
import Atleta from "../../domain/entity/Atleta.js";
import AtletaRepository from "../../domain/repository/atleta.repository.js";
import { CreateAtletaDto, QueryAtletaDto, UpdateAtletaDto } from "../dto/atleta.dto.js";

export default class AtletaService {
  constructor(
    private atletaRepository: AtletaRepository,
    private municipeRepository: MunicipeRepository,
    private carterinhaRepository: CarterinhaRepository,
  ) {}

  async createAtleta(data: CreateAtletaDto, author: string | number): Promise<Atleta> {
    const municipe = await this.municipeRepository.getMunicipeById(data.municipe_uuid);

    if (!municipe) {
      throw new AppError("Municipe not found", 404, "MUNICIPE_NOT_FOUND");
    }

    const existingActive = await this.atletaRepository.findActiveByMunicipe(data.municipe_uuid);

    if (existingActive) {
      throw new AppError("Municipe already has an active athlete link", 409, "ATLETA_ALREADY_EXISTS");
    }

    const atleta = new Atleta(data.municipe_uuid, data.ativo ?? true, author);

    return this.atletaRepository.createAtleta(atleta);
  }

  async findAllAtletas(query?: QueryAtletaDto): Promise<{ atletas: Atleta[]; count: number }> {
    return this.atletaRepository.findAllAtletas(query);
  }

  async findOneAtleta(uuid: string): Promise<Atleta> {
    const atleta = await this.atletaRepository.findOneAtleta(uuid);

    if (!atleta) {
      throw new AppError("Atleta not found", 404, "ATLETA_NOT_FOUND");
    }

    return atleta;
  }

  async updateAtleta(uuid: string, data: UpdateAtletaDto): Promise<Atleta> {
    const atleta = await this.atletaRepository.updateAtleta(uuid, data);

    if (!atleta) {
      throw new AppError("Atleta not found", 404, "ATLETA_NOT_FOUND");
    }

    return atleta;
  }

  async deleteAtleta(uuid: string): Promise<boolean> {
    const deleted = await this.atletaRepository.deleteAtleta(uuid);

    if (!deleted) {
      throw new AppError("Atleta not found", 404, "ATLETA_NOT_FOUND");
    }

    return deleted;
  }

  async createCarteirinha(uuid: string, author: string | number): Promise<Carterinha> {
    const atleta = await this.findOneAtleta(uuid);
    const municipe = await this.municipeRepository.getMunicipeById(atleta.municipe_uuid);

    if (!municipe) {
      throw new AppError("Municipe not found", 404, "MUNICIPE_NOT_FOUND");
    }

    const emissao = new Date(Date.now());
    const carterinhaPolicy = new CarterinhaPolicy();
    const validade = carterinhaPolicy.calcularValidade(emissao);

    const carterinha = new Carterinha(
      emissao,
      validade,
      "esporte",
      null,
      atleta.municipe_uuid,
      author,
    );

    return this.carterinhaRepository.postCarterinhas(carterinha);
  }
}
