import { buildPhotoAnalysisPrompt, photoAnalysisResponseSchema } from '../services/analysisContract';

export const config = {
  maxDuration: 60,
};

const IMAGE_FETCH_TIMEOUT_MS = 15000;
const GEMINI_FETCH_TIMEOUT_MS = 50000;

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function buildGeminiPayload(mimeType: string, base64Data: string, prompt: string, includeSchema: boolean) {
  return {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mimeType, data: base64Data } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      ...(includeSchema ? { responseSchema: photoAnalysisResponseSchema } : {}),
    },
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in deployment environment variables' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { imageUri, technicalContext = {} } = body || {};

    if (!imageUri) {
      return res.status(400).json({ error: 'Missing imageUri' });
    }

    let base64Data: string;
    let mimeType = 'image/jpeg';

    if (imageUri.startsWith('data:')) {
      const parts = imageUri.split(',');
      mimeType = parts[0].split(':')[1].split(';')[0];
      base64Data = parts[1];
    } else {
      const imgRes = await fetchWithTimeout(imageUri, {}, IMAGE_FETCH_TIMEOUT_MS);
      if (!imgRes.ok) {
        return res.status(400).json({ error: `图片读取失败: ${imgRes.status}` });
      }
      const arrayBuffer = await imgRes.arrayBuffer();
      mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
      base64Data = Buffer.from(arrayBuffer).toString('base64');
    }

    const prompt = buildPhotoAnalysisPrompt(technicalContext);

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    let geminiRes = await fetchWithTimeout(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildGeminiPayload(mimeType, base64Data, prompt, true)),
    }, GEMINI_FETCH_TIMEOUT_MS);

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      const isBusy = geminiRes.status === 503 || errText.includes('UNAVAILABLE') || errText.includes('high demand');
      const normalizedError = errText.toLowerCase();
      const shouldRetryWithoutSchema =
        geminiRes.status === 400 &&
        (normalizedError.includes('responseschema') ||
          normalizedError.includes('response_schema') ||
          normalizedError.includes('generationconfig') ||
          normalizedError.includes('schema'));

      if (shouldRetryWithoutSchema) {
        console.warn('Gemini rejected responseSchema; retrying without schema');
        geminiRes = await fetchWithTimeout(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildGeminiPayload(mimeType, base64Data, prompt, false)),
        }, GEMINI_FETCH_TIMEOUT_MS);

        if (geminiRes.ok) {
          const retryResult = await geminiRes.json();
          const retryContent = retryResult?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!retryContent) {
            return res.status(502).json({ error: 'Invalid response from Gemini' });
          }

          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(retryContent);
        }
      }

      return res.status(geminiRes.status).json({
        error: isBusy ? 'Gemini 当前繁忙，请稍后重试' : `Gemini API error: ${errText}`,
      });
    }

    const result = await geminiRes.json();
    const content = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return res.status(502).json({ error: 'Invalid response from Gemini' });
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(content);
  } catch (error: any) {
    console.error('API Error:', error);
    if (error?.name === 'AbortError') {
      return res.status(504).json({ error: '分析服务响应超时，请稍后重试或换一张更小的图片' });
    }
    return res.status(500).json({ error: error?.message || '分析服务异常' });
  }
}
