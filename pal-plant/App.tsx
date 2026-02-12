import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Calendar, Settings as SettingsIcon, Home, Sprout, Search, BarChart3, X } from 'lucide-react';
import { Friend, Tab, ContactLog, MeetingRequest, AppSettings } from './types';
import FriendCard from './components/FriendCard';
import FriendModal from './components/AddFriendModal';
import MeetingRequestsView from './components/MeetingRequestsView';
import SettingsModal from './components/SettingsModal';
import HomeView from './components/HomeView';
import StatsView from './components/StatsView';
import OnboardingTooltips from './components/OnboardingTooltips';
import { useKeyboardShortcuts } from './components/KeyboardShortcuts';
import BulkImportModal from './components/BulkImportModal';
import { generateId, calculateTimeStatus, THEMES, calculateInteractionScore, calculateIndividualFriendScore } from './utils/helpers';

// ─── Toast System ─────────────────────────────────────────────────

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

// ─── Main App ─────────────────────────────────────────────────────

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast helpers
  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('friendkeep_settings');
    const defaults: AppSettings = {
      theme: 'plant',
      textSize: 'normal',
      highContrast: false,
      reducedMotion: false,
      reminders: {
        pushEnabled: false,
        emailEnabled: false,
        reminderHoursBefore: 24
      },
      hasSeenOnboarding: false
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      // Strip old accountAccess if present
      const { accountAccess, ...cleanParsed } = parsed;
      return { ...defaults, ...cleanParsed };
    }
    return defaults;
  });

  // Data States
  const [friends, setFriends] = useState<Friend[]>(() => {
    const saved = localStorage.getItem('friendkeep_data');
    if (!saved) return [];
    // Strip old linkedAccountId from friends on load
    return JSON.parse(saved).map((f: any) => {
      const { linkedAccountId, ...rest } = f;
      return rest;
    });
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('friendkeep_categories');
    return saved ? JSON.parse(saved) : ['Friends', 'Romantic', 'Business', 'Family'];
  });

  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>(() => {
    const saved = localStorage.getItem('friendkeep_meetings');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence
  useEffect(() => { localStorage.setItem('friendkeep_data', JSON.stringify(friends)); }, [friends]);
  useEffect(() => { localStorage.setItem('friendkeep_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('friendkeep_meetings', JSON.stringify(meetingRequests)); }, [meetingRequests]);
  useEffect(() => { localStorage.setItem('friendkeep_settings', JSON.stringify(settings)); }, [settings]);

  // Clean up old localStorage keys from removed multi-user features
  useEffect(() => {
    localStorage.removeItem('friendkeep_accounts');
    localStorage.removeItem('friendkeep_nudges');
  }, []);

  // Check for first-run onboarding
  useEffect(() => {
    if (!settings.hasSeenOnboarding) {
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setSettings(prev => ({ ...prev, hasSeenOnboarding: true }));
  };

  // Keyboard shortcuts hook
  const openAddModal = () => { setEditingFriend(null); setIsModalOpen(true); };
  const { showShortcutsModal, setShowShortcutsModal, ShortcutsModal } = useKeyboardShortcuts(
    setActiveTab,
    openAddModal,
    () => setIsSettingsOpen(true)
  );

  // Tick for timers
  useEffect(() => {
    const interval = setInterval(() => setFriends(prev => [...prev]), 60000);
    return () => clearInterval(interval);
  }, []);

  const themeColors = THEMES[settings.theme];
  const textSizeClass = settings.textSize === 'large' ? 'text-lg' : settings.textSize === 'xl' ? 'text-xl' : 'text-base';

  const handleSaveFriend = (friend: Friend) => {
    if (editingFriend) {
      setFriends(prev => prev.map(f => f.id === friend.id ? friend : f));
    } else {
      setFriends(prev => [friend, ...prev]);
    }
    setEditingFriend(null);
  };

  const handleAddCategory = (newCat: string) => {
    if (!categories.includes(newCat)) setCategories(prev => [...prev, newCat]);
  };

  const deleteFriend = (id: string) => {
    setFriends(prev => prev.filter(f => f.id !== id));
  };

  const markContacted = (id: string, type: 'REGULAR' | 'DEEP' | 'QUICK') => {
    setFriends(prev => prev.map(f => {
      if (f.id !== id) return f;

      const { percentageLeft, daysLeft } = calculateTimeStatus(f.lastContacted, f.frequencyDays);
      const now = new Date();

      // --- QUICK TOUCH LOGIC ---
      if (type === 'QUICK') {
        if ((f.quickTouchesAvailable || 0) <= 0) return f;

        const newLastContacted = new Date(new Date(f.lastContacted).getTime() + (30 * 60 * 1000)).toISOString();

        return {
          ...f,
          lastContacted: newLastContacted,
          quickTouchesAvailable: f.quickTouchesAvailable - 1,
          logs: [{
             id: generateId(),
             date: now.toISOString(),
             type: 'QUICK',
             daysWaitGoal: f.frequencyDays,
             percentageRemaining: percentageLeft,
             scoreDelta: 2
          }, ...f.logs],
          individualScore: Math.min(100, (f.individualScore || 50) + 2)
        };
      }

      // --- REGULAR & DEEP LOGIC (Resets Timer) ---

      // Auto-shorten frequency if contacting very early twice in a row
      let updatedFrequencyDays = f.frequencyDays;
      if (type === 'REGULAR' && percentageLeft > 80) {
         const lastLog = f.logs[0];
         if (lastLog && lastLog.percentageRemaining > 80) {
            updatedFrequencyDays = Math.max(1, Math.floor(f.frequencyDays / 2));
            showToast(`${f.name}'s timer shortened to ${updatedFrequencyDays} days (frequent contact detected).`, 'info');
         }
      }

      const daysOverdue = daysLeft < 0 ? Math.abs(daysLeft) : 0;
      const scoreChange = calculateInteractionScore(type, percentageLeft, daysOverdue);

      const newLogs: ContactLog[] = [{
         id: generateId(),
         date: now.toISOString(),
         type: type,
         daysWaitGoal: updatedFrequencyDays,
         percentageRemaining: percentageLeft,
         scoreDelta: scoreChange
      }, ...f.logs];

      const newScore = calculateIndividualFriendScore(newLogs);

      // Deep Connection Mechanics
      let newLastDeep = f.lastDeepConnection;
      let extraWaitTime = 0;

      if (type === 'DEEP') {
         newLastDeep = now.toISOString();
         extraWaitTime = 12 * 60 * 60 * 1000;
      }

      // Quick Touch Reset Logic: 1 per 2 cycles.
      let newCycles = (f.cyclesSinceLastQuickTouch || 0) + 1;
      let newTokens = (f.quickTouchesAvailable || 0);
      if (newCycles >= 2) {
         newTokens = 1;
         newCycles = 0;
      }

      return {
        ...f,
        frequencyDays: updatedFrequencyDays,
        lastContacted: new Date(now.getTime() + extraWaitTime).toISOString(),
        logs: newLogs,
        individualScore: newScore,
        lastDeepConnection: newLastDeep,
        cyclesSinceLastQuickTouch: newCycles,
        quickTouchesAvailable: newTokens
      };
    }));
  };

  const deleteLog = (friendId: string, logId: string) => {
    setFriends(prev => prev.map(f => {
       if (f.id !== friendId) return f;
       const updatedLogs = f.logs.filter(l => l.id !== logId);
       const newScore = calculateIndividualFriendScore(updatedLogs);
       const sortedLogs = [...updatedLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
       return {
         ...f,
         logs: updatedLogs,
         lastContacted: sortedLogs.length > 0 ? sortedLogs[0].date : f.lastContacted,
         individualScore: newScore
       };
    }));
    if (editingFriend?.id === friendId) {
        setEditingFriend(prev => prev ? ({ ...prev, logs: prev.logs.filter(l => l.id !== logId) }) : null);
    }
  };

  const handleRequestMeeting = (friend: Friend) => {
    setMeetingRequests(prev => [{
      id: generateId(), name: friend.name, phone: friend.phone, email: friend.email, photo: friend.photo,
      status: 'REQUESTED', dateAdded: new Date().toISOString(), linkedFriendId: friend.id, category: friend.category === 'Family' ? 'Family' : 'Friend'
    }, ...prev]);
    setActiveTab(Tab.MEETINGS);
  };

  const openEditModal = (friend: Friend) => { setEditingFriend(friend); setIsModalOpen(true); };

  // Bulk import handler
  const handleBulkImport = (newFriends: Friend[]) => {
    setFriends(prev => [...newFriends, ...prev]);
    showToast(`Successfully imported ${newFriends.length} contacts!`);
  };

  // Computed
  const filteredFriends = friends.filter(f => {
    const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedFriends = [...filteredFriends].sort((a, b) => calculateTimeStatus(a.lastContacted, a.frequencyDays).percentageLeft - calculateTimeStatus(b.lastContacted, b.frequencyDays).percentageLeft);

  return (
    <div className={`h-full w-full ${themeColors.bg} ${themeColors.textMain} ${textSizeClass} transition-colors duration-300 flex flex-col relative ${settings.reducedMotion ? 'motion-reduce' : ''}`}>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Bar */}
      <header className={`px-6 pt-8 pb-4 ${themeColors.bg}/95 backdrop-blur-md sticky top-0 z-30 border-b ${themeColors.border} transition-colors duration-300`}>
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setActiveTab(Tab.HOME)} className="text-left">
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Sprout className="text-emerald-600 fill-emerald-100" />
              Pal Plant
            </h1>
            <p className={`text-xs font-bold uppercase tracking-widest mt-0.5 opacity-60`}>
               {activeTab === Tab.HOME ? 'Dashboard' : activeTab === Tab.LIST ? 'Your Garden' : activeTab === Tab.STATS ? 'Statistics' : 'Meeting Requests'}
            </p>
          </button>
          <div className="flex gap-2">
            <button
                onClick={() => setIsSettingsOpen(true)}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border ${themeColors.border} ${themeColors.cardBg} active:scale-95 transition-transform`}
              >
                <SettingsIcon size={20} className={themeColors.textSub} />
            </button>
          </div>
        </div>

        {/* Categories & Search (List Tab Only) */}
        {activeTab === Tab.LIST && (
           <div className="space-y-3">
             {/* Search Bar */}
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

             {/* Categories */}
             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-6 px-6">
                <button onClick={() => setSelectedCategory('All')} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedCategory === 'All' ? `${themeColors.primary} text-white border-transparent` : `${themeColors.cardBg} ${themeColors.textSub} ${themeColors.border}`}`}>All</button>
                {categories.map(cat => (
                   <button key={cat} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedCategory === cat ? `${themeColors.primary} text-white border-transparent` : `${themeColors.cardBg} ${themeColors.textSub} ${themeColors.border}`}`}>{cat}</button>
                ))}
             </div>

             <div className="flex justify-between items-center text-xs font-bold text-slate-600 px-1 mt-2">
               <button
                 onClick={() => setIsBulkImportOpen(true)}
                 className="underline decoration-dotted underline-offset-4"
               >
                 Import contacts into your garden
               </button>
               <button onClick={openAddModal} className="text-emerald-700">New plant</button>
             </div>
           </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 pb-32 max-w-2xl mx-auto w-full">
        {activeTab === Tab.HOME ? (
           <HomeView
             friends={friends}
             meetingRequests={meetingRequests}
             settings={settings}
             onNavigate={setActiveTab}
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
                 {/* Empty Search State */}
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
                   />
                 ))}
              </div>
            )}

            {/* Floating Action Button for List View */}
            <button
              onClick={openAddModal}
              className={`fixed bottom-24 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all ${themeColors.primary} z-40`}
            >
              <Plus size={28} strokeWidth={3} />
            </button>
          </>
        ) : activeTab === Tab.STATS ? (
           <StatsView friends={friends} />
        ) : (
           <MeetingRequestsView
              requests={meetingRequests}
              onAddRequest={(req) => setMeetingRequests(prev => [req, ...prev])}
              onUpdateRequest={(req) => setMeetingRequests(prev => prev.map(r => r.id === req.id ? req : r))}
              onDeleteRequest={(id) => setMeetingRequests(prev => prev.filter(r => r.id !== id))}
              settings={settings}
           />
        )}
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className={`fixed bottom-0 w-full ${themeColors.cardBg} border-t ${themeColors.border} px-6 py-4 pb-6 z-40 flex justify-between items-center sm:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors duration-300`}>
        <button onClick={() => setActiveTab(Tab.HOME)} className={`flex flex-col items-center gap-1 w-1/4 transition-opacity ${activeTab === Tab.HOME ? 'opacity-100 scale-110' : 'opacity-40'}`}>
          <Home size={24} strokeWidth={activeTab === Tab.HOME ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => setActiveTab(Tab.LIST)} className={`flex flex-col items-center gap-1 w-1/4 transition-opacity ${activeTab === Tab.LIST ? 'opacity-100 scale-110' : 'opacity-40'}`}>
          <Users size={24} strokeWidth={activeTab === Tab.LIST ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Garden</span>
        </button>
        <button onClick={() => setActiveTab(Tab.STATS)} className={`flex flex-col items-center gap-1 w-1/4 transition-opacity ${activeTab === Tab.STATS ? 'opacity-100 scale-110' : 'opacity-40'}`}>
          <BarChart3 size={24} strokeWidth={activeTab === Tab.STATS ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Stats</span>
        </button>
        <button onClick={() => setActiveTab(Tab.MEETINGS)} className={`flex flex-col items-center gap-1 w-1/4 transition-opacity ${activeTab === Tab.MEETINGS ? 'opacity-100 scale-110' : 'opacity-40'}`}>
          <Calendar size={24} strokeWidth={activeTab === Tab.MEETINGS ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Requests</span>
        </button>
      </nav>

      {/* Desktop Pill Nav (Bottom Center) */}
      <div className={`hidden sm:flex fixed bottom-6 left-1/2 -translate-x-1/2 ${themeColors.cardBg}/90 backdrop-blur-md border ${themeColors.border} shadow-xl rounded-full px-2 py-2 gap-2 z-40`}>
          <button onClick={() => setActiveTab(Tab.HOME)} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === Tab.HOME ? `${themeColors.primary} ${themeColors.primaryText}` : `${themeColors.textSub} hover:bg-slate-100`}`}>Home</button>
          <button onClick={() => setActiveTab(Tab.LIST)} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === Tab.LIST ? `${themeColors.primary} ${themeColors.primaryText}` : `${themeColors.textSub} hover:bg-slate-100`}`}>Garden</button>
          <button onClick={() => setActiveTab(Tab.STATS)} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === Tab.STATS ? `${themeColors.primary} ${themeColors.primaryText}` : `${themeColors.textSub} hover:bg-slate-100`}`}>Stats</button>
          <button onClick={() => setActiveTab(Tab.MEETINGS)} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === Tab.MEETINGS ? `${themeColors.primary} ${themeColors.primaryText}` : `${themeColors.textSub} hover:bg-slate-100`}`}>Requests</button>
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
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImport={handleBulkImport}
        existingFriends={friends}
        categories={categories}
        settings={settings}
      />

      {/* Onboarding Tooltips */}
      {showOnboarding && (
        <OnboardingTooltips
          settings={settings}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal />
    </div>
  );
};

export default App;
