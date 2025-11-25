import { ingestFromTextFile } from './ingestion/paperIngestion';
import { extractGraph } from './graph/graphExtractor';

(async () => {
  const doc = await ingestFromTextFile('tests/sample-papers/mypdf.txt');
  const graph = extractGraph(doc);

  console.log(JSON.stringify(graph, null, 2));
})();
