import path from "node:path";
import { defineConfig } from "prisma/config";
import dotenv from 'dotenv';

dotenv.config();

const DB_URL : string|undefined = process.env.DB_URL;
if (!DB_URL) {
  throw new Error("Environment variable DB_URL is not set");
}

const PERSISTENCE_PATH : string = path.join("src", "infrastructure", "persistence");

export default defineConfig({
  schema: path.join(PERSISTENCE_PATH, "orm", "schema.prisma"),
  migrations: { 
    path: path.join(PERSISTENCE_PATH, "db", "migrations"),
  },
  views: { 
    path: path.join(PERSISTENCE_PATH, "db", "views"),
  },
  typedSql: { 
  path: path.join(PERSISTENCE_PATH, "db", "queries"),
  },
  engine: "classic",
  datasource: { 
    url: DB_URL 
  }
});