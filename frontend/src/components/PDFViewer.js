import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = ({ file, highlights = [] }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const onDocumentLoadError = (err) => {
    setError(err.message);
  };

  if (error)
    return <div className="text-red-500">Error loading PDF: {error}</div>;
  if (!file) return <div className="kicker">No PDF selected</div>;

  return (
    <div className="card">
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        onError={onDocumentLoadError}
      >
        <Page pageNumber={pageNumber} />
      </Document>
      {numPages && (
        <div className="mt-2 text-center">
          <p className="kicker">
            Page {pageNumber} of {numPages}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <button
              className="btn"
              onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
              disabled={pageNumber === 1}
            >
              Previous
            </button>
            <button
              className="btn"
              onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
              disabled={pageNumber === numPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
