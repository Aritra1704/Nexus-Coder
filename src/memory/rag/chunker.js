/**
 * surgical-orchestrator Chunker
 * Splits text into semantic chunks for RAG.
 */

function normalizeText(value) {
  return `${value ?? ''}`.replace(/\r\n/g, '\n').trim();
}

function splitParagraphIntoSentences(paragraph) {
  return paragraph
    .match(/[^.!?\n]+(?:[.!?]+(?=\s|$)|$)/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) ?? [paragraph.trim()].filter(Boolean);
}

function splitLongUnit(unit, maxChars) {
  const slices = [];
  let remaining = unit.trim();

  while (remaining.length > maxChars) {
    let splitAt = remaining.lastIndexOf(' ', maxChars);

    if (splitAt <= 0) {
      splitAt = maxChars;
    }

    slices.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) {
    slices.push(remaining);
  }

  return slices;
}

export function chunkText(text, maxChars = 1000) {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const chunks = [];
  const paragraphs = normalized.split(/\n\s*\n/);
  let currentChunk = '';

  const flushCurrentChunk = () => {
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
  };

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();

    if (!trimmedParagraph) {
      continue;
    }

    if (trimmedParagraph.length <= maxChars) {
      const paragraphBlock = currentChunk ? `\n\n${trimmedParagraph}` : trimmedParagraph;

      if ((currentChunk.length + paragraphBlock.length) > maxChars) {
        flushCurrentChunk();
        currentChunk = trimmedParagraph;
      } else {
        currentChunk += paragraphBlock;
      }

      continue;
    }

    flushCurrentChunk();

    const sentences = splitParagraphIntoSentences(trimmedParagraph);
    let sentenceChunk = '';

    const flushSentenceChunk = () => {
      if (sentenceChunk.trim()) {
        chunks.push(sentenceChunk.trim());
        sentenceChunk = '';
      }
    };

    for (const sentence of sentences) {
      if (sentence.length > maxChars) {
        flushSentenceChunk();
        const hardSlices = splitLongUnit(sentence, maxChars);

        for (const slice of hardSlices) {
          chunks.push(slice);
        }

        continue;
      }

      const candidate = sentenceChunk ? `${sentenceChunk} ${sentence}` : sentence;

      if (candidate.length > maxChars) {
        flushSentenceChunk();
        sentenceChunk = sentence;
      } else {
        sentenceChunk = candidate;
      }
    }

    flushSentenceChunk();
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
