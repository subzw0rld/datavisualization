import type {
  ParticleNode,
  EmployeeSkillItem
} from '../types';
import {
  SKILL_DATA,
  LEVEL_DATA,
  LOCATION_DATA,
  LEVEL_RADIUS_CONFIG,
  ORBITAL_DISTANCE_CONFIG
} from './metadata';
import { PROJECT_DATA } from './projectData';
import { TEAM_DATA } from './teamData';

export class DataLoader {
  public static loadDataset(
    datasetType: 'project' | 'team',
    bounds: { width: number; height: number },
    onAvatarLoaded?: (empID: number) => void
  ): { nodes: ParticleNode[]; nodeMap: Map<number, ParticleNode>; roots: ParticleNode[] } {
    const rawData = datasetType === 'project' ? PROJECT_DATA : TEAM_DATA;
    const nodeMap = new Map<number, ParticleNode>();
    const nodes: ParticleNode[] = [];

    // First pass: Instantiate nodes
    for (const key of Object.keys(rawData)) {
      const raw = rawData[key];
      const empID = Number(raw.empID);
      const locId = raw.location;
      const locDef = LOCATION_DATA[locId] || { location: 'Global', color: '#38bdf8' };

      // Process skills
      const skillList: EmployeeSkillItem[] = [];
      if (Array.isArray(raw.skill)) {
        for (const s of raw.skill) {
          const sDef = SKILL_DATA[s.id] || { skill: `Skill #${s.id}`, color: '#94a3b8' };
          const lDef = LEVEL_DATA[s.level] || { level: `Level ${s.level}`, color: '#cbd5e1' };
          skillList.push({
            id: s.id,
            name: sDef.skill,
            color: sDef.color,
            level: s.level,
            levelName: lDef.level,
            levelColor: lDef.color
          });
        }
      }

      const coreRadius = LEVEL_RADIUS_CONFIG[raw.level] || 30;
      const totalHitRadius = coreRadius + 21; // core + location(7) + skill(7) + level(7)
      const orbitalDistance = ORBITAL_DISTANCE_CONFIG[raw.level] || 220;

      // Determine avatar path
      let avatarUrl = '';
      if (raw.avatar && raw.avatar.length > 0) {
        avatarUrl = `/assets/images/emp-images/${raw.avatar}`;
      } else if (empID === 682143) {
        // Subroto's image in the repo
        avatarUrl = `/assets/images/emp-images/me.png`;
      } else {
        avatarUrl = `/assets/images/emp-images/avatar.png`;
      }

      const node: ParticleNode = {
        empID,
        name: raw.name,
        desig: raw.desig || 'Team Member',
        level: raw.level,
        locationId: locId,
        locationName: locDef.location,
        locationColor: locDef.color,
        avatarUrl,
        avatarLoaded: false,
        skills: skillList,
        supervisorId: raw.supervisor ? Number(raw.supervisor) : undefined,
        children: [],
        totalSupervisee: raw.totalSupervisee || 0,
        isSupervisor: Boolean(raw.totalSupervisee && raw.totalSupervisee > 0),
        isRoot: false,
        depth: 0,
        coreRadius,
        totalHitRadius,
        orbitalDistance,
        theta: 0,
        angularVelocity: 0.25,
        orbitIndex: 0,
        x: bounds.width / 2,
        y: bounds.height / 2,
        vx: 0,
        vy: 0,
        wanderAngle: Math.random() * Math.PI * 2,
        wanderSpeed: 18 + Math.random() * 15,
        isDragging: false,
        isHovered: false,
        isSelected: false,
        pulseTimer: 0,
        matchesFilter: true,
        email: raw.email,
        clients: raw.client
      };

      // Load avatar image asynchronously
      if (avatarUrl) {
        const img = new Image();
        img.src = avatarUrl;
        img.onload = () => {
          node.avatarLoaded = true;
          node.avatarImg = img;
          if (onAvatarLoaded) onAvatarLoaded(empID);
        };
      }

      nodeMap.set(empID, node);
      nodes.push(node);
    }

    // Second pass: Establish hierarchy relationships
    const roots: ParticleNode[] = [];

    for (const node of nodes) {
      if (node.supervisorId && nodeMap.has(node.supervisorId)) {
        const supervisor = nodeMap.get(node.supervisorId)!;
        supervisor.children.push(node.empID);
      } else {
        node.isRoot = true;
        roots.push(node);
      }
    }

    // Determine depth and distribute root nodes logically across world space
    const rootCount = Math.max(1, roots.length);
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;
    const rootSpacingRadius = Math.min(bounds.width, bounds.height) * 0.35;

    roots.forEach((root, idx) => {
      root.depth = 0;
      if (rootCount === 1) {
        root.x = centerX;
        root.y = centerY;
      } else {
        const angle = (idx / rootCount) * Math.PI * 2;
        root.x = centerX + Math.cos(angle) * rootSpacingRadius;
        root.y = centerY + Math.sin(angle) * rootSpacingRadius;
      }
    });

    // Recursive helper to assign depth, orbit angle, and initial positions
    const setupHierarchy = (parent: ParticleNode, depth: number) => {
      const childCount = parent.children.length;
      if (childCount === 0) return;

      const angleStep = (Math.PI * 2) / childCount;
      parent.children.forEach((childId, index) => {
        const child = nodeMap.get(childId);
        if (!child) return;

        child.depth = depth;
        child.orbitIndex = index;
        child.theta = index * angleStep;
        // Keplerian-like speed: inner orbits move faster, outer orbits move slower
        child.angularVelocity = (0.35 / Math.sqrt(child.orbitalDistance / 100)) * (index % 2 === 0 ? 1 : -0.9);

        // Initial position around parent
        child.x = parent.x + Math.cos(child.theta) * child.orbitalDistance;
        child.y = parent.y + Math.sin(child.theta) * child.orbitalDistance;

        setupHierarchy(child, depth + 1);
      });
    };

    roots.forEach((root) => setupHierarchy(root, 1));

    // Sort nodes topologically (roots first, then leads, then leaves) so render/update is always ordered
    nodes.sort((a, b) => a.depth - b.depth);

    return { nodes, nodeMap, roots };
  }
}
