import bcrypt from "bcryptjs";

const HashPass = async (password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
};

export default HashPass;
