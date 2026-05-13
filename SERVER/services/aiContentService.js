const { GoogleGenAI } = require("@google/genai");
const pool = require("../config/db");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Generate structured learning content for a topic
 */
async function generateTopicContent(topic, userMaterials = []) {
  try {
    const materialText = userMaterials.length
      ? userMaterials.map((m) => m.file_url || m.type).join("\n")
      : "No user materials provided";

    const response = await ai.models.generateContent({
      model: "models/gemini-3.1-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
            You are an expert teacher. Create structured learning content for the topic: ${topic.title}

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
