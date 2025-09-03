// src/services/geminiService.js
const fs = require("fs").promises;
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function summarizeFile(filePath) {
    try {
        // Support both absolute and relative paths
        const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
        console.log("Reading file from:", absPath);

        const content = await fs.readFile(absPath, "utf-8");

        if (!content || content.trim().length === 0) {
            return "file couldnt b read";
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent(
            'Summarize the following file in plain language:\n\n${content}'
        );

        return result.response.text();
    } catch (err) {
        console.error("Summarization error:", err.message);
        return "file couldnt b read";
    }
}

module.exports = { summarizeFile };