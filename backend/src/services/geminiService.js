// src/services/geminiService.js
const fs = require("fs").promises;
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function summarizeFile(filePath) {
    try {
        // Resolve path
        const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
        console.log("Reading file from:", absPath);

        const content = await fs.readFile(absPath, "utf-8");

        if (!content || content.trim().length === 0) {
            return "The file is empty or unreadable.";
        }

        // Limit content size to prevent exceeding token limit (e.g., 10,000 chars)
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
