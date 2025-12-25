
import React, { useState, useMemo } from 'react';
import { Vessel, Skill, GameState, Pet, SkillCategory, ElementType } from './types';
import { INITIAL_VESSELS, SKILLS, PETS } from './constants';
import VesselCard from './components/VesselCard';
import BattleArena from './components/BattleArena';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    playerVessels: INITIAL_VESSELS,
    activeVesselId: INITIAL_VESSELS[0].id,
    equippedSkills: SKILLS.slice(0, 6).map(s => s.id),
    activePetId: PETS[0].id,
    gold: 5000,
    diamonds: 200,
    alchemyDust: 45,
    towerFloor: 1,
    essenceShards: 80
  });

  const [view, setView] = useState<'hub' | 'vessels' | 'skills' | 'battle' | 'forge' | 'tower' | 'pets' | 'world'>('hub');
  const [activeTab, setActiveTab] = useState<SkillCategory | 'All'>('All');
  const [battleSource, setBattleSource] = useState<'arena' | 'tower' | 'practice' | 'world'>('arena');

  const activeVessel = gameState.playerVessels.find(v => v.id === gameState.activeVesselId)!;
  const equippedSkillsData = SKILLS.filter(s => gameState.equippedSkills.includes(s.id));
  const activePet = PETS.find(p => p.id === gameState.activePetId);

  const filteredSkills = useMemo(() => {
    if (activeTab === 'All') return SKILLS;
    return SKILLS.filter(s => s.category === activeTab);
  }, [activeTab]);

  const toggleSkill = (id: string) => {
    setGameState(prev => {
        const isEquipped = prev.equippedSkills.includes(id);
        if (isEquipped) return { ...prev, equippedSkills: prev.equippedSkills.filter(sid => sid !== id) };
        if (prev.equippedSkills.length < 6) return { ...prev, equippedSkills: [...prev.equippedSkills, id] };
        return prev;
    });
  }

  const handleBattleFinish = (winnerName: string) => {
    if (battleSource === 'practice') {
        setView('skills');
        return;
    }

    const isPlayerWin = winnerName === activeVessel.name;
    setGameState(prev => {
        const newState = { ...prev };
        if (isPlayerWin) {
            newState.gold += 250;
            newState.essenceShards += 10;
            if (battleSource === 'tower') {
                newState.towerFloor += 1;
            }
        }
        return newState;
    });
    setView('hub');
  };

  const startBattle = (source: 'arena' | 'tower' | 'practice' | 'world') => {
    setBattleSource(source);
    setView('battle');
  };

  const synthesize = (type: 'Vessel' | 'Gear') => {
    const cost = type === 'Vessel' ? 1000 : 500;
    if (gameState.gold < cost) {
        alert("Gold shortage in the Cloud City!");
        return;
    }
    const success = Math.random() < 0.4;
    setGameState(prev => ({
        ...prev,
        gold: prev.gold - cost,
        alchemyDust: success ? prev.alchemyDust : prev.alchemyDust + 20,
        essenceShards: success ? prev.essenceShards + 15 : prev.essenceShards
    }));
    alert(success ? "SUCCESS! Alchemy transcends your limits." : "FAILURE! Alchemy Dust collected for next time.");
  };

  const BIOMES = [
    { name: "Cinder Circus", element: ElementType.FIRE, icon: "🎪", top: "20%", left: "15%", vessel: "Ignis", desc: "A desert carnival where flames never die." },
    { name: "Rust-Belt Spire", element: ElementType.WIND, icon: "🏭", top: "35%", left: "45%", vessel: "Zephyr", desc: "Clockwork machinery fueled by howling gales." },
    { name: "Verdant Overgrowth", element: ElementType.EARTH, icon: "🍄", top: "70%", left: "20%", vessel: "Mother Mycelia", desc: "Nature has reclaimed the ancient foundries." },
    { name: "Eternal Reef", element: ElementType.WATER, icon: "🫧", top: "60%", left: "70%", vessel: "Kaito", desc: "Submerged secrets of the sunken empire." },
    { name: "Static Smithy", element: ElementType.LIGHTNING, icon: "🔨", top: "15%", left: "80%", vessel: "Tesla-Zane", desc: "Where energy is forged into soul-bound steel." },
  ];

  return (
    <div className="min-h-screen pb-24 max-w-5xl mx-auto px-4 paper-texture selection:bg-orange-100">
      <header className="flex justify-between items-center py-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl flex items-center justify-center text-white font-game text-4xl shadow-xl rotate-6 border-4 border-white">S</div>
          <div>
            <h1 className="font-game text-4xl text-orange-600 leading-none">SOUL CONVERGENCE</h1>
            <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.3em] mt-2">The Vessel Chronicles • v1.0</p>
          </div>
        </div>
        <div className="flex space-x-4">
          <div className="bg-white border-4 border-yellow-100 rounded-3xl px-5 py-2 flex flex-col items-center shadow-lg transition-transform hover:scale-105">
            <span className="text-[9px] font-black text-yellow-600 uppercase">GOLD</span>
            <span className="font-game text-xl text-gray-700">💰 {gameState.gold.toLocaleString()}</span>
          </div>
          <div className="bg-white border-4 border-blue-100 rounded-3xl px-5 py-2 flex flex-col items-center shadow-lg transition-transform hover:scale-105">
            <span className="text-[9px] font-black text-blue-600 uppercase">SHARDS</span>
            <span className="font-game text-xl text-gray-700">💎 {gameState.essenceShards}</span>
          </div>
        </div>
      </header>

      {view === 'hub' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Active Hero Spotlight */}
          <div className="lg:col-span-7 bg-white rounded-[4rem] p-12 shadow-2xl border-8 border-white flex flex-col items-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-orange-50 to-transparent -z-10 group-hover:h-56 transition-all duration-700"></div>
            
            <div className="relative">
                <img src={activeVessel.avatar} className="w-64 h-64 rounded-full border-8 border-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-float object-cover" />
                {activePet && (
                    <div className="absolute -bottom-4 -left-4 bg-white rounded-[2rem] p-5 text-5xl shadow-2xl border-4 border-orange-50 transform hover:rotate-12 transition-transform cursor-pointer">
                        {activePet.icon}
                    </div>
                )}
            </div>

            <div className="text-center mt-8">
                <h2 className="font-game text-5xl text-gray-800 drop-shadow-sm">{activeVessel.name}</h2>
                <div className="flex items-center justify-center space-x-2 mt-2">
                    <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">{activeVessel.title}</span>
                    <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">{activeVessel.element}</span>
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 w-full mt-10">
              {equippedSkillsData.map((s, idx) => (
                <div key={s.id} className={`${s.color} text-white text-[10px] font-black p-4 rounded-[1.5rem] shadow-xl text-center leading-tight transition-all hover:scale-110 active:scale-95 cursor-default ring-4 ring-white relative overflow-hidden group/skill`}>
                    <div className="absolute top-0 right-0 bg-black/20 px-2 py-1 rounded-bl-xl text-[8px]">{idx + 1}</div>
                    {s.name}
                    <div className="mt-1 opacity-60 text-[7px]">{s.manaCost} MP</div>
                </div>
              ))}
              {Array.from({ length: 6 - equippedSkillsData.length }).map((_, i) => (
                 <div key={i} className="bg-gray-100 border-4 border-dashed border-gray-200 rounded-[1.5rem] h-14 flex items-center justify-center text-gray-300 font-game text-[10px] uppercase">SLOT {equippedSkillsData.length + i + 1}</div>
              ))}
            </div>
            
            <button onClick={() => startBattle('arena')} className="bubbly-btn w-full mt-12 bg-red-500 text-white font-game text-4xl py-8 rounded-[3rem] shadow-[0_12px_0_rgb(185,28,28)] active:shadow-none hover:bg-red-600 transition-all flex items-center justify-center space-x-4">
               <span>ENTER THE ARENA</span>
            </button>
          </div>

          {/* Biome Navigation & Menu */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div onClick={() => setView('world')} className="bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-orange-50 cursor-pointer flex items-center space-x-8 hover:translate-x-4 transition-all group">
              <div className="bg-orange-500 text-white w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-xl group-hover:rotate-6 transition-transform">🗺️</div>
              <div>
                <h3 className="font-game text-3xl text-orange-600">World Map</h3>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Explore Biomes</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div onClick={() => setView('vessels')} className="bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-blue-50 cursor-pointer text-center hover:scale-105 transition-all group">
                  <div className="text-4xl mb-2 group-hover:animate-bounce">🥋</div>
                  <h3 className="font-game text-xl text-blue-600">Vessels</h3>
                </div>
                <div onClick={() => setView('skills')} className="bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-purple-50 cursor-pointer text-center hover:scale-105 transition-all group">
                  <div className="text-4xl mb-2 group-hover:animate-bounce">📜</div>
                  <h3 className="font-game text-xl text-purple-600">Spirit Arts</h3>
                </div>
                <div onClick={() => setView('pets')} className="bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-cyan-50 cursor-pointer text-center hover:scale-105 transition-all group">
                  <div className="text-4xl mb-2 group-hover:animate-bounce">🐾</div>
                  <h3 className="font-game text-xl text-cyan-600">Companions</h3>
                </div>
                <div onClick={() => setView('forge')} className="bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-emerald-50 cursor-pointer text-center hover:scale-105 transition-all group">
                  <div className="text-4xl mb-2 group-hover:animate-bounce">🔨</div>
                  <h3 className="font-game text-xl text-emerald-600">The Forge</h3>
                </div>
            </div>

            <div onClick={() => setView('tower')} className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl cursor-pointer flex items-center space-x-8 hover:translate-x-4 transition-all group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent"></div>
              <div className="bg-white text-slate-900 w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-xl group-hover:rotate-6 transition-transform z-10">🏰</div>
              <div className="z-10">
                <h3 className="font-game text-3xl text-white">The Tower</h3>
                <p className="text-[10px] text-orange-400 uppercase font-black tracking-widest mt-1">Convergence PvE</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'world' && (
        <div className="bg-white rounded-[4rem] p-12 shadow-2xl relative overflow-hidden animate-in zoom-in duration-500 min-h-[600px]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-40"></div>
            <div className="flex justify-between items-center mb-12 relative z-10">
                <div>
                    <h2 className="font-game text-5xl text-orange-600">World Regions</h2>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Select a biome node to begin exploration</p>
                </div>
                <button onClick={() => setView('hub')} className="bubbly-btn bg-white px-8 py-3 rounded-full border-4 border-orange-100 font-game text-orange-500 text-xl">BACK TO HUB</button>
            </div>

            <div className="relative h-[450px] w-full bg-orange-50/30 rounded-[3rem] border-8 border-white shadow-inner overflow-hidden">
                {BIOMES.map((biome, idx) => (
                    <div 
                        key={idx} 
                        className="absolute biome-node cursor-pointer flex flex-col items-center" 
                        style={{ top: biome.top, left: biome.left }}
                        onClick={() => startBattle('world')}
                    >
                        <div className="text-6xl mb-2 drop-shadow-xl hover:drop-shadow-2xl transition-all relative group">
                            {biome.icon}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {biome.desc}
                            </div>
                        </div>
                        <div className="bg-white/90 backdrop-blur px-4 py-1.5 rounded-2xl shadow-lg border-2 border-orange-100">
                            <div className="font-game text-sm text-gray-800 leading-none">{biome.name}</div>
                            <div className="text-[8px] font-black text-gray-400 uppercase tracking-tighter text-center">{biome.vessel}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {view === 'skills' && (
        <div className="bg-white rounded-[4rem] p-12 shadow-2xl animate-in zoom-in duration-500">
          <div className="flex justify-between items-start mb-10">
            <div>
                <h2 className="font-game text-5xl text-purple-600 leading-none">The Spirit Lab</h2>
                <p className="text-gray-400 font-bold text-sm uppercase mt-2 tracking-widest">Configure Your Battle Belt ({gameState.equippedSkills.length}/6)</p>
            </div>
            <div className="flex space-x-4">
                <button 
                    onClick={() => startBattle('practice')} 
                    className="bubbly-btn bg-cyan-100 text-cyan-600 font-game px-8 py-4 rounded-full border-4 border-cyan-200 text-xl"
                >
                    PRACTICE DUMMY
                </button>
                <button onClick={() => setView('hub')} className="bubbly-btn bg-gray-100 text-gray-400 font-game px-8 py-4 rounded-full border-4 border-gray-200 text-xl">CLOSE</button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-10 border-b-4 border-gray-50 pb-8 overflow-x-auto custom-scrollbar">
            {['All', ...Object.values(SkillCategory)].map(cat => (
                <button 
                    key={cat} 
                    onClick={() => setActiveTab(cat as any)}
                    className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase transition-all whitespace-nowrap shadow-sm ${activeTab === cat ? 'bg-purple-600 text-white scale-110 shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                >
                    {cat}
                </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-h-[500px] overflow-y-auto pr-6 custom-scrollbar">
            {filteredSkills.map(s => {
                const isEquipped = gameState.equippedSkills.includes(s.id);
                const order = gameState.equippedSkills.indexOf(s.id) + 1;
                return (
                    <div 
                        key={s.id} 
                        onClick={() => toggleSkill(s.id)} 
                        className={`p-6 rounded-[2.5rem] border-4 cursor-pointer transition-all transform hover:-translate-y-2 ${isEquipped ? 'border-purple-500 bg-purple-50 shadow-2xl' : 'border-gray-50 bg-gray-50/50 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full text-white ${s.color} shadow-sm`}>{s.category}</span>
                            {isEquipped && (
                                <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg ring-4 ring-white">
                                    {order}
                                </div>
                            )}
                        </div>
                        <h4 className="font-game text-2xl text-gray-800 leading-none mb-2">{s.name}</h4>
                        <p className="text-[11px] text-gray-500 leading-snug h-12 overflow-hidden italic mb-4">"{s.description}"</p>
                        <div className="flex justify-between items-center text-[10px] font-black text-gray-400 border-t border-gray-200/30 pt-4">
                            <span>PROC: {Math.round(s.triggerChance * 100)}%</span>
                            <span className="bg-gray-100 px-3 py-1 rounded-full text-blue-500">{s.manaCost} MP</span>
                        </div>
                    </div>
                );
            })}
          </div>
        </div>
      )}

      {view === 'pets' && (
        <div className="bg-white rounded-[4rem] p-12 shadow-2xl animate-in zoom-in duration-500 max-w-4xl mx-auto text-center">
          <h2 className="font-game text-5xl text-cyan-600 mb-2 leading-none">Spirit Companions</h2>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-12">The secondary strategic layer of battle</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PETS.map(p => (
                <div 
                    key={p.id} 
                    onClick={() => setGameState(prev => ({...prev, activePetId: p.id}))} 
                    className={`p-10 rounded-[3.5rem] border-8 cursor-pointer transition-all ${gameState.activePetId === p.id ? 'border-cyan-500 bg-cyan-50 shadow-2xl scale-105' : 'border-gray-50 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'}`}
                >
                    <div className="text-9xl mb-6 text-center animate-float drop-shadow-xl">{p.icon}</div>
                    <h4 className="font-game text-3xl text-gray-800 mb-2">{p.name}</h4>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed italic px-4">"{p.description}"</p>
                    <div className="bg-white rounded-2xl p-4 border-4 border-cyan-100 text-center text-xs font-black text-cyan-600 uppercase tracking-widest shadow-inner">
                        ACTIVE ABILITY: {p.effect}
                    </div>
                </div>
            ))}
          </div>
          
          <button onClick={() => setView('hub')} className="bubbly-btn mt-12 bg-gray-100 text-gray-400 font-game px-12 py-5 rounded-full border-4 border-gray-200 text-2xl uppercase tracking-widest">CLOSE THE STABLE</button>
        </div>
      )}

      {view === 'forge' && (
        <div className="bg-white rounded-[4rem] p-12 shadow-2xl text-center max-w-3xl mx-auto animate-in zoom-in duration-500">
           <div className="flex justify-between items-start mb-6">
              <div className="text-left">
                  <h2 className="font-game text-5xl text-emerald-600">Alchemical Forge</h2>
                  <p className="text-sm text-gray-400 font-black uppercase tracking-widest mt-1">Transmute your destiny</p>
              </div>
              <button onClick={() => setView('hub')} className="text-gray-300 font-game text-3xl hover:text-gray-500 transition-colors">×</button>
           </div>
           
           <div className="my-16 flex items-center justify-center">
              <div className="w-80 h-80 border-[12px] border-dashed border-emerald-50 rounded-full flex flex-col items-center justify-center relative animate-[spin_40s_linear_infinite]">
                 <div className="text-9xl absolute animate-[bounce_4s_infinite] drop-shadow-2xl" style={{ animationDelay: '0s' }}>🧪</div>
                 <div className="text-5xl absolute top-0 animate-pulse text-emerald-300">✨</div>
                 <div className="text-5xl absolute bottom-0 right-10 animate-pulse text-emerald-300" style={{ animationDelay: '1.5s' }}>💎</div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <button onClick={() => synthesize('Vessel')} className="bubbly-btn bg-white border-8 border-blue-50 p-10 rounded-[3.5rem] group hover:border-blue-400 transition-all">
                 <div className="text-6xl mb-4 group-hover:animate-bounce">🥋</div>
                 <div className="font-game text-3xl text-blue-500 leading-none">Vessel Upgrade</div>
                 <div className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-[0.2em]">Cost: 1000 Gold</div>
              </button>
              <button onClick={() => synthesize('Gear')} className="bubbly-btn bg-white border-8 border-emerald-50 p-10 rounded-[3.5rem] group hover:border-emerald-400 transition-all">
                 <div className="text-6xl mb-4 group-hover:animate-bounce">⚔️</div>
                 <div className="font-game text-3xl text-emerald-500 leading-none">Gear Refining</div>
                 <div className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-[0.2em]">Cost: 500 Gold</div>
              </button>
           </div>

           <div className="bg-slate-50 rounded-[4rem] p-10 flex flex-col md:flex-row justify-between items-center border-4 border-emerald-50 shadow-inner">
              <div className="text-left mb-6 md:mb-0">
                  <div className="text-[10px] font-black text-gray-400 uppercase leading-none tracking-widest mb-1">Alchemy Dust (Pity)</div>
                  <div className="font-game text-6xl text-gray-800 leading-none flex items-center">
                    <span className="mr-3 opacity-50">🌫️</span> {gameState.alchemyDust}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 italic font-bold">100 Dust guarantees success</p>
              </div>
              <button 
                onClick={() => alert("Exchange logic here: Gained Legendary Essence!")}
                disabled={gameState.alchemyDust < 100}
                className={`px-12 py-6 rounded-full font-game text-3xl text-white shadow-2xl transition-all ${gameState.alchemyDust >= 100 ? 'bg-orange-500 hover:scale-110 active:scale-95 shadow-orange-500/50' : 'bg-gray-300 opacity-50 cursor-not-allowed'}`}
              >
                {gameState.alchemyDust >= 100 ? 'ACTIVATE PITY!' : 'EXCHANGE (100)'}
              </button>
           </div>
        </div>
      )}

      {view === 'vessels' && (
        <div className="mt-4 animate-in slide-in-from-left-8 duration-700">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="font-game text-5xl text-blue-600 leading-none">The Soul Weave</h2>
                    <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mt-2">Select your current battle vessel</p>
                </div>
                <button onClick={() => setView('hub')} className="bubbly-btn bg-white px-12 py-4 rounded-full border-[6px] border-blue-50 font-game text-blue-500 text-2xl shadow-xl">BACK TO HUB</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
                {gameState.playerVessels.map(v => (
                    <VesselCard 
                        key={v.id} 
                        vessel={v} 
                        isSelected={v.id === gameState.activeVesselId} 
                        onClick={() => setGameState(prev => ({ ...prev, activeVesselId: v.id }))} 
                    />
                ))}
            </div>
        </div>
      )}

      {view === 'battle' && (
        <div className="animate-in zoom-in duration-500 py-4">
            <BattleArena 
                playerVessel={activeVessel} 
                playerSkills={equippedSkillsData} 
                playerPet={activePet} 
                isTowerMode={battleSource === 'tower'}
                isPracticeMode={battleSource === 'practice'}
                floor={gameState.towerFloor}
                onFinish={handleBattleFinish} 
            />
        </div>
      )}

      {view === 'tower' && (
        <div className="bg-slate-900 rounded-[5rem] p-16 shadow-2xl text-center max-w-4xl mx-auto animate-in zoom-in duration-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] opacity-30 pointer-events-none"></div>
            <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="text-left">
                    <h2 className="font-game text-7xl text-white leading-none">TOWER ASCENT</h2>
                    <p className="text-sm text-orange-400 font-black uppercase tracking-[0.5em] mt-4">Currently on Floor {gameState.towerFloor} • Corrupted Souls Await</p>
                </div>
                <button onClick={() => setView('hub')} className="text-gray-600 font-game text-4xl hover:text-white transition-colors duration-300">×</button>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 mb-16 h-80 overflow-y-auto p-12 bg-black/50 rounded-[4rem] shadow-inner border-4 border-white/5 custom-scrollbar relative z-10">
                {Array.from({length: 100}).map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-20 rounded-2xl flex items-center justify-center font-game text-2xl transition-all duration-300 ${
                            i+1 === gameState.towerFloor ? 'bg-orange-500 text-white animate-pulse shadow-[0_0_40px_rgba(249,115,22,0.6)] scale-110 z-20 border-4 border-white' : 
                            i+1 < gameState.towerFloor ? 'bg-green-500/20 text-green-500 border-2 border-green-500/40 grayscale opacity-40' : 
                            'bg-white/5 text-white/10 border-2 border-white/5 opacity-20'
                        }`}
                    >
                        {i+1}
                    </div>
                ))}
            </div>
            
            <button 
                onClick={() => startBattle('tower')} 
                className="bubbly-btn w-full bg-orange-600 text-white font-game text-5xl py-12 rounded-[4rem] shadow-[0_15px_0_rgb(154,52,18)] active:shadow-none hover:bg-orange-500 hover:scale-[1.02] transition-all relative z-10 uppercase tracking-widest"
            >
                CHALLENGE BOSS
            </button>
            
            <div className="mt-12 flex items-center justify-center space-x-8 text-white/20 font-black uppercase tracking-[0.3em] text-xs relative z-10">
                <span className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span> PvE LADDER</span>
                <span className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span> LEGENDARY DROPS</span>
            </div>
        </div>
      )}

      {/* Modern Fixed Bottom Nav */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-2xl border-[6px] border-orange-50 rounded-[4rem] px-14 py-6 flex space-x-16 shadow-[0_30px_100px_rgba(0,0,0,0.15)] z-50 transition-all hover:scale-105 hover:px-16">
        {[
          { icon: '🏠', view: 'hub', label: 'HUB' },
          { icon: '🗺️', view: 'world', label: 'MAP' },
          { icon: '🥋', view: 'vessels', label: 'SOUL' },
          { icon: '📜', view: 'skills', label: 'ARTS' },
          { icon: '🐾', view: 'pets', label: 'PETS' },
          { icon: '🔨', view: 'forge', label: 'FORGE' }
        ].map(item => (
          <button 
            key={item.view}
            onClick={() => setView(item.view as any)} 
            className={`flex flex-col items-center transition-all duration-300 hover:scale-125 ${view === item.view ? 'text-orange-500 scale-125 drop-shadow-[0_15px_15px_rgba(249,115,22,0.4)]' : 'text-gray-300 hover:text-gray-400'}`}
          >
            <span className="text-4xl mb-1">{item.icon}</span>
            <span className={`text-[8px] font-black tracking-tighter ${view === item.view ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
