export function configurePermissionsTestEnvironment(env: NodeJS.ProcessEnv = process.env): URL {
  let target: URL;
  try {
    target = new URL(env.DATABASE_URL ?? "");
    if (target.protocol !== "mariadb:" || target.search !== "" || target.hash !== "" ||
        !["127.0.0.1", "localhost", "[::1]"].includes(target.hostname) ||
        !/^[a-z][a-z0-9_]*_permissions_test$/.test(target.pathname.slice(1)) ||
        !target.username || decodeURIComponent(target.username).toLowerCase() === "root" ||
        env.PERMISSIONS_TEST_RESET !== "YES") throw new Error("unsafe target");
  } catch {
    throw new Error("PERMISSIONS_TEST_TARGET_REFUSED: explicit local test database, non-root user and PERMISSIONS_TEST_RESET=YES required");
  }
  Object.assign(env, {
    NODE_ENV: "test", SECRET_KEY: "permissions-integration-synthetic-key",
    MAIL_ADRESS: "permissions@example.invalid", MAIL_PASSWORD: "synthetic-not-used",
    MAIL_HOST: "127.0.0.1", MAIL_PORT: "25", MAIL_SECURE: "false",
    CORS_ORIGINS: "http://localhost:5173", APPLICATION_PORT: "3099",
    PDF_API_URL: "http://127.0.0.1:3098", BOOTSTRAP_ADMIN_EMAIL: "permissions@example.invalid",
    BOOTSTRAP_ADMIN_PASSWORD: "SyntheticPermissionsTestOnly!2026",
  });
  return target;
}
