import React from 'react';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { DailyPrompt } from '../../types';

interface DailyPromptCardProps {
  prompt: DailyPrompt;
  onStartChallenge: () => void;
  compact?: boolean;
}

export const DailyPromptCard: React.FC<DailyPromptCardProps> = ({
  prompt,
  onStartChallenge,
  compact = false
}) => {
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-[#D40000]/10 to-transparent border border-[#D40000]/20 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-[#D40000]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-[#D40000]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-zinc-500 mb-0.5">TODAY'S INSPIRATION</div>
              <div className="text-sm font-medium truncate">{prompt.title}</div>
            </div>
          </div>
          <button
            onClick={onStartChallenge}
            className="flex items-center gap-1 text-xs text-[#D40000] hover:text-white transition-colors flex-shrink-0"
          >
            <span>GO</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#D40000]/20 to-transparent px-5 sm:px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#D40000] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(212,0,0,0.3)] flex-shrink-0">
            <Sparkles size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs text-zinc-500 tracking-wider">TODAY'S INSPIRATION</div>
            <div className="text-lg sm:text-xl font-medium truncate">{prompt.title}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
          {prompt.description}
        </p>

        {/* Technique Tag */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-zinc-400 font-medium">
            {prompt.technique}
          </span>
        </div>

        {/* Tip */}
        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/5">
          <Lightbulb size={16} className="text-yellow-500/80 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-400 leading-relaxed">
            完成今日挑战后，上传你的作品获取AI点评，看看你对这个主题的理解。
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={onStartChallenge}
          className="w-full py-3.5 sm:py-3 bg-[#D40000] active:bg-[#B30000] text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
        >
          <span>开始挑战</span>
          <ArrowRight size={16} className="group-active:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
