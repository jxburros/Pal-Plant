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

/**
 * Theme configuration and color schemes
 * @module themes
 */

import { ThemeId, ThemeColors } from '../types';

/**
 * Available color themes for the application
 * Each theme defines a complete color palette including:
 * - Background colors (main and card)
 * - Text colors (main and secondary)
 * - Primary and accent colors
 * - Border colors
 */
export const THEMES: Record<ThemeId, ThemeColors> = {
  plant: {
    bg: 'bg-[#f4f7f4]', 
    cardBg: 'bg-white', 
    textMain: 'text-[#2c3e2e]', 
    textSub: 'text-[#6b7c6d]',
    primary: 'bg-[#4a674e]', 
    primaryText: 'text-white', 
    accent: 'bg-[#8fb394]', 
    border: 'border-[#e0e8e0]'
  },
  midnight: {
    bg: 'bg-slate-900', 
    cardBg: 'bg-slate-800', 
    textMain: 'text-white', 
    textSub: 'text-slate-400',
    primary: 'bg-blue-600', 
    primaryText: 'text-white', 
    accent: 'bg-pink-500', 
    border: 'border-slate-700'
  },
  forest: {
    bg: 'bg-stone-100', 
    cardBg: 'bg-white', 
    textMain: 'text-stone-800', 
    textSub: 'text-stone-500',
    primary: 'bg-emerald-800', 
    primaryText: 'text-emerald-50', 
    accent: 'bg-lime-600', 
    border: 'border-stone-200'
  },
  ocean: {
    bg: 'bg-sky-50', 
    cardBg: 'bg-white', 
    textMain: 'text-sky-950', 
    textSub: 'text-sky-500',
    primary: 'bg-sky-600', 
    primaryText: 'text-white', 
    accent: 'bg-cyan-400', 
    border: 'border-sky-100'
  },
  sunset: {
    bg: 'bg-orange-50', 
    cardBg: 'bg-white', 
    textMain: 'text-orange-950', 
    textSub: 'text-orange-600',
    primary: 'bg-orange-600', 
    primaryText: 'text-white', 
    accent: 'bg-yellow-400', 
    border: 'border-orange-200'
  },
  berry: {
    bg: 'bg-fuchsia-50', 
    cardBg: 'bg-white', 
    textMain: 'text-fuchsia-950', 
    textSub: 'text-fuchsia-600',
    primary: 'bg-fuchsia-700', 
    primaryText: 'text-white', 
    accent: 'bg-pink-500', 
    border: 'border-fuchsia-200'
  }
};
