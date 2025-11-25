// src/db/saveGraph.ts

import { Pool } from "pg";
import type { Graph } from "../graph/graphExtractor";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function inferTitle(node: { type: string; data: any }): string | null {
  const d = node.data || {};

  switch (node.type) {
    case "Paper":
      // we stored this as { title: ... }
      return d.title ?? null;
    case "Section":
      // we stored this as { heading: ... }
      return d.heading ?? null;
    case "Concept":
      // we stored this as { name: ... }
      return d.name ?? d.title ?? null;
    case "Author":
      // we stored this as { name: ... }
      return d.name ?? d.title ?? null;
    default:
      return null;
  }
}

export async function saveGraphToDatabase(graph: Graph): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) Upsert nodes
    for (const node of graph.nodes) {
      const title = inferTitle(node);
      const dataJson = node.data ? JSON.stringify(node.data) : null;

      await client.query(
        `
        INSERT INTO nodes (id, type, title, data)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id)
        DO UPDATE SET
          type = EXCLUDED.type,
          title = EXCLUDED.title,
          data = EXCLUDED.data
        `,
        [node.id, node.type, title, dataJson]
      );
    }

    // 2) Upsert edges (avoid duplicates)
    for (const edge of graph.edges) {
      await client.query(
        `
        INSERT INTO edges (from_id, to_id, type)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
        `,
        [edge.from, edge.to, edge.type]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error saving graph:", err);
    throw err;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}
