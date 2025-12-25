
import React, { useState, useMemo, useEffect } from 'react';
import { Vessel, Skill, GameState, Pet, SkillCategory, ElementType, TowerModifier } from './types';
import { INITIAL_VESSELS, SKILLS, PETS, TOWER_MODIFIERS } from './constants';
import VesselCard from './components/VesselCard';
import BattleArena from './components/BattleArena';

const ROOMS_PER_FLOOR = 5;
const LOSS_ADVICE_THRESHOLD = 3;
const TRAINING_COST = 500;
const RECOVERY_DURATION_MS = 60000; // 1 minute recovery for demo purposes

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    playerName: '',
    village: null,
    playerVessels: INITIAL_VESSELS,
    activeVesselId: INITIAL_VESSELS[0].id,
    equippedSkills: SKILLS.slice(0, 6).map(s => s.id),
    activePetId: PETS[0].id,
    gold: 5000,
    diamonds: 200,
    alchemyDust: 45,
    towerFloor: 1,
    towerRoom: 1,
    consecutiveTowerLosses: 0,
    essenceShards: 80,
    aetherCrystals: 50,
    dailyTrainingSessions: 0,
    maxDailyTraining: 10,
    stats: {
      dailyWins: 0,
      dailyLosses: 0,
      totalBattles: 0
    }
  });

  const [view, setView] = useState<'onboarding' | 'hub' | 'vessels' | 'skills' | 'battle' | 'forge' | 'tower' | 'pets' | 'world' | 'towerShop' | 'dojo'>('onboarding');
  const [battleSource, setBattleSource] = useState<'arena' | 'tower' | 'practice' | 'world'>('arena');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Polling for recovery timers
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeVessel = gameState.playerVessels.find(v => v.id === gameState.activeVesselId)!;
  const equippedSkillsData = SKILLS.filter(s => gameState.equippedSkills.includes(s.id));
  const activePet = PETS.find(p => p.id === gameState.activePetId);

  const currentFloorModifier = useMemo(() => {
    if (gameState.towerFloor % 5 === 0) {
      return TOWER_MODIFIERS[gameState.towerFloor % TOWER_MODIFIERS.length];
    }
    return undefined;
  }, [gameState.towerFloor]);

  const handleBattleFinish = (winnerName: string) => {
    if (battleSource === 'practice') {
        setView('skills');
        return;
    }

    const isPlayerWin = winnerName === activeVessel.name;
    
    setGameState(prev => {
        const newState = { ...prev, stats: { ...prev.stats } };
        newState.stats.totalBattles += 1;
        
        // Handle Vessel Recovery if lost
        if (!isPlayerWin) {
            newState.stats.dailyLosses += 1;
            newState.playerVessels = prev.playerVessels.map(v => {
                if (v.id === prev.activeVesselId) {
                    return { ...v, recoveryEndTime: Date.now() + RECOVERY_DURATION_MS };
                }
                return v;
            });

            if (battleSource === 'tower') {
                newState.consecutiveTowerLosses += 1;
            }
        } else {
            newState.stats.dailyWins += 1;
            newState.gold += 250;
            newState.essenceShards += 10;
            
            if (battleSource === 'tower') {
                newState.consecutiveTowerLosses = 0;
                if (prev.towerRoom >= ROOMS_PER_FLOOR) {
                    newState.towerFloor += 1;
                    newState.towerRoom = 1;
                    newState.aetherCrystals += 50; 
                } else {
                    newState.towerRoom += 1;
                    newState.aetherCrystals += 10;
                }
            }
        }
        return newState;
    });

    setView(battleSource === 'tower' ? 'tower' : 'hub');
  };

  const handleTrain = (statType: 'atk' | 'spd' | 'maxHp') => {
    if (activeVessel.recoveryEndTime && activeVessel.recoveryEndTime > currentTime) {
        alert("This vessel is too exhausted to train! Let it recover.");
        return;
    }
    if (gameState.dailyTrainingSessions >= gameState.maxDailyTraining) {
        alert("Daily limit reached! Master requires rest.");
        return;
    }
    if (gameState.gold < TRAINING_COST) {
        alert("Insufficient gold for training.");
        return;
    }

    setGameState(prev => {
        const updatedVessels = prev.playerVessels.map(v => {
            if (v.id === prev.activeVesselId) {
                const gain = statType === 'maxHp' ? 100 : 5;
                const newBaseStats = { ...v.baseStats };
                if (statType === 'atk') newBaseStats.atk += gain;
                if (statType === 'spd') newBaseStats.spd += gain;
                if (statType === 'maxHp') {
                    newBaseStats.maxHp += gain;
                    newBaseStats.hp += gain;
                }
                return { ...v, baseStats: newBaseStats };
            }
            return v;
        });

        return {
            ...prev,
            gold: prev.gold - TRAINING_COST,
            dailyTrainingSessions: prev.dailyTrainingSessions + 1,
            playerVessels: updatedVessels
        };
    });
  };

  const startBattle = (source: 'arena' | 'tower' | 'practice' | 'world') => {
    if (source !== 'practice' && activeVessel.recoveryEndTime && activeVessel.recoveryEndTime > currentTime) {
        alert("Your active vessel is currently recovering! Switch vessels or wait for it to recover.");
        return;
    }
    setBattleSource(source);
    setView('battle');
  };

  if (view === 'onboarding') {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0f172a]">
            <div className="glass-panel rounded-[3rem] p-16 w-full max-w-2xl text-center border-t border-white/20">
                <div className="studio-text text-[10px] mb-6">ULTRADEMIC STUDIOS PRESENTS</div>
                <h1 className="font-game text-7xl text-orange-500 mb-4 drop-shadow-2xl uppercase">NINJA NEXUS</h1>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.4em] mb-12">Awaken Your Vessel</p>
                
                <div className="space-y-10">
                    <div className="text-left">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-3 block">IDENTIFICATION</label>
                        <input 
                            type="text" 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 font-game text-3xl text-white outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-700"
                            placeholder="NAME YOUR LEGACY..."
                            value={gameState.playerName}
                            onChange={(e) => setGameState(prev => ({...prev, playerName: e.target.value}))}
                        />
                    </div>

                    <div className="text-left">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-4 block">SELECT ORIGIN NODE</label>
                        <div className="grid grid-cols-5 gap-3">
                            {Object.values(ElementType).map(el => (
                                <button 
                                    key={el} 
                                    onClick={() => setGameState(prev => ({...prev, village: el}))}
                                    className={`p-4 rounded-2xl border transition-all hover:scale-105 ${gameState.village === el ? 'border-orange-500 bg-orange-500/20 text-white' : 'border-white/5 bg-white/5 text-slate-500 opacity-60'}`}
                                >
                                    <div className="text-2xl mb-1">{el === 'Fire' ? '🔥' : el === 'Water' ? '💧' : el === 'Wind' ? '🌪️' : el === 'Earth' ? '⛰️' : '⚡'}</div>
                                    <div className="text-[7px] font-black uppercase">{el}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={() => gameState.playerName && gameState.village && setView('hub')} 
                        className={`bubbly-btn w-full py-8 rounded-3xl font-game text-4xl shadow-2xl transition-all uppercase tracking-widest ${gameState.playerName && gameState.village ? 'bg-orange-500 text-white hover:bg-orange-400' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                    >
                        INITIATE SYNC
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 text-slate-200">
      <div className="fixed top-0 left-0 w-full z-50 py-3 flex justify-center bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5">
        <div className="studio-text text-[9px] uppercase tracking-[0.4em]">Ultrademic Studios • Production Build v1.0.4</div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-16">
        <header className="flex flex-col gap-6 py-8">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 glass-panel rounded-3xl flex items-center justify-center text-orange-500 font-game text-5xl shadow-orange-500/20 shadow-lg border-orange-500/30">N</div>
                    <div>
                        <h1 className="font-game text-5xl text-white tracking-tighter uppercase">NINJA NEXUS</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{gameState.playerName}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{gameState.village} WARDEN</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="glass-panel rounded-2xl px-6 py-3 flex flex-col items-center">
                        <span className="text-[8px] font-black text-slate-500 uppercase">CREDITS</span>
                        <span className="font-game text-2xl text-yellow-500">💰 {gameState.gold.toLocaleString()}</span>
                    </div>
                    <div className="glass-panel rounded-2xl px-6 py-3 flex flex-col items-center">
                        <span className="text-[8px] font-black text-slate-500 uppercase">AETHER</span>
                        <span className="font-game text-2xl text-cyan-400">✨ {gameState.aetherCrystals}</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-center">
                <div className="glass-panel rounded-full px-12 py-4 flex items-center gap-16 border-white/10">
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black text-green-500/70 uppercase tracking-widest">VICTORIES</span>
                        <div className="font-game text-2xl text-green-400">{gameState.stats.dailyWins}</div>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black text-red-500/70 uppercase tracking-widest">DEFEATS</span>
                        <div className="font-game text-2xl text-red-400">{gameState.stats.dailyLosses}</div>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black text-orange-500/70 uppercase tracking-widest">BATTLES</span>
                        <div className="font-game text-2xl text-orange-400">{gameState.stats.totalBattles}</div>
                    </div>
                </div>
            </div>
        </header>

        {view === 'hub' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-1000">
                <div className="lg:col-span-7 glass-panel rounded-[4rem] p-12 flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none"></div>
                    
                    <div className="relative hologram-effect group">
                        <img 
                            src={activeVessel.avatar} 
                            className={`w-72 h-72 rounded-full border-8 border-white/5 shadow-2xl animate-float object-cover z-10 relative ${activeVessel.recoveryEndTime && activeVessel.recoveryEndTime > currentTime ? 'grayscale brightness-50' : ''}`} 
                        />
                        {activePet && (
                            <div className="absolute -bottom-4 -left-4 glass-panel rounded-3xl p-5 text-5xl shadow-2xl border-orange-500/50 transform hover:scale-110 transition-all cursor-pointer z-20">
                                {activePet.icon}
                            </div>
                        )}
                        {activeVessel.recoveryEndTime && activeVessel.recoveryEndTime > currentTime && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                <div className="font-game text-4xl text-orange-500 drop-shadow-lg">RECOVERING</div>
                                <div className="text-white font-black text-xl mt-2">{Math.ceil((activeVessel.recoveryEndTime - currentTime) / 1000)}s</div>
                            </div>
                        )}
                    </div>

                    <div className="text-center mt-12 z-10">
                        <h2 className="font-game text-6xl text-white drop-shadow-xl uppercase">{activeVessel.name}</h2>
                        <div className="flex gap-3 justify-center mt-4">
                            {['title', 'element', 'weaponType'].map((k) => (
                                <span key={k} className="glass-panel text-[9px] font-black px-4 py-2 rounded-full uppercase text-slate-400 border-white/5">
                                    {(activeVessel as any)[k]}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-5 w-full mt-12 z-10 px-8">
                        {equippedSkillsData.map((s, idx) => (
                            <div key={s.id} className="glass-card p-5 rounded-3xl text-center relative group">
                                <div className={`w-2 h-2 rounded-full ${s.color} absolute top-4 right-4 shadow-lg shadow-${s.color.split('-')[1]}-500/50`}></div>
                                <div className="text-[10px] font-black text-slate-300 mb-1">{s.name}</div>
                                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{s.manaCost} MP COST</div>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => startBattle('arena')} 
                        disabled={activeVessel.recoveryEndTime && activeVessel.recoveryEndTime > currentTime}
                        className={`bubbly-btn w-full mt-12 font-game text-4xl py-8 rounded-[2.5rem] shadow-xl transition-all border-t border-white/20 ${activeVessel.recoveryEndTime && activeVessel.recoveryEndTime > currentTime ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-500 hover:shadow-orange-500/20'}`}
                    >
                        {activeVessel.recoveryEndTime && activeVessel.recoveryEndTime > currentTime ? 'EXHAUSTED' : 'ENTER ARENA SIMULATION'}
                    </button>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div onClick={() => setView('dojo')} className="glass-card p-10 rounded-[3rem] cursor-pointer flex items-center gap-8 group">
                        <div className="bg-cyan-500/20 text-cyan-400 w-24 h-24 rounded-3xl flex items-center justify-center text-5xl group-hover:scale-110 transition-all border border-cyan-500/30">🥋</div>
                        <div>
                            <h3 className="font-game text-3xl text-white">The Dojo</h3>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">Sessions: {gameState.dailyTrainingSessions}/{gameState.maxDailyTraining}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div onClick={() => setView('vessels')} className="glass-card p-8 rounded-[3rem] cursor-pointer text-center group">
                            <div className="text-5xl mb-3 group-hover:rotate-12 transition-all">🛡️</div>
                            <h3 className="font-game text-2xl text-white">Vessels</h3>
                        </div>
                        <div onClick={() => setView('skills')} className="glass-card p-8 rounded-[3rem] cursor-pointer text-center group">
                            <div className="text-5xl mb-3 group-hover:rotate-12 transition-all">📜</div>
                            <h3 className="font-game text-2xl text-white">Arts</h3>
                        </div>
                    </div>

                    <div onClick={() => setView('tower')} className="glass-panel p-10 rounded-[3rem] cursor-pointer border-t border-slate-700 bg-slate-900/50 group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent"></div>
                        <div className="flex items-center gap-8 relative z-10">
                            <div className="bg-white/5 text-white w-24 h-24 rounded-3xl flex items-center justify-center text-5xl group-hover:scale-110 transition-all border border-white/10">🏰</div>
                            <div>
                                <h3 className="font-game text-4xl text-white leading-none uppercase">The Tower</h3>
                                <p className="text-[10px] text-orange-500 uppercase font-black tracking-widest mt-3">Floor {gameState.towerFloor} • Room {gameState.towerRoom}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {view === 'dojo' && (
            <div className="glass-panel rounded-[4rem] p-16 max-w-4xl mx-auto animate-in zoom-in duration-500 relative">
                <div className="flex justify-between items-start mb-16">
                    <div>
                        <div className="studio-text text-[9px] mb-2">ULTRADEMIC TRAINING FACILITY</div>
                        <h2 className="font-game text-7xl text-white leading-none">GRANDMASTER DOJO</h2>
                        <div className="flex gap-4 mt-6">
                            <div className="glass-card px-6 py-2 rounded-full text-cyan-400 text-xs font-bold uppercase tracking-widest">
                                Daily: {gameState.dailyTrainingSessions} / {gameState.maxDailyTraining}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setView('hub')} className="text-slate-600 hover:text-white transition-all text-5xl">×</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {[
                        { type: 'atk', label: 'STR STRIKE', gain: '+5 ATK', color: 'red', icon: '🔥' },
                        { type: 'spd', label: 'SPD REFLEX', gain: '+5 SPD', color: 'cyan', icon: '⚡' },
                        { type: 'maxHp', label: 'HP FLOW', gain: '+100 HP', color: 'green', icon: '🍃' }
                    ].map(t => (
                        <div key={t.type} className="flex flex-col items-center">
                            <button 
                                onClick={() => handleTrain(t.type as any)}
                                className={`glass-card p-10 rounded-[3rem] w-full text-center group hover:border-${t.color}-500/50`}
                            >
                                <div className="text-5xl mb-4 group-hover:scale-125 transition-all">{t.icon}</div>
                                <div className="font-game text-2xl text-white mb-2">{t.label}</div>
                                <div className={`text-[10px] font-black text-${t.color}-500 uppercase`}>{t.gain}</div>
                            </button>
                            <div className="text-[9px] text-slate-500 mt-4 font-black uppercase tracking-widest">{TRAINING_COST} GOLD</div>
                        </div>
                    ))}
                </div>

                <div className="glass-panel rounded-3xl p-8 flex items-center justify-between border-white/5">
                    <div className="flex items-center gap-6">
                        <img src={activeVessel.avatar} className={`w-20 h-20 rounded-full border-2 border-white/10 ${activeVessel.recoveryEndTime && activeVessel.recoveryEndTime > currentTime ? 'grayscale' : ''}`} />
                        <div>
                            <div className="text-slate-400 text-[10px] font-black uppercase">Current Subject</div>
                            <div className="font-game text-2xl text-white uppercase">{activeVessel.name}</div>
                            {activeVessel.recoveryEndTime && activeVessel.recoveryEndTime > currentTime && (
                                <div className="text-orange-500 text-[8px] font-black uppercase tracking-widest mt-1">Exhausted: {Math.ceil((activeVessel.recoveryEndTime - currentTime)/1000)}s</div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-10">
                        <div className="text-center">
                            <div className="text-[10px] text-slate-500 font-black">HP</div>
                            <div className="font-game text-xl">{activeVessel.baseStats.maxHp}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] text-slate-500 font-black">ATK</div>
                            <div className="font-game text-xl">{activeVessel.baseStats.atk}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] text-slate-500 font-black">SPD</div>
                            <div className="font-game text-xl">{activeVessel.baseStats.spd}</div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {view === 'tower' && (
            <div className="glass-panel rounded-[5rem] p-20 max-w-5xl mx-auto animate-in zoom-in duration-500 overflow-hidden relative border-t border-white/10">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
                
                <div className="flex justify-between items-start mb-16">
                    <div>
                        <div className="studio-text text-[9px] mb-2 uppercase">Infinite Algorithm Ascent</div>
                        <h2 className="font-game text-8xl text-white leading-none uppercase">FLOOR {gameState.towerFloor}</h2>
                        <p className="text-orange-500 text-sm font-black uppercase tracking-[0.5em] mt-6">Sequence Room {gameState.towerRoom} of {ROOMS_PER_FLOOR}</p>
                    </div>
                    <button onClick={() => setView('hub')} className="text-slate-600 hover:text-white text-6xl transition-all">×</button>
                </div>

                {gameState.consecutiveTowerLosses >= LOSS_ADVICE_THRESHOLD && (
                    <div className="mb-12 glass-panel border-red-500/30 p-10 rounded-[3rem] animate-pulse bg-red-500/5">
                        <div className="text-red-400 font-game text-3xl mb-3">SYNC ERROR DETECTED</div>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">
                            Vessel power insufficient for current floor. {gameState.consecutiveTowerLosses} defeats logged. 
                            Training recommended at the Dojo.
                        </p>
                    </div>
                )}

                <div className="flex justify-between items-center px-12 mb-20 relative">
                    <div className="absolute top-1/2 left-12 right-12 h-px bg-white/5 -z-10"></div>
                    {Array.from({ length: ROOMS_PER_FLOOR }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-4">
                            <div className={`w-24 h-24 rounded-[2rem] border-2 flex items-center justify-center transition-all duration-700 ${
                                i + 1 === gameState.towerRoom ? 'bg-orange-500 border-white scale-110 shadow-orange-500/40 shadow-2xl' :
                                i + 1 < gameState.towerRoom ? 'bg-green-500/20 border-green-500/40 opacity-40' :
                                'bg-white/5 border-white/10 opacity-20'
                            }`}>
                                <span className="text-white font-game text-4xl">
                                    {i + 1 === ROOMS_PER_FLOOR ? '💀' : (i + 1)}
                                </span>
                            </div>
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                {i + 1 === ROOMS_PER_FLOOR ? 'BOSS' : `ROOM ${i+1}`}
                            </div>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={() => startBattle('tower')} 
                    disabled={activeVessel.recoveryEndTime && activeVessel.recoveryEndTime > currentTime}
                    className={`bubbly-btn w-full font-game text-5xl py-12 rounded-[3rem] shadow-2xl hover:scale-[1.02] transition-all uppercase tracking-widest ${activeVessel.recoveryEndTime && activeVessel.recoveryEndTime > currentTime ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-900'}`}
                >
                    {activeVessel.recoveryEndTime && activeVessel.recoveryEndTime > currentTime ? 'VESSEL RECOVERING...' : (gameState.towerRoom === ROOMS_PER_FLOOR ? 'EXECUTE OVERLORD' : 'BREACH SECTOR')}
                </button>
            </div>
        )}

        {view === 'battle' && (
            <div className="animate-in zoom-in duration-500">
                <BattleArena 
                    playerVessel={activeVessel} 
                    playerSkills={equippedSkillsData} 
                    playerPet={activePet || undefined} 
                    playerVessels={gameState.playerVessels}
                    isTowerMode={battleSource === 'tower'}
                    floor={gameState.towerFloor}
                    modifier={currentFloorModifier}
                    onFinish={handleBattleFinish} 
                />
            </div>
        )}

        {view === 'vessels' && (
            <div className="animate-in slide-in-from-left-10 duration-700">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <div className="studio-text text-[9px] mb-2 uppercase">Hardware Selection Interface</div>
                        <h2 className="font-game text-7xl text-white uppercase">THE SOUL WEAVE</h2>
                    </div>
                    <button onClick={() => setView('hub')} className="glass-panel px-10 py-4 rounded-full font-game text-white text-xl hover:bg-white/10">BACK TO TERMINAL</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    {gameState.playerVessels.map(v => (
                        <VesselCard 
                            key={v.id} 
                            vessel={v} 
                            isSelected={v.id === gameState.activeVesselId} 
                            currentTime={currentTime}
                            onClick={() => setGameState(prev => ({ ...prev, activeVesselId: v.id }))} 
                        />
                    ))}
                </div>
            </div>
        )}
      </div>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-panel rounded-full px-12 py-5 flex gap-12 border-t border-white/20 z-50">
        {[
          { icon: '🏠', view: 'hub', label: 'HUB' },
          { icon: '🥋', view: 'vessels', label: 'VESSEL' },
          { icon: '📜', view: 'skills', label: 'ARTS' },
          { icon: '🏯', view: 'tower', label: 'TOWER' },
          { icon: '💪', view: 'dojo', label: 'TRAIN' }
        ].map(item => (
          <button 
            key={item.view}
            onClick={() => setView(item.view as any)} 
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${view === item.view ? 'text-orange-500 scale-110 drop-shadow-orange' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <span className="text-3xl">{item.icon}</span>
            <span className="text-[7px] font-black tracking-widest uppercase">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
