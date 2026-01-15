
import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  X,
  Zap,
  Activity,
  ChevronRight,
  ArrowLeft,
  Share2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  MessageSquare,
  Info,
  Camera,
  Layers,
  Crosshair,
  Tag as TagIcon,
  Type as TypeIcon,
  Instagram,
  Copy,
  Check,
  Cpu,
  ArrowRight,
  AlertCircle,
  Lightbulb,
  Download,
  Sparkles
} from 'lucide-react';
import html2canvas from 'html2canvas';
import exifr from 'exifr';
import { NavTab, PhotoEntry, DetailedScores, DetailedAnalysis } from './types';
import { analyzePhoto } from './services/geminiService';
import { INITIAL_ENTRIES, PHOTO_TIPS } from './constants';

const AI_THINKING_STATES = [
  { main: "正在凝视这张照片...", sub: "试图理解画面的第一印象" },
  { main: "嗯，让我仔细看看构图", sub: "分析视觉元素的排布" },
  { main: "光影很有意思...", sub: "解读明暗关系与氛围" },
  { main: "我在思考这张照片想说什么", sub: "探索叙事与情感表达" },
  { main: "正在组织我的想法", sub: "整合技术分析与感性认知" },
  { main: "快好了，正在斟酌措辞", sub: "确保反馈诚实且有建设性" },
];

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const DAILY_LIMIT = 5;
const STORAGE_KEY = 'photopath_daily_usage';

const EXIF_LABELS: Record<string, string> = {
  camera: 'CAMERA',
  aperture: 'APERTURE',
  shutterSpeed: 'SHUTTER',
  iso: 'ISO',
  focalLength: 'FOCAL',
};

const Histogram: React.FC<{ imageUrl: string, className?: string }> = ({ imageUrl, className }) => {
  const [data, setData] = useState<number[]>([]);
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const size = 128;
      canvas.width = size; canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size).data;
      const bins = new Array(256).fill(0);
      for (let i = 0; i < imageData.length; i += 4) {
        const brightness = Math.round(0.299 * imageData[i] + 0.587 * imageData[i + 1] + 0.114 * imageData[i + 2]);
        bins[brightness]++;
      }
      const max = Math.max(...bins);
      setData(bins.map(v => (v / (max || 1)) * 100));
    };
  }, [imageUrl]);

  return (
    <div className={`h-16 bg-white/5 border border-white/10 flex items-end gap-[1px] relative overflow-hidden ${className}`}>
      {data.map((h, i) => (
        <div key={i} className="bg-white/20 flex-grow" style={{ height: `${h}%`, minWidth: '1px' }}></div>
      ))}
      <div className="absolute top-1 left-2 mono text-[10px] text-zinc-700 font-bold uppercase tracking-widest pointer-events-none">LUMINANCE_ANALYSIS</div>
    </div>
  );
};

