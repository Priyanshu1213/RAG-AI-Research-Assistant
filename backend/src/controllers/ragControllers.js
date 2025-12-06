// Controller for handling RAG logic (can be expanded for more endpoints)
import { generateAnswer } from "../services/ragEngine.js";

const handleQuery = async (req, res) => {
  const { question, chatHistory } = req.body;
  try {
    // This would integrate with services; simplified here
    const answer = await generateAnswer(question, [], chatHistory); // Pass relevant chunks from services
    res.json({ answer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { handleQuery };
