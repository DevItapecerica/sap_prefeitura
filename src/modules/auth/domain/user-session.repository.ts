export interface UserSession {
  id: number;
  userId: number;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface UserSessionRepository {
  createSession(
    userId: number,
    refreshTokenHash: string,
    expiresAt: Date,
  ): Promise<UserSession>;
  findActiveByTokenHash(refreshTokenHash: string): Promise<UserSession | null>;
  revokeByTokenHash(refreshTokenHash: string): Promise<void>;
  revokeAllByUserId(userId: number): Promise<void>;
}
