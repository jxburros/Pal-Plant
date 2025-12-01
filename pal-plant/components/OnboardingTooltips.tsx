import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sprout, Users, Calendar, Settings, Keyboard } from 'lucide-react';
import { THEMES } from '../utils/helpers';
import { AppSettings } from '../types';

interface OnboardingTooltipsProps {
  settings: AppSettings;
  onComplete: () => void;
}

interface TooltipStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
}

const tooltipSteps: TooltipStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Pal Plant! 🌱',
    description: 'Keep your relationships thriving by tracking when you last connected with friends and family. Let\'s take a quick tour!',
    icon: <Sprout size={32} className="text-emerald-500" />
  },
  {
    id: 'garden',
    title: 'Your Garden',
    description: 'Each person is represented as a plant. Water them regularly by marking when you\'ve connected. Plants wilt if you wait too long!',
    icon: <Users size={32} className="text-blue-500" />,
    shortcut: 'G'
  },
  {
    id: 'meetings',
    title: 'Meeting Requests',
    description: 'Schedule and track meetings with people. You can export meetings to your calendar and set up reminders.',
    icon: <Calendar size={32} className="text-purple-500" />,
    shortcut: 'M'
  },
  {
    id: 'settings',
    title: 'Settings & Backup',
    description: 'Customize your experience, backup your data, and sync across devices. Import contacts from CSV files too!',
    icon: <Settings size={32} className="text-slate-500" />,
    shortcut: 'S'
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Press H for Home, G for Garden, M for Meetings, S for Settings, and N to add a new friend. Press ? anytime to see all shortcuts.',
    icon: <Keyboard size={32} className="text-orange-500" />
  }
];

const OnboardingTooltips: React.FC<OnboardingTooltipsProps> = ({ settings, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const theme = THEMES[settings.theme];

  const handleNext = () => {
    if (currentStep < tooltipSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = tooltipSteps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} />
      
      <div className={`bg-white w-full max-w-md rounded-3xl p-8 relative z-10 animate-in zoom-in-95 fade-in duration-300 shadow-2xl`}>
        {/* Skip button */}
        <button 
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {tooltipSteps.map((_, index) => (
            <div 
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep ? 'w-6 bg-emerald-500' : 
                index < currentStep ? 'bg-emerald-300' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center">
              {step.icon}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">{step.title}</h2>
          <p className="text-slate-600 leading-relaxed mb-6">{step.description}</p>

          {step.shortcut && (
            <div className="mb-6 flex justify-center">
              <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg">
                <span className="text-sm text-slate-500">Keyboard shortcut:</span>
                <kbd className="px-2 py-1 bg-white rounded border border-slate-200 text-sm font-mono font-bold text-slate-700">
                  {step.shortcut}
                </kbd>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              currentStep === 0 
                ? 'text-slate-300 cursor-not-allowed' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ChevronLeft size={20} />
            Back
          </button>

          <button
            onClick={handleNext}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all ${theme.primary} hover:opacity-90`}
          >
            {currentStep === tooltipSteps.length - 1 ? 'Get Started' : 'Next'}
            {currentStep < tooltipSteps.length - 1 && <ChevronRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTooltips;
