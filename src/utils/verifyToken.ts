import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../core/env.js";

const verifyToken = (token: string) => {
  if (!token) {
    throw { ok: false, message: "Sem token fornecido", code: 401 };
  }

  try {
    const decoded: any = jwt.verify(token, SECRET_KEY);
    return {
      ok: true,
      message: "Token autenticado com sucesso.",
      role_id: decoded.role_id,
      name: decoded.name,
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
