import React, { memo, useRef, useEffect, useState } from 'react';
import { PhotoEntry } from '../../types';
import { Star } from 'lucide-react';

interface ProgressSpineProps {
  entries: PhotoEntry[];
  onJumpToEntry: (entryId: string) => void;
  activeEntryId?: string;
}

// Sort entries chronologically (oldest first for left-to-right timeline)
const sortEntriesChronologically = (entries: PhotoEntry[]): PhotoEntry[] => {
  return [...entries].sort((a, b) => {
    const dateA = a.date || '0000.00.00';
    const dateB = b.date || '0000.00.00';
    return dateA.localeCompare(dateB, undefined, { numeric: true });
  });
};

export const ProgressSpine: React.FC<ProgressSpineProps> = memo(({
  entries,
  onJumpToEntry,
  activeEntryId
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Sort chronologically for visual progression
  const sortedEntries = sortEntriesChronologically(entries);

  // Find personal best
  const personalBestId = sortedEntries.reduce((bestId, entry) => {
    const currentBest = sortedEntries.find(e => e.id === bestId);
    if (!currentBest) return entry.id;
    return (entry.scores.overall || 0) > (currentBest.scores.overall || 0) ? entry.id : bestId;
  }, sortedEntries[0]?.id);

  // Auto-scroll to end (most recent) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [entries.length]);

  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  if (entries.length === 0) return null;

  // Calculate score range for Y positioning
  const scores = sortedEntries.map(e => e.scores.overall || 0);
  const minScore = Math.min(...scores, 4); // Floor at 4
  const maxScore = Math.max(...scores, 8); // Ceiling at 8
  const scoreRange = maxScore - minScore || 1;

  return (
    <div className="sticky top-0 z-20 bg-[#09090b]/95 backdrop-blur-xl border-b border-zinc-800/50 -mx-8 sm:-mx-20 lg:-mx-24 px-8 sm:px-20 lg:px-24 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Progress Journey</span>
          <span className="text-[10px] text-zinc-600 mono">{entries.length} photos</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-zinc-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D40000]" />
            <span>≥7.5</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-500" />
            <span>&lt;7.5</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Star size={10} className="text-amber-500 fill-amber-500" />
            <span>Best</span>
          </span>
        </div>
      </div>

      {/* Scrollable spine container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800 hover:scrollbar-thumb-zinc-700 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
      >
        <div
          className="relative h-24 min-w-full"
          style={{ width: Math.max(entries.length * 40, 300) }}
        >
          {/* Score grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-2">
            {[8, 7, 6, 5].map((score) => (
              <div key={score} className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-700 mono w-4">{score}</span>
                <div className="flex-1 h-px bg-zinc-800/50" />
              </div>
            ))}
          </div>

          {/* Trend line connecting dots */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: Math.max(entries.length * 40, 300), height: '100%' }}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D40000" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#D40000" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#D40000" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sortedEntries.map((entry, i) => {
                const x = 24 + i * 40;
                const score = entry.scores.overall || 5;
                const normalizedY = 1 - (score - minScore) / scoreRange;
                const y = 12 + normalizedY * 72; // 12px top padding, 72px usable height
                return `${x},${y}`;
              }).join(' ')}
            />
          </svg>

          {/* Entry dots */}
          <div className="absolute inset-0 flex items-start pl-5" style={{ paddingTop: 8 }}>
            {sortedEntries.map((entry, index) => {
              const score = entry.scores.overall || 5;
              const normalizedY = 1 - (score - minScore) / scoreRange;
              const yPosition = normalizedY * 72; // 72px usable height
              const isHighScore = score >= 7.5;
              const isPersonalBest = entry.id === personalBestId;
              const isActive = entry.id === activeEntryId;

              return (
                <button
                  key={entry.id}
                  onClick={() => onJumpToEntry(entry.id)}
                  className={`
                    absolute flex flex-col items-center transition-all duration-300 group
                    ${isDragging ? 'pointer-events-none' : ''}
                  `}
                  style={{
                    left: index * 40,
                    top: yPosition,
                  }}
                  title={`${entry.title || 'Untitled'} - ${score.toFixed(1)}`}
                >
                  {/* Personal best star */}
                  {isPersonalBest && (
                    <Star
                      size={10}
                      className="absolute -top-3 text-amber-500 fill-amber-500 animate-pulse"
                    />
                  )}

                  {/* Dot */}
                  <div
                    className={`
                      w-3 h-3 rounded-full transition-all duration-200
                      ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-[#09090b] scale-125' : ''}
                      ${isHighScore
                        ? 'bg-[#D40000] shadow-lg shadow-[#D40000]/30'
                        : 'bg-zinc-600 group-hover:bg-zinc-400'
                      }
                      group-hover:scale-150
                    `}
                  />

                  {/* Tooltip on hover */}
                  <div className="
                    absolute top-6 left-1/2 -translate-x-1/2
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200
                    bg-black/90 border border-zinc-800 rounded px-2 py-1
                    whitespace-nowrap pointer-events-none z-10
                    text-[10px]
                  ">
                    <div className="text-zinc-300 font-medium truncate max-w-[120px]">
                      {entry.title || 'Untitled'}
                    </div>
                    <div className={`mono ${isHighScore ? 'text-[#D40000]' : 'text-zinc-500'}`}>
                      {score.toFixed(1)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Time labels */}
          <div className="absolute bottom-0 left-5 right-0 flex">
            {sortedEntries
              .filter((_, i) => i % Math.ceil(entries.length / 6) === 0 || i === entries.length - 1)
              .map((entry, i, filtered) => {
                const originalIndex = sortedEntries.findIndex(e => e.id === entry.id);
                const dateParts = entry.date?.split('.') || [];
                const label = dateParts.length >= 2
                  ? `${dateParts[0].slice(2)}.${dateParts[1]}`
                  : '';

                return (
                  <span
                    key={entry.id}
                    className="text-[9px] text-zinc-600 mono absolute"
                    style={{ left: originalIndex * 40 - 8 }}
                  >
                    {label}
                  </span>
                );
              })}
          </div>
        </div>
      </div>

      {/* Scroll hint gradient */}
      <div className="absolute right-8 sm:right-20 lg:right-24 top-6 bottom-0 w-12 bg-gradient-to-l from-[#09090b] to-transparent pointer-events-none" />
    </div>
  );
});

ProgressSpine.displayName = 'ProgressSpine';
