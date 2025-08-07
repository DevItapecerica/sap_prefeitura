import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config/env.js";

const verifyToken = (token) => {
  if (!token) {
    throw { status: 401, message: "Sem token fornecido" };
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log(decoded);
    return {
      auth: true,
      role: decoded.role_id,
      id: decoded.id,
    };
  } catch (err) {
    throw { status: 401, message: "Token incorreto." };
  }
};

export { verifyToken };
