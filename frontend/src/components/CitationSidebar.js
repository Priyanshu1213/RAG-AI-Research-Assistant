import { FileText, X } from "lucide-react";
import api from "../utils/api";
import { useState } from "react";

const CitationSidebar = ({ papers, onDelete }) => {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (filename) => {
    if (
      !confirm(
        `Delete "${filename}" and all related chunks? This cannot be undone.`
      )
    )
      return;
    setDeleting(filename);
    try {
      // call backend to delete Pinecone vectors for this document (by filename)
      await api.delete(`/delete-documents`, { params: { filename } });
      // update parent state
      if (typeof onDelete === "function") onDelete(filename);
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert("Failed to delete document. See console for details.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div
      style={{
        flexDirection: "column",
        display: "flex",
        gap: "8px",
        width: "100%",
      }}
    >
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
        Imported Documents ({papers.length})
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {papers.length === 0 && (
          <div
            style={{
              fontSize: "14px",
              color: "#9ca3af",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              alignItems: "center",
              marginTop: "20px",
            }}
          >
            <FileText size={50} />
            No documents imported yet
          </div>
        )}

        {papers.map((paper, idx) => (
          <div key={idx} className="document-item">
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FileText size={14} />
              <div className="document-name">{paper}</div>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div className="document-status">✓ Ready</div>

              <button
                onClick={() => handleDelete(paper)}
                disabled={deleting === paper}
                title="Delete document and all related chunks"
                style={{
                  background: "none",
                  border: "none",
                  cursor: deleting === paper ? "not-allowed" : "pointer",
                  color: deleting === paper ? "#9ca3af" : "gray",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={16} className="document-x" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CitationSidebar;
