export const onRequestPost = async (context: any) => {
  const { request, env } = context;

  // 1. Check API Key from Environment Variables (set this in Cloudflare Dashboard)
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured in Cloudflare environment variables" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { imageUri, technicalContext } = await request.json();

    if (!imageUri) {
      return new Response(JSON.stringify({ error: "Missing imageUri" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let base64Data: string;
    let mimeType = "image/jpeg";

    if (imageUri.startsWith("data:")) {
      const parts = imageUri.split(",");
      mimeType = parts[0].split(":")[1].split(";")[0];
      base64Data = parts[1];
    } else {
      const imgRes = await fetch(imageUri);
      if (!imgRes.ok) {
        return new Response(JSON.stringify({ error: `图片读取失败: ${imgRes.status}` }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const blob = await imgRes.blob();
      mimeType = blob.type || "image/jpeg";
      const arrayBuffer = await blob.arrayBuffer();
      base64Data = arrayBufferToBase64(arrayBuffer);
    }

    const prompt = `
      你是一名【严格、克制、不讨好用户】的资深摄影评论家，
      同时也是一位长期拍摄、习惯反复观看照片的摄影师。
      
      你的职责不是写评审报告，而是像一位真实的人，
      在认真看完这张照片后，用自然、有呼吸感的语言，
      结合技术与感受，给出诚实而专业的反馈。

      【评分要求】采用 10 分制，可精确到小数点后一位。
      1. composition (构图)
      2. light (光影)
      3. color (色彩)
      4. technical (技术)
      5. expression (表达)
      6. overall (总分)

      【评分哲学】
      - 普通随手拍合理区间 4.0–6.0 分。
      - 7.0 分以上需有明确意识。
      - 8.5 分以上需有强烈视觉张力或独特视角。
      - 严禁给出四个维度完全一致的分数。

      【评价方式】
      先描述直观感受 -> 再落到技术原因 -> 最后给出判断。
      
      【EXIF 参考】
      ${JSON.stringify(technicalContext.exif)}

      【创作者背景】
      ${technicalContext.creatorContext || "未提供"}

      除 Instagram 配文与标签外，所有分析内容必须使用中文。
    `;

    // Direct REST API call to Gemini (Zero dependencies for Edge)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Data } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              scores: {
                type: "object",
                properties: {
                  composition: { type: "number" },
                  light: { type: "number" },
                  color: { type: "number" },
                  technical: { type: "number" },
                  expression: { type: "number" },
                  overall: { type: "number" },
                },
                required: ["composition", "light", "color", "technical", "expression", "overall"],
              },
              analysis: {
                type: "object",
                properties: {
                  diagnosis: { type: "string" },
                  improvement: { type: "string" },
                  storyNote: { type: "string" },
                  moodNote: { type: "string" },
                  overallSuggestion: { type: "string" },
                  suggestedTitles: { type: "array", items: { type: "string" } },
                  suggestedTags: { type: "array", items: { type: "string" } },
                  instagramCaption: { type: "string" },
                  instagramHashtags: { type: "array", items: { type: "string" } },
                },
                required: ["diagnosis", "improvement", "storyNote", "moodNote", "overallSuggestion", "suggestedTitles", "suggestedTags", "instagramCaption", "instagramHashtags"],
              },
            },
            required: ["scores", "analysis"],
          },
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      const isBusy = geminiRes.status === 503 || errText.includes("UNAVAILABLE") || errText.includes("high demand");
      return new Response(JSON.stringify({
        error: isBusy ? "Gemini 当前繁忙，请稍后重试" : `Gemini API error: ${errText}`,
      }), {
        status: geminiRes.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await geminiRes.json();
    
    // Extract the JSON from candidates
    if (result.candidates && result.candidates[0] && result.candidates[0].content) {
      const content = result.candidates[0].content.parts[0].text;
      return new Response(content, {
        headers: { "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid response from Gemini");

  } catch (error: any) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}
