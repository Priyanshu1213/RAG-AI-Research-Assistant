import express from "express";
import { deleteByFilename } from "../controllers/pineconeController.js";

const router = express.Router();

// DELETE /api/pinecone/documents?filename=...
router.delete("/delete-documents", deleteByFilename);

export default router;
