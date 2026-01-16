import React, { memo, useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { PhotoEntry } from '../../types';
import { getThumbnailUrl, isCloudinaryUrl } from '../../services/cloudinaryService';
import { useThumbnail } from '../../hooks/useThumbnail';

// Skeleton loader for initial timeline loading
const TimelineSkeleton = () => (
  <div className="relative animate-pulse pl-4 sm:pl-0">
    <div className="absolute left-8 sm:left-[3.25rem] top-0 bottom-0 w-px bg-zinc-800" />
    {[1, 2].map((group) => (
      <div key={group} className="mb-20">
        <div className="flex items-center gap-6 mb-8 pl-0 sm:pl-8">
          <div className="w-2.5 h-2.5 bg-zinc-800 rounded-full ml-[1.15rem] sm:ml-0.5" />
          <div className="h-6 w-24 bg-zinc-900 rounded" />
        </div>
        <div className="pl-8 sm:pl-20 space-y-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="p-4 flex gap-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-zinc-900 rounded-xl flex-shrink-0" />
              <div className="flex-grow space-y-3 py-2">
                <div className="h-5 w-48 bg-zinc-900 rounded" />
                <div className="h-3 w-24 bg-zinc-900/50 rounded" />
                <div className="h-4 w-full max-w-md bg-zinc-900/30 rounded mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// 单个条目组件 - 使用 memo 避免不必要的重渲染
const TimelineEntry = memo(({
  entry,
  onSelect,
  isVisible
}: {
  entry: PhotoEntry;
  onSelect: () => void;
  isVisible: boolean;
}) => {
  // 如果是 Cloudinary URL，直接用 URL 变换生成缩略图（零延迟）
  const isCloudinary = isCloudinaryUrl(entry.imageUrl);
  const cloudinaryThumb = isCloudinary ? getThumbnailUrl(entry.imageUrl, 200) : null;

  // 非 Cloudinary URL（如旧的 base64）才用本地生成
  const { thumbnail: localThumb, loading } = useThumbnail(
    entry.id,
    entry.imageUrl,
    isVisible && !isCloudinary
  );

  const thumbnailSrc = cloudinaryThumb || localThumb;

  // Determine score color based on value
  const scoreColor = (entry.scores.overall || 0) >= 7.5
    ? 'text-[#D40000]'
    : (entry.scores.overall || 0) >= 6.0
    ? 'text-zinc-400'
    : 'text-zinc-500';

  return (
    <div
      onClick={onSelect}
      className="group flex gap-6 p-4 rounded-2xl hover:bg-white/5 transition-all duration-300 cursor-pointer border border-transparent hover:border-[#D40000]/10"
    >
      {/* Thumbnail */}
      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-zinc-900 rounded-xl overflow-hidden flex-shrink-0 shadow-lg shadow-black/20 ring-1 ring-white/5 group-hover:ring-[#D40000]/30 transition-all">
        {(!isCloudinary && loading) || !thumbnailSrc ? (
          <div className="w-full h-full bg-zinc-800 animate-pulse" />
        ) : (
          <img
            src={thumbnailSrc}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            alt=""
            loading="lazy"
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-grow min-w-0 flex flex-col justify-center py-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
              {entry.title || 'Untitled'}
            </span>
            <span className={`text-xl font-light ${scoreColor} group-hover:text-[#D40000] transition-colors mono`}>
              {entry.scores.overall?.toFixed(1)}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium tracking-wide uppercase">
            <span>{entry.date?.split('.')[2] || ''}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>{entry.params?.camera}</span>
          </div>
        </div>

        <p className="text-sm text-zinc-500 truncate mt-3 font-light leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
          {entry.analysis?.diagnosis.split('\n')[0].slice(0, 60) || entry.notes}
        </p>
      </div>

      <div className="flex items-center justify-center pl-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
        <ChevronRight size={20} className="text-[#D40000]" />
      </div>
    </div>
  );
});

TimelineEntry.displayName = 'TimelineEntry';

// 使用 Intersection Observer 的懒加载容器
const LazyEntry = memo(({
  entry,
  onSelect
}: {
  entry: PhotoEntry;
  onSelect: () => void;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // 提前 100px 开始加载
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <TimelineEntry entry={entry} onSelect={onSelect} isVisible={isVisible} />
    </div>
  );
});

LazyEntry.displayName = 'LazyEntry';

interface TimelineListProps {
  entries: PhotoEntry[];
  onSelectEntry: (entry: PhotoEntry) => void;
  isLoading?: boolean;
}

export const TimelineList: React.FC<TimelineListProps> = ({ entries, onSelectEntry, isLoading }) => {
  // Show skeleton while loading
  if (isLoading) {
    return <TimelineSkeleton />;
  }

  if (entries.length === 0) {
    return (
      <div className="py-20 text-center mono text-zinc-800 text-xs tracking-widest uppercase">
        No_Data_Stored
      </div>
    );
  }

  // Group entries by month
  const groupedEntries: Record<string, PhotoEntry[]> = {};
  entries.forEach((entry) => {
    const dateParts = entry.date?.split('.') || [];
    const monthKey = dateParts.length >= 2 ? `${dateParts[0]}.${dateParts[1]}` : '未知日期';
    if (!groupedEntries[monthKey]) groupedEntries[monthKey] = [];
    groupedEntries[monthKey].push(entry);
  });

  return (
    <div className="relative pl-4 sm:pl-0">
      {/* Timeline line */}
      <div className="absolute left-8 sm:left-[3.25rem] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#D40000]/20 to-transparent" />

      {Object.entries(groupedEntries)
        .sort(([monthA], [monthB]) => {
          if (monthA === '未知日期') return 1;
          if (monthB === '未知日期') return -1;
          return monthB.localeCompare(monthA, undefined, { numeric: true });
        })
        .map(([month, monthEntries]: [string, PhotoEntry[]]) => (
        <div key={month} className="mb-20 last:mb-0 relative">
          {/* Month header */}
          <div className="flex items-center gap-6 mb-8 pl-0 sm:pl-8 sticky top-4 z-10">
            <div className="w-2.5 h-2.5 bg-[#D40000] rounded-full ring-4 ring-[#09090b] relative z-10 ml-[1.15rem] sm:ml-0.5 shadow-lg shadow-[#D40000]/50" />
            <div className="flex items-baseline gap-3 backdrop-blur-md bg-[#09090b]/80 py-1 pr-4 rounded-full border border-white/5">
              <span className="text-xl font-light text-zinc-100 tracking-tight">{month}</span>
              <span className="text-xs text-zinc-600 font-medium uppercase tracking-wider">{monthEntries.length} Photos</span>
            </div>
          </div>

          {/* Month entries */}
          <div className="pl-8 sm:pl-20 space-y-2">
            {monthEntries.map((entry) => (
              <LazyEntry
                key={entry.id}
                entry={entry}
                onSelect={() => onSelectEntry(entry)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
