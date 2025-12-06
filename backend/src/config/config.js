import * as dotenv from "dotenv";

dotenv.config();

const config = {
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  PINECONE_INDEX_NAME: "aidatabase",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || "text-embedding-004", // Correct Google embedding model
};

export default config;
