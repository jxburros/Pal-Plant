/*
 * Copyright 2026 Jeffrey Guntly (JX Holdings, LLC)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Plus, Users, Calendar, Settings as SettingsIcon, Home, Search, BarChart3, X, Download, LayoutGrid, Skull } from 'lucide-react';
import { Friend, Tab, MeetingRequest, ContactChannel } from './types';
import FriendCard from './components/FriendCard';
import FriendModal from './components/AddFriendModal';
import MeetingRequestsView from './components/MeetingRequestsView';
import SettingsModal from './components/SettingsModal';
import HomeView from './components/HomeView';
import { useKeyboardShortcuts } from './components/KeyboardShortcuts';
import { generateId, calculateTimeStatus, getThemeColors } from './utils/helpers';
import { trackEvent } from './utils/analytics';
import { useReminderEngine } from './hooks/useReminderEngine';
import { useAppContext } from './hooks/AppContext';
import { editFriendLog, addPastLog as addPastLogFn } from './utils/friendEngine';
import { exportAllData, saveMetadata } from './utils/storage';

const StatsView = lazy(() => import('./components/StatsView'));
const OnboardingTooltips = lazy(() => import('./components/OnboardingTooltips'));
const BulkImportModal = lazy(() => import('./components/BulkImportModal'));
const RuleGuide = lazy(() => import('./components/RuleGuide'));
const MeetingFollowUpModal = lazy(() => import('./components/MeetingFollowUpModal'));
const GroupManagementModal = lazy(() => import('./components/GroupManagementModal'));

// ─── Toast ────────────────────────────────────────────────────────

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
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-md shadow-lg border text-sm font-medium animate-in slide-in-from-top fade-in duration-300 ${
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

// ─── App ──────────────────────────────────────────────────────────

const App: React.FC = () => {
  // ─── Context (data state + actions) ───────────────────────────
  const {
    friends, setFriends, meetingRequests, setMeetingRequests, settings, setSettings, updateSettings,
    categories, addCategory, groups, setGroups,
    feedbackMap, isStorageReady, lastOpened,
    markContacted, clearFeedback, deleteFriend,
    deleteLog: ctxDeleteLog, editLog: ctxEditLog, addPastInteraction: ctxAddPastInteraction,
    saveFriend: ctxSaveFriend, bulkImportFriends,
    addMeetingRequest, updateMeetingRequest, deleteMeetingRequest,
  } = useAppContext();

  // ─── UI State ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isRuleGuideOpen, setIsRuleGuideOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [healthFilter, setHealthFilter] = useState<'All' | 'Healthy' | 'Wilting' | 'Withering'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showBackupBanner, setShowBackupBanner] = useState(false);
  const [meetingFollowUp, setMeetingFollowUp] = useState<MeetingRequest | null>(null);
  const [isGroupManagementOpen, setIsGroupManagementOpen] = useState(false);

  // ─── Toast Helpers ────────────────────────────────────────────

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ─── Onboarding ───────────────────────────────────────────────

  useEffect(() => {
    if (!settings.hasSeenOnboarding) {
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, [settings.hasSeenOnboarding]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    updateSettings({ hasSeenOnboarding: true });
  };

  // ─── Backup ───────────────────────────────────────────────────

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

  // ─── Meeting Follow-up Detection ──────────────────────────────

  useEffect(() => {
    if (!isStorageReady || meetingFollowUp) return;
    const now = new Date();
    const passed = meetingRequests.find(m =>
      m.status === 'SCHEDULED' && m.scheduledDate &&
      new Date(m.scheduledDate) > lastOpened &&
      new Date(m.scheduledDate) <= now
    );
    if (passed) setMeetingFollowUp(passed);
  }, [isStorageReady, meetingRequests, lastOpened, meetingFollowUp]);

  // ─── Keyboard Shortcuts ───────────────────────────────────────

  const openAddModal = useCallback(() => {
    setEditingFriend(null);
    setIsModalOpen(true);
  }, []);

  const { setShowShortcutsModal, ShortcutsModal } = useKeyboardShortcuts(
    setActiveTab,
    openAddModal,
    () => setIsSettingsOpen(true)
  );

  // ─── Derived State ────────────────────────────────────────────

  const themeColors = useMemo(() => getThemeColors(settings.theme, settings.highContrast), [settings.theme, settings.highContrast]);
  const textSizeClass = useMemo(() =>
    settings.textSize === 'large' ? 'text-lg' : settings.textSize === 'xl' ? 'text-xl' : 'text-base',
    [settings.textSize]);

  const filteredFriends = useMemo(() => {
    return friends.filter(f => {
      if (selectedCategory !== 'All' && f.category !== selectedCategory) return false;
      if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !f.notes?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (healthFilter !== 'All') {
        const { percentageLeft } = calculateTimeStatus(f.lastContacted, f.frequencyDays);
        if (healthFilter === 'Withering' && percentageLeft > 0) return false;
        if (healthFilter === 'Wilting' && (percentageLeft <= 0 || percentageLeft >= 25)) return false;
        if (healthFilter === 'Healthy' && percentageLeft < 25) return false;
      }
      return true;
    });
  }, [friends, selectedCategory, searchQuery, healthFilter]);

  const sortedFriends = useMemo(() => {
    // Reference activeTab so switching to LIST triggers a re-sort (prevents scroll jumps)
    void activeTab;
    return [...filteredFriends].sort((a, b) => {
      const aLeft = calculateTimeStatus(a.lastContacted, a.frequencyDays).percentageLeft;
      const bLeft = calculateTimeStatus(b.lastContacted, b.frequencyDays).percentageLeft;
      return aLeft - bLeft;
    });
  }, [filteredFriends, activeTab]);

  // ─── Handlers ─────────────────────────────────────────────────

  // Log wrappers that also keep editingFriend in sync
  const deleteLog = (friendId: string, logId: string) => {
    ctxDeleteLog(friendId, logId);
    if (editingFriend?.id === friendId) {
      setEditingFriend(prev => prev ? { ...prev, logs: prev.logs.filter(l => l.id !== logId) } : null);
    }
  };

  const editLog = (friendId: string, logId: string, updates: { channel?: ContactChannel; date?: string }) => {
    ctxEditLog(friendId, logId, updates);
    if (editingFriend?.id === friendId) {
      setEditingFriend(prev => prev ? editFriendLog(prev, logId, updates) : null);
    }
  };

  const handleAddPastInteraction = (friendId: string, channel: ContactChannel, date: string) => {
    ctxAddPastInteraction(friendId, channel, date);
    if (editingFriend?.id === friendId) {
      setEditingFriend(prev => prev ? addPastLogFn(prev, channel, date) : null);
    }
  };

  const handleSaveFriend = (friend: Friend) => {
    ctxSaveFriend(friend, !!editingFriend);
    setEditingFriend(null);
  };

  const handleAddCategory = (newCat: string) => addCategory(newCat);

  const openEditModal = useCallback((friend: Friend) => {
    setEditingFriend(friend);
    setIsModalOpen(true);
  }, []);

  const handleBulkImport = useCallback((newFriends: Friend[]) => {
    bulkImportFriends(newFriends);
    showToast(`Successfully imported ${newFriends.length} contacts!`);
  }, [bulkImportFriends, showToast]);

  const handleRequestMeeting = useCallback((friend: Friend) => {
    addMeetingRequest({
      id: generateId(),
      name: friend.name,
      status: 'REQUESTED',
      dateAdded: new Date().toISOString(),
      linkedIds: [friend.id],
      category: friend.category === 'Family' ? 'Family' : 'Friend'
    });
    trackEvent('MEETING_CREATED', { friendId: friend.id });
    setActiveTab(Tab.MEETINGS);
  }, [addMeetingRequest]);

  const handleApplyNudge = useCallback((friendId: string, newFrequencyDays: number) => {
    setFriends(prev => prev.map(f => f.id === friendId ? { ...f, frequencyDays: newFrequencyDays } : f));
    showToast(`Cadence updated to ${newFrequencyDays} days`, 'success');
  }, [setFriends, showToast]);

  const handleMeetingFollowUpConfirm = useCallback((meetingId: string, linkedIds: string[]) => {
    linkedIds.forEach(id => markContacted(id, 'in-person'));
    if (linkedIds.length > 0) showToast(`Marked ${linkedIds.length} contact${linkedIds.length > 1 ? 's' : ''} as updated`, 'success');
    setMeetingRequests(prev => prev.map(r =>
      r.id === meetingId ? { ...r, status: 'COMPLETE' as const, verified: true } : r
    ));
    trackEvent('MEETING_COMPLETED', { meetingId, participantCount: linkedIds.length });
    setMeetingFollowUp(null);
  }, [markContacted, showToast, setMeetingRequests]);

  const handleMeetingFollowUpDismiss = useCallback((meetingId: string) => {
    setMeetingRequests(prev => prev.map(r =>
      r.id === meetingId ? { ...r, status: 'COMPLETE' as const, verified: false } : r
    ));
    trackEvent('MEETING_DISMISSED', { meetingId });
    setMeetingFollowUp(null);
  }, [setMeetingRequests]);

  const handleGroupContact = useCallback((memberIds: string[], channel: ContactChannel) => {
    memberIds.forEach(id => markContacted(id, channel));
    showToast(`Contacted ${memberIds.length} friend${memberIds.length > 1 ? 's' : ''}!`, 'success');
    setIsGroupManagementOpen(false);
  }, [markContacted, showToast]);

  const handleSelectCategory = useCallback((cat: string) => setSelectedCategory(cat), []);
  const handleNavigateToFriend = useCallback((name: string) => { setActiveTab(Tab.LIST); setSearchQuery(name); }, []);
  const handleNavigateToMeetings = useCallback(() => setActiveTab(Tab.MEETINGS), []);

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div
      data-theme={settings.theme}
      className={`h-full w-full ${themeColors.bg} ${themeColors.textMain} ${textSizeClass} transition-colors duration-300 flex flex-col relative ${settings.reducedMotion ? 'motion-reduce' : ''} ${settings.highContrast ? 'contrast-125' : ''}`}
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {showBackupBanner && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[90] w-[90%] max-w-sm bg-blue-50 border border-blue-200 rounded-md shadow-lg p-4 animate-in slide-in-from-top fade-in duration-300">
          <p className="text-sm font-bold text-blue-800 mb-2">Backup Reminder</p>
          <p className="text-xs text-blue-600 mb-3">It's been a while since your last backup. Download one now?</p>
          <div className="flex gap-2">
            <button
              onClick={() => { triggerBackupDownload(); setShowBackupBanner(false); }}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg"
            >
              <Download size={14} /> Download Backup
            </button>
            <button onClick={() => setShowBackupBanner(false)} className="px-4 bg-blue-100 text-blue-700 text-xs font-bold py-2 rounded-lg">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <header className={`px-4 sm:px-6 pt-8 pb-4 ${themeColors.bg}/95 backdrop-blur-md sticky top-0 z-30 border-b ${themeColors.border} transition-colors duration-300`} role="banner">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setActiveTab(Tab.HOME)} className="text-left">
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <LayoutGrid className="text-slate-700" />
              Pal Plant
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest mt-0.5 opacity-60" aria-live="polite">
              {activeTab === Tab.HOME ? 'Overview' : activeTab === Tab.LIST ? 'Contacts' : activeTab === Tab.STATS ? 'Stats' : 'Meetings'}
            </p>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`w-10 h-10 rounded-md flex items-center justify-center shadow-sm border ${themeColors.border} ${themeColors.cardBg} active:scale-95 transition-transform app-pill-btn`}
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
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${themeColors.cardBg} pl-10 pr-4 py-2 rounded-md text-sm border ${themeColors.border} focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all`}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
              <button onClick={() => handleSelectCategory('All')} className={`whitespace-nowrap px-4 py-1.5 rounded-md text-xs font-bold transition-all ${selectedCategory === 'All' ? `${themeColors.primary} text-white` : `${themeColors.cardBg} ${themeColors.textSub}`}`}>All</button>
              {categories.map(cat => (
                <button key={cat} onClick={() => handleSelectCategory(cat)} className={`whitespace-nowrap px-4 py-1.5 rounded-md text-xs font-bold transition-all ${selectedCategory === cat ? `${themeColors.primary} text-white` : `${themeColors.cardBg} ${themeColors.textSub}`}`}>{cat}</button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
              <button onClick={() => setHealthFilter('All')} className={`whitespace-nowrap px-4 py-1.5 rounded-md text-xs font-bold transition-all ${healthFilter === 'All' ? 'bg-slate-600 text-white' : `${themeColors.cardBg} ${themeColors.textSub}`}`}>All Health</button>
              <button onClick={() => setHealthFilter('Healthy')} className={`whitespace-nowrap px-4 py-1.5 rounded-md text-xs font-bold transition-all ${healthFilter === 'Healthy' ? 'bg-emerald-500 text-white' : `${themeColors.cardBg} ${themeColors.textSub}`}`}>Healthy</button>
              <button onClick={() => setHealthFilter('Wilting')} className={`whitespace-nowrap px-4 py-1.5 rounded-md text-xs font-bold transition-all ${healthFilter === 'Wilting' ? 'bg-yellow-500 text-white' : `${themeColors.cardBg} ${themeColors.textSub}`}`}>Needs follow-up</button>
              <button onClick={() => setHealthFilter('Withering')} className={`whitespace-nowrap px-4 py-1.5 rounded-md text-xs font-bold transition-all ${healthFilter === 'Withering' ? 'bg-red-500 text-white' : `${themeColors.cardBg} ${themeColors.textSub}`}`}>
                <Skull size={12} className="inline -mt-0.5" /> Withering
              </button>
            </div>

            <div className="flex flex-col gap-2 min-[480px]:flex-row min-[480px]:justify-between min-[480px]:items-center text-xs font-bold text-slate-600 px-1 mt-2">
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setIsBulkImportOpen(true)} className="underline decoration-dotted underline-offset-4">Import contacts</button>
                <button onClick={() => setIsGroupManagementOpen(true)} className="underline decoration-dotted underline-offset-4 flex items-center gap-1">
                  <Users size={12} /> Manage Groups ({groups.length})
                </button>
              </div>
              <button onClick={openAddModal} className="text-emerald-700">Add contact</button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-4 sm:px-6 sm:pt-6 pb-40 max-w-2xl mx-auto w-full relative z-[1]">
        {activeTab === Tab.HOME && (
          <section className={`mb-4 ${themeColors.cardBg} border ${themeColors.border} rounded-sm`}>
            <p className={`px-3 py-2 text-[11px] uppercase tracking-wide ${themeColors.textSub}`}>Discovery Shelf</p>
            <div className="flex overflow-x-auto divide-x divide-brand-tan">
              <button onClick={() => setActiveTab(Tab.LIST)} className="px-4 py-3 text-xs font-semibold whitespace-nowrap hover:bg-brand-cream/50">Open Contacts</button>
              <button onClick={() => setActiveTab(Tab.MEETINGS)} className="px-4 py-3 text-xs font-semibold whitespace-nowrap hover:bg-brand-cream/50">Review Meetings</button>
              <button onClick={() => setIsGroupManagementOpen(true)} className="px-4 py-3 text-xs font-semibold whitespace-nowrap hover:bg-brand-cream/50">Manage Groups</button>
              <button onClick={openAddModal} className="px-4 py-3 text-xs font-semibold whitespace-nowrap hover:bg-brand-cream/50">Add Contact</button>
            </div>
          </section>
        )}

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
              <div className="flex flex-col items-center justify-center h-64 text-center app-empty-state">
                <div className={`w-16 h-16 rounded-md flex items-center justify-center mb-4 opacity-70 ${themeColors.cardBg}`}>
                  <Users size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold">No contacts yet</h3>
                <p className="text-xs opacity-60 mt-1">Add your first contact to start building your relationship dashboard.</p>
                <button onClick={openAddModal} className="mt-6 font-bold text-sm underline opacity-80">Add your first contact</button>
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
              className={`fixed bottom-28 right-4 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-md flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all ${themeColors.primary} z-40`}
            >
              <Plus size={24} className="sm:w-7 sm:h-7" strokeWidth={3} />
            </button>
          </>
        ) : activeTab === Tab.STATS ? (
          <Suspense fallback={<div className="text-center py-10 opacity-60">Loading statistics…</div>}>
            <StatsView friends={friends} />
          </Suspense>
        ) : (
          <MeetingRequestsView
            requests={meetingRequests}
            onAddRequest={addMeetingRequest}
            onUpdateRequest={updateMeetingRequest}
            onDeleteRequest={deleteMeetingRequest}
            settings={settings}
            friends={friends}
          />
        )}
      </main>

      {/* Mobile nav */}
      <nav className={`fixed bottom-0 w-full ${themeColors.cardBg} border-t ${themeColors.border} px-3 py-3 pb-5 z-40 flex justify-between items-center sm:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors duration-300`} role="navigation" aria-label="Main navigation">
        <button onClick={() => setActiveTab(Tab.HOME)} aria-current={activeTab === Tab.HOME ? 'page' : undefined} aria-label="Home" className={`flex flex-col items-center gap-1 w-1/4 transition-opacity ${activeTab === Tab.HOME ? 'opacity-100 scale-110 nav-tab-active' : 'opacity-40'}`}><Home size={24} aria-hidden="true" /><span className="text-[10px] font-bold">Home</span></button>
        <button onClick={() => setActiveTab(Tab.LIST)} aria-current={activeTab === Tab.LIST ? 'page' : undefined} aria-label="Contacts" className={`flex flex-col items-center gap-1 w-1/4 transition-opacity ${activeTab === Tab.LIST ? 'opacity-100 scale-110 nav-tab-active' : 'opacity-40'}`}><Users size={24} aria-hidden="true" /><span className="text-[10px] font-bold">Contacts</span></button>
        <button onClick={() => setActiveTab(Tab.STATS)} aria-current={activeTab === Tab.STATS ? 'page' : undefined} aria-label="Statistics" className={`flex flex-col items-center gap-1 w-1/4 transition-opacity ${activeTab === Tab.STATS ? 'opacity-100 scale-110 nav-tab-active' : 'opacity-40'}`}><BarChart3 size={24} aria-hidden="true" /><span className="text-[10px] font-bold">Stats</span></button>
        <button onClick={() => setActiveTab(Tab.MEETINGS)} aria-current={activeTab === Tab.MEETINGS ? 'page' : undefined} aria-label="Meeting requests" className={`flex flex-col items-center gap-1 w-1/4 transition-opacity ${activeTab === Tab.MEETINGS ? 'opacity-100 scale-110 nav-tab-active' : 'opacity-40'}`}><Calendar size={24} aria-hidden="true" /><span className="text-[10px] font-bold">Requests</span></button>
      </nav>

      {/* Desktop nav */}
      <div className={`hidden sm:flex fixed bottom-6 left-1/2 -translate-x-1/2 ${themeColors.cardBg}/90 backdrop-blur-md border ${themeColors.border} shadow-xl rounded-md px-2 py-2 gap-2 z-40`} role="navigation" aria-label="Main navigation">
        <button onClick={() => setActiveTab(Tab.HOME)} aria-current={activeTab === Tab.HOME ? 'page' : undefined} className={`px-6 py-2.5 rounded-md text-sm font-bold transition-all ${activeTab === Tab.HOME ? `${themeColors.primary} ${themeColors.primaryText}` : `${themeColors.textSub} hover:bg-white/10`}`}>Home</button>
        <button onClick={() => setActiveTab(Tab.LIST)} aria-current={activeTab === Tab.LIST ? 'page' : undefined} className={`px-6 py-2.5 rounded-md text-sm font-bold transition-all ${activeTab === Tab.LIST ? `${themeColors.primary} ${themeColors.primaryText}` : `${themeColors.textSub} hover:bg-white/10`}`}>Garden</button>
        <button onClick={() => setActiveTab(Tab.STATS)} aria-current={activeTab === Tab.STATS ? 'page' : undefined} className={`px-6 py-2.5 rounded-md text-sm font-bold transition-all ${activeTab === Tab.STATS ? `${themeColors.primary} ${themeColors.primaryText}` : `${themeColors.textSub} hover:bg-white/10`}`}>Stats</button>
        <button onClick={() => setActiveTab(Tab.MEETINGS)} aria-current={activeTab === Tab.MEETINGS ? 'page' : undefined} className={`px-6 py-2.5 rounded-md text-sm font-bold transition-all ${activeTab === Tab.MEETINGS ? `${themeColors.primary} ${themeColors.primaryText}` : `${themeColors.textSub} hover:bg-white/10`}`}>Requests</button>
      </div>

      {/* Modals */}
      <FriendModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFriend}
        onDeleteLog={deleteLog}
        onEditLog={editLog}
        onAddPastInteraction={handleAddPastInteraction}
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

      {meetingFollowUp && (
        <Suspense fallback={null}>
          <MeetingFollowUpModal
            isOpen={!!meetingFollowUp}
            onClose={() => setMeetingFollowUp(null)}
            meeting={meetingFollowUp}
            friends={friends}
            onConfirm={handleMeetingFollowUpConfirm}
            onDismiss={handleMeetingFollowUpDismiss}
          />
        </Suspense>
      )}

      {isGroupManagementOpen && (
        <Suspense fallback={null}>
          <GroupManagementModal
            isOpen={isGroupManagementOpen}
            onClose={() => setIsGroupManagementOpen(false)}
            groups={groups}
            friends={friends}
            onSaveGroups={setGroups}
            onContactGroup={handleGroupContact}
          />
        </Suspense>
      )}

      <ShortcutsModal />
    </div>
  );
};

export default App;
