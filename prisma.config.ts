import "dotenv/config";
import { defineConfig } from "prisma/config";

const user = encodeURIComponent(process.env.DB_USER ?? "");
const password = encodeURIComponent(process.env.DB_PASSWORD ?? "");
const host = process.env.DB_HOST ?? "localhost";
const port = process.env.DB_PORT ?? "3306";
const database = process.env.DB_NAME ?? "";

const databaseUrl = `mysql://${user}:${password}@${host}:${port}/${database}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
});