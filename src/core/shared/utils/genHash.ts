import bcrypt from "bcryptjs";

const genHash = async (password: string): Promise<string> => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
};

export default genHash;
