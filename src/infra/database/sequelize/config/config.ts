import { DATABASE_URL } from "../../../../core/env.js";

const envVar = DATABASE_URL;

export default {
    url: envVar,
    dialect: "mariadb",
}