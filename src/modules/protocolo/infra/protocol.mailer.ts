import nodemailer from "nodemailer";
import { MAIL_ADRESS, MAIL_HOST, MAIL_PASSWORD, MAIL_PORT, MAIL_SECURE } from "../../../core/env.js";

export class ProtocolMailer {
  private transport = nodemailer.createTransport({ host: MAIL_HOST, port: MAIL_PORT, secure: MAIL_SECURE, auth: { user: MAIL_ADRESS, pass: MAIL_PASSWORD } });
  private send(to: string, subject: string, text: string) { return this.transport.sendMail({ from: `"Prefeitura de Itapecerica da Serra" <${MAIL_ADRESS}>`, to, subject, text, html: `<p>${text}</p>` }); }
  sendCode(to: string, code: string, minutes: number) { return this.send(to, "Codigo de acesso ao Protocolo", `Seu codigo e ${code}. Ele expira em ${minutes} minutos.`); }
  sendOpened(to: string, number: string, url: string) { return this.send(to, `Protocolo ${number} aberto`, `Seu protocolo foi recebido. Acompanhe em ${url}`); }
  sendUpdate(to: string, number: string, state: string, message?: string) { return this.send(to, `Atualizacao do protocolo ${number}`, `Situacao: ${state}. ${message || "Consulte o portal para detalhes."}`); }
  sendNotification(to: string, subject: string, text: string) { return this.send(to, subject, text); }
}
