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

export type UpdateServicesDto = Omit<ServicesDto, 'createdAt' | 'updatedAt' | 'deletedAt'>