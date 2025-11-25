-- ========== Core Graph Tables ==========

-- Generic node table: works for Paper, Section, Concept, Author, etc.
CREATE TABLE IF NOT EXISTS nodes (
    id          TEXT PRIMARY KEY,          -- e.g. 'paper:3D_Gaussian...', 'section:1', 'concept:alpha_blending'
    type        TEXT NOT NULL,             -- 'Paper' | 'Section' | 'Concept' | 'Author' | ...
    title       TEXT,                      -- human-readable label (paper title, concept name, section heading)
    data        JSONB DEFAULT '{}'::jsonb, -- extra metadata (abstract, description, etc.)
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Directed edges between nodes
CREATE TABLE IF NOT EXISTS edges (
    id          BIGSERIAL PRIMARY KEY,
    from_id     TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    to_id       TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,             -- 'has_section' | 'mentions' | 'discusses' | 'cites' | 'extends' | ...
    data        JSONB DEFAULT '{}'::jsonb, -- edge-level metadata (confidence score, source section, etc.)
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ========== Helpful Indexes ==========

-- Fast lookups of all outgoing edges from a node
CREATE INDEX IF NOT EXISTS idx_edges_from_id ON edges (from_id);

-- Fast lookups of all incoming edges to a node
CREATE INDEX IF NOT EXISTS idx_edges_to_id ON edges (to_id);

-- Filter by edge type (e.g., all 'cites' relationships)
CREATE INDEX IF NOT EXISTS idx_edges_type ON edges (type);

-- Optional: for querying by node type (all Papers, all Concepts, etc.)
CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes (type);
