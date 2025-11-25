// src/ingestion/pdfParser.ts

import { promises as fs } from "fs";
import path from "path";

// Load pdf-parse using require so it works in CJS/ESM/ts-node combos
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParseRaw = require("pdf-parse");

/**
 * Try to unwrap whatever shape pdf-parse was exported as and
 * find the actual callable function.
 */
function resolvePdfParse(): (data: Buffer | Uint8Array) => Promise<{ text: string }> {
  let m: any = pdfParseRaw;

  // Walk through nested `.default` up to a few levels until we hit a function.
  for (let i = 0; i < 5; i++) {
    if (typeof m === "function") {
      return m;
    }
    if (m && typeof m === "object" && "default" in m) {
      m = m.default;
      continue;
    }
    break;
  }

  throw new Error(
    `Could not find pdf-parse function export; got type ${typeof m} with keys: ${
      m && typeof m === "object" ? Object.keys(m).join(", ") : ""
    }`
  );
}

const pdfParse = resolvePdfParse();

/**
 * Read a PDF and extract text using pdf-parse.
 */
export async function extractTextFromPdf(filePath: string): Promise<string> {
  const resolved = path.resolve(filePath);
  const data = await fs.readFile(resolved);

  const result = await pdfParse(data);
  return result.text;
}
