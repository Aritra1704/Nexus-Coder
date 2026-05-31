-- Knowledge Graph schema for Arnold (surgical-orchestrator)
-- Date: 2026-05-29

CREATE TABLE IF NOT EXISTS graph_nodes (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS graph_edges (
    id SERIAL PRIMARY KEY,
    from_node TEXT REFERENCES graph_nodes(id) ON DELETE CASCADE,
    to_node TEXT REFERENCES graph_nodes(id) ON DELETE CASCADE,
    relation TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_node, to_node, relation)
);
