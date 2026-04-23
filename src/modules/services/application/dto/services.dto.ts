export type ServicesDto = {
     id: number;
     name: string;
     description: string;
     tag: string;
     url: string;
     createdAt: Date;
     updatedAt: Date;
     deletedAt: Date;
}

export type CreateServicesDto = Omit<ServicesDto, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>

export type UpdateServicesDto = Omit<ServicesDto, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>

export type permissionDto = {
     id: number;
     role_id: number;
     service_id: number;
     read: boolean;
     write: boolean;
     del: boolean;
     edit: boolean;
}

export type visibilityDto = {
     id: number;
     setor_id: number;
     service_id: number;
     visibility: boolean;
}