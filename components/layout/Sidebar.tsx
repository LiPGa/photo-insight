import React from 'react';
import { Zap, Activity, User, LogOut, Lightbulb } from 'lucide-react';
import { NavTab } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: NavTab;
  selectedEntry: boolean;
  onTabChange: (tab: NavTab) => void;
  onClearSelection: () => void;
  onLoginClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  selectedEntry,
  onTabChange,
  onClearSelection,
  onLoginClick,
}) => {
  const { user, signOut } = useAuth();

  const handleTabClick = (tab: NavTab) => {
    onClearSelection();
    onTabChange(tab);
  };

  return (
    <nav className="fixed left-0 top-0 h-full w-20 border-r border-white/5 flex flex-col items-center py-10 gap-16 z-50 bg-black mobile-bottom-nav">
      {/* Logo */}
      <div className="w-10 h-10 bg-[#D40000] flex items-center justify-center font-black text-xs hidden sm:flex cursor-default shadow-[0_0_15px_rgba(212,0,0,0.3)]">
        AP
      </div>

      {/* Navigation buttons - with labels on mobile */}
      <div className="flex flex-col sm:gap-10 items-center justify-around w-full sm:w-auto h-full sm:h-auto flex-grow px-2 sm:px-0">
        <button
          onClick={() => handleTabClick(NavTab.EVALUATION)}
          className={`flex flex-col items-center gap-1 sm:gap-0 p-3 sm:p-4 rounded-xl sm:rounded-full transition-all active:scale-95 ${
            activeTab === NavTab.EVALUATION && !selectedEntry
              ? 'text-white bg-white/10 border border-white/20'
              : 'text-zinc-500 active:bg-white/5'
          }`}
        >
          <Zap size={24} className="sm:w-[26px] sm:h-[26px]" strokeWidth={1.5} />
          <span className="text-[10px] font-medium tracking-wider sm:hidden">评估</span>
        </button>
        <button
          onClick={() => handleTabClick(NavTab.PATH)}
          className={`flex flex-col items-center gap-1 sm:gap-0 p-3 sm:p-4 rounded-xl sm:rounded-full transition-all active:scale-95 ${
            activeTab === NavTab.PATH || selectedEntry
              ? 'text-white bg-white/10 border border-white/20'
              : 'text-zinc-500 active:bg-white/5'
          }`}
        >
          <Activity size={24} className="sm:w-[26px] sm:h-[26px]" strokeWidth={1.5} />
          <span className="text-[10px] font-medium tracking-wider sm:hidden">归档</span>
        </button>
        <button
          onClick={() => handleTabClick(NavTab.LEARN)}
          className={`flex flex-col items-center gap-1 sm:gap-0 p-3 sm:p-4 rounded-xl sm:rounded-full transition-all active:scale-95 ${
            activeTab === NavTab.LEARN
              ? 'text-white bg-white/10 border border-white/20'
              : 'text-zinc-500 active:bg-white/5'
          }`}
        >
          <Lightbulb size={24} className="sm:w-[26px] sm:h-[26px]" strokeWidth={1.5} />
          <span className="text-[10px] font-medium tracking-wider sm:hidden">学习</span>
        </button>
      </div>

      {/* User avatar / Login button (desktop only) */}
      <div className="hidden sm:flex flex-col items-center gap-2">
        {user ? (
          <div className="relative group">
            <button className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden hover:border-[#D40000]/50 transition-colors">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <User size={18} className="text-zinc-400" />
              )}
            </button>
            <button
              onClick={() => signOut()}
              className="absolute -right-1 -bottom-1 w-5 h-5 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#D40000] hover:border-[#D40000]"
              title="退出登录"
            >
              <LogOut size={10} />
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-600 hover:text-white hover:border-[#D40000]/50 transition-all"
            title="登录"
          >
            <User size={18} />
          </button>
        )}
      </div>
    </nav>
  );
};
