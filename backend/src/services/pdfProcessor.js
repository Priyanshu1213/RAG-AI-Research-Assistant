// import fs from "fs";
// import * as pdfParse from "pdf-parse";

// const extractTextAndMetadata = async (filePath) => {
//   try {
//     if (!fs.existsSync(filePath)) {
//       throw new Error(`File not found: ${filePath}`);
//     }

//     const fileBuffer = fs.readFileSync(filePath);
//     const pdfData = await pdfParse(fileBuffer);

//     if (!pdfData.text || pdfData.text.trim().length === 0) {
//       throw new Error("No text extracted from PDF");
//     }

//     const metadata = {
//       title: `Document-${Date.now()}`,
//       author: "Unknown",
//       pages: pdfData.numpages,
//     };

//     // Organize text by pages as sections
//     const sections = {};
//     const lines = pdfData.text.split("\n");
//     let currentSection = "Introduction";

//     for (const line of lines) {
//       if (!sections[currentSection]) {
//         sections[currentSection] = "";
//       }
//       sections[currentSection] += line + " ";
//     }

//     return {
//       text: pdfData.text,
//       metadata,
//       sections,
//     };
//   } catch (err) {
//     console.error("PDF extraction error:", err.message);
//     throw new Error(`Failed to process PDF: ${err.message}`);
//   }
// };

// export { extractTextAndMetadata };

import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const extractTextAndMetadata = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Check file size - warn if too large
    const fileSizeMB = fileBuffer.length / (1024 * 1024);
    console.log(`Processing PDF: ${fileSizeMB.toFixed(2)} MB`);

    if (fileSizeMB > 50) {
      throw new Error("PDF file too large. Maximum size is 50MB");
    }

    const uint8Array = new Uint8Array(fileBuffer);

    // Load the PDF document with optimization settings
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
    });

    const pdfDocument = await loadingTask.promise;
    const metadata = await pdfDocument.getMetadata();
    const numPages = pdfDocument.numPages;

    console.log(`Extracting text from ${numPages} pages...`);

    let fullText = "";
    const sections = {};
    let currentSection = "General";
    sections[currentSection] = "";

    const sectionRegex =
      /^(Abstract|Introduction|Methodology|Results|Conclusion|Discussion|References)/im;

    // Process pages one at a time with cleanup
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");

        fullText += pageText + "\n\n";

        // Process text into sections immediately (don't wait)
        const pageLines = pageText.split("\n");
        pageLines.forEach((line) => {
          const match = line.match(sectionRegex);
          if (match) {
            currentSection = match[1];
            if (!sections[currentSection]) {
              sections[currentSection] = "";
            }
          }
          sections[currentSection] += line + "\n";
        });

        // Cleanup page reference
        if (page.cleanup) page.cleanup();

        // Force garbage collection every 10 pages
        if (pageNum % 10 === 0) {
          if (global.gc) global.gc();
          console.log(`Processed ${pageNum} of ${numPages} pages`);
        }
      } catch (pageError) {
        console.warn(`Error processing page ${pageNum}:`, pageError.message);
      }
    }

    // Cleanup document
    if (pdfDocument.cleanup) pdfDocument.cleanup();
    pdfDocument.destroy();

    const metadataInfo = {
      title: metadata.info?.Title || "Unknown Title",
      author: metadata.info?.Author || "Unknown Author",
      pages: numPages,
      fileSize: `${fileSizeMB.toFixed(2)} MB`,
    };

    console.log("PDF processing complete");

    return { text: fullText, metadata: metadataInfo, sections };
  } catch (error) {
    console.error("PDF processing error:", error.message);
    throw new Error(`Failed to process PDF: ${error.message}`);
  }
};

export { extractTextAndMetadata };
