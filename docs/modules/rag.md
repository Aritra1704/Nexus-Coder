# Module Design: RAG (`src/memory/rag/`)

## 1. Purpose
The RAG (Retrieval-Augmented Generation) module provides semantic search over the project's documentation and Arnold's past experiences. It allows Gemini to find relevant context that is too large for the immediate context window.

## 2. Component Specifications
- **Chunker (`chunker.js`):** Splits long documents into manageable, overlapping tokens.
- **Ingestor (`ingestor.js`):** Generates embeddings for chunks (using Gemini or local Ollama) and stores them.
- **Retriever (`retriever.js`):** Performs semantic search to find the top-K relevant chunks for a given query.

## 3. Implementation Plan
1. Implement `chunker.js` with sentence-boundary awareness.
2. Implement `ingestor.js` with embedding support.
3. Implement `retriever.js` with cosine-similarity matching.
4. Create tests in `src/memory/rag/tests/`.

## 4. Testing Strategy
- **Chunking:** Verify that large text is split into expected number of chunks.
- **Retrieval:** Verify that a query returns the most semantically related dummy chunk.
