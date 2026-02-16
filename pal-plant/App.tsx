import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Plus, Users, Calendar, Settings as SettingsIcon, Home, Sprout, Search, BarChart3, X, Download } from 'lucide-react';
import { Friend, Tab, ContactLog, MeetingRequest, AppSettings } from './types';
import FriendCard from './components/FriendCard';
import FriendModal from './components/AddFriendModal';
import MeetingRequestsView from './components/MeetingRequestsView';
import SettingsModal from './components/SettingsModal';
import HomeView from './components/HomeView';
import { useKeyboardShortcuts } from './components/KeyboardShortcuts';
import { generateId, calculateTimeStatus, THEMES } from './utils/helpers';
import { trackEvent } from './utils/analytics';
import { useReminderEngine } from './hooks/useReminderEngine';
import { useFriendsEngine } from './hooks/useFriendsEngine';
import { initStorage, getFriends, getMeetings, getCategories, getSettings, exportAllData, importAllData, saveMetadata, getMetadata } from './utils/storage';
import { debouncedSaveFriends, debouncedSaveMeetings, debouncedSaveCategories, debouncedSaveSettings } from './utils/debouncedStorage';
import { ThemeProvider } from './utils/ThemeContext';

const StatsView = lazy(() => import('./components/StatsView'));
const OnboardingTooltips = lazy(() => import('./components/OnboardingTooltips'));
const BulkImportModal = lazy(() => import('./components/BulkImportModal'));
const RuleGuide = lazy(() => import('./components/RuleGuide'));

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

