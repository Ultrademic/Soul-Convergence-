import { ElementType, SkillType, SkillCategory, Skill, Vessel, Stats, Pet, WeaponType, TowerModifier } from './types';

const calcStats = (str: number, agi: number, sta: number): Stats => ({
  hp: Math.floor(25000 / sta),
  maxHp: Math.floor(25000 / sta),
  mana: 100,
  maxMana: 100,
  atk: Math.floor(2000 / str),
  def: 100,
  spd: Math.floor(1800 / agi),
  hit: 100,
  dodge: Math.floor(200 / agi),
  crit: Math.floor(200 / str),
  res: 10,
  armorBreak: 10
});

export const TOWER_MODIFIERS: TowerModifier[] = [
  { name: 'Gale Force', description: 'Action speed is increased by 20%.', effect: 'atk_up', magnitude: 0.2 },
  { name: 'Solid Granite', description: 'Incoming physical damage reduced by 25%.', effect: 'def_up', magnitude: 0.25 },
  { name: 'Magma Surge', description: 'Fire skills deal 40% more damage.', effect: 'fire_boost', magnitude: 0.4 },
  { name: 'Static Discharge', description: 'Lightning skills deal 50% more damage.', effect: 'lightning_boost', magnitude: 0.5 },
  { name: 'Chrono Rift', description: 'Healing effects are enhanced by 30%.', effect: 'heal_on_turn', magnitude: 0.3 }
];

export const SKILLS: Skill[] = [
  // Pyromancy
  { id: 'cinder_wave', name: 'Cinder Wave', category: SkillCategory.PYROMANCY, type: SkillType.ACTIVE, description: 'Deals 130% damage and stacks Burn.', triggerChance: 0.25, power: 1.3, color: 'bg-red-500', manaCost: 20 },
  { id: 'nova_burst', name: 'Nova Burst', category: SkillCategory.PYROMANCY, type: SkillType.ACTIVE, description: 'Deals 180% damage. Explosive impact.', triggerChance: 0.15, power: 1.8, color: 'bg-red-700', manaCost: 35 },
  // Cryomancy
  { id: 'deep_freeze', name: 'Deep Freeze', category: SkillCategory.CRYOMANCY, type: SkillType.ACTIVE, description: 'Deals 110% damage with 20% chance to Stun.', triggerChance: 0.2, power: 1.1, color: 'bg-blue-400', manaCost: 25 },
  { id: 'ice_mirror', name: 'Ice Mirror', category: SkillCategory.CRYOMANCY, type: SkillType.COUNTER, description: 'Reflects 50% of hits.', triggerChance: 0.18, power: 0, color: 'bg-blue-200 text-blue-800', manaCost: 15 },
  // Galesmithing
  { id: 'slipstream', name: 'Slipstream', category: SkillCategory.GALESMITHING, type: SkillType.BUFF, description: 'Boosts Action Gauge by 300.', triggerChance: 0.15, power: 0, color: 'bg-sky-400', manaCost: 20 },
  { id: 'air_pressure', name: 'Air Pressure', category: SkillCategory.GALESMITHING, type: SkillType.BUFF, description: 'Lowers enemy dodge.', triggerChance: 0.22, power: 0, color: 'bg-sky-200 text-sky-800', manaCost: 10 },
  // Geomancy
  { id: 'iron_skin', name: 'Iron Skin', category: SkillCategory.GEOMANCY, type: SkillType.BUFF, description: 'Reduces damage by 30% for 3 turns.', triggerChance: 0.18, power: 0, color: 'bg-amber-700', manaCost: 25 },
  { id: 'spike_armor', name: 'Spike Armor', category: SkillCategory.GEOMANCY, type: SkillType.BUFF, description: 'Reflects flat damage.', triggerChance: 0.2, power: 0, color: 'bg-amber-900', manaCost: 20 },
  // Voltmancy
  { id: 'chain_lightning', name: 'Chain Lightning', category: SkillCategory.VOLTMANCY, type: SkillType.ACTIVE, description: 'Deals damage and slows enemy.', triggerChance: 0.25, power: 1.2, color: 'bg-yellow-400', manaCost: 25 },
  { id: 'voltage_overload', name: 'Voltage Overload', category: SkillCategory.VOLTMANCY, type: SkillType.ACTIVE, description: 'Massive hit with high crit.', triggerChance: 0.12, power: 2.0, color: 'bg-yellow-600', manaCost: 40 },
  // Martial Arts
  { id: 'dragon_strike', name: 'Dragon Strike', category: SkillCategory.MARTIAL_ARTS, type: SkillType.ACTIVE, description: 'Pure physical hit with Armor Break.', triggerChance: 0.22, power: 1.6, color: 'bg-orange-600', manaCost: 15 },
  { id: 'life_siphon', name: 'Life Siphon', category: SkillCategory.MARTIAL_ARTS, type: SkillType.ACTIVE, description: 'Heals based on damage.', triggerChance: 0.18, power: 1.2, color: 'bg-orange-400', manaCost: 25 },
  // Gadgetry
  { id: 'caltrops', name: 'Caltrops', category: SkillCategory.GADGETRY, type: SkillType.BUFF, description: 'Deals damage whenever enemy acts.', triggerChance: 0.2, power: 0.5, color: 'bg-gray-700', manaCost: 15 },
  { id: 'smoke_screen', name: 'Smoke Screen', category: SkillCategory.GADGETRY, type: SkillType.BUFF, description: 'Boosts Dodge for 2 turns.', triggerChance: 0.2, power: 0, color: 'bg-gray-500', manaCost: 20 },
  // Forbidden Arts
  { id: 'mana_burn', name: 'Mana Burn', category: SkillCategory.FORBIDDEN, type: SkillType.ACTIVE, description: 'Drains enemy mana.', triggerChance: 0.15, power: 1.2, color: 'bg-purple-700', manaCost: 30 },
  { id: 'soul_lock', name: 'Soul Lock', category: SkillCategory.FORBIDDEN, type: SkillType.BUFF, description: 'Prevents enemy skill use.', triggerChance: 0.1, power: 0, color: 'bg-purple-900', manaCost: 40 },
  // Phantasm
  { id: 'hollow_clone', name: 'Hollow Clone', category: SkillCategory.PHANTASM, type: SkillType.COUNTER, description: 'Negates next hit.', triggerChance: 0.18, power: 0, color: 'bg-indigo-600', manaCost: 25 },
  { id: 'confusion', name: 'Confusion', category: SkillCategory.PHANTASM, type: SkillType.BUFF, description: 'Chance to self-hit.', triggerChance: 0.15, power: 0, color: 'bg-indigo-400', manaCost: 25 },
  // Vitalism
  { id: 'nature_grace', name: 'Nature Grace', category: SkillCategory.VITALISM, type: SkillType.HEAL, description: 'Heals 25% HP.', triggerChance: 0.15, power: 0, color: 'bg-green-500', manaCost: 30 },
  { id: 'awakened_will', name: 'Awakened Will', category: SkillCategory.VITALISM, type: SkillType.BUFF, description: 'All stats boost.', triggerChance: 0.08, power: 0, color: 'bg-green-700', manaCost: 50 },
];

