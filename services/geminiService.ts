// Helper to get random score
const getRandomScore = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(1));

// Mock 数据 - 本地测试时使用 (10分制)
const getMockResponse = () => ({
  scores: {
    composition: getRandomScore(6.0, 8.5),
    light: getRandomScore(5.5, 8.0),
    color: getRandomScore(6.0, 8.0),
    technical: getRandomScore(5.5, 7.5),
    expression: getRandomScore(6.0, 8.5),
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