const ToastContainer: React.FC<{ toasts: Toast[]; onDismiss: (id: string) => void }> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-in slide-in-from-top fade-in duration-300 ${
            t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            t.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isRuleGuideOpen, setIsRuleGuideOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showBackupBanner, setShowBackupBanner] = useState(false);
  const [isStorageReady, setIsStorageReady] = useState(false);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const [settings, setSettings] = useState<AppSettings>(() => {
    // Temporary sync read for initial render (will be replaced by async load)
    const saved = localStorage.getItem('friendkeep_settings');
    const defaults: AppSettings = {
      theme: 'plant',
      textSize: 'normal',
      highContrast: false,
      reducedMotion: false,
      reminders: {
        pushEnabled: false,
        reminderHoursBefore: 24,
        backupReminderEnabled: true,
        backupReminderDays: 7
      },
      hasSeenOnboarding: false
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaults,
        ...parsed,
        reminders: {
          ...defaults.reminders,
          ...(parsed.reminders || {})
        }
      };
    }
    return defaults;
  });

  const {
    friends, setFriends, feedbackMap, markContacted, clearFeedback,
    deleteFriend, deleteLog: engineDeleteLog, saveFriend, bulkImport
  } = useFriendsEngine(() => {
    // Temporary sync read for initial render (will be replaced by async load)
    const saved = localStorage.getItem('friendkeep_data');
    if (!saved) return [];
    return JSON.parse(saved);
  });

  const [categories, setCategories] = useState<string[]>(() => {
    // Temporary sync read for initial render (will be replaced by async load)
    const saved = localStorage.getItem('friendkeep_categories');
    return saved ? JSON.parse(saved) : ['Friends', 'Romantic', 'Business', 'Family'];
  });

  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>(() => {
    // Temporary sync read for initial render (will be replaced by async load)
    const saved = localStorage.getItem('friendkeep_meetings');
    return saved ? JSON.parse(saved) : [];
  });

  // Initialize storage and load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Initialize storage (runs migration if needed)
        await initStorage();

        // Load all data from storage
        const [loadedFriends, loadedMeetings, loadedCategories, loadedSettings] = await Promise.all([
          getFriends(),
          getMeetings(),
          getCategories(),
          getSettings()
        ]);

        // Update state with loaded data (even if empty)
        setFriends(loadedFriends);
        setMeetingRequests(loadedMeetings);
        setCategories(loadedCategories);
        
        if (loadedSettings) {
          setSettings(prev => ({
            ...prev,
            ...loadedSettings,
            reminders: {
              ...prev.reminders,
              ...(loadedSettings.reminders || {})
            }
          }));
        }

        setIsStorageReady(true);
      } catch (error) {
        console.error('Error loading data from storage:', error);
        // Continue with localStorage data already loaded in initial state
        setIsStorageReady(true);
      }
    };

    loadData();
  }, []);

  // Save friends with debouncing
  useEffect(() => {
    if (!isStorageReady) return;
    debouncedSaveFriends(friends);
  }, [friends, isStorageReady]);

  // Save categories with debouncing
  useEffect(() => {
    if (!isStorageReady) return;
    debouncedSaveCategories(categories);
  }, [categories, isStorageReady]);

  // Save meetings with debouncing
  useEffect(() => {
    if (!isStorageReady) return;
    debouncedSaveMeetings(meetingRequests);
  }, [meetingRequests, isStorageReady]);

  // Save settings with debouncing
  useEffect(() => {
    if (!isStorageReady) return;
    debouncedSaveSettings(settings);
  }, [settings, isStorageReady]);

  useEffect(() => {
    localStorage.removeItem('friendkeep_accounts');
    localStorage.removeItem('friendkeep_nudges');
  }, []);

  useEffect(() => {
    if (!settings.hasSeenOnboarding) {
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, [settings.hasSeenOnboarding]);


  const triggerBackupDownload = useCallback(async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pal_plant_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      // Mark backup as done
      await saveMetadata('friendkeep_last_backup_at', new Date().toISOString());
      showToast('Backup downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error creating backup:', error);
      showToast('Error creating backup', 'warning');
    }
  }, [showToast]);

  useReminderEngine({
    friends,
    meetingRequests,
    reminders: settings.reminders,
    onBackupReminder: () => setShowBackupBanner(true),
    onQuickBackup: triggerBackupDownload
  });

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setSettings(prev => ({ ...prev, hasSeenOnboarding: true }));
  };

  const openAddModal = () => { setEditingFriend(null); setIsModalOpen(true); };
  const { setShowShortcutsModal, ShortcutsModal } = useKeyboardShortcuts(
    setActiveTab,
    openAddModal,
    () => setIsSettingsOpen(true)
  );

  useEffect(() => {
    const interval = setInterval(() => setFriends(prev => [...prev]), 60000);
    return () => clearInterval(interval);
  }, []);

  const themeColors = THEMES[settings.theme];
  const textSizeClass = settings.textSize === 'large' ? 'text-lg' : settings.textSize === 'xl' ? 'text-xl' : 'text-base';

  const handleSaveFriend = (friend: Friend) => {
    saveFriend(friend, !!editingFriend);
    setEditingFriend(null);
  };

  const handleAddCategory = (newCat: string) => {
    if (!categories.includes(newCat)) setCategories(prev => [...prev, newCat]);
  };

  const deleteLog = (friendId: string, logId: string) => {
    engineDeleteLog(friendId, logId);
    if (editingFriend?.id === friendId) {
      setEditingFriend(prev => prev ? ({ ...prev, logs: prev.logs.filter(l => l.id !== logId) }) : null);
    }
  };

  const handleRequestMeeting = (friend: Friend) => {
    setMeetingRequests(prev => [{
      id: generateId(),
      name: friend.name,
      status: 'REQUESTED',
      dateAdded: new Date().toISOString(),
      linkedFriendId: friend.id,
      category: friend.category === 'Family' ? 'Family' : 'Friend'
    }, ...prev]);
    trackEvent('MEETING_CREATED', { friendId: friend.id });
    setActiveTab(Tab.MEETINGS);
  };

  const openEditModal = (friend: Friend) => { setEditingFriend(friend); setIsModalOpen(true); };

  const handleBulkImport = (newFriends: Friend[]) => {
    bulkImport(newFriends);
    showToast(`Successfully imported ${newFriends.length} contacts!`);
  };

  const filteredFriends = friends.filter(f => {
    const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedFriends = [...filteredFriends].sort((a, b) => calculateTimeStatus(a.lastContacted, a.frequencyDays).percentageLeft - calculateTimeStatus(b.lastContacted, b.frequencyDays).percentageLeft);

  const handleNavigateToFriend = (friendName: string) => {
    setActiveTab(Tab.LIST);
    setSearchQuery(friendName);
  };

  const handleNavigateToMeetings = () => {
    setActiveTab(Tab.MEETINGS);
  };

  const handleApplyNudge = useCallback((friendId: string, newFrequencyDays: number) => {
    setFriends(prev => prev.map(f =>
      f.id === friendId ? { ...f, frequencyDays: newFrequencyDays } : f
    ));
    showToast(`Cadence updated to ${newFrequencyDays} days`, 'success');
  }, [setFriends, showToast]);

  return (
    <ThemeProvider theme={themeColors}>
      <div className={`h-full w-full ${themeColors.bg} ${themeColors.textMain} ${textSizeClass} transition-colors duration-300 flex flex-col relative ${settings.reducedMotion ? 'motion-reduce' : ''}`}>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {showBackupBanner && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[90] w-[90%] max-w-sm bg-blue-50 border border-blue-200 rounded-xl shadow-lg p-4 animate-in slide-in-from-top fade-in duration-300">
          <p className="text-sm font-bold text-blue-800 mb-2">Backup Reminder</p>
          <p className="text-xs text-blue-600 mb-3">It's been a while since your last backup. Download one now?</p>
          <div className="flex gap-2">
            <button
              onClick={() => { triggerBackupDownload(); setShowBackupBanner(false); }}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg"
            >
              <Download size={14} /> Download Backup
            </button>
            <button
              onClick={() => setShowBackupBanner(false)}
              className="px-4 bg-blue-100 text-blue-700 text-xs font-bold py-2 rounded-lg"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <header className={`px-6 pt-8 pb-4 ${themeColors.bg}/95 backdrop-blur-md sticky top-0 z-30 border-b ${themeColors.border} transition-colors duration-300`} role="banner">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setActiveTab(Tab.HOME)} className="text-left">
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Sprout className="text-emerald-600 fill-emerald-100" />
              Pal Plant
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest mt-0.5 opacity-60" aria-live="polite">
              {activeTab === Tab.HOME ? 'Dashboard' : activeTab === Tab.LIST ? 'Your Garden' : activeTab === Tab.STATS ? 'Statistics' : 'Meeting Requests'}
            </p>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border ${themeColors.border} ${themeColors.cardBg} active:scale-95 transition-transform`}
          >
            <SettingsIcon size={20} className={themeColors.textSub} />
          </button>
        </div>

        {activeTab === Tab.LIST && (
          <div className="space-y-3">
            <div className="relative">
              <Search className={`absolute left-3 top-2.5 ${themeColors.textSub}`} size={16} />
              <input
                type="text"
                placeholder="Search your garden..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${themeColors.cardBg} pl-10 pr-4 py-2 rounded-xl text-sm border ${themeColors.border} focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all`}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-6 px-6">
              <button onClick={() => setSelectedCategory('All')} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedCategory === 'All' ? `${themeColors.primary} text-white border-transparent` : `${themeColors.cardBg} ${themeColors.textSub} ${themeColors.border}`}`}>All</button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedCategory === cat ? `${themeColors.primary} text-white border-transparent` : `${themeColors.cardBg} ${themeColors.textSub} ${themeColors.border}`}`}>{cat}</button>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs font-bold text-slate-600 px-1 mt-2">
              <button onClick={() => setIsBulkImportOpen(true)} className="underline decoration-dotted underline-offset-4">
                Import contacts into your garden
              </button>
              <button onClick={openAddModal} className="text-emerald-700">New plant</button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 pb-32 max-w-2xl mx-auto w-full">
        {activeTab === Tab.HOME ? (
          <HomeView
            friends={friends}
            meetingRequests={meetingRequests}
            settings={settings}
            onNavigateToFriend={handleNavigateToFriend}
            onNavigateToMeetings={handleNavigateToMeetings}
            onApplyNudge={handleApplyNudge}
          />
        ) : activeTab === Tab.LIST ? (
          <>
            {friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 opacity-50 ${themeColors.cardBg}`}>
                  <Users size={32} />
                </div>
                <h3 className="text-lg font-bold">Your garden is empty</h3>
                <button onClick={openAddModal} className="mt-6 font-bold text-sm underline opacity-80">Plant your first seed</button>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedFriends.length === 0 && searchQuery && (
                  <div className="text-center py-10 opacity-50">
                    <p>No plants found matching "{searchQuery}"</p>
                  </div>
                )}

                {sortedFriends.map(friend => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    onContact={markContacted}
                    onDelete={deleteFriend}
                    onEdit={openEditModal}
                    onRequestMeeting={handleRequestMeeting}
                    feedback={feedbackMap[friend.id]}
                    onDismissFeedback={clearFeedback}
                  />
                ))}
              </div>
            )}

            <button
              onClick={openAddModal}
              className={`fixed bottom-24 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all ${themeColors.primary} z-40`}
            >
              <Plus size={28} strokeWidth={3} />
            </button>
          </>
        ) : activeTab === Tab.STATS ? (
          <Suspense fallback={<div className="text-center py-10 opacity-60">Loading statistics…</div>}>
            <StatsView friends={friends} />
          </Suspense>
        ) : (
          <MeetingRequestsView
            requests={meetingRequests}
            onAddRequest={(req) => {
              setMeetingRequests(prev => [req, ...prev]);
              trackEvent('MEETING_CREATED', { meetingId: req.id });
            }}
            onUpdateRequest={(req) => {
              setMeetingRequests(prev => prev.map(r => r.id === req.id ? req : r));
              if (req.status === 'SCHEDULED') trackEvent('MEETING_SCHEDULED', { meetingId: req.id });
              if (req.status === 'COMPLETE' && req.verified) trackEvent('MEETING_COMPLETED', { meetingId: req.id });
              if (req.status === 'COMPLETE' && req.verified === false) trackEvent('MEETING_CLOSED', { meetingId: req.id });
            }}
            onDeleteRequest={(id) => setMeetingRequests(prev => prev.filter(r => r.id !== id))}
            settings={settings}
          />
        )}
      </main>

      <nav className={`fixed bottom-0 w-full ${themeColors.cardBg} border-t ${themeColors.border} px-6 py-4 pb-6 z-40 flex justify-between items-center sm:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors duration-300`} role="navigation" aria-label="Main navigation">
        <button onClick={() => setActiveTab(Tab.HOME)} aria-current={activeTab === Tab.HOME ? 'page' : undefined} aria-label="Home" className={`flex flex-col items-center gap-1 w-1/4 transition-opacity ${activeTab === Tab.HOME ? 'opacity-100 scale-110' : 'opacity-40'}`}><Home size={24} aria-hidden="true" /><span className="text-[10px] font-bold">Home</span></button>
        <button onClick={() => setActiveTab(Tab.LIST)} aria-current={activeTab === Tab.LIST ? 'page' : undefined} aria-label="Garden" className={`flex flex-col items-center gap-1 w-1/4 transition-opacity ${activeTab === Tab.LIST ? 'opacity-100 scale-110' : 'opacity-40'}`}><Users size={24} aria-hidden="true" /><span className="text-[10px] font-bold">Garden</span></button>
        <button onClick={() => setActiveTab(Tab.STATS)} aria-current={activeTab === Tab.STATS ? 'page' : undefined} aria-label="Statistics" className={`flex flex-col items-center gap-1 w-1/4 transition-opacity ${activeTab === Tab.STATS ? 'opacity-100 scale-110' : 'opacity-40'}`}><BarChart3 size={24} aria-hidden="true" /><span className="text-[10px] font-bold">Stats</span></button>
        <button onClick={() => setActiveTab(Tab.MEETINGS)} aria-current={activeTab === Tab.MEETINGS ? 'page' : undefined} aria-label="Meeting requests" className={`flex flex-col items-center gap-1 w-1/4 transition-opacity ${activeTab === Tab.MEETINGS ? 'opacity-100 scale-110' : 'opacity-40'}`}><Calendar size={24} aria-hidden="true" /><span className="text-[10px] font-bold">Requests</span></button>
      </nav>

      <div className={`hidden sm:flex fixed bottom-6 left-1/2 -translate-x-1/2 ${themeColors.cardBg}/90 backdrop-blur-md border ${themeColors.border} shadow-xl rounded-full px-2 py-2 gap-2 z-40`} role="navigation" aria-label="Main navigation">
        <button onClick={() => setActiveTab(Tab.HOME)} aria-current={activeTab === Tab.HOME ? 'page' : undefined} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === Tab.HOME ? `${themeColors.primary} ${themeColors.primaryText}` : `${themeColors.textSub} hover:bg-slate-100`}`}>Home</button>
        <button onClick={() => setActiveTab(Tab.LIST)} aria-current={activeTab === Tab.LIST ? 'page' : undefined} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === Tab.LIST ? `${themeColors.primary} ${themeColors.primaryText}` : `${themeColors.textSub} hover:bg-slate-100`}`}>Garden</button>
        <button onClick={() => setActiveTab(Tab.STATS)} aria-current={activeTab === Tab.STATS ? 'page' : undefined} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === Tab.STATS ? `${themeColors.primary} ${themeColors.primaryText}` : `${themeColors.textSub} hover:bg-slate-100`}`}>Stats</button>
        <button onClick={() => setActiveTab(Tab.MEETINGS)} aria-current={activeTab === Tab.MEETINGS ? 'page' : undefined} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === Tab.MEETINGS ? `${themeColors.primary} ${themeColors.primaryText}` : `${themeColors.textSub} hover:bg-slate-100`}`}>Requests</button>
      </div>

      <FriendModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFriend}
        onDeleteLog={deleteLog}
        initialData={editingFriend}
        categories={categories}
        onAddCategory={handleAddCategory}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdate={setSettings}
        onOpenBulkImport={() => setIsBulkImportOpen(true)}
        onShowOnboarding={() => setShowOnboarding(true)}
        onShowShortcuts={() => setShowShortcutsModal(true)}
        onShowRuleGuide={() => setIsRuleGuideOpen(true)}
      />

      {isBulkImportOpen && (
        <Suspense fallback={null}>
          <BulkImportModal
            isOpen={isBulkImportOpen}
            onClose={() => setIsBulkImportOpen(false)}
            onImport={handleBulkImport}
            existingFriends={friends}
            categories={categories}
            settings={settings}
          />
        </Suspense>
      )}

      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingTooltips settings={settings} onComplete={handleOnboardingComplete} />
        </Suspense>
      )}

      {isRuleGuideOpen && (
        <Suspense fallback={null}>
          <RuleGuide isOpen={isRuleGuideOpen} onClose={() => setIsRuleGuideOpen(false)} />
        </Suspense>
      )}

      <ShortcutsModal />
    </div>
    </ThemeProvider>
  );
};

export default App;
