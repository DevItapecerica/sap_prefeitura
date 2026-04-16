import { QueryParams } from "../../core/shared/types/genericTypes.js";
import { CreateServicesDto, UpdateServicesDto } from "./dto/services.dto.js";
import { Services } from "./services.entity.js";

export interface ServicesRepository {
    getAllServices: (query: QueryParams) => Promise<{services: Services[], count: number}>;
    getOneServices: (id: number) => Promise<Services | null>;
    createServices: (service: CreateServicesDto) => Promise<Services>;
    updateServices: (id: number, service: UpdateServicesDto) => Promise<Services>;
    deleteOneServices: (id: number) => Promise<boolean>;
}