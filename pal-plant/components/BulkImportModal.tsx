import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertTriangle, Check, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Friend } from '../types';
import { parseCSVContacts, detectDuplicates, generateId, THEMES } from '../utils/helpers';
import { AppSettings } from '../types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (friends: Friend[]) => void;
  existingFriends: Friend[];
  categories: string[];
  settings: AppSettings;
}

interface ParsedContact {
  name: string;
  phone?: string;
  email?: string;
  category?: string;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ 
  isOpen, onClose, onImport, existingFriends, categories, settings 
}) => {
  const [step, setStep] = useState<'upload' | 'review' | 'duplicates'>('upload');
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
  const [duplicates, setDuplicates] = useState<Array<{ newContact: ParsedContact; existingFriend: Friend; similarity: number }>>([]);
  const [defaultCategory, setDefaultCategory] = useState(categories[0] || 'Friends');
  const [defaultFrequency, setDefaultFrequency] = useState(7);
  const [showDuplicateDetails, setShowDuplicateDetails] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = THEMES[settings.theme];

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const contacts = parseCSVContacts(content);
      
      if (contacts.length === 0) {
        alert('No valid contacts found. Please ensure your CSV has a "name" column.');
        return;
      }

      setParsedContacts(contacts);
      setSelectedContacts(new Set(contacts.map((_, i) => i)));
      
      // Check for duplicates
      const dupes = detectDuplicates(contacts, existingFriends);
      setDuplicates(dupes);
      
      setStep('review');
    };
    reader.readAsText(file);
  };

  const handleToggleContact = (index: number) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === parsedContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(parsedContacts.map((_, i) => i)));
    }
  };

  const handleImport = () => {
    const contactsToImport = parsedContacts.filter((_, i) => selectedContacts.has(i));
    
    // Check for duplicates one more time
    const dupes = detectDuplicates(contactsToImport, existingFriends);
    
    if (dupes.length > 0 && step !== 'duplicates') {
      setDuplicates(dupes);
      setStep('duplicates');
      return;
    }

    const newFriends: Friend[] = contactsToImport.map(contact => ({
      id: generateId(),
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      category: contact.category || defaultCategory,
      frequencyDays: defaultFrequency,
      lastContacted: new Date().toISOString(),
      individualScore: 50,
      quickTouchesAvailable: 0,
      cyclesSinceLastQuickTouch: 0,
      logs: [],
      avatarSeed: Math.floor(Math.random() * 10000)
    }));

    onImport(newFriends);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep('upload');
    setParsedContacts([]);
    setSelectedContacts(new Set());
    setDuplicates([]);
    onClose();
  };

  const duplicateNames = new Set(duplicates.map(d => d.newContact.name.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={resetAndClose} />
      
      <div className={`bg-white w-full max-w-lg rounded-3xl p-6 relative z-10 animate-in slide-in-from-bottom duration-300 shadow-2xl max-h-[80vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Upload size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Import Contacts</h2>
              <p className="text-sm text-slate-500">
                {step === 'upload' && 'Upload a CSV file'}
                {step === 'review' && `${parsedContacts.length} contacts found`}
                {step === 'duplicates' && 'Review duplicates'}
              </p>
            </div>
          </div>
          <button onClick={resetAndClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
            >
              <FileText size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="font-bold text-slate-700">Click to upload CSV file</p>
              <p className="text-sm text-slate-500 mt-2">Required: name column</p>
              <p className="text-sm text-slate-500">Optional: phone, email, category</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".csv" 
              className="hidden" 
            />

            <div className="bg-slate-50 p-4 rounded-xl">
              <h4 className="font-bold text-sm text-slate-700 mb-2">CSV Format Example:</h4>
              <code className="text-xs text-slate-600 block bg-white p-3 rounded-lg border border-slate-200 font-mono">
                name,phone,email,category<br/>
                John Doe,555-1234,john@email.com,Friends<br/>
                Jane Smith,555-5678,jane@email.com,Family
              </code>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && (
          <div className="space-y-4">
            {/* Default settings */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Default Category</label>
                <select 
                  value={defaultCategory}
                  onChange={(e) => setDefaultCategory(e.target.value)}
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-sm"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Contact Frequency</label>
                <select 
                  value={defaultFrequency}
                  onChange={(e) => setDefaultFrequency(Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-sm"
                >
                  <option value={7}>Every 7 days</option>
                  <option value={14}>Every 14 days</option>
                  <option value={30}>Every 30 days</option>
                  <option value={60}>Every 60 days</option>
                </select>
              </div>
            </div>

            {/* Duplicate warning */}
            {duplicates.length > 0 && (
              <div 
                className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl cursor-pointer"
                onClick={() => setShowDuplicateDetails(!showDuplicateDetails)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertTriangle size={18} />
                    <span className="font-bold text-sm">{duplicates.length} potential duplicate(s) detected</span>
                  </div>
                  {showDuplicateDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {showDuplicateDetails && (
                  <div className="mt-3 space-y-2">
                    {duplicates.map((d, i) => (
                      <div key={i} className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                        "{d.newContact.name}" matches "{d.existingFriend.name}" ({d.similarity}% similar)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Select all */}
            <div className="flex items-center justify-between">
              <button 
                onClick={handleSelectAll}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {selectedContacts.size === parsedContacts.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-sm text-slate-500">
                {selectedContacts.size} of {parsedContacts.length} selected
              </span>
            </div>

            {/* Contact list */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {parsedContacts.map((contact, index) => {
                const isDuplicate = duplicateNames.has(contact.name.toLowerCase());
                return (
                  <div 
                    key={index}
                    onClick={() => handleToggleContact(index)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                      selectedContacts.has(index) 
                        ? isDuplicate ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'
                        : 'bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                      selectedContacts.has(index) ? 'bg-blue-500 border-blue-500' : 'border-slate-300'
                    }`}>
                      {selectedContacts.has(index) && <Check size={14} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{contact.name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {[contact.phone, contact.email, contact.category].filter(Boolean).join(' • ') || 'No additional info'}
                      </p>
                    </div>
                    {isDuplicate && (
                      <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setStep('upload')}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
              >
                Back
              </button>
              <button 
                onClick={handleImport}
                disabled={selectedContacts.size === 0}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors ${
                  selectedContacts.size > 0 ? `${theme.primary} hover:opacity-90` : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                Import {selectedContacts.size} Contacts
              </button>
            </div>
          </div>
        )}

        {/* Duplicates Step */}
        {step === 'duplicates' && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-yellow-700 mb-2">
                <AlertTriangle size={18} />
                <span className="font-bold">Confirm Import</span>
              </div>
              <p className="text-sm text-yellow-700">
                Some contacts may already exist. Do you want to continue importing?
              </p>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {duplicates.map((d, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl">
                  <p className="font-medium text-slate-800">"{d.newContact.name}"</p>
                  <p className="text-xs text-slate-500">
                    Similar to existing: "{d.existingFriend.name}" ({d.similarity}% match)
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setStep('review')}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
              >
                Go Back
              </button>
              <button 
                onClick={() => {
                  // Skip duplicates from selection
                  const newSelected = new Set(selectedContacts);
                  parsedContacts.forEach((contact, index) => {
                    if (duplicateNames.has(contact.name.toLowerCase())) {
                      newSelected.delete(index);
                    }
                  });
                  setSelectedContacts(newSelected);
                  // Force import
                  setStep('review');
                }}
                className="flex-1 py-3 rounded-xl border border-yellow-400 font-bold text-yellow-700 hover:bg-yellow-50"
              >
                Skip Duplicates
              </button>
              <button 
                onClick={() => {
                  // Import anyway - just call the parent import
                  const contactsToImport = parsedContacts.filter((_, i) => selectedContacts.has(i));
                  const newFriends: Friend[] = contactsToImport.map(contact => ({
                    id: generateId(),
                    name: contact.name,
                    phone: contact.phone,
                    email: contact.email,
                    category: contact.category || defaultCategory,
                    frequencyDays: defaultFrequency,
                    lastContacted: new Date().toISOString(),
                    individualScore: 50,
                    quickTouchesAvailable: 0,
                    cyclesSinceLastQuickTouch: 0,
                    logs: [],
                    avatarSeed: Math.floor(Math.random() * 10000)
                  }));
                  onImport(newFriends);
                  resetAndClose();
                }}
                className={`flex-1 py-3 rounded-xl font-bold text-white ${theme.primary}`}
              >
                Import Anyway
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkImportModal;
