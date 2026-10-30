// ------------------------------------------------------------
// Renderer module – draws particles, orbits, links, and the cosmic background.
// ------------------------------------------------------------

/**
 * @file Renderer.ts – core rendering engine for drawing particles, orbits, links, and background.
 */
import type { ParticleNode } from '../types';
import { Camera } from './Camera';
import { SpriteCache } from './SpriteCache';

interface StarFieldStar {
  normX: number;       // Normalized [0, 1) in virtual celestial canvas
  normY: number;       // Normalized [0, 1) in virtual celestial canvas
  parallax: number;    // Parallax movement factor (depth cue)
  size: number;        // Base star radius
  color: string;       // Spectral star color
  glowColor?: string;  // Glow color for beacon stars
  twinkleSpeed: number;// Frequency of scintillation
  twinklePhase: number;// Phase offset
  baseAlpha: number;   // Base visibility opacity
  isBright?: boolean;  // Has diffraction spikes & corona
  spikeLength?: number;// Length of cross flare
}

interface NebulaLobe {
  offsetDist: number;   // Distance from nebula center
  offsetAngle: number;  // Initial angle around nebula center
  driftSpeed: number;   // Angular drift velocity (radians/sec)
  radius: number;       // Cloud lobe radius
  pulseSpeed: number;   // Respiration frequency
  pulsePhase: number;   // Respiration phase
  coreColor: string;    // Inner color with alpha
  midColor: string;     // Mid color with alpha
  outerColor: string;   // Outer edge color (alpha 0)
}

interface EmbeddedStar {
  offsetX: number;
  offsetY: number;
  size: number;
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface CosmicNebula {
  x: number;
  y: number;
  z: number;
  name: string;
  lobes: NebulaLobe[];
  embeddedStars: EmbeddedStar[];
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

  // Multi-layered Cosmic Starfields
  private stars: StarFieldStar[] = [];

  // Random Deep Space Cosmic Nebulae
  private nebulae: CosmicNebula[] = [];

  // Random Cosmic Comets
  private activeComets: Comet[] = [];
  private nextCometDelay: number = 2.0; // Seconds until next comet spawn
  private lastSimTime: number = 0;

  // Persistent sort buffer to prevent per-frame array allocations (CR-01)
  private sortBuffer: ParticleNode[] = [];

  constructor(canvas: HTMLCanvasElement, spriteCache: SpriteCache) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;
    this.spriteCache = spriteCache;
    this.initCosmicStars();
    this.initCosmicNebulae();
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

    // Layer 1: Deep Cosmic Star Dust (~750 micro-stars) - Ultra-subtle deep parallax
    const dustColors = ['#f8fafc', '#e2e8f0', '#bae6fd', '#ddd6fe', '#fef08a', '#fbcfe8', '#cbd5e1'];
    for (let i = 0; i < 750; i++) {
      this.stars.push({
        normX: Math.random(),
        normY: Math.random(),
        parallax: 0.003 + Math.random() * 0.003,
        size: 0.5 + Math.random() * 0.6,
        color: dustColors[Math.floor(Math.random() * dustColors.length)],
        twinkleSpeed: 0.8 + Math.random() * 2.2,
        twinklePhase: Math.random() * Math.PI * 2,
        baseAlpha: 0.25 + Math.random() * 0.45
      });
    }

    // Layer 2: Midground Celestial Navigation Stars (~350 stars) - Gentle subtle drift
    const midColors = ['#ffffff', '#ffffff', '#7dd3fc', '#a5b4fc', '#fde047', '#f472b6', '#38bdf8', '#c084fc'];
    for (let i = 0; i < 350; i++) {
      this.stars.push({
        normX: Math.random(),
        normY: Math.random(),
        parallax: 0.009 + Math.random() * 0.005,
        size: 1.1 + Math.random() * 0.9,
        color: midColors[Math.floor(Math.random() * midColors.length)],
        twinkleSpeed: 1.2 + Math.random() * 2.6,
        twinklePhase: Math.random() * Math.PI * 2,
        baseAlpha: 0.45 + Math.random() * 0.4
      });
    }

    // Layer 3: Foreground Sparkling Beacons (~45 bright stars) - Subtle foreground depth
    const brightConfigs = [
      { color: '#ffffff', glow: 'rgba(255, 255, 255, 0.5)' },
      { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.5)' },
      { color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.45)' },
      { color: '#c084fc', glow: 'rgba(192, 132, 252, 0.45)' },
      { color: '#34d399', glow: 'rgba(52, 211, 153, 0.45)' },
      { color: '#f472b6', glow: 'rgba(244, 114, 182, 0.45)' }
    ];
    for (let i = 0; i < 45; i++) {
      const cfg = brightConfigs[Math.floor(Math.random() * brightConfigs.length)];
      this.stars.push({
        normX: Math.random(),
        normY: Math.random(),
        parallax: 0.020 + Math.random() * 0.008,
        size: 2.0 + Math.random() * 1.4,
        color: cfg.color,
        glowColor: cfg.glow,
        twinkleSpeed: 1.5 + Math.random() * 2.8,
        twinklePhase: Math.random() * Math.PI * 2,
        baseAlpha: 0.75 + Math.random() * 0.25,
        isBright: true,
        spikeLength: 6 + Math.random() * 6
      });
    }
  }

