export type CreatePermissionsDto = {
    service_id: number;
    role_id: number;
    read?: boolean;
    write?: boolean;
    edit?: boolean;
    del?: boolean;
};

export type UpdatePermissionsDto = {
    read: boolean;
    write: boolean;
    edit: boolean;
    del: boolean;
};
