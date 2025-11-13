import path from "node:path";
import { defineConfig } from "prisma/config";
import dotenv from 'dotenv';

dotenv.config();

const POSTGRES_URL : string|undefined = process.env.POSTGRES_URL;
if (!POSTGRES_URL) {
  throw new Error("Environment variable POSTGRES_URL is not set");
}

const DB_PATH : string = path.join("src", "db");

export default defineConfig({
  schema: path.join(DB_PATH, "orm", "schema.prisma"),
  migrations: { 
    path: path.join(DB_PATH, "persist", "migrations"),
  },
  views: { 
    path: path.join(DB_PATH, "persist", "views"),
  },
  typedSql: { 
  path: path.join(DB_PATH, "persist", "queries"),
  },
  engine: "classic",
  datasource: { 
    url: POSTGRES_URL 
  }
});