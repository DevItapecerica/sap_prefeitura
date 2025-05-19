const jwt = require("jsonwebtoken");

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
