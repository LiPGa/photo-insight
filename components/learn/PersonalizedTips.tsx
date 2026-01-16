import React, { useMemo } from 'react';
import { BookOpen, ArrowRight, Zap } from 'lucide-react';
import { PhotoEntry, DetailedScores, DailyPrompt } from '../../types';
import { SKILL_IMPROVEMENT_TIPS, DAILY_PROMPTS } from '../../constants';

interface PersonalizedTipsProps {
  entries: PhotoEntry[];
  onSelectPrompt: (prompt: DailyPrompt) => void;
}

const SKILL_LABELS: Record<string, string> = {
  composition: '构图',
  light: '光影',
  color: '色彩',
  technical: '技术',
  expression: '表达'
};

export const PersonalizedTips: React.FC<PersonalizedTipsProps> = ({ entries, onSelectPrompt }) => {
  const analysis = useMemo(() => {
    if (entries.length < 3) {
      return {
        hasEnoughData: false,
        weakestSkill: null as string | null,
        tips: [] as string[],
        recommendedPrompts: [] as DailyPrompt[]
      };
    }

    // Calculate skill averages
    const skillSums: Record<string, number> = {};
    const skillCounts: Record<string, number> = {};
    const mainSkills = ['composition', 'light', 'color', 'technical', 'expression'];

    entries.forEach(entry => {
      mainSkills.forEach(skill => {
        const value = entry.scores[skill as keyof DetailedScores];
        if (typeof value === 'number') {
          skillSums[skill] = (skillSums[skill] || 0) + value;
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        }
      });
    });

    let weakest: string | null = null;
    let weakestValue = Infinity;

    mainSkills.forEach(skill => {
      const count = skillCounts[skill] || 0;
      if (count > 0) {
        const avg = (skillSums[skill] || 0) / count;
        if (avg < weakestValue) {
          weakestValue = avg;
          weakest = skill;
        }
      }
    });

    // Get tips and prompts for the weakest skill
    const skillData = weakest ? SKILL_IMPROVEMENT_TIPS[weakest] : null;
    const tips = skillData?.tips || [];
    const promptIds = skillData?.prompts || [];

    // Get recommended prompts
    const recommendedPrompts = promptIds
      .slice(0, 3)
      .map(id => DAILY_PROMPTS.find(p => p.id === id))
      .filter((p): p is DailyPrompt => p !== undefined);

    return {
      hasEnoughData: true,
      weakestSkill: weakest,
      tips,
      recommendedPrompts
    };
  }, [entries]);

  if (!analysis.hasEnoughData) {
    return (
      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
            <BookOpen size={18} className="text-zinc-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium">PERSONALIZED TIPS</h3>
            <p className="text-xs text-zinc-500">Unlock after 3 photos</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap size={24} className="text-zinc-600" />
          </div>
          <p className="text-sm text-zinc-500 mb-2">
            上传更多作品以解锁个性化学习建议
          </p>
          <p className="text-xs text-zinc-600">
            还需要 {3 - entries.length} 张照片
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D40000]/20 rounded-full flex items-center justify-center">
            <BookOpen size={18} className="text-[#D40000]" />
          </div>
          <div>
            <h3 className="text-sm font-medium">PERSONALIZED TIPS</h3>
            <p className="text-xs text-zinc-500">
              Focus on: <span className="text-[#D40000]">{SKILL_LABELS[analysis.weakestSkill!]}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tips List */}
      <div className="p-6 space-y-4">
        <div className="text-xs text-zinc-500 uppercase tracking-wider">Improvement Tips</div>
        <ul className="space-y-3">
          {analysis.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 bg-white/5 rounded-full flex items-center justify-center text-xs text-zinc-500 flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-zinc-300">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommended Challenges */}
      {analysis.recommendedPrompts.length > 0 && (
        <div className="px-6 pb-6 space-y-3">
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Recommended Challenges</div>
          <div className="space-y-2">
            {analysis.recommendedPrompts.map(prompt => (
              <button
                key={prompt.id}
                onClick={() => onSelectPrompt(prompt)}
                className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
              >
                <div className="text-left">
                  <div className="text-sm font-medium">{prompt.title}</div>
                  <div className="text-xs text-zinc-500">{prompt.technique}</div>
                </div>
                <ArrowRight size={14} className="text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
