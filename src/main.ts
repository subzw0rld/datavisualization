import { Camera } from './engine/Camera';
import { SpriteCache } from './engine/SpriteCache';
import { SpatialHashGrid } from './engine/SpatialHashGrid';
import { Simulation } from './engine/Simulation';
import { Renderer } from './engine/Renderer';
import { UIManager } from './ui/UIManager';
import { DataLoader } from './data/DataLoader';
import type { ParticleNode, SimulationFilters } from './types';

class App {
  private canvas: HTMLCanvasElement;
  private camera: Camera;
  private spriteCache: SpriteCache;
  private spatialGrid: SpatialHashGrid;
  private simulation: Simulation;
  private renderer: Renderer;
  private uiManager: UIManager;

  private currentDataset: 'project' | 'team' = 'project';
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  private currentFPS: number = 60;

  // Interaction tracking
  private isPointerDown: boolean = false;
  private isPanning: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private clickedCandidate: ParticleNode | null = null;

  constructor() {
    const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Cannot find particle canvas');
    this.canvas = canvas;

    this.camera = new Camera();
    this.spriteCache = new SpriteCache();
    this.spatialGrid = new SpatialHashGrid(120);
    this.simulation = new Simulation();
    this.renderer = new Renderer(this.canvas, this.spriteCache);

    this.uiManager = new UIManager({
      onDatasetChange: (mode) => this.switchDataset(mode),
      onFilterChange: (filters) => this.applyFilters(filters),
      onResetCamera: () => this.resetCamera(),
      onTogglePause: () => {
        this.simulation.paused = !this.simulation.paused;
        return this.simulation.paused;
      },
      onSpeedChange: (speed) => {
        this.simulation.speedMultiplier = speed;
      },
      onToggleOrbits: () => {
        this.renderer.showOrbits = !this.renderer.showOrbits;
        return this.renderer.showOrbits;
      },
      onToggleLinks: () => {
        this.renderer.showLinks = !this.renderer.showLinks;
        return this.renderer.showLinks;
      },
      onSelectNode: (empID) => {
        const node = this.simulation.nodeMap.get(empID);
        if (node) {
          this.simulation.selectNode(empID);
          this.camera.focusOn(node.x, node.y, 1.25);
          this.uiManager.showNodeDetails(node, this.simulation.nodeMap);
        }
      }
    });

    this.initEvents();
    this.loadCurrentData();
    this.startLoop();
  }

  private switchDataset(mode: 'project' | 'team'): void {
    if (this.currentDataset === mode) return;
    this.currentDataset = mode;
    this.loadCurrentData();
  }

  private loadCurrentData(): void {
    const bounds = { width: window.innerWidth, height: window.innerHeight };
    this.simulation.setBounds(bounds.width, bounds.height);

    const dataset = DataLoader.loadDataset(this.currentDataset, bounds, (empID) => {
      this.spriteCache.invalidate(empID);
    });

    this.simulation.setData(dataset);
    this.spatialGrid.update(this.simulation.nodes);
    this.resetCamera();
  }

  private resetCamera(): void {
    if (this.simulation.roots.length > 0) {
      let sumX = 0;
      let sumY = 0;
      for (const root of this.simulation.roots) {
        sumX += root.x;
        sumY += root.y;
      }
      const avgX = sumX / this.simulation.roots.length;
      const avgY = sumY / this.simulation.roots.length;

      const targetZoom = this.currentDataset === 'team' ? 0.75 : 1.0;
      this.camera.focusOn(avgX, avgY, targetZoom);
    } else {
      this.camera.reset();
    }
  }

  private applyFilters(filters: SimulationFilters): void {
    this.simulation.applyFilters(filters);
  }

  private initEvents(): void {
    // Window Resize
    window.addEventListener('resize', () => {
      this.camera.resize(window.innerWidth, window.innerHeight);
      this.renderer.handleResize();
      this.simulation.setBounds(window.innerWidth, window.innerHeight);
    });

    // Pointer Events on Canvas
    this.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      this.canvas.setPointerCapture(e.pointerId);
      this.isPointerDown = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;

      const world = this.camera.screenToWorld(e.clientX, e.clientY);
      const hitNode = this.spatialGrid.queryPoint(world.x, world.y);

      if (hitNode) {
        this.clickedCandidate = hitNode;
        this.simulation.startDrag(hitNode);
        this.isPanning = false;
      } else {
        this.clickedCandidate = null;
        this.isPanning = true;
      }
    });

    this.canvas.addEventListener('pointermove', (e: PointerEvent) => {
      const world = this.camera.screenToWorld(e.clientX, e.clientY);

      if (this.isPointerDown) {
        if (this.simulation.draggedNode) {
          this.simulation.updateDrag(world.x, world.y);
        } else if (this.isPanning) {
          this.camera.panBy(e.movementX, e.movementY);
        }
      } else {
        // Hover state testing
        const hit = this.spatialGrid.queryPoint(world.x, world.y);
        this.simulation.hoverNode(hit ? hit.empID : null);
        this.canvas.style.cursor = hit ? 'pointer' : 'grab';
      }
    });

    const onPointerUp = (e: PointerEvent) => {
      if (!this.isPointerDown) return;
      this.isPointerDown = false;
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture was already released
      }

      const dist = Math.hypot(e.clientX - this.dragStartX, e.clientY - this.dragStartY);

      // Distinguish short click vs drag
      if (dist < 6 && this.clickedCandidate) {
        const node = this.clickedCandidate;
        this.simulation.selectNode(node.empID);
        this.uiManager.showNodeDetails(node, this.simulation.nodeMap);
      }

      this.simulation.endDrag();
      this.clickedCandidate = null;
      this.isPanning = false;
    };

    this.canvas.addEventListener('pointerup', onPointerUp);
    this.canvas.addEventListener('pointercancel', onPointerUp);

    // Mouse Wheel Zoom
    this.canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      this.camera.zoomAt(e.clientX, e.clientY, factor);
    }, { passive: false });
  }

  private startLoop(): void {
    const loop = (currentTime: number) => {
      if (!this.lastTime) this.lastTime = currentTime;
      const dt = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      // Track FPS
      this.frameCount++;
      this.fpsTimer += dt;
      if (this.fpsTimer >= 0.25) {
        this.currentFPS = this.frameCount / this.fpsTimer;
        this.frameCount = 0;
        this.fpsTimer = 0;
        this.uiManager.updateHUD(this.currentFPS, this.simulation.nodes.length, this.camera.zoom);
      }

      // Update Camera & Simulation
      this.camera.update(dt);
      this.simulation.update(dt);
      this.spatialGrid.update(this.simulation.nodes);

      // Render Viewport
      this.renderer.render(this.simulation.nodes, this.simulation.nodeMap, this.camera);

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

// Bootstrap application on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
