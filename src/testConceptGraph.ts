import { ingestFromTextFile } from './ingestion/paperIngestion';
import { extractGraph } from './graph/graphExtractor';
import { extractConceptsFromText } from './agents/conceptExtractor';
import { integrateConceptsIntoGraph } from './graph/conceptGraph';

(async () => {
  const doc = await ingestFromTextFile('tests/sample-papers/mypdf.txt');

  // Build base graph (paper + sections)
  const baseGraph = extractGraph(doc);

  // Extract concepts per section
  const conceptsBySection: Record<string, any[]> = {};

  for (let i = 0; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (!section) continue;

    const sectionId = `section:${i}`;
    const concepts = await extractConceptsFromText(section.text);

    conceptsBySection[sectionId] = concepts;
  }

  // Integrate into final graph
  const graph = integrateConceptsIntoGraph(baseGraph, doc, conceptsBySection);

  console.log(JSON.stringify(graph, null, 2));
})();
