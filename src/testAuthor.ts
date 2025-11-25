import { ingestFromTextFile } from "./ingestion/paperIngestion";
import { extractAuthorsFromText } from "./agents/authorExtractor";

async function main() {
  try {
    // Use the txt version we know works
    const doc = await ingestFromTextFile("tests/sample-papers/sample.txt");
    // or "tests/sample-papers/mypdf.txt" if you saved it like that

    console.log("Paper title:", doc.metadata.title);
    console.log("Running author extraction with Gemini...");

    const authors = await extractAuthorsFromText(doc.rawText);

    console.log("Extracted authors:");
    for (const a of authors) {
      console.log(
        `- ${a.name} | ${a.affiliation || "no affiliation"} | ${
          a.email || "no email"
        }`
      );
    }
  } catch (err) {
    console.error("Error in testAuthors:", err);
  }
}

main();
