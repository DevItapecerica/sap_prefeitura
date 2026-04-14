import { QueryParams } from "../../core/shared/types/genericTypes.js";
import UserService from "../user/user.service.js";
import { CreateSetorDto } from "./dto/setor.dto.js";
import { Setor } from "./setor.entity.js";
import { SetorRepository } from "./setor.repository.js";


export class SetorService {
    constructor(private repo: SetorRepository, userService: UserService, private logger: any) {}

    async createSetor(setor: CreateSetorDto) {
        this.logger.info(setor);

        const data = await this.repo.createSetor(setor)
        return new Setor(data.id, data.name, data.description);
    }

    async findAllSetor(query?: QueryParams) {
        this.logger.info("Buscando setores");

        const data = await this.repo.findAllSetor(query);
        return data;
    }

    async findOneSetor(id: number) {
        this.logger.info("Buscando setor");

        const data = await this.repo.findOneSetor(id);
        return data;
    }

    async updateSetor(id: number, setor: any) {
        this.logger.info("Atualizando setor");

        const data = await this.repo.updateSetor(id, setor);
        return data;
    }

    async deleteSetor(id: number) {
        this.logger.info("Deletando setor");

        const data = await this.repo.deleteSetor(id);
        return data;
    }

    
}