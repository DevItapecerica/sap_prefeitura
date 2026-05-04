import bcrypt from "bcryptjs";

const comparePass = async (password: string, hash: string): Promise<boolean> => {
  const validPassword = await bcrypt.compare(password, hash);

  return validPassword;
};

export default comparePass;
