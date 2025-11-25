// src/apiServer.ts

import express from "express";
import { Client } from "pg";

const app = express();
const PORT = process.env.PORT || 3000;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://username:password@localhost:5432/alaris"; // adjust if needed

function createClient() {
  return new Client({
    connectionString: DATABASE_URL,
  });
}

// Simple health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// 🧾 List all papers
app.get("/papers", async (_req, res) => {
  const client = createClient();
  try {
    await client.connect();

    const result = await client.query(
      `
      SELECT id, title
      FROM nodes
      WHERE type = 'Paper'
      ORDER BY title;
      `
    );

    res.json({
      count: result.rowCount,
      papers: result.rows,
    });
  } catch (err) {
    console.error("[GET /papers] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.end();
  }
});

// 📄 Get one paper with its concepts and authors
app.get("/papers/:paperId", async (req, res) => {
  const paperId = req.params.paperId;
  const client = createClient();

  try {
    await client.connect();

    // 1) Fetch paper node
    const paperRes = await client.query(
      `
      SELECT id, type, title
      FROM nodes
      WHERE id = $1
        AND type = 'Paper'
      LIMIT 1;
      `,
      [paperId]
    );

    if (paperRes.rowCount === 0) {
      return res.status(404).json({ error: "Paper not found" });
    }

    const paper = paperRes.rows[0];

    // 2) Concepts discussed by this paper
    const conceptsRes = await client.query(
      `
      SELECT c.id, c.title
      FROM edges e
      JOIN nodes c
        ON c.id = e.to_id
       AND c.type = 'Concept'
      WHERE e.from_id = $1
        AND e.type = 'discusses'
      ORDER BY c.title;
      `,
      [paperId]
    );

    // 3) Authors of this paper (edge type 'written_by')
    const authorsRes = await client.query(
      `
      SELECT a.id, a.title
      FROM edges e
      JOIN nodes a
        ON a.id = e.to_id
       AND a.type = 'Author'
      WHERE e.from_id = $1
        AND e.type = 'written_by'
      ORDER BY a.title;
      `,
      [paperId]
    );

    res.json({
      paper,
      concepts: conceptsRes.rows,
      authors: authorsRes.rows,
    });
  } catch (err) {
    console.error("[GET /papers/:paperId] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.end();
  }
});

// 🧠 Get all papers related to a concept (by id OR name)
app.get("/concepts/:conceptSearch/papers", async (req, res) => {
  const conceptSearch = req.params.conceptSearch;
  const client = createClient();

  try {
    await client.connect();

    const result = await client.query(
      `
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
      `,
      [conceptSearch, `%${conceptSearch}%`]
    );

    if (result.rowCount === 0) {
      return res.json({
        conceptSearch,
        matches: [],
      });
    }

    // Group by concept
    const byConcept = new Map<
      string,
      { conceptTitle: string; papers: { id: string; title: string }[] }
    >();

    for (const row of result.rows) {
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

    const payload = Array.from(byConcept.entries()).map(
      ([conceptId, group]) => ({
        conceptId,
        conceptTitle: group.conceptTitle,
        papers: group.papers,
      })
    );

    res.json({
      conceptSearch,
      results: payload,
    });
  } catch (err) {
    console.error("[GET /concepts/:conceptSearch/papers] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.end();
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server listening on http://localhost:${PORT}`);
});
