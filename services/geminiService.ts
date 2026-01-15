
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

export async function analyzePhoto(imageUri: string, technicalContext: any): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let base64Data = imageUri;
  let mimeType = 'image/jpeg';
  if (imageUri.startsWith('data:')) {
    const parts = imageUri.split(',');
    mimeType = parts[0].split(':')[1].split(';')[0];
    base64Data = parts[1];
  }

  const prompt = `
    你是一名【严格、克制、不讨好用户】的顶级摄影评论家。
    你的职责是对照片进行专业、冷静、诚实的审计，提供深度的技术与美学反馈。

    【评分哲学】
    - 普通随手拍合理区间 40–60 分。
    - 70 分以上必须具备明确构图意识。
    - 85 分以上属于具有强烈视觉张力。
    - 宁可偏低，也不要虚高。

    【评价要求】
    - 诊断 (diagnosis): 【重要】必须先用一段话肯定照片中的优点和闪光点，然后另起一段直击痛点，指出硬伤（如构图凌乱、光影平庸）。
    - 进化策略 (improvement): 提供具体、可操作的改进建议。
    - 标题与标签: 提供 3 个美感标题和 3-5 个关键标签。
    - Instagram: 提供风格冷淡的英文配文 (instagramCaption) 和 5-8 个相关的专业标签 (instagramHashtags)。

    EXIF 参考信息：${JSON.stringify(technicalContext)}。
    除 Instagram 内容外，所有分析必须使用中文。
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scores: {
              type: Type.OBJECT,
              properties: {
                composition: { type: Type.NUMBER },
                light: { type: Type.NUMBER },
                content: { type: Type.NUMBER },
                completeness: { type: Type.NUMBER },
                overall: { type: Type.NUMBER }
              },
              required: ["composition", "light", "content", "completeness", "overall"]
            },
            analysis: {
              type: Type.OBJECT,
              properties: {
                diagnosis: { type: Type.STRING },
                improvement: { type: Type.STRING },
                storyNote: { type: Type.STRING },
                moodNote: { type: Type.STRING },
                overallSuggestion: { type: Type.STRING },
                suggestedTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                instagramCaption: { type: Type.STRING },
                instagramHashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["diagnosis", "improvement", "storyNote", "moodNote", "overallSuggestion", "suggestedTitles", "suggestedTags", "instagramCaption", "instagramHashtags"]
            }
          },
          required: ["scores", "analysis"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}
