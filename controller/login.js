const jwt = require("jsonwebtoken");
require("dotenv").config({path: `${__dirname}/../config/.env`});

const bcrypt = require("bcryptjs"); // Para comparação de senha criptografada
const USER_API = require("../service/user_api");

exports.login = async (request, reply) => {
  const { email, password } = request.body;

  try {
    const response = await USER_API.post(`/user/login`, {
      email: email,
    });

    const user = response.data;

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword && password != user.password) {
      throw { message: "Email ou senha incorretos", status: 401 };
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (3600 * 8),
      },
      process.env.JWT_KEY,
    );

    let payload = {
      message: "Login bem sucedido",
      firstLogin: user.firstLogin,
      name: user.name,
      token: token,
      ip: request.ip,
      scopo: user.role,
    };

    reply.status(200).send(payload);
  } catch (error) {
    throw error
  }
};
