
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BattleUnit, BattleLog, Skill, Vessel, Pet, StatusEffect } from '../types';
import { generateBattleCommentary } from '../services/geminiService';

interface BattleArenaProps {
  playerVessel: Vessel;
  playerSkills: Skill[];
  playerPet?: Pet;
  isTowerMode?: boolean;
  isPracticeMode?: boolean;
  floor?: number;
  onFinish: (winnerName: string) => void;
}

const GAUGE_MAX = 1000;
const TICK_MS = 30; // Base tick rate

const BattleArena: React.FC<BattleArenaProps> = ({ playerVessel, playerSkills, playerPet, isTowerMode, isPracticeMode, floor = 1, onFinish }) => {
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [battleOver, setBattleOver] = useState(false);
  const [commentary, setCommentary] = useState<string>('');
  const [loadingCommentary, setLoadingCommentary] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState<1 | 2>(1);
  
  const [player, setPlayer] = useState<BattleUnit>({
    vessel: playerVessel,
    currentStats: { ...playerVessel.baseStats },
    skills: playerSkills,
    pet: playerPet,
    statusEffects: [],
    gauge: 0
  });

  const [opponent, setOpponent] = useState<BattleUnit>({
    vessel: {
        id: isPracticeMode ? 'dummy' : (isTowerMode ? `tower_${floor}` : 'arena_opponent'),
        name: isPracticeMode ? 'Practice Dummy' : (isTowerMode ? `Floor ${floor} Boss` : 'Shadow Duelist'),
        title: isPracticeMode ? 'Immobile Target' : (isTowerMode ? 'Corrupted Soul' : 'Arena Challenger'),
        element: playerVessel.element,
        rarity: isPracticeMode ? 'Common' : (isTowerMode ? 'Epic' : 'Rare'),
        avatar: isPracticeMode ? 'https://picsum.photos/seed/dummy/200' : `https://picsum.photos/seed/enemy_${floor}/200`,
        baseStats: isPracticeMode ? { ...playerVessel.baseStats, hp: 50000, maxHp: 50000, spd: 1, def: 50 } : 
                  { ...playerVessel.baseStats, hp: playerVessel.baseStats.hp + (isTowerMode ? floor * 150 : 300) }
    },
    currentStats: isPracticeMode ? 
        { ...playerVessel.baseStats, hp: 50000, maxHp: 50000, spd: 1, def: 50 } :
        { ...playerVessel.baseStats, hp: playerVessel.baseStats.hp + (isTowerMode ? floor * 150 : 300), maxHp: playerVessel.baseStats.hp + (isTowerMode ? floor * 150 : 300) },
    skills: playerSkills.slice(0, 3),
    statusEffects: [],
    gauge: 0
  });

  const logEndRef = useRef<HTMLDivElement>(null);
  const turnRef = useRef(1);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const runTick = () => {
    if (battleOver) return;

    let p = { ...player };
    let o = { ...opponent };
    let activeUnit: BattleUnit | null = null;
    let defender: BattleUnit | null = null;

    // Advance gauge
    p.gauge += p.currentStats.spd;
    o.gauge += o.currentStats.spd;

    if (p.gauge >= GAUGE_MAX && p.gauge >= o.gauge) {
        activeUnit = p;
        defender = o;
    } else if (o.gauge >= GAUGE_MAX) {
        activeUnit = o;
        defender = p;
    }

    if (!activeUnit || !defender) {
        setPlayer(p);
        setOpponent(o);
        return;
    }

    // A turn has occurred
    activeUnit.gauge = 0;
    const turn = turnRef.current++;
    let newLogs: BattleLog[] = [];

    // 1. Check Status Effects (Stun/Frozen)
    const isStunned = activeUnit.statusEffects.some(e => e.type === 'Stun' || e.type === 'Frozen');
    if (isStunned) {
        newLogs.push({ turn, message: `${activeUnit.vessel.name} is incapacitated and skips their turn!`, type: 'status' });
        activeUnit.statusEffects = activeUnit.statusEffects.map(e => ({ ...e, duration: e.duration - 1 })).filter(e => e.duration > 0);
        
        // Sync back state
        if (activeUnit === p) setPlayer(activeUnit); else setOpponent(activeUnit);
        setLogs(prev => [...prev, ...newLogs]);
        return;
    }

    // 2. Mana Regen
    activeUnit.currentStats.mana = Math.min(activeUnit.currentStats.maxMana, activeUnit.currentStats.mana + 5);

    // 3. Pet Trigger
    if (activeUnit.pet && Math.random() < activeUnit.pet.triggerChance) {
        newLogs.push({ turn, message: `${activeUnit.pet.icon} ${activeUnit.pet.name} triggers: ${activeUnit.pet.effect}!`, type: 'pet' });
        activeUnit.currentStats.atk *= 1.05;
    }

    // 4. Skill Selection (Priority 1-6)
    let usedSkill: Skill | null = null;
    for (const skill of activeUnit.skills) {
        if (activeUnit.currentStats.mana >= skill.manaCost && Math.random() < skill.triggerChance) {
            usedSkill = skill;
            break;
        }
    }

    let damage = 0;
    if (usedSkill) {
        activeUnit.currentStats.mana -= usedSkill.manaCost;
        damage = Math.floor((activeUnit.currentStats.atk * usedSkill.power) - (defender.currentStats.def * 0.4));
        newLogs.push({ turn, message: `${activeUnit.vessel.name} activates [${usedSkill.name}]!`, type: 'skill' });
        
        // Specific logic
        if (usedSkill.id === 'deep_freeze' && Math.random() < 0.2) {
            defender.statusEffects.push({ name: 'Frozen', type: 'Frozen', duration: 1 });
            newLogs.push({ turn, message: `${defender.vessel.name} is frozen solid!`, type: 'status' });
        }
        if (usedSkill.id === 'cinder_wave') {
            defender.statusEffects.push({ name: 'Burn', type: 'Burn', duration: 3, magnitude: 50 });
            newLogs.push({ turn, message: `${defender.vessel.name} is burning!`, type: 'status' });
        }
        if (usedSkill.id === 'life_siphon') {
            const heal = Math.floor(damage * 0.4);
            activeUnit.currentStats.hp = Math.min(activeUnit.currentStats.maxHp, activeUnit.currentStats.hp + heal);
            newLogs.push({ turn, message: `${activeUnit.vessel.name} siphons ${heal} HP!`, type: 'info' });
        }
        if (usedSkill.id === 'slipstream') {
            activeUnit.gauge += 300;
        }
    } else {
        // Basic Attack
        damage = Math.floor(activeUnit.currentStats.atk - defender.currentStats.def);
        newLogs.push({ turn, message: `${activeUnit.vessel.name} deals a standard strike.`, type: 'attack' });
    }

    // 5. Apply Damage
    damage = Math.max(20, damage);
    defender.currentStats.hp -= damage;
    newLogs.push({ turn, message: `${defender.vessel.name} takes ${damage} damage.`, type: 'info' });

    // 6. Post-Turn Status Damage (Poison/Burn)
    activeUnit.statusEffects.forEach(e => {
        if (e.type === 'Burn' || e.type === 'Poison') {
            const tickDmg = e.magnitude || 50;
            activeUnit.currentStats.hp -= tickDmg;
            newLogs.push({ turn, message: `${activeUnit.vessel.name} takes ${tickDmg} from ${e.type}!`, type: 'status' });
        }
    });

    // Tick down durations
    activeUnit.statusEffects = activeUnit.statusEffects.map(e => ({ ...e, duration: e.duration - 1 })).filter(e => e.duration > 0);

    // Sync back
    if (activeUnit === p) {
        setPlayer(activeUnit);
        setOpponent(defender);
    } else {
        setPlayer(defender);
        setOpponent(activeUnit);
    }
    setLogs(prev => [...prev, ...newLogs]);

    // Check Victory
    if (activeUnit.currentStats.hp <= 0 || defender.currentStats.hp <= 0) {
        const winner = p.currentStats.hp > 0 ? p : o;
        const loser = p.currentStats.hp > 0 ? o : p;
        setBattleOver(true);
        if (!isPracticeMode) {
          setLoadingCommentary(true);
          generateBattleCommentary(winner.vessel.name, loser.vessel.name, usedSkill?.name).then(text => {
              setCommentary(text);
              setLoadingCommentary(false);
          });
        } else {
          setCommentary("Practice session concluded. Your combo potential is clear!");
        }
    }
  };

  useEffect(() => {
    const interval = (TICK_MS / battleSpeed);
    const timer = setInterval(() => {
      if (!battleOver) runTick();
    }, interval);
    return () => clearInterval(timer);
  }, [player, opponent, battleOver, battleSpeed]);

  const skipBattle = () => {
    // Fast forward logic simplified for proto: insta-win if significantly more powerful or just exit
    onFinish(player.currentStats.hp > 0 ? player.vessel.name : opponent.vessel.name);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-[3rem] shadow-2xl border-8 border-orange-100 paper-texture overflow-hidden">
      {/* HUD Header */}
      <div className="flex justify-between items-center px-6 py-3 mb-4 bg-white/90 rounded-full border-2 border-orange-50 shadow-sm">
        <div className="font-game text-sm text-orange-800 tracking-wider">
          {isPracticeMode ? '🧪 PRACTICE FACILITY' : (isTowerMode ? `🏰 TOWER FLOOR ${floor}` : '🥋 ARENA RANKED')}
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => setBattleSpeed(1)} className={`px-3 py-1 rounded-full text-[10px] font-black ${battleSpeed === 1 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>1X</button>
          <button onClick={() => setBattleSpeed(2)} className={`px-3 py-1 rounded-full text-[10px] font-black ${battleSpeed === 2 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>2X</button>
          <button onClick={skipBattle} className="px-3 py-1 rounded-full text-[10px] font-black bg-gray-800 text-white hover:bg-black">SKIP</button>
        </div>
      </div>

      <div className="h-80 relative bg-slate-900 rounded-[2.5rem] mb-6 overflow-hidden flex items-center justify-between px-16 border-4 border-slate-700 shadow-inner">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20"></div>
        
        {/* Unit A - Player */}
        <div className={`flex flex-col items-center z-10 transition-all duration-300 ${player.currentStats.hp <= 0 ? 'grayscale rotate-90 opacity-40' : 'animate-float'}`}>
          <div className="relative group">
            <img src={player.vessel.avatar} className="w-32 h-32 rounded-full border-8 border-white shadow-2xl object-cover" />
            {player.pet && <div className="absolute -top-6 -left-6 text-5xl animate-bounce drop-shadow-lg">{player.pet.icon}</div>}
            
            {/* Action Gauge */}
            <div className="absolute -bottom-2 left-0 w-full h-2 bg-gray-800 rounded-full overflow-hidden border-2 border-white/20">
              <div className="h-full bg-cyan-400 transition-all" style={{ width: `${(player.gauge / GAUGE_MAX) * 100}%` }} />
            </div>
          </div>
          
          <div className="mt-6 w-40 h-5 bg-gray-800 rounded-full overflow-hidden border-2 border-white shadow-lg relative">
            <div className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300" style={{ width: `${(player.currentStats.hp/player.currentStats.maxHp)*100}%` }} />
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white drop-shadow-md">
                {Math.max(0, player.currentStats.hp)} / {player.currentStats.maxHp}
            </div>
          </div>
          
          <div className="mt-1 w-32 h-2.5 bg-gray-800 rounded-full overflow-hidden border border-white/20">
            <div className="h-full bg-blue-400 transition-all duration-300" style={{ width: `${(player.currentStats.mana/player.currentStats.maxMana)*100}%` }} />
          </div>
          
          <span className="font-game text-white text-lg mt-2 drop-shadow-md uppercase">{player.vessel.name}</span>
        </div>

        <div className="flex flex-col items-center z-10 pointer-events-none">
          <div className="font-game text-7xl text-orange-500 italic drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">VS</div>
        </div>

        {/* Unit B - Opponent */}
        <div className={`flex flex-col items-center z-10 transition-all duration-300 ${opponent.currentStats.hp <= 0 ? 'grayscale rotate-90 opacity-40' : 'animate-float'}`}>
          <div className="relative">
            <img src={opponent.vessel.avatar} className="w-32 h-32 rounded-full border-8 border-red-500 shadow-2xl object-cover" />
            <div className="absolute -bottom-2 left-0 w-full h-2 bg-gray-800 rounded-full overflow-hidden border-2 border-white/20">
              <div className="h-full bg-cyan-400 transition-all" style={{ width: `${(opponent.gauge / GAUGE_MAX) * 100}%` }} />
            </div>
          </div>
          
          <div className="mt-6 w-40 h-5 bg-gray-800 rounded-full overflow-hidden border-2 border-white shadow-lg relative">
            <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300" style={{ width: `${(opponent.currentStats.hp/opponent.currentStats.maxHp)*100}%` }} />
             <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white drop-shadow-md">
                {Math.max(0, Math.floor(opponent.currentStats.hp))} / {opponent.currentStats.maxHp}
            </div>
          </div>

          <div className="mt-1 w-32 h-2.5 bg-gray-800 rounded-full overflow-hidden border border-white/20">
            <div className="h-full bg-blue-400 transition-all duration-300" style={{ width: `${(opponent.currentStats.mana/opponent.currentStats.maxMana)*100}%` }} />
          </div>
          
          <span className="font-game text-white text-lg mt-2 drop-shadow-md uppercase">{opponent.vessel.name}</span>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 h-52 overflow-y-auto mb-6 border-4 border-orange-50 shadow-inner font-mono text-xs leading-relaxed custom-scrollbar">
        {logs.map((log, i) => (
          <div key={i} className={`mb-1.5 p-2 rounded-xl transition-all ${
            log.type === 'skill' ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-500 pl-3 font-bold' : 
            log.type === 'pet' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-400 pl-3 italic' : 
            log.type === 'status' ? 'bg-yellow-50 text-yellow-700 border-l-4 border-yellow-400 pl-3' :
            log.type === 'death' ? 'bg-red-500 text-white font-black text-center text-sm py-3' : 'text-gray-500'
          }`}>
            <span className="opacity-30 mr-2">[{log.turn}]</span> {log.message}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {commentary && (
        <div className="bg-orange-50 p-5 rounded-[2rem] border-4 border-orange-100 mb-8 relative animate-in fade-in slide-in-from-top-4">
            <div className="absolute -top-4 left-6 bg-orange-500 text-white text-[10px] px-4 py-1 rounded-full font-black shadow-md uppercase tracking-widest">Oracle Record</div>
            <p className="italic text-sm text-orange-900 leading-relaxed font-semibold">"{commentary}"</p>
        </div>
      )}

      <div className="flex justify-center pb-4">
        {battleOver ? (
          <button 
            onClick={() => onFinish(player.currentStats.hp > 0 ? player.vessel.name : opponent.vessel.name)} 
            className="bubbly-btn bg-orange-500 text-white font-game py-5 px-16 rounded-full text-3xl shadow-[0_8px_0_rgb(194,65,12)] active:shadow-none"
          >
            VICTORY SETTLED
          </button>
        ) : (
          <div className="flex flex-col items-center">
             <div className="text-gray-300 font-game animate-pulse text-2xl tracking-[0.3em] uppercase mb-2">Simulating Fate...</div>
             <div className="flex space-x-2">
                <div className="w-2 h-2 bg-orange-200 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattleArena;
