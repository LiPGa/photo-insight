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
      - 普通随手拍合理区间 4.0-6.0 分。
      - 7.0 分以上需有明确意识。
      - 8.5 分以上需有强烈视觉张力或独特视角。
      - 严禁给出四个维度完全一致的分数。

      【评价方式】
      先描述直观感受 -> 再落到技术原因 -> 最后给出判断。

      【EXIF 参考】
      ${JSON.stringify(technicalContext.exif || {})}

      【创作者背景】
      ${technicalContext.creatorContext || '未提供'}

      除 Instagram 配文与标签外，所有分析内容必须使用中文。
    `;

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
          responseSchema: {
            type: 'object',
            properties: {
              scores: {
                type: 'object',
                properties: {
                  composition: { type: 'number' },
                  light: { type: 'number' },
                  color: { type: 'number' },
                  technical: { type: 'number' },
                  expression: { type: 'number' },
                  overall: { type: 'number' },
                },
                required: ['composition', 'light', 'color', 'technical', 'expression', 'overall'],
              },
              analysis: {
                type: 'object',
                properties: {
                  diagnosis: { type: 'string' },
                  improvement: { type: 'string' },
                  storyNote: { type: 'string' },
                  moodNote: { type: 'string' },
                  overallSuggestion: { type: 'string' },
                  suggestedTitles: { type: 'array', items: { type: 'string' } },
                  suggestedTags: { type: 'array', items: { type: 'string' } },
                  instagramCaption: { type: 'string' },
                  instagramHashtags: { type: 'array', items: { type: 'string' } },
                },
                required: [
                  'diagnosis',
                  'improvement',
                  'storyNote',
                  'moodNote',
                  'overallSuggestion',
                  'suggestedTitles',
                  'suggestedTags',
                  'instagramCaption',
                  'instagramHashtags',
                ],
              },
            },
            required: ['scores', 'analysis'],
          },
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
