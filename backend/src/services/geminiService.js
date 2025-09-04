// src/services/geminiService.js
const fs = require("fs").promises;
const fsSync = require("fs"); // for Buffer reads
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Storage } = require("@google-cloud/storage");

require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Google Cloud Vision Setup ---
let visionClient;
try {
  const vision = require("@google-cloud/vision");
  visionClient = new vision.ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });
} catch (err) {
  console.warn("Google Cloud Vision not initialized. OCR will fail if used.");
}

// --- GCS Setup ---
const storage = new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });
const bucketName = "my-pdf-uploads";

// --- Upload file to GCS ---
const uploadToGCS = async (localFilePath, destinationName) => {
  await storage.bucket(bucketName).upload(localFilePath, { destination: destinationName });
  return `gs://${bucketName}/${destinationName}`;
};

// --- OCR for images ---
const runOCR = async (imageBuffer) => {
  if (!visionClient) throw new Error("Google Cloud Vision client not initialized");
  const [result] = await visionClient.textDetection({ image: { content: imageBuffer } });
  const detections = result.textAnnotations;
  return detections.length ? detections[0].description : "";
};

// --- OCR for PDFs ---
const runPDFOCR = async (localFilePath) => {
  if (!visionClient) throw new Error("Google Cloud Vision client not initialized");

  const fileName = `uploads/${Date.now()}_${Math.floor(Math.random() * 1000)}.pdf`;
  const gcsUri = await uploadToGCS(localFilePath, fileName);

  const [operation] = await visionClient.asyncBatchAnnotateFiles({
    requests: [
      {
        inputConfig: { mimeType: "application/pdf", gcsSource: { uri: gcsUri } },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        outputConfig: { gcsDestination: { uri: `gs://${bucketName}/ocr-output/` } },
      },
    ],
  });

  await operation.promise();

  const outputPrefix = "ocr-output/";
  const [files] = await storage.bucket(bucketName).getFiles({ prefix: outputPrefix });

  let fullText = "";
  for (const file of files) {
    const contents = await file.download();
    const json = JSON.parse(contents.toString());
    for (const resp of json.responses) {
      if (resp.fullTextAnnotation && resp.fullTextAnnotation.text) {
        fullText += resp.fullTextAnnotation.text + "\n\n";
      }
    }
    await file.delete(); // cleanup
  }

  return fullText.trim();
};

// --- MIME type detection from extension ---
const mimeTypes = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".pdf": "application/pdf",
};

const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || null;
};

// --- Extract text from file (image or PDF) ---
const extractText = async (filePath, mimeType) => {
  if (!mimeType) {
    mimeType = getMimeType(filePath);
    if (!mimeType) throw new Error("Unsupported file type. Only images or PDFs allowed.");
  }

  if (mimeType.startsWith("image/")) {
    const buffer = fsSync.readFileSync(filePath);
    return await runOCR(buffer);
  } else if (mimeType === "application/pdf") {
    return await runPDFOCR(filePath);
  } else {
    throw new Error("Unsupported file type. Only images or PDFs allowed.");
  }
};

// --- Summarize file ---
async function summarizeFile(filePath, mimeType) {
  try {
    const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
    console.log("Reading file from:", absPath);

    const content = await extractText(absPath, mimeType);

    if (!content || content.trim().length === 0) {
      return "No text could be extracted from the file.";
    }

    const maxChars = 10000;
    const trimmedContent = content.length > maxChars
      ? content.slice(0, maxChars) + "\n\n[Content truncated for summarization]"
      : content;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = `Provide a brief, concise summary of the following text in 2-3 sentences maximum. Focus on the main purpose, key functionality, or essential content:\n\n${trimmedContent}`;
    const result = await model.generateContent(prompt);

    return result.response.text();
  } catch (err) {
    console.error("Summarization error:", err.message);
    return "Error summarizing the file.";
  }
}

module.exports = { summarizeFile };
