import { ingestFromTextFile } from './ingestion/paperIngestion';
import { extractConceptsFromText } from './agents/conceptExtractor';

(async () => {
  try {
    // Load your already-converted PDF text
    const doc = await ingestFromTextFile('tests/sample-papers/mypdf.txt');

    // Get the introduction section
    const introSection = doc.sections.find(
      (s) => s.heading.toLowerCase() === 'introduction'
    );

    if (!introSection) {
      console.error('No "Introduction" section found in this paper.');
      return;
    }

    // Extract concepts using Gemini
    const concepts = await extractConceptsFromText(introSection.text);

    // Print nicely
    console.log(JSON.stringify(concepts, null, 2));
  } catch (err) {
    console.error('Error in concept extraction test:', err);
  }
})();
