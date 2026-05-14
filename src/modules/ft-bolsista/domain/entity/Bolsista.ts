export class Bolsista {
    constructor(
        public name: string,
        public cpf: string,
        public local: string,
        public status: string,
        
        public id?: string,
        public createdAt?: Date,
        public updatedAt?: Date
    ){}
}