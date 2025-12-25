
import React from 'react';
import { Vessel, ElementType } from '../types';

interface VesselCardProps {
  vessel: Vessel;
  isSelected?: boolean;
  onClick?: () => void;
}

const VesselCard: React.FC<VesselCardProps> = ({ vessel, isSelected, onClick }) => {
  const rarityColors = {
    Common: 'border-gray-300 bg-gray-50',
    Rare: 'border-blue-400 bg-blue-50',
    Epic: 'border-purple-400 bg-purple-50',
    Legendary: 'border-yellow-400 bg-yellow-50',
  };

  const elementColors: Record<ElementType, string> = {
    [ElementType.FIRE]: 'bg-red-100 text-red-600',
    [ElementType.WATER]: 'bg-blue-100 text-blue-600',
    [ElementType.WIND]: 'bg-sky-100 text-sky-600',
    [ElementType.LIGHTNING]: 'bg-yellow-100 text-yellow-600',
    [ElementType.EARTH]: 'bg-emerald-100 text-emerald-600',
  };

  // Simplified radar logic: Strength, Agility, Stamina
  const maxAtk = 250; // Approximated
  const maxSpd = 200;
  const maxHp = 3500;

  const str = Math.min(100, (vessel.baseStats.atk / maxAtk) * 100);
  const agi = Math.min(100, (vessel.baseStats.spd / maxSpd) * 100);
  const sta = Math.min(100, (vessel.baseStats.maxHp / maxHp) * 100);

  return (
    <div 
      onClick={onClick}
      className={`relative cursor-pointer rounded-3xl border-4 p-4 transition-all transform hover:scale-105 active:scale-95 ${rarityColors[vessel.rarity]} ${isSelected ? 'ring-4 ring-orange-500 shadow-2xl scale-105 z-10' : 'shadow-md opacity-90'}`}
    >
      <div className="flex flex-col items-center">
        <div className="relative mb-3">
          <img src={vessel.avatar} alt={vessel.name} className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover" />
          <div className={`absolute -bottom-1 -right-1 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center text-sm font-black ${elementColors[vessel.element]} shadow-lg`}>
            {vessel.element[0]}
          </div>
        </div>
        
        <h3 className="font-game text-xl text-gray-800 leading-none mb-1">{vessel.name}</h3>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{vessel.title}</p>
        
        {/* Visual Stats Bar */}
        <div className="w-full space-y-1.5 px-2">
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 transition-all duration-1000" style={{ width: `${str}%` }}></div>
            </div>
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 transition-all duration-1000" style={{ width: `${agi}%` }}></div>
            </div>
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 transition-all duration-1000" style={{ width: `${sta}%` }}></div>
            </div>
        </div>

        <div className="mt-3 flex justify-between w-full text-[8px] font-black text-gray-400 uppercase">
            <span>STR</span>
            <span>AGI</span>
            <span>STA</span>
        </div>
      </div>
      
      {vessel.rarity === 'Legendary' && (
        <div className="absolute -top-3 -right-3 bg-gradient-to-tr from-yellow-600 to-yellow-300 text-white text-[9px] px-3 py-1.5 rounded-full animate-pulse shadow-lg font-black tracking-tighter ring-2 ring-white">
          LEGENDARY
        </div>
      )}
    </div>
  );
};

export default VesselCard;
