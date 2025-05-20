const corsConfig = {
    origin: "*",
    allowedHeaders: ["Content-Type", "x-api-key"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}

module.exports = corsConfig;