export interface PaperMetadata {
    title: string;
    authors?: string[];
    year?: number;
    venue?: string;
    canonicalId?: string; // arXiv ID or DOI
  }
  
  export interface PaperSection {
    heading: string;
    level: number;
    text: string;
  }
  
  export interface PaperReference {
    raw: string;
    title?: string;
    authors?: string[];
    year?: number;
    doi?: string;
    arxivId?: string;
  }
  
  export interface PaperDocument {
    metadata: PaperMetadata;
  
    abstract?: string;
    sections: PaperSection[];
    rawText: string;
  
    references: PaperReference[];
  }
  