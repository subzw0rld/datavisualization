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

interface Comet {
  startX: number;
  startY: number;
  startZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  progress: number; // 0 to 1
  duration: number; // travel duration in seconds
  tailLength: number; // tail trail factor (e.g. 0.15 - 0.35)
  headRadius: number;
  color: string;
  glowColor: string;
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

  // Random Cosmic Comets
  private activeComets: Comet[] = [];
  private nextCometDelay: number = 2.0; // Seconds until next comet spawn
  private lastSimTime: number = 0;

  constructor(canvas: HTMLCanvasElement, spriteCache: SpriteCache) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;
    this.spriteCache = spriteCache;
    this.initCosmicStars();
    this.scheduleNextComet();
    this.handleResize();
  }

  private scheduleNextComet(): void {
    // Non-regular random interval: e.g. between 2.5s and 9.5s
    this.nextCometDelay = 2.5 + Math.random() * 7.0;
  }

  private spawnComet(): void {
    // Generate comets in deep cosmic background (further back so they remain faint & non-intrusive)
    const spawnDistance = 3800 + Math.random() * 2200;
    const angle = Math.random() * Math.PI * 2;
    const elevation = (Math.random() - 0.5) * Math.PI * 0.6; // Vertical tilt

    // Start coordinate far in deep space background
    const startX = Math.cos(angle) * Math.cos(elevation) * spawnDistance;
    const startY = Math.sin(elevation) * (spawnDistance * 0.7);
    const startZ = 1200 + Math.random() * 2500; // Keep deep behind particles

    // Trajectory crossing background space with subtle sweep
    const shootDist = 3500 + Math.random() * 2000;
    const trajectoryAngle = angle + Math.PI + (Math.random() - 0.5) * 1.6;
    const trajectoryElev = -elevation + (Math.random() - 0.5) * 0.8;

    const targetX = startX + Math.cos(trajectoryAngle) * Math.cos(trajectoryElev) * shootDist;
    const targetY = startY + Math.sin(trajectoryElev) * shootDist;
    const targetZ = startZ + (Math.random() - 0.5) * 600;

    const colorPalettes = [
      { color: 'rgba(224, 242, 254, 0.7)', glow: 'rgba(56, 189, 248, 0.4)' },  // Soft cyan
      { color: 'rgba(240, 253, 244, 0.7)', glow: 'rgba(52, 211, 153, 0.35)' }, // Soft emerald
      { color: 'rgba(250, 245, 255, 0.7)', glow: 'rgba(192, 132, 252, 0.4)' }, // Soft violet
      { color: 'rgba(255, 251, 235, 0.7)', glow: 'rgba(251, 191, 36, 0.35)' }, // Soft warm ember
      { color: 'rgba(255, 255, 255, 0.7)', glow: 'rgba(148, 163, 184, 0.35)' }  // Soft white/silver
    ];
    const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

    this.activeComets.push({
      startX,
      startY,
      startZ,
      targetX,
      targetY,
      targetZ,
      progress: 0,
      duration: 1.0 + Math.random() * 1.4, // Fast, swift shooting star feel
      tailLength: 0.04 + Math.random() * 0.04, // Short subtle streak (4-8% of trajectory)
      headRadius: 0.8 + Math.random() * 0.6, // Delicate small head
      color: palette.color,
      glowColor: palette.glow
    });
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
    // Update and spawn random comets at non-regular intervals
    const dt = this.lastSimTime > 0 ? Math.min(0.1, Math.max(0.001, simTime - this.lastSimTime)) : 0.016;
    this.lastSimTime = simTime;

    this.nextCometDelay -= dt;
    if (this.nextCometDelay <= 0) {
      this.spawnComet();
      this.scheduleNextComet();
    }

    // Render 3D Background Comets (between stars and nebula for authentic cosmic depth)
    this.renderComets(ctx, camera, dt);

    ctx.globalAlpha = 1.0;
  }

  private renderComets(ctx: CanvasRenderingContext2D, camera: Camera, dt: number): void {
    ctx.save();
    for (let i = this.activeComets.length - 1; i >= 0; i--) {
      const comet = this.activeComets[i];
      comet.progress += dt / comet.duration;

      if (comet.progress >= 1.0) {
        this.activeComets.splice(i, 1);
        continue;
      }

      // Smooth fade-in at launch and fade-out as it dissipates
      const lifeAlpha = Math.sin(comet.progress * Math.PI);

      // Current head position in 3D
      const headX = comet.startX + (comet.targetX - comet.startX) * comet.progress;
      const headY = comet.startY + (comet.targetY - comet.startY) * comet.progress;
      const headZ = comet.startZ + (comet.targetZ - comet.startZ) * comet.progress;

      // Tail end position trailing behind based on tailLength
      const tailProgress = Math.max(0, comet.progress - comet.tailLength);
      const tailX = comet.startX + (comet.targetX - comet.startX) * tailProgress;
      const tailY = comet.startY + (comet.targetY - comet.startY) * tailProgress;
      const tailZ = comet.startZ + (comet.targetZ - comet.startZ) * tailProgress;

      const pHead = camera.project3D(headX, headY, headZ);
      const pTail = camera.project3D(tailX, tailY, tailZ);

      // Ensure comet is in front of camera lens and not degenerate
      if (pHead.scale <= 0.05 || pTail.scale <= 0.05) continue;

      const headScreenX = pHead.screenX;
      const headScreenY = pHead.screenY;
      const tailScreenX = pTail.screenX;
      const tailScreenY = pTail.screenY;

      // Draw subtle shooting comet trail
      const grad = ctx.createLinearGradient(tailScreenX, tailScreenY, headScreenX, headScreenY);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.7, comet.glowColor);
      grad.addColorStop(1, comet.color);

      // Faint background presence: alpha capped at ~0.35 - 0.45
      const trailAlpha = Math.min(0.45, lifeAlpha * 0.45 * Math.min(1.0, pHead.scale * 1.2));

      ctx.beginPath();
      ctx.moveTo(tailScreenX, tailScreenY);
      ctx.lineTo(headScreenX, headScreenY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(0.6, comet.headRadius * pHead.scale);
      ctx.lineCap = 'round';
      ctx.globalAlpha = trailAlpha;
      ctx.shadowColor = comet.glowColor;
      ctx.shadowBlur = 4;
      ctx.stroke();

      // Faint glowing comet core / head
      ctx.beginPath();
      const headRadius = Math.max(0.8, comet.headRadius * 0.9 * pHead.scale);
      ctx.arc(headScreenX, headScreenY, headRadius, 0, Math.PI * 2);
      ctx.fillStyle = comet.color;
      ctx.globalAlpha = Math.min(0.55, lifeAlpha * 0.55);
      ctx.shadowColor = comet.glowColor;
      ctx.shadowBlur = 6;
      ctx.fill();
    }
    ctx.restore();
  }

  private renderGalaxyNebulae(ctx: CanvasRenderingContext2D, roots: ParticleNode[]): void {
    ctx.save();
    for (const root of roots) {
      if (root.projScale <= 0.05) continue;

      // Cap the maximum nebula radius so massive clusters don't overlap and flood the background
      const maxNebulaWorldRadius = Math.min(260, 100 + Math.sqrt(root.systemMass) * 4);
      const nebulaRadius = Math.max(30, maxNebulaWorldRadius * root.projScale);

      // Distance attenuation so distant galaxies don't produce large washouts
      const scaleAlpha = Math.min(1.0, Math.max(0.2, root.projScale));

      const grad = ctx.createRadialGradient(
        root.projX,
        root.projY,
        nebulaRadius * 0.05,
        root.projX,
        root.projY,
        nebulaRadius
      );

      // Delicate subtle cyan-indigo cosmic nebula glow (capped opacity)
      grad.addColorStop(0, `rgba(56, 189, 248, ${0.08 * scaleAlpha})`);
      grad.addColorStop(0.4, `rgba(99, 102, 241, ${0.04 * scaleAlpha})`);
      grad.addColorStop(0.8, `rgba(168, 85, 247, ${0.015 * scaleAlpha})`);
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

      // Distance LOD for links: avoid drawing thousands of sub-pixel links when zoomed far out
      if (!isConnectedHighlight && avgScale < 0.05) {
        continue;
      }

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

      // Render employee text labels with progressive distance Level-Of-Detail (LOD):
      // - Distant particles appear as celestial bodies without cluttering the screen with thousands of text labels.
      // - As the viewer zooms in (projScale increases), text labels smoothly reveal themselves.
      // - Selected, hovered, or galaxy root directors always remain distinctly labeled.
      const shouldShowName =
        node.isHovered ||
        node.isSelected ||
        (node.isRoot && node.projScale >= 0.22) ||
        (node.isSupervisor && node.projScale >= 0.42) ||
        node.projScale >= 0.62;

      if (shouldShowName) {
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

        // Show designation subtext when zoomed in closer or hovered
        const shouldShowDesig =
          node.isHovered ||
          node.isSelected ||
          (node.isRoot && node.projScale >= 0.38) ||
          node.projScale >= 0.82;

        if (shouldShowDesig) {
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
