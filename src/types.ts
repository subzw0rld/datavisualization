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
  
  // 3D World space coordinates and velocity
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  
  // Physics & System Mass
  mass: number;
  systemMass: number;
  clusterRootId: number;
  clusterName: string;
  
  // 3D Orbital plane inclination basis vectors
  basisU?: { x: number; y: number; z: number };
  basisV?: { x: number; y: number; z: number };
  
  // Wander properties (for root/wandering supervisors)
  wanderAngle: number;
  wanderSpeed: number;
  
  // 3D Projected Screen Coordinates (computed per frame)
  projX: number;
  projY: number;
  projZ: number;
  projScale: number;
  projRadius: number;
  projAlpha: number;
  
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
  z: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  focalLength: number;
}

export interface SimulationFilters {
  skillId?: number | null;
  levelId?: number | null;
  locationId?: number | null;
  searchQuery: string;
}

export interface MetadataResponse {
  skills: SkillCatalog;
  levels: LevelCatalog;
  locations: LocationCatalog;
  configs: {
    levelRadius: LevelRadiusConfig;
    orbitalDistance: OrbitalDistanceConfig;
    levelMass: Record<string, number>;
  };
}

