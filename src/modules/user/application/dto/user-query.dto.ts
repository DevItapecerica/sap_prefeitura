export interface UserQuery {
  search?: string;
  page: number;
  limit: number;
  order: string;
  setorId?: number;
}
