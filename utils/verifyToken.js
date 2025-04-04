const jwt = require("jsonwebtoken");
require("dotenv").config({path: `${__dirname}/../config/.env`});

exports.verifyToken = (token) => {
  if (!token) {
    throw { status: 401, message: "Sem token fornecido" };
  }

  result = jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) {
      throw { status: 401, message: "Incorrect Token." };
    }
    console.log(decoded)
    return ({ auth: true, role: decoded.role_id, id: decoded.id });
  });

  return result
};
