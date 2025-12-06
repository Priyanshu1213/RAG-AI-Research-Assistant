import Tesseract from "tesseract.js";
import path from "path";

const extractTextFromImage = async (filePath) => {
  try {
    const { data } = await Tesseract.recognize(filePath, "eng");
    const text = data.text || "";
    const metadata = {
      title: "Image",
      author: "Unknown",
      pages: 1,
      fileType: path.extname(filePath),
    };
    const sections = { Image: text };
    return { text, metadata, sections };
  } catch (error) {
    console.error("Image OCR error:", error.message);
    throw new Error(`Failed to process image: ${error.message}`);
  }
};

export { extractTextFromImage };
