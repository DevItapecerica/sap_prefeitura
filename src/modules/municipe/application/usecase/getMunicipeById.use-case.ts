import AppError from "../../../../core/appError.js";
import Municipe from "../../domain/entity/Municipe.js";
import MunicipeRepository from "../../domain/repositories/Municipe.repository.js";

export default class getMunicipeByIdUseCase {
    constructor(private municipeRepository: MunicipeRepository) {

    }
    async execute(uuid: string): Promise<Municipe> {

        const municipe = await this.municipeRepository.getMunicipeById(uuid);

        if (!municipe) throw new AppError("Municipe not found", 404, "MUNICIPE_NOT_FOUND");

        return municipe;
    }
}