import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { extractTextAndMetadata } from "../services/pdfProcessor.js";
import { extractTextFromDocx } from "../services/docxExtractor.js";
import { extractTextFromPptx } from "../services/pptxExtractor.js";
import { extractTextFromCsv } from "../services/csvExtractor.js";
import { extractTextFromPlainText } from "../services/textExtractor.js";
import { extractTextFromXlsx } from "../services/xlsxExtractor.js";
import { extractTextFromImage } from "../services/imageExtractor.js";
import { chunkText } from "../services/chunker.js";
import { generateEmbeddings } from "../services/embedder.js";
import { storeChunks, queryVectors } from "../services/vectorStore.js";
import {
  generateAnswer,
  summarizeDocuments,
  extractInsights,
} from "../services/ragEngine.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const mimeType = req.file.mimetype || "";
  const ext = path.extname(fileName).toLowerCase();

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(
      `Processing: ${fileName} (${req.file.size} bytes, ${mimeType})`
    );
    console.log("Step 1: Extracting text based on file type...");

    let text, metadata, sections;

    // Route to appropriate extractor based on file extension and MIME type
    if (ext === ".pdf" || mimeType.includes("pdf")) {
      ({ text, metadata, sections } = await extractTextAndMetadata(filePath));
    } else if (ext === ".docx" || mimeType.includes("word")) {
      ({ text, metadata, sections } = await extractTextFromDocx(filePath));
    } else if (
      ext === ".pptx" ||
      ext === ".ppt" ||
      mimeType.includes("presentation")
    ) {
      ({ text, metadata, sections } = await extractTextFromPptx(filePath));
    } else if (ext === ".csv" || mimeType.includes("csv")) {
      ({ text, metadata, sections } = await extractTextFromCsv(filePath));
    } else if (
      ext === ".xlsx" ||
      mimeType.includes("excel") ||
      mimeType.includes("spreadsheet")
    ) {
      ({ text, metadata, sections } = await extractTextFromXlsx(filePath));
    } else if (
      [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"].includes(ext) ||
      mimeType.startsWith("image/")
    ) {
      ({ text, metadata, sections } = await extractTextFromImage(filePath));
    } else if (ext === ".txt" || mimeType.startsWith("text")) {
      ({ text, metadata, sections } = await extractTextFromPlainText(filePath));
    } else {
      // Fallback: try as plain text
      console.log("Unknown file type, attempting to read as plain text...");
      ({ text, metadata, sections } = await extractTextFromPlainText(filePath));
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "No extractable text from file" });
    }

    console.log("Step 2: Chunking text...");
    const chunks = await chunkText(text, sections, metadata);

    if (chunks.length === 0) {
      return res.status(400).json({ error: "No chunks extracted from file" });
    }

    console.log(`Step 3: Generating embeddings for ${chunks.length} chunks...`);
    const texts = chunks.map((c) => c.text);
    const embeddings = await generateEmbeddings(texts);

    if (embeddings.length !== chunks.length) {
      throw new Error("Embedding count mismatch");
    }

    console.log("Step 4: Storing vectors in Pinecone...");
    await storeChunks(chunks, embeddings, fileName);

    console.log("File upload complete");
    res.json({
      message: "File processed and stored successfully",
      chunksCount: chunks.length,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error("Error processing file:", error.message);
    res.status(500).json({
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  } finally {
    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting temp file:", err.message);
      });
    }
  }
});

router.post("/query", async (req, res) => {
  const { question, chatHistory } = req.body;

  if (!question || question.trim().length === 0) {
    return res.status(400).json({ error: "Question cannot be empty" });
  }

  try {
    console.log(`Processing query: ${question.substring(0, 50)}...`);
    const queryEmbedding = await generateEmbeddings([question]);

    if (!queryEmbedding[0]) {
      throw new Error("Failed to generate query embedding");
    }

    const relevantChunks = await queryVectors(queryEmbedding[0]);
    const { answer, citations } = await generateAnswer(
      question,
      relevantChunks,
      chatHistory
    );

    res.json({ answer, citations });
  } catch (error) {
    console.error("Error generating answer:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Additional endpoints for summarization and insights
router.get("/summarize", async (req, res) => {
  // Fetch all chunks from vector DB (simplified)
  const summary = await summarizeDocuments(/* all chunks */);
  res.json({ summary });
});

router.get("/insights", async (req, res) => {
  const insights = await extractInsights(/* all chunks */);
  res.json(insights);
});

export default router;
