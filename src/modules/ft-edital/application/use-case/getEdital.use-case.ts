import { IEditalRepository } from "../../domain/repository/IEditalRepository.js";

export default class getEditalUseCase {
    constructor(private editalRepository: IEditalRepository) { }
    async execute() {
        const edital = await this.editalRepository.findAll();
        return edital
    }
}