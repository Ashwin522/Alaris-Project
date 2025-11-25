import { ingestFromTextFile } from './ingestion/paperIngestion';

(async () => {
  try {
    const doc = await ingestFromTextFile('tests/sample-papers/mypdf.txt');
    console.log(JSON.stringify(doc, null, 2));
  } catch (err) {
    console.error('Error ingesting TXT:', err);
  }
})();
