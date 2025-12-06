import fs from "fs";
import { parse } from "csv-parse/sync";

const extractTextFromCsv = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    if (!records || records.length === 0) {
      throw new Error("No data found in CSV");
    }

    // Convert CSV records to readable text format
    const headers = Object.keys(records[0]);
    let fullText = headers.join(" | ") + "\n";
    fullText += records
      .map((row) => headers.map((h) => row[h] || "").join(" | "))
      .join("\n");

    if (!fullText || fullText.trim().length === 0) {
      throw new Error("No extractable text from CSV");
    }

    const metadata = {
      title: "CSV Data",
      author: "Unknown",
      pages: 1,
    };

    const sections = {
      "CSV Data": fullText,
    };

    return {
      text: fullText,
      metadata,
      sections,
    };
  } catch (error) {
    console.error("CSV extraction error:", error.message);
    throw new Error(`Failed to process CSV: ${error.message}`);
  }
};

export { extractTextFromCsv };
