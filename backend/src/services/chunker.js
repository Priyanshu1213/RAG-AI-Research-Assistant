// Manual chunking implementation (no LangChain dependency)
const chunkText = async (text, sections, metadata) => {
  const chunkSize = 500; // Increased from 300 to 1000 words per chunk
  const chunkOverlap = 100; // Reduced overlap to 100 words (10%)
  const MAX_CHUNKS_PER_SECTION = 500; // Hard limit per section

  const chunks = [];
  let totalChunks = 0;

  for (const [sectionName, sectionText] of Object.entries(sections)) {
    if (!sectionText || sectionText.trim().length === 0) continue;

    const words = sectionText.split(/\s+/).filter((w) => w.length > 0);

    // Skip sections with very few words
    if (words.length < 50) continue;

    let start = 0;
    let idx = 0;
    let sectionChunkCount = 0;

    while (start < words.length && sectionChunkCount < MAX_CHUNKS_PER_SECTION) {
      const end = Math.min(start + chunkSize, words.length);
      const chunkWords = words.slice(start, end);
      const chunk = chunkWords.join(" ");

      // Only add chunks with substantial content
      if (chunk.trim().length > 100) {
        chunks.push({
          text: chunk,
          metadata: {
            paperTitle: metadata.title,
            author: metadata.author,
            section: sectionName,
            page: Math.floor(idx / 10) + 1,
            keywords: extractKeywords(chunk),
          },
        });
        totalChunks++;
        sectionChunkCount++;
      }

      start += chunkSize - chunkOverlap; // Step forward, not overlap-based
      idx++;

      // Log progress every 100 chunks
      if (totalChunks % 100 === 0) {
        console.log(`Created ${totalChunks} chunks...`);
        if (global.gc) global.gc();
      }
    }
  }

  console.log(`Total chunks created: ${totalChunks}`);

  // Hard safety check
  if (totalChunks > 10000) {
    console.warn(
      `WARNING: ${totalChunks} chunks exceeds recommended limit of 10,000`
    );
  }

  return chunks;
};

const extractKeywords = (text) => {
  // Basic keyword extraction
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
  return [...new Set(words)].slice(0, 10); // Top 10 unique words
};

export { chunkText };
