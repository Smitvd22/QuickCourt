import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";
import * as schema from "@shared/schema";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const { Pool } = pg;
const allowSelfSigned = process.env.DB_SSL_ALLOW_SELF_SIGNED === "true";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: allowSelfSigned ? { rejectUnauthorized: false } : { rejectUnauthorized: true },
});
export const db = drizzle({ client: pool, schema });