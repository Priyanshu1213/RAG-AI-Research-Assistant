import { Pinecone } from "@pinecone-database/pinecone";
import config from "../config/config.js";

// Validate API key early
if (!config.PINECONE_API_KEY) {
  throw new Error(
    "Missing PINECONE_API_KEY in environment. Set PINECONE_API_KEY in your .env"
  );
}

// Initialize Pinecone client - SDK auto-discovers control plane
const pinecone = new Pinecone({
  apiKey: config.PINECONE_API_KEY,
});
const index = pinecone.index(config.PINECONE_INDEX_NAME);

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// upsert with retries and exponential backoff for transient network issues
const upsertWithRetry = async (vectors, maxAttempts = 5) => {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      await index.upsert(vectors);
      return;
    } catch (err) {
      attempt++;
      const isNetworkError =
        err?.cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
        /connect timeout|fetch failed|network error|ECONNREFUSED/i.test(
          err?.message || ""
        );

      // If not network-like error, rethrow immediately
      if (!isNetworkError && attempt >= maxAttempts) {
        throw err;
      }

      if (attempt >= maxAttempts) {
        // final failure
        throw new Error(
          `Pinecone upsert failed after ${attempt} attempts: ${err.message}`
        );
      }

      const backoff = Math.min(1000 * 2 ** (attempt - 1), 16000);
      console.warn(
        `Pinecone upsert attempt ${attempt} failed (${err.message}). Retrying in ${backoff}ms...`
      );
      await sleep(backoff);
    }
  }
};

const storeChunks = async (chunks, embeddings, fileName) => {
  if (!Array.isArray(chunks) || !Array.isArray(embeddings)) {
    throw new Error("storeChunks expects (chunks[], embeddings[])");
  }
  if (chunks.length !== embeddings.length) {
    throw new Error("chunks and embeddings length mismatch");
  }

  const BATCH_SIZE = 100; // safe default
  console.log(
    `Storing ${chunks.length} chunks to Pinecone in batches of ${BATCH_SIZE}...`
  );

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batchChunks = chunks.slice(i, i + BATCH_SIZE);
    const batchEmbeddings = embeddings.slice(i, i + BATCH_SIZE);

    const vectors = batchChunks.map((chunk, idx) => ({
      id: `chunk-${Date.now()}-${i + idx}`,
      values: batchEmbeddings[idx],
      metadata: {
        ...chunk.metadata,
        text: chunk.text, // Include actual text for retrieval
        textPreview: chunk.text.substring(0, 500), // Store preview for debugging
        filename: fileName,
      },
    }));

    try {
      await upsertWithRetry(vectors);
      console.log(
        `Stored batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
          chunks.length / BATCH_SIZE
        )}`
      );
    } catch (err) {
      console.error("Failed to store batch to Pinecone:", err.message);
      throw err;
    }

    // gentle pause to avoid bursts
    await sleep(200);
    if (global.gc) global.gc();
  }

  console.log("All chunks stored successfully");
};

const queryVectors = async (queryEmbedding, topK = 5) => {
  try {
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });
    return queryResponse.matches;
  } catch (err) {
    console.error("Pinecone query error:", err.message);
    throw err;
  }
};

export { storeChunks, queryVectors };
