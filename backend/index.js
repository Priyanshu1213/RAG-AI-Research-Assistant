import express from "express";
import cors from "cors";
// import multer from "multer";
import ragRoutes from "./src/routes/ragRoutes.js";
import pineconeRoutes from "./src/routes/pineconeRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// Multer for file uploads
// const upload = multer({ dest: "uploads/" });

app.use("/api", ragRoutes);
app.use("/api", pineconeRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
