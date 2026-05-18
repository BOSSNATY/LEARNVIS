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
            You are a master-level university professor writing a comprehensive, deep-dive textbook chapter for the topic: ${topic.title}

            CRITICAL FOCUS FOR TODAY'S LESSON: ${subtopics || "General Overview"}
            
            Instructions for generating the content:
            1. DO NOT write a superficial or short overview. You must write an extensive, highly detailed explanation.
            2. Break down complex ideas using first-principles thinking.
            3. Include rich analogies, real-world applications, and historical context if applicable.
            4. Provide step-by-step examples or mathematical breakdowns where relevant.
            5. Anticipate common student misconceptions and address them explicitly.
            6. Format the text beautifully using Markdown headers, bullet points, and bold text for emphasis.
            
            User syllabus/materials (incorporate this context deeply if provided): ${materialText}

            You MUST return your response as a valid JSON object with EXACTLY this structure (no markdown code blocks, just raw JSON):
            {
              "text": "The full, exhaustive lesson explanation in Markdown format (must be long and highly detailed).",
              "keyPoints": [
                "Detailed summary point 1",
                "Detailed summary point 2",
                "Detailed summary point 3",
                "Detailed summary point 4"
              ]
            }
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
