
export enum ElementType {
  FIRE = 'Fire',
  WATER = 'Water',
  WIND = 'Wind',
  LIGHTNING = 'Lightning',
  EARTH = 'Earth'
}

export enum SkillCategory {
  PYROMANCY = 'Pyromancy',
  CRYOMANCY = 'Cryomancy',
  GALESMITHING = 'Galesmithing',
  GEOMANCY = 'Geomancy',
  VOLTMANCY = 'Voltmancy',
  MARTIAL_ARTS = 'Martial Arts',
  GADGETRY = 'Gadgetry',
  FORBIDDEN = 'Forbidden',
  PHANTASM = 'Phantasm',
  VITALISM = 'Vitalism'
}

export enum SkillType {
  ACTIVE = 'Active',
  PASSIVE = 'Passive',
  BUFF = 'Buff',
  HEAL = 'Heal',
  COUNTER = 'Counter'
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  type: SkillType;
  description: string;
  triggerChance: number;
  power: number;
  color: string;
  manaCost: number;
}

export interface Stats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  atk: number;
  def: number;
  spd: number;
  hit: number;
  dodge: number;
  crit: number;
  res: number;
  armorBreak: number;
}

export interface Vessel {
  id: string;
  name: string;
  title: string;
  element: ElementType;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  baseStats: Stats;
  avatar: string;
}

export interface Pet {
  id: string;
  name: string;
  description: string;
  triggerChance: number;
  effect: string;
  icon: string;
}

export interface StatusEffect {
  name: string;
  duration: number;
  type: 'Frozen' | 'Poison' | 'Burn' | 'Stun' | 'Seal';
  magnitude?: number;
}

export interface BattleUnit {
  vessel: Vessel;
  currentStats: Stats;
  skills: Skill[]; // This is the "Battle Belt" (Max 6)
  pet?: Pet;
  statusEffects: StatusEffect[];
  gauge: number;
}

export interface BattleLog {
  turn: number;
  message: string;
  type: 'attack' | 'skill' | 'status' | 'info' | 'death' | 'pet';
}

export interface GameState {
  playerVessels: Vessel[];
  activeVesselId: string;
  equippedSkills: string[];
  activePetId: string | null;
  gold: number;
  diamonds: number;
  alchemyDust: number;
  towerFloor: number;
  essenceShards: number;
}
