
import React from 'react';
import { Vessel, ElementType, WeaponType } from '../types';

interface VesselCardProps {
  vessel: Vessel;
  isSelected?: boolean;
  currentTime?: number;
  onClick?: () => void;
}

const VesselCard: React.FC<VesselCardProps> = ({ vessel, isSelected, currentTime = Date.now(), onClick }) => {
  const elementIcons: Record<ElementType, string> = {
    [ElementType.FIRE]: '🔥',
    [ElementType.WATER]: '💧',
    [ElementType.WIND]: '🌪️',
    [ElementType.LIGHTNING]: '⚡',
    [ElementType.EARTH]: '⛰️',
  };

  const isRecovering = vessel.recoveryEndTime && vessel.recoveryEndTime > currentTime;
  const recoveryRemaining = isRecovering ? Math.ceil((vessel.recoveryEndTime! - currentTime) / 1000) : 0;

  const maxAtk = 250; 
  const maxSpd = 200;
  const maxHp = 3500;

  const str = Math.min(100, (vessel.baseStats.atk / maxAtk) * 100);
  const agi = Math.min(100, (vessel.baseStats.spd / maxSpd) * 100);
  const sta = Math.min(100, (vessel.baseStats.maxHp / maxHp) * 100);

  return (
    <div 
      onClick={onClick}
      className={`glass-card relative cursor-pointer rounded-[2.5rem] p-6 text-center border-2 transition-all group ${isSelected ? 'border-orange-500 bg-orange-500/10 scale-105 z-10' : 'border-white/5 shadow-xl'} ${isRecovering ? 'opacity-80' : ''}`}
    >
      <div className="relative mb-6">
        <div className={`absolute inset-0 bg-orange-500/20 rounded-full blur-2xl group-hover:bg-orange-500/30 transition-all opacity-0 group-hover:opacity-100 ${isRecovering ? 'hidden' : ''}`}></div>
        <img src={vessel.avatar} alt={vessel.name} className={`w-28 h-28 rounded-full border-4 border-white/10 shadow-2xl object-cover relative z-10 mx-auto transition-all ${isRecovering ? 'grayscale brightness-50' : ''}`} />
        <div className="absolute -bottom-2 -right-2 w-10 h-10 glass-panel rounded-full flex items-center justify-center text-lg z-20 border-white/20">
          {elementIcons[vessel.element]}
        </div>
        
        {isRecovering && (
            <div className="absolute inset-0 flex items-center justify-center z-20 flex-col">
                <span className="text-white font-game text-2xl drop-shadow-lg">EXHAUSTED</span>
                <span className="text-orange-500 font-black text-sm mt-1">{recoveryRemaining}s</span>
            </div>
        )}
      </div>
      
      <h3 className={`font-game text-2xl mb-1 transition-colors uppercase ${isRecovering ? 'text-slate-500' : 'text-white group-hover:text-orange-400'}`}>{vessel.name}</h3>
      <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">{vessel.title}</p>
      
      <div className="space-y-3 px-2">
          <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-red-500/70" style={{ width: `${str}%` }}></div>
          </div>
          <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500/70" style={{ width: `${agi}%` }}></div>
          </div>
          <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-green-500/70" style={{ width: `${sta}%` }}></div>
          </div>
      </div>

      <div className="mt-4 flex justify-between text-[7px] font-black text-slate-600 uppercase tracking-tighter">
          <span>STR</span>
          <span>AGI</span>
          <span>STA</span>
      </div>
      
      {vessel.rarity === 'Legendary' && (
        <div className="absolute top-4 left-4 text-[7px] bg-orange-500 text-white font-black px-2 py-1 rounded-md tracking-widest shadow-lg">LEGENDARY</div>
      )}
    </div>
  );
};

export default VesselCard;
