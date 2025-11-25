import { promises as fs } from 'fs';
import path from 'path';
import type { PaperDocument } from '../types/PaperDocument';
import { extractTextFromPdf } from './pdfParser';

/**
 * Heuristic title extractor:
 * - Split into lines
 * - Take the first non-empty, non-metadata-looking line
 * - Prefer something that has spaces and is at least 10 chars
 */
function extractTitle(text: string): string | undefined {
  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const lower = line.toLowerCase();

    // skip obvious metadata / boilerplate lines
    if (
      lower.startsWith('arxiv:') ||
      lower.startsWith('ccs concepts:') ||
      lower.startsWith('acm reference format:') ||
      lower.startsWith('authors\' addresses:') ||
      lower.startsWith('authors:') ||
      lower.startsWith('additional key words') ||
      lower.startsWith('keywords:')
    ) {
      continue;
    }

    // Heuristic: looks like a real title
    if (line.length > 10 && line.includes(' ')) {
      return line;
    }
  }

  return undefined;
}

/**
 * Extracts an abstract from the raw text, if it finds an "Abstract" header.
 * Very simple heuristic:
 * - Find line that is "Abstract" or starts with "Abstract:"
 * - Take following non-empty lines until a blank line
 */
function extractAbstract(text: string): { abstract?: string } {
  const lines = text.split(/\r?\n/);

  const abstractHeaderIndex = lines.findIndex(line =>
    /^abstract[:\s]*$/i.test(line.trim()) ||
    line.trim().toLowerCase().startsWith('abstract:')
  );

  if (abstractHeaderIndex === -1) {
    // No explicit "Abstract" section found
    return {};
  }

  const abstractLines: string[] = [];
  for (let i = abstractHeaderIndex + 1; i < lines.length; i++) {
    const line = lines[i] ?? '';
    // stop when we hit a completely blank line
    if (line.trim() === '') break;
    abstractLines.push(line.trim());
  }

  const abstract = abstractLines.join(' ');
  if (!abstract) {
    return {};
  }

  return { abstract };
}

/**
 * Extracts coarse sections like "Introduction", "Method", "Experiments", etc.
 * Heuristic:
 * - Treat a line that exactly matches or starts with a known section name
 *   as a section heading.
 * - Capture all following lines until the next section heading.
 */
function extractSections(text: string): { heading: string; level: number; text: string }[] {
  const lines = text.split(/\r?\n/);

  const sectionNames = [
    'introduction',
    'related work',
    'method',
    'approach',
    'methods',
    'experiments',
    'results',
    'conclusion',
    'discussion'
  ];

  const sections: { heading: string; level: number; text: string }[] = [];

  let currentHeading: string | null = null;
  let currentLines: string[] = [];

  function flushSection() {
    if (currentHeading && currentLines.length > 0) {
      sections.push({
        heading: currentHeading,
        level: 1,
        text: currentLines.join('\n').trim()
      });
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const normalized = line.toLowerCase();

    const matchedHeading = sectionNames.find(
      h => normalized === h || normalized.startsWith(h + ':')
    );

    if (matchedHeading) {
      // Finish previous section, if any
      flushSection();

      // Start new section
      currentHeading = matchedHeading;
      currentLines = [];
      continue;
    }

    if (currentHeading) {
      currentLines.push(line);
    }
  }

  // Flush last section
  flushSection();

  return sections;
}

/**
 * Ingest from a plain text file.
 * - rawText from file
 * - metadata.title from extracted title (fallback = filename)
 * - optional abstract
 * - coarse sections
 * - empty references
 */
export async function ingestFromTextFile(filePath: string): Promise<PaperDocument> {
  const resolvedPath = path.resolve(filePath);

  const rawText = await fs.readFile(resolvedPath, 'utf8');

  const { abstract } = extractAbstract(rawText);
  const sections = extractSections(rawText);
  const title = extractTitle(rawText) ?? path.basename(resolvedPath);

  const doc: PaperDocument = {
    metadata: {
      title,
    },
    ...(abstract ? { abstract } : {}),
    sections,
    rawText,
    references: []
  };

  return doc;
}

/**
 * Ingest from a PDF file.
 * - uses pdf-parse (via extractTextFromPdf) to extract text
 * - then reuses the same abstract + section + title extractors
 *
 * NOTE: your pdf-parse wiring is still flaky, so you don't *need* this
 * for now. You can keep it here for later, just don't call it.
 */
export async function ingestFromPdfFile(pdfPath: string): Promise<PaperDocument> {
  const rawText = await extractTextFromPdf(pdfPath);

  const { abstract } = extractAbstract(rawText);
  const sections = extractSections(rawText);
  const title = extractTitle(rawText) ?? path.basename(pdfPath);

  const doc: PaperDocument = {
    metadata: {
      title,
    },
    ...(abstract ? { abstract } : {}),
    sections,
    rawText,
    references: []
  };

  return doc;
}
