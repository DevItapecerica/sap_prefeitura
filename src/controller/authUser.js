import { verifyToken } from "../utils/verifyToken.js";
import USER_API from "../service/user_api.js";

const authUser = async (request, reply) => {
  const token = request.body.token;

  try {
    const user = await verifyToken(token);
    const response = await USER_API.get(`/user/${user.id}`);
    const verifyUser = response.data;

    if (!verifyUser) {
      throw { message: "User not found", status: 401 };
    }

    reply.status(200).send({
      message: "Usuário autenticado",
      scopo: verifyUser.role_id,
      user: user,
    });
  } catch (error) {
    throw error;
  }
};

export { authUser };
