export interface SkillDefinition {
  skill: string;
  color: string;
}

export type SkillCatalog = Record<number | string, SkillDefinition>;

export interface LevelDefinition {
  level: string;
  color: string;
}

export type LevelCatalog = Record<number | string, LevelDefinition>;

export interface LocationDefinition {
  location: string;
  color: string;
}

export type LocationCatalog = Record<number | string, LocationDefinition>;

export type LevelRadiusConfig = Record<string, number>;
export type OrbitalDistanceConfig = Record<string, number>;

export interface RawEmployeeSkill {
  id: number;
  level: number;
}

export interface RawEmployeeDataRecord {
  name: string;
  empID: number;
  avatar?: string;
  location: number;
  desig: string;
  level: string;
  skill: RawEmployeeSkill[];
  supervisor?: number;
  totalSupervisee?: number;
  nucleus?: boolean;
  client?: string[];
  email?: string;
}

export interface EmployeeSkillItem {
  id: number;
  name: string;
  color: string;
  level: number;
  levelName: string;
  levelColor: string;
}

export interface ParticleNode {
  empID: number;
  name: string;
  desig: string;
  level: string;
  locationId: number;
  locationName: string;
  locationColor: string;
  avatarUrl: string;
  avatarLoaded: boolean;
  avatarImg?: HTMLImageElement;
  skills: EmployeeSkillItem[];
  supervisorId?: number;
  children: number[];
  totalSupervisee: number;
  isSupervisor: boolean;
  isRoot: boolean;
  depth: number;
  
  // Visual dimensions
  coreRadius: number;
  totalHitRadius: number; // outer boundary including location + skill + level rings
  orbitalDistance: number;
  theta: number;
  angularVelocity: number;
  orbitIndex: number;
  
  // World space coordinates
  x: number;
  y: number;
  vx: number;
  vy: number;
  
  // Wander properties (for root/wandering supervisors)
  wanderAngle: number;
  wanderSpeed: number;
  
  // Interaction state
  isDragging: boolean;
  isHovered: boolean;
  isSelected: boolean;
  pulseTimer: number; // 0 to 1 pulse progress
  matchesFilter: boolean;
  
  // Optional client metadata
  email?: string;
  clients?: string[];
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
}

export interface SimulationFilters {
  skillId?: number | null;
  levelId?: number | null;
  locationId?: number | null;
  searchQuery: string;
}
