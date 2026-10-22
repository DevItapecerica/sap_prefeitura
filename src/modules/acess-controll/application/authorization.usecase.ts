import AppError from "../../../core/appError.js";
import { PERMISSION_CATALOG } from "../domain/permission-catalog.js";
export interface AuthorizationRepository {
  user(id: number): Promise<{role_id: number; setor_id: number | null} | null>;
  roleExists(id: number): Promise<boolean>;
  service(module: string): Promise<{id: number; module: string} | null>;
  visible(setorId: number, serviceId: number): Promise<boolean>;
  actions(roleId: number, serviceId: number): Promise<string[]>;
}
export interface PermissionAuthorizer {
  authorize(userId: number, module: string, action: string): Promise<void>;
}
export class AuthorizationUseCase implements PermissionAuthorizer {
  constructor(private readonly repository: AuthorizationRepository) {}
  async authorize(userId: number, module: string, action: string): Promise<void> {
    if (!PERMISSION_CATALOG.some(item => item.module === module && item.action === action))
      throw new AppError("Unknown permission configuration", 500, "PERMISSION_CONFIGURATION_ERROR");
    const user = await this.repository.user(userId);
    if (!user) throw new AppError("Unauthenticated user", 401, "UNAUTHENTICATED");
    const deny = () => { throw new AppError("Not permitted", 403, "NOT_PERMITTED"); };
    if (user.setor_id == null || !await this.repository.roleExists(user.role_id)) return deny();
    const service = await this.repository.service(module);
    if (!service || !await this.repository.visible(user.setor_id, service.id)) return deny();
    const actions = await this.repository.actions(user.role_id, service.id);
    if (!actions.includes("acessar") || !actions.includes(action)) return deny();
  }
}
