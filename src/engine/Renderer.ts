import type { ParticleNode } from '../types';
import { Camera } from './Camera';
import { SpriteCache } from './SpriteCache';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spriteCache: SpriteCache;
  private dpr: number = 1;
  private width: number = window.innerWidth;
  private height: number = window.innerHeight;

  public showOrbits: boolean = true;
  public showLinks: boolean = true;

  constructor(canvas: HTMLCanvasElement, spriteCache: SpriteCache) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;
    this.spriteCache = spriteCache;
    this.handleResize();
  }

  public handleResize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
  }

  public render(nodes: ParticleNode[], nodeMap: Map<number, ParticleNode>, camera: Camera): void {
    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;

    // Reset base transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 1. Draw rich cosmic dark background
    this.renderBackground(ctx, width, height, camera);

    // 2. Set camera transform for world objects
    const cx = (width / 2) * this.dpr;
    const cy = (height / 2) * this.dpr;
    ctx.setTransform(
      camera.zoom * this.dpr,
      0,
      0,
      camera.zoom * this.dpr,
      cx + camera.x * this.dpr,
      cy + camera.y * this.dpr
    );

    // World-space center offset
    const worldOffsetX = width / 2;
    const worldOffsetY = height / 2;
    ctx.translate(-worldOffsetX, -worldOffsetY);

    // 3. Render Orbital Trajectory Rings
    if (this.showOrbits) {
      this.renderOrbitalRings(ctx, nodes, nodeMap);
    }

    // 4. Render Gravitational / Hierarchical Connection Links
    if (this.showLinks) {
      this.renderConnectionLinks(ctx, nodes, nodeMap);
    }

    // 5. Render Particle Glyphs via Pre-rendered Sprite Cache
    this.renderParticles(ctx, nodes);
  }

  private renderBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camera: Camera
  ): void {
    const dprWidth = width * this.dpr;
    const dprHeight = height * this.dpr;

    // Deep space gradient
    const bgGrad = ctx.createRadialGradient(
      dprWidth / 2,
      dprHeight / 2,
      dprWidth * 0.1,
      dprWidth / 2,
      dprHeight / 2,
      dprWidth * 0.8
    );
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.6, '#040711');
    bgGrad.addColorStop(1, '#020307');

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, dprWidth, dprHeight);

    // Subtle parallax grid dots
    const gridSize = 60 * camera.zoom * this.dpr;
    if (gridSize > 15) {
      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
      const offsetX = ((camera.x * this.dpr) % gridSize + gridSize) % gridSize;
      const offsetY = ((camera.y * this.dpr) % gridSize + gridSize) % gridSize;

      for (let x = offsetX; x < dprWidth; x += gridSize) {
        for (let y = offsetY; y < dprHeight; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2 * this.dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  private renderOrbitalRings(
    ctx: CanvasRenderingContext2D,
    nodes: ParticleNode[],
    nodeMap: Map<number, ParticleNode>
  ): void {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);

    for (const node of nodes) {
      if (node.isSupervisor && node.children.length > 0) {
        // Collect distinct orbital distances
        const distSet = new Set<number>();
        for (const childId of node.children) {
          const child = nodeMap.get(childId);
          if (child) distSet.add(child.orbitalDistance);
        }

        for (const dist of distSet) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, dist, 0, Math.PI * 2);
          ctx.strokeStyle = node.isHovered || node.isSelected
            ? 'rgba(56, 189, 248, 0.25)'
            : 'rgba(148, 163, 184, 0.1)';
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  private renderConnectionLinks(
    ctx: CanvasRenderingContext2D,
    nodes: ParticleNode[],
    nodeMap: Map<number, ParticleNode>
  ): void {
    ctx.save();

    for (const node of nodes) {
      if (!node.supervisorId) continue;
      const supervisor = nodeMap.get(node.supervisorId);
      if (!supervisor) continue;

      const isConnectedHighlight =
        node.isHovered || node.isSelected || supervisor.isHovered || supervisor.isSelected;

      ctx.beginPath();
      ctx.moveTo(supervisor.x, supervisor.y);
      ctx.lineTo(node.x, node.y);

      if (isConnectedHighlight) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 2.0;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.0;
        ctx.shadowBlur = 0;
      }

      ctx.stroke();
    }

    ctx.restore();
  }

  private renderParticles(ctx: CanvasRenderingContext2D, nodes: ParticleNode[]): void {
    for (const node of nodes) {
      const sprite = this.spriteCache.getSprite(node);
      const spriteSize = sprite.width / this.dpr;
      const halfSize = spriteSize / 2;

      ctx.save();

      // Opacity dimming if filtered out
      if (!node.matchesFilter) {
        ctx.globalAlpha = 0.2;
      }

      // Selection pulse / heartbeat scale calculation
      let scale = 1.0;
      if (node.isSelected && node.pulseTimer < 1.0) {
        // Multi-beat rhythmic heart pulse curve
        const wave = Math.sin(node.pulseTimer * Math.PI * 3);
        scale = 1.0 + wave * 0.12;
      } else if (node.isHovered) {
        scale = 1.08;
      }

      ctx.translate(node.x, node.y);
      if (scale !== 1.0) {
        ctx.scale(scale, scale);
      }

      // Draw selection / hover energy ring
      if (node.isSelected || node.isHovered) {
        ctx.beginPath();
        ctx.arc(0, 0, node.totalHitRadius + 4, 0, Math.PI * 2);
        ctx.lineWidth = node.isSelected ? 3 : 2;
        ctx.strokeStyle = node.isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.6)';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Fast single-operation blit of pre-rendered glyph!
      ctx.drawImage(sprite, -halfSize, -halfSize, spriteSize, spriteSize);

      // Render employee name badge below glyph
      ctx.font = '500 11px Outfit, Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const labelY = node.totalHitRadius + 6;
      ctx.fillStyle = node.isSelected ? '#38bdf8' : node.isHovered ? '#ffffff' : '#94a3b8';
      ctx.fillText(node.name, 0, labelY);

      // Sub-label for designation
      ctx.font = '400 9px Outfit, Inter, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(node.desig, 0, labelY + 13);

      ctx.restore();
    }
  }
}
