import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import Municipe from "../../domain/entity/Municipe.js";
import MunicipeRepository from "../../domain/repositories/Municipe.repository.js";

export default class getMunicipeUseCase {
    constructor(private municipeRepository: MunicipeRepository) {

    }
    async execute(query: QueryParams): Promise<{municipe: Municipe[], count: number}> {

        const municipe = await this.municipeRepository.getMunicipe(query);

        return municipe;
    }
}