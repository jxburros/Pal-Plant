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

import React, { useState, useEffect, useRef } from 'react';
import { X, User, Phone, Calendar, Mail, Upload, Tags, FileText, History, Trash2, Gift, BookUser } from 'lucide-react';
import { Friend, ContactLog } from '../types';
import { generateId, fileToBase64, calculateTimeStatus, getInitials, getAvatarColor, sanitizeText, sanitizePhone, isValidEmail } from '../utils/helpers';
import { pickSingleContact, isContactPickerAvailable } from '../utils/contacts';

interface FriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (friend: Friend) => void;
  onDeleteLog?: (friendId: string, logId: string) => void;
  initialData?: Friend | null;
  categories: string[];
  onAddCategory: (category: string) => void;
}

const FriendModal: React.FC<FriendModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDeleteLog,
  initialData,
  categories,
  onAddCategory
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Friends');
  const [frequency, setFrequency] = useState(7);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string>('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [contactImportLoading, setContactImportLoading] = useState(false);

  // Birthday State
  const [bdayMonth, setBdayMonth] = useState('1');
  const [bdayDay, setBdayDay] = useState('1');
  const [hasBirthday, setHasBirthday] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setEmailError('');
      setUploadError('');
      if (initialData) {
        setName(initialData.name);
        setPhone(initialData.phone || (initialData as any).contactInfo || '');
        setEmail(initialData.email || '');
        setCategory(initialData.category || 'Friends');
        setFrequency(initialData.frequencyDays);
        setNotes(initialData.notes || '');
        setPhoto(initialData.photo || '');

        if (initialData.birthday) {
          setHasBirthday(true);
          const [m, d] = initialData.birthday.split('-');
          setBdayMonth(String(parseInt(m, 10)));
          setBdayDay(String(parseInt(d, 10)));
        } else {
          setHasBirthday(false);
        }

      } else {
        setName('');
        setPhone('');
        setEmail('');
        setCategory(categories[0] || 'Friends');
        setFrequency(7);
        setNotes('');
        setPhoto('');
        setHasBirthday(false);
      }
      setIsAddingCategory(false);
      setNewCategoryName('');
    }
  }, [isOpen, initialData, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = sanitizeText(name, 100);
    if (!trimmedName) return;

    // Validate email
    const trimmedEmail = email.trim();
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');

    const cleanPhone = sanitizePhone(phone);
    const cleanNotes = sanitizeText(notes, 1000);
    const clampedFrequency = Math.max(1, Math.min(365, frequency));

    const baseData = initialData || {
      id: generateId(),
      lastContacted: new Date().toISOString(),
      logs: [],
      individualScore: 50,
      quickTouchesAvailable: 0,
      cyclesSinceLastQuickTouch: 0
    };

    const friendToSave: Friend = {
      ...baseData,
      name: trimmedName,
      phone: cleanPhone || undefined,
      email: trimmedEmail || undefined,
      category,
      frequencyDays: clampedFrequency,
      photo,
      notes: cleanNotes || undefined,
      birthday: hasBirthday ? `${bdayMonth.padStart(2, '0')}-${bdayDay.padStart(2, '0')}` : undefined,
    };

    onSave(friendToSave);
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setUploadError('');
        const base64 = await fileToBase64(e.target.files[0]);
        setPhoto(base64);
      } catch {
        setUploadError("Could not upload image.");
      }
    }
  };

  const handleAddNewCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setCategory(newCategoryName.trim());
      setIsAddingCategory(false);
      setNewCategoryName('');
    }
  };

  const handleImportFromContact = async () => {
    setContactImportLoading(true);
    setUploadError('');
    try {
      const contact = await pickSingleContact();
      if (contact) {
        if (contact.name) setName(contact.name);
        if (contact.phone) setPhone(contact.phone);
        if (contact.email) setEmail(contact.email);
      }
    } catch (error: any) {
      if (error?.message === 'PERMISSION_DENIED') {
        setUploadError('Contact permission was denied. Please allow access in your device settings.');
      } else if (error?.message === 'UNSUPPORTED') {
        setUploadError('Contact picker is not available on this device/browser.');
      } else {
        setUploadError('Could not import contact. Please try again.');
      }
    } finally {
      setContactImportLoading(false);
    }
  };

  // Calculate stats for edit view
  let onTimePercentage = 0;
  let logsSorted: ContactLog[] = [];

  if (initialData) {
    logsSorted = [...initialData.logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const validLogs = initialData.logs.filter(l => l.percentageRemaining !== undefined);
    if (validLogs.length > 0) {
      const onTimeCount = validLogs.filter(l => l.percentageRemaining >= 0).length;
      onTimePercentage = Math.round((onTimeCount / validLogs.length) * 100);
    } else {
      onTimePercentage = 100;
    }
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = Array.from({length: 31}, (_, i) => i + 1);

  const avatarColor = getAvatarColor(name || 'A');
  const initials = getInitials(name || 'A');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={onClose} />

      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-in slide-in-from-bottom duration-300 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {initialData ? 'Edit Details' : 'Add New Friend'}
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar / Photo Section */}
          <div className="flex flex-col items-center justify-center mb-4">
             <div className="relative group">
                <div
                  className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shadow-sm cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                   {photo ? (
                     <img
                        src={photo}
                        className="w-full h-full object-cover"
                        alt="Avatar"
                     />
                   ) : (
                     <div
                       className="w-full h-full flex items-center justify-center text-white font-bold text-3xl"
                       style={{ backgroundColor: avatarColor }}
                     >
                       {initials}
                     </div>
                   )}
                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                      <Upload className="text-white" size={24} />
                   </div>
                </div>
                {/* Remove Photo Button */}
                {photo && (
                  <button type="button" onClick={() => setPhoto('')} className="absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition-colors" title="Remove Photo">
                     <X size={14} />
                  </button>
                )}
             </div>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
             <p className="text-xs text-slate-400 mt-2 font-medium">Tap image to upload</p>
             {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
          </div>

          {/* Import from Contacts */}
          {isContactPickerAvailable() && (
            <button
              type="button"
              onClick={handleImportFromContact}
              disabled={contactImportLoading}
              className="w-full py-2.5 rounded-xl border border-blue-200 bg-blue-50 font-bold text-blue-700 hover:bg-blue-100 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <BookUser size={16} />
              {contactImportLoading ? 'Loading contact…' : (initialData ? 'Update from device contacts' : 'Pick from device contacts')}
            </button>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. John Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium"
                  required
                  maxLength={100}
                />
              </div>
            </div>

            {/* Birthday Section */}
             <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 cursor-pointer">
                   <input type="checkbox" checked={hasBirthday} onChange={e => setHasBirthday(e.target.checked)} className="rounded text-brand-500 focus:ring-brand-500" />
                   Has Birthday?
                </label>
                {hasBirthday && (
                   <div className="relative flex gap-2 animate-in fade-in slide-in-from-top-2">
                     <Gift className="absolute left-3 top-3.5 text-slate-400" size={18} />
                     <div className="flex-1 pl-10 grid grid-cols-2 gap-2">
                        <select
                           value={bdayMonth}
                           onChange={e => setBdayMonth(e.target.value)}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                           {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                        </select>
                         <select
                           value={bdayDay}
                           onChange={e => setBdayDay(e.target.value)}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                           {days.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                     </div>
                   </div>
                )}
             </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-sm"
                    maxLength={30}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    placeholder="Email address"
                    className={`w-full bg-slate-50 border rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-sm ${emailError ? 'border-red-300' : 'border-slate-200'}`}
                    maxLength={254}
                  />
                </div>
                {emailError && <p className="text-[10px] text-red-500 mt-1">{emailError}</p>}
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
            <div className="relative">
              <Tags className="absolute left-3 top-3.5 text-slate-400" size={18} />
              {!isAddingCategory ? (
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') setIsAddingCategory(true);
                    else setCategory(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white appearance-none text-slate-700"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  <option value="__NEW__">+ Create New Category...</option>
                </select>
              ) : (
                <div className="flex gap-2">
                   <input
                      autoFocus
                      placeholder="New Category Name"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      className="flex-1 bg-white border border-brand-300 rounded-xl py-3 pl-10 pr-4 focus:outline-none ring-2 ring-brand-500"
                      maxLength={50}
                   />
                   <button type="button" onClick={handleAddNewCategory} className="bg-brand-600 text-white px-4 rounded-xl font-bold">Add</button>
                   <button type="button" onClick={() => setIsAddingCategory(false)} className="bg-slate-200 text-slate-600 px-3 rounded-xl"><X size={18}/></button>
                </div>
              )}
            </div>
          </div>

          {/* Frequency */}
          <div>
             <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Frequency</label>
                <span className="text-sm font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">Every {frequency} days</span>
             </div>
             <div className="relative">
               <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18} />
               <input
                 type="number"
                 min="1"
                 max="365"
                 value={frequency}
                 onChange={(e) => setFrequency(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-bold text-slate-700"
               />
             </div>
             <input
                type="range"
                min="1"
                max="60"
                value={frequency}
                onChange={(e) => setFrequency(parseInt(e.target.value))}
                className="w-full mt-4 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
             />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Important details, birthday, etc."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-sm h-24 resize-none"
                maxLength={1000}
              />
            </div>
          </div>

          {/* Stats & History (Only if editing) */}
          {initialData && (
             <div className="border-t border-slate-100 pt-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><History size={18}/> Interaction History</h3>
                   <span className={`px-2 py-1 rounded-md text-xs font-bold ${onTimePercentage >= 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {onTimePercentage}% On Time
                   </span>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                   {logsSorted.slice(0, 10).map(log => (
                      <div key={log.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                         <div>
                            <p className="font-medium text-slate-700">{new Date(log.date).toLocaleDateString()}</p>
                            <p className="text-[10px] text-slate-400">{new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className={`text-xs ${log.percentageRemaining < 0 ? 'text-red-500' : 'text-green-500'}`}>
                               {log.percentageRemaining < 0 ? 'Late' : 'On Time'}
                            </span>
                            {onDeleteLog && (
                              <button
                                type="button"
                                onClick={() => onDeleteLog(initialData.id, log.id)}
                                className="text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                         </div>
                      </div>
                   ))}
                   {logsSorted.length === 0 && <p className="text-sm text-slate-400 italic">No interaction history.</p>}
                </div>
             </div>
          )}

          <button
            type="submit"
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-4 active:scale-[0.98] transition-all hover:shadow-lg shadow-brand-500/20"
          >
            {initialData ? 'Save Changes' : 'Start Tracking'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FriendModal;