export const PETS: Pet[] = [
  { id: 'iron_pug', name: 'Iron Pug', description: 'Borks on hit, boosting defense.', triggerChance: 0.2, effect: 'Def Up', icon: '🐶' },
  { id: 'cloud_manta', name: 'Cloud Manta', description: 'Granting 10% speed boost.', triggerChance: 0.15, effect: 'Spd Up', icon: '🐟' },
  { id: 'flame_wisp', name: 'Flame Wisp', description: 'Adds ember damage to attacks.', triggerChance: 0.25, effect: 'Dmg Up', icon: '🔥' },
  { id: 'spirit_fox', name: 'Spirit Fox', description: 'Restores health occasionally.', triggerChance: 0.18, effect: 'Heal', icon: '🦊' }
];

export const INITIAL_VESSELS: Vessel[] = [
  { id: 'ignis', name: 'Ignis', title: 'Cinder Acrobat', element: ElementType.FIRE, weaponType: WeaponType.FISTS, rarity: 'Rare', avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&h=200&fit=crop', baseStats: calcStats(16, 10, 18) },
  { id: 'raijin', name: 'Raijin-01', title: 'Lightning Prototype', element: ElementType.LIGHTNING, weaponType: WeaponType.SHARP, rarity: 'Legendary', avatar: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=200&h=200&fit=crop', baseStats: calcStats(17, 9, 22) },
  { id: 'golem', name: 'Golem-heart', title: 'Stone Bulwark', element: ElementType.EARTH, weaponType: WeaponType.BLUNT, rarity: 'Epic', avatar: 'https://i.postimg.cc/Kvxfy8vq/golem.png', baseStats: calcStats(18, 22, 8) },
  { id: 'jinn', name: 'Ash-Walker Jinn', title: 'Glass Cannon', element: ElementType.FIRE, weaponType: WeaponType.SHARP, rarity: 'Legendary', avatar: 'https://images.unsplash.com/photo-1464802686167-b939a67e0621?w=200&h=200&fit=crop', baseStats: calcStats(9, 16, 24) },
  { id: 'zephyr', name: 'Zephyr', title: 'Sky-Reaper', element: ElementType.WIND, weaponType: WeaponType.FISTS, rarity: 'Epic', avatar: 'https://i.postimg.cc/PqjrS9MD/zephyr.png', baseStats: calcStats(14, 11, 20) }
];
