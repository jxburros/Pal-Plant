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

import React, { useEffect, useState } from 'react';
import { X, Keyboard } from 'lucide-react';
import { Tab } from '../types';

interface KeyboardShortcutsProps {
  onNavigate: (tab: Tab) => void;
  onOpenAddModal: () => void;
  onOpenSettings: () => void;
}

interface ShortcutInfo {
  key: string;
  description: string;
}

const shortcuts: ShortcutInfo[] = [
  { key: 'H', description: 'Go to Home' },
  { key: 'G', description: 'Go to Garden (Friends List)' },
  { key: 'M', description: 'Go to Meeting Requests' },
  { key: 'N', description: 'Add New Friend' },
  { key: 'S', description: 'Open Settings' },
  { key: '?', description: 'Show Keyboard Shortcuts' },
  { key: 'Esc', description: 'Close Modal / Dialog' },
];

const KeyboardShortcutsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white w-full max-w-md rounded-3xl p-6 relative z-10 animate-in zoom-in-95 fade-in duration-200 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Keyboard size={20} className="text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((shortcut) => (
            <div 
              key={shortcut.key}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
            >
              <span className="text-slate-700">{shortcut.description}</span>
              <kbd className="px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-sm font-mono font-bold text-slate-700 shadow-sm">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">Esc</kbd> to close this dialog
        </p>
      </div>
    </div>
  );
};

export const useKeyboardShortcuts = (
  onNavigate: (tab: Tab) => void,
  onOpenAddModal: () => void,
  onOpenSettings: () => void
) => {
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();

      switch (key) {
        case 'h':
          e.preventDefault();
          onNavigate(Tab.HOME);
          break;
        case 'g':
          e.preventDefault();
          onNavigate(Tab.LIST);
          break;
        case 'm':
          e.preventDefault();
          onNavigate(Tab.MEETINGS);
          break;
        case 'n':
          e.preventDefault();
          onOpenAddModal();
          break;
        case 's':
          e.preventDefault();
          onOpenSettings();
          break;
        case '?':
          e.preventDefault();
          setShowShortcutsModal(true);
          break;
        case 'escape':
          setShowShortcutsModal(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate, onOpenAddModal, onOpenSettings]);

  return {
    showShortcutsModal,
    setShowShortcutsModal,
    ShortcutsModal: () => (
      <KeyboardShortcutsModal 
        isOpen={showShortcutsModal} 
        onClose={() => setShowShortcutsModal(false)} 
      />
    )
  };
};

export default KeyboardShortcutsModal;
