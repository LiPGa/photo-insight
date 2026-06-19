import React from 'react';
import { Instagram, Copy, Check } from '../ui/icons';
import { DetailedAnalysis, DetailedScores } from '../../types';

interface ExifData {
  camera: string;
  aperture: string;
  shutterSpeed: string;
  iso: string;
  focalLength: string;
  captureDate: string | null;
}

interface ReviewRailProps {
  currentExif: ExifData | null;
  currentResult: { scores: DetailedScores; analysis: DetailedAnalysis };
  selectedTitle: string;
  copied: boolean;
  onCopyInstagram: () => void;
}

const formatScore = (score?: number) => (typeof score === 'number' ? score.toFixed(1) : '--');

export const ReviewRail: React.FC<ReviewRailProps> = ({
  currentExif,
  currentResult,
  selectedTitle,
  copied,
  onCopyInstagram,
}) => {
  const { scores, analysis } = currentResult;
  const compactScores = [
    ['构图', scores.composition],
    ['光影', scores.light],
    ['表达', scores.expression],
    ['投稿', scores.competitionFit],
  ];

  const exifItems = currentExif
    ? [
        ['CAMERA', currentExif.camera],
        ['LENS', currentExif.focalLength],
        ['APERTURE', currentExif.aperture],
        ['SHUTTER', currentExif.shutterSpeed],
        ['ISO', currentExif.iso],
      ]
    : [];

  return (
    <aside className="border-t border-white/10 bg-black/50 px-5 py-5 sm:px-6 lg:px-8 lg:py-6">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mono text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D40000]" />
              Review_Dock
            </div>
            <h3 className="mt-2 truncate text-sm font-semibold text-zinc-200">
              {selectedTitle || analysis.suggestedTitles?.[0] || '评片结果'}
            </h3>
          </div>
          <div className="shrink-0 text-right">
            <div className="mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
              Overall
            </div>
            <div className="mono text-3xl font-black leading-none text-[#D40000]">
              {formatScore(scores.overall)}
            </div>
          </div>
        </div>

        {analysis.submissionAssessment?.verdict && (
          <div className="border border-[#D40000]/25 bg-[#D40000]/5 px-3 py-2 text-xs leading-relaxed text-[#D40000]">
            {analysis.submissionAssessment.verdict}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {compactScores
            .filter(([, score]) => score !== undefined)
            .map(([label, score]) => (
              <div key={label as string} className="border border-white/10 bg-zinc-950/70 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">{label}</span>
                  <span className="mono text-sm font-bold text-zinc-200">{formatScore(score as number)}</span>
                </div>
                <div className="mt-2 h-px bg-white/10">
                  <div
                    className="h-px bg-[#D40000]"
                    style={{ width: `${Math.min(Math.max((score as number) || 0, 0), 10) * 10}%` }}
                  />
                </div>
              </div>
            ))}
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-3 border-t border-white/10 pt-5 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-5">
          {exifItems.length ? (
            exifItems.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <span className="mono block text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-700">
                  {label}
                </span>
                <span className="mono mt-1 block truncate text-xs font-bold text-zinc-400">
                  {value || '--'}
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-2 mono text-[10px] uppercase tracking-[0.18em] text-zinc-700">
              Exif_Unavailable
            </div>
          )}
        </div>

        <button
          onClick={onCopyInstagram}
          className="flex w-full items-center justify-center gap-2 border border-white/10 bg-zinc-950/80 px-4 py-3 mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 transition-all hover:border-white/25 hover:text-white"
        >
          <Instagram size={14} className="text-[#D40000]" />
          {copied ? 'Copied' : 'Copy_Caption'}
          {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
        </button>
      </div>
    </aside>
  );
};
