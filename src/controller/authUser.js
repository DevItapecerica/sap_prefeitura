import { verifyToken } from "../utils/verifyToken.js";
import { getUser } from "../service/user.js";
import jwt from "jsonwebtoken";
import DBUser from "../db/model/UserModel.js";
import { SECRET_KEY } from "../config/env.js";
import comparePass from "../utils/comparePass.js";
import HashPass from "../utils/hashPass.js";

const login = async (request, reply) => {
  const { email, password } = request.body;

  try {
    const user = await DBUser.findOne({
      where: { email },
    });

    if (!user) {
      throw {
        ok: false,
        message: "Email ou senha incorretos",
        code: 401,
        api: "login",
      };
    }

    await comparePass(password, user.password);

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role_id: user.role_id,
        exp: Math.floor(Date.now() / 1000) + 3600 * 8, // 8 horas
      },
      SECRET_KEY
    );

    const payload = {
      message: "Login bem sucedido",
      firstLogin: user.firstLogin,
      name: user.name,
      token,
      ip: request.ip,
      scopo: user.role_id,
    };

    reply.status(200).send(payload);
  } catch (error) {
    throw error;
  }
};

const authUser = async (request, reply) => {
  const token = request.body.token;

  try {
    const decoded = await verifyToken(token);
    if (!decoded.ok) {
      throw {
        code: 401,
        message: decoded.message,
        ok: decoded.ok,
        api: "Login",
      };
    }
    const decodedUser = { id: decoded.id, role: decoded.role };

    // Verifica se o usuário existe no sistema
    const { user } = await getUser(decodedUser.id);

    if (!user) {
      throw {
        code: 401,
        message: "Usuário não encontrado",
        ok: false,
        api: "Login",
      };
    }

    reply.status(200).send({
      message: "Usuário autenticado",
      scopo: user.role_id,
      user: {
        id: user.id,
        name: user.name,
        mail: user.email,
        ramal: user.ramal,
        setor: user.setor_id,
        role: user.role_id,
        ip: request.headers["x-real-ip"] || request.ip,
      },
    });
  } catch (error) {
    throw {
      code: error.code,
      message: error.message,
      ok: error.ok,
      api: error.api,
    };
  }
};

const alterPassword = async (request, reply) => {
  const { id } = request.params;
  const { new_password, password } = request.body;

  try {
    const user = await DBUser.findByPk(id);

    if (!user) {
      throw {
        code: 401,
        message: "Usuário nao encontrado",
        ok: false,
        api: "Login",
        validation: false,
      };
    }
    await comparePass(password, user.password).then(async () => {
      const hashedPassword = await HashPass(new_password);

      user.password = hashedPassword;
      await user.save();
      reply.status(200).send({ message: "Senha alterada com sucesso" });
    });
  } catch (error) {
    throw error;
  }
};

export { authUser, login, alterPassword };
