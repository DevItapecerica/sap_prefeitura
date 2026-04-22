import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import { CreateServicesDto, UpdateServicesDto } from "../../application/dto/services.dto.js";
import { Services } from "../entity/Services.js";
import { ServiceVisibility } from "../entity/ServiceVisibility.js";

export interface ServicesRepository {
    getAllServices: (query: QueryParams) => Promise<{services: Services[], count: number}>;
    getOneServices: (id: number) => Promise<Services | null>;
    createServices: (service: CreateServicesDto) => Promise<Services>;
    updateServices: (id: number, service: UpdateServicesDto) => Promise<Services>;
    deleteOneServices: (id: number) => Promise<boolean>;
}
export interface serviceVisibilityRepository {
    findOneServiceVisibility(id: number): Promise<ServiceVisibility | null>;
    updateServiceVisibility(id: number, setor: any): Promise<ServiceVisibility | null>;
    deleteServiceVisibility(id: number): Promise<Boolean>;
    createServiceVisibility(data: ServiceVisibility): Promise<ServiceVisibility>;
}