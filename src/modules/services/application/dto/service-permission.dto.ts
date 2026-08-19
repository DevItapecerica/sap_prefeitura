export interface ServicePermissionDto {
  id: number;
  role_id: number;
  service_id: number;
  read: boolean;
  write: boolean;
  edit: boolean;
  del: boolean;
}
