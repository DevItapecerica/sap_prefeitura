import nodemailer from "nodemailer";

import { MAIL_ADRESS, MAIL_HOST, MAIL_PASSWORD } from "../env.js";
import AppError from "../appError.js";

const transporter = nodemailer.createTransport({
  host: MAIL_HOST,
  port: 25,
  secure: false,
  auth: {
    user: MAIL_ADRESS,
    pass: MAIL_PASSWORD,
  },
});

export const sendMail = async (to: string, subject: string, text: string, html: string) => {
  try {
    await transporter.sendMail({
      from: `"Tecnologia - Itapecerica da Serra" <${MAIL_ADRESS}>`,
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (error: any) {
    const err = new AppError("Erro ao enviar e-mail: " + error.message, 500, "INTERNAL_ERROR");
    throw err;
  }
};
