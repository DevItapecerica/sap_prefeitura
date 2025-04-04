const { verifyToken } = require("../utils/verifyToken");
const USER_API = require("../service/user_api");

exports.authUser = async (request, reply) => {
  let token = request.body.token;
  try {
    let user = await verifyToken(token);

    let response = await USER_API.get(`/user/${user.id}`);

    let verifyUser = response.data;
    if (!verifyUser) {
      throw { message: "User not found", status: 401 };
    }

    reply.status(200).send({
      message: "Usuário authenticado",
      scopo: verifyUser.role_id,
      user: user,
    });
  } catch (error) {
    throw error;
  }
};
