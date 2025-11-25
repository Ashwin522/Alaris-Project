// src/graph/authorGraph.ts

import type { Author } from "../agents/authorExtractor";
import type { Graph, GraphNode, GraphEdge } from "./graphExtractor";

/**
 * Build a stable ID for an author.
 * e.g. "Bernhard Kerbl" -> author:bernhard_kerbl
 *      "John Smith" @ "MIT" -> author:john_smith_mit
 */
function makeAuthorId(author: Author): string {
  const baseName = author.name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  const affiliationPart = author.affiliation
    ? author.affiliation
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
    : "";

  const idCore = affiliationPart ? `${baseName}_${affiliationPart}` : baseName;
  return `author:${idCore}`;
}

/**
 * Integrate authors into an existing graph:
 *  - create Author nodes
 *  - add edges:
 *      paper -> author (authored_by)
 *      author -> paper (author_of)
 */
export function integrateAuthorsIntoGraph(
  baseGraph: Graph,
  authors: Author[],
  paperId: string
): Graph {
  const nodes: GraphNode[] = [...baseGraph.nodes];
  const edges: GraphEdge[] = [...baseGraph.edges];

  const existingNodeIds = new Set<string>(nodes.map((n) => n.id));
  const existingEdgeKeys = new Set<string>(
    edges.map((e) => `${e.from}|${e.to}|${e.type}`)
  );

  for (const author of authors) {
    const authorId = makeAuthorId(author);

    // 1) Author node
    if (!existingNodeIds.has(authorId)) {
      const node: GraphNode = {
        id: authorId,
        type: "Author",
        data: {
          // saveGraph will derive the "title" column from this later
          name: author.name,
          affiliation: author.affiliation || "",
          email: author.email || "",
        },
      };

      nodes.push(node);
      existingNodeIds.add(authorId);
    }

    // 2) paper -> author (authored_by)
    {
      const key = `${paperId}|${authorId}|authored_by`;
      if (!existingEdgeKeys.has(key)) {
        edges.push({
          from: paperId,
          to: authorId,
          type: "authored_by",
        });
        existingEdgeKeys.add(key);
      }
    }

    // 3) author -> paper (author_of)
    {
      const key = `${authorId}|${paperId}|author_of`;
      if (!existingEdgeKeys.has(key)) {
        edges.push({
          from: authorId,
          to: paperId,
          type: "author_of",
        });
        existingEdgeKeys.add(key);
      }
    }
  }

  return { nodes, edges };
}
