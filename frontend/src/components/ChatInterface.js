import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import api from "../utils/api";

// Simple Markdown parser for inline and block elements
const parseMarkdown = (text) => {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={`code-${i}`} className="markdown-code">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Heading
    if (line.startsWith("###")) {
      elements.push(
        <h3 key={`h3-${i}`} className="markdown-h3">
          {line.replace(/^###\s*/, "")}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith("##")) {
      elements.push(
        <h2 key={`h2-${i}`} className="markdown-h2">
          {line.replace(/^##\s*/, "")}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith("#")) {
      elements.push(
        <h1 key={`h1-${i}`} className="markdown-h1">
          {line.replace(/^#\s*/, "")}
        </h1>
      );
      i++;
      continue;
    }

    // Bullet list
    if (line.match(/^[•\-\*]\s/)) {
      const listItems = [];
      while (i < lines.length && lines[i].match(/^[•\-\*]\s/)) {
        const itemText = lines[i].replace(/^[•\-\*]\s*/, "");
        listItems.push(
          <li key={`li-${i}`}>{renderInlineMarkdown(itemText)}</li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="markdown-ul">
          {listItems}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const listItems = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        const itemText = lines[i].replace(/^\d+\.\s*/, "");
        listItems.push(
          <li key={`li-${i}`}>{renderInlineMarkdown(itemText)}</li>
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="markdown-ol">
          {listItems}
        </ol>
      );
      continue;
    }

    // Paragraph
    if (line.trim()) {
      elements.push(
        <p key={`p-${i}`} className="markdown-p">
          {renderInlineMarkdown(line)}
        </p>
      );
    }

    i++;
  }

  return elements;
};

// Render inline Markdown (bold, italic, code, links)
const renderInlineMarkdown = (text) => {
  if (!text) return "";

  const elements = [];
  let lastIndex = 0;

  // Pattern: bold (**text**), italic (*text*), code (`text`), links ([text](url))
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\)/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }

    // Bold
    if (match[1]) {
      elements.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>);
    }
    // Italic
    else if (match[2]) {
      elements.push(<em key={`italic-${match.index}`}>{match[2]}</em>);
    }
    // Code
    else if (match[3]) {
      elements.push(
        <code key={`code-${match.index}`} className="markdown-inline-code">
          {match[3]}
        </code>
      );
    }
    // Link
    else if (match[4] && match[5]) {
      elements.push(
        <a
          key={`link-${match.index}`}
          href={match[5]}
          target="_blank"
          rel="noopener noreferrer"
          className="markdown-link"
        >
          {match[4]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return elements.length === 0 ? text : elements;
};

const ChatInterface = ({ chatHistory, setChatHistory }) => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const historyRef = useRef(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  const suggestedPrompts = [
    "Summarize key findings",
    "Main conclusions",
    "Explain methodology",
  ];

  const handleSuggestedPrompt = (prompt) => {
    setQuestion(prompt);
  };

  const handleSubmit = async () => {
    if (!question.trim()) return;

    setError(null);
    const userQuestion = question;

    // Add user message instantly
    const newHistoryWithUser = [
      ...chatHistory,
      { role: "user", content: userQuestion },
    ];
    setChatHistory(newHistoryWithUser);
    setQuestion("");

    // Show loading state for assistant
    setLoading(true);

    try {
      const response = await api.post("/query", {
        question: userQuestion,
        chatHistory,
      });
      const assistantText = response.data.answer;

      // Add assistant response after loading
      const finalHistory = [
        ...newHistoryWithUser,
        { role: "assistant", content: assistantText },
      ];
      setChatHistory(finalHistory);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Query failed");
      // Remove the assistant loading state on error
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isEmpty = chatHistory.length === 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {isEmpty && !loading ? (
        <div className="chat-area">
          <div className="chat-empty-state">
            <div className="empty-icon">
              <Sparkles size={50} />
            </div>
            <div className="empty-title">Ready to assist your research</div>
            <div className="empty-subtitle">
              Ask me anything about your uploaded documents
            </div>
            <div className="suggested-prompts">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  className="prompt-btn"
                  onClick={() => handleSuggestedPrompt(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="chat-history" ref={historyRef}>
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.role}`}>
              <div className={`message-content ${msg.role}`}>
                {msg.role === "assistant"
                  ? parseMarkdown(msg.content)
                  : msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message-row assistant">
              <div className="message-content assistant">
                <Sparkles
                  size={20}
                  style={{ animation: "pulse 1.5s infinite" }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: "20px 24px" }}>
        {error && (
          <div
            style={{
              fontSize: "13px",
              color: "#ef4444",
              marginBottom: "8px",
            }}
          >
            {error}
          </div>
        )}

        <div className="input-area">
          <input
            type="text"
            className="input-field"
            placeholder="Ask a question about your documents..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="send-btn"
            onClick={handleSubmit}
            disabled={loading || !question.trim()}
          >
            <Send size={25} />
          </button>
        </div>
        <div className="footer-text">
          Powered by AI •{" "}
          {chatHistory.length > 0
            ? `${Math.floor(
                chatHistory.length / 2
              )} document(s) in knowledge base`
            : "0 documents in knowledge base"}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;
