function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length === 0 || right.length === 0) return 0;
  const dimensions = Math.min(left.length, right.length);
  let dot = 0, leftNorm = 0, rightNorm = 0;
  for (let i = 0; i < dimensions; i++) {
    dot += left[i] * right[i];
    leftNorm += left[i] * left[i];
    rightNorm += right[i] * right[i];
  }
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

export class Retriever {
  constructor(db, embeddingClient) {
    this.db = db;
    this.embeddingClient = embeddingClient;
  }

  async retrieve(query, topK = 4) {
    // 1. Generate embedding for query
    // 2. Fetch all candidates from DB
    // 3. Score and sort
    return []; // Placeholder
  }
}
