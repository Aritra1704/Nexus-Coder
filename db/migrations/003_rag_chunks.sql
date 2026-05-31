-- RAG chunk storage for surgical-orchestrator
-- Date: 2026-05-29

CREATE TABLE IF NOT EXISTS rag_chunks (
    id BIGSERIAL PRIMARY KEY,
    source_path TEXT NOT NULL,
    checksum TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    embedding DOUBLE PRECISION[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_path, checksum, chunk_index)
);

CREATE INDEX IF NOT EXISTS rag_chunks_source_path_idx
    ON rag_chunks (source_path);
