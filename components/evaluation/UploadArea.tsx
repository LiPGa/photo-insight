import React from 'react';
import { Plus } from '../ui/icons';

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

interface UploadAreaProps {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onFileSelect }) => (
  <div className="relative w-full max-w-xl aspect-square flex items-center justify-center group">
    <UploadCoordinates />
    <label className="flex flex-col items-center gap-10 cursor-pointer text-zinc-700 hover:text-white transition-all z-10 w-full h-full justify-center relative">
      <div className="absolute top-8 right-10 flex items-center gap-3 mono text-[10px] tracking-widest font-bold">
        <div className="rec-dot"></div> STANDBY
      </div>
      <div className="w-24 h-24 border border-zinc-900 flex items-center justify-center group-hover:border-[#D40000] group-hover:bg-[#D40000]/5 transition-all duration-700 rounded-full bg-zinc-900/10">
        <Plus size={40} strokeWidth={1} className="group-hover:rotate-90 transition-transform duration-500" />
      </div>
      <div className="mono text-sm tracking-[0.6em] font-bold text-center pl-2 uppercase flex items-center">
        IMPORT_IMAGE <span className="cursor-blink"></span>
      </div>
      <input
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileSelect}
      />
    </label>
  </div>
);
