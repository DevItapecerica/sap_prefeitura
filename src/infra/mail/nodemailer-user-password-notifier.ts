import nodemailer from "nodemailer";
import AppError from "../../core/appError.js";
import {
  MAIL_ADRESS,
  MAIL_HOST,
  MAIL_PASSWORD,
  MAIL_PORT,
  MAIL_SECURE,
} from "../../core/env.js";
import { UserPasswordNotifier } from "../../modules/user/domain/repository/user-password-notifier.repository.js";
import { recordDependency } from "../../core/observability/metrics.js";

export interface MailTransport {
  sendMail(message: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<unknown>;
}

const createTransport = (): MailTransport =>
  nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: MAIL_SECURE,
    auth: { user: MAIL_ADRESS, pass: MAIL_PASSWORD },
  });

export class NodemailerUserPasswordNotifier implements UserPasswordNotifier {
  constructor(private readonly transport: MailTransport = createTransport()) {}

  async sendTemporaryPassword(email: string, password: string): Promise<void> {
    const startedAt = performance.now();
    try {
      await this.transport.sendMail({
        from: `"Tecnologia - Itapecerica da Serra" <${MAIL_ADRESS}>`,
        to: email,
        subject: "Usuário criado com sucesso",
        text: "Lembre-se de alterar sua senha!",
        html: `Sua senha temporária é:<br/> <b>${password}</b> <br/><b>Tenha em mente que ela é de sua responsabilidade, assim como qualquer movimentação usando seu usuário.</b>`,
      });
      recordDependency("email", "success", (performance.now() - startedAt) / 1_000);
    } catch (error) {
      recordDependency("email", "error", (performance.now() - startedAt) / 1_000);
      const message = error instanceof Error ? error.message : String(error);
      throw new AppError(
        `Erro ao enviar e-mail: ${message}`,
        500,
        "INTERNAL_ERROR",
      );
    }
  }
}
