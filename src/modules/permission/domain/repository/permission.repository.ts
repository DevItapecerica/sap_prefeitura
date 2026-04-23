import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import { CreatePermissionsDto, UpdatePermissionsDto } from "../../application/dto/permissions.dto.js";
import { Permissions } from "../entity/Permission.js";

export interface PermissionRepository {
    getAllPermissions: (query: QueryParams) => Promise<{permissions: Permissions[], count: number}>;
    getOnePermissions: (id: number) => Promise<Permissions | null>;
    getByRoleAndServiceId: (roleId: number, serviceId: number) => Promise<Permissions | null>

    createPermissions: (data: CreatePermissionsDto) => Promise<Permissions>;
    createBulkPermissions: (data: CreatePermissionsDto[]) => Promise<Permissions[]>;

    updatePermissions: (id: number, data: UpdatePermissionsDto) => Promise<Permissions>;

    deleteOnePermissions: (id: number) => Promise<boolean>;
    getPermissionByRoleId: (roleId: number) => Promise<Permissions[]>
    getByServiceId: (serviceId: number) => Promise<Permissions[]>
}