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

const LEVEL_MASS_CONFIG: Record<string, number> = {
  '4A': 6.0,
  '4B': 5.5,
  '5A': 4.5,
  '5B': 4.0,
  '6A': 3.5,
  '6B': 3.0,
  '7A': 2.5,
  '7B': 2.0,
  '8A': 1.5,
  '8B': 1.0
};

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

      // Calculate individual particle mass
      const baseMass = LEVEL_MASS_CONFIG[raw.level] || 2.0;
      const superviseeMassBonus = (raw.totalSupervisee || 0) * 0.4;
      const mass = baseMass + superviseeMassBonus;

      // Determine avatar path
      let avatarUrl = '';
      if (raw.avatar && raw.avatar.length > 0) {
        avatarUrl = `/assets/images/emp-images/${raw.avatar}`;
      } else if (empID === 682143) {
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
        // 3D coordinates & physics
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        mass,
        systemMass: mass,
        clusterRootId: empID,
        clusterName: `${raw.name}'s Galaxy`,
        wanderAngle: Math.random() * Math.PI * 2,
        wanderSpeed: 20,
        // 3D Projected Screen coordinates
        projX: bounds.width / 2,
        projY: bounds.height / 2,
        projZ: 1000,
        projScale: 1.0,
        projRadius: totalHitRadius,
        projAlpha: 1.0,
        // Interaction state
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

    // Calculate total system mass for each tree
    const calcSubtreeMass = (current: ParticleNode): number => {
      let sum = current.mass;
      for (const childId of current.children) {
        const child = nodeMap.get(childId);
        if (child) {
          sum += calcSubtreeMass(child);
        }
      }
      return sum;
    };

    // Propagate system mass and cluster info recursively
    const applySystemMass = (current: ParticleNode, sysMass: number, clusterId: number, clusterName: string) => {
      current.systemMass = sysMass;
      current.clusterRootId = clusterId;
      current.clusterName = clusterName;
      for (const childId of current.children) {
        const child = nodeMap.get(childId);
        if (child) {
          applySystemMass(child, sysMass, clusterId, clusterName);
        }
      }
    };

    roots.forEach((root) => {
      const totalSysMass = calcSubtreeMass(root);
      applySystemMass(root, totalSysMass, root.empID, `${root.name}'s Galaxy`);

      // REALISTIC SPEED APPROACH:
      // Massive systems move much slower than light particle systems!
      // Speed scales inversely with system mass: v ∝ 1 / (systemMass^0.45)
      root.wanderSpeed = 56 / Math.pow(Math.max(1, totalSysMass), 0.45);
    });

    // 3D SPATIAL DISTRIBUTION:
    // Scatter the galaxies across 3D cosmic space like galaxies in a universe!
    const rootCount = roots.length;

    if (rootCount === 1) {
      // Single galaxy (e.g. Project View): centered in 3D universe
      const root = roots[0];
      root.x = 0;
      root.y = 0;
      root.z = 0;
    } else {
      // Multiple galaxies (e.g. Team View): scatter across expansive 3D space
      // Using 3D spherical / spiral dispersion with ample spacing between galaxy centers
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees
      const clusterSpanRadius = Math.max(bounds.width, bounds.height) * 1.1;

      roots.forEach((root, idx) => {
        // Fibonacci / sunflower 3D distribution
        const t = (idx + 0.5) / rootCount;
        const inclination = Math.acos(1 - 2 * t); // Angle from Z axis [0, PI]
        const azimuth = goldenAngle * idx;

        // Radius with variation so galaxies exist at different depths
        const dist = (0.35 + 0.65 * Math.sqrt(t)) * clusterSpanRadius;

        root.x = Math.sin(inclination) * Math.cos(azimuth) * dist * 1.3;
        root.y = Math.cos(inclination) * dist * 0.85;
        // Z depth: -600 (closer foreground) to +800 (deeper background universe)
        root.z = Math.sin(inclination) * Math.sin(azimuth) * dist * 0.75;
      });
    }

    // 3D ORBITAL PLANES:
    // Give each galaxy cluster a realistic tilted 3D orbital plane (like spiral galaxies)
    roots.forEach((root, idx) => {
      // Vary tilt angles per galaxy (pitch -30° to +30°, yaw -45° to +45°)
      const seed = (root.empID % 100) / 100;
      const tiltPitch = (seed - 0.5) * (Math.PI * 0.42); // X-axis tilt
      const tiltYaw = ((idx % 3) - 1) * (Math.PI * 0.35); // Y-axis tilt

      // Compute orthonormal basis vectors for this galaxy's 3D orbital disk
      // Vector u lying in X-Z plane rotated by yaw:
      const ux = Math.cos(tiltYaw);
      const uy = 0;
      const uz = -Math.sin(tiltYaw);

      // Vector v perpendicular to u rotated by pitch:
      const vx = Math.sin(tiltPitch) * Math.sin(tiltYaw);
      const vy = Math.cos(tiltPitch);
      const vz = Math.sin(tiltPitch) * Math.cos(tiltYaw);

      root.basisU = { x: ux, y: uy, z: uz };
      root.basisV = { x: vx, y: vy, z: vz };

      // Recursive setup of child orbits in 3D tilted plane
      const setupHierarchy3D = (parent: ParticleNode, depth: number) => {
        const childCount = parent.children.length;
        if (childCount === 0) return;

        const angleStep = (Math.PI * 2) / childCount;
        const u = root.basisU!;
        const v = root.basisV!;

        parent.children.forEach((childId, index) => {
          const child = nodeMap.get(childId);
          if (!child) return;

          child.depth = depth;
          child.orbitIndex = index;
          child.theta = index * angleStep;

          // Propagate basis vectors to children for consistent galaxy orbital planes
          child.basisU = u;
          child.basisV = v;

          // Keplerian orbital angular velocity:
          // Inner orbits rotate faster, outer orbits rotate slower
          // Larger system mass gives realistic inertia
          const massDamping = 1 / Math.pow(Math.max(1, parent.systemMass / 8), 0.2);
          const direction = index % 2 === 0 ? 1 : -0.92;
          child.angularVelocity = (0.42 / Math.sqrt(child.orbitalDistance / 100)) * massDamping * direction;

          // Initial 3D orbital position around parent:
          // P = P_parent + R*cos(theta)*u + R*sin(theta)*v
          const r = child.orbitalDistance;
          child.x = parent.x + r * Math.cos(child.theta) * u.x + r * Math.sin(child.theta) * v.x;
          child.y = parent.y + r * Math.cos(child.theta) * u.y + r * Math.sin(child.theta) * v.y;
          child.z = parent.z + r * Math.cos(child.theta) * u.z + r * Math.sin(child.theta) * v.z;

          setupHierarchy3D(child, depth + 1);
        });
      };

      setupHierarchy3D(root, 1);
    });

    // Sort nodes topologically (roots first, then leads, then leaves)
    nodes.sort((a, b) => a.depth - b.depth);

    return { nodes, nodeMap, roots };
  }
}
