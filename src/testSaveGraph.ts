// src/testFullGraphWithAuthors.ts

import { ingestFromPdfFile } from "./ingestion/paperIngestion";
import { extractGraph } from "./graph/graphExtractor";
import { extractConceptsFromText } from "./agents/conceptExtractor";
import { integrateConceptsIntoGraph } from "./graph/conceptGraph";
import { extractAuthorsFromText } from "./agents/authorExtractor";
import { integrateAuthorsIntoGraph } from "./graph/authorGraph";
import { saveGraphToDatabase } from "./db/saveGraph";

async function main() {
  try {
    const pdfPath = "tests/sample-papers/mypdf.pdf"; // adjust if your path is different

    console.log("📥 Ingesting PDF:", pdfPath);
    const doc = await ingestFromPdfFile(pdfPath);

    console.log("🧱 Building base paper + section graph...");
    const baseGraph = extractGraph(doc);

    console.log("🧠 Extracting concepts with Gemini...");
    const concepts = await extractConceptsFromText(doc.rawText);
    console.log(`   → got ${concepts.length} concepts`);

    console.log("🔗 Integrating concepts into graph...");
    const graphWithConcepts = integrateConceptsIntoGraph(
      baseGraph,
      doc,
      concepts
    );

    console.log("👤 Extracting authors with Gemini...");
    const authors = await extractAuthorsFromText(doc.rawText);
    console.log(`   → got ${authors.length} authors`);

    const paperId = `paper:${doc.metadata.title.replace(/\s+/g, "_")}`;

const fullGraph = integrateAuthorsIntoGraph(
  graphWithConcepts, // graph
  authors,           // authors[]
  paperId            // string
);


    console.log("💾 Saving full graph (paper + sections + concepts + authors) to Postgres...");
    await saveGraphToDatabase(fullGraph);

    console.log("✅ Done. Graph saved.");
  } catch (err) {
    console.error("❌ Error in testFullGraphWithAuthors:", err);
  }
}

main();
