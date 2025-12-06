import { useState, useEffect } from "react";
import UploadSection from "../components/UploadSection";
import ChatInterface from "../components/ChatInterface";
import CitationSidebar from "../components/CitationSidebar";
import { Sparkles, FileText, Upload } from "lucide-react";

export default function Home() {
  const [uploadedPapers, setUploadedPapers] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("uploadedPapers");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setUploadedPapers(parsed);
      }
    } catch (e) {
      console.warn("Failed to load uploadedPapers from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("uploadedPapers", JSON.stringify(uploadedPapers));
    } catch (e) {
      console.warn("Failed to save uploadedPapers to localStorage", e);
    }
  }, [uploadedPapers]);

  const handleUpload = (papers) => {
    setUploadedPapers((prev) => {
      const merged = [...prev, ...papers];
      return Array.from(new Set(merged));
    });
  };

  const handleDeleteDocument = (filename) => {
    setUploadedPapers((prev) => prev.filter((p) => p !== filename));
  };

  const totalDocs = uploadedPapers.length;
  const readyDocs = uploadedPapers.length;

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span>
            <FileText size={20} />
          </span>
          <span className="sidebar-header-title">Knowledge Base</span>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <span>
                <Upload size={20} />
              </span>
              <div>Upload Documents</div>
            </div>
            <UploadSection onUpload={handleUpload} />
          </div>

          <div className="sidebar-section" style={{ flex: 1 }}>
            <CitationSidebar
              papers={uploadedPapers}
              onDelete={handleDeleteDocument}
            />
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="stat-row">
            <span>Total Documents</span>
            <span style={{ fontWeight: 600, color: "#111827" }}>
              {totalDocs}
            </span>
          </div>
          <div className="stat-row">
            <span>Ready</span>
            <span style={{ fontWeight: 600, color: "#111827" }}>
              {readyDocs}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="header">
          <Sparkles size={25} />
          <div className="header-text">
            <h1>AI Research Assistant</h1>
            <p>Ask questions about your documents</p>
          </div>
        </header>

        <ChatInterface
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
        />
      </div>
    </div>
  );
}
