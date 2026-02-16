import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Droplets, Heart, Zap, Clock, TrendingUp, TrendingDown, AlertTriangle, HelpCircle, Target } from 'lucide-react';

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
          {/* Scoring Rules */}
          <Section
            title="Scoring Rules"
            icon={<TrendingUp size={18} className="text-emerald-600" />}
            defaultOpen={true}
          >
            <p>Every friend starts at <strong>50 points</strong>. Your score changes with each interaction based on timing.</p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="font-bold text-emerald-800 flex items-center gap-2">
                <Droplets size={14} /> Regular Contact (Water)
              </p>
              <ul className="mt-2 space-y-1 text-emerald-700 text-xs">
                <li><strong>Sweet spot (0-50% timer left):</strong> +10 points</li>
                <li><strong>On time (50-80% left):</strong> +5 points</li>
                <li><strong>Too early (&gt;80% left):</strong> -2 points</li>
                <li><strong>Overdue:</strong> -5 per day late (max -30)</li>
              </ul>
            </div>

            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
              <p className="font-bold text-pink-800 flex items-center gap-2">
                <Heart size={14} /> Deep Connection
              </p>
              <ul className="mt-2 space-y-1 text-pink-700 text-xs">
                <li><strong>Always:</strong> +15 points</li>
                <li>Extends your timer by an extra 12 hours</li>
                <li>24-hour cooldown between uses</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="font-bold text-yellow-800 flex items-center gap-2">
                <Zap size={14} /> Quick Touch
              </p>
              <ul className="mt-2 space-y-1 text-yellow-700 text-xs">
                <li><strong>Always:</strong> +2 points</li>
                <li>Shifts timer forward by 30 minutes</li>
                <li>Costs 1 token (see tokens section below)</li>
              </ul>
            </div>

            <p className="text-xs text-slate-500">Score is always clamped between 0 and 100.</p>
          </Section>

          {/* Timing & Cadence */}
          <Section
            title="Timing & Cadence Changes"
            icon={<Clock size={18} className="text-blue-500" />}
          >
            <p>Each friend has a <strong>frequency timer</strong> (in days) that you set. This is how often you aim to contact them.</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="font-bold text-blue-800">Timer Battery</p>
              <p className="text-xs text-blue-700 mt-1">
                The progress bar shows how much time is left before your next check-in is due.
                As time passes, the bar drains. When it hits 0%, the friend is overdue.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="font-bold text-amber-800">Automatic Cadence Shortening</p>
              <p className="text-xs text-amber-700 mt-1">
                If you contact someone twice in a row with more than 80% timer remaining,
                the system detects frequent contact and <strong>halves the frequency</strong>.
                For example, a 14-day cadence becomes 7 days.
              </p>
              <p className="text-xs text-amber-700 mt-1">
                This helps the timer match your actual habits. You'll see an inline notification when this happens.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="font-bold text-slate-700">Why did my timer change?</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                <li><strong>After Regular/Deep contact:</strong> Timer resets to your full frequency days</li>
                <li><strong>After Deep contact:</strong> Timer also gets an extra 12 hours</li>
                <li><strong>After Quick Touch:</strong> Timer shifts forward by only 30 minutes</li>
                <li><strong>Cadence shortened:</strong> Two consecutive early contacts trigger halving</li>
              </ul>
            </div>
          </Section>

          {/* Quick Touch Tokens */}
          <Section
            title="Quick-Touch Tokens"
            icon={<Zap size={18} className="text-yellow-500" />}
          >
            <p>Quick touches are limited by a token system to prevent overuse.</p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="font-bold text-yellow-800">How tokens work</p>
              <ul className="mt-2 space-y-1 text-xs text-yellow-700">
                <li>Each quick touch costs <strong>1 token</strong></li>
                <li>You earn <strong>1 token per 2 full contact cycles</strong> (Regular or Deep contacts)</li>
                <li>When the cycle counter reaches 2, you get a token and the counter resets</li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="font-bold text-slate-700">Why is Quick Touch unavailable?</p>
              <p className="text-xs text-slate-600 mt-1">
                You have no tokens left. Complete 2 Regular or Deep contact cycles with this friend
                to earn a new token. The card shows how many cycles remain until your next token.
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
              <p className="text-xs text-slate-500 mt-2">
                Stale requests (over 14 days old) will incur a score penalty.
                Overdue scheduled meetings are highlighted for quick resolution.
              </p>
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
                <li>Small score penalty (-2 points)</li>
                <li>If done twice in a row (both with &gt;80% left), cadence is halved</li>
                <li>This is designed to match your natural rhythm</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="font-bold text-red-800">Contacting Too Late</p>
              <ul className="mt-2 space-y-1 text-xs text-red-700">
                <li>Score penalty: -5 per day overdue</li>
                <li>Maximum penalty: -30 points in one interaction</li>
                <li>The plant icon reflects the withered state</li>
                <li>Overdue friends appear in the "Withering Plants" dashboard alert</li>
              </ul>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="font-bold text-emerald-800">The Sweet Spot</p>
              <p className="text-xs text-emerald-700 mt-1">
                Contact friends when their timer is between 0% and 50% remaining for the maximum +10 point bonus.
                This is the ideal window where your effort is most rewarded.
              </p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default RuleGuide;
