import { buildPhotoAnalysisPrompt, photoAnalysisResponseSchema } from "../../services/analysisContract";

const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";

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

    const prompt = buildPhotoAnalysisPrompt(technicalContext);

    // Direct REST API call to Gemini (Zero dependencies for Edge)
    const geminiModel = env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${apiKey}`;
    
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
          responseSchema: photoAnalysisResponseSchema,
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
