import { QueryParams } from "../../../../core/shared/types/genericTypes.js"
import Municipe from "../entity/Municipe.js"

export default interface MunicipeRepository {

    getMunicipe: (query: QueryParams) => Promise<{municipe: Municipe[], count: number}>
    createMunicipe: (municipe: Municipe) => Promise<Municipe>
    updateMunicipe: (uuid: string, municipe: Municipe) => Promise<Municipe | null>
    deleteMunicipe: (uuid: string) => Promise<boolean>
    getMunicipeById: (uuid: string) => Promise<Municipe | null>
    getMunicipeByCpf: (cpf: string) => Promise<Municipe | null>
}