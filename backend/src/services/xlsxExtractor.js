import fs from "fs";
import XLSX from "xlsx";

const extractTextFromXlsx = async (filePath) => {
  try {
    if (!fs.existsSync(filePath))
      throw new Error(`File not found: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    let text = "";
    const sections = {};

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      sections[sheetName] = csv;
      text += `Sheet: ${sheetName}\n${csv}\n`;
    });

    const metadata = {
      title: "Excel Spreadsheet",
      author: "Unknown",
      pages: workbook.SheetNames.length,
    };

    return { text, metadata, sections };
  } catch (error) {
    console.error("XLSX extraction error:", error.message);
    throw new Error(`Failed to process XLSX: ${error.message}`);
  }
};

export { extractTextFromXlsx };
