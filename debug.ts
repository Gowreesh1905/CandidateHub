import { PdfResumeIngestor } from './src/ingestors/PdfResumeIngestor';

async function test() {
  const ing = new PdfResumeIngestor();
  try {
    const res = await ing.ingest('./mock-data/resume.pdf');
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Error reading PDF:", err);
  }
}
test();
