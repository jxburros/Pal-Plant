/**
 * DataWarningModal Component
 *
 * Shows a one-time warning to users about the local-first data storage model.
 * Educates users about data persistence, backup importance, and single-device limitations.
 *
 * @module DataWarningModal
 */

import React from 'react';
import { AlertTriangle, Download, HardDrive, X } from 'lucide-react';
import { AppSettings } from '../types';
import { THEMES } from '../utils/helpers';

interface DataWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
}

const DataWarningModal: React.FC<DataWarningModalProps> = ({ isOpen, onClose, settings }) => {
  const theme = THEMES[settings.theme];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`${theme.cardBg} rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border ${theme.border} animate-in slide-in-from-bottom fade-in duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 px-6 py-4 border-b ${theme.border} ${theme.cardBg}/95 backdrop-blur-md flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="text-amber-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black">Important: Your Data</h2>
              <p className="text-xs opacity-60 font-bold">Local-first storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${theme.textSub} hover:bg-black/5 active:scale-95 transition-all`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <HardDrive className="text-blue-500 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-bold text-sm mb-1">Your data lives on this device only</h3>
                <p className="text-sm opacity-75 leading-relaxed">
                  Pal Plant stores all your relationship data <strong>locally on this device</strong>.
                  This means your data is private and never sent to external servers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Download className="text-emerald-500 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-bold text-sm mb-1">Regular backups are essential</h3>
                <p className="text-sm opacity-75 leading-relaxed">
                  Because your data exists only on this device, <strong>you should create regular backups</strong>.
                  If you clear browser data, lose your device, or switch browsers, your data will be lost unless you have a backup.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-bold text-sm mb-1">Single-device limitation</h3>
                <p className="text-sm opacity-75 leading-relaxed">
                  Your data does not automatically sync across devices.
                  To move data to another device, you'll need to <strong>export from one device and import to another</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl ${theme.primary}/10 border ${theme.primary}/20`}>
            <p className="text-sm font-bold mb-2">💡 How to backup your data:</p>
            <ol className="text-sm opacity-75 space-y-1 ml-4 list-decimal">
              <li>Open Settings (gear icon in top right)</li>
              <li>Scroll to "Backup & Restore"</li>
              <li>Click "Download Backup" to save a JSON file</li>
              <li>Store the file somewhere safe (cloud storage, email, etc.)</li>
            </ol>
            <p className="text-xs opacity-60 mt-2">
              💡 Tip: Enable automatic backup reminders in Settings
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${theme.border} flex gap-3`}>
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl font-bold text-sm ${theme.primary} text-white active:scale-98 transition-transform shadow-sm`}
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataWarningModal;
