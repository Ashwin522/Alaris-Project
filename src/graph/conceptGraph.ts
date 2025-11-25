// src/graph/conceptGraph.ts

import type { PaperDocument } from "../types/PaperDocument";
import type { Graph, GraphNode, GraphEdge } from "./graphExtractor";
import type { ConceptNode } from "../agents/conceptExtractor";

/**
 * Build consistent paper ID just like extractGraph() does.
 */
function getPaperId(doc: PaperDocument): string {
  return `paper:${doc.metadata.title.replace(/\s+/g, "_")}`;
}

/**
 * Ensure the concept has a stable ID.
 */
function ensureConceptId(concept: ConceptNode): string {
  if (concept.id && concept.id.length > 0) {
    return concept.id;
  }

  const slug = concept.name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  return `concept:${slug || "unnamed"}`;
}

/**
 * ✅ PUBLIC EXPORT
 * Integrate an array of concepts (ConceptNode[]) into the existing graph.
 *
 * - Creates Concept nodes
 * - Adds edges:
 *     paper -> concept      (discusses)
 *     section -> concept    (mentions)   ONLY if sectionIndex is present
 */
export function integrateConceptsIntoGraph(
  baseGraph: Graph,
  doc: PaperDocument,
  concepts: ConceptNode[]
): Graph {
  const nodes: GraphNode[] = [...baseGraph.nodes];
  const edges: GraphEdge[] = [...baseGraph.edges];

  const existingNodeIds = new Set(nodes.map((n) => n.id));
  const existingEdgeKeys = new Set(
    edges.map((e) => `${e.from}|${e.to}|${e.type}`)
  );

  const paperId = getPaperId(doc);

  for (const concept of concepts) {
    const conceptId = ensureConceptId(concept);

    // 1) Create concept node if needed
    if (!existingNodeIds.has(conceptId)) {
      nodes.push({
        id: conceptId,
        type: "Concept",
        data: {
          name: concept.name,
          description: concept.description ?? "",
        },
      });
      existingNodeIds.add(conceptId);
    }

    // 2) Edge: paper -> concept
    {
      const key = `${paperId}|${conceptId}|discusses`;
      if (!existingEdgeKeys.has(key)) {
        edges.push({
          from: paperId,
          to: conceptId,
          type: "discusses",
        });
        existingEdgeKeys.add(key);
      }
    }

    // 3) Edge: section -> concept (only if sectionIndex exists)
    if (
      concept.sectionIndex !== undefined &&
      concept.sectionIndex !== null
    ) {
      const sectionId = `section:${concept.sectionIndex}`;
      const key = `${sectionId}|${conceptId}|mentions`;

      if (!existingEdgeKeys.has(key)) {
        edges.push({
          from: sectionId,
          to: conceptId,
          type: "mentions",
        });
        existingEdgeKeys.add(key);
      }
    }
  }

  return { nodes, edges };
}
