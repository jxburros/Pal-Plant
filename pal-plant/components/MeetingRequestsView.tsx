import React, { useState, useRef } from 'react';
import { Calendar, UserPlus, X, Check, MapPin, Briefcase, Mail, Phone, Upload, Clock, Download, Users } from 'lucide-react';
import { MeetingRequest } from '../types';
import { generateId, fileToBase64, getMeetingUrgency, THEMES, downloadCalendarEvent } from '../utils/helpers';
import { AppSettings } from '../types';

interface MeetingRequestsViewProps {
  requests: MeetingRequest[];
  onAddRequest: (req: MeetingRequest) => void;
  onUpdateRequest: (req: MeetingRequest) => void;
  onDeleteRequest: (id: string) => void;
  settings: AppSettings;
}

const MeetingRequestsView: React.FC<MeetingRequestsViewProps> = ({ 
  requests, onAddRequest, onUpdateRequest, onDeleteRequest, settings 
}) => {
  const theme = THEMES[settings.theme];
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState('');
  const [category, setCategory] = useState<'Friend' | 'Family' | 'Business' | 'Other'>('Friend');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName(''); setOrg(''); setPhone(''); setEmail(''); setNotes(''); setPhoto(''); setCategory('Friend');
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      const existing = requests.find(r => r.id === editingId);
      if (existing) {
        onUpdateRequest({
          ...existing,
          name, organization: org, phone, email, notes, photo, category
        });
      }
    } else {
      onAddRequest({
        id: generateId(),
        name,
        organization: org,
        phone,
        email,
        notes,
        photo,
        category,
        status: 'REQUESTED',
        dateAdded: new Date().toISOString()
      });
    }
    resetForm();
  };

  const startEdit = (req: MeetingRequest) => {
    setName(req.name);
    setOrg(req.organization || '');
    setPhone(req.phone || '');
    setEmail(req.email || '');
    setNotes(req.notes || '');
    setPhoto(req.photo || '');
    setCategory(req.category || 'Friend');
    setEditingId(req.id);
    setIsAdding(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      setPhoto(base64);
    }
  };

  const handleSchedule = (req: MeetingRequest, dateStr: string, location: string) => {
    onUpdateRequest({
      ...req,
      status: 'SCHEDULED',
      scheduledDate: dateStr,
      location: location
    });
  };

  const handleComplete = (req: MeetingRequest) => {
    if (window.confirm('Mark this meeting as complete? It will be removed from the list.')) {
      onUpdateRequest({ ...req, status: 'COMPLETE' });
      // In a real app, maybe archive it instead of deleting, but prompt says "disappears"
      setTimeout(() => onDeleteRequest(req.id), 500);
    }
  };

  const activeRequests = requests.filter(r => r.status !== 'COMPLETE');

  return (
    <div className="pb-32">
       {/* Header */}
       <div className={`${theme.primary} p-6 rounded-3xl mb-6 shadow-lg text-white`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
               <Calendar size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold">Meeting Requests</h2>
          </div>
          <p className="text-sm opacity-80 leading-relaxed">
             Manage hangouts and business meetings. Watch the timer—don't keep them waiting!
          </p>
       </div>

       {/* Add / Edit Form */}
       {isAdding ? (
         <div className={`${theme.cardBg} p-5 rounded-2xl shadow-lg border ${theme.border} mb-6 animate-in slide-in-from-top fade-in`}>
           <div className="flex justify-between items-center mb-4">
             <h3 className={`font-bold uppercase tracking-wider ${theme.textSub}`}>
               {editingId ? 'Edit Request' : 'New Request'}
             </h3>
             <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded-full"><X size={18}/></button>
           </div>
           
           <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-center mb-2">
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-slate-500 transition-colors"
                 >
                    {photo ? (
                      <img src={photo} className="w-full h-full object-cover" alt="Preview"/>
                    ) : (
                      <Upload size={24} className="text-slate-400" />
                    )}
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
              </div>

              <input placeholder="Name *" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none border border-transparent focus:border-slate-300 transition-all" autoFocus />
              <div className="flex gap-2">
                <input placeholder="Organization" value={org} onChange={e => setOrg(e.target.value)} className="w-1/2 p-3 bg-slate-50 rounded-xl text-sm outline-none border border-transparent focus:border-slate-300 transition-all" />
                <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} className="w-1/2 p-3 bg-slate-50 rounded-xl text-sm outline-none border border-transparent focus:border-slate-300 transition-all" />
              </div>
              <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none border border-transparent focus:border-slate-300 transition-all" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none border border-transparent focus:border-slate-300 transition-all"
              >
                <option value="Friend">Friend</option>
                <option value="Family">Family</option>
                <option value="Business">Business</option>
                <option value="Other">Other</option>
              </select>
              <textarea placeholder="Notes..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none border border-transparent focus:border-slate-300 transition-all h-20 resize-none" />

              <button type="submit" className={`w-full ${theme.primary} ${theme.primaryText} py-3 rounded-xl font-bold`}>
                {editingId ? 'Update Request' : 'Add Request'}
              </button>
           </form>
         </div>
       ) : (
         <button 
           onClick={() => setIsAdding(true)}
           className={`w-full py-4 border-2 border-dashed ${theme.border} rounded-2xl ${theme.textSub} font-bold text-sm hover:bg-white transition-all mb-6 flex items-center justify-center gap-2`}
         >
           <UserPlus size={18} />
           Add Manual Request
         </button>
       )}

       {/* List */}
       <div className="space-y-4">
         {activeRequests.length === 0 && !isAdding && (
           <div className={`text-center py-10 ${theme.textSub}`}>
             <p>No pending requests.</p>
           </div>
         )}

         {activeRequests.map(req => (
           <MeetingCard 
             key={req.id} 
             req={req} 
             theme={theme}
             onEdit={() => startEdit(req)}
             onSchedule={(date, loc) => handleSchedule(req, date, loc)}
             onComplete={() => handleComplete(req)}
           />
         ))}
       </div>
    </div>
  );
};

