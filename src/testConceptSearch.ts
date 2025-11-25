// src/testConceptSearch.ts

import { Client } from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://username:password@localhost:5432/alaris"; // adjust if needed

async function getPapersForConcept(conceptSearch: string) {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  await client.connect();

  // We try to match both by ID and by title (case-insensitive)
  const query = `
    SELECT
      c.id        AS concept_id,
      c.title     AS concept_title,
      p.id        AS paper_id,
      p.title     AS paper_title
    FROM nodes AS c
    JOIN edges AS e
      ON e.to_id = c.id
     AND e.type = 'discusses'
    JOIN nodes AS p
      ON p.id = e.from_id
     AND p.type = 'Paper'
    WHERE c.type = 'Concept'
      AND (
        c.id = $1
        OR c.title ILIKE $2
      )
    ORDER BY p.title;
  `;

  const values = [conceptSearch, `%${conceptSearch}%`];

  const res = await client.query(query, values);

  await client.end();

  return res.rows;
}

async function main() {
  try {
    // 🔧 Change this to any concept you expect from Gemini / your graph
    // e.g. "Neural Radiance Field", "3D Gaussians", "concept:neural_radiance_field"
    const conceptSearch = "3D Gaussians";

    console.log(`🔍 Searching for papers related to concept: "${conceptSearch}"\n`);

    const rows = await getPapersForConcept(conceptSearch);

    if (rows.length === 0) {
      console.log("No papers found for that concept.");
      return;
    }

    // Group by concept (in case multiple concepts match)
    const byConcept = new Map<
      string,
      { conceptTitle: string; papers: { id: string; title: string }[] }
    >();

    for (const row of rows) {
      const conceptId = row.concept_id as string;
      const conceptTitle = (row.concept_title as string) || conceptId;

      if (!byConcept.has(conceptId)) {
        byConcept.set(conceptId, {
          conceptTitle,
          papers: [],
        });
      }

      byConcept.get(conceptId)!.papers.push({
        id: row.paper_id,
        title: row.paper_title,
      });
    }

    for (const [conceptId, group] of byConcept.entries()) {
      console.log(
        `🧠 Concept: ${group.conceptTitle} (${conceptId})`
      );
      console.log("   Discussed by papers:");
      for (const p of group.papers) {
        console.log(`     • ${p.title} (${p.id})`);
      }
      console.log();
    }
  } catch (err) {
    console.error("❌ Error in testConceptSearch:", err);
  }
}

main();
