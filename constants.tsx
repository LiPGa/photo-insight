
import { DailyPrompt, Goal, PhotoEntry } from './types';

// AI 分析时的思考状态 (分阶段多变体)
export const AI_THINKING_STAGES = [
  // Stage 1: Initial Perception (初印象)
  [
    { main: "正在凝视这张照片...", sub: "试图理解画面的第一印象" },
    { main: "让我先感受一下氛围...", sub: "建立视觉连接" },
    { main: "捕捉第一眼的直觉...", sub: "扫描整体色调与情绪" },
    { main: "正在建立视觉锚点...", sub: "寻找画面的重心" }
  ],
  // Stage 2: Composition & Structure (构图与结构)
  [
    { main: "嗯，让我仔细看看构图", sub: "分析视觉元素的排布" },
    { main: "正在寻找几何关系...", sub: "检测线条与形状的平衡" },
    { main: "仿佛看到了布列松的影子...", sub: "寻找决定性瞬间的痕迹" },
    { main: "构图很有何藩的味道...", sub: "分析光影切割与负空间" },
    { main: "正在应用三分法则...", sub: "检查主体的视觉权重" },
    { main: "观察画面的引导线...", sub: "视线流动的路径分析" }
  ],
  // Stage 3: Light & Tone (光影与色调)
  [
    { main: "光影很有意思...", sub: "解读明暗关系与氛围" },
    { main: "光线的质感很独特...", sub: "分析高光与阴影的层次" },
    { main: "这色彩让人想起电影...", sub: "解读色调的情感语言" },
    { main: "正在感受光的流动...", sub: "追踪光源与阴影投射" },
    { main: "分析安塞尔·亚当斯的区域...", sub: "检查黑白场与动态范围" },
    { main: "色彩像索尔·雷特一样迷人...", sub: "解读色彩的层次与隔绝感" }
  ],
  // Stage 4: Narrative & Emotion (叙事与情感)
  [
    { main: "我在思考这张照片想说什么", sub: "探索叙事与情感表达" },
    { main: "画面背后似乎有故事...", sub: "解读人物神态与环境隐喻" },
    { main: "这不仅仅是一张照片...", sub: "寻找视觉之外的弦外之音" },
    { main: "正在体会拍摄者的心境...", sub: "连接创作者的意图" },
    { main: "像森山大道那样的张力...", sub: "感受画面的粗颗粒情感" },
    { main: "寻找爱德华·霍普式的孤独...", sub: "解读空间与人的疏离感" }
  ],
  // Stage 5: Synthesis & Output (综合与输出)
  [
    { main: "正在组织我的想法", sub: "整合技术分析与感性认知" },
    { main: "快好了，正在斟酌措辞", sub: "确保反馈诚实且有建设性" },
    { main: "正在生成最终评价...", sub: "提炼最核心的改进建议" },
    { main: "正在为您写下这段评语...", sub: "生成独一无二的摄影见解" }
  ]
];

// 保持旧的 export 兼容性（可选，但为了防止报错，我们暂时保留一个 simplified version 或者直接修改 hook）
// 为了 clean code，我们这里不保留旧名，直接去修改 hooks


// EXIF 字段显示标签
export const EXIF_LABELS: Record<string, string> = {
  camera: 'CAMERA',
  aperture: 'APERTURE',
  shutterSpeed: 'SHUTTER',
  iso: 'ISO',
  focalLength: 'FOCAL',
};

// 文件和使用限制
export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
export const GUEST_DAILY_LIMIT = 5;  // 未登录用户每日限制
export const USER_DAILY_LIMIT = 20;  // 登录用户每日限制
export const DAILY_LIMIT = GUEST_DAILY_LIMIT; // 兼容旧代码
export const STORAGE_KEY = 'photopath_daily_usage';
export const USER_STORAGE_KEY = 'photopath_user_daily_usage';
export const CACHE_KEY = 'photopath_image_cache';

export const PHOTO_TIPS = [
  "尝试‘三分法’构图，将主体放在画面的黄金分割点上。",
  "清晨和傍晚的‘黄金时刻’光线最柔和，最适合人像拍摄。",
  "注意画面的‘负空间’，适当的留白能让主体更突出。",
  "使用引导线（如道路、围栏）将读者的视线引向主体。",
  "改变拍摄角度，尝试低角度俯拍或高角度仰拍来寻找新视角。",
  "在构图中寻找自然边框（如窗户、树枝）来增加画面深度。",
  "注意背景中的杂物，简洁的背景通常比复杂的背景更高级。",
  "尝试使用手动对焦，在光线复杂的环境下能获得更好的效果。",
  "影子的力量：有时阴影比光亮部分更能传达情绪。",
  "决定性瞬间：等待那个眼神、那个动作、那个光影交汇的瞬间。"
];

export const INITIAL_ENTRIES: PhotoEntry[] = [
  {
    id: 'SEQ_229041',
    imageUrl: 'https://picsum.photos/seed/p1/800/1000',
    date: '2024.03.15',
    location: 'STATION_ALPHA',
    notes: '日落时分的街头随手拍。',
    params: { camera: 'Leica Q2', aperture: 'f/2.8', iso: '200' },
    scores: {
      composition: 6.5,
      light: 7.0,
      content: 5.5,
      completeness: 6.0,
      overall: 6.2
    },
    analysis: {
      diagnosis: "照片成功捕捉到了日落时分温润的光影氛围，色调和谐，给人以宁静的视觉感受。\n但构图上缺乏明确的力量感，背景中杂乱的线条分散了主体的吸引力，属于一张带有美感但缺乏深度的生活记录。",
      improvement: "建议通过改变视角来压缩背景杂物，使主体更加纯粹，或利用长焦拉近距离。",
      storyNote: "斜阳拉长的影子里藏着城市疲惫的温柔。",
      moodNote: "暖色调营造了舒适但略显平淡的情绪。",
      overallSuggestion: "不要止步于记录，尝试在画面中寻找更冲突的视觉元素。",
      suggestedTitles: ["落日余温", "都市碎片", "归途"],
      suggestedTags: ["#纪实", "#光影"],
      instagramCaption: "Golden hour whispers in the urban silence.",
      instagramHashtags: ["#streetphotography", "#leicaq2", "#goldenhour", "#cinematic"]
    }
  }
];

export const INITIAL_GOALS: Goal[] = [
  { id: 'g1', title: '完成 30 张街头人像', current: 12, target: 30, category: 'Skills' }
];

export const DAILY_PROMPTS: DailyPrompt[] = [
  { id: 'p1', title: '负空间', description: '寻找一个主体并用大量留白包围它。', technique: '构图' }
];
