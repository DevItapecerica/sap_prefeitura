import bcrypt from "bcryptjs";

const comparePass = async (password, hash) => {
  const validPassword = await bcrypt.compare(password, hash);
  if (!validPassword) {
    throw {
      message: "Email ou senha incorretos",
      code: 401,
      api: "login",
      ok: false,
      validation: false,
    };
  }
  return;
};

export default comparePass;
