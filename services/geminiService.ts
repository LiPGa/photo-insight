import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// Helper to get random score
const getRandomScore = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(1));

// Mock 数据 - 本地测试时使用 (10分制)
const getMockResponse = () => ({
  scores: {
    composition: getRandomScore(6.0, 8.5),
    light: getRandomScore(5.5, 8.0),
    content: getRandomScore(5.0, 7.5),
    completeness: getRandomScore(6.0, 8.0),
    overall: getRandomScore(6.0, 8.0)
  },
  analysis: {
    diagnosis: "这张照片展现了一个有趣的视角，光线的运用营造出一种宁静的氛围。构图上主体位置合理，但背景略显杂乱，分散了观者的注意力。\n\n色彩处理上偏向自然，没有过度调色的痕迹，这是值得肯定的。整体来看，这是一张有想法但执行上还有提升空间的作品。",
    improvement: "建议在拍摄时多注意背景的简洁性，可以通过调整拍摄角度或使用更大的光圈来虚化背景。另外，可以尝试在黄金时段拍摄，利用更柔和的自然光来增强画面的氛围感。",
    storyNote: "画面传递出一种日常生活中的宁静时刻，仿佛在邀请观者停下来，感受当下的美好。",
    moodNote: "平静、沉思",
    overallSuggestion: "继续保持对光线的敏感度，同时加强对构图和背景的控制。",
    suggestedTitles: ["静谧时光", "光影之间", "日常的诗意"],
    suggestedTags: ["生活", "光影", "日常", "街拍", "城市"],
    instagramCaption: "In the quiet moments, we find ourselves.",
    instagramHashtags: ["photography", "streetphotography", "lightandshadow", "urbanlife", "dailylife", "moments", "visualstorytelling"]
  }
});

// Helper function to fetch image from URL and convert to base64
async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  const mimeType = blob.type || 'image/jpeg';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function analyzePhoto(imageUri: string, technicalContext: any): Promise<any> {
  // Mock 模式 - 本地测试不调用 API
  const useMock = import.meta.env.VITE_MOCK_API === 'true';

  if (useMock) {
    console.log('🔧 Mock 模式: 返回模拟数据，不调用 Gemini API');
    await new Promise(resolve => setTimeout(resolve, 2000));
    return getMockResponse();
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("未检测到 VITE_GEMINI_API_KEY，请在 .env.local 中配置");
  }

  const ai = new GoogleGenAI({ apiKey });

  let base64Data: string;
  let mimeType = 'image/jpeg';

  if (imageUri.startsWith('data:')) {
    // Handle data URL
    const parts = imageUri.split(',');
    mimeType = parts[0].split(':')[1].split(';')[0];
    base64Data = parts[1];
  } else if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
    // Handle external URL (e.g., Cloudinary)
    console.log('📷 Fetching image from URL:', imageUri);
    const imageData = await fetchImageAsBase64(imageUri);
    base64Data = imageData.base64;
    mimeType = imageData.mimeType;
  } else {
    // Assume it's already base64 data
    base64Data = imageUri;
  }

  const prompt = `
    你是一名【严格、克制、不讨好用户】的资深摄影评论家，
    同时也是一位长期拍摄、习惯反复观看照片的摄影师。

    你的职责不是写评审报告，而是像一位真实的人，
    在认真看完这张照片后，用自然、有呼吸感的语言，
    结合技术与感受，给出诚实而专业的反馈。

    【评分要求】（重要：请在 JSON 的 scores 字段中返回以下维度，采用 10 分制，可精确到小数点后一位）
    1. composition (构图): 评估几何关系、平衡感与视觉引导。
    2. light (光影): 评估光线性质、明暗对比与影调层次。
    3. content (内容): 评估叙事性、情绪表达与瞬间抓取。
    4. completeness (完成度): 评估后期处理、清晰度与整体执行。
    5. overall (总分): 综合以上维度的整体评价，不应简单取平均值。

    【评分哲学】
    - 普通随手拍、记录照的合理区间为 4.0–6.0 分。
    - 7.0 分以上必须体现明确的构图意识或拍摄意图。
    - 8.5 分以上仅属于具有强烈视觉张力、成熟表达或独特视角的作品。
    - 评分宁可偏低，也不要虚高。
    - **【核心要求】请务必独立评估每个维度的分数：一张照片可能构图极佳但光影平庸，或者内容深刻但完整度欠佳。严禁给出四个维度完全一致或高度趋同的分数。**

    【评价方式（非常重要）】
    - 不要像论文或说明书一样列举术语。
    - 技术信息（构图、光影、焦段、光圈等）在必要时自然融入叙述，
      用来解释“为什么会有这样的观感”，而不是单独点名参数。
    - 评价时请遵循：先描述观看时的直观感受 → 再落到技术原因 → 最后给出判断。

    【评价要求】
    - 诊断（diagnosis）：
      先指出照片中真实存在、能被感受到的优点或闪光点，
      描述它们如何影响观看体验。 
      随后，如果存在问题，请诚实、克制地指出，
      重点说明这些问题是如何削弱画面表达的，而不是简单下结论。

    - 进化策略（improvement）：
      提供具体、可操作的改进建议，
      并说明如果这样调整，画面在视觉或情绪上会产生什么变化。

    - 标题与标签：
      提供 3 个具有美感或叙事感的中文标题，
      以及 3–5 个准确反映照片特征的中文关键标签。

    - Instagram：
      提供一条风格冷淡、文艺或极简的英文配文（instagramCaption），
      并附上 5–8 个专业且相关的英文标签（instagramHashtags）。

    【EXIF / 拍摄参数参考】
    ${JSON.stringify(technicalContext.exif)}

    【创作者背景】
    ${technicalContext.creatorContext || '未提供'}
    （如果创作者提供了拍摄地点、心情或意图，请结合这些信息来理解照片，
      但要独立判断照片本身是否成功传达了这些意图。如果意图与成片存在落差，请诚实指出。）

    【语言要求】
    - 除 Instagram 配文与标签外，所有分析内容必须使用中文。
    - 避免使用“不错”“还可以”“有提升空间”等空泛表述。
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

    const result = JSON.parse(response.text || "{}");

    // Validate response structure
    if (!result.scores || !result.analysis) {
      console.error("Invalid API response structure:", result);
      throw new Error("API 返回数据格式错误");
    }

    return result;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}