  private initCosmicNebulae(): void {
    // Nebulae are placed in far, distinct celestial sectors (separated by 50,000+ units)
    // and deep in cosmic Z depth so they serve as rare, expansive landmarks rather than crowding together.
    this.nebulae = [
      // 1. Cygnus Azure Veil (Far North-West Deep Cosmos)
      {
        name: 'Cygnus Azure Veil',
        x: -32000,
        y: -24000,
        z: 22000,
        lobes: [
          {
            offsetDist: 0,
            offsetAngle: 0,
            driftSpeed: 0.010,
            radius: 5200,
            pulseSpeed: 0.35,
            pulsePhase: 0,
            coreColor: 'rgba(56, 189, 248, 0.11)',
            midColor: 'rgba(14, 165, 233, 0.05)',
            outerColor: 'rgba(3, 105, 161, 0)'
          },
          {
            offsetDist: 1500,
            offsetAngle: 0.8,
            driftSpeed: -0.012,
            radius: 4200,
            pulseSpeed: 0.42,
            pulsePhase: 1.2,
            coreColor: 'rgba(99, 102, 241, 0.09)',
            midColor: 'rgba(59, 130, 246, 0.04)',
            outerColor: 'rgba(30, 58, 138, 0)'
          },
          {
            offsetDist: 1350,
            offsetAngle: 2.7,
            driftSpeed: 0.014,
            radius: 4400,
            pulseSpeed: 0.28,
            pulsePhase: 2.4,
            coreColor: 'rgba(125, 211, 252, 0.09)',
            midColor: 'rgba(6, 182, 212, 0.04)',
            outerColor: 'rgba(8, 145, 178, 0)'
          },
          {
            offsetDist: 1700,
            offsetAngle: 4.5,
            driftSpeed: -0.009,
            radius: 3800,
            pulseSpeed: 0.46,
            pulsePhase: 3.6,
            coreColor: 'rgba(167, 139, 250, 0.08)',
            midColor: 'rgba(139, 92, 246, 0.035)',
            outerColor: 'rgba(76, 29, 149, 0)'
          }
        ],
        embeddedStars: this.generateEmbeddedStars(6, 1800)
      },

      // 2. Orion Amethyst Nursery (Far North-East Deep Cosmos)
      {
        name: 'Orion Amethyst Nursery',
        x: 34000,
        y: -22000,
        z: 25000,
        lobes: [
          {
            offsetDist: 0,
            offsetAngle: 0,
            driftSpeed: -0.011,
            radius: 5400,
            pulseSpeed: 0.32,
            pulsePhase: 0.5,
            coreColor: 'rgba(217, 70, 239, 0.10)',
            midColor: 'rgba(168, 85, 247, 0.05)',
            outerColor: 'rgba(109, 40, 217, 0)'
          },
          {
            offsetDist: 1650,
            offsetAngle: 1.2,
            driftSpeed: 0.013,
            radius: 4300,
            pulseSpeed: 0.40,
            pulsePhase: 1.8,
            coreColor: 'rgba(236, 72, 153, 0.08)',
            midColor: 'rgba(219, 39, 119, 0.04)',
            outerColor: 'rgba(131, 24, 67, 0)'
          },
          {
            offsetDist: 1400,
            offsetAngle: 3.4,
            driftSpeed: -0.010,
            radius: 4100,
            pulseSpeed: 0.36,
            pulsePhase: 3.0,
            coreColor: 'rgba(192, 132, 252, 0.09)',
            midColor: 'rgba(147, 51, 234, 0.04)',
            outerColor: 'rgba(88, 28, 135, 0)'
          },
          {
            offsetDist: 1800,
            offsetAngle: 5.1,
            driftSpeed: 0.009,
            radius: 3900,
            pulseSpeed: 0.44,
            pulsePhase: 4.2,
            coreColor: 'rgba(244, 114, 182, 0.07)',
            midColor: 'rgba(190, 24, 93, 0.035)',
            outerColor: 'rgba(76, 5, 25, 0)'
          }
        ],
        embeddedStars: this.generateEmbeddedStars(6, 1900)
      },

      // 3. Solar Phoenix Veil (Far South-West Deep Cosmos)
      {
        name: 'Solar Phoenix Veil',
        x: -33000,
        y: 28000,
        z: 21000,
        lobes: [
          {
            offsetDist: 0,
            offsetAngle: 0,
            driftSpeed: 0.012,
            radius: 5000,
            pulseSpeed: 0.38,
            pulsePhase: 0.8,
            coreColor: 'rgba(251, 191, 36, 0.10)',
            midColor: 'rgba(249, 115, 22, 0.045)',
            outerColor: 'rgba(180, 83, 9, 0)'
          },
          {
            offsetDist: 1450,
            offsetAngle: 1.6,
            driftSpeed: -0.014,
            radius: 4100,
            pulseSpeed: 0.44,
            pulsePhase: 2.1,
            coreColor: 'rgba(245, 158, 11, 0.08)',
            midColor: 'rgba(234, 88, 12, 0.04)',
            outerColor: 'rgba(124, 45, 18, 0)'
          },
          {
            offsetDist: 1550,
            offsetAngle: 3.8,
            driftSpeed: 0.011,
            radius: 3900,
            pulseSpeed: 0.34,
            pulsePhase: 3.4,
            coreColor: 'rgba(252, 211, 77, 0.07)',
            midColor: 'rgba(217, 119, 6, 0.035)',
            outerColor: 'rgba(146, 64, 14, 0)'
          }
        ],
        embeddedStars: this.generateEmbeddedStars(5, 1700)
      },

      // 4. Emerald Lagoon Mist (Far South-East Deep Cosmos)
      {
        name: 'Emerald Lagoon Mist',
        x: 36000,
        y: 26000,
        z: 24000,
        lobes: [
          {
            offsetDist: 0,
            offsetAngle: 0,
            driftSpeed: -0.010,
            radius: 5200,
            pulseSpeed: 0.30,
            pulsePhase: 1.0,
            coreColor: 'rgba(52, 211, 153, 0.10)',
            midColor: 'rgba(20, 184, 166, 0.045)',
            outerColor: 'rgba(15, 118, 110, 0)'
          },
          {
            offsetDist: 1500,
            offsetAngle: 1.4,
            driftSpeed: 0.013,
            radius: 4200,
            pulseSpeed: 0.42,
            pulsePhase: 2.5,
            coreColor: 'rgba(45, 212, 191, 0.08)',
            midColor: 'rgba(13, 148, 136, 0.04)',
            outerColor: 'rgba(17, 94, 89, 0)'
          },
          {
            offsetDist: 1380,
            offsetAngle: 3.6,
            driftSpeed: -0.012,
            radius: 3900,
            pulseSpeed: 0.36,
            pulsePhase: 3.9,
            coreColor: 'rgba(110, 231, 183, 0.07)',
            midColor: 'rgba(16, 185, 129, 0.035)',
            outerColor: 'rgba(6, 95, 70, 0)'
          }
        ],
        embeddedStars: this.generateEmbeddedStars(5, 1800)
      },

      // 5. Deep Cobalt Rift (Far Northern Outer Horizon)
      {
        name: 'Deep Cobalt Rift',
        x: 2000,
        y: -42000,
        z: 27000,
        lobes: [
          {
            offsetDist: 0,
            offsetAngle: 0,
            driftSpeed: 0.008,
            radius: 5600,
            pulseSpeed: 0.25,
            pulsePhase: 1.5,
            coreColor: 'rgba(99, 102, 241, 0.10)',
            midColor: 'rgba(67, 56, 202, 0.045)',
            outerColor: 'rgba(30, 27, 75, 0)'
          },
          {
            offsetDist: 1750,
            offsetAngle: 2.0,
            driftSpeed: -0.009,
            radius: 4600,
            pulseSpeed: 0.33,
            pulsePhase: 2.8,
            coreColor: 'rgba(129, 140, 248, 0.08)',
            midColor: 'rgba(79, 70, 229, 0.04)',
            outerColor: 'rgba(49, 46, 129, 0)'
          },
          {
            offsetDist: 1600,
            offsetAngle: 4.2,
            driftSpeed: 0.011,
            radius: 4200,
            pulseSpeed: 0.29,
            pulsePhase: 4.5,
            coreColor: 'rgba(165, 180, 252, 0.07)',
            midColor: 'rgba(99, 102, 241, 0.035)',
            outerColor: 'rgba(55, 48, 163, 0)'
          }
        ],
        embeddedStars: this.generateEmbeddedStars(6, 2000)
      }
    ];
  }

