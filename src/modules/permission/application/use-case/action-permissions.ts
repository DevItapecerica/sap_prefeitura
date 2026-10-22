import AppError from '../../../../core/appError.js';
export type GrantInput = {permission_action_id: number; allowed: boolean};
export type PermissionPage = {service_id?: number; role_id?: number; page: number; limit: number};
export type RolePermissionChange = {role_id: number; changes: {permission_action_id: number; before: boolean; after: boolean}[]};
export interface ActionPermissionRuntime {
 catalog(query: PermissionPage): Promise<{permission: unknown[]; count: number}>;
 list(query: PermissionPage): Promise<{permission: unknown[]; count: number}>;
 effective(userId: number): Promise<{service_id: number; module: string; actions: string[]}[]>;
 update(actorId: number, roleId: number, permissions: GrantInput[]): Promise<RolePermissionChange>;
}
const invalid = (): never => { throw new AppError('Invalid permission request',400,'VALIDATION_ERROR'); };
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : invalid();
export const positiveId = (value: unknown): number => {
 if ((typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) && typeof value !== 'number') return invalid();
 const id = Number(value); return Number.isSafeInteger(id) && id > 0 ? id : invalid();
};
export function parseGrantBody(value: unknown): GrantInput[] {
 const body = object(value);
 if (Object.keys(body).length !== 1 || !Array.isArray(body.permissions) || body.permissions.length < 1 || body.permissions.length > 100) return invalid();
 const ids = new Set<number>();
 return body.permissions.map(value => {
  const item = object(value);
  if (Object.keys(item).length !== 2 || typeof item.permission_action_id !== 'number' || typeof item.allowed !== 'boolean') return invalid();
  const id = positiveId(item.permission_action_id);
  if (ids.has(id)) return invalid(); ids.add(id);
  return {permission_action_id: id, allowed: item.allowed};
 });
}
export function parsePermissionQuery(value: unknown, administrative = false): PermissionPage {
 const query = object(value);
 if (Object.keys(query).some(key => !['page','limit','service_id',...(administrative ? ['role_id'] : [])].includes(key))) return invalid();
 const page = query.page === undefined ? 0 : Number(query.page);
 if (!Number.isSafeInteger(page) || page < 0 || (query.page !== undefined && !/^(0|[1-9]\d*)$/.test(String(query.page)))) return invalid();
 const limit = query.limit === undefined ? 25 : positiveId(query.limit);
 if (limit > 100 || !Number.isSafeInteger(page * limit)) return invalid();
 return {page, limit, ...(query.service_id === undefined ? {} : {service_id: positiveId(query.service_id)}), ...(administrative ? {role_id: positiveId(query.role_id)} : {})};
}
export const rejectOwnQuery = (query: unknown) => {if (Object.keys(object(query)).length) invalid();};
