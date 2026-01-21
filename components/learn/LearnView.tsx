import React from 'react';
import { Calendar } from 'lucide-react';
import { PhotoEntry, DailyPrompt } from '../../types';
import { LearningProgress } from './LearningProgress';
import { PersonalizedTips } from './PersonalizedTips';
import { ContributionHeatmap } from './ContributionHeatmap';

interface LearnViewProps {
  entries: PhotoEntry[];
  onNavigateToEvaluation: () => void;
}

export const LearnView: React.FC<LearnViewProps> = ({
  entries,
  onNavigateToEvaluation
}) => {
  const handleSelectPrompt = (prompt: DailyPrompt) => {
    // Navigate to evaluation view when a prompt is selected from PersonalizedTips
    onNavigateToEvaluation();
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
            <p className="text-sm text-zinc-500 mt-1">个性化学习</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Calendar size={14} />
            <span className="hidden sm:inline">{dateStr}</span>
            <span className="sm:hidden">{today.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Progress & Tips */}
        <div className="space-y-6">
          {/* Learning Progress */}
          <LearningProgress entries={entries} />

          {/* Personalized Tips */}
          <PersonalizedTips
            entries={entries}
            onSelectPrompt={handleSelectPrompt}
          />
        </div>

        {/* Shooting Activity Heatmap - Full Width */}
        <ContributionHeatmap entries={entries} />

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
