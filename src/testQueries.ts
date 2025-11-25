// src/testQueries.ts
import {
  getAnyPaper,
  getAuthorsForPaper,
  getConceptsForPaper,
  closePool,
} from "./db/queries";

async function main(): Promise<void> {
  try {
    const paper = await getAnyPaper();

    if (!paper) {
      console.error("No Paper nodes found in the database.");
      return;
    }

    console.log(`📄 Paper: ${paper.title} (${paper.id})`);

    const authors = await getAuthorsForPaper(paper.id);
    console.log("\n👤 Authors:");
    if (authors.length === 0) {
      console.log("  (none found)");
    } else {
      for (const a of authors) {
        // data might hold extra fields if you stored them
        const data = (a as any).data || {};
        const name = a.title || data.name || "(no name)";
        const affiliation = data.affiliation || "";
        const email = data.email || "";

        console.log(
          `  - ${name}` +
            (affiliation ? ` | ${affiliation}` : "") +
            (email ? ` | ${email}` : "")
        );
      }
    }

    const concepts = await getConceptsForPaper(paper.id);
    console.log("\n🧠 Concepts discussed by this paper:");
    if (concepts.length === 0) {
      console.log("  (none found)");
    } else {
      for (const c of concepts) {
        const name = c.title || "(no title)";
        console.log(`  - ${name} (${c.id})`);
      }
    }
  } catch (err) {
    console.error("Error in testQueries:", err);
  } finally {
    await closePool();
  }
}

main();
