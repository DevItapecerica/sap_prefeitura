import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import { Permissions } from "../entity/Permission.js";

export interface PermissionRepository {
    getAllPermissions: (query: QueryParams) => Promise<{services: Permissions[], count: number}>;
    getOnePermissions: (id: number) => Promise<Permissions | null>;
    createPermissions: (service: CreatePermissionsDto) => Promise<Permissions>;
    updatePermissions: (id: number, service: UpdatePermissionsDto) => Promise<Permissions>;
    deleteOnePermissions: (id: number) => Promise<boolean>;
}