import { ingestFromTextFile } from './ingestion/paperIngestion';

(async () => {
  const doc = await ingestFromTextFile('tests/sample-papers/sample.txt');
  console.log(JSON.stringify(doc, null, 2));
})();
