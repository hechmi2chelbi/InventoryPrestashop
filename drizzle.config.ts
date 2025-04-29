
import { defineConfig } from "drizzle-kit";

if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
  throw new Error("MYSQL environment variables must be set");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql2",
  dbCredentials: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  },
});
