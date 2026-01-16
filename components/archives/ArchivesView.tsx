import React from 'react';
import { PhotoEntry } from '../../types';
import { TimelineList } from './TimelineList';
import { PhotoDetail } from './PhotoDetail';

interface ArchivesViewProps {
  entries: PhotoEntry[];
  selectedEntry: PhotoEntry | null;
  onSelectEntry: (entry: PhotoEntry | null) => void;
}

export const ArchivesView: React.FC<ArchivesViewProps> = ({
  entries,
  selectedEntry,
  onSelectEntry,
}) => {
  const stats = React.useMemo(() => {
    if (!entries.length) return null;

    const totals = entries.reduce(
      (acc, entry) => ({
        composition: acc.composition + (entry.scores.composition || 0),
        light: acc.light + (entry.scores.light || 0),
        content: acc.content + (entry.scores.content || 0),
        completeness: acc.completeness + (entry.scores.completeness || 0),
      }),
      { composition: 0, light: 0, content: 0, completeness: 0 }
    );

    const count = entries.length;
    const averages = {
      composition: totals.composition / count,
      light: totals.light / count,
      content: totals.content / count,
      completeness: totals.completeness / count,
    };

    // Genre detection
    const genreCounts: Record<string, number> = {};
    entries.forEach((entry) => {
      const tags = entry.tags || [];
      tags.forEach((tag) => {
        const t = tag.toLowerCase().replace('#', '');
        let genre = '';
        if (['portrait', '人像', 'face', 'model'].some((k) => t.includes(k))) genre = 'Portrait';
        else if (['landscape', '风景', 'nature', 'sky', 'mountain'].some((k) => t.includes(k))) genre = 'Landscape';
        else if (['architecture', '建筑', 'building', 'city', 'urban'].some((k) => t.includes(k))) genre = 'Architecture';
        else if (['street', '街头', 'road', 'snap', 'urban'].some((k) => t.includes(k))) genre = 'Street';
        else if (['still', '静物', 'object', 'food'].some((k) => t.includes(k))) genre = 'Still Life';

        if (genre) {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
      });
    });

    const topGenreEntry = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0];
    const topGenre = topGenreEntry ? topGenreEntry[0] : 'General';

    // Strength detection
    const scoresObj = [
      { key: 'Composition', val: averages.composition },
      { key: 'Light', val: averages.light },
      { key: 'Content', val: averages.content },
      { key: 'Completeness', val: averages.completeness },
    ];
    const strength = scoresObj.sort((a, b) => b.val - a.val)[0].key;

    // Mappings
    const genreMap: Record<string, string> = {
      'Portrait': '人像',
      'Landscape': '风光',
      'Architecture': '建筑',
      'Street': '街头',
      'Still Life': '静物',
      'General': '日常'
    };
    const strengthMap: Record<string, string> = {
      'Composition': '构图',
      'Light': '光影',
      'Content': '叙事',
      'Completeness': '完成度'
    };

    return { 
      averages, 
      genreCN: genreMap[topGenre] || '日常',
      strengthCN: strengthMap[strength] || '构图'
    };
  }, [entries]);

  return (
    <div className="p-8 sm:p-20 lg:p-24 max-w-7xl animate-in fade-in duration-1000 mx-auto w-full">
      {selectedEntry ? (
        <PhotoDetail entry={selectedEntry} onBack={() => onSelectEntry(null)} />
      ) : (
        <div className="space-y-24">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-12 pt-12">
            <div className="space-y-6">
              <h2 className="text-5xl sm:text-7xl font-light tracking-tight text-zinc-100 leading-none">
                Archives
              </h2>
              <p className="text-sm text-zinc-500 tracking-widest font-medium uppercase pl-1">
                Timeline Collection
              </p>
            </div>
            
            <div className="text-left sm:text-right w-full sm:w-auto flex flex-col items-start sm:items-end gap-6">
              {stats ? (
                <>
                  {/* Rule-based Sentence (Chinese) */}
                  <div className="text-sm text-zinc-400 font-light max-w-xs leading-relaxed">
                    你的优势在于 <span className="text-zinc-200 font-medium">{stats.strengthCN}</span>，创作主要集中在 <span className="text-zinc-200 font-medium">{stats.genreCN}</span> 领域。
                  </div>

                  {/* Multi-dimension Summary (Graphical) */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                     <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-600">Composition</span>
                        <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-zinc-300" style={{ width: `${stats.averages.composition * 10}%` }} />
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-600">Light</span>
                        <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-zinc-300" style={{ width: `${stats.averages.light * 10}%` }} />
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-600">Content</span>
                        <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-zinc-300" style={{ width: `${stats.averages.content * 10}%` }} />
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-600">Completeness</span>
                        <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-zinc-300" style={{ width: `${stats.averages.completeness * 10}%` }} />
                        </div>
                     </div>
                  </div>
                </>
              ) : (
                 <p className="text-zinc-500 text-sm">暂无分析数据。</p>
              )}
            </div>
          </header>

          {/* Timeline List */}
          <TimelineList entries={entries} onSelectEntry={onSelectEntry} />
        </div>
      )}
    </div>
  );
};
