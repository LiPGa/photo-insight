import React from 'react';
import { Cpu, Lightbulb } from 'lucide-react';
import { AI_THINKING_STAGES } from '../../constants';

interface AnalyzingOverlayProps {
  thinkingState: { main: string; sub: string };
  thinkingIndex: number;
  currentTip: string;
}

export const AnalyzingOverlay: React.FC<AnalyzingOverlayProps> = ({
  thinkingState,
  thinkingIndex,
  currentTip,
}) => (
  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-black/95 backdrop-blur-2xl rounded-sm border border-white/5 overflow-hidden">
    <div className="max-w-md text-center space-y-6 animate-in zoom-in duration-700">
      {/* AI 头像/状态指示 */}
      <div className="flex items-center justify-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-[#D40000]/20 flex items-center justify-center border border-[#D40000]/30">
          <Cpu size={20} className="text-[#D40000] animate-pulse" />
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-[#D40000] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-[#D40000] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-[#D40000] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>

      {/* 主要思考状态 */}
      <div className="space-y-2">
        <p className="text-2xl font-medium text-white/95 transition-all duration-500">
          {thinkingState.main}
        </p>
        <p className="text-sm text-zinc-500 mono">
          {thinkingState.sub}
        </p>
      </div>

      {/* 进度指示 */}
      <div className="flex items-center justify-center gap-2 pt-4">
        {AI_THINKING_STAGES.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i <= thinkingIndex ? 'w-6 bg-[#D40000]' : 'w-2 bg-zinc-800'
            }`}
          />
        ))}
      </div>

      {/* 小贴士 */}
      <div className="mt-8 pt-6 border-t border-white/5">
        <div className="flex items-center justify-center gap-2 text-zinc-600 mono text-[10px] mb-2">
          <Lightbulb size={12} /> TIP
        </div>
        <p className="text-sm text-zinc-500 italic leading-relaxed px-4">
          {currentTip}
        </p>
      </div>
    </div>

    {/* 背景装饰 */}
    <div className="absolute top-10 left-10 w-20 h-[1px] bg-white/5"></div>
    <div className="absolute bottom-10 right-10 w-20 h-[1px] bg-white/5"></div>
  </div>
);
