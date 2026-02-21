import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DbInstance = NeonHttpDatabase<typeof schema>;

// Lazy singleton — only instantiated on first use, never at module load time.
// This avoids the "No database connection string" error during Next.js build.
let _db: DbInstance | undefined;

function getInstance(): DbInstance {
  if (!_db) {
    if (!process.env.POSTGRES_URL) {
      throw new Error("POSTGRES_URL environment variable is not set");
    }
    _db = drizzle(neon(process.env.POSTGRES_URL), { schema });
  }
  return _db;
}

export const db = new Proxy({} as DbInstance, {
  get(_, prop: string | symbol) {
    return Reflect.get(getInstance(), prop);
  },
});

export type DB = DbInstance;
