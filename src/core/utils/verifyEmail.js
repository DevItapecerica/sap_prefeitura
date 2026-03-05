exports.verifyEmail = (email) => {
  if (!/^[A-Z0-9._%+-]+@itapecerica+\.sp\.gov\.br$/i.test(email)) {
    throw { code: 403, message: "Email inválido", ok: false, api: "User" };
  } else {
    return true;
  }
};
