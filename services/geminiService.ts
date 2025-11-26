import { GoogleGenAI, Type } from "@google/genai";
import { EnrichedArticle, Sentiment, RawArticle } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * AGENT 1: Ingestion Simulation
 * Generates synthetic news headlines to feed the pipeline.
 */
export const generateSyntheticHeadlines = async (count: number = 1): Promise<RawArticle[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate ${count} distinct, realistic tech or business news headlines. 
      Make them sound like real-time alerts. 
      Return ONLY a JSON array of strings. 
      Example: ["Apple announces new AI chip", "Tesla stock drops 5%"]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const headlines: string[] = JSON.parse(response.text || "[]");
    
    return headlines.map(headline => ({
      id: crypto.randomUUID(),
      headline,
      source: ['Reuters', 'Bloomberg', 'TechCrunch', 'CNBC'][Math.floor(Math.random() * 4)],
      timestamp: Date.now(),
    }));

  } catch (e) {
    console.error("Ingestion Agent Error:", e);
    // Fallback if API fails
    return [{
        id: crypto.randomUUID(),
        headline: "System Alert: API Rate Limit or Error in Ingestion",
        source: "System",
        timestamp: Date.now()
    }];
  }
};

/**
 * AGENT 2: Analyst Agent
 * Performs LLM enrichment: Sentiment analysis, Entity extraction, Summarization.
 */
export const analyzeArticle = async (article: RawArticle): Promise<Partial<EnrichedArticle>> => {
  const startTime = performance.now();
  
  try {
    const prompt = `
      Analyze this news headline: "${article.headline}"
      
      1. Determine Sentiment (POSITIVE, NEGATIVE, NEUTRAL).
      2. Extract key entities (Companies, People, Locations).
      3. Assign a category (Tech, Finance, Politics, Science).
      4. Provide a 1-sentence summary.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, enum: [Sentiment.POSITIVE, Sentiment.NEGATIVE, Sentiment.NEUTRAL] },
            entities: { type: Type.ARRAY, items: { type: Type.STRING } },
            category: { type: Type.STRING },
            summary: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    const processingTime = performance.now() - startTime;

    return {
      ...result,
      processingTimeMs: Math.round(processingTime)
    };

  } catch (error) {
    console.error("Analyst Agent Error:", error);
    return {
      sentiment: Sentiment.NEUTRAL,
      entities: [],
      category: "Unknown",
      summary: "Analysis failed",
      processingTimeMs: 0
    };
  }
};

/**
 * AGENT 3: Personalization/Clustering Agent
 * Determines if an article is redundant based on previous context.
 * This simulates the "cutting API calls by 60%" feature.
 */
export const checkForRedundancy = async (
  newArticle: RawArticle, 
  recentArticles: EnrichedArticle[]
): Promise<{ isDuplicate: boolean; reason?: string }> => {
  
  if (recentArticles.length === 0) return { isDuplicate: false };

  // Optimization: Only check against the last 5 articles to save tokens and prevent exhaustion
  const recentHeadlines = recentArticles.slice(0, 5).map(a => a.headline);
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        New Headline: "${newArticle.headline}"
        Recent Headlines: ${JSON.stringify(recentHeadlines)}

        Task: Is the New Headline effectively reporting the same specific event as any of the Recent Headlines?
        Return JSON.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isDuplicate: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{"isDuplicate": false}');
  } catch (error) {
    return { isDuplicate: false };
  }
};