export type SetorDto = {
    id: number;
    name: string;
    description: string;
};

export type UpdateSetorDto = {
    name: string;
    description: string;
};

export type CreateSetorDto = {
    name: string;
    description: string;
};

export type DeleteSetorDto = {
    id: number;
};

export type FindOneSetorDto = {
    id: number;
};

export type FindAllSetorDto = {};