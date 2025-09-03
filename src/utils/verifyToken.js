import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config/env.js";

const verifyToken = (token) => {
  if (!token) {
    throw { ok: false, message: "Sem token fornecido", code: 401 };
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return {
      ok: true,
      message: "Token autenticado com sucesso.",
      role: decoded.role_id,
      id: decoded.id,
    };
  } catch (err) {
    return {
      ok: false,
      message: "Falha ao autenticar o token.",
      code: 401,
    };
  }
};

export { verifyToken };
