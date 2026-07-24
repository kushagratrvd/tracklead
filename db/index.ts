import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Disable fetch caching for Neon HTTP connections
neonConfig.fetchConnectionCache = true;

const connectionString = process.env.DATABASE_URL;

export function getDb() {
  if (!connectionString) {
    // Note: For production and local dev with Neon, set DATABASE_URL in .env.local
    // Return neon proxy with placeholder to satisfy types if connection string is missing during static analysis
    const sql = neon("postgresql://user:pass@localhost:5432/db");
    return drizzleNeon(sql, { schema });
  }
  const sql = neon(connectionString);
  return drizzleNeon(sql, { schema });
}

export const db = getDb();
export type DbClient = typeof db;
