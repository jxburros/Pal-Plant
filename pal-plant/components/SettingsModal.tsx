import React, { useRef, useState } from 'react';
import { X, Moon, Sun, Type, Eye, Monitor, Download, Upload, Database, Bell, Users, Clock, Keyboard, HelpCircle, CheckCircle2, BookOpen, Copy, Share2 } from 'lucide-react';
import { AppSettings, ThemeId } from '../types';
import { THEMES } from '../utils/helpers';
import { markBackupExportedNow } from '../hooks/useReminderEngine';
import { exportAllData, importAllData } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
  onOpenBulkImport?: () => void;
  onShowOnboarding?: () => void;
  onShowShortcuts?: () => void;
  onShowRuleGuide?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, settings, onUpdate, onOpenBulkImport, onShowOnboarding, onShowShortcuts, onShowRuleGuide
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  if (!isOpen) return null;

  const handleExport = async () => {
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
      markBackupExportedNow();
    } catch (error) {
      console.error('Error exporting data:', error);
      setImportStatus('error');
      setImportMessage('Error creating backup. Please try again.');
    }
  };

  const handleImportClick = () => {
    setImportStatus('idle');
    setImportMessage('');
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        try {
          await importAllData(json);
          setImportStatus('success');
          setImportMessage('Data restored successfully! Reloading...');
          setTimeout(() => window.location.reload(), 1500);
        } catch (storageError) {
          console.error('Error importing data:', storageError);
          setImportStatus('error');
          setImportMessage('Failed to save imported data. Please try again.');
        }
      } catch (parseError) {
        console.error('Error parsing backup file:', parseError);
        setImportStatus('error');
        setImportMessage('Invalid backup file format. Please check the file.');
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateReminders = (updates: Partial<typeof settings.reminders>) => {
    onUpdate({
      ...settings,
      reminders: {
        ...settings.reminders,
        ...updates
      }
    });
  };

  const notificationsSupported = typeof Notification !== 'undefined';
  const notificationPermission = notificationsSupported ? Notification.permission : 'denied';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className={`bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-in slide-in-from-bottom duration-300 shadow-2xl max-h-[80vh] overflow-y-auto ${settings.highContrast ? 'contrast-125' : ''}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">App Settings</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-8">
          {/* Themes */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sun size={16} /> Themes
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(THEMES) as ThemeId[]).map(id => (
                <button
                  key={id}
                  onClick={() => onUpdate({ ...settings, theme: id })}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${settings.theme === id ? 'border-slate-900 bg-slate-50' : 'border-transparent hover:bg-slate-50'}`}
                >
                  <div className={`w-8 h-8 rounded-full shadow-sm ${THEMES[id].primary}`}></div>
                  <span className="text-xs font-medium capitalize">{id}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Reminders */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Bell size={16} /> Reminders
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Bell size={20} className="text-slate-400" />
                  <span className="font-medium text-slate-700">Push Notifications</span>
                </div>
                <button
                  onClick={() => {
                    if (!notificationsSupported) return;
                    if (!settings.reminders?.pushEnabled) {
                      Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                          updateReminders({ pushEnabled: true });
                        }
                      });
                    } else {
                      updateReminders({ pushEnabled: !settings.reminders?.pushEnabled });
                    }
                  }}
                  disabled={!notificationsSupported}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.reminders?.pushEnabled ? 'bg-emerald-500' : 'bg-slate-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.reminders?.pushEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                {!notificationsSupported
                  ? 'Push notifications are not supported on this device/browser.'
                  : notificationPermission === 'denied'
                  ? 'Push notifications are blocked. Re-enable notification permission in your browser settings.'
                  : 'Push reminders are active through browser notifications when permission is granted.'}
              </p>
              {settings.reminders?.pushEnabled && (
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Remind me</span>
                  </div>
                  <select
                    value={settings.reminders?.reminderHoursBefore || 24}
                    onChange={(e) => updateReminders({ reminderHoursBefore: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                  >
                    <option value={1}>1 hour before</option>
                    <option value={3}>3 hours before</option>
                    <option value={24}>1 day before</option>
                    <option value={48}>2 days before</option>
                  </select>
                </div>
              )}


              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-700">Backup reminders</p>
                    <p className="text-xs text-slate-500">Get nudges to export a JSON backup regularly.</p>
                  </div>
                  <button
                    onClick={() => updateReminders({ backupReminderEnabled: !settings.reminders?.backupReminderEnabled })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${settings.reminders?.backupReminderEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.reminders?.backupReminderEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                {settings.reminders?.backupReminderEnabled && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remind every</label>
                    <select
                      value={settings.reminders?.backupReminderDays || 7}
                      onChange={(e) => updateReminders({ backupReminderDays: Number(e.target.value) })}
                      className="w-full mt-2 p-2 rounded-lg border border-slate-200 text-sm bg-white"
                    >
                      <option value={3}>3 days</option>
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Accessibility */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Eye size={16} /> Accessibility
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <Type size={20} className="text-slate-400" />
                   <span className="font-medium text-slate-700">Text Size</span>
                </div>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  {(['normal', 'large', 'xl'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => onUpdate({ ...settings, textSize: size })}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${settings.textSize === size ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                    >
                      {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                   <Moon size={20} className="text-slate-400" />
                   <span className="font-medium text-slate-700">High Contrast</span>
                </div>
                <button
                  onClick={() => onUpdate({ ...settings, highContrast: !settings.highContrast })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.highContrast ? 'bg-slate-900' : 'bg-slate-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.highContrast ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                   <Monitor size={20} className="text-slate-400" />
                   <span className="font-medium text-slate-700">Reduced Motion</span>
                </div>
                <button
                  onClick={() => onUpdate({ ...settings, reducedMotion: !settings.reducedMotion })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.reducedMotion ? 'bg-slate-900' : 'bg-slate-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.reducedMotion ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Keyboard Shortcuts Button */}
              {onShowShortcuts && (
                <button
                  onClick={onShowShortcuts}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Keyboard size={20} className="text-slate-400" />
                    <span className="font-medium text-slate-700">Keyboard Shortcuts</span>
                  </div>
                  <kbd className="px-2 py-1 bg-white rounded border border-slate-200 text-xs font-mono">?</kbd>
                </button>
              )}
            </div>
          </section>

           {/* Data Management */}
           <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Database size={16} /> Data Management
            </h3>
            <div className="grid grid-cols-2 gap-3">
               <button
                 onClick={handleExport}
                 className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
               >
                  <Download size={20} className="text-slate-700 mb-2" />
                  <span className="text-xs font-bold text-slate-700">Backup Data</span>
               </button>
               <button
                 onClick={handleImportClick}
                 className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
               >
                  <Upload size={20} className="text-slate-700 mb-2" />
                  <span className="text-xs font-bold text-slate-700">Restore Data</span>
               </button>
               <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
               />
            </div>

            {/* Import status feedback */}
            {importStatus !== 'idle' && (
              <div className={`mt-3 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                importStatus === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {importStatus === 'success' && <CheckCircle2 size={16} />}
                {importMessage}
              </div>
            )}

            {/* Bulk Import Button */}
            {onOpenBulkImport && (
              <button
                onClick={() => { onClose(); onOpenBulkImport(); }}
                className="w-full mt-3 flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
              >
                <Users size={20} className="text-blue-600" />
                <span className="text-sm font-bold text-blue-700">Import Contacts from CSV</span>
              </button>
            )}

            <p className="text-[10px] text-slate-400 mt-2 text-center">Data is stored locally on your device. Backup regularly to avoid loss.</p>
            <p className="text-[11px] text-slate-500 mt-2 text-center">Restore tip: tap "Restore Data", choose your latest backup JSON, and the app reloads automatically.</p>
          </section>

          {/* Sync & Export */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Share2 size={16} /> Sync & Export
            </h3>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    const data = await exportAllData();
                    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                    setCopyStatus('copied');
                    setTimeout(() => setCopyStatus('idle'), 2000);
                  } catch (error) {
                    console.error('Error copying data:', error);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <Copy size={20} className={copyStatus === 'copied' ? 'text-emerald-600' : 'text-slate-700'} />
                <span className={`text-sm font-bold ${copyStatus === 'copied' ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {copyStatus === 'copied' ? 'Copied to clipboard!' : 'Copy Data to Clipboard'}
                </span>
              </button>

              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  onClick={async () => {
                    try {
                      const data = await exportAllData();
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const file = new File([blob], `pal_plant_backup_${new Date().toISOString().split('T')[0]}.json`, { type: 'application/json' });
                      await navigator.share({ files: [file], title: 'Pal Plant Backup' });
                    } catch (error) {
                      // User cancelled or share failed
                      console.error('Error sharing:', error);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
                >
                  <Share2 size={20} className="text-purple-600" />
                  <span className="text-sm font-bold text-purple-700">Share Backup via...</span>
                </button>
              )}

              <p className="text-[10px] text-slate-400 text-center">
                Share your backup to Google Drive, iCloud, email, or any cloud service. Local-first — your data never leaves your device unless you choose to share.
              </p>
            </div>
          </section>

          {/* Help */}
          {(onShowOnboarding || onShowRuleGuide) && (
            <section>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <HelpCircle size={16} /> Help
              </h3>
              <div className="space-y-3">
                {onShowRuleGuide && (
                  <button
                    onClick={() => { onShowRuleGuide(); onClose(); }}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                  >
                    <BookOpen size={20} className="text-blue-600" />
                    <span className="text-sm font-bold text-blue-700">Scoring Rules & FAQ</span>
                  </button>
                )}
                {onShowOnboarding && (
                  <button
                    onClick={() => { onShowOnboarding(); onClose(); }}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  >
                    <HelpCircle size={20} className="text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-700">Show App Tour</span>
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
