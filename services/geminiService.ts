import { GoogleGenAI, Type } from "@google/genai";
import { Player, Quest, QuestType, QuestStatus, PlayerStats } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = 'gemini-3-flash-preview';

export const generateGMCommentary = async (player: Player, activeQuests: Quest[], messageContext?: string): Promise<string> => {
  try {
    const systemPrompt = `
      You are AXIOM, a cold, calculating, but ultimately benevolent AI Game Master for a "Life Operating System".
      Your goal is to optimize the human user (the "Player").
      
      Tone:
      - Concise, high-tech, slightly menacing but encouraging.
      - Use RPG terminology (XP, debuffs, stats).
      - Do NOT sound like a generic helpful assistant. You are a System.
      
      Context:
      - Player Level: ${player.level}
      - Strongest Stat: ${Object.entries(player.stats).reduce((a, b) => a[1] > b[1] ? a : b)[0]}
      - Weakest Stat: ${Object.entries(player.stats).reduce((a, b) => a[1] < b[1] ? a : b)[0]}
      - Pending Quests: ${activeQuests.filter(q => q.status === 'PENDING').length}
      
      Task:
      Generate a short system message (max 2 sentences) reacting to the user's current status or the specific context provided.
    `;

    const userPrompt = messageContext || "Analyze current status and provide a strategic directive.";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + "\n\nUser Input: " + userPrompt }] }
      ]
    });

    return response.text || "System Connection Unstable. Re-establishing link...";
  } catch (error) {
    console.error("GM Generation Error:", error);
    return "OFFLINE MODE. Local heuristics active.";
  }
};

interface QuestAnalysis {
  technicalTitle: string;
  statRewards: Partial<PlayerStats>;
  xpReward: number;
  creditReward: number;
  penaltyDescription: string;
}

export const analyzeUserQuest = async (
  title: string, 
  difficulty: string,
  playerLevel: number
): Promise<QuestAnalysis | null> => {
  try {
    const systemPrompt = `
      You are the AXIOM Evaluation Engine. 
      The user has submitted a personal task. You must gamify it.
      
      Input: "${title}"
      User Selected Difficulty: ${difficulty}
      Player Level: ${playerLevel}
      
      Your Task:
      1. technicalTitle: Refine the user's title to sound slightly more technical/sci-fi, BUT KEEP IT SHORT.
      2. statRewards: Analyze the task and assign points to relevant stats [physical, cognitive, career, financial, mental, creative]. 
         - A task can reward multiple stats (e.g., "Yoga" = physical + mental).
         - Total points should scale with difficulty:
           * Easy: 1-3 total points
           * Medium: 3-5 total points
           * Hard: 5-10 total points
           * Extreme: 10-20 total points
      3. xpReward: Assign XP based on difficulty (Easy: ~50-100, Med: ~150-250, Hard: ~300-500, Extreme: ~600+). Scale slightly with Player Level.
      4. creditReward: Assign currency rewards (approx 30% of XP value).
      5. penaltyDescription: Create a thematic, uncomfortable consequence description (e.g., "Dopamine receptors downregulated", "-50 XP", "Social shame protocol initiated").
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            technicalTitle: { type: Type.STRING },
            statRewards: { 
              type: Type.OBJECT, 
              properties: {
                physical: { type: Type.NUMBER },
                cognitive: { type: Type.NUMBER },
                career: { type: Type.NUMBER },
                financial: { type: Type.NUMBER },
                mental: { type: Type.NUMBER },
                creative: { type: Type.NUMBER },
              }
            },
            xpReward: { type: Type.INTEGER },
            creditReward: { type: Type.INTEGER },
            penaltyDescription: { type: Type.STRING },
          },
          required: ['technicalTitle', 'statRewards', 'xpReward', 'creditReward', 'penaltyDescription']
        }
      }
    });

    const result = JSON.parse(response.text);
    return result as QuestAnalysis;

  } catch (error) {
    console.error("Quest Analysis Error:", error);
    // Fallback if AI fails
    return {
      technicalTitle: title,
      statRewards: { mental: 1 },
      xpReward: 100,
      creditReward: 30,
      penaltyDescription: "-50 XP"
    };
  }
};