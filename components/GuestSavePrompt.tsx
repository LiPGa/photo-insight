import { AlertCircle, Lock, X } from './ui/icons';

interface GuestSavePromptProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSave: () => void;
  onSessionSave: () => void;
}

export function GuestSavePrompt({
  isOpen,
  onClose,
  onLoginSave,
  onSessionSave,
}: GuestSavePromptProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md mx-4 p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
            <AlertCircle size={24} className="text-amber-500" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white tracking-wide">
            保存到成长档案
          </h2>
          <p className="text-zinc-400 text-sm mt-3 leading-relaxed">
            当前为游客模式，照片仅保存在本次会话中。
            <br />
            <span className="text-amber-500 font-medium">刷新页面后数据将丢失。</span>
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={onLoginSave}
            className="w-full bg-[#D40000] hover:bg-[#B30000] text-white font-bold py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Lock size={18} />
            登录保存
          </button>

          <button
            onClick={onSessionSave}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-3.5 px-4 rounded-lg border border-zinc-700 transition-colors"
          >
            仅本次保存
          </button>
        </div>

        {/* Additional info */}
        <p className="text-center text-zinc-600 text-xs mt-4">
          登录后可永久保存记录，并享受每日 20 次分析
        </p>
      </div>
    </div>
  );
}
