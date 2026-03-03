import nodemailer from "nodemailer";

import { MAIL_ADRESS, MAIL_HOST, MAIL_PASSWORD } from "../core/env.js";

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
    throw {
      code: error.code || 500,
      ok: false,
      message: "Erro ao enviar e-mail: " + error.message,
      original_error: error,
      validation: false,
    };
  }
};
