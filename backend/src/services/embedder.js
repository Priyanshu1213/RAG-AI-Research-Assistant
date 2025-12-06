import config from "../config/config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const extractEmbeddingFromResponse = (res) => {
  // tolerant extraction for different response shapes
  if (!res) return null;
  if (res.embedding) {
    if (Array.isArray(res.embedding))
      return res.embedding[0]?.values || res.embedding[0];
    return res.embedding.values || res.embedding;
  }
  if (res.data && Array.isArray(res.data) && res.data[0]) {
    return (
      res.data[0].embedding ||
      res.data[0].embedding?.values ||
      res.data[0].embedding?.vector ||
      null
    );
  }
  return null;
};

const embedWithRetry = async (
  text,
  modelName,
  attempt = 1,
  maxAttempts = 5
) => {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const resp = await model.embedContent({
      content: {
        parts: [{ text }],
      },
    });
    const emb = extractEmbeddingFromResponse(resp);
    if (!emb) throw new Error("No embedding returned");
    return emb;
  } catch (err) {
    const status =
      err?.status || err?.code || (err?.message || "").toLowerCase();
    // Retry on rate limits / server errors
    const isRetryable =
      (typeof status === "string" && status.includes("429")) ||
      (err?.message && /429|rate limit|too many requests/i.test(err.message)) ||
      (err?.message && /5\d{2}/.test(err.message)) ||
      (err?.code && Number(err.code) >= 500);

    if (attempt >= maxAttempts || !isRetryable) {
      // Provide a clearer error for quota/billing issues
      if (
        err?.message &&
        /quota|free_tier|You exceeded your current quota|rate limit/i.test(
          err.message
        )
      ) {
        throw new Error(
          `${err.message} — check Google Cloud billing/quotas and set a valid EMBEDDING_MODEL in .env`
        );
      }
      throw err;
    }

    const backoffMs = Math.min(1000 * 2 ** (attempt - 1), 16000);
    console.warn(
      `Embedding request failed (attempt ${attempt}) - retrying in ${backoffMs}ms:`,
      err.message
    );
    await delay(backoffMs);
    return embedWithRetry(text, modelName, attempt + 1, maxAttempts);
  }
};

const generateEmbeddings = async (texts) => {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const BATCH_SIZE = 5; // keep small to avoid rapid quota exhaustion
  const INTER_BATCH_DELAY_MS = 250; // small delay between batches
  const allEmbeddings = [];
  console.log(
    `Generating embeddings for ${texts.length} items using model ${config.EMBEDDING_MODEL}...`
  );

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    // process batch sequentially to avoid bursts (adjust concurrency if you have higher quota)
    for (let j = 0; j < batch.length; j++) {
      const text = batch[j];
      try {
        const emb = await embedWithRetry(text, config.EMBEDDING_MODEL);
        allEmbeddings.push(emb);
      } catch (err) {
        console.error(`Failed to embed chunk ${i + j}:`, err.message);
        throw new Error(`Failed to generate embeddings: ${err.message}`);
      }

      // small pause between individual requests can help with per-user rate limits
      await delay(50);
    }

    // pause between batches
    if (INTER_BATCH_DELAY_MS > 0) await delay(INTER_BATCH_DELAY_MS);
    if (global.gc) global.gc();
    console.log(
      `Processed embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
        texts.length / BATCH_SIZE
      )}`
    );
  }

  console.log("Embedding generation complete");
  return allEmbeddings;
};

export { generateEmbeddings };
