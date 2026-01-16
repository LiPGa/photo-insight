import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { PhotoEntry, DailyPrompt, NavTab } from '../../types';
import { DAILY_PROMPTS, getTodayPrompt } from '../../constants';
import { DailyPromptCard } from './DailyPromptCard';
import { LearningProgress } from './LearningProgress';
import { PersonalizedTips } from './PersonalizedTips';

interface LearnViewProps {
  entries: PhotoEntry[];
  onNavigateToEvaluation: () => void;
}

export const LearnView: React.FC<LearnViewProps> = ({
  entries,
  onNavigateToEvaluation
}) => {
  const [selectedPrompt, setSelectedPrompt] = useState<DailyPrompt | null>(null);
  const todayPrompt = getTodayPrompt();

  // Browse prompts
  const [browseIndex, setBrowseIndex] = useState(() => {
    return DAILY_PROMPTS.findIndex(p => p.id === todayPrompt.id);
  });

  const currentBrowsePrompt = DAILY_PROMPTS[browseIndex];

  const handlePrevPrompt = () => {
    setBrowseIndex(prev => (prev - 1 + DAILY_PROMPTS.length) % DAILY_PROMPTS.length);
  };

  const handleNextPrompt = () => {
    setBrowseIndex(prev => (prev + 1) % DAILY_PROMPTS.length);
  };

  const handleStartChallenge = () => {
    onNavigateToEvaluation();
  };

  const handleSelectPrompt = (prompt: DailyPrompt) => {
    setSelectedPrompt(prompt);
    const idx = DAILY_PROMPTS.findIndex(p => p.id === prompt.id);
    if (idx !== -1) {
      setBrowseIndex(idx);
    }
  };

  // Get today's date formatted
  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <div className="flex-1 p-5 sm:p-8 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight">Learn</h1>
            <p className="text-sm text-zinc-500 mt-1">每日灵感与个性化学习</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Calendar size={14} />
            <span className="hidden sm:inline">{dateStr}</span>
            <span className="sm:hidden">{today.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Daily Inspiration */}
          <div className="space-y-6">
            {/* Today's Prompt */}
            <DailyPromptCard
              prompt={currentBrowsePrompt}
              onStartChallenge={handleStartChallenge}
            />

            {/* Prompt Browser */}
            <div className="flex items-center justify-between px-2">
              <button
                onClick={handlePrevPrompt}
                className="p-3 text-zinc-500 active:text-white active:bg-white/10 rounded-full transition-all active:scale-95"
              >
                <ChevronLeft size={22} />
              </button>

              <div className="text-center">
                <div className="text-sm font-medium text-zinc-400">
                  {browseIndex + 1} / {DAILY_PROMPTS.length}
                </div>
                <div className="text-[10px] text-zinc-600 mt-0.5 tracking-wider uppercase">
                  浏览所有主题
                </div>
              </div>

              <button
                onClick={handleNextPrompt}
                className="p-3 text-zinc-500 active:text-white active:bg-white/10 rounded-full transition-all active:scale-95"
              >
                <ChevronRight size={22} />
              </button>
            </div>

            {/* Prompt Categories */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-4">PROMPT CATEGORIES</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(DAILY_PROMPTS.map(p => p.technique))).map(technique => {
                  const count = DAILY_PROMPTS.filter(p => p.technique === technique).length;
                  return (
                    <span
                      key={technique}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-zinc-400"
                    >
                      {technique} <span className="text-zinc-600">({count})</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Progress & Tips */}
          <div className="space-y-6">
            {/* Learning Progress */}
            <LearningProgress entries={entries} />

            {/* Personalized Tips */}
            <PersonalizedTips
              entries={entries}
              onSelectPrompt={handleSelectPrompt}
            />
          </div>
        </div>

        {/* Quick Tips Section */}
        <div className="border-t border-white/5 pt-8">
          <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-4">QUICK PHOTOGRAPHY TIPS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: '光线观察', tip: '注意光线的方向和质感，侧光能强调纹理，逆光可创造剪影' },
              { title: '减法构图', tip: '画面中的元素越少越好，问自己：这个元素必须存在吗？' },
              { title: '等待时机', tip: '好照片往往需要等待，等待光线、等待人物、等待那个瞬间' }
            ].map((item, i) => (
              <div key={i} className="p-4 bg-zinc-900/30 border border-white/5 rounded-lg">
                <h4 className="text-sm font-medium mb-2">{item.title}</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
