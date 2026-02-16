import React, { useEffect, useState } from 'react';
import { ActionFeedback } from '../types';
import { TrendingUp, TrendingDown, Clock, Zap, ArrowRight } from 'lucide-react';

interface InlineFeedbackProps {
  feedback: ActionFeedback;
  onDismiss: () => void;
}

const InlineFeedback: React.FC<InlineFeedbackProps> = ({ feedback, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isPositive = feedback.scoreDelta > 0;
  const isNegative = feedback.scoreDelta < 0;

  const typeLabel =
    feedback.type === 'DEEP' ? 'Deep Connection' :
    feedback.type === 'QUICK' ? 'Quick Touch' :
    'Regular Contact';

  const scoreBgClass = isPositive
    ? 'bg-emerald-500 text-white'
    : isNegative
      ? 'bg-red-500 text-white'
      : 'bg-slate-400 text-white';

  return (
    <div
      className={`mt-3 rounded-xl border overflow-hidden transition-all duration-300 ${
        visible ? 'opacity-100 max-h-40 translate-y-0' : 'opacity-0 max-h-0 -translate-y-2'
      } ${isPositive ? 'border-emerald-200 bg-emerald-50' : isNegative ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}
    >
      <div className="px-3 py-2.5 flex flex-wrap items-center gap-2 text-xs">
        {/* Score delta badge */}
        <span className={`inline-flex items-center gap-1 font-black px-2 py-0.5 rounded-md ${scoreBgClass}`}>
          {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : null}
          {isPositive ? '+' : ''}{feedback.scoreDelta} pts
        </span>

        <span className="text-slate-400 font-medium">{typeLabel}</span>

        {/* Arrow separator */}
        <ArrowRight size={12} className="text-slate-300" />

        {/* Timer effect */}
        <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
          <Clock size={12} className="text-blue-400" />
          {feedback.timerEffect}
        </span>

        {/* Cadence shortened notice */}
        {feedback.cadenceShortened && feedback.oldFrequencyDays !== undefined && (
          <>
            <ArrowRight size={12} className="text-slate-300" />
            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-md">
              cadence {feedback.oldFrequencyDays}d <ArrowRight size={10} /> {feedback.newFrequencyDays}d
            </span>
          </>
        )}

        {/* Token change */}
        {feedback.tokenChange !== 0 && (
          <>
            <ArrowRight size={12} className="text-slate-300" />
            <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md ${
              feedback.tokenChange > 0 ? 'text-yellow-700 bg-yellow-100' : 'text-slate-500 bg-slate-100'
            }`}>
              <Zap size={12} />
              {feedback.tokenChange > 0 ? '+1 token' : '-1 token'} ({feedback.tokensAvailable} left)
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default InlineFeedback;
