import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/config.js";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

const generateAnswer = async (question, relevantChunks, chatHistory = []) => {
  // Build context from actual chunk content
  const context = relevantChunks
    .map((match, idx) => {
      const text = match.metadata?.text || match.values?.toString() || "";
      const section = match.metadata?.section || "General";
      const page = match.metadata?.page || 1;
      return `[Source ${idx + 1} - ${section}, Page ${page}]:\n${text}`;
    })
    .join("\n\n");

  const hasDocuments = context && context.trim().length > 0;

  const historyContext = chatHistory
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join("\n");

  const prompt = `You are a helpful AI Research Assistant. Your role is to answer questions intelligently and helpfully.

IMPORTANT: Format your response using **Markdown** for rich formatting:
- Use **bold** for key terms and emphasis
- Use *italic* for secondary emphasis
- Use \`code\` for technical terms or inline references
- Use bullet points (•) or numbered lists for structured information
- Use ### for section headers when appropriate
- Use \`\`\`code blocks\`\`\` for longer code or structured data
- Keep paragraphs short and scannable

${
  hasDocuments
    ? `
CONTEXT FROM UPLOADED DOCUMENTS:
${context}

When answering:
1. **Prioritize** information from the uploaded documents
2. **Always cite sources** using the format [Source X - Page N]
3. If information is not in documents, clearly indicate: *Note: This is not from the uploaded documents*
4. Use **bold** for document citations and key findings
5. Maintain an academic and professional tone
`
    : `
No documents have been uploaded yet. You can provide general answers and knowledge.

When answering:
1. Provide helpful and accurate general information
2. Use **bold** for key concepts
3. Suggest that uploading relevant documents would give more specific analysis
4. Maintain a helpful and professional tone
`
}

${historyContext ? `CHAT HISTORY:\n${historyContext}\n` : ""}

USER QUESTION: ${question}

Provide a clear, structured, and helpful answer using Markdown formatting.`;

  try {
    const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    // Extract citations from the relevant chunks used
    const citations = hasDocuments
      ? relevantChunks
          .filter((match) => match.metadata)
          .map((match) => ({
            paper: match.metadata?.paperTitle || "Unknown Document",
            section: match.metadata?.section || "General",
            page: match.metadata?.page || 1,
          }))
      : [];

    return { answer, citations };
  } catch (error) {
    console.error("Error generating answer:", error.message);
    throw new Error(`Failed to generate answer: ${error.message}`);
  }
};

const summarizeDocuments = async (chunks) => {
  if (!chunks || chunks.length === 0) {
    throw new Error("No chunks provided for summarization");
  }

  const context = chunks.map((chunk) => chunk.text || "").join("\n");

  if (context.trim().length === 0) {
    throw new Error("No valid content to summarize");
  }

  const prompt = `Please provide a comprehensive summary of the following documents using **Markdown formatting**. Include:

• **Main objectives and goals**
• **Key findings and conclusions**
• **Important methodologies** used
• **Critical data points** or statistics
• **Recommendations** or future work

Documents:
${context}

Format your response clearly with sections, bold headings, and bullet points for easy reading.`;

  try {
    const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Summarization error:", error.message);
    throw error;
  }
};

const extractInsights = (chunks) => {
  if (!chunks || chunks.length === 0) {
    return {
      keyTerms: [],
      entities: [],
      methods: [],
    };
  }

  const insights = {
    keyTerms: [],
    entities: [],
    methods: [],
  };

  chunks.forEach((chunk) => {
    // Extract keywords from metadata
    if (chunk.metadata?.keywords && Array.isArray(chunk.metadata.keywords)) {
      insights.keyTerms.push(...chunk.metadata.keywords);
    }

    // Extract from text for better insights
    if (chunk.text) {
      const words =
        chunk.text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
      insights.entities.push(...words.slice(0, 5));
    }
  });

  // Deduplicate
  insights.keyTerms = [...new Set(insights.keyTerms)].slice(0, 10);
  insights.entities = [...new Set(insights.entities)].slice(0, 10);

  return insights;
};

export { generateAnswer, summarizeDocuments, extractInsights };
