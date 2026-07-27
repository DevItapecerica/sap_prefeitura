import nodemailer from "nodemailer";
import AppError from "../../core/appError.js";
import { MAIL_ADRESS, MAIL_HOST, MAIL_PASSWORD } from "../../core/env.js";
import { UserPasswordNotifier } from "../../modules/user/domain/repository/user-password-notifier.repository.js";

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
    port: 25,
    secure: true,
    auth: { user: MAIL_ADRESS, pass: MAIL_PASSWORD },
  });

export class NodemailerUserPasswordNotifier implements UserPasswordNotifier {
  constructor(private readonly transport: MailTransport = createTransport()) {}

  async sendTemporaryPassword(email: string, password: string): Promise<void> {
    try {
      await this.transport.sendMail({
        from: `"Tecnologia - Itapecerica da Serra" <${MAIL_ADRESS}>`,
        to: email,
        subject: "Usuário criado com sucesso",
        text: "Lembre-se de alterar sua senha!",
        html: `Sua senha temporária é:<br/> <b>${password}</b> <br/><b>Tenha em mente que ela é de sua responsabilidade, assim como qualquer movimentação usando seu usuário.</b>`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new AppError(
        `Erro ao enviar e-mail: ${message}`,
        500,
        "INTERNAL_ERROR",
      );
    }
  }
}
