export const isSequelizeModelFile = (file: string): boolean =>
  (file.endsWith(".model.js") || file.endsWith(".model.ts")) &&
  !file.includes(".test.");
