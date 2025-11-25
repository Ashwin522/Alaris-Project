// src/testExplainPaper.ts

import { Client } from "pg";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/alaris";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ GOOGLE_API_KEY is not set.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

async function fetchPaperGraph(paperId: string) {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const paperQuery = `
    SELECT id, title
    FROM nodes
    WHERE id = $1 AND type = 'Paper';
  `;

  const conceptsQuery = `
    SELECT c.id, c.title
    FROM edges e
    JOIN nodes c ON c.id = e.to_id AND c.type = 'Concept'
    WHERE e.from_id = $1 AND e.type = 'discusses'
    ORDER BY c.title;
  `;

  const sectionsQuery = `
    SELECT s.id, s.title
    FROM nodes s
    JOIN edges e ON e.to_id = s.id AND e.type = 'has_section'
    WHERE e.from_id = $1
    ORDER BY s.id;
  `;

  const paperRes = await client.query(paperQuery, [paperId]);
  const conceptsRes = await client.query(conceptsQuery, [paperId]);
  const sectionsRes = await client.query(sectionsQuery, [paperId]);

  await client.end();

  if (paperRes.rowCount === 0) {
    throw new Error("Paper not found in DB.");
  }

  return {
    paper: paperRes.rows[0],
    concepts: conceptsRes.rows,
    sections: sectionsRes.rows,
  };
}

async function explainPaper(graph: any) {
  const prompt = `
You are a research assistant.

Explain the following research paper in a very clear, structured, and simple way.

Use the following fields:

- **Title**
- **High-level summary (2–3 sentences)**
- **Key concepts involved**
- **How these concepts connect together**
- **Why this paper is important**

Here is the paper graph JSON:

${JSON.stringify(graph, null, 2)}

Now produce the explanation. 
Write clean, readable paragraphs.
  `;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return result.response.text();
}

async function main() {
  const paperId =
    "paper:3D_Gaussian_Splatting_for_Real-Time_Radiance_Field_Rendering";

  console.log("📄 Fetching graph data for:", paperId);

  const graph = await fetchPaperGraph(paperId);

  console.log("🧠 Generating explanation with Gemini...\n");

  const explanation = await explainPaper(graph);

  console.log("=== Paper Explanation ===\n");
  console.log(explanation);
}

main().catch((err) => console.error("❌ Error:", err));
