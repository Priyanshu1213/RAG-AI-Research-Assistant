import axios from "axios";

const api = axios.create({
  baseURL: "https://rag-ai-research-assistant.onrender.com/api",
});

export default api;
