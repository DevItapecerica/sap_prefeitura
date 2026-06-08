import { Op } from "sequelize";
import db from "../index.js";

export type UserSession = {
  id: number;
  userId: number;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

export class SequelizeUserSessionRepository {
  private model = db.UserSessionModel;

  async createSession(
    userId: number,
    refreshTokenHash: string,
    expiresAt: Date,
  ): Promise<UserSession> {
    const session = await this.model.create({
      userId,
      refreshTokenHash,
      expiresAt,
      revokedAt: null,
    });

    return this.toEntity(session);
  }

  async findActiveByTokenHash(
    refreshTokenHash: string,
  ): Promise<UserSession | null> {
    const session = await this.model.findOne({
      where: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
    });

    return session ? this.toEntity(session) : null;
  }

  async revokeByTokenHash(refreshTokenHash: string): Promise<void> {
    await this.model.update(
      { revokedAt: new Date() },
      {
        where: {
          refreshTokenHash,
          revokedAt: null,
        },
      },
    );
  }

  async revokeAllByUserId(userId: number): Promise<void> {
    await this.model.update(
      { revokedAt: new Date() },
      {
        where: {
          userId,
          revokedAt: null,
        },
      },
    );
  }

  private toEntity(data: any): UserSession {
    return {
      id: data.id,
      userId: data.userId,
      refreshTokenHash: data.refreshTokenHash,
      expiresAt: data.expiresAt,
      revokedAt: data.revokedAt,
    };
  }
}
