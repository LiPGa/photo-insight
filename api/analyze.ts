import { buildPhotoAnalysisPrompt, photoAnalysisResponseSchema } from '../services/analysisContract';

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
      const imgRes = await fetch(imageUri);
      if (!imgRes.ok) {
        return res.status(400).json({ error: `图片读取失败: ${imgRes.status}` });
      }
      const arrayBuffer = await imgRes.arrayBuffer();
      mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
      base64Data = Buffer.from(arrayBuffer).toString('base64');
    }

    const prompt = buildPhotoAnalysisPrompt(technicalContext);

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
          responseMimeType: 'application/json',
          responseSchema: photoAnalysisResponseSchema,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      const isBusy = geminiRes.status === 503 || errText.includes('UNAVAILABLE') || errText.includes('high demand');
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
    return res.status(500).json({ error: error?.message || '分析服务异常' });
  }
}
