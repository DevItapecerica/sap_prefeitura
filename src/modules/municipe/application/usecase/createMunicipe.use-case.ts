import AppError from "../../../../core/appError.js";
import Municipe from "../../domain/entity/Municipe.js";
import MunicipeRepository from "../../domain/repositories/Municipe.tepository.js";
import { MunicipeDto } from "../dto/municipe.dto.js";

export default class createMunicipeUseCase {
    constructor(private municipeRepository: MunicipeRepository) {

    }
    async execute(municipe: MunicipeDto, author: string) {

        const alreadyExists = await this.municipeRepository.getMunicipeByCpf(municipe.cpf);

        if (alreadyExists) {
            throw new AppError("Municipe already exists", 409, "MUNICIPE_ALREADY_EXISTS");
        }

        const newMunicipe = new Municipe(
            municipe.nome,
            municipe.cpf,
            municipe.nascimento,
            municipe.telefone,
            municipe.rua,
            municipe.bairro,
            municipe.cidade,
            municipe.uf,
            municipe.cep,
            municipe.numero,
            municipe.complemento,
            author
        )

        const response = await this.municipeRepository.createMunicipe(newMunicipe)

        return response;
    }
}