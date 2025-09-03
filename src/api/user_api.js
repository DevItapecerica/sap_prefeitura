import axios from "axios";

const USER_API = axios.create({
  baseURL: process.env.USER_API_HOST,
  headers: {
    "Content-Type": "application/json",
  },
});

USER_API.interceptors.request.use(
  (config) => {
    config.headers["x-api-key"] = process.env.USER_API_KEY;
    return config;
  },
  (error) => Promise.reject(error)
);

export default USER_API;
