
export interface DetailedScores {
  composition: number;     // 构图
  light: number;           // 光影
  color: number;           // 色彩
  technical: number;       // 技术
  expression: number;      // 表达
  overall: number;         // 总体
  tilt?: number;
  sharpness?: number;
}

export interface DetailedAnalysis {
  diagnosis: string;
  improvement: string;
  storyNote: string;
  moodNote: string;
  overallSuggestion: string;
  suggestedTitles?: string[];
  suggestedTags?: string[];
  instagramCaption?: string;
  instagramHashtags?: string[];
}

export interface PhotoEntry {
  id: string;
  title?: string;
  imageUrl: string;
  date: string;
  location: string;
  notes: string;
  tags?: string[];
  params: {
    camera?: string;
    lens?: string;
    aperture?: string;
    shutterSpeed?: string;
    iso?: string;
    focalLength?: string;
  };
  scores: DetailedScores;
  analysis?: DetailedAnalysis;
  tag?: string;
}

export interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  category: string;
}

export interface DailyPrompt {
  id: string;
  title: string;
  description: string;
  technique: string;
}

export enum NavTab {
  EVALUATION = 'evaluation',
  PATH = 'path',
  LEARN = 'learn'
}

// 学习进度追踪
export interface LearningStats {
  streak: number;           // 连续挑战天数
  totalChallenges: number;  // 完成的总挑战数
  lastChallengeDate?: string;
  weakestSkill?: keyof DetailedScores;
  strongestSkill?: keyof DetailedScores;
}

// 挑战完成记录
export interface ChallengeCompletion {
  promptId: string;
  completedAt: string;
  photoEntryId?: string;
}
