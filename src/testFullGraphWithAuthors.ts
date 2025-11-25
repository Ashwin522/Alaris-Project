// src/testFullGraphWithAuthors.ts

import path from "path";
import { ingestFromPdfFile } from "./ingestion/paperIngestion";
import { extractGraph } from "./graph/graphExtractor";
import { extractConceptsFromText } from "./agents/conceptExtractor";
import { integrateConceptsIntoGraph } from "./graph/conceptGraph";
import { extractAuthorsFromText } from "./agents/authorExtractor";
import { integrateAuthorsIntoGraph } from "./graph/authorGraph";
import { saveGraphToDatabase, closePool } from "./db/saveGraph";

async function main(): Promise<void> {
  try {
    // 1. Load the PDF
    const pdfPath = path.join(__dirname, "..", "tests", "sample-papers", "mypdf.pdf");
    const doc = await ingestFromPdfFile(pdfPath);

    const paperId = `paper:${doc.metadata.title.replace(/\s+/g, "_")}`;
    console.log("Paper title:", doc.metadata.title);
    console.log("Paper ID:", paperId);

    // 2. Base graph (paper + sections)
    let graph = extractGraph(doc);

    // 3. Concepts + concept edges
    // extractConceptsFromText currently returns ConceptNode[]
    const concepts = await extractConceptsFromText(doc.rawText);
    graph = integrateConceptsIntoGraph(graph, doc, concepts);

    // 4. Authors + author edges
    const authors = await extractAuthorsFromText(doc.rawText);
    console.log("Authors from Gemini:", authors);
    graph = integrateAuthorsIntoGraph(graph, authors, paperId);

    // 5. Save everything to Postgres
    await saveGraphToDatabase(graph);
    console.log("✅ Graph with concepts + authors saved to DB.");
  } catch (err) {
    console.error("Error in testFullGraphWithAuthors:", err);
  } finally {
    await closePool();
  }
}

main();
