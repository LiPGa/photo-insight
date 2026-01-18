import React from 'react';
import { PhotoEntry } from '../../types';
import { TimelineList } from './TimelineList';
import { PhotoDetail } from './PhotoDetail';

interface ArchivesViewProps {
  entries: PhotoEntry[];
  selectedEntry: PhotoEntry | null;
  onSelectEntry: (entry: PhotoEntry | null) => void;
  isLoading?: boolean;
  onDeleteEntry?: (entryId: string) => Promise<void>;
}

export const ArchivesView: React.FC<ArchivesViewProps> = ({
  entries,
  selectedEntry,
  onSelectEntry,
  isLoading,
  onDeleteEntry,
}) => {
  const stats = React.useMemo(() => {
    if (!entries.length) return null;

    const totals = entries.reduce(
      (acc, entry) => ({
        composition: acc.composition + (entry.scores.composition || 0),
        light: acc.light + (entry.scores.light || 0),
        color: acc.color + (entry.scores.color || 0),
        technical: acc.technical + (entry.scores.technical || 0),
        expression: acc.expression + (entry.scores.expression || 0),
      }),
      { composition: 0, light: 0, color: 0, technical: 0, expression: 0 }
    );

    const count = entries.length;
    const averages = {
      composition: totals.composition / count,
      light: totals.light / count,
      color: totals.color / count,
      technical: totals.technical / count,
      expression: totals.expression / count,
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
      { key: 'Color', val: averages.color },
      { key: 'Technical', val: averages.technical },
      { key: 'Expression', val: averages.expression },
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
      'Color': '色彩',
      'Technical': '技术',
      'Expression': '表达'
    };

    return { 
      averages, 
      genreCN: genreMap[topGenre] || '日常',
      strengthCN: strengthMap[strength] || '构图'
    };
  }, [entries]);

  // Calculate additional stats for progress tracking
  const progressStats = React.useMemo(() => {
    if (!entries.length) return null;

    const overallScores = entries.map(e => e.scores.overall || 0);
    const avgScore = overallScores.reduce((a, b) => a + b, 0) / overallScores.length;
    const maxScore = Math.max(...overallScores);

    // Calculate trend (last 5 vs previous 5)
    const recent5 = overallScores.slice(0, Math.min(5, overallScores.length));
    const previous5 = overallScores.slice(Math.min(5, overallScores.length), Math.min(10, overallScores.length));

    let trend: 'up' | 'stable' | 'down' | null = null;
    if (previous5.length > 0) {
      const recentAvg = recent5.reduce((a, b) => a + b, 0) / recent5.length;
      const prevAvg = previous5.reduce((a, b) => a + b, 0) / previous5.length;
      if (recentAvg > prevAvg + 0.3) trend = 'up';
      else if (recentAvg < prevAvg - 0.3) trend = 'down';
      else trend = 'stable';
    }

    return { avgScore, maxScore, trend, totalPhotos: entries.length };
  }, [entries]);

  return (
    <div className="p-8 sm:p-20 lg:p-24 max-w-7xl animate-in fade-in duration-1000 mx-auto w-full">
      {selectedEntry ? (
        <PhotoDetail 
          entry={selectedEntry} 
          onBack={() => onSelectEntry(null)} 
          onDelete={onDeleteEntry}
        />
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

            {/* Enhanced Personal Summary Panel */}
            <div className="text-left sm:text-right w-full sm:w-auto flex flex-col items-start sm:items-end gap-8">
              {stats && progressStats ? (
                <>
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-3 gap-4 w-full sm:w-auto">
                    {/* Total Photos */}
                    <div className="bg-black/40 border border-zinc-800 px-4 py-3 rounded-sm">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Total</div>
                      <div className="text-2xl font-light text-[#D40000] mono">{progressStats.totalPhotos}</div>
                    </div>

                    {/* Average Score */}
                    <div className="bg-black/40 border border-zinc-800 px-4 py-3 rounded-sm">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Avg</div>
                      <div className="text-2xl font-light text-zinc-100 mono">{progressStats.avgScore.toFixed(1)}</div>
                    </div>

                    {/* Best Score */}
                    <div className="bg-black/40 border border-zinc-800 px-4 py-3 rounded-sm">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Best</div>
                      <div className="text-2xl font-light text-zinc-100 mono">{progressStats.maxScore.toFixed(1)}</div>
                    </div>
                  </div>

                  {/* Trend Indicator */}
                  {progressStats.trend && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-zinc-500 uppercase tracking-wider">Trend</span>
                      <div className={`px-2 py-1 rounded-sm mono ${
                        progressStats.trend === 'up' ? 'bg-[#D40000]/10 text-[#D40000] border border-[#D40000]/20' :
                        progressStats.trend === 'down' ? 'bg-zinc-800 text-zinc-500 border border-zinc-700' :
                        'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {progressStats.trend === 'up' ? '↑ 进步中' : progressStats.trend === 'down' ? '↓ 需调整' : '→ 稳定'}
                      </div>
                    </div>
                  )}

                  {/* Rule-based Insight */}
                  <div className="text-sm text-zinc-400 font-light max-w-xs leading-relaxed border-l-2 border-[#D40000] pl-4">
                    你的优势在于 <span className="text-[#D40000] font-medium">{stats.strengthCN}</span>，创作主要集中在 <span className="text-zinc-100 font-medium">{stats.genreCN}</span> 领域。
                  </div>

                  {/* Multi-dimension Summary (Graphical) */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full">
                     <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2 w-full justify-end">
                          <span className="text-[10px] uppercase tracking-widest text-zinc-600">Composition</span>
                          <span className="text-xs text-zinc-400 mono">{stats.averages.composition.toFixed(1)}</span>
                        </div>
                        <div className="w-32 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                          <div
                            className="h-full bg-gradient-to-r from-[#D40000] to-[#ff4444] transition-all duration-1000"
                            style={{ width: `${stats.averages.composition * 10}%` }}
                          />
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2 w-full justify-end">
                          <span className="text-[10px] uppercase tracking-widest text-zinc-600">Light</span>
                          <span className="text-xs text-zinc-400 mono">{stats.averages.light.toFixed(1)}</span>
                        </div>
                        <div className="w-32 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                          <div
                            className="h-full bg-gradient-to-r from-[#D40000] to-[#ff4444] transition-all duration-1000"
                            style={{ width: `${stats.averages.light * 10}%` }}
                          />
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2 w-full justify-end">
                          <span className="text-[10px] uppercase tracking-widest text-zinc-600">Color</span>
                          <span className="text-xs text-zinc-400 mono">{stats.averages.color.toFixed(1)}</span>
                        </div>
                        <div className="w-32 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                          <div
                            className="h-full bg-gradient-to-r from-[#D40000] to-[#ff4444] transition-all duration-1000"
                            style={{ width: `${stats.averages.color * 10}%` }}
                          />
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2 w-full justify-end">
                          <span className="text-[10px] uppercase tracking-widest text-zinc-600">Technical</span>
                          <span className="text-xs text-zinc-400 mono">{stats.averages.technical.toFixed(1)}</span>
                        </div>
                        <div className="w-32 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                          <div
                            className="h-full bg-gradient-to-r from-[#D40000] to-[#ff4444] transition-all duration-1000"
                            style={{ width: `${stats.averages.technical * 10}%` }}
                          />
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-1.5 col-span-2">
                        <div className="flex items-center gap-2 w-full justify-end">
                          <span className="text-[10px] uppercase tracking-widest text-zinc-600">Expression</span>
                          <span className="text-xs text-zinc-400 mono">{stats.averages.expression.toFixed(1)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                          <div
                            className="h-full bg-gradient-to-r from-[#D40000] to-[#ff4444] transition-all duration-1000"
                            style={{ width: `${stats.averages.expression * 10}%` }}
                          />
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
          <TimelineList entries={entries} onSelectEntry={onSelectEntry} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
};
