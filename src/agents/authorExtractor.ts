import { GoogleGenerativeAI } from "@google/generative-ai";

export interface Author {
  name: string;
  affiliation?: string;
  email?: string;
}

const MODEL_NAME = "gemini-2.5-flash";

function getGeminiClient() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not set in environment");
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Use Gemini to extract authors from an academic paper.
 * For now we just send the full raw text and let the model focus on the header.
 */
export async function extractAuthorsFromText(rawText: string): Promise<Author[]> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `
You are an information extraction system.

Extract the list of authors from this academic paper. Focus on the title block and author block
at the top of the paper. For each author, return:

- name (required)
- affiliation (if present)
- email (if present)

Respond with STRICT JSON in this exact format (no extra keys, no commentary):

{
  "authors": [
    { "name": "Full Name", "affiliation": "Affiliation here or empty string", "email": "email or empty string" },
    ...
  ]
}

If you are unsure about affiliation or email, use an empty string "".

Paper text:
---
${rawText.slice(0, 6000)}
---
  `.trim();

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const response = result.response;
  const text = response.text();

  // Try to locate JSON inside the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn("No JSON block found in model response, raw text:", text);
    return [];
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.authors || !Array.isArray(parsed.authors)) {
      return [];
    }

   const authors: Author[] = parsed.authors
  .map((a: any) => ({
    name: String(a.name || "").trim(),
    affiliation: a.affiliation ? String(a.affiliation).trim() : "",
    email: a.email ? String(a.email).trim() : "",
  }))
  .filter((a: Author) => a.name.length > 0);


    return authors;
  } catch (err) {
    console.error("Failed to parse authors JSON:", err);
    return [];
  }
}
