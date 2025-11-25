import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // example: postgres://user:pass@localhost:5432/alaris
});
