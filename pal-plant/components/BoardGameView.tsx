import React, { useMemo, useState } from 'react';
import { Friend, ContactChannel } from '../types';
import { calculateTimeStatus } from '../utils/helpers';

interface BoardGameViewProps {
  friends: Friend[];
}

type UnitClass = 'Knight' | 'Shield' | 'Scout';

interface BoardUnit {
  id: string;
  name: string;
  className: UnitClass;
  isCaptured: boolean;
}

const unitForChannel = (channel: ContactChannel): UnitClass => {
  if (channel === 'gaming' || channel === 'text') return 'Knight';
  if (channel === 'in-person') return 'Shield';
  return 'Scout';
};

const classStyles: Record<UnitClass, string> = {
  Knight: 'bg-violet-100 text-violet-800 border-violet-200',
  Shield: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  Scout: 'bg-amber-100 text-amber-800 border-amber-200'
};

const BoardGameView: React.FC<BoardGameViewProps> = ({ friends }) => {
  const [fortifiedTiles, setFortifiedTiles] = useState<number[]>([]);

  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toDateString();
  }, []);

  const economy = useMemo(() => {
    let sweetSpotInteractions = 0;
    let overwateredInteractions = 0;

    friends.forEach(friend => {
      friend.logs.forEach(log => {
        if (new Date(log.date).toDateString() !== yesterday) return;
        if (log.percentageRemaining <= 50) {
          sweetSpotInteractions += 1;
        } else if (log.percentageRemaining > 80) {
          overwateredInteractions += 1;
        }
      });
    });

    return {
      sweetSpotInteractions,
      overwateredInteractions,
      pogs: sweetSpotInteractions * 3,
      soggySoilTiles: overwateredInteractions
    };
  }, [friends, yesterday]);

  const boardState = useMemo(() => {
    const guardians: BoardUnit[] = [];
    const captured: BoardUnit[] = [];

    friends.forEach(friend => {
      const recentLogs = [...friend.logs].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const latestChannel = recentLogs[0]?.channel ?? 'call';

      if (friend.individualScore >= 80) {
        guardians.push({
          id: friend.id,
          name: friend.name,
          className: unitForChannel(latestChannel),
          isCaptured: false
        });
        return;
      }

      const status = calculateTimeStatus(friend.lastContacted, friend.frequencyDays);
      if (friend.individualScore < 10 || status.percentageLeft <= 0) {
        captured.push({
          id: friend.id,
          name: friend.name,
          className: unitForChannel(latestChannel),
          isCaptured: true
        });
      }
    });

    return { guardians, captured };
  }, [friends]);

  const boardSize = friends.length >= 18 ? 8 : 5;
  const tileCount = boardSize * boardSize;

  const tiles = useMemo(() => {
    return Array.from({ length: tileCount }, (_, idx) => {
      const isFortified = fortifiedTiles.includes(idx);
      const soggy = idx < economy.soggySoilTiles;
      return { idx, isFortified, soggy };
    });
  }, [tileCount, fortifiedTiles, economy.soggySoilTiles]);

  const toggleFortify = (idx: number) => {
    setFortifiedTiles(prev =>
      prev.includes(idx) ? prev.filter(t => t !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl p-5 border bg-gradient-to-br from-emerald-950 to-slate-900 text-white border-emerald-700/40">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-emerald-200">Pal-Plant: The Board Game of Bonds</p>
        <h2 className="text-2xl font-black mt-2">The Great Spreadsheet Blight</h2>
        <p className="mt-3 text-sm text-emerald-50/90 leading-relaxed">
          The Manager is converting friendships into low-yield cells. Keep your circle alive by timing interactions,
          harvesting Pogs, and fortifying the Grid of Great Vibes before the midnight wilt.
        </p>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <h3 className="font-bold text-emerald-900">1) Economy: Harvesting Pogs</h3>
        <p className="mt-2 text-sm text-emerald-800">
          Yesterday&#39;s perfect timing with <strong>{economy.sweetSpotInteractions}</strong> interactions harvested <strong>{economy.pogs}</strong> Pogs.
          <span className="ml-1">{economy.overwateredInteractions} were overwatered and produced soggy data instead.</span>
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="font-bold text-slate-900">2) Units: From Buds to Battle-Ready</h3>
        <p className="text-sm text-slate-600 mt-2">Friends with Momentum Score 80+ manifest as permanent guardians.</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {boardState.guardians.length === 0 && <p className="text-xs text-slate-500">No manifested guardians yet.</p>}
          {boardState.guardians.map(unit => (
            <span key={unit.id} className={`px-3 py-1.5 rounded-full border text-xs font-bold ${classStyles[unit.className]}`}>
              {unit.name} · {unit.className}
            </span>
          ))}
        </div>

        {boardState.captured.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <p className="text-xs font-bold uppercase tracking-wider text-red-700">Captured by The Manager</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {boardState.captured.map(unit => (
                <span key={unit.id} className="px-3 py-1.5 rounded-full border text-xs font-bold bg-red-100 text-red-800 border-red-200">
                  {unit.name} · Synergy Obstacle
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-bold text-slate-900">3) Grid of Great Vibes</h3>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">{boardSize}×{boardSize} board</span>
        </div>
        <p className="text-xs text-slate-500 mb-3">Tap tiles to spend harvested Pogs and fortify before Daily Wilt.</p>

        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}>
          {tiles.map(tile => (
            <button
              key={tile.idx}
              onClick={() => toggleFortify(tile.idx)}
              className={`aspect-square rounded-xl border text-[10px] font-bold transition-all ${tile.isFortified
                ? 'bg-emerald-400/90 text-emerald-950 border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.45)]'
                : tile.soggy
                  ? 'bg-orange-100 text-orange-700 border-orange-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {tile.isFortified ? 'FORT' : tile.soggy ? 'SOGGY' : 'TILE'}
            </button>
          ))}
        </div>

        <div className="mt-3 text-xs text-slate-600 space-y-1">
          <p>• Level 3 expansion unlocks the 8×8 Public Park once your roster grows.</p>
          <p>• Level 5 Bloom Explosion: spend 20 Banked Pogs to clear a 3×3 Blight zone.</p>
          <p>• Reclamation Rule: a Sweet Spot interaction instantly flips captured friends back to your side.</p>
        </div>
      </section>
    </div>
  );
};

export default BoardGameView;
