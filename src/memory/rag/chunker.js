/**
 * Arnold Chunker
 * Splits text into semantic chunks for RAG.
 */

function normalizeText(value) {
  return `${value ?? ''}`.replace(/\r\n/g, '\n').trim();
}

export function chunkText(text, maxChars = 1000) {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const chunks = [];
  const paragraphs = normalized.split(/\n\s*\n/);

  let currentChunk = "";

  for (const para of paragraphs) {
    if ((currentChunk.length + para.length) > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += para + "\n\n";
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
