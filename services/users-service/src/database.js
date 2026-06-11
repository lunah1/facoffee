import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://users_user:users_password@localhost:5433/users_db"
});

export async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      roles JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ,
      deactivated_at TIMESTAMPTZ
    );
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS keycloak_id TEXT;
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_keycloak_id_unique
    ON users(keycloak_id)
    WHERE keycloak_id IS NOT NULL;
  `);
}