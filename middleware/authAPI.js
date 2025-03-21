require("dotenv").config({ path: `${__dirname}/../config/config.env` });

const auth = (request, reply, next) => {
console.log(__dirname)
const apiKey = request.headers["x-api-key"];

  console.log(apiKey + " " + process.env.API_KEY);
  
  if (apiKey !== process.env.API_KEY) {
    const error = new Error('not authorized');

    error.status = 401;
    throw error;
  }
  next();
};

module.exports = auth;