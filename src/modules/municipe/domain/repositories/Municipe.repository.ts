import { QueryParams } from "../../../../core/types/genericTypes.js"
import { MunicipeDto, updateMunicipeDto } from "../../application/dto/municipe.dto.js"
import Municipe from "../entity/Municipe.js"

export default interface MunicipeRepository {

    getMunicipe: (query: QueryParams) => Promise<{municipe: Municipe[], count: number}>
    createMunicipe: (municipe: MunicipeDto, author: string) => Promise<Municipe>
    updateMunicipe: (uuid: string, municipe: updateMunicipeDto) => Promise<Municipe | null>
    deleteMunicipe: (uuid: string) => Promise<boolean>
    getMunicipeById: (uuid: string) => Promise<Municipe | null>
    getMunicipeByCpf: (cpf: string) => Promise<Municipe | null>
}