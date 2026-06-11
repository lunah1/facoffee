import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();


const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      status VARCHAR(20) NOT NULL,
      roles JSONB,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP,
      deactivated_at TIMESTAMP
    )
  `);

  console.log("Users table ready.");
}

export default pool;