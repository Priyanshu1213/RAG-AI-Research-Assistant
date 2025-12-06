import fs from "fs";

const extractTextFromPlainText = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const text = fs.readFileSync(filePath, "utf-8");

    if (!text || text.trim().length === 0) {
      throw new Error("No text found in file");
    }

    const metadata = {
      title: "Text Document",
      author: "Unknown",
      pages: 1,
    };

    const sections = {
      General: text,
    };

    return {
      text,
      metadata,
      sections,
    };
  } catch (error) {
    console.error("Text extraction error:", error.message);
    throw new Error(`Failed to process TXT: ${error.message}`);
  }
};

export { extractTextFromPlainText };
