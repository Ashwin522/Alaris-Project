// src/testReferences.ts

import { ingestFromPdfFile } from "./ingestion/paperIngestion";
import { extractReferences } from "./referenceExtractor";

async function main() {
  const filePath = "tests/sample-papers/mypdf.pdf";

  console.log("📄 Ingesting PDF...");
  const doc = await ingestFromPdfFile(filePath);

  console.log("📝 Extracting references...\n");

  const refs = extractReferences(doc.rawText);

  console.log("=== Extracted References ===");
  console.log(refs);
}

main().catch((err) => console.error("❌ Error in testReferences:", err));
