import fs from "fs";
import { createReadStream } from "fs";
import { Extract } from "unzipper";
import { parseStringPromise } from "xml2js";
import path from "path";

const extractTextFromPptx = async (filePath) => {
  const tempDir = `./temp_pptx_${Date.now()}`;

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Check file signature to detect format
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    const signature = buffer.toString("hex");
    // OLE2 signature: D0CF11E0
    const isOle2 = signature.startsWith("d0cf11e0");

    if (isOle2) {
      console.warn(
        "Old PowerPoint format (.ppt/OLE2) detected. Converting to minimal text extraction..."
      );
      // Fallback: return minimal metadata for old .ppt files
      return {
        text: `[Old PowerPoint Format] File contains presentation slides. Modern .pptx format recommended for better text extraction.`,
        metadata: {
          title: "Presentation (Old Format)",
          author: "Unknown",
          pages: 1,
        },
        sections: {
          General: `[Old PowerPoint Format] File contains presentation slides. Modern .pptx format recommended for better text extraction.`,
        },
      };
    }

    // Handle modern .pptx (ZIP format)
    await new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(Extract({ path: tempDir }))
        .on("close", resolve)
        .on("error", reject);
    });

    // Find all slide XML files
    const slidesDir = path.join(tempDir, "ppt", "slides");
    if (!fs.existsSync(slidesDir)) {
      throw new Error("No slides directory found in PPTX");
    }

    const slideFiles = fs
      .readdirSync(slidesDir)
      .filter((f) => f.match(/^slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0]);
        const numB = parseInt(b.match(/\d+/)[0]);
        return numA - numB;
      });

    if (slideFiles.length === 0) {
      throw new Error("No slide files found in PPTX");
    }

    let fullText = "";
    const sections = {};

    // Parse each slide XML
    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      const slideXmlPath = path.join(slidesDir, slideFile);
      const slideXmlContent = fs.readFileSync(slideXmlPath, "utf-8");

      try {
        const parsed = await parseStringPromise(slideXmlContent);
        const slideTexts = [];

        // Extract text from shape elements
        const extractTexts = (obj) => {
          if (typeof obj === "string") {
            if (obj.trim()) slideTexts.push(obj.trim());
          } else if (Array.isArray(obj)) {
            obj.forEach(extractTexts);
          } else if (typeof obj === "object" && obj !== null) {
            Object.values(obj).forEach(extractTexts);
          }
        };

        if (parsed && parsed["p:sld"]) {
          extractTexts(parsed["p:sld"]);
        }

        const slideContent = slideTexts.join(" ");
        if (slideContent) {
          const sectionName = `Slide ${i + 1}`;
          sections[sectionName] = slideContent;
          fullText += slideContent + "\n\n";
        }
      } catch (err) {
        console.warn(`Warning: Could not parse slide ${i + 1}:`, err.message);
      }
    }

    if (!fullText || fullText.trim().length === 0) {
      throw new Error("No text extracted from PPTX");
    }

    const metadata = {
      title: "Presentation",
      author: "Unknown",
      pages: slideFiles.length,
    };

    return {
      text: fullText,
      metadata,
      sections,
    };
  } catch (error) {
    console.error("PPTX extraction error:", error.message);
    throw new Error(`Failed to process PPTX: ${error.message}`);
  } finally {
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
};

export { extractTextFromPptx };
