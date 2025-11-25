// src/agents/referenceExtractor.ts

export interface Reference {
  id: string;
  raw: string;
}

export function extractReferences(text: string): Reference[] {
  const lines = text.split(/\r?\n/);

  // Find "References" or "Bibliography"
  const refStartIndex = lines.findIndex((line) =>
    /^(references|bibliography)/i.test(line.trim())
  );

  if (refStartIndex === -1) {
    console.warn("[referenceExtractor] No References section found.");
    return [];
  }

  const refLines = lines.slice(refStartIndex + 1);

  const refs: Reference[] = [];

  for (let i = 0; i < refLines.length; i++) {
    const rawLine = refLines[i];
    if (!rawLine) continue;

    const line = rawLine.trim();
    if (!line) continue;

    // Match lines like: "1. Some reference text..."
    const match = line.match(/^(\d+)\.\s+(.*)/);
    if (!match) continue;

    const number = match[1] ?? "";
    const content = match[2] ?? "";

    // Extra safety: if either is empty, skip
    if (!number || !content) continue;

    refs.push({
      id: `reference:${number}`,
      raw: content, // now guaranteed to be a string
    });
  }

  return refs;
}
