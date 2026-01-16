
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
      color: 7.5,
      technical: 6.0,
      expression: 6.0,
      overall: 6.5
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
  { id: 'p1', title: '负空间', description: '寻找一个主体并用大量留白包围它，让留白成为画面的一部分。', technique: '构图' },
  { id: 'p2', title: '黄金时刻', description: '在日出后或日落前的黄金时刻拍摄，捕捉柔和温暖的光线。', technique: '光影' },
  { id: 'p3', title: '框中框', description: '利用门框、窗户、树枝等自然元素作为画框，增加画面层次。', technique: '构图' },
  { id: 'p4', title: '倒影世界', description: '寻找水面、玻璃或任何反射表面，拍摄有趣的倒影。', technique: '创意' },
  { id: 'p5', title: '极简主义', description: '用最少的元素讲述故事，追求画面的极致简洁。', technique: '构图' },
  { id: 'p6', title: '影子猎人', description: '让影子成为主角，捕捉有趣的光影形状和图案。', technique: '光影' },
  { id: 'p7', title: '色彩对比', description: '寻找强烈的色彩对比，如互补色或冷暖对比。', technique: '色彩' },
  { id: 'p8', title: '低角度视角', description: '蹲下或趴下，从低角度拍摄，发现不一样的世界。', technique: '视角' },
  { id: 'p9', title: '街头瞬间', description: '在街头等待一个决定性瞬间，人与环境的完美交汇。', technique: '纪实' },
  { id: 'p10', title: '纹理之美', description: '近距离拍摄各种纹理：树皮、墙面、织物、水纹。', technique: '技术' },
  { id: 'p11', title: '单色世界', description: '只关注一种颜色，在环境中寻找同色系的元素。', technique: '色彩' },
  { id: 'p12', title: '引导线', description: '利用道路、栏杆、建筑线条引导观者视线。', technique: '构图' },
  { id: 'p13', title: '逆光剪影', description: '对着光源拍摄，创造戏剧性的剪影效果。', technique: '光影' },
  { id: 'p14', title: '静物叙事', description: '用日常物品讲述一个故事，注意布光和摆放。', technique: '表达' },
  { id: 'p15', title: '对称之美', description: '寻找完美对称的场景，建筑、倒影、人物皆可。', technique: '构图' },
  { id: 'p16', title: '蓝调时刻', description: '在日出前或日落后的蓝色时刻拍摄，捕捉冷调氛围。', technique: '光影' },
  { id: 'p17', title: '层次感', description: '创造前景、中景、背景的层次，增加画面深度。', technique: '构图' },
  { id: 'p18', title: '情绪肖像', description: '拍摄一张能传达强烈情绪的人像，眼神是关键。', technique: '表达' },
  { id: 'p19', title: '几何猎人', description: '在日常环境中寻找有趣的几何形状和图案。', technique: '构图' },
  { id: 'p20', title: '雨天魔法', description: '下雨天拍摄，捕捉雨滴、水洼倒影或朦胧氛围。', technique: '创意' },
  { id: 'p21', title: '高调影像', description: '尝试高调摄影，以白色和亮色为主导。', technique: '技术' },
  { id: 'p22', title: '低调影像', description: '尝试低调摄影，以黑色和暗色为主导，营造戏剧感。', technique: '技术' },
  { id: 'p23', title: '动态模糊', description: '使用慢快门捕捉运动模糊，展现时间流动。', technique: '技术' },
  { id: 'p24', title: '窗户故事', description: '透过窗户拍摄，或拍摄窗户本身，探索框架与光线。', technique: '创意' },
  { id: 'p25', title: '人与建筑', description: '将人物放入建筑环境中，探索尺度与空间关系。', technique: '构图' },
  { id: 'p26', title: '夜间漫步', description: '夜晚拍摄，利用城市灯光、霓虹、车轨创作。', technique: '光影' },
  { id: 'p27', title: '自然光肖像', description: '只用自然光拍摄人像，观察光线方向和质感。', technique: '光影' },
  { id: 'p28', title: '细节特写', description: '关注被忽视的小细节，手、眼睛、物品的局部。', technique: '表达' },
  { id: 'p29', title: '重复图案', description: '寻找重复的元素和图案，创造视觉韵律。', technique: '构图' },
  { id: 'p30', title: '孤独感', description: '拍摄一张能传达孤独或宁静感的照片。', technique: '表达' },
  { id: 'p31', title: '日常诗意', description: '在最平凡的日常场景中发现诗意和美感。', technique: '表达' }
];

// 学习建议 - 基于薄弱项的针对性练习
export const SKILL_IMPROVEMENT_TIPS: Record<string, { tips: string[]; prompts: string[] }> = {
  composition: {
    tips: [
      '多练习三分法构图，将主体放在交叉点上',
      '尝试打破常规，用中心构图营造对称感',
      '注意前景元素，增加画面纵深'
    ],
    prompts: ['p1', 'p3', 'p5', 'p12', 'p15', 'p17', 'p19', 'p25', 'p29']
  },
  light: {
    tips: [
      '观察光线的方向、质感和色温',
      '利用逆光和侧光创造戏剧效果',
      '黄金时刻和蓝调时刻是最佳练习时机'
    ],
    prompts: ['p2', 'p6', 'p13', 'p16', 'p26', 'p27']
  },
  color: {
    tips: [
      '学习色彩理论，了解互补色和类似色',
      '尝试限制色彩数量，追求和谐',
      '注意环境光对色彩的影响'
    ],
    prompts: ['p7', 'p11', 'p21', 'p22']
  },
  technical: {
    tips: [
      '多练习手动对焦和曝光控制',
      '了解景深与光圈的关系',
      '尝试不同快门速度的创意效果'
    ],
    prompts: ['p10', 'p21', 'p22', 'p23']
  },
  expression: {
    tips: [
      '拍摄前思考想要传达的情感',
      '学会等待决定性瞬间',
      '尝试用画面讲述完整的故事'
    ],
    prompts: ['p9', 'p14', 'p18', 'p28', 'p30', 'p31']
  }
};

// 根据日期获取今日灵感
export const getTodayPrompt = (): DailyPrompt => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
};
