import React from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface UserStatusBarProps {
  onLoginClick: () => void;
}

export const UserStatusBar: React.FC<UserStatusBarProps> = ({ onLoginClick }) => {
  const { user, signOut } = useAuth();

  return (
    <div className="fixed top-3 sm:top-4 right-3 sm:right-4 z-40 flex items-center gap-3">
      {user ? (
        <div className="flex items-center gap-2 sm:gap-3 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-full pl-3 sm:pl-4 pr-1.5 sm:pr-2 py-1.5">
          <span className="text-[10px] sm:text-xs text-zinc-400 hidden sm:block max-w-[100px] truncate">
            {user.email?.split('@')[0]}
          </span>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-zinc-500 active:text-white transition-colors bg-zinc-800 active:bg-zinc-700 px-2 sm:px-3 py-1.5 rounded-full active:scale-95"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">退出</span>
          </button>
        </div>
      ) : (
        <button
          onClick={onLoginClick}
          className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900/90 backdrop-blur-md border border-white/10 active:border-[#D40000]/50 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-zinc-400 active:text-white transition-all active:scale-95"
        >
          <User size={14} className="sm:w-4 sm:h-4" />
          <span>登录</span>
        </button>
      )}
    </div>
  );
};
