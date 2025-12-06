import express from "express";
import cors from "cors";

import ragRoutes from "./src/routes/ragRoutes.js";
import pineconeRoutes from "./src/routes/pineconeRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", ragRoutes);
app.use("/api", pineconeRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok" });
});

module.exports = app;
