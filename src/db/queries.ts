// src/db/queries.ts
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Basic node type for query results
export interface DbNode {
  id: string;
  type: string;
  title: string | null;
  data?: any;
}

/**
 * Get a Paper node by (exact) title.
 */
export async function getPaperByTitle(title: string): Promise<DbNode | null> {
  const res = await pool.query(
    `
    SELECT id, type, title, data
    FROM nodes
    WHERE type = 'Paper' AND title = $1
    LIMIT 1
    `,
    [title]
  );

  if (res.rows.length === 0) return null;
  return res.rows[0];
}

/**
 * Get the first Paper in the DB (useful for quick tests).
 */
export async function getAnyPaper(): Promise<DbNode | null> {
  const res = await pool.query(
    `
    SELECT id, type, title, data
    FROM nodes
    WHERE type = 'Paper'
    LIMIT 1
    `
  );

  if (res.rows.length === 0) return null;
  return res.rows[0];
}

/**
 * Get authors for a paper (paper -> author edges of type 'authored_by').
 */
export async function getAuthorsForPaper(paperId: string): Promise<DbNode[]> {
  const res = await pool.query(
    `
    SELECT n.id, n.type, n.title, n.data
    FROM edges e
    JOIN nodes n ON e.to_id = n.id
    WHERE e.from_id = $1
      AND e.type = 'authored_by'
    ORDER BY n.title
    `,
    [paperId]
  );

  return res.rows;
}

/**
 * Get concepts discussed by a paper (paper -> concept edges of type 'discusses').
 */
export async function getConceptsForPaper(paperId: string): Promise<DbNode[]> {
  const res = await pool.query(
    `
    SELECT n.id, n.type, n.title, n.data
    FROM edges e
    JOIN nodes n ON e.to_id = n.id
    WHERE e.from_id = $1
      AND e.type = 'discusses'
    ORDER BY n.title
    `,
    [paperId]
  );

  return res.rows;
}

/**
 * Close pool (optional for tests).
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
