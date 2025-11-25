// src/testSimilarPapers.ts

import { Client } from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/alaris";

async function findSimilarPapers(paperId: string) {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const query = `
    WITH target_concepts AS (
      SELECT to_id AS concept_id
      FROM edges
      WHERE from_id = $1
        AND type = 'discusses'
    ),
    other_papers AS (
      SELECT from_id AS paper_id, to_id AS concept_id
      FROM edges
      WHERE type = 'discusses'
        AND from_id != $1
    ),
    overlap AS (
      SELECT 
        op.paper_id,
        COUNT(*) AS shared_concepts
      FROM other_papers op
      JOIN target_concepts tc
        ON tc.concept_id = op.concept_id
      GROUP BY op.paper_id
    )
    SELECT 
      o.paper_id,
      n.title,
      o.shared_concepts
    FROM overlap o
    JOIN nodes n
      ON n.id = o.paper_id
    ORDER BY shared_concepts DESC, n.title;
  `;

  const res = await client.query(query, [paperId]);

  await client.end();
  return res.rows;
}

async function main() {
  const paperId =
    "paper:3D_Gaussian_Splatting_for_Real-Time_Radiance_Field_Rendering"; // change if needed

  console.log("🔍 Finding similar papers based on shared concepts...\n");

  const results = await findSimilarPapers(paperId);

  if (results.length === 0) {
    console.log("No similar papers found (maybe only 1 paper in DB?).");
    return;
  }

  for (const row of results) {
    console.log(
      `• ${row.title} (${row.paper_id}) — shared ${row.shared_concepts} concepts`
    );
  }
}

main();
