export type CreatePermissionsDto = {
    service_id: number;
    role_id: number;
};

export type UpdatePermissionsDto = {
    read: boolean;
    write: boolean;
    edit: boolean;
    del: boolean;
};