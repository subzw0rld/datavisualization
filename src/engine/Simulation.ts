import type { ParticleNode, SimulationFilters } from '../types';

export class Simulation {
  public nodes: ParticleNode[] = [];
  public nodeMap: Map<number, ParticleNode> = new Map();
  public roots: ParticleNode[] = [];
  public speedMultiplier: number = 1.0;
  public paused: boolean = false;
  public selectedNodeId: number | null = null;
  public hoveredNodeId: number | null = null;
  public draggedNode: ParticleNode | null = null;

  private worldBounds: { width: number; height: number } = {
    width: window.innerWidth * 2,
    height: window.innerHeight * 2
  };

  public setBounds(width: number, height: number): void {
    this.worldBounds = {
      width: Math.max(1600, width * 1.5),
      height: Math.max(1200, height * 1.5)
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
    this.selectedNodeId = empID;
    this.nodes.forEach((n) => {
      n.isSelected = n.empID === empID;
      if (n.isSelected) {
        n.pulseTimer = 0;
      }
    });
  }

  public hoverNode(empID: number | null): void {
    this.hoveredNodeId = empID;
    this.nodes.forEach((n) => {
      n.isHovered = n.empID === empID;
    });
  }

  public startDrag(node: ParticleNode): void {
    this.draggedNode = node;
    node.isDragging = true;
    node.vx = 0;
    node.vy = 0;
  }

  public updateDrag(worldX: number, worldY: number): void {
    if (!this.draggedNode) return;
    this.draggedNode.x = worldX;
    this.draggedNode.y = worldY;
    this.draggedNode.vx = 0;
    this.draggedNode.vy = 0;
  }

  public endDrag(): void {
    if (this.draggedNode) {
      this.draggedNode.isDragging = false;
      this.draggedNode = null;
    }
  }

  public applyFilters(filters: SimulationFilters): void {
    const query = filters.searchQuery.trim().toLowerCase();

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
    }
  }

  public update(dt: number): void {
    // Clamp delta-time to prevent physics instability during tab switching
    const safeDt = Math.min(dt, 0.05);

    // 1. Update selection pulse timer
    for (const node of this.nodes) {
      if (node.isSelected && node.pulseTimer < 1.0) {
        node.pulseTimer = Math.min(1.0, node.pulseTimer + safeDt * 1.5);
      }
    }

    if (this.paused) return;

    const minX = 150;
    const minY = 150;
    const maxX = this.worldBounds.width - 150;
    const maxY = this.worldBounds.height - 150;

    // 2. Update Root / Wandering nodes
    for (const root of this.roots) {
      if (!root.isDragging) {
        // Wandering angle physics with gentle drift
        root.wanderAngle += (Math.random() - 0.5) * safeDt * 2.0;
        const speed = root.wanderSpeed * this.speedMultiplier;

        let fx = Math.cos(root.wanderAngle) * speed;
        let fy = Math.sin(root.wanderAngle) * speed;

        // Soft boundary avoidance steering
        if (root.x < minX) fx += (minX - root.x) * 2;
        if (root.x > maxX) fx -= (root.x - maxX) * 2;
        if (root.y < minY) fy += (minY - root.y) * 2;
        if (root.y > maxY) fy -= (root.y - maxY) * 2;

        root.vx += (fx - root.vx) * safeDt * 2.0;
        root.vy += (fy - root.vy) * safeDt * 2.0;

        root.x += root.vx * safeDt;
        root.y += root.vy * safeDt;
      }
    }

    // 3. Update Child Orbital Nodes with Spring Physics
    // Nodes are topologically sorted by depth, ensuring supervisors move before their children
    for (const node of this.nodes) {
      if (node.isRoot || !node.supervisorId) continue;

      const supervisor = this.nodeMap.get(node.supervisorId);
      if (!supervisor) continue;

      // Update orbital angle
      const angularStep = node.angularVelocity * this.speedMultiplier * safeDt;
      node.theta = (node.theta + angularStep) % (Math.PI * 2);

      // Compute ideal target orbit coordinate
      const targetX = supervisor.x + Math.cos(node.theta) * node.orbitalDistance;
      const targetY = supervisor.y + Math.sin(node.theta) * node.orbitalDistance;

      if (node.isDragging) {
        // User is directly manipulating this node
        continue;
      }

      // Damped spring-damper system following target orbital position
      // Higher spring stiffness gives crisp responsiveness, damping prevents oscillation
      const springK = 7.5;
      const damping = 4.2;

      const ax = (targetX - node.x) * springK - node.vx * damping;
      const ay = (targetY - node.y) * springK - node.vy * damping;

      node.vx += ax * safeDt;
      node.vy += ay * safeDt;

      node.x += node.vx * safeDt;
      node.y += node.vy * safeDt;
    }
  }
}
