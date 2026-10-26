// ------------------------------------------------------------
// Renderer module – draws particles, orbits, links, and the cosmic background.
// ------------------------------------------------------------

/**
 * @file Renderer.ts – core rendering engine for drawing particles, orbits, links, and background.
 */
import type { ParticleNode } from '../types';
import { Camera } from './Camera';
import { SpriteCache } from './SpriteCache';

interface CosmicStar {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  twinkleSpeed: number;
  seed: number;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spriteCache: SpriteCache;
  private dpr: number = 1;
  private width: number = window.innerWidth;
  private height: number = window.innerHeight;

  public showOrbits: boolean = true;
  public showLinks: boolean = true;

  // 3D Cosmic Starfield
  private stars: CosmicStar[] = [];

  constructor(canvas: HTMLCanvasElement, spriteCache: SpriteCache) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;
    this.spriteCache = spriteCache;
    this.initCosmicStars();
    this.handleResize();
  }

  private initCosmicStars(): void {
    this.stars = [];
    const colors = ['#e0f2fe', '#bae6fd', '#7dd3fc', '#fbcfe8', '#ddd6fe', '#ffffff'];
    for (let i = 0; i < 220; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * 5000,
        y: (Math.random() - 0.5) * 3600,
        z: 800 + Math.random() * 3200, // Deep cosmic background
        size: 0.8 + Math.random() * 1.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkleSpeed: 1.0 + Math.random() * 3.0,
        seed: Math.random() * Math.PI * 2
      });
    }
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

  public render(
    nodes: ParticleNode[],
    nodeMap: Map<number, ParticleNode>,
    roots: ParticleNode[],
    camera: Camera,
    simTime: number
  ): void {
    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;

    // Direct 1:1 screen pixel space (DPR scaled)
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // 1. Render Deep Space Cosmic Background & Parallax Stars
    this.renderCosmicBackground(ctx, width, height, camera, simTime);

    // 2. Render Galaxy Core Nebula Glows in 3D
    this.renderGalaxyNebulae(ctx, roots);

    // 3. Render 3D Projected Orbital Trajectory Ellipses
    if (this.showOrbits) {
      this.renderOrbitalRings3D(ctx, nodes, nodeMap, camera);
    }

    // 4. Render 3D Gravitational Connection Links
    if (this.showLinks) {
      this.renderConnectionLinks3D(ctx, nodes, nodeMap);
    }

    // 5. Render 3D Depth-Sorted Particle Glyphs (Painter's Algorithm)
    this.renderParticles3D(ctx, nodes);
  }

  private renderCosmicBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camera: Camera,
    simTime: number
  ): void {
    // Deep universe gradient
    const bgGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.1,
      width / 2,
      height / 2,
      width * 0.85
    );
    bgGrad.addColorStop(0, '#090e1a');
    bgGrad.addColorStop(0.5, '#040711');
    bgGrad.addColorStop(1, '#020307');

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Render 3D background stars with parallax
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      const p = camera.project3D(star.x, star.y, star.z);

      if (p.screenX < -20 || p.screenX > width + 20 || p.screenY < -20 || p.screenY > height + 20) {
        continue;
      }

      const twinkle = 0.5 + 0.5 * Math.sin(simTime * star.twinkleSpeed + star.seed);
      const alpha = Math.min(1.0, (0.2 + 0.6 * twinkle) * Math.min(1.0, p.scale * 1.5));
      const radius = Math.max(0.6, star.size * p.scale);

      ctx.beginPath();
      ctx.arc(p.screenX, p.screenY, radius, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  private renderGalaxyNebulae(ctx: CanvasRenderingContext2D, roots: ParticleNode[]): void {
    ctx.save();
    for (const root of roots) {
      if (root.projScale <= 0.05) continue;

      const nebulaRadius = Math.max(60, (180 + root.systemMass * 4) * root.projScale);
      const grad = ctx.createRadialGradient(
        root.projX,
        root.projY,
        nebulaRadius * 0.05,
        root.projX,
        root.projY,
        nebulaRadius
      );

      // Subtle cyan-indigo cosmic nebula cloud
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
      grad.addColorStop(0.4, 'rgba(99, 102, 241, 0.08)');
      grad.addColorStop(0.8, 'rgba(168, 85, 247, 0.03)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(root.projX, root.projY, nebulaRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
    ctx.restore();
  }

  private renderOrbitalRings3D(
    ctx: CanvasRenderingContext2D,
    nodes: ParticleNode[],
    nodeMap: Map<number, ParticleNode>,
    camera: Camera
  ): void {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);

    for (const node of nodes) {
      if (node.isSupervisor && node.children.length > 0) {
        const u = node.basisU || { x: 1, y: 0, z: 0 };
        const v = node.basisV || { x: 0, y: 1, z: 0 };

        // Collect distinct orbital distances
        const distSet = new Set<number>();
        for (const childId of node.children) {
          const child = nodeMap.get(childId);
          if (child) distSet.add(child.orbitalDistance);
        }

        const isHighlighted = node.isHovered || node.isSelected;

        for (const dist of distSet) {
          ctx.beginPath();
          const steps = 36;
          for (let i = 0; i <= steps; i++) {
            const phi = (i / steps) * Math.PI * 2;
            const cosPhi = Math.cos(phi);
            const sinPhi = Math.sin(phi);

            // 3D point on tilted orbital circle
            const ox = node.x + dist * cosPhi * u.x + dist * sinPhi * v.x;
            const oy = node.y + dist * cosPhi * u.y + dist * sinPhi * v.y;
            const oz = node.z + dist * cosPhi * u.z + dist * sinPhi * v.z;

            const pt = camera.project3D(ox, oy, oz);
            if (i === 0) {
              ctx.moveTo(pt.screenX, pt.screenY);
            } else {
              ctx.lineTo(pt.screenX, pt.screenY);
            }
          }

          // Depth-cued opacity
          const baseAlpha = isHighlighted ? 0.45 : 0.12;
          const alpha = Math.min(0.6, baseAlpha * node.projAlpha);
          ctx.strokeStyle = isHighlighted
            ? `rgba(56, 189, 248, ${alpha})`
            : `rgba(148, 163, 184, ${alpha})`;
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  private renderConnectionLinks3D(
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
      ctx.moveTo(supervisor.projX, supervisor.projY);
      ctx.lineTo(node.projX, node.projY);

      const avgScale = (supervisor.projScale + node.projScale) / 2;
      const avgAlpha = (supervisor.projAlpha + node.projAlpha) / 2;

      if (isConnectedHighlight) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${Math.min(1.0, 0.85 * avgAlpha)})`;
        ctx.lineWidth = Math.max(1.2, 2.2 * avgScale);
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
      } else {
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.35, 0.16 * avgAlpha)})`;
        ctx.lineWidth = Math.max(0.6, 1.0 * avgScale);
        ctx.shadowBlur = 0;
      }

      ctx.stroke();
    }

    ctx.restore();
  }

  private renderParticles3D(ctx: CanvasRenderingContext2D, nodes: ParticleNode[]): void {
    // 3D Depth Sorting: Draw from farthest to nearest (Painter's Algorithm)
    const sortedNodes = [...nodes].sort((a, b) => b.projZ - a.projZ);

    for (const node of sortedNodes) {
      const sprite = this.spriteCache.getSprite(node);
      const spriteOriginalSize = sprite.width / this.dpr;

      // Viewing size determined by distance from viewer (Requirement 3)
      const renderedSize = spriteOriginalSize * node.projScale;
      const halfSize = renderedSize / 2;

      ctx.save();
      ctx.translate(node.projX, node.projY);

      // Opacity dimming if filtered out or far in cosmic depth
      let alpha = node.projAlpha;
      if (!node.matchesFilter) {
        alpha *= 0.2;
      }
      ctx.globalAlpha = Math.min(1.0, Math.max(0.15, alpha));

      // Dynamic heartbeat pulse or hover scale
      let dynamicScale = 1.0;
      if (node.isSelected && node.pulseTimer < 1.0) {
        const wave = Math.sin(node.pulseTimer * Math.PI * 3);
        dynamicScale = 1.0 + wave * 0.16;
      } else if (node.isHovered) {
        dynamicScale = 1.1;
      }

      if (dynamicScale !== 1.0) {
        ctx.scale(dynamicScale, dynamicScale);
      }

      // Energy halo for hovered or selected particles
      if (node.isSelected || node.isHovered) {
        ctx.beginPath();
        const haloRadius = (node.totalHitRadius + 4) * node.projScale;
        ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
        ctx.lineWidth = node.isSelected ? Math.max(2, 3.5 * node.projScale) : Math.max(1.5, 2 * node.projScale);
        ctx.strokeStyle = node.isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.75)';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Fast single-operation blit of pre-rendered glyph scaled to distance!
      ctx.drawImage(sprite, -halfSize, -halfSize, renderedSize, renderedSize);

      // Render employee text labels (scaled to distance)
      if (node.projScale >= 0.32 || node.isHovered || node.isSelected) {
        const fontSize = Math.max(8, Math.min(13, Math.round(11 * Math.sqrt(node.projScale))));
        ctx.font = `500 ${fontSize}px Outfit, Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const labelY = halfSize + 4;

        // Subtle text backdrop glow for contrast against deep space
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 4;

        ctx.fillStyle = node.isSelected ? '#38bdf8' : node.isHovered ? '#ffffff' : '#94a3b8';
        ctx.fillText(node.name, 0, labelY);

        if (node.projScale >= 0.55 || node.isHovered || node.isSelected) {
          const subFontSize = Math.max(7, Math.min(10, Math.round(9 * Math.sqrt(node.projScale))));
          ctx.font = `400 ${subFontSize}px Outfit, Inter, sans-serif`;
          ctx.fillStyle = '#64748b';
          ctx.fillText(node.desig, 0, labelY + fontSize + 2);
        }
      }

      ctx.restore();
    }
  }
}
