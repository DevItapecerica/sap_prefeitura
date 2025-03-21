require("dotenv").config({path: `${__dirname}/../config/.env`});

const axios = require("axios");

const USER_API = axios.create({
  baseURL: "http://192.168.16.13:8002",
  headers: {
    "Content-Type": "application/json",
  },
});

USER_API.interceptors.request.use(
  (config) => {
    config.headers["x-api-key"] = process.env.USER_API_KEY;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

module.exports = USER_API