  private generateEmbeddedStars(count: number, maxRadius: number): EmbeddedStar[] {
    const stars: EmbeddedStar[] = [];
    const colors = ['#ffffff', '#bae6fd', '#fbcfe8', '#ddd6fe', '#fef08a'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * maxRadius;
      stars.push({
        offsetX: Math.cos(angle) * dist,
        offsetY: Math.sin(angle) * dist,
        size: 0.8 + Math.random() * 1.0,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkleSpeed: 1.2 + Math.random() * 2.5,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
    return stars;
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
    // Deep universe gradient with subtle camera parallax drift and breathing cosmic aura
    const rotGradX = camera.yaw * 600;
    const rotGradY = camera.pitch * 600;
    const gradCenterX = width / 2 - (camera.x + rotGradX) * 0.0015 + Math.sin(simTime * 0.15) * 12;
    const gradCenterY = height / 2 - (camera.y + rotGradY) * 0.0015 + Math.cos(simTime * 0.12) * 10;
    const maxDim = Math.max(width, height);
    const bgGrad = ctx.createRadialGradient(
      gradCenterX,
      gradCenterY,
      width * 0.06,
      gradCenterX,
      gradCenterY,
      maxDim * 0.95
    );
    bgGrad.addColorStop(0, '#090e1a');
    bgGrad.addColorStop(0.48, '#040711');
    bgGrad.addColorStop(1, '#020307');

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 1. Render Random Deep Space Cosmic Nebulae (Tasteful, breathing deep-space clouds)
    this.renderRandomNebulae(ctx, width, height, camera, simTime);

    // 2. Render Multi-Layered Cosmic Starfields (Deep dust, mid navigation, sparkling beacons)
    this.renderStarfields(ctx, width, height, camera, simTime);

    // 3. Update and spawn random comets at non-regular intervals
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

  private renderRandomNebulae(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camera: Camera,
    simTime: number
  ): void {
    ctx.save();
    // Use 'screen' blend mode for luminous cosmic clouds that gracefully merge
    ctx.globalCompositeOperation = 'screen';

    for (let n = 0; n < this.nebulae.length; n++) {
      const nebula = this.nebulae[n];
      const pCenter = camera.project3D(nebula.x, nebula.y, nebula.z);
      if (pCenter.scale <= 0.005) continue;

      // Render each cloud lobe with organic drift and respiration
      for (let l = 0; l < nebula.lobes.length; l++) {
        const lobe = nebula.lobes[l];
        const driftAngle = lobe.offsetAngle + simTime * lobe.driftSpeed;
        const lobeWorldX = nebula.x + Math.cos(driftAngle) * lobe.offsetDist;
        const lobeWorldY = nebula.y + Math.sin(driftAngle) * lobe.offsetDist;
        const pLobe = camera.project3D(lobeWorldX, lobeWorldY, nebula.z);

        const screenRadius = Math.max(35, Math.min(420, lobe.radius * pLobe.scale));

        if (
          pLobe.screenX < -screenRadius ||
          pLobe.screenX > width + screenRadius ||
          pLobe.screenY < -screenRadius ||
          pLobe.screenY > height + screenRadius
        ) {
          continue;
        }

        // Respiration pulse
        const respiration = 1.0 + 0.08 * Math.sin(simTime * lobe.pulseSpeed + lobe.pulsePhase);
        const finalRadius = screenRadius * respiration;

        const grad = ctx.createRadialGradient(
          pLobe.screenX,
          pLobe.screenY,
          finalRadius * 0.05,
          pLobe.screenX,
          pLobe.screenY,
          finalRadius
        );
        grad.addColorStop(0, lobe.coreColor);
        grad.addColorStop(0.45, lobe.midColor);
        grad.addColorStop(1, lobe.outerColor);

        ctx.beginPath();
        ctx.arc(pLobe.screenX, pLobe.screenY, finalRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Render young embedded stars inside the nebula gas
      for (let s = 0; s < nebula.embeddedStars.length; s++) {
        const star = nebula.embeddedStars[s];
        const starWorldX = nebula.x + star.offsetX;
        const starWorldY = nebula.y + star.offsetY;
        const pStar = camera.project3D(starWorldX, starWorldY, nebula.z);

        if (
          pStar.screenX < 0 ||
          pStar.screenX > width ||
          pStar.screenY < 0 ||
          pStar.screenY > height
        ) {
          continue;
        }

        const twinkle = 0.5 + 0.5 * Math.sin(simTime * star.twinkleSpeed + star.twinklePhase);
        const starRadius = Math.max(0.7, star.size * Math.min(1.5, pStar.scale * 14));

        ctx.beginPath();
        ctx.arc(pStar.screenX, pStar.screenY, starRadius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = 0.3 + 0.45 * twinkle;
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private renderStarfields(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camera: Camera,
    simTime: number
  ): void {
    const vw = Math.max(width * 2.4, 3000);
    const vh = Math.max(height * 2.4, 2200);
    const halfVW = (vw - width) / 2;
    const halfVH = (vh - height) / 2;
    const cx = width / 2;
    const cy = height / 2;

    const rotOffsetX = camera.yaw * 850;
    const rotOffsetY = camera.pitch * 850;
    const effCamX = camera.x + rotOffsetX;
    const effCamY = camera.y + rotOffsetY;

    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];

      const offsetX = effCamX * star.parallax;
      const offsetY = effCamY * star.parallax;

      // Infinite toroidal wrap
      const baseX = star.normX * vw;
      const baseY = star.normY * vh;
      const sx = ((baseX - offsetX) % vw + vw) % vw - halfVW;
      const sy = ((baseY - offsetY) % vh + vh) % vh - halfVH;

      // Subtle zoom perspective drift (subtle and gentle parallax)
      const zoomDrift = 1.0 + (camera.zoom - 0.07) * (star.parallax * 0.25);
      const finalSx = cx + (sx - cx) * zoomDrift;
      const finalSy = cy + (sy - cy) * zoomDrift;

      // Screen boundary culling
      if (finalSx < -25 || finalSx > width + 25 || finalSy < -25 || finalSy > height + 25) {
        continue;
      }

      // Organic multi-harmonic twinkling
      const t = simTime * star.twinkleSpeed + star.twinklePhase;
      const shimmer = 0.55 + 0.35 * Math.sin(t) + 0.10 * Math.cos(t * 1.73 + 1.2);
      const alpha = Math.min(1.0, Math.max(0.08, star.baseAlpha * shimmer));

      if (star.isBright && alpha > 0.35) {
        // Foreground sparkling beacon star: soft corona + 4-point diffraction spike
        ctx.save();

        // Corona halo
        const haloRadius = star.size * (2.8 + 0.8 * shimmer);
        ctx.beginPath();
        ctx.arc(finalSx, finalSy, haloRadius, 0, Math.PI * 2);
        ctx.fillStyle = star.glowColor || star.color;
        ctx.globalAlpha = alpha * 0.45;
        ctx.fill();

        // 4-point cross diffraction spike
        const spike = (star.spikeLength || 7) * (0.8 + 0.3 * shimmer);
        ctx.beginPath();
        ctx.moveTo(finalSx - spike, finalSy);
        ctx.lineTo(finalSx + spike, finalSy);
        ctx.moveTo(finalSx, finalSy - spike);
        ctx.lineTo(finalSx, finalSy + spike);
        ctx.strokeStyle = star.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha * 0.7;
        ctx.stroke();

        // Brilliant star core
        ctx.beginPath();
        ctx.arc(finalSx, finalSy, star.size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = alpha;
        ctx.fill();

        ctx.restore();
      } else {
        // Standard twinkling star dot
        ctx.beginPath();
        ctx.arc(finalSx, finalSy, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
      }
    }
  }

  private renderComets(ctx: CanvasRenderingContext2D, camera: Camera, dt: number): void {
    ctx.save();
    for (let i = this.activeComets.length - 1; i >= 0; i--) {
      const comet = this.activeComets[i];
      comet.progress += dt / comet.duration;

      if (comet.progress >= 1.0) {
        // Swap-and-pop: O(1) removal without re-indexing all subsequent elements (CR-07)
        const last = this.activeComets.pop()!;
        if (i < this.activeComets.length) {
          this.activeComets[i] = last;
        }
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
      if (root.projScale <= 0.008) continue;

      // Cap the maximum nebula radius so massive clusters don't overlap and flood the background
      const maxNebulaWorldRadius = Math.min(650, 220 + Math.sqrt(root.systemMass) * 8);
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
    // Reuse persistent sortBuffer to eliminate per-frame array allocations (CR-01)
    this.sortBuffer.length = nodes.length;
    for (let i = 0; i < nodes.length; i++) {
      this.sortBuffer[i] = nodes[i];
    }
    this.sortBuffer.sort((a, b) => b.projZ - a.projZ);

    // Pre-calculate count of highlighted particles per galaxy/cluster
    const clusterHighlightCounts = new Map<number, number>();
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].isLocationHighlighted) {
        const cId = nodes[i].clusterRootId;
        clusterHighlightCounts.set(cId, (clusterHighlightCounts.get(cId) || 0) + 1);
      }
    }

    for (let i = 0; i < this.sortBuffer.length; i++) {
      const node = this.sortBuffer[i];
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
        alpha *= 0.18;
      } else if (node.isLocationHighlighted) {
        alpha = Math.max(0.9, node.projAlpha);
      }
      ctx.globalAlpha = Math.min(1.0, Math.max(0.12, alpha));

      // Dynamic heartbeat pulse, location highlight respiration, or hover scale
      let dynamicScale = 1.0;
      if (node.isSelected && node.pulseTimer < 1.0) {
        const wave = Math.sin(node.pulseTimer * Math.PI * 3);
        dynamicScale = 1.0 + wave * 0.16;
      } else if (node.isHovered) {
        dynamicScale = 1.1;
      } else if (node.isLocationHighlighted) {
        // Subtle rhythmic cosmic respiration for highlighted location particles
        const pulse = Math.sin(Date.now() * 0.0035 + node.empID * 0.35) * 0.08;
        dynamicScale = 1.08 + pulse;
      }

      if (dynamicScale !== 1.0) {
        ctx.scale(dynamicScale, dynamicScale);
      }

      // Energy halo for hovered, selected, or location-highlighted particles
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
      } else if (node.isLocationHighlighted) {
        // Highlighting particles from selected locations
        const locColor = node.locationColor || '#38bdf8';
        const haloRadius = (node.totalHitRadius + 5) * node.projScale;

        // Radiant outer glowing aura in location color
        ctx.beginPath();
        ctx.arc(0, 0, haloRadius + 2.5 * node.projScale, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(2, 3.2 * node.projScale);
        ctx.strokeStyle = locColor;
        ctx.shadowColor = locColor;
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner crisp ring
        ctx.beginPath();
        ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(1.2, 1.8 * node.projScale);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.stroke();
      }

      // Fast single-operation blit of pre-rendered glyph scaled to distance!
      ctx.drawImage(sprite, -halfSize, -halfSize, renderedSize, renderedSize);

      // Render employee text labels with progressive distance Level-Of-Detail (LOD):
      // - Distant particles appear as celestial bodies without cluttering the screen with thousands of text labels.
      // - As the viewer zooms in (projScale increases), text labels smoothly reveal themselves.
      // - Selected, hovered, or galaxy root directors always remain distinctly labeled.
      const clusterMatches = node.isRoot ? (clusterHighlightCounts.get(node.empID) || 0) : 0;
      const shouldShowName =
        node.isHovered ||
        node.isSelected ||
        node.isLocationHighlighted ||
        (node.isRoot && (node.projScale >= 0.15 || clusterMatches > 0)) ||
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

        ctx.fillStyle = node.isSelected
          ? '#38bdf8'
          : node.isHovered
            ? '#ffffff'
            : node.isLocationHighlighted
              ? '#38bdf8'
              : '#94a3b8';
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

        // Show cluster summary badge on galaxy directors when particles in this cluster are highlighted
        if (node.isRoot && clusterMatches > 0) {
          const badgeFontSize = Math.max(8, Math.min(11, Math.round(9 * Math.sqrt(node.projScale))));
          ctx.font = `600 ${badgeFontSize}px Outfit, Inter, sans-serif`;
          const badgeText = `📍 ${clusterMatches.toLocaleString()} in ${node.locationName || 'Location'}`;
          const textMetrics = ctx.measureText(badgeText);
          const badgeW = textMetrics.width + 12;
          const badgeH = badgeFontSize + 8;
          const badgeY = labelY + fontSize + (shouldShowDesig ? 18 : 6);

          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-badgeW / 2, badgeY, badgeW, badgeH, 4);
          } else {
            ctx.rect(-badgeW / 2, badgeY, badgeW, badgeH);
          }
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, 0, badgeY + badgeH / 2);
        }
      }

      ctx.restore();
    }
  }
}
