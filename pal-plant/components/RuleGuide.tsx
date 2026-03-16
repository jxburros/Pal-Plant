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

import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Droplets, Clock, TrendingUp, TrendingDown, AlertTriangle, HelpCircle, Target, MessageCircle, PhoneCall, Video, Users } from 'lucide-react';

interface RuleGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-bold text-slate-800 text-sm">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="p-4 space-y-3 text-sm text-slate-600 leading-relaxed">{children}</div>}
    </div>
  );
};

const RuleGuide: React.FC<RuleGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-in slide-in-from-bottom duration-300 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle size={22} className="text-emerald-600" />
            How Pal Plant Works
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Interaction Channels */}
          <Section
            title="Interaction Channels & Scoring"
            icon={<TrendingUp size={18} className="text-emerald-600" />}
            defaultOpen={true}
          >
            <p>Every friend starts at <strong>50 points</strong>. When you log an interaction, both the <strong>channel</strong> and your <strong>timing</strong> affect the score and timer.</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="font-bold text-blue-800 flex items-center gap-2">
                <MessageCircle size={14} /> Text Message
              </p>
              <ul className="mt-2 space-y-1 text-blue-700 text-xs">
                <li><strong>Timer:</strong> Restores 50% of your frequency</li>
                <li><strong>Sweet-spot bonus:</strong> +3 points</li>
                <li>Light check-ins — keeps the connection alive</li>
              </ul>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="font-bold text-emerald-800 flex items-center gap-2">
                <PhoneCall size={14} /> Phone Call
              </p>
              <ul className="mt-2 space-y-1 text-emerald-700 text-xs">
                <li><strong>Timer:</strong> Restores 100% of your frequency</li>
                <li><strong>Sweet-spot bonus:</strong> +7 points</li>
                <li>The baseline — a full timer reset</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="font-bold text-purple-800 flex items-center gap-2">
                <Video size={14} /> Video Call
              </p>
              <ul className="mt-2 space-y-1 text-purple-700 text-xs">
                <li><strong>Timer:</strong> Restores 115% of your frequency</li>
                <li><strong>Sweet-spot bonus:</strong> +9 points</li>
                <li>Face-to-face quality over distance</li>
              </ul>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="font-bold text-orange-800 flex items-center gap-2">
                <Users size={14} /> In Person
              </p>
              <ul className="mt-2 space-y-1 text-orange-700 text-xs">
                <li><strong>Timer:</strong> Restores 125% of your frequency (bonus time!)</li>
                <li><strong>Sweet-spot bonus:</strong> +12 points</li>
                <li>The gold standard — nothing beats real face time</li>
              </ul>
            </div>

            <p className="text-xs text-slate-500">Score is always clamped between 0 and 100.</p>
          </Section>

          {/* Timing */}
          <Section
            title="Timing & Cadence Changes"
            icon={<Clock size={18} className="text-blue-500" />}
          >
            <p>Each friend has a <strong>frequency timer</strong> (in days) that you set. This is how often you aim to contact them.</p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="font-bold text-emerald-800">Timing Multipliers</p>
              <ul className="mt-2 space-y-1 text-xs text-emerald-700">
                <li><strong>Sweet spot (0-50% timer left):</strong> Full channel bonus</li>
                <li><strong>On time (50-80% left):</strong> 70% of channel bonus</li>
                <li><strong>Too early (&gt;80% left):</strong> Small penalty</li>
                <li><strong>Overdue:</strong> -3 per day late (max -20)</li>
              </ul>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="font-bold text-emerald-800">Built-in Grace Period (20% Buffer)</p>
              <p className="text-xs text-emerald-700 mt-1">
                All timers include a <strong>20% buffer</strong> to reduce stress. A 10-day timer actually gives you 12 days.
                The UI shows the goal (10 days), but the system won't mark you overdue until the full buffered time passes.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="font-bold text-amber-800">Automatic Cadence Shortening</p>
              <p className="text-xs text-amber-700 mt-1">
                If you contact someone twice in a row with more than 80% timer remaining,
                the system detects frequent contact and <strong>halves the frequency</strong>.
                This helps the timer match your actual habits.
              </p>
            </div>
          </Section>

          {/* Meetings */}
          <Section
            title="Meeting Requests & Score"
            icon={<Target size={18} className="text-purple-500" />}
          >
            <p>Meetings track real-life hangouts and affect your global garden score.</p>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="font-bold text-purple-800">Score Impact</p>
              <ul className="mt-2 space-y-1 text-xs text-purple-700">
                <li><strong>Attended meeting (verified):</strong> +5 to garden score</li>
                <li><strong>Closed without meeting:</strong> No score change</li>
                <li><strong>Request pending &gt;14 days:</strong> -2 penalty to garden score</li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="font-bold text-slate-700">Meeting Lifecycle</p>
              <ol className="mt-2 space-y-1 text-xs text-slate-600 list-decimal list-inside">
                <li>Create a meeting request (Requested)</li>
                <li>Schedule it with a date and location (Scheduled)</li>
                <li>After the date passes, confirm: attended or close without meeting</li>
              </ol>
            </div>
          </Section>

          {/* Garden Score */}
          <Section
            title="Global Garden Score"
            icon={<TrendingUp size={18} className="text-emerald-600" />}
          >
            <p>Your overall garden score (0-100) reflects the health of all your relationships.</p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="font-bold text-emerald-800">Calculation</p>
              <ul className="mt-2 space-y-1 text-xs text-emerald-700">
                <li><strong>Base:</strong> Average of all individual friend scores</li>
                <li><strong>Bonus:</strong> +5 for each completed, verified meeting</li>
                <li><strong>Penalty:</strong> -2 for each meeting request sitting &gt;14 days</li>
              </ul>
            </div>
          </Section>

          {/* Plant Stages */}
          <Section
            title="Plant Growth Stages"
            icon={<Droplets size={18} className="text-lime-500" />}
          >
            <p>Each friend's plant icon reflects how much timer is left:</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3 bg-pink-50 rounded-lg p-2">
                <span className="text-pink-500 font-bold w-16">80%+</span>
                <span className="text-pink-700">Thriving (flower)</span>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 rounded-lg p-2">
                <span className="text-emerald-600 font-bold w-16">50-80%</span>
                <span className="text-emerald-700">Growing (trees)</span>
              </div>
              <div className="flex items-center gap-3 bg-lime-50 rounded-lg p-2">
                <span className="text-lime-600 font-bold w-16">25-50%</span>
                <span className="text-lime-700">Sprouting (sprout)</span>
              </div>
              <div className="flex items-center gap-3 bg-yellow-50 rounded-lg p-2">
                <span className="text-yellow-600 font-bold w-16">0-25%</span>
                <span className="text-yellow-700">Wilting (leaf)</span>
              </div>
              <div className="flex items-center gap-3 bg-stone-50 rounded-lg p-2">
                <span className="text-stone-500 font-bold w-16">0% or less</span>
                <span className="text-stone-600">Withered (overdue)</span>
              </div>
            </div>
          </Section>

          {/* Early/Late Consequences */}
          <Section
            title="Early & Late Contact Consequences"
            icon={<AlertTriangle size={18} className="text-orange-500" />}
          >
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="font-bold text-orange-800">Contacting Too Early</p>
              <ul className="mt-2 space-y-1 text-xs text-orange-700">
                <li>Small score penalty (proportional to channel)</li>
                <li>If done twice in a row (both with &gt;80% left), cadence is halved</li>
                <li>This is designed to match your natural rhythm</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="font-bold text-red-800">Contacting Too Late</p>
              <ul className="mt-2 space-y-1 text-xs text-red-700">
                <li>Score penalty: -3 per day overdue</li>
                <li>Maximum penalty: -20 points in one interaction</li>
                <li>The plant icon reflects the withered state</li>
                <li>Overdue friends appear in the "Withering Plants" dashboard alert</li>
              </ul>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="font-bold text-emerald-800">The Sweet Spot</p>
              <p className="text-xs text-emerald-700 mt-1">
                Contact friends when their timer is between 0% and 50% remaining for the maximum bonus.
                Higher-quality channels (in-person, video) earn significantly more points.
              </p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default RuleGuide;
