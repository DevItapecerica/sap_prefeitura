const jwt = require("jsonwebtoken");
const DBUser = require("../db/model/UserModel");

const bcrypt = require("bcryptjs"); // Para comparação de senha criptografada

exports.login = async (request, reply) => {
  const { email, password } = request.body;

  try {
    const user = await DBUser.findOne({
      where: { email: email },
    });

    if (!user) {
      let error = new Error("Email ou senha incorretos");
      error.status = 401;
      throw error;
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      throw { message: "Email ou senha incorretos", status: 401 };
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role_id: user.role_id,
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
      scopo: user.role_id,
    };

    reply.status(200).send(payload);
  } catch (error) {
    throw error
  }
};
