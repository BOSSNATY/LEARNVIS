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
      model: "gemini-3.1-flash-lite-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
    You are an expert teacher.

    Create structured learning content for the topic:

    Topic: ${topic.title}

    User materials (optional reference):
    ${materialText}

    Return in this format:
    1. Clear explanation
    2. Key concepts (bullet points)
    3. Simple example
    4. Common mistakes students make
    5. Short summary

    Keep it student-friendly and exam-focused.
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
