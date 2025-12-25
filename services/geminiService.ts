
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateBattleCommentary(winnerName: string, loserName: string, finalSkill?: string) {
  try {
    const prompt = `Write a short, exciting 2-sentence battle summary in a chibi-style anime action RPG voice. 
    The battle was between ${winnerName} and ${loserName}. 
    ${winnerName} won the fight${finalSkill ? ` using their ultimate skill ${finalSkill}` : ''}.
    Keep it high-energy and fun!`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "What a legendary clash in Cloud City!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The dust settles... a hero emerges victorious!";
  }
}
