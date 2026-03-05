import nodemailer from "nodemailer";
import { MAIL_HOST, SECRET_EMAIL, SECRET_PASSWORD } from "../env.js";

export async function sendMail(to: string, subject: string, text: string) {

  const transporter = nodemailer.createTransport({
    host: MAIL_HOST, // servidor de email
    port: 25,
    secure: false, // true para porta 465
    auth: {
      user: SECRET_EMAIL,
      pass: SECRET_PASSWORD,
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