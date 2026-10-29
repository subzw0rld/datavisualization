import type {
  ParticleNode,
  EmployeeSkillItem,
  MetadataResponse,
  RawEmployeeDataRecord
} from '../types';
import { ApiService } from '../services/ApiService';

export class DataLoader {
  private static sharedImageCache: Map<string, HTMLImageElement> = new Map();
  /**
   * Fetches the dataset and metadata asynchronously from the backend API,
   * then computes orbital physics and builds the particle hierarchy.
   */
  public static async loadDataset(
    datasetType: 'project' | 'team',
    bounds: { width: number; height: number },
    onAvatarLoaded?: (empID: number) => void
  ): Promise<{ nodes: ParticleNode[]; nodeMap: Map<number, ParticleNode>; roots: ParticleNode[]; metadata: MetadataResponse }> {
    const [metadata, rawData] = await Promise.all([
      ApiService.fetchMetadata(),
      ApiService.fetchDataset(datasetType)
    ]);

    const result = this.parseDataset(rawData, metadata, bounds, onAvatarLoaded);
    return { ...result, metadata };
  }

  /**
   * Parses raw employee data and metadata catalogs into 3D particle nodes.
   */
  public static parseDataset(
    rawData: Record<string | number, RawEmployeeDataRecord>,
    metadata: MetadataResponse,
    bounds: { width: number; height: number },
    onAvatarLoaded?: (empID: number) => void
  ): { nodes: ParticleNode[]; nodeMap: Map<number, ParticleNode>; roots: ParticleNode[] } {
    const nodeMap = new Map<number, ParticleNode>();
    const nodes: ParticleNode[] = [];

    const { skills: skillData, levels: levelData, locations: locationData, configs } = metadata;
    const levelRadiusConfig = configs.levelRadius || {};
    const orbitalDistanceConfig = configs.orbitalDistance || {};
    const levelMassConfig = configs.levelMass || {};

    // First pass: Instantiate nodes
    for (const key of Object.keys(rawData)) {
      const raw = rawData[key];
      const empID = Number(raw.empID);
      const locId = raw.location;
      const locDef = locationData[locId] || { location: 'Global', color: '#38bdf8' };

      // Process skills
      const skillList: EmployeeSkillItem[] = [];
      if (Array.isArray(raw.skill)) {
        for (const s of raw.skill) {
          const sDef = skillData[s.id] || { skill: `Skill #${s.id}`, color: '#94a3b8' };
          const lDef = levelData[s.level] || { level: `Level ${s.level}`, color: '#cbd5e1' };
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

      const coreRadius = levelRadiusConfig[raw.level] || 30;
      const totalHitRadius = coreRadius + 21; // core + location(7) + skill(7) + level(7)
      const orbitalDistance = orbitalDistanceConfig[raw.level] || 220;

      // Calculate individual particle mass
      const baseMass = levelMassConfig[raw.level] || 2.0;
      const superviseeMassBonus = (raw.totalSupervisee || 0) * 0.4;
      const mass = baseMass + superviseeMassBonus;

      // Determine avatar path (purely data-driven, CR-19)
      let avatarUrl = '';
      if (raw.avatar && raw.avatar.length > 0) {
        avatarUrl = `/assets/images/emp-images/${raw.avatar}`;
      } else {
        // Fallback to monogram/sprite or default avatar
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

      // Load avatar image asynchronously with shared image cache
      if (avatarUrl) {
        if (!DataLoader.sharedImageCache.has(avatarUrl)) {
          const img = new Image();
          img.src = avatarUrl;
          DataLoader.sharedImageCache.set(avatarUrl, img);
        }
        const cachedImg = DataLoader.sharedImageCache.get(avatarUrl)!;
        if (cachedImg.complete && cachedImg.naturalWidth > 0) {
          node.avatarLoaded = true;
          node.avatarImg = cachedImg;
        } else {
          // Use addEventListener to support multiple nodes sharing identical avatar URL (CR-10)
          cachedImg.addEventListener('load', () => {
            node.avatarLoaded = true;
            node.avatarImg = cachedImg;
            if (onAvatarLoaded) onAvatarLoaded(empID);
          });
          // Add error handler to prevent infinite retry storms and fallback to monogram (CR-15)
          cachedImg.addEventListener('error', () => {
            console.warn(`Failed to load avatar: ${avatarUrl}`);
            node.avatarLoaded = true;
            node.avatarImg = undefined;
          });
        }
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

      // Massive systems move much slower than light particle systems!
      root.wanderSpeed = 56 / Math.pow(Math.max(1, totalSysMass), 0.45);
    });

    // 3D SPATIAL DISTRIBUTION
    // Place the system with the largest systemMass at the center
    roots.sort((a, b) => (b.systemMass || 0) - (a.systemMass || 0));

    const rootCount = roots.length;

    if (rootCount === 1) {
      // Single galaxy (e.g. Project View): centered in 3D universe
      const root = roots[0];
      root.x = 0;
      root.y = 0;
      root.z = 0;
    } else {
      // Multiple galaxies (e.g. Team View):
      // The system with the largest systemMass is placed at the center (0, 0, 0)
      roots[0].x = 0;
      roots[0].y = 0;
      roots[0].z = 0;

      // Scatter the remaining galaxies across expansive deep space
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees
      const baseGalaxyDist = Math.max(bounds.width, bounds.height) * 3.8;
      const clusterSpanRadius = baseGalaxyDist * Math.max(1.4, Math.sqrt(rootCount / 3));

      const otherRoots = roots.slice(1);
      const otherCount = otherRoots.length;

      otherRoots.forEach((root, idx) => {
        const t = (idx + 0.5) / otherCount;
        const inclination = Math.acos(1 - 2 * t);
        const azimuth = goldenAngle * idx;
        const dist = (0.45 + 0.55 * Math.sqrt(t)) * clusterSpanRadius;

        root.x = Math.sin(inclination) * Math.cos(azimuth) * dist * 1.5;
        root.y = Math.cos(inclination) * dist * 1.1;
        root.z = Math.sin(inclination) * Math.sin(azimuth) * dist * 1.3;
      });
    }

    // 3D ORBITAL PLANES & NATURAL VARIABLE ORBITAL SPACING
    roots.forEach((root, idx) => {
      if (idx === 0) {
        // Central cluster with highest systemMass faces directly in front (90° face-on view)
        root.basisU = { x: 1, y: 0, z: 0 };
        root.basisV = { x: 0, y: 1, z: 0 };
      } else {
        const seed = (root.empID % 100) / 100;
        const tiltPitch = (seed - 0.5) * (Math.PI * 0.42);
        const tiltYaw = ((idx % 3) - 1) * (Math.PI * 0.35);

        const ux = Math.cos(tiltYaw);
        const uy = 0;
        const uz = -Math.sin(tiltYaw);

        const vx = Math.sin(tiltPitch) * Math.sin(tiltYaw);
        const vy = Math.cos(tiltPitch);
        const vz = Math.sin(tiltPitch) * Math.cos(tiltYaw);

        root.basisU = { x: ux, y: uy, z: uz };
        root.basisV = { x: vx, y: vy, z: vz };
      }

      const setupHierarchy3D = (parent: ParticleNode, depth: number) => {
        const childCount = parent.children.length;
        if (childCount === 0) return;

        const angleStep = (Math.PI * 2) / childCount;
        const u = root.basisU!;
        const v = root.basisV!;

        // In real solar systems, planets aren't constrained to a single fixed distance.
        // We stagger orbital distances (Titius-Bode / logarithmic-like stepping + hash variance)
        // so children under the same supervisor never cram onto a single crowded track.
        const maxTracks = Math.min(childCount, Math.max(3, Math.ceil(Math.sqrt(childCount * 1.8))));

        parent.children.forEach((childId, index) => {
          const child = nodeMap.get(childId);
          if (!child) return;

          child.depth = depth;
          child.orbitIndex = index;
          child.theta = index * angleStep + ((child.empID % 37) / 37) * 0.45;
          child.basisU = u;
          child.basisV = v;

          // Compute dynamic non-constant orbital distance:
          // 1. Base level distance from config
          // 2. Track tier offset (staggering multiple children into concentric orbital rings)
          // 3. Deterministic natural eccentricity / orbital jitter per employee ID
          const trackTier = index % maxTracks;
          const trackOffset = trackTier * (140 + Math.min(300, childCount * 12));
          const naturalJitter = ((child.empID * 17) % 60) - 30;
          child.orbitalDistance = Math.max(160, child.orbitalDistance + trackOffset + naturalJitter);

          const massDamping = 1 / Math.pow(Math.max(1, parent.systemMass / 8), 0.2);
          const direction = index % 2 === 0 ? 1 : -0.92;
          child.angularVelocity = (0.42 / Math.sqrt(child.orbitalDistance / 100)) * massDamping * direction;

          const r = child.orbitalDistance;
          child.x = parent.x + r * Math.cos(child.theta) * u.x + r * Math.sin(child.theta) * v.x;
          child.y = parent.y + r * Math.cos(child.theta) * u.y + r * Math.sin(child.theta) * v.y;
          child.z = parent.z + r * Math.cos(child.theta) * u.z + r * Math.sin(child.theta) * v.z;

          setupHierarchy3D(child, depth + 1);
        });
      };

      setupHierarchy3D(root, 1);
    });

    nodes.sort((a, b) => a.depth - b.depth);

    return { nodes, nodeMap, roots };
  }
}
