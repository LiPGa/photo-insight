// Helper to get random score
const getRandomScore = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(1));

// Mock 数据 - 本地测试时使用 (10分制)
const getMockResponse = () => ({
  scores: {
    composition: getRandomScore(6.0, 8.5),
    light: getRandomScore(5.5, 8.0),
    color: getRandomScore(6.0, 8.0),
    technical: getRandomScore(5.5, 7.5),
    moment: getRandomScore(4.8, 7.2),
    expression: getRandomScore(6.0, 8.5),
    originality: getRandomScore(4.8, 7.0),
    competitionFit: getRandomScore(4.2, 6.8),
    overall: getRandomScore(6.0, 8.0)
  },
  analysis: {
    diagnosis: "这张照片有明确的观看方向，但目前更接近一次有效记录，还没有完全成为一张成熟作品。主体和环境之间有关系，不过画面边缘与背景信息仍然分散注意力。",
    strengths: [
      "主体位置没有完全居中，画面保留了一些环境信息，让照片不只是单纯记录对象。",
      "光线没有严重破坏主体，可读性基本成立。",
      "色彩处理相对克制，没有用过重后期掩盖画面问题。"
    ],
    weaknesses: [
      "背景关系还不够精确，边缘处的信息会抢走视线。",
      "瞬间不够决定性，人物或主体状态还没有形成不可替代的时机。",
      "目前适合社交媒体展示，但作为比赛投稿，作品性还偏弱。"
    ],
    technicalReview: "曝光和焦点基本可用，技术没有成为主要问题，但画面完成度更多受制于构图取舍和瞬间等待。EXIF 可以作为参考，但这张照片的提升重点不在参数。",
    improvement: "先把画面里真正有用的关系留下来，减少边缘干扰；其次等待一个更明确的动作或视线，让主体和环境之间产生更强的张力。",
    storyNote: "画面有日常观察的基础，但故事性仍是推测，还没有被具体动作或空间关系充分支撑。",
    moodNote: "平静、沉思",
    overallSuggestion: "这张照片有练习价值，但离投稿作品还需要更强的瞬间和更干净的画面关系。",
    submissionAssessment: {
      verdict: "适合 Instagram / 小红书，但不适合比赛",
      reason: "画面有基本审美和可读性，但缺少足够独特的观看方式或决定性瞬间，作为单张投稿说服力不足。"
    },
    cropAdvice: "可以轻微裁掉边缘最分散注意力的区域，但不要裁到只剩主体，否则会失去环境关系。",
    editingAdvice: "建议压低无关背景的亮度，适度增加主体附近的局部对比；色温和饱和度保持克制。",
    reshootAdvice: "重拍时靠近半步或换一个更低的机位，等待主体出现明确动作、视线或与背景形成呼应的瞬间。",
    nextAssignment: "在同一个街角或室内窗口附近拍 30 分钟，只拍一个主体和一个背景关系；等待人物进入光线边界或与背景形状重合，成功标准是去掉主体后背景仍有结构，加入主体后关系更强。",
    oneLineConclusion: "这是一张有观察意识但作品性还不够强的照片，下一步要把瞬间和边缘控制练得更狠。",
    suggestedTitles: ["静谧时光", "光影之间", "日常的诗意"],
    suggestedTags: ["生活", "光影", "日常", "街拍", "城市"],
    instagramCaption: "In the quiet moments, we find ourselves.",
    instagramCaptions: ["A quiet pause in the frame.", "Held between light and routine.", "Nothing loud, just observed."],
    instagramHashtags: ["photography", "streetphotography", "lightandshadow", "urbanlife", "dailylife", "moments", "visualstorytelling"]
  }
});

async function readErrorResponse(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const errorData = await response.json().catch(() => ({}));
    return errorData.error || errorData.message || `分析请求失败: ${response.status}`;
  }

  const text = await response.text().catch(() => '');
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    return '/api/analyze 没有正确部署，服务器返回了网页而不是分析结果';
  }

  return text || `分析请求失败: ${response.status}`;
}

function toUserFacingError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('high demand') || message.includes('UNAVAILABLE') || message.includes('503')) {
    return new Error('Gemini 当前繁忙，请稍后重试');
  }

  if (message.includes('没有正确部署') || message.includes('Unexpected token') || message.includes('not valid JSON')) {
    return new Error('/api/analyze 分析接口未正确部署，请检查当前部署平台的 serverless function 配置');
  }

  if (message.includes('GEMINI_API_KEY')) {
    return new Error('分析服务缺少 GEMINI_API_KEY，请检查部署环境变量');
  }

  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return new Error('网络请求失败，请检查当前网络或稍后重试');
  }

  return new Error(message || '分析终端响应异常。请重试。');
}

export async function analyzePhoto(imageUri: string, technicalContext: any): Promise<any> {
  // Mock 模式 - 本地测试不调用 API
  const useMock = import.meta.env.VITE_MOCK_API === 'true';

  if (useMock) {
    console.log('🔧 Mock 模式: 返回模拟数据，不调用 API');
    await new Promise(resolve => setTimeout(resolve, 2000));
    return getMockResponse();
  }

  try {
    // 改为调用内部 API 代理，以绕过网络限制并保护 API Key
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUri,
        technicalContext
      }),
    });

    if (!response.ok) {
      throw new Error(await readErrorResponse(response));
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(await readErrorResponse(response));
    }

    const result = await response.json();

    // Validate response structure
    if (!result.scores || !result.analysis) {
      console.error("Invalid API response structure:", result);
      throw new Error("API 返回数据格式错误");
    }

    return result;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw toUserFacingError(error);
  }
}
