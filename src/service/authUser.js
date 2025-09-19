import HashPass from "../utils/hashPass";

const alterPwd = (new_password, password) => {
  if (new_password === password) {
    throw {
      ok: false,
      message: "A nova senha deve ser diferente da senha atual",
      code: 401,
      api: "login",
    };
  }

  if (new_password.length < 8) {
    throw {
      ok: false,
      message: "A nova senha deve ter pelo menos 8 caracteres",
      code: 401,
      api: "login",
    };
  }

  const hashedPassword = HashPass(new_password);
  return new_password === password;
};
