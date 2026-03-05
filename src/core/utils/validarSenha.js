const passwordValidator = require("password-validator");

const validarSenha = (password) => {
  const schema = new passwordValidator();
  schema
    .is()
    .min(8)
    .is()
    .max(100)
    .has()
    .not()
    .spaces()
    .has()
    .uppercase()
    .has()
    .lowercase();
  return schema.validate(password);
};
