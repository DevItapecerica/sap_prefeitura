import { verifyToken } from "../utils/verifyToken.js";
import { getUser } from "../service/user.js";

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
    const user = { id: decoded.id, role: decoded.role };

    // Verifica se o usuário existe no sistema
    const verifyUser = await getUser(user.id);

    if (!verifyUser) {
      throw {
        code: 401,
        message: "Usuário não encontrado",
        ok: false,
        api: "Login",
      };
    }

    reply.status(200).send({
      message: "Usuário autenticado",
      scopo: verifyUser.role_id,
      user: user,
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

export { authUser };
