import React, { useState, useEffect, useTransition, Suspense, lazy, memo } from 'react';
import { NavTab, PhotoEntry } from './types';
import { INITIAL_ENTRIES } from './constants';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { Sidebar } from './components/layout/Sidebar';
import { UserStatusBar } from './components/layout/UserStatusBar';
import { getUserPhotoEntries } from './services/dataService';

// 懒加载视图组件
const EvaluationView = lazy(() => import('./components/evaluation/EvaluationView').then(m => ({ default: m.EvaluationView })));
const ArchivesView = lazy(() => import('./components/archives/ArchivesView').then(m => ({ default: m.ArchivesView })));
const LearnView = lazy(() => import('./components/learn/LearnView').then(m => ({ default: m.LearnView })));

// 加载占位符
const LoadingFallback = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-8 h-8 border-2 border-[#D40000] border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-zinc-600 mono text-xs tracking-widest">LOADING...</p>
    </div>
  </div>
);

// 使用 memo 包装视图，避免不必要的重渲染
const MemoizedEvaluationView = memo(EvaluationView);
const MemoizedArchivesView = memo(ArchivesView);
const MemoizedLearnView = memo(LearnView);

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.EVALUATION);
  const [entries, setEntries] = useState<PhotoEntry[]>(INITIAL_ENTRIES);
  const [selectedEntry, setSelectedEntry] = useState<PhotoEntry | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load user data when logged in
  useEffect(() => {
    if (user) {
      getUserPhotoEntries(user.id).then((userEntries) => {
        if (userEntries.length > 0) {
          setEntries(userEntries);
        }
      });
    } else {
      setEntries(INITIAL_ENTRIES);
    }
  }, [user]);

  // 使用 startTransition 进行非阻塞的页面切换
  const handleTabChange = (tab: NavTab) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  const handleClearSelection = () => {
    startTransition(() => {
      setSelectedEntry(null);
    });
  };

  const handleSelectEntry = (entry: PhotoEntry | null) => {
    startTransition(() => {
      setSelectedEntry(entry);
    });
  };

  const handleNavigateToArchives = () => {
    startTransition(() => {
      setActiveTab(NavTab.PATH);
    });
  };

  const isEvaluationView = activeTab === NavTab.EVALUATION && !selectedEntry;
  const isArchivesView = (activeTab === NavTab.PATH || selectedEntry) && activeTab !== NavTab.LEARN;
  const isLearnView = activeTab === NavTab.LEARN && !selectedEntry;

  const handleNavigateToEvaluation = () => {
    startTransition(() => {
      setActiveTab(NavTab.EVALUATION);
    });
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 selection:bg-[#D40000] selection:text-white pb-24 sm:pb-0">
      {/* Sidebar / Bottom Nav */}
      <Sidebar
        activeTab={activeTab}
        selectedEntry={!!selectedEntry}
        onTabChange={handleTabChange}
        onClearSelection={handleClearSelection}
        onLoginClick={() => setShowAuthModal(true)}
      />

      {/* User Status Bar */}
      <UserStatusBar onLoginClick={() => setShowAuthModal(true)} />

      {/* 切换中的加载指示 */}
      {isPending && (
        <div className="fixed top-0 left-0 right-0 h-0.5 bg-zinc-900 z-50">
          <div className="h-full bg-[#D40000] animate-pulse" style={{ width: '30%' }} />
        </div>
      )}

      {/* Main Content - 使用 CSS 切换显示而非条件渲染 */}
      <main className="pl-0 sm:pl-20 min-h-screen flex flex-col main-content overflow-x-hidden">
        <Suspense fallback={<LoadingFallback />}>
          <div className={`${isEvaluationView ? 'contents animate-in fade-in duration-300' : 'hidden'}`}>
            <MemoizedEvaluationView
              entries={entries}
              setEntries={setEntries}
              onNavigateToArchives={handleNavigateToArchives}
              onNavigateToLearn={() => startTransition(() => setActiveTab(NavTab.LEARN))}
              onShowAuthModal={() => setShowAuthModal(true)}
            />
          </div>

          <div className={`${isArchivesView ? 'contents animate-in fade-in duration-300' : 'hidden'}`}>
            <MemoizedArchivesView
              entries={entries}
              selectedEntry={selectedEntry}
              onSelectEntry={handleSelectEntry}
            />
          </div>

          <div className={`${isLearnView ? 'contents animate-in fade-in duration-300' : 'hidden'}`}>
            <MemoizedLearnView
              entries={entries}
              onNavigateToEvaluation={handleNavigateToEvaluation}
            />
          </div>
        </Suspense>
      </main>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

// Main App component wrapped with AuthProvider
const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
