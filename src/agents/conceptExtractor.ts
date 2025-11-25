// src/agents/conceptExtractor.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "[conceptExtractor] Warning: GEMINI_API_KEY is not set. Calls will fail."
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// You can change this to match whatever you used in authorExtractor.ts
// e.g. "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash-exp"
const MODEL_NAME =
  process.env.GEMINI_MODEL || "gemini-1.5-flash";

const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
});

export interface ConceptNode {
  id: string;
  name: string;
  description?: string;

  /**
   * Optional index of the section this concept is tied to.
   * If undefined, we'll still create paper→concept edges,
   * just no section→concept edges.
   */
  sectionIndex?: number;
}

/**
 * Ask Gemini to extract key concepts from a paper text.
 * Returns a flat array of ConceptNode objects.
 */
export async function extractConceptsFromText(
  text: string
): Promise<ConceptNode[]> {
  const prompt = `
You are an assistant that extracts important technical concepts from a research paper.

From the following paper text, identify at most 30 key concepts.
For each concept, return:
  - id: a machine-friendly ID like "concept:neural_radiance_field" (lowercase, snake_case)
  - name: human-readable concept name (e.g. "Neural Radiance Field (NeRF)")
  - description: 1–2 sentence explanation
  - sectionIndex: OPTIONAL integer 0-based index of the section where this concept is most central.
    If you don't know, you can omit it.

Return a SINGLE JSON object with this shape:

{
  "concepts": [
    {
      "id": "concept:some_slug",
      "name": "Some Concept",
      "description": "Short explanation...",
      "sectionIndex": 0
    }
  ]
}

Do NOT include any text before or after the JSON.
`;

  const fullPrompt = `${prompt.trim()}\n\n--- PAPER TEXT START ---\n${text}\n--- PAPER TEXT END ---`;

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: fullPrompt }],
      },
    ],
  });

  const response = result.response;
  const rawText = response.text();

  try {
    const parsed = JSON.parse(rawText);

    if (!parsed || !Array.isArray(parsed.concepts)) {
      console.warn(
        "[conceptExtractor] Parsed JSON but 'concepts' is missing or not an array."
      );
      return [];
    }

    const concepts: ConceptNode[] = parsed.concepts.map((c: any) => {
      const id: string =
        typeof c.id === "string" && c.id.length > 0
          ? c.id
          : makeConceptIdFromName(String(c.name || "concept"));

      return {
        id,
        name: String(c.name || id),
        description:
          typeof c.description === "string" ? c.description : "",
        sectionIndex:
          typeof c.sectionIndex === "number" ? c.sectionIndex : undefined,
      };
    });

    return concepts;
  } catch (err) {
    console.error(
      "[conceptExtractor] Failed to parse JSON from Gemini:",
      err
    );
    console.error("[conceptExtractor] Raw model output:", rawText);
    return [];
  }
}

/**
 * Fallback ID builder if Gemini doesn't provide a good `id`.
 */
function makeConceptIdFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return `concept:${slug || "unnamed"}`;
}