const UploadCoordinates: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none opacity-40">
    <div className="coord-text left-2 top-2">100</div>
    <div className="coord-text left-2 bottom-8">00</div>
    <div className="coord-text left-8 bottom-2">0.0</div>
    <div className="coord-text right-8 bottom-2">1.0</div>
    <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/20"></div>
    <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/20"></div>
    <div className="absolute bottom-6 left-0 w-8 h-8 border-b border-l border-white/20"></div>
    <div className="absolute bottom-6 right-0 w-8 h-8 border-b border-r border-white/20"></div>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.EVALUATION);
  const [entries, setEntries] = useState<PhotoEntry[]>(INITIAL_ENTRIES);
  const [currentUpload, setCurrentUpload] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentTip, setCurrentTip] = useState(PHOTO_TIPS[0]);
  const [thinkingState, setThinkingState] = useState(AI_THINKING_STATES[0]);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [currentResult, setCurrentResult] = useState<{scores: DetailedScores, analysis: DetailedAnalysis} | null>(null);
  const [userNote, setUserNote] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<PhotoEntry | null>(null);
  const [currentExif, setCurrentExif] = useState<any>(null);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyUsage, setDailyUsage] = useState({ count: 0, date: '' });
  const [showShareCard, setShowShareCard] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // 加载每日使用次数
  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        setDailyUsage(data);
      } else {
        // 新的一天，重置计数
        const newUsage = { count: 0, date: today };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsage));
        setDailyUsage(newUsage);
      }
    } else {
      const newUsage = { count: 0, date: today };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsage));
      setDailyUsage(newUsage);
    }
  }, []);

  const remainingUses = DAILY_LIMIT - dailyUsage.count;
  const isLimitReached = remainingUses <= 0;

  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      setThinkingIndex(0);
      setThinkingState(AI_THINKING_STATES[0]);
      interval = setInterval(() => {
        setThinkingIndex(prev => {
          const next = (prev + 1) % AI_THINKING_STATES.length;
          setThinkingState(AI_THINKING_STATES[next]);
          return next;
        });
        setCurrentTip(PHOTO_TIPS[Math.floor(Math.random() * PHOTO_TIPS.length)]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError("文件过大 (上限 15MB)。请上传压缩后的 JPG/PNG。");
        return;
      }

      // Set default EXIF values first
      setCurrentExif({
        camera: "Unknown",
        aperture: "--",
        shutterSpeed: "--",
        iso: "--",
        focalLength: "--",
      });

      // Read file as base64
      const r = new FileReader();
      r.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setCurrentUpload(base64);
        setError(null);
        setCurrentResult(null);
      };
      r.readAsDataURL(file);

      // Extract EXIF data using exifr
      try {
        const exifData = await exifr.parse(file);
        if (exifData) {
          setCurrentExif({
            camera: exifData.Model || exifData.Make || "Unknown",
            aperture: exifData.FNumber ? `f/${exifData.FNumber}` : "--",
            shutterSpeed: exifData.ExposureTime ?
              (exifData.ExposureTime < 1 ? `1/${Math.round(1/exifData.ExposureTime)}s` : `${exifData.ExposureTime}s`) : "--",
            iso: exifData.ISO ? `ISO ${exifData.ISO}` : "--",
            focalLength: exifData.FocalLength ? `${Math.round(exifData.FocalLength)}mm` : "--",
          });
        }
      } catch (e) {
        console.warn("EXIF extraction failed:", e);
      }
    }
  };

  const startAnalysis = async () => {
    if (!currentUpload) return;
    if (isLimitReached) {
      setError("今日免费次数已用完，明天再来吧！");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzePhoto(currentUpload, { exif: currentExif, creatorContext: userNote });
      setCurrentResult(result);
      if (result.analysis.suggestedTitles?.length) setSelectedTitle(result.analysis.suggestedTitles[0]);
      if (result.analysis.suggestedTags?.length) setActiveTags(result.analysis.suggestedTags);

      // 更新使用次数
      const today = new Date().toDateString();
      const newUsage = { count: dailyUsage.count + 1, date: today };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsage));
      setDailyUsage(newUsage);
    } catch (err: any) {
      console.error(err);
      setError("分析终端响应异常。请重试。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyIns = () => {
    if (!currentResult) return;
    const text = `${currentResult.analysis.instagramCaption}\n\n${currentResult.analysis.instagramHashtags?.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveRecord = () => {
    if (!currentUpload || !currentResult) return;
    const newEntry: PhotoEntry = {
      id: `SEQ_${Date.now().toString().slice(-6)}`,
      title: selectedTitle || `UNTITLED`,
      imageUrl: currentUpload,
      date: new Date().toLocaleDateString('zh-CN').replace(/\//g, '.'),
      location: "STATION_ALPHA",
      notes: userNote || "No creator notes.",
      tags: activeTags,
      params: { 
        camera: currentExif?.camera, 
        aperture: currentExif?.aperture, 
        iso: currentExif?.iso, 
        shutterSpeed: currentExif?.shutterSpeed 
      },
      scores: currentResult.scores,
      analysis: currentResult.analysis
    };
    setEntries([newEntry, ...entries]);
    setCurrentUpload(null);
    setCurrentResult(null);
    setCurrentExif(null);
    setUserNote('');
    setSelectedTitle('');
    setActiveTags([]);
    setActiveTab(NavTab.PATH);
  };

  // 生成分享卡片
  const generateShareCard = async () => {
    if (!shareCardRef.current) return;
    setIsGeneratingCard(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#000',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `photopath_${selectedTitle || 'insight'}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('生成卡片失败:', err);
      setError('生成卡片失败，请重试');
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const ScoreMeter = ({ score, label, color = "#fff", small = false }: { score: number | undefined, label: string, color?: string, small?: boolean }) => (
    <div className={`space-y-2 w-full ${small ? 'opacity-80' : ''}`}>
      <div className="flex justify-between items-end mono text-xs tracking-widest font-bold">
        <span className="text-zinc-600 uppercase">{label}</span>
        <span className="text-sm font-black" style={{ color }}>{score ?? '--'}</span>
      </div>
      <div className="pixel-meter-bar"><div className="pixel-meter-fill" style={{ width: `${score ?? 0}%`, backgroundColor: color }}></div></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100 selection:bg-[#D40000] selection:text-white pb-24 sm:pb-0">
      {/* Sidebar / Bottom Nav */}
      <nav className="fixed left-0 top-0 h-full w-20 border-r border-white/5 flex flex-col items-center py-10 gap-16 z-50 bg-black mobile-bottom-nav">
        <div className="w-10 h-10 bg-[#D40000] flex items-center justify-center font-black text-xs hidden sm:flex cursor-default shadow-[0_0_15px_rgba(212,0,0,0.3)]">AP</div>
        <div className="flex flex-col sm:gap-10 items-center justify-around w-full sm:w-auto h-full sm:h-auto">
          <button 
            onClick={() => { setSelectedEntry(null); setActiveTab(NavTab.EVALUATION); }} 
            className={`p-4 rounded-full transition-all ${activeTab === NavTab.EVALUATION && !selectedEntry ? 'text-white border border-white/20 bg-white/5' : 'text-zinc-700 hover:text-white'}`}
          >
            <Zap size={26} strokeWidth={1.5} />
          </button>
          <button 
            onClick={() => { setSelectedEntry(null); setActiveTab(NavTab.PATH); }} 
            className={`p-4 rounded-full transition-all ${activeTab === NavTab.PATH || selectedEntry ? 'text-white border border-white/20 bg-white/5' : 'text-zinc-700 hover:text-white'}`}
          >
            <Activity size={26} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      <main className="pl-0 sm:pl-20 min-h-screen flex flex-col main-content overflow-x-hidden">
        {activeTab === NavTab.EVALUATION && !selectedEntry && (
          <div className="flex flex-col lg:flex-row min-h-screen relative">
            {/* Left Area: Display & Technical */}
            <div className={`flex flex-col bg-[#050505] transition-all duration-1000 ease-in-out ${currentResult ? 'lg:flex-grow-0 lg:w-[50%]' : 'flex-grow'}`}>
              <div className="flex-grow flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden min-h-[50vh]">
                {error && (
                  <div className="absolute top-10 z-30 flex items-center gap-2 bg-[#D40000] text-white px-4 py-2 rounded-sm mono text-[10px] animate-in slide-in-from-top-4">
                    <AlertCircle size={14}/> {error}
                    <button onClick={() => setError(null)} className="ml-4 hover:opacity-50"><X size={12}/></button>
                  </div>
                )}
                
                {currentUpload ? (
                  <div className={`relative max-w-full flex flex-col items-center transition-all duration-1000 ${currentResult ? 'scale-[0.92] lg:-translate-x-6 opacity-100' : 'scale-100'}`}>
                    <div className="relative group">
                      {isAnalyzing && (
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
                               {AI_THINKING_STATES.map((_, i) => (
                                 <div
                                   key={i}
                                   className={`h-1 rounded-full transition-all duration-300 ${i <= thinkingIndex ? 'w-6 bg-[#D40000]' : 'w-2 bg-zinc-800'}`}
                                 />
                               ))}
                             </div>

                             {/* 小贴士 - 更小更低调 */}
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
                      )}
                      <img src={currentUpload} className="max-w-full max-h-[50vh] sm:max-h-[60vh] object-contain shadow-[0_40px_100px_rgba(0,0,0,0.9)] border border-white/10 p-1 bg-zinc-900" alt="Preview" />
                      {!isAnalyzing && <button onClick={() => {setCurrentUpload(null); setCurrentResult(null); setCurrentExif(null); setError(null);}} className="absolute -top-4 -right-4 bg-white text-black p-2 hover:bg-[#D40000] hover:text-white transition-all shadow-2xl z-30 rounded-sm"><X size={16}/></button>}
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full max-w-xl aspect-square flex items-center justify-center group">
                    <UploadCoordinates />
                    <label className="flex flex-col items-center gap-10 cursor-pointer text-zinc-700 hover:text-white transition-all z-10 w-full h-full justify-center relative">
                      <div className="absolute top-8 right-10 flex items-center gap-3 mono text-[10px] tracking-widest font-bold"><div className="rec-dot"></div> STANDBY</div>
                      <div className="w-24 h-24 border border-zinc-900 flex items-center justify-center group-hover:border-[#D40000] group-hover:bg-[#D40000]/5 transition-all duration-700 rounded-full bg-zinc-900/10"><Plus size={40} strokeWidth={1} className="group-hover:rotate-90 transition-transform duration-500" /></div>
                      <div className="mono text-sm tracking-[0.6em] font-bold text-center pl-2 uppercase flex items-center">IMPORT_IMAGE <span className="cursor-blink"></span></div>
                      <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} />
                    </label>
                  </div>
                )}
              </div>

              {/* TECHNICAL TRAY */}
              <div className={`border-t border-white/10 bg-black/60 backdrop-blur-md transition-all duration-700 ${currentResult ? 'opacity-100' : 'opacity-80'}`}>
                <div className="p-8 sm:p-10 lg:p-12 grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
                  <div className="md:col-span-5 space-y-8">
                    <header className="flex items-center gap-3 mono text-xs text-[#D40000] font-bold tracking-widest uppercase"><Cpu size={14}/> EXIF_METADATA</header>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {currentExif ? (
                        Object.entries(currentExif).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <span className="mono text-[10px] text-zinc-700 uppercase block tracking-wider font-bold">{EXIF_LABELS[key] || key}</span>
                            <span className="mono text-sm text-zinc-300 font-bold truncate block">{value as string}</span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 mono text-xs text-zinc-900 italic uppercase">Awaiting_Data...</div>
                      )}
                    </div>
                    {currentUpload && (
                      <div className="pt-4 border-t border-white/5">
                         <Histogram imageUrl={currentUpload} className="w-full" />
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-7 md:border-l border-white/5 md:pl-10 space-y-8">
                     <div className="space-y-4 p-6 bg-zinc-900/30 border border-white/10 rounded-sm">
                        <label className="mono text-xs text-[#D40000] tracking-widest uppercase font-bold flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#D40000] rounded-full animate-pulse"></div>
                          Creator_Context
                        </label>
                        <p className="text-xs text-zinc-600 leading-relaxed">记录拍摄时的地点、心情和创作意图，帮助 AI 更好地理解你的作品</p>
                        <textarea
                          value={userNote}
                          onChange={(e) => setUserNote(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 p-5 mono text-sm focus:border-[#D40000]/50 focus:outline-none min-h-[100px] leading-relaxed transition-colors placeholder:text-zinc-700 rounded-sm"
                          placeholder="📍 地点：上海外滩&#10;💭 心情：黄昏时分的宁静...&#10;🎯 意图：想捕捉城市与自然光的对话"
                        />
                     </div>
                     
                     {currentResult && (
                       <div className="p-8 bg-zinc-900/30 border border-white/5 rounded-sm space-y-6 animate-in fade-in duration-1000 shadow-2xl">
                          <div className="flex items-center justify-between border-b border-white/5 pb-4">
                             <div className="flex items-center gap-3 text-zinc-600 mono text-xs font-bold uppercase tracking-widest"><Instagram size={16}/> Instagram_Kit</div>
                             <button onClick={copyIns} className="text-zinc-600 hover:text-white transition-all flex items-center gap-2 mono text-xs">
                                {copied ? 'DONE' : 'COPY'} {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                             </button>
                          </div>
                          <div className="space-y-4">
                            <p className="text-sm text-zinc-300 italic font-light leading-relaxed">"{currentResult.analysis.instagramCaption}"</p>
                            <div className="flex flex-wrap gap-2 pt-2">
                              {currentResult.analysis.instagramHashtags?.map(tag => (
                                <span key={tag} className="text-xs text-[#D40000] mono font-medium">{tag.startsWith('#') ? tag : `#${tag}`}</span>
                              ))}
                            </div>
                          </div>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Analysis Result */}
            <div className={`transition-all duration-1000 ease-in-out border-l border-white/10 overflow-y-auto bg-black shadow-[0_0_100px_rgba(0,0,0,1)] z-10 ${currentResult ? 'lg:w-[50%] w-full' : 'lg:w-[460px] w-full'}`}>
              <div className="p-8 sm:p-12 lg:p-16 space-y-16">
                <header className="space-y-4">
                  <div className="flex items-center gap-3"><div className="w-2 h-2 bg-[#D40000] rounded-full"></div><span className="mono text-xs font-bold tracking-widest text-zinc-500">AI_POWERED</span></div>
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
                      <div className="flex items-center gap-1">
                        {[...Array(DAILY_LIMIT)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-colors ${i < remainingUses ? 'bg-[#D40000]' : 'bg-zinc-800'}`}
                          />
                        ))}
                        <span className="ml-2 mono text-sm font-bold text-zinc-400">{remainingUses}/{DAILY_LIMIT}</span>
                      </div>
                    </div>

                    <button
                      disabled={!currentUpload || isAnalyzing || isLimitReached}
                      onClick={startAnalysis}
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
                        明天再来，或 <span className="text-[#D40000] cursor-pointer hover:underline">登录</span> 解锁无限次数
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-20 animate-in slide-in-from-right-12 duration-1000">
                    <div className="space-y-12">
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 text-[#D40000] mono text-xs font-bold uppercase tracking-widest"><TypeIcon size={18}/> Suggested_Titles</div>
                        <div className="flex flex-wrap gap-3">
                          {currentResult.analysis.suggestedTitles?.map(title => (
                            <button 
                              key={title} 
                              onClick={() => setSelectedTitle(title)} 
                              className={`px-6 py-4 border mono text-xs rounded-sm transition-all ${selectedTitle === title ? 'bg-[#D40000] border-[#D40000] text-white shadow-[0_0_15px_rgba(212,0,0,0.3)]' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}
                            >
                              {title}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-3 text-zinc-700 mono text-xs font-bold uppercase tracking-widest"><TagIcon size={18}/> Vision_Tags</div>
                        <div className="flex flex-wrap gap-3">
                          {currentResult.analysis.suggestedTags?.map(tag => (
                            <span key={tag} className="px-5 py-2 mono text-xs bg-zinc-900 border border-white/5 text-zinc-400 rounded-sm uppercase tracking-tighter">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-12 gap-y-16">
                      <ScoreMeter score={currentResult.scores.composition} label="构图" color="#D40000" />
                      <ScoreMeter score={currentResult.scores.light} label="光影" color="#D40000" />
                      <ScoreMeter score={currentResult.scores.content} label="叙事" color="#D40000" />
                      <ScoreMeter score={currentResult.scores.completeness} label="表达" color="#D40000" />
                    </div>

                    <div className="pt-10 border-t border-white/10">
                      <ScoreMeter score={currentResult.scores.overall} label="综合评分" color="#fff" />
                    </div>

                    <div className="space-y-16 pt-10 border-t border-white/10">
                      {/* Diagnosis - 缩小字体 */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 text-[#D40000] mono text-xs font-bold uppercase tracking-widest"><MessageSquare size={18}/> 专业诊断</div>
                        <div className="space-y-4">
                          {currentResult.analysis.diagnosis.split('\n').map((para, i) => (
                            <p key={i} className={`text-base text-zinc-200 leading-relaxed ${i > 0 ? 'text-zinc-400' : ''}`}>
                              {para}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Evolution Strategy - 更突出 */}
                      <div className="p-8 bg-[#D40000]/10 border border-[#D40000]/20 rounded-sm space-y-4">
                         <span className="mono text-sm text-[#D40000] font-bold tracking-[0.2em] block uppercase flex items-center gap-2"><Lightbulb size={16}/> 进化策略</span>
                         <p className="text-lg text-zinc-100 leading-relaxed">{currentResult.analysis.improvement}</p>
                      </div>

                      {/* Story & Intent - 缩小保留 */}
                      <div className="space-y-3 opacity-70">
                        <div className="flex items-center gap-2 text-zinc-600 mono text-[10px] font-bold uppercase tracking-widest"><ImageIcon size={14}/> Story</div>
                        <p className="text-sm text-zinc-500 italic leading-relaxed pl-4 border-l-2 border-zinc-800">"{currentResult.analysis.storyNote}"</p>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="space-y-4 pt-8 border-t border-white/10">
                      {/* 生成分享卡片按钮 */}
                      <button
                        onClick={() => setShowShareCard(true)}
                        className="w-full py-4 border border-white/10 hover:border-white/30 bg-zinc-900/50 hover:bg-zinc-900 transition-all rounded-sm group flex items-center justify-center gap-3"
                      >
                        <Sparkles size={18} className="text-[#D40000] group-hover:scale-110 transition-transform"/>
                        <span className="text-sm font-medium text-zinc-300">生成点评卡片</span>
                        <span className="text-xs text-zinc-600">可分享到社交媒体</span>
                      </button>

                      {/* 保存按钮 */}
                      <button onClick={saveRecord} className="w-full bg-[#D40000] py-6 hover:bg-[#B30000] transition-all shadow-[0_20px_50px_rgba(212,0,0,0.5)] active:scale-[0.98] rounded-sm group">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-3">
                            <Check size={24} strokeWidth={3} className="group-hover:scale-110 transition-transform"/>
                            <span className="text-xl font-bold">保存到成长档案</span>
                          </div>
                          <span className="text-xs text-white/60 font-normal">记录这次拍摄，追踪你的进步轨迹</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Archives View */}
        {(activeTab === NavTab.PATH || selectedEntry) && (
          <div className="p-8 sm:p-20 lg:p-24 max-w-7xl animate-in fade-in duration-1000 mx-auto w-full">
            {selectedEntry ? (
              <div className="space-y-24">
                <button 
                  onClick={() => setSelectedEntry(null)} 
                  className="flex items-center gap-4 mono text-sm text-zinc-600 hover:text-white uppercase tracking-[0.3em] transition-all group"
                >
                  <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform"/> BACK_TO_LIST
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
                  <div className="lg:col-span-7 space-y-16">
                    <div className="relative">
                      <img src={selectedEntry.imageUrl} className="w-full shadow-2xl border border-white/10 p-1 bg-zinc-900" alt="" />
                      <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                        {selectedEntry.tags?.map(t => (
                          <span key={t} className="bg-black/60 backdrop-blur-md text-white mono text-xs px-3 py-1.5 rounded-sm uppercase border border-white/10">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-8 mono text-sm text-[#D40000] uppercase font-bold border-t border-white/5 pt-12">
                      <div className="flex items-center gap-3 text-zinc-200"><Camera size={22} className="text-[#D40000]"/> {selectedEntry.params.camera}</div>
                      <div className="text-zinc-500">{selectedEntry.params.aperture}</div>
                      <div className="text-zinc-500">{selectedEntry.params.shutterSpeed}</div>
                      <div className="text-zinc-500">{selectedEntry.params.iso}</div>
                    </div>
                    <Histogram imageUrl={selectedEntry.imageUrl} className="w-full sm:w-96" />
                  </div>
                  <div className="lg:col-span-5 space-y-20">
                    <header className="space-y-8">
                      <div className="mono text-sm text-[#D40000] font-bold tracking-widest uppercase flex items-center gap-4">
                        <div className="w-8 h-[1px] bg-[#D40000]"></div> {selectedEntry.date}
                      </div>
                      <h2 className="text-8xl font-black italic uppercase leading-none tracking-tighter">{selectedEntry.title}</h2>
                      <div className="mono text-xs text-zinc-800 font-bold uppercase tracking-widest">{selectedEntry.id}</div>
                    </header>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-16">
                      <ScoreMeter score={selectedEntry.scores.composition} label="构图" color="#D40000" />
                      <ScoreMeter score={selectedEntry.scores.light} label="光影" color="#D40000" />
                      <ScoreMeter score={selectedEntry.scores.content} label="叙事" color="#D40000" />
                      <ScoreMeter score={selectedEntry.scores.completeness} label="表达" color="#D40000" />
                    </div>
                    <div className="p-12 border border-white/5 space-y-16 bg-zinc-900/10 backdrop-blur-sm shadow-2xl">
                      <div className="space-y-10">
                        <span className="mono text-xs text-zinc-700 uppercase tracking-widest font-bold block">Audit Conclusion</span>
                        <div className="space-y-6">
                           {selectedEntry.analysis?.diagnosis.split('\n').map((para, i) => (
                             <p key={i} className={`text-2xl text-zinc-50 font-medium leading-snug font-serif ${i > 0 ? 'text-zinc-400 text-xl border-t border-white/5 pt-6' : ''}`}>
                               {para}
                             </p>
                           ))}
                        </div>
                      </div>
                      <div className="space-y-10 pt-10 border-t border-white/5">
                        <span className="mono text-xs text-zinc-700 uppercase tracking-widest font-bold block">Creator Notes</span>
                        <p className="text-xl text-zinc-400 italic font-light leading-relaxed">"{selectedEntry.notes}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-32">
                <header className="border-b border-white/10 pb-16 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-16">
                  <div className="space-y-8">
                    <h2 className="text-9xl font-black italic tracking-tighter uppercase leading-none">Archives</h2>
                    <p className="mono text-sm text-zinc-700 tracking-[0.8em] font-bold uppercase pl-2">Evolution_Database</p>
                  </div>
                  <div className="mono text-left sm:text-right w-full sm:w-auto p-8 border-l sm:border-l-0 sm:border-r border-white/10">
                    <p className="text-xs text-zinc-800 uppercase tracking-[0.4em] mb-4 font-bold">AVG_AUDIT_SCORE</p>
                    <p className="text-9xl font-black text-[#D40000] tracking-tighter leading-none">
                      {entries.length ? (entries.reduce((a, b) => a + (b.scores.overall || 0), 0) / entries.length).toFixed(1) : '0.0'}
                    </p>
                  </div>
                </header>
                <div className="space-y-6">
                  {entries.length === 0 ? (
                    <div className="py-20 text-center mono text-zinc-800 text-xs tracking-widest uppercase">No_Data_Stored</div>
                  ) : (
                    entries.map(entry => (
                      <div 
                        key={entry.id} 
                        onClick={() => setSelectedEntry(entry)} 
                        className="bg-black border-y border-white/5 py-16 flex flex-col sm:flex-row items-start sm:items-center gap-16 hover:bg-[#0a0a0a] transition-all group cursor-pointer active:scale-[0.99]"
                      >
                        <div className="w-full sm:w-80 h-48 bg-zinc-900 border border-white/10 flex-shrink-0 overflow-hidden relative">
                          <img src={entry.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                          <div className="absolute inset-0 bg-black/50 group-hover:bg-transparent transition-colors duration-700"></div>
                        </div>
                        <div className="flex-grow grid grid-cols-1 sm:grid-cols-12 gap-12 items-center w-full">
                          <div className="sm:col-span-6 space-y-6">
                            <span className="mono text-sm font-bold text-zinc-700 uppercase group-hover:text-[#D40000] transition-colors">{entry.title || entry.id} // {entry.date}</span>
                            <p className="text-xl text-zinc-400 truncate italic font-medium">"{entry.analysis?.diagnosis.split('\n')[0] || entry.notes}"</p>
                          </div>
                          <div className="sm:col-span-4 flex gap-16">
                            <ScoreMeter score={entry.scores.composition} label="构图" small />
                            <ScoreMeter score={entry.scores.content} label="叙事" small />
                          </div>
                          <div className="sm:col-span-2 text-right hidden sm:block">
                            <span className="mono text-8xl font-black italic group-hover:text-white transition-all duration-500">{entry.scores.overall}</span>
                          </div>
                        </div>
                        <ChevronRight size={48} className="text-zinc-900 group-hover:text-white transition-all transform group-hover:translate-x-4" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 分享卡片弹窗 */}
      {showShareCard && currentResult && currentUpload && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-auto">
          <div className="relative max-w-md w-full">
            {/* 关闭按钮 */}
            <button
              onClick={() => setShowShareCard(false)}
              className="absolute -top-12 right-0 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            {/* 卡片内容 */}
            <div
              ref={shareCardRef}
              className="bg-[#0a0a0a] rounded-lg overflow-hidden"
              style={{ fontFamily: "'Inter', 'PingFang SC', sans-serif" }}
            >
              {/* 头部 */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#D40000] rounded flex items-center justify-center text-[10px] font-black">AP</div>
                  <span className="text-sm font-medium text-zinc-400">PhotoPath</span>
                </div>
                <span className="text-xs text-zinc-600 mono">Lens Insight</span>
              </div>

              {/* 照片 */}
              <div className="px-4 pt-4">
                <img
                  src={currentUpload}
                  className="w-full aspect-[4/3] object-cover rounded-lg"
                  alt=""
                  crossOrigin="anonymous"
                />
              </div>

              {/* 标题和标签 */}
              <div className="px-6 pt-5 pb-4 border-b border-white/5">
                <h3 className="text-xl font-bold text-white mb-2">{selectedTitle || '未命名作品'}</h3>
                <div className="flex flex-wrap gap-2">
                  {activeTags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded">{tag}</span>
                  ))}
                </div>
              </div>

              {/* 评分 */}
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: '构图', score: currentResult.scores.composition },
                    { label: '光影', score: currentResult.scores.light },
                    { label: '叙事', score: currentResult.scores.content },
                    { label: '表达', score: currentResult.scores.completeness },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#D40000] rounded-full" style={{ width: `${item.score}%` }}/>
                        </div>
                        <span className="text-xs font-bold text-zinc-300 w-6 text-right">{item.score}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 综合评分 */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-sm font-medium text-zinc-400">综合评分</span>
                  <span className="text-3xl font-black text-[#D40000]">{currentResult.scores.overall}</span>
                </div>
              </div>

              {/* 诊断摘要 */}
              <div className="px-6 pb-5">
                <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">
                  {currentResult.analysis.diagnosis.split('\n')[0]}
                </p>
              </div>

              {/* 进化策略 */}
              <div className="mx-6 mb-5 p-4 bg-[#D40000]/10 border border-[#D40000]/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={14} className="text-[#D40000]"/>
                  <span className="text-xs font-bold text-[#D40000]">进化策略</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed line-clamp-2">
                  {currentResult.analysis.improvement}
                </p>
              </div>

              {/* 底部 */}
              <div className="px-6 py-4 bg-zinc-900/50 flex items-center justify-between">
                <span className="text-[10px] text-zinc-600 mono">AI 摄影点评 · {new Date().toLocaleDateString('zh-CN')}</span>
                <span className="text-[10px] text-zinc-600">photopath.app</span>
              </div>
            </div>

            {/* 下载按钮 */}
            <button
              onClick={generateShareCard}
              disabled={isGeneratingCard}
              className="mt-4 w-full py-4 bg-[#D40000] hover:bg-[#B30000] disabled:bg-zinc-800 transition-all rounded-lg flex items-center justify-center gap-3"
            >
              {isGeneratingCard ? (
                <span className="text-sm">生成中...</span>
              ) : (
                <>
                  <Download size={18}/>
                  <span className="text-sm font-medium">保存卡片到相册</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
