import fs from "fs";
import { extractRawText } from "mammoth";

const extractTextFromDocx = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const buffer = fs.readFileSync(filePath);
    const result = await extractRawText({ buffer });

    if (!result.value || result.value.trim().length === 0) {
      throw new Error("No text extracted from DOCX");
    }

    const metadata = {
      title: "Document",
      author: "Unknown",
      pages: 1,
    };

    const sections = {
      General: result.value,
    };

    return {
      text: result.value,
      metadata,
      sections,
    };
  } catch (error) {
    console.error("DOCX extraction error:", error.message);
    throw new Error(`Failed to process DOCX: ${error.message}`);
  }
};

export { extractTextFromDocx };
