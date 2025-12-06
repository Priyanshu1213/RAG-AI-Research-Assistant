import { useDropzone } from "react-dropzone";
import { useState } from "react";
import api from "../utils/api";
import { FileText } from "lucide-react";

const UploadSection = ({ onUpload }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const onDrop = async (files) => {
    setError(null);
    setSelectedFiles(files);
    setLoading(true);
    try {
      const names = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        await api.post("/upload", formData);
        names.push(file.name);
      }
      setSelectedFiles([]);
      onUpload(names);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: "1px dashed #d1d5db",
          borderRadius: "6px",
          padding: "12px",
          textAlign: "center",
          cursor: "pointer",
          transition: "background 0.2s",
          background: "#f9fafb",
          width: "270px",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#f9fafb")}
      >
        <input {...getInputProps()} />
        <div style={{ fontSize: "12px", color: "#6b7280", cursor: "pointer" }}>
          {loading
            ? "Uploading..."
            : "Click to upload or drag files (PDF, DOCX, XLSX, PPTX, CSV, TXT, IMAGE)"}
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div style={{ marginTop: "12px" }}>
          {selectedFiles.map((f, i) => (
            <div key={i} className="document-item">
              <span className="document-name">
                <FileText size={12} /> {f.name}
              </span>
              <span className="document-size">
                {(f.size / 1024).toFixed(0)} KB
              </span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "8px" }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default UploadSection;
