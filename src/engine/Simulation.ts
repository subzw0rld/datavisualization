import type { ParticleNode, SimulationFilters } from '../types';
import { Camera } from './Camera';

export class Simulation {
  public nodes: ParticleNode[] = [];
  public nodeMap: Map<number, ParticleNode> = new Map();
  public roots: ParticleNode[] = [];
  public speedMultiplier: number = 1.0;
  public paused: boolean = false;
  public selectedNodeId: number | null = null;
  public hoveredNodeId: number | null = null;
  public draggedNode: ParticleNode | null = null;

  // 3D Cosmic Space Boundaries (expansive astronomical universe)
  private cosmicBounds = {
    minX: -12000,
    maxX: 12000,
    minY: -9000,
    maxY: 9000,
    minZ: -8000,
    maxZ: 8000
  };

  public setBounds(width: number, height: number): void {
    // Dynamic boundary scales generously with screen viewport and supports large-scale universes
    const span = Math.max(width, height) * 6.5;
    this.cosmicBounds = {
      minX: -span,
      maxX: span,
      minY: -span * 0.75,
      maxY: span * 0.75,
      minZ: -Math.max(6000, span * 0.65),
      maxZ: Math.max(6000, span * 0.65)
    };
  }

  public setData(data: { nodes: ParticleNode[]; nodeMap: Map<number, ParticleNode>; roots: ParticleNode[] }): void {
    this.nodes = data.nodes;
    this.nodeMap = data.nodeMap;
    this.roots = data.roots;
    this.selectedNodeId = null;
    this.hoveredNodeId = null;
    this.draggedNode = null;
  }

  public selectNode(empID: number | null): void {
    if (this.selectedNodeId !== null) {
      const prev = this.nodeMap.get(this.selectedNodeId);
      if (prev) {
        prev.isSelected = false;
      }
    }
    this.selectedNodeId = empID;
    if (empID !== null) {
      const next = this.nodeMap.get(empID);
      if (next) {
        next.isSelected = true;
        next.pulseTimer = 0;
      }
    }
  }

  public hoverNode(empID: number | null): void {
    if (this.hoveredNodeId === empID) return;
    if (this.hoveredNodeId !== null) {
      const prev = this.nodeMap.get(this.hoveredNodeId);
      if (prev) {
        prev.isHovered = false;
      }
    }
    this.hoveredNodeId = empID;
    if (empID !== null) {
      const next = this.nodeMap.get(empID);
      if (next) {
        next.isHovered = true;
      }
    }
  }

  public startDrag(node: ParticleNode): void {
    this.draggedNode = node;
    node.isDragging = true;
    node.vx = 0;
    node.vy = 0;
    node.vz = 0;
  }

  public updateDrag(worldX: number, worldY: number, worldZ?: number): void {
    if (!this.draggedNode) return;
    this.draggedNode.x = worldX;
    this.draggedNode.y = worldY;
    if (worldZ !== undefined) {
      this.draggedNode.z = worldZ;
    }
    this.draggedNode.vx = 0;
    this.draggedNode.vy = 0;
    this.draggedNode.vz = 0;
  }

  public endDrag(): void {
    if (this.draggedNode) {
      this.draggedNode.isDragging = false;
      this.draggedNode = null;
    }
  }

  public applyFilters(filters: SimulationFilters): ParticleNode[] {
    const query = filters.searchQuery.trim().toLowerCase();
    const matchingNodes: ParticleNode[] = [];

    for (const node of this.nodes) {
      let matches = true;

      // Filter by skill
      if (filters.skillId !== null && filters.skillId !== undefined) {
        const hasSkill = node.skills.some((s) => s.id === filters.skillId);
        if (!hasSkill) matches = false;
      }

      // Filter by level
      if (matches && filters.levelId !== null && filters.levelId !== undefined) {
        const hasLevel = node.skills.some((s) => s.level === filters.levelId);
        if (!hasLevel) matches = false;
      }

      // Filter by location
      if (matches && filters.locationId !== null && filters.locationId !== undefined) {
        if (node.locationId !== filters.locationId) matches = false;
      }

      // Filter by search query (name, desig, empID, skills)
      if (matches && query.length > 0) {
        const nameMatch = node.name.toLowerCase().includes(query);
        const desigMatch = node.desig.toLowerCase().includes(query);
        const idMatch = node.empID.toString().includes(query);
        const skillMatch = node.skills.some((s) => s.name.toLowerCase().includes(query));

        if (!nameMatch && !desigMatch && !idMatch && !skillMatch) {
          matches = false;
        }
      }

      node.matchesFilter = matches;
      if (matches) {
        matchingNodes.push(node);
      }
    }

    return matchingNodes;
  }