// Sub-component for individual cards to handle internal schedule state
const MeetingCard: React.FC<{
  req: MeetingRequest;
  theme: any;
  onEdit: () => void;
  onSchedule: (date: string, loc: string) => void;
  onComplete: () => void;
}> = ({ req, theme, onEdit, onSchedule, onComplete }) => {
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedDate, setSchedDate] = useState(req.scheduledDate || '');
  const [schedLoc, setSchedLoc] = useState(req.location || '');

  const urgency = getMeetingUrgency(req.dateAdded);
  
  const saveSchedule = () => {
    if (schedDate && schedLoc) {
      onSchedule(schedDate, schedLoc);
      setIsScheduling(false);
    }
  };

  return (
    <div className={`${theme.cardBg} rounded-2xl shadow-sm border ${theme.border} overflow-hidden`}>
      {/* Top Timer Bar (Only for Requested) */}
      {req.status === 'REQUESTED' && (
        <div className="h-2 bg-slate-100 w-full relative">
           <div 
             className="h-full transition-all duration-500" 
             style={{ width: `${urgency.ratio * 100}%`, backgroundColor: urgency.color }}
           />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex gap-4">
           {/* Avatar */}
           <div className="w-16 h-16 rounded-2xl bg-slate-100 flex-shrink-0 overflow-hidden shadow-inner">
             {req.photo ? (
               <img src={req.photo} className="w-full h-full object-cover" alt={req.name} />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-2xl">
                 {req.name.charAt(0)}
               </div>
             )}
           </div>

           {/* Details */}
           <div className="flex-1 min-w-0">
             <div className="flex justify-between items-start">
                <h3 className={`font-bold text-lg leading-tight ${theme.textMain}`}>{req.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${req.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                  {req.status}
                </span>
             </div>
             
             {req.organization && (
             <div className="flex items-center gap-1.5 mt-1 text-xs font-medium opacity-60">
               <Briefcase size={12} /> {req.organization}
             </div>
            )}

            {req.category && (
              <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md inline-flex items-center gap-1">
                <Users size={12} /> {req.category}
              </div>
            )}

             <div className="flex gap-3 mt-2">
                {req.phone && <a href={`tel:${req.phone}`} className="text-slate-400 hover:text-green-600"><Phone size={14}/></a>}
                {req.email && <a href={`mailto:${req.email}`} className="text-slate-400 hover:text-blue-600"><Mail size={14}/></a>}
             </div>
           </div>
        </div>

        {/* Urgency Text */}
        {req.status === 'REQUESTED' && (
           <div className="mt-3 text-xs font-bold" style={{ color: urgency.color }}>
              <Clock size={12} className="inline mr-1" />
              Waiting {urgency.daysPassed} days
           </div>
        )}

        {/* Scheduled Details View */}
        {req.status === 'SCHEDULED' && !isScheduling && (
          <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
             <div className="flex gap-2 text-sm text-slate-700 mb-1">
               <Calendar size={16} className="text-blue-500" />
               <span className="font-bold">{new Date(req.scheduledDate!).toLocaleString()}</span>
             </div>
             <div className="flex gap-2 text-sm text-slate-500">
               <MapPin size={16} className="text-red-500" />
               <span>{req.location}</span>
             </div>
             <div className="flex gap-2 mt-2">
               <button onClick={() => setIsScheduling(true)} className="text-[10px] text-blue-500 font-bold uppercase">Change</button>
               <span className="text-slate-300">|</span>
               <button 
                 onClick={() => downloadCalendarEvent(req)} 
                 className="text-[10px] text-purple-500 font-bold uppercase flex items-center gap-1"
               >
                 <Download size={10} />
                 Export to Calendar
               </button>
             </div>
          </div>
        )}

        {/* Scheduling Inputs */}
        {isScheduling && (
           <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200 animate-in fade-in">
              <label className="text-xs font-bold text-slate-400 uppercase">When</label>
              <input type="datetime-local" value={schedDate} onChange={e => setSchedDate(e.target.value)} className="w-full p-2 mb-2 rounded border border-slate-200 text-sm" />
              <label className="text-xs font-bold text-slate-400 uppercase">Where</label>
              <input type="text" value={schedLoc} onChange={e => setSchedLoc(e.target.value)} className="w-full p-2 mb-3 rounded border border-slate-200 text-sm" placeholder="Location..." />
              <div className="flex gap-2">
                 <button onClick={saveSchedule} className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded">Save</button>
                 <button onClick={() => setIsScheduling(false)} className="px-3 bg-slate-200 text-slate-600 text-xs font-bold rounded">Cancel</button>
              </div>
           </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-4">
           {req.status === 'REQUESTED' && (
             <button onClick={() => setIsScheduling(true)} className="col-span-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2.5 rounded-xl text-xs font-bold transition-colors">
               Schedule
             </button>
           )}
           {req.status === 'SCHEDULED' && (
             <button onClick={onComplete} className="col-span-1 bg-green-50 text-green-600 hover:bg-green-100 py-2.5 rounded-xl text-xs font-bold transition-colors">
               Complete
             </button>
           )}
           {/* If Requested, we can allow complete directly or force schedule first? Prompt implies flow. Let's allow Complete from Requested too if they met impromptu */}
           {req.status === 'REQUESTED' && (
              <button onClick={onComplete} className="col-span-1 bg-green-50 text-green-600 hover:bg-green-100 py-2.5 rounded-xl text-xs font-bold transition-colors">
                Done
              </button>
           )}

           <button onClick={onEdit} className="col-span-1 bg-slate-50 text-slate-600 hover:bg-slate-100 py-2.5 rounded-xl text-xs font-bold transition-colors">
             Edit
           </button>

           <div className="col-span-1" /> {/* Spacer if needed or 3rd button */}
        </div>
      </div>
    </div>
  );
};

export default MeetingRequestsView;