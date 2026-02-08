import { GoogleGenAI, Type } from "@google/genai";
import { Player, Quest, QuestType, QuestStatus, PlayerStats } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = 'gemini-3-flash-preview';

export const generateGMCommentary = async (player: Player, activeQuests: Quest[], messageContext?: string, worldContext?: string): Promise<string> => {
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
      ${worldContext ? `\n      World State (The Nexus):\n      ${worldContext}` : ''}
      
      Task:
      Generate a short system message (max 2 sentences) reacting to the user's current status or the specific context provided.
      If the Nexus world state is provided, you may reference district conditions, companion moods, or recent world events when relevant.
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
  playerLevel: number,
  questType: string = 'DAILY'
): Promise<QuestAnalysis | null> => {
  try {
    const systemPrompt = `
      You are the AXIOM Evaluation Engine. 
      The user has submitted a personal task. You must gamify it.
      
      Input: "${title}"
      Quest Type: ${questType} (DAILY = base rewards, WEEKLY = 2-3x daily, EPIC = 4-6x daily)
      User Selected Difficulty: ${difficulty}
      Player Level: ${playerLevel}
      
      Your Task:
      1. technicalTitle: Refine the user's title to sound slightly more technical/sci-fi, BUT KEEP IT SHORT.
      2. statRewards: Analyze the task and assign points to relevant stats [physical, cognitive, career, financial, mental, creative]. 
         - Total points scale with difficulty (Easy 1-3, Medium 3-5, Hard 5-10, Extreme 10-20) and with type (Weekly/Epic more).
      3. xpReward: Scale by BOTH quest type AND difficulty. Daily: Easy 50-80, Med 100-150, Hard 180-250, Extreme 300+. Weekly: 2-3x those. Epic: 4-6x those.
      4. creditReward: About 25-35% of XP value.
      5. penaltyDescription: Materialistic, concrete consequences (e.g. "No video games or streaming tonight", "No social media for 24h", "Skip one cheat meal this week"). Always end with XP loss in parentheses, e.g. "(-50 XP)" or "(-150 XP)".
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
    const baseXP = 100;
    const mult = questType === 'EPIC' ? 5 : questType === 'WEEKLY' ? 2.5 : 1;
    const xp = Math.round(baseXP * mult);
    return {
      technicalTitle: title,
      statRewards: { mental: 1 },
      xpReward: xp,
      creditReward: Math.round(xp * 0.3),
      penaltyDescription: "No entertainment apps for 24h (-" + Math.round(xp * 0.1) + " XP)"
    };
  }
};