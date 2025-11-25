import type { PaperDocument } from '../types/PaperDocument';

export interface GraphNode {
  id: string;
  type: string;
  data: any;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: string;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Convert a PaperDocument into graph nodes + edges.
 * v0: Only paper + sections + paper→section edges.
 */
export function extractGraph(doc: PaperDocument): Graph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Create the Paper node
  const paperId = `paper:${doc.metadata.title.replace(/\s+/g, '_')}`;
  nodes.push({
    id: paperId,
    type: 'Paper',
    data: {
      title: doc.metadata.title,
      abstract: doc.abstract
    }
  });

  // Create Section nodes + edges
  for (let i = 0; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (!section) continue; // <-- fixes "possibly undefined"

    const sectionId = `section:${i}`;

    nodes.push({
      id: sectionId,
      type: 'Section',
      data: {
        heading: section.heading,
        text: section.text
      }
    });

    edges.push({
      from: paperId,
      to: sectionId,
      type: 'has_section'
    });
  }

  return { nodes, edges };
}
