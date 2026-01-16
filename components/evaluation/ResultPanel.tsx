import React, { useState } from 'react';
import {
  Zap,
  TypeIcon,
  TagIcon,
  MessageSquare,
  Lightbulb,
  ImageIcon,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ScoreMeter } from '../ui/ScoreMeter';
import { DetailedScores, DetailedAnalysis } from '../../types';

// Haptic feedback for mobile - subtle vibration on key actions
const haptic = (type: 'light' | 'medium' | 'success' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = { light: 10, medium: 20, success: [10, 50, 20] };
    navigator.vibrate(patterns[type]);
  }
};

interface ResultPanelProps {
  currentResult: { scores: DetailedScores; analysis: DetailedAnalysis } | null;
  currentUpload: string | null;
  isAnalyzing: boolean;
  isLimitReached: boolean;
  remainingUses: number;
  user: any;
  selectedTitle: string;
  activeTags: string[];
  isSaving: boolean;
  userNote: string;
  onUserNoteChange: (value: string) => void;
  onStartAnalysis: () => void;
  onSelectTitle: (title: string) => void;
  onShowShareCard: () => void;
  onSaveRecord: () => void;
  onShowAuthModal: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  currentResult,
  currentUpload,
  isAnalyzing,
  isLimitReached,
  remainingUses,
  user,
  selectedTitle,
  activeTags,
  isSaving,
  userNote,
  onUserNoteChange,
  onStartAnalysis,
  onSelectTitle,
  onShowShareCard,
  onSaveRecord,
  onShowAuthModal,
}) => {
  const [isContextCollapsed, setIsContextCollapsed] = useState(false);

  return (
  <div className={`transition-all duration-1000 ease-in-out border-l border-white/10 overflow-y-auto bg-black shadow-[0_0_100px_rgba(0,0,0,1)] z-10 ${currentResult ? 'lg:w-[50%] w-full' : 'lg:w-[500px] w-full'}`}>
    <div className="p-8 sm:p-12 lg:p-16 space-y-16">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#D40000] rounded-full"></div>
          <span className="mono text-xs font-bold tracking-widest text-zinc-500">AI_POWERED</span>
        </div>
        <h2 className="text-5xl font-black tracking-tight leading-none">Lens Insight</h2>
      </header>

      {!currentResult ? (
        <div className="space-y-8">
          <p className="text-zinc-500 text-base leading-relaxed">
            上传你的作品，AI 会从构图、光影、叙事等角度给出专业反馈，帮助你发现进步空间。
          </p>

          {/* 每日限制提示 */}
          <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/5 rounded-sm">
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <Zap size={16} className={remainingUses > 0 ? 'text-[#D40000]' : 'text-zinc-700'} />
              <span>今日剩余</span>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-1 mr-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-zinc-500">已登录</span>
                </div>
              )}
              <span className="mono text-sm font-bold text-zinc-400">
                {remainingUses}/{user ? 20 : 5}
              </span>
            </div>
          </div>

          {/* Creator Context - 分析前显示 */}
          <div className="space-y-4 p-6 bg-zinc-900/30 border border-white/10 rounded-sm">
            <label className="mono text-xs text-[#D40000] tracking-widest uppercase font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-[#D40000] rounded-full animate-pulse"></div>
              Creator_Context
            </label>
            <p className="text-xs text-zinc-600 leading-relaxed">
              记录地点、心情和意图，让 AI 更好地理解你的作品
            </p>
            <textarea
              value={userNote}
              onChange={(e) => onUserNoteChange(e.target.value)}
              className="w-full bg-black/50 border border-white/10 p-5 mono text-sm focus:border-[#D40000]/50 focus:outline-none min-h-[100px] leading-relaxed transition-colors placeholder:text-zinc-700 rounded-sm"
              placeholder="📍 地点：...&#10;💭 心情：...&#10;🎯 意图：..."
            />
          </div>

          <button
            disabled={!currentUpload || isAnalyzing || isLimitReached}
            onClick={() => { haptic('medium'); onStartAnalysis(); }}
            className={`w-full py-10 mono text-sm font-bold tracking-[0.5em] transition-all uppercase shadow-lg group active:scale-[0.98] ${
              isLimitReached
                ? 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'border border-white/20 hover:bg-white hover:text-black disabled:opacity-20'
            }`}
          >
            {isLimitReached ? '今日次数已用完' : isAnalyzing ? '分析中...' : '开始分析'}
          </button>

          {isLimitReached && (
            <p className="text-center text-zinc-600 text-sm">
              {user ? (
                '今日次数已用完，明天再来'
              ) : (
                <>
                  今日次数已用完，
                  <button onClick={onShowAuthModal} className="text-[#D40000] hover:underline">
                    登录
                  </button>
                  {' '}可获得每日 20 次
                </>
              )}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-20 animate-in slide-in-from-right-12 duration-1000">
          {/* Collapsible Creator Context - 分析完成后可折叠 */}
          {userNote && (
            <div className="p-4 bg-zinc-900/30 border border-white/5 rounded-sm">
              <button
                onClick={() => setIsContextCollapsed(!isContextCollapsed)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-zinc-600 rounded-full"></div>
                  <span className="mono text-xs text-zinc-500 tracking-widest uppercase font-bold">
                    Creator_Context
                  </span>
                </div>
                {isContextCollapsed ? (
                  <ChevronDown size={16} className="text-zinc-600" />
                ) : (
                  <ChevronUp size={16} className="text-zinc-600" />
                )}
              </button>
              {!isContextCollapsed && (
                <p className="mt-3 text-sm text-zinc-500 leading-relaxed pl-4 border-l border-zinc-800">
                  {userNote}
                </p>
              )}
            </div>
          )}

          {/* Titles */}
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-[#D40000] mono text-xs font-bold uppercase tracking-widest">
                <TypeIcon size={18} /> Suggested_Titles
              </div>
              <div className="flex flex-wrap gap-3">
                {currentResult.analysis.suggestedTitles?.map((title) => (
                  <button
                    key={title}
                    onClick={() => { haptic('light'); onSelectTitle(title); }}
                    className={`px-6 py-4 border mono text-xs rounded-sm transition-all active:scale-95 ${
                      selectedTitle === title
                        ? 'bg-[#D40000] border-[#D40000] text-white shadow-[0_0_15px_rgba(212,0,0,0.3)]'
                        : 'border-white/10 text-zinc-500 hover:border-white/30 active:bg-white/5'
                    }`}
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-zinc-700 mono text-xs font-bold uppercase tracking-widest">
                <TagIcon size={18} /> Vision_Tags
              </div>
              <div className="flex flex-wrap gap-3">
                {currentResult.analysis.suggestedTags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-5 py-2 mono text-xs bg-zinc-900 border border-white/5 text-zinc-400 rounded-sm uppercase tracking-tighter"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-16">
            <ScoreMeter score={currentResult.scores.composition} label="构图" color="#D40000" />
            <ScoreMeter score={currentResult.scores.light} label="光影" color="#D40000" />
            <ScoreMeter score={currentResult.scores.content} label="叙事" color="#D40000" />
            <ScoreMeter score={currentResult.scores.completeness} label="表达" color="#D40000" />
          </div>

          <div className="pt-10 border-t border-white/10">
            <ScoreMeter score={currentResult.scores.overall} label="综合评分" color="#fff" />
          </div>

          {/* Analysis */}
          <div className="space-y-16 pt-10 border-t border-white/10">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-[#D40000] mono text-xs font-bold uppercase tracking-widest">
                <MessageSquare size={18} /> 专业诊断
              </div>
              <div className="space-y-4">
                {(currentResult.analysis?.diagnosis || '').split('\n').map((para, i) => (
                  <p
                    key={i}
                    className={`text-base text-zinc-200 leading-relaxed ${i > 0 ? 'text-zinc-400' : ''}`}
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>

            {/* Evolution Strategy */}
            <div className="p-8 bg-[#D40000]/10 border border-[#D40000]/20 rounded-sm space-y-4">
              <span className="mono text-sm text-[#D40000] font-bold tracking-[0.2em] block uppercase flex items-center gap-2">
                <Lightbulb size={16} /> 进化策略
              </span>
              <p className="text-lg text-zinc-100 leading-relaxed">
                {currentResult.analysis?.improvement || ''}
              </p>
            </div>

            {/* Story */}
            <div className="space-y-3 opacity-70">
              <div className="flex items-center gap-2 text-zinc-600 mono text-[10px] font-bold uppercase tracking-widest">
                <ImageIcon size={14} /> Story
              </div>
              <p className="text-sm text-zinc-500 italic leading-relaxed pl-4 border-l-2 border-zinc-800">
                "{currentResult.analysis?.storyNote || ''}"
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-8 border-t border-white/10">
            <button
              onClick={onShowShareCard}
              className="w-full py-4 border border-white/10 hover:border-white/30 bg-zinc-900/50 hover:bg-zinc-900 transition-all rounded-sm group flex items-center justify-center gap-3"
            >
              <Sparkles size={18} className="text-[#D40000] group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-zinc-300">生成点评卡片</span>
              <span className="text-xs text-zinc-600">可分享到社交媒体</span>
            </button>

            <button
              onClick={() => { haptic('success'); onSaveRecord(); }}
              disabled={isSaving}
              className={`w-full py-6 transition-all shadow-[0_20px_50px_rgba(212,0,0,0.5)] active:scale-[0.98] rounded-sm group ${
                isSaving ? 'bg-green-600' : 'bg-[#D40000] hover:bg-[#B30000]'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  {isSaving ? (
                    <>
                      <Check size={24} strokeWidth={3} className="animate-bounce" />
                      <span className="text-xl font-bold">保存成功！</span>
                    </>
                  ) : (
                    <>
                      <Check size={24} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                      <span className="text-xl font-bold">保存到成长档案</span>
                    </>
                  )}
                </div>
                <span className="text-xs text-white/60 font-normal">
                  {isSaving ? '正在保存...' : '记录这次拍摄，追踪你的进步轨迹'}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};
