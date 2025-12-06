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

const deleteByFilename = async (req, res) => {
  try {
    const filename = req.query.filename;
    if (!filename) {
      return res
        .status(400)
        .json({ error: "filename query parameter is required" });
    }

    const ns = index.namespace("__default__");
    await ns.deleteMany({
      filename: { $eq: `${filename}` },
    });

    console.log(`Deleted Pinecone vectors for document: ${filename}`);

    return res.json({ message: "Deleted vectors for document", filename });
  } catch (err) {
    console.error("Error deleting Pinecone vectors:", err);
    return res.status(500).json({ error: "Failed to delete Pinecone vectors" });
  }
};

export { deleteByFilename };
