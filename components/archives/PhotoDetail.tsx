import React from 'react';
import { ArrowLeft, Camera, Lightbulb } from 'lucide-react';
import { PhotoEntry } from '../../types';
import { ScoreMeter } from '../ui/ScoreMeter';
import { Histogram } from '../ui/Histogram';

interface PhotoDetailProps {
  entry: PhotoEntry;
  onBack: () => void;
}

export const PhotoDetail: React.FC<PhotoDetailProps> = ({ entry, onBack }) => (
  <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <button
      onClick={onBack}
      className="group flex items-center gap-3 text-sm text-zinc-500 hover:text-white transition-colors pl-1"
    >
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
      </div>
      <span className="font-medium tracking-wide">Back to Timeline</span>
    </button>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
      {/* Image Column */}
      <div className="lg:col-span-7 space-y-12">
        <div className="relative group">
          <img
            src={entry.imageUrl}
            className="w-full shadow-2xl rounded-sm bg-zinc-900"
            alt=""
          />
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            {entry.tags?.map((t) => (
              <span
                key={t}
                className="bg-black/40 backdrop-blur-md text-white/90 text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-4 text-xs font-medium uppercase tracking-widest pt-8 border-t border-white/5">
          <div className="flex items-center gap-2 text-zinc-300">
            <Camera size={16} className="text-zinc-500" /> 
            <span>{entry.params?.camera}</span>
          </div>
          <div className="text-zinc-500">{entry.params?.aperture}</div>
          <div className="text-zinc-500">{entry.params?.shutterSpeed}</div>
          <div className="text-zinc-500">{entry.params?.iso}</div>
        </div>

        <div className="pt-4">
          <Histogram imageUrl={entry.imageUrl} className="w-full sm:w-full opacity-60 rounded-lg" />
        </div>
      </div>

      {/* Info Column */}
      <div className="lg:col-span-5 space-y-16">
        <header className="space-y-6">
          <div className="flex items-center gap-3 text-xs font-medium tracking-widest uppercase text-zinc-500">
            <span className="text-zinc-300">{entry.date}</span>
            <span className="w-px h-3 bg-zinc-800" />
            <span>#{entry.id.slice(0, 8)}</span>
          </div>
          
          <h2 className="text-5xl sm:text-6xl font-light text-zinc-100 leading-tight tracking-tight">
            {entry.title}
          </h2>
        </header>

        <div className="grid grid-cols-2 gap-x-8 gap-y-12">
          <ScoreMeter score={entry.scores.composition} label="Composition" color="#D40000" />
          <ScoreMeter score={entry.scores.light} label="Light" color="#D40000" />
          <ScoreMeter score={entry.scores.color} label="Color" color="#D40000" />
          <ScoreMeter score={entry.scores.technical} label="Technical" color="#D40000" />
          <div className="col-span-2">
            <ScoreMeter score={entry.scores.expression} label="Expression" color="#D40000" />
          </div>
        </div>

        <div className="space-y-12">
          <div className="space-y-6">
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold block">
              Analysis
            </span>
            <div className="space-y-4">
              {entry.analysis?.diagnosis.split('\n').map((para, i) => (
                <p
                  key={i}
                  className="text-lg text-zinc-300 font-light leading-relaxed"
                >
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Evolution Strategy */}
          {entry.analysis?.improvement && (
            <div className="p-6 bg-black/40 border-l-2 border-[#D40000] rounded-sm space-y-3">
              <span className="text-xs text-[#D40000] font-bold tracking-widest uppercase flex items-center gap-2">
                <Lightbulb size={14} /> Improvement Strategy
              </span>
              <p className="text-base text-zinc-200 leading-relaxed font-light">
                {entry.analysis.improvement}
              </p>
            </div>
          )}

          <div className="space-y-4 pt-8 border-t border-white/5">
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold block">
              Notes
            </span>
            <p className="text-base text-zinc-400 italic font-light leading-relaxed">
              "{entry.notes}"
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
