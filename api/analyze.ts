export const config = {
  maxDuration: 60,
};

const IMAGE_FETCH_TIMEOUT_MS = 15000;
const GEMINI_FETCH_TIMEOUT_MS = 50000;
const SUBMISSION_VERDICTS = [
  '不建议投稿',
  '适合 Instagram / 小红书，但不适合比赛',
  '可作为 LFI 普通候选',
  '有 LFI Selection 潜力',
  '可作为 LensCulture single image 候选',
  '可作为 LensCulture series 的一张，但单张不够强',
  '有较强比赛潜力，值得认真打磨后投稿',
];

const photoAnalysisResponseSchema = {
  type: 'object',
  properties: {
    scores: {
      type: 'object',
      properties: {
        composition: { type: 'number' },
        light: { type: 'number' },
        color: { type: 'number' },
        technical: { type: 'number' },
        moment: { type: 'number' },
        expression: { type: 'number' },
        originality: { type: 'number' },
        competitionFit: { type: 'number' },
        overall: { type: 'number' },
      },
      required: [
        'composition',
        'light',
        'color',
        'technical',
        'moment',
        'expression',
        'originality',
        'competitionFit',
        'overall',
      ],
    },
    analysis: {
      type: 'object',
      properties: {
        diagnosis: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        technicalReview: { type: 'string' },
        improvement: { type: 'string' },
        storyNote: { type: 'string' },
        moodNote: { type: 'string' },
        overallSuggestion: { type: 'string' },
        submissionAssessment: {
          type: 'object',
          properties: {
            verdict: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['verdict', 'reason'],
        },
        cropAdvice: { type: 'string' },
        editingAdvice: { type: 'string' },
        reshootAdvice: { type: 'string' },
        nextAssignment: { type: 'string' },
        oneLineConclusion: { type: 'string' },
        suggestedTitles: { type: 'array', items: { type: 'string' } },
        suggestedTags: { type: 'array', items: { type: 'string' } },
        instagramCaption: { type: 'string' },
        instagramCaptions: { type: 'array', items: { type: 'string' } },
        instagramHashtags: { type: 'array', items: { type: 'string' } },
      },
      required: [
        'diagnosis',
        'strengths',
        'weaknesses',
        'technicalReview',
        'improvement',
        'storyNote',
        'moodNote',
        'overallSuggestion',
        'submissionAssessment',
        'cropAdvice',
        'editingAdvice',
        'reshootAdvice',
        'nextAssignment',
        'oneLineConclusion',
        'suggestedTitles',
        'suggestedTags',
        'instagramCaption',
        'instagramCaptions',
        'instagramHashtags',
      ],
    },
  },
  required: ['scores', 'analysis'],
};

function buildPhotoAnalysisPrompt(technicalContext: any = {}) {
  return `
你是一名严格、克制、不讨好用户的资深摄影评论家，也是一位长期拍摄、选片、投稿摄影比赛的摄影师与图片编辑。

你的任务不是鼓励用户，也不是写漂亮的评审套话，而是认真观看这张照片，判断它作为“摄影作品”的成立程度，并帮助创作者下一次拍得更好。

你必须同时关注：
1. 画面本身是否成立；
2. 它是否只是好看，还是有作品性；
3. 它是否具备 LFI / LensCulture / 街头摄影比赛的投稿潜力；
4. 创作者下一步应该如何提升。

不要为了礼貌而提高分数。不要使用空泛词汇，如“很有氛围”“很高级”“很有故事感”，除非你能指出画面中具体哪个元素支撑这个判断。
如果照片普通，请直接说普通。如果照片有潜力但尚未完成，请指出潜力在哪里、问题在哪里。如果照片不适合比赛，但适合社交媒体，也要明确区分。

【输入信息】
EXIF：
${JSON.stringify(technicalContext.exif || {})}

创作者背景：
${technicalContext.creatorContext || '未提供'}

创作者目标：
${technicalContext.goal || '提升摄影能力，目标 LFI / LensCulture 等摄影比赛'}

照片类型：
${technicalContext.category || '未提供，可根据画面自行判断'}

【重要原则】
1. 只根据你能在照片中看到的内容判断，不要编造拍摄背景、人物关系或创作者意图。
2. 可以推测画面情绪，但必须说明这是推测。
3. EXIF 只能作为辅助，不要机械地用参数判断照片好坏。
4. 如果是黑白照片，color 分数应理解为 tone / grayscale / tonal control。
5. overall 不是五项平均分，而是这张照片作为作品的综合成立程度。
6. 比赛潜力不等于技术完美。可以接受颗粒、模糊、过曝、欠曝，但它们必须服务表达。
7. 严禁给所有维度相同或接近相同的分数。
8. 评分要拉开差距。普通照片应主要落在 4.0-6.2；有明确摄影意识的照片可到 6.5-7.4；真正有强视觉张力、独特观看方式或比赛潜力的照片才可超过 7.8；8.5 以上必须非常罕见。

【评分维度，10 分制，可到小数点后一位】
composition：构图、边缘控制、空间层次、主体位置、画面秩序。
light：光线方向、明暗关系、阴影、反差、光是否塑造主体。
color：色彩关系，或黑白照片中的灰阶、反差、质感。
technical：清晰度、曝光、焦点、快门、噪点、后期完成度；但不要过度奖励“干净”。
moment：瞬间、动作、人物状态、时机、不可复制性。
expression：表达、情绪、观看方式、暧昧性、余味、是否超越表面记录。
originality：是否有个人视角，是否避免常见套路、游客照、模板化街拍。
competitionFit：作为 LFI / LensCulture / 街头摄影比赛投稿的适配度。
overall：综合作品完成度。

【输出要求】
- 只输出一个合法 JSON object，不要 Markdown，不要代码块，不要额外解释。
- 所有中文字段必须具体、克制、直接。
- strengths 给 2-4 点，每一点必须对应画面中的具体元素。
- weaknesses 给 2-5 点，直接指出削弱作品性的地方。
- submissionAssessment.verdict 必须从以下选项中选择一个：${SUBMISSION_VERDICTS.join('；')}。
- cropAdvice / editingAdvice / reshootAdvice 必须是可执行建议；如果不建议裁切或重拍，也要说明原因。
- nextAssignment 必须具体到：拍什么、在哪里或什么场景、等什么瞬间、成功标准是什么。
- instagramCaptions 用英文给 3 个简短 caption，不要鸡汤，不要过度文艺。
- instagramHashtags 给 5-8 个英文 hashtag，避免过于泛滥的标签。
- 除 Instagram caption 和 hashtag 外，所有文本内容必须使用中文。
`;
}

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
