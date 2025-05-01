
import { defineConfig } from "drizzle-kit";

if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
  throw new Error("MYSQL environment variables must be set");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    host: "127.0.0.1",
  user: "prestasynch",
  password: "1DhbQ[XdK2_6Jzr0",
  database: "prestasynch",
  },
});
