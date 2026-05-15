import Municipe from "../../../municipe/domain/entity/Municipe.js";

export class Bolsista {
    constructor(
        public municipe_uuid: string,
        public local: string,
        public status: string,
        
        public uuid?: string,
        public createdAt?: Date,
        public updatedAt?: Date,
        public municipe?: Municipe, 
    ){}
}