  public update(dt: number, camera: Camera): void {
    // Clamp delta-time to prevent numerical instability during frame lag
    const safeDt = Math.min(dt, 0.05);

    // 1. Update selection pulse timer
    for (const node of this.nodes) {
      if (node.isSelected && node.pulseTimer < 1.0) {
        node.pulseTimer = Math.min(1.0, node.pulseTimer + safeDt * 1.5);
      }
    }

    if (!this.paused) {
      const bounds = this.cosmicBounds;

      // 2. Update Root Galaxy Nuclei with Mass-Dependent Drift
      for (const root of this.roots) {
        if (!root.isDragging) {
          // Slow continuous orientation wandering
          root.wanderAngle += (Math.random() - 0.5) * safeDt * 1.6;

          // Speed inversely proportional to total system mass
          const speed = root.wanderSpeed * this.speedMultiplier;

          let fx = Math.cos(root.wanderAngle) * speed;
          let fy = Math.sin(root.wanderAngle) * speed * 0.75;
          let fz = Math.sin(root.wanderAngle * 0.7) * speed * 0.5;

          // Soft cosmic boundary rebound
          if (root.x < bounds.minX) fx += (bounds.minX - root.x) * 1.5;
          if (root.x > bounds.maxX) fx -= (root.x - bounds.maxX) * 1.5;
          if (root.y < bounds.minY) fy += (bounds.minY - root.y) * 1.5;
          if (root.y > bounds.maxY) fy -= (root.y - bounds.maxY) * 1.5;
          if (root.z < bounds.minZ) fz += (bounds.minZ - root.z) * 1.5;
          if (root.z > bounds.maxZ) fz -= (root.z - bounds.maxZ) * 1.5;

          root.vx += (fx - root.vx) * safeDt * 2.0;
          root.vy += (fy - root.vy) * safeDt * 2.0;
          root.vz += (fz - root.vz) * safeDt * 2.0;

          root.x += root.vx * safeDt;
          root.y += root.vy * safeDt;
          root.z += root.vz * safeDt;
        }
      }

      // 3. Update Child Orbital Nodes in Tilted 3D Planes with Spring Physics
      for (const node of this.nodes) {
        if (node.isRoot || !node.supervisorId) continue;

        const supervisor = this.nodeMap.get(node.supervisorId);
        if (!supervisor) continue;

        // Advance orbital angle
        const angularStep = node.angularVelocity * this.speedMultiplier * safeDt;
        node.theta = (node.theta + angularStep) % (Math.PI * 2);

        if (node.isDragging) {
          continue;
        }

        // Tilted 3D orbital plane basis vectors
        const u = node.basisU || { x: 1, y: 0, z: 0 };
        const v = node.basisV || { x: 0, y: 1, z: 0 };
        const r = node.orbitalDistance;
        const cosT = Math.cos(node.theta);
        const sinT = Math.sin(node.theta);

        // Ideal 3D target coordinate: P_target = P_parent + R*cos(theta)*u + R*sin(theta)*v
        const targetX = supervisor.x + r * cosT * u.x + r * sinT * v.x;
        const targetY = supervisor.y + r * cosT * u.y + r * sinT * v.y;
        const targetZ = supervisor.z + r * cosT * u.z + r * sinT * v.z;

        // Damped 3D spring-damper tracking
        const springK = 7.5;
        const damping = 4.2;

        const ax = (targetX - node.x) * springK - node.vx * damping;
        const ay = (targetY - node.y) * springK - node.vy * damping;
        const az = (targetZ - node.z) * springK - node.vz * damping;

        node.vx += ax * safeDt;
        node.vy += ay * safeDt;
        node.vz += az * safeDt;

        node.x += node.vx * safeDt;
        node.y += node.vy * safeDt;
        node.z += node.vz * safeDt;
      }
    }

    // 4. Compute 3D Projected Screen Coordinates for all nodes
    for (const node of this.nodes) {
      const proj = camera.project3D(node.x, node.y, node.z);
      node.projX = proj.screenX;
      node.projY = proj.screenY;
      node.projZ = proj.depth;
      node.projScale = proj.scale;
      // Apparent viewing size directly determined by distance from viewer!
      node.projRadius = Math.max(6, node.totalHitRadius * proj.scale);

      // Atmospheric/cosmic depth fade: distant nodes are gently dimmed
      const depthFactor = Math.min(1.2, Math.max(0.25, proj.scale));
      node.projAlpha = 0.35 + 0.65 * Math.min(1.0, depthFactor);
    }
  }
}
