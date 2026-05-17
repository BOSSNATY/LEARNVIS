const { GoogleGenAI } = require("@google/genai");
const pool = require("../config/db");
const fs = require("fs");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Generate structured learning content for a topic
 */
async function generateTopicContent(topic, userMaterials = [], subtopics) {
  try {
    let materialText = "";
    for (const m of userMaterials) {
      if (m.file_url && fs.existsSync(m.file_url)) {
        materialText += `\n[Student ${m.type}]:\n${fs.readFileSync(m.file_url, "utf-8")}\n`;
      } else if (m.file_url) {
        materialText += `\n[Student ${m.type}]:\n${m.file_url}\n`; // Fallback
      }
    }

    const response = await ai.models.generateContent({
      model: "models/gemini-3.1-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
            You are an expert teacher. Create structured learning content for the topic: ${topic.title}

            CRITICAL FOCUS FOR TODAY'S LESSON: ${subtopics || "General Overview"}
            Only generate content that specifically teaches the focus areas above. Do not cover the entire topic.
            
            User materials (optional reference): ${materialText}

            You MUST return your response as a valid JSON object with EXACTLY this structure (no markdown code blocks, just raw JSON):
            {
              "text": "The full lesson explanation in Markdown format (include clear explanation, examples, and common mistakes)",
              "keyPoints": [
                "First key concept summary",
                "Second key concept summary",
                "Third key concept summary"
              ]}
                `,
            },
          ],
        },
      ],
    });

    return response.text;
  } catch (err) {
    console.error("AI content generation failed:", err.message);

    return `
    # ${topic.title}

    Basic explanation:
    This topic covers fundamental concepts related to ${topic.title}.

    Key points:
    - Understand definitions
    - Practice examples
    - Revise frequently
        `;
  }
}

module.exports = {
  generateTopicContent,
};
