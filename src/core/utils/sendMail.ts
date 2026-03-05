import nodemailer from "nodemailer";
import { MAIL_HOST, MAIL_ADRESS, MAIL_PASSWORD } from "../env.js";

export async function sendMail(to: string, subject: string, text: string) {

  const transporter = nodemailer.createTransport({
    host: MAIL_HOST, // servidor de email
    port: 25,
    secure: false, // true para porta 465
    auth: {
      user: MAIL_ADRESS,
      pass: MAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: '"Tecnologia - Itapecerica da Serra" <miguel.moraes@itapecerica.sp.gov.br>',
    to,
    subject,
    text,
  };

  return transporter.sendMail(mailOptions);
}