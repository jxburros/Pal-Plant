import React, { useRef } from 'react';
import { X, Moon, Sun, Type, Eye, Monitor, Download, Upload, Database } from 'lucide-react';
import { AppSettings, ThemeId, Friend, MeetingRequest } from '../types';
import { THEMES } from '../utils/helpers';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const data = {
      friends: JSON.parse(localStorage.getItem('friendkeep_data') || '[]'),
      meetings: JSON.parse(localStorage.getItem('friendkeep_meetings') || '[]'),
      categories: JSON.parse(localStorage.getItem('friendkeep_categories') || '[]'),
      settings: JSON.parse(localStorage.getItem('friendkeep_settings') || '{}'),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pal_plant_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.friends) localStorage.setItem('friendkeep_data', JSON.stringify(json.friends));
        if (json.meetings) localStorage.setItem('friendkeep_meetings', JSON.stringify(json.meetings));
        if (json.categories) localStorage.setItem('friendkeep_categories', JSON.stringify(json.categories));
        if (json.settings) localStorage.setItem('friendkeep_settings', JSON.stringify(json.settings));
        
        alert('Data restored successfully! The app will reload.');
        window.location.reload();
      } catch (err) {
        alert('Invalid backup file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

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
            <p className="text-[10px] text-slate-400 mt-2 text-center">Data is stored locally on your device. Backup regularly to avoid loss.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;