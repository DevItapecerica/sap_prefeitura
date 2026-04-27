import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import { CreateRoleDto, UpdateRoleDto } from "../../application/dto/roles.dto.js";
import { Roles } from "../entity/Role.js";

export interface RolesRepository {
    getAllRoles: (query: QueryParams) => Promise<{roles: Roles[], count: number}>;
    getOneRoles: (id: number) => Promise<Roles | null>;
    createRoles: (service: CreateRoleDto) => Promise<Roles>;
    updateRoles: (id: number, role: UpdateRoleDto) => Promise<Roles | null>;
    deleteOneRoles: (id: number) => Promise<boolean>;
}