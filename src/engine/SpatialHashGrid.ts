import type { ParticleNode } from '../types';

export class SpatialHashGrid {
  private cellSize: number;
  private grid: Map<string, ParticleNode[]> = new Map();

  constructor(cellSize: number = 120) {
    this.cellSize = cellSize;
  }

  public clear(): void {
    // Reuse bucket arrays to prevent GC churn
    for (const bucket of this.grid.values()) {
      bucket.length = 0;
    }
  }

  private getKey(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx}:${cy}`;
  }

  public insert(node: ParticleNode): void {
    // Index in screen space using projected coordinates (CR-02)
    const key = this.getKey(node.projX, node.projY);
    let bucket = this.grid.get(key);
    if (!bucket) {
      bucket = [];
      this.grid.set(key, bucket);
    }
    bucket.push(node);
  }

  public update(nodes: ParticleNode[]): void {
    this.clear();
    for (let i = 0; i < nodes.length; i++) {
      this.insert(nodes[i]);
    }
  }

  /**
   * 3D Ray-cast / Screen-space hit test:
   * Finds the particle underneath (screenX, screenY) using screen-space spatial hash buckets (CR-02).
   * If particles overlap along line of sight, picks the one closest to the viewer (smallest depth projZ).
   */
  public queryScreenPoint(screenX: number, screenY: number, _nodes?: ParticleNode[]): ParticleNode | null {
    const cx = Math.floor(screenX / this.cellSize);
    const cy = Math.floor(screenY / this.cellSize);

    let closestNode: ParticleNode | null = null;
    let minDepth = Infinity;

    // Check 3x3 neighboring cells for O(1) hit testing
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cx + dx}:${cy + dy}`;
        const bucket = this.grid.get(key);
        if (!bucket || bucket.length === 0) continue;

        for (let i = 0; i < bucket.length; i++) {
          const node = bucket[i];
          const ndx = screenX - node.projX;
          const ndy = screenY - node.projY;
          const distSq = ndx * ndx + ndy * ndy;

          // Generous hit radius for seamless clicking on small/distant nodes
          const hitRadius = Math.max(16, node.projRadius + 6);

          if (distSq <= hitRadius * hitRadius) {
            if (node.projZ < minDepth) {
              minDepth = node.projZ;
              closestNode = node;
            }
          }
        }
      }
    }

    return closestNode;
  }

  public queryPoint(worldX: number, worldY: number): ParticleNode | null {
    const cx = Math.floor(worldX / this.cellSize);
    const cy = Math.floor(worldY / this.cellSize);

    let closestNode: ParticleNode | null = null;
    let minDistanceSq = Infinity;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cx + dx}:${cy + dy}`;
        const bucket = this.grid.get(key);
        if (!bucket) continue;

        for (let i = 0; i < bucket.length; i++) {
          const node = bucket[i];
          const distSq = (worldX - node.x) ** 2 + (worldY - node.y) ** 2;
          const hitRadius = node.totalHitRadius;

          if (distSq <= hitRadius * hitRadius) {
            if (distSq < minDistanceSq) {
              minDistanceSq = distSq;
              closestNode = node;
            }
          }
        }
      }
    }

    return closestNode;
  }
}
