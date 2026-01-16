import React, { useMemo } from 'react';
import { Flame, Target, TrendingUp, Award } from 'lucide-react';
import { PhotoEntry, DetailedScores } from '../../types';

interface LearningProgressProps {
  entries: PhotoEntry[];
}

const SKILL_LABELS: Record<keyof DetailedScores, string> = {
  composition: '构图',
  light: '光影',
  color: '色彩',
  technical: '技术',
  expression: '表达',
  overall: '综合',
  tilt: '水平',
  sharpness: '锐度'
};

export const LearningProgress: React.FC<LearningProgressProps> = ({ entries }) => {
  const stats = useMemo(() => {
    if (entries.length === 0) {
      return {
        totalPhotos: 0,
        avgScore: 0,
        streak: 0,
        skillAverages: {} as Partial<Record<keyof DetailedScores, number>>,
        weakestSkill: null as keyof DetailedScores | null,
        strongestSkill: null as keyof DetailedScores | null,
        recentTrend: 'stable' as 'up' | 'down' | 'stable'
      };
    }

    // Calculate skill averages
    const skillSums: Partial<Record<keyof DetailedScores, number>> = {};
    const skillCounts: Partial<Record<keyof DetailedScores, number>> = {};
    const mainSkills: (keyof DetailedScores)[] = ['composition', 'light', 'color', 'technical', 'expression'];

    entries.forEach(entry => {
      mainSkills.forEach(skill => {
        const value = entry.scores[skill];
        if (typeof value === 'number') {
          skillSums[skill] = (skillSums[skill] || 0) + value;
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        }
      });
    });

    const skillAverages: Partial<Record<keyof DetailedScores, number>> = {};
    let weakest: keyof DetailedScores | null = null;
    let weakestValue = Infinity;
    let strongest: keyof DetailedScores | null = null;
    let strongestValue = -Infinity;

    mainSkills.forEach(skill => {
      const count = skillCounts[skill] || 0;
      if (count > 0) {
        const avg = (skillSums[skill] || 0) / count;
        skillAverages[skill] = avg;
        if (avg < weakestValue) {
          weakestValue = avg;
          weakest = skill;
        }
        if (avg > strongestValue) {
          strongestValue = avg;
          strongest = skill;
        }
      }
    });

    // Calculate overall average
    const overallAvg = entries.reduce((sum, e) => sum + e.scores.overall, 0) / entries.length;

    // Calculate trend (compare recent 5 vs previous 5)
    let recentTrend: 'up' | 'down' | 'stable' = 'stable';
    if (entries.length >= 5) {
      const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const recent5 = sorted.slice(0, 5);
      const previous5 = sorted.slice(5, 10);

      if (previous5.length > 0) {
        const recentAvg = recent5.reduce((s, e) => s + e.scores.overall, 0) / recent5.length;
        const prevAvg = previous5.reduce((s, e) => s + e.scores.overall, 0) / previous5.length;
        if (recentAvg > prevAvg + 0.3) recentTrend = 'up';
        else if (recentAvg < prevAvg - 0.3) recentTrend = 'down';
      }
    }

    // Simple streak calculation based on photo dates
    let streak = 0;
    const today = new Date();
    const sortedByDate = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (let i = 0; i < Math.min(30, sortedByDate.length); i++) {
      const entryDate = new Date(sortedByDate[i].date);
      const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= i + 1) {
        streak++;
      } else {
        break;
      }
    }

    return {
      totalPhotos: entries.length,
      avgScore: overallAvg,
      streak,
      skillAverages,
      weakestSkill: weakest,
      strongestSkill: strongest,
      recentTrend
    };
  }, [entries]);

  const trendIcon = stats.recentTrend === 'up' ? '↗' : stats.recentTrend === 'down' ? '↘' : '→';
  const trendColor = stats.recentTrend === 'up' ? 'text-green-500' : stats.recentTrend === 'down' ? 'text-red-500' : 'text-zinc-500';

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <h3 className="text-sm font-medium tracking-wide">MY PROGRESS</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-px bg-white/5">
        <div className="bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Target size={14} />
            <span className="text-xs">TOTAL</span>
          </div>
          <div className="text-2xl font-light">{stats.totalPhotos}</div>
          <div className="text-xs text-zinc-600">photos analyzed</div>
        </div>

        <div className="bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Award size={14} />
            <span className="text-xs">AVG SCORE</span>
          </div>
          <div className="text-2xl font-light">{stats.avgScore.toFixed(1)}</div>
          <div className={`text-xs ${trendColor}`}>{trendIcon} trend</div>
        </div>

        <div className="bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Flame size={14} className="text-orange-500" />
            <span className="text-xs">STREAK</span>
          </div>
          <div className="text-2xl font-light">{stats.streak}</div>
          <div className="text-xs text-zinc-600">days</div>
        </div>

        <div className="bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <TrendingUp size={14} />
            <span className="text-xs">STRENGTH</span>
          </div>
          <div className="text-lg font-light">
            {stats.strongestSkill ? SKILL_LABELS[stats.strongestSkill] : '-'}
          </div>
          <div className="text-xs text-zinc-600">
            {stats.strongestSkill && stats.skillAverages[stats.strongestSkill]
              ? `${stats.skillAverages[stats.strongestSkill]!.toFixed(1)} avg`
              : 'no data'}
          </div>
        </div>
      </div>

      {/* Skill Bars */}
      <div className="p-6 space-y-3">
        <div className="text-xs text-zinc-500 mb-4">SKILL BREAKDOWN</div>
        {(['composition', 'light', 'color', 'technical', 'expression'] as const).map(skill => {
          const value = stats.skillAverages[skill] || 0;
          const isWeakest = skill === stats.weakestSkill;
          const isStrongest = skill === stats.strongestSkill;

          return (
            <div key={skill} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className={`${isWeakest ? 'text-[#D40000]' : isStrongest ? 'text-green-500' : 'text-zinc-400'}`}>
                  {SKILL_LABELS[skill]}
                  {isWeakest && ' (需加强)'}
                  {isStrongest && ' (优势)'}
                </span>
                <span className="text-zinc-500">{value.toFixed(1)}</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isWeakest ? 'bg-[#D40000]' : isStrongest ? 'bg-green-500' : 'bg-zinc-600'
                  }`}
                  style={{ width: `${(value / 10) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
