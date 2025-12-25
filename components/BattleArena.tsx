
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BattleUnit, BattleLog, Skill, Vessel, Pet, StatusEffect, TowerModifier } from '../types';
import { generateBattleCommentary } from '../services/geminiService';

interface BattleArenaProps {
  playerVessel: Vessel;
  playerSkills: Skill[];
  playerPet?: Pet;
  playerVessels: Vessel[];
  isTowerMode?: boolean;
  isPracticeMode?: boolean;
  floor?: number;
  modifier?: TowerModifier;
  onFinish: (winnerName: string) => void;
}

const GAUGE_MAX = 1000;
const TICK_MS = 25; // Base tick rate for gauge
const LOG_DELAY = 800; // Base delay between staggered logs

const BattleArena: React.FC<BattleArenaProps> = ({ playerVessel, playerSkills, playerPet, playerVessels, isTowerMode, isPracticeMode, floor = 1, modifier, onFinish }) => {
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [battleOver, setBattleOver] = useState(false);
  const [commentary, setCommentary] = useState<string>('');
  const [loadingCommentary, setLoadingCommentary] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState<0.5 | 1 | 2.5 | 5>(1);
  const [hasTaggedIn, setHasTaggedIn] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  
  // Staggering state
  const [pendingLogs, setPendingLogs] = useState<BattleLog[]>([]);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);

  const initialPlayerStats = useMemo(() => {
    const stats = { ...playerVessel.baseStats };
    if (isTowerMode && modifier) {
      if (modifier.effect === 'atk_up') stats.atk *= (1 + modifier.magnitude);
      if (modifier.effect === 'def_up') stats.def *= (1 + modifier.magnitude);
    }
    return stats;
  }, [playerVessel, isTowerMode, modifier]);

  const [player, setPlayer] = useState<BattleUnit>({
    vessel: playerVessel,
    currentStats: initialPlayerStats,
    skills: playerSkills,
    pet: playerPet,
    statusEffects: [],
    gauge: 0
  });

  const [opponent, setOpponent] = useState<BattleUnit>({
    vessel: {
        id: isPracticeMode ? 'dummy' : (isTowerMode ? `tower_${floor}` : 'arena_opponent'),
        name: isPracticeMode ? 'Practice Dummy' : (isTowerMode ? `Floor ${floor} Guardian` : 'Shadow Duelist'),
        title: isPracticeMode ? 'Immobile Target' : (isTowerMode ? 'Ethereal Sentinel' : 'Arena Challenger'),
        element: playerVessel.element,
        weaponType: playerVessel.weaponType,
        rarity: isPracticeMode ? 'Common' : (isTowerMode ? 'Epic' : 'Rare'),
        avatar: isPracticeMode ? 'https://picsum.photos/seed/dummy/200' : `https://picsum.photos/seed/enemy_${floor}/200`,
        baseStats: isPracticeMode ? { ...playerVessel.baseStats, hp: 50000, maxHp: 50000, spd: 1, def: 50 } : 
                  { ...playerVessel.baseStats, 
                    hp: playerVessel.baseStats.hp + (isTowerMode ? floor * 400 : 300), 
                    maxHp: playerVessel.baseStats.hp + (isTowerMode ? floor * 400 : 300),
                    atk: playerVessel.baseStats.atk + (isTowerMode ? floor * 15 : 0)
                  }
    },
    currentStats: isPracticeMode ? 
        { ...playerVessel.baseStats, hp: 50000, maxHp: 50000, spd: 1, def: 50 } :
        { ...playerVessel.baseStats, 
          hp: playerVessel.baseStats.hp + (isTowerMode ? floor * 400 : 300), 
          maxHp: playerVessel.baseStats.hp + (isTowerMode ? floor * 400 : 300),
          atk: playerVessel.baseStats.atk + (isTowerMode ? floor * 15 : 0),
          mana: 100,
          maxMana: 100
        },
    skills: playerSkills.slice(0, 3),
    statusEffects: [],
    gauge: 0
  });

  const logEndRef = useRef<HTMLDivElement>(null);
  const turnRef = useRef(1);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Log Dispatcher: Pulls from pendingLogs and adds to visible logs
  useEffect(() => {
    if (pendingLogs.length === 0) {
      if (isProcessingTurn) setIsProcessingTurn(false);
      return;
    }

    const timer = setTimeout(() => {
      const [nextLog, ...remaining] = pendingLogs;
      setLogs(prev => [...prev, nextLog]);
      setPendingLogs(remaining);
    }, LOG_DELAY / battleSpeed);

    return () => clearTimeout(timer);
  }, [pendingLogs, battleSpeed, isProcessingTurn]);

  const runTick = () => {
    if (battleOver || showTagMenu || isProcessingTurn || pendingLogs.length > 0) return;

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

    // A turn begins
    setIsProcessingTurn(true);
    activeUnit.gauge = 0;
    const turn = turnRef.current++;
    let turnLogs: BattleLog[] = [];

    // 1. Check Status Effects
    const isStunned = activeUnit.statusEffects.some(e => e.type === 'Stun' || e.type === 'Frozen');
    if (isStunned) {
        turnLogs.push({ turn, message: `>> ${activeUnit.vessel.name} is incapacitated! Skipping turn...`, type: 'status' });
        activeUnit.statusEffects = activeUnit.statusEffects.map(e => ({ ...e, duration: e.duration - 1 })).filter(e => e.duration > 0);
        if (activeUnit === p) setPlayer(activeUnit); else setOpponent(activeUnit);
        setPendingLogs(turnLogs);
        return;
    }

    // 2. Mana Regen
    activeUnit.currentStats.mana = Math.min(activeUnit.currentStats.maxMana, activeUnit.currentStats.mana + 5);

    // 3. Pet Trigger
    if (activeUnit.pet && Math.random() < activeUnit.pet.triggerChance) {
        turnLogs.push({ turn, message: `${activeUnit.pet.icon} ${activeUnit.pet.name} intervenes with [${activeUnit.pet.effect}]!`, type: 'pet' });
        activeUnit.currentStats.atk *= 1.05;
    }

    // 4. Skill Selection
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
        let pwr = usedSkill.power;
        
        if (isTowerMode && modifier) {
          if (modifier.effect === 'fire_boost' && usedSkill.category === 'Pyromancy') pwr *= (1 + modifier.magnitude);
          if (modifier.effect === 'lightning_boost' && usedSkill.category === 'Voltmancy') pwr *= (1 + modifier.magnitude);
        }

        damage = Math.floor((activeUnit.currentStats.atk * pwr) - (defender.currentStats.def * 0.4));
        turnLogs.push({ turn, message: `★ ${activeUnit.vessel.name} unleashes: [${usedSkill.name}]!`, type: 'skill' });
        
        if (usedSkill.id === 'deep_freeze' && Math.random() < 0.2) {
            defender.statusEffects.push({ name: 'Frozen', type: 'Frozen', duration: 1 });
            turnLogs.push({ turn, message: `❄ ${defender.vessel.name} is frozen solid!`, type: 'status' });
        }
        if (usedSkill.id === 'cinder_wave') {
            defender.statusEffects.push({ name: 'Burn', type: 'Burn', duration: 3, magnitude: 50 });
            turnLogs.push({ turn, message: `🔥 ${defender.vessel.name} is caught in the cinder!`, type: 'status' });
        }
    } else {
        damage = Math.floor(activeUnit.currentStats.atk - defender.currentStats.def);
        turnLogs.push({ turn, message: `${activeUnit.vessel.name} lunges with a precise strike.`, type: 'attack' });
    }

    damage = Math.max(20, damage);
    defender.currentStats.hp -= damage;
    turnLogs.push({ turn, message: `[REPORT] -${damage} DMG received by ${defender.vessel.name}.`, type: 'info' });

    activeUnit.statusEffects.forEach(e => {
        if (e.type === 'Burn' || e.type === 'Poison') {
            const tickDmg = e.magnitude || 50;
            activeUnit.currentStats.hp -= tickDmg;
            turnLogs.push({ turn, message: `! ${activeUnit.vessel.name} suffers ${tickDmg} tick dmg from ${e.type}.`, type: 'status' });
        }
    });

    activeUnit.statusEffects = activeUnit.statusEffects.map(e => ({ ...e, duration: e.duration - 1 })).filter(e => e.duration > 0);

    if (activeUnit === p) {
        setPlayer(activeUnit);
        setOpponent(defender);
    } else {
        setPlayer(defender);
        setOpponent(activeUnit);
    }
    setPendingLogs(turnLogs);

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
        }
    }
  };

  useEffect(() => {
    const interval = (TICK_MS / (battleSpeed > 1 ? battleSpeed : 1));
    const timer = setInterval(() => {
      if (!battleOver) runTick();
    }, interval);
    return () => clearInterval(timer);
  }, [player, opponent, battleOver, battleSpeed, showTagMenu, isProcessingTurn, pendingLogs]);

  const handleFinish = () => {
    onFinish(player.currentStats.hp > 0 ? player.vessel.name : opponent.vessel.name);
  };

  const tagInVessel = (v: Vessel) => {
    setPlayer(prev => ({
        ...prev,
        vessel: v,
        currentStats: { ...v.baseStats, hp: prev.currentStats.hp },
        gauge: 0
    }));
    setHasTaggedIn(true);
    setShowTagMenu(false);
    setPendingLogs([{ turn: turnRef.current, message: `SYSTEM: EMERGENCY TAG DETECTED! ${v.name} synced.`, type: 'info' }]);
  };

  const isPlayerWinner = player.currentStats.hp > 0;

  return (
    <div className="max-w-4xl mx-auto glass-panel rounded-[3rem] p-8 relative overflow-hidden">
      
      {showTagMenu && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl z-[60] flex flex-col items-center justify-center p-12">
            <h3 className="font-game text-5xl text-white mb-10">SELECT TAG PARTNER</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                {playerVessels.filter(v => v.id !== player.vessel.id).map(v => (
                    <div key={v.id} onClick={() => tagInVessel(v)} className="glass-card rounded-[2rem] p-6 cursor-pointer hover:border-orange-500 transition-all text-center">
                        <img src={v.avatar} className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-white/10" />
                        <div className="font-game text-white text-lg">{v.name}</div>
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{v.element}</div>
                    </div>
                ))}
            </div>
            <button onClick={() => setShowTagMenu(false)} className="mt-12 text-slate-500 font-game text-2xl hover:text-white transition-colors">CANCEL</button>
        </div>
      )}

      <div className="flex justify-between items-center mb-8 px-4">
        <div className="flex items-center gap-4">
          <div className="studio-text text-[9px] uppercase tracking-[0.3em]">
            {isPracticeMode ? 'SIMULATION MODE' : (isTowerMode ? `ALGORITHM ASCENT F${floor}` : 'ARENA PROTOCOL')}
          </div>
          {isTowerMode && modifier && (
            <div className="bg-orange-500/20 text-orange-400 text-[8px] px-3 py-1 rounded-full font-black border border-orange-500/30">
              MOD: {modifier.name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex glass-panel rounded-full p-1 border-white/5">
              {[
                { val: 0.5, label: 'CINEMATIC' },
                { val: 1, label: 'STANDARD' },
                { val: 2.5, label: 'TURBO' },
                { val: 5, label: 'TURBO X2' }
              ].map(s => (
                <button 
                    key={s.label}
                    onClick={() => setBattleSpeed(s.val as any)} 
                    className={`px-4 py-1.5 rounded-full text-[8px] font-black transition-all ${battleSpeed === s.val ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    {s.label}
                </button>
              ))}
          </div>
          {!hasTaggedIn && !battleOver && !isPracticeMode && (
             <button onClick={() => setShowTagMenu(true)} className="glass-panel border-purple-500/50 text-purple-400 px-4 py-1.5 rounded-full text-[8px] font-black hover:bg-purple-500/10 transition-all animate-pulse">TAG PARTNER</button>
          )}
          <button onClick={handleFinish} className="glass-panel border-white/10 text-slate-400 px-4 py-1.5 rounded-full text-[8px] font-black hover:text-white transition-all">TERMINATE</button>
        </div>
      </div>

      <div className="h-[400px] relative glass-panel rounded-[3rem] mb-8 flex items-center justify-between px-20 border-white/5 bg-slate-900/40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none"></div>
        
        {/* Player Side */}
        <div className={`flex flex-col items-center z-10 transition-all duration-700 ${player.currentStats.hp <= 0 ? 'grayscale rotate-12 opacity-30 translate-y-10' : 'animate-float'}`}>
          <div className="relative group hologram-effect">
            <img src={player.vessel.avatar} className="w-44 h-44 rounded-full border-8 border-white/5 shadow-2xl object-cover relative z-10" />
            {player.pet && <div className="absolute -top-8 -left-8 text-6xl drop-shadow-2xl z-20 animate-bounce">{player.pet.icon}</div>}
            
            <div className="absolute -bottom-4 left-0 w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 z-20">
              <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all" style={{ width: `${(player.gauge / GAUGE_MAX) * 100}%` }} />
            </div>
          </div>
          
          <div className="mt-10 w-48 h-6 glass-panel rounded-full overflow-hidden relative border-white/10 shadow-lg">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500" style={{ width: `${(player.currentStats.hp/player.currentStats.maxHp)*100}%` }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-black text-white drop-shadow-sm">{Math.max(0, player.currentStats.hp)} / {player.currentStats.maxHp}</span>
            </div>
          </div>
          <div className="mt-4 font-game text-xl text-white uppercase">{player.vessel.name}</div>
        </div>

        {/* VS Spacer */}
        <div className="flex flex-col items-center justify-center gap-4 z-10">
          <div className="font-game text-4xl text-slate-700 italic">VS</div>
          {loadingCommentary && <div className="animate-spin text-orange-500 text-3xl">⚔️</div>}
        </div>

        {/* Opponent Side */}
        <div className={`flex flex-col items-center z-10 transition-all duration-700 ${opponent.currentStats.hp <= 0 ? 'grayscale -rotate-12 opacity-30 translate-y-10' : 'animate-float'}`} style={{ animationDelay: '0.5s' }}>
          <div className="relative group hologram-effect">
            <img src={opponent.vessel.avatar} className="w-44 h-44 rounded-full border-8 border-white/5 shadow-2xl object-cover relative z-10" />
            <div className="absolute -bottom-4 left-0 w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 z-20">
              <div className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all" style={{ width: `${(opponent.gauge / GAUGE_MAX) * 100}%` }} />
            </div>
          </div>
          
          <div className="mt-10 w-48 h-6 glass-panel rounded-full overflow-hidden relative border-white/10 shadow-lg">
            <div className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-500" style={{ width: `${(opponent.currentStats.hp/opponent.currentStats.maxHp)*100}%` }} />
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-[10px] font-black text-white drop-shadow-sm">{Math.max(0, opponent.currentStats.hp)} / {opponent.currentStats.maxHp}</span>
            </div>
          </div>
          <div className="mt-4 font-game text-xl text-white uppercase">{opponent.vessel.name}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-64">
        <div className="glass-panel bg-slate-900/60 rounded-[2.5rem] p-8 flex flex-col border-white/5 overflow-hidden">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">COMBAT ANALYTICS</div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {logs.map((log, i) => (
              <div key={i} className={`text-[10px] font-bold ${
                log.type === 'skill' ? 'text-orange-400' : 
                log.type === 'status' ? 'text-cyan-400' : 
                log.type === 'pet' ? 'text-purple-400' : 
                log.type === 'attack' ? 'text-slate-300' : 'text-slate-500'
              }`}>
                <span className="text-slate-700 mr-2">[{log.turn}]</span>
                {log.message}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

        <div className="glass-panel bg-slate-900/60 rounded-[2.5rem] p-8 border-white/5 relative flex flex-col justify-center text-center">
            {battleOver ? (
                <div className="animate-in fade-in zoom-in duration-500">
                    <div className="font-game text-4xl text-white mb-4 uppercase">{isPlayerWinner ? 'Victory' : 'Defeat'}</div>
                    <div className="text-slate-400 text-xs italic px-6 leading-relaxed mb-8">
                        {loadingCommentary ? "Analyzing tactical outcome..." : commentary}
                    </div>
                    <button onClick={handleFinish} className="bubbly-btn bg-orange-600 text-white px-12 py-4 rounded-full font-game text-xl hover:bg-orange-500 transition-all uppercase tracking-widest">EXIT ARENA</button>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">SIMULATION ACTIVE</div>
                    <div className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse delay-75"></div>
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse delay-150"></div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// Fix for Module '"file:///components/BattleArena"' has no default export.
export default BattleArena;
