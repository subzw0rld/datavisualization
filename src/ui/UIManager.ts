/**
 * @file UIManager – wires UI controls (buttons, sliders, dialogs) to the simulation engine.
 * Handles dataset toggles, filter updates, camera controls, and chart rendering.
 */
import Chart from 'chart.js/auto';
import type { ParticleNode, SimulationFilters, MetadataResponse } from '../types';

export interface UIEventListeners {
  onDatasetChange: (mode: 'project' | 'team') => void;
  onFilterChange: (filters: SimulationFilters) => void;
  onResetCamera: () => void;
  onTogglePause: () => boolean;
  onSpeedChange: (speed: number) => void;
  onToggleOrbits: () => boolean;
  onToggleLinks: () => boolean;
  onSelectNode: (empID: number) => void;
  onFocusNode3D: (empID: number) => void;
  onZoomChange: (percent: number) => void;
  onZoomStep: (deltaPercent: number) => void;
  onCloseNodeDetails?: () => void;
  onCycleSearchMatch?: (direction: 1 | -1) => void;
}

export class UIManager {
  private listeners: UIEventListeners;
  private currentFilters: SimulationFilters = {
    skillId: null,
    levelId: null,
    locationId: null,
    searchQuery: ''
  };

  private dialog: HTMLDialogElement | null = null;
  private topBilledChart: Chart | null = null;
  private statusChart: Chart | null = null;

  // Cached DOM elements to eliminate repeated getElementById queries (CR-12)
  private hudFps: HTMLElement | null = null;
  private hudNodes: HTMLElement | null = null;
  private hudZoom: HTMLElement | null = null;
  private zoomSliderVal: HTMLElement | null = null;
  private zoomSlider: HTMLInputElement | null = null;

  private loader: HTMLElement | null = null;
  private loaderTitle: HTMLElement | null = null;
  private loaderSubtitle: HTMLElement | null = null;

  private modalName: HTMLElement | null = null;
  private modalDesig: HTMLElement | null = null;
  private modalLevel: HTMLElement | null = null;
  private modalLocation: HTMLElement | null = null;
  private modalEmpId: HTMLElement | null = null;
  private modalAvatar: HTMLImageElement | null = null;
  private modalFocusBtn: HTMLElement | null = null;
  private modalGalaxyName: HTMLElement | null = null;
  private modalSystemMass: HTMLElement | null = null;
  private modalCoords: HTMLElement | null = null;
  private modalDistance: HTMLElement | null = null;
  private modalSkillsCount: HTMLElement | null = null;
  private modalClientsList: HTMLElement | null = null;
  private modalSupervisorCard: HTMLElement | null = null;
  private modalSupervisorName: HTMLElement | null = null;
  private modalSuperviseeSection: HTMLElement | null = null;
  private modalSuperviseeList: HTMLElement | null = null;
  private modalSkillsList: HTMLElement | null = null;

  constructor(listeners: UIEventListeners) {
    this.listeners = listeners;
    this.initDOM();
    this.initDialog();
    this.initCharts();
  }

  private initDOM(): void {
    // Cache HUD & Loader DOM references (CR-12)
    this.hudFps = document.getElementById('hud-fps');
    this.hudNodes = document.getElementById('hud-nodes');
    this.hudZoom = document.getElementById('hud-zoom');
    this.zoomSliderVal = document.getElementById('zoom-slider-val');
    this.zoomSlider = document.getElementById('zoom-slider') as HTMLInputElement | null;

    this.loader = document.getElementById('cosmic-loader');
    this.loaderTitle = document.getElementById('loader-title');
    this.loaderSubtitle = document.getElementById('loader-subtitle');

    // Mode toggles
    const projectBtn = document.getElementById('btn-view-project');
    const teamBtn = document.getElementById('btn-view-team');

    projectBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.listeners.onDatasetChange('project');
    });

    teamBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.listeners.onDatasetChange('team');
    });

    // Search input & clear button & match navigation
    const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
    const clearBtn = document.getElementById('search-clear-btn');
    const prevBtn = document.getElementById('search-prev-btn');
    const nextBtn = document.getElementById('search-next-btn');

    searchInput?.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      this.currentFilters.searchQuery = query;

      if (clearBtn) {
        clearBtn.style.display = query.length > 0 ? 'inline-flex' : 'none';
      }

      this.listeners.onFilterChange(this.currentFilters);
    });

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const direction = e.shiftKey ? -1 : 1;
        this.listeners.onCycleSearchMatch?.(direction);
      }
    });

    prevBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.listeners.onCycleSearchMatch?.(-1);
    });

    nextBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.listeners.onCycleSearchMatch?.(1);
    });

    clearBtn?.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      this.currentFilters.searchQuery = '';
      if (clearBtn) clearBtn.style.display = 'none';
      this.listeners.onFilterChange(this.currentFilters);
    });

    // Camera reset
    document.getElementById('btn-recenter')?.addEventListener('click', () => {
      this.listeners.onResetCamera();
    });

    // Play/Pause
    const pauseBtn = document.getElementById('btn-pause');
    pauseBtn?.addEventListener('click', () => {
      const isPaused = this.listeners.onTogglePause();
      if (pauseBtn) {
        pauseBtn.innerHTML = isPaused ? '▶ Resume' : '⏸ Pause';
        pauseBtn.classList.toggle('active', isPaused);
      }
    });

    // Speed buttons
    const speedSelect = document.getElementById('speed-select') as HTMLSelectElement | null;
    speedSelect?.addEventListener('change', () => {
      this.listeners.onSpeedChange(parseFloat(speedSelect.value));
    });

    // Toggle Orbits
    const orbitsBtn = document.getElementById('btn-toggle-orbits');
    orbitsBtn?.addEventListener('click', () => {
      const active = this.listeners.onToggleOrbits();
      orbitsBtn.classList.toggle('active', active);
    });

    // Toggle Links
    const linksBtn = document.getElementById('btn-toggle-links');
    linksBtn?.addEventListener('click', () => {
      const active = this.listeners.onToggleLinks();
      linksBtn.classList.toggle('active', active);
    });

    // Interactive 3D Zoom Slider & Step Buttons
    const zoomSlider = document.getElementById('zoom-slider') as HTMLInputElement | null;
    const zoomSliderVal = document.getElementById('zoom-slider-val');
    const zoomOutBtn = document.getElementById('btn-zoom-out');
    const zoomInBtn = document.getElementById('btn-zoom-in');

    zoomSlider?.addEventListener('input', (e) => {
      const val = Number((e.target as HTMLInputElement).value);
      if (zoomSliderVal) zoomSliderVal.textContent = `${Math.round(val)}%`;
      this.listeners.onZoomChange(val);
    });

    zoomOutBtn?.addEventListener('click', () => {
      this.listeners.onZoomStep(-15);
    });

    zoomInBtn?.addEventListener('click', () => {
      this.listeners.onZoomStep(+15);
    });

    // Legend panel collapse toggle
    const legendPanel = document.getElementById('legend-panel');
    const legendToggle = document.getElementById('legend-toggle');
    legendToggle?.addEventListener('click', () => {
      legendPanel?.classList.toggle('open');
      legendToggle.classList.toggle('open');
    });

    // Keyboard shortcut '/' to search
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput?.focus();
      }
    });

    // Reset filters button
    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      this.currentFilters = {
        skillId: null,
        levelId: null,
        locationId: null,
        searchQuery: ''
      };
      const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
      if (searchInput) searchInput.value = '';

      const clearBtn = document.getElementById('search-clear-btn');
      if (clearBtn) clearBtn.style.display = 'none';

      document.querySelectorAll('.legend-chip').forEach((c) => c.classList.remove('active'));
      this.listeners.onFilterChange(this.currentFilters);
    });
  }

  private populateFilterGroup(
    container: HTMLElement | null,
    items: Record<string, { label: string; color: string }>,
    filterKey: 'skillId' | 'levelId' | 'locationId'
  ): void {
    if (!container || !items) return;
    container.innerHTML = '';
    for (const [key, item] of Object.entries(items)) {
      const id = Number(key);
      const chip = document.createElement('button');
      chip.className = 'legend-chip';
      chip.dataset[filterKey] = id.toString();
      chip.innerHTML = `<span class="legend-color-dot" style="background-color: ${item.color}"></span><span>${item.label}</span>`;
      chip.addEventListener('click', () => {
        if (this.currentFilters[filterKey] === id) {
          this.currentFilters[filterKey] = null;
          chip.classList.remove('active');
        } else {
          container.querySelectorAll('.legend-chip').forEach((c) => c.classList.remove('active'));
          this.currentFilters[filterKey] = id;
          chip.classList.add('active');
        }
        this.listeners.onFilterChange(this.currentFilters);
      });
      container.appendChild(chip);
    }
  }

  public populateLegend(metadata: MetadataResponse): void {
    const skillList = document.getElementById('legend-skill-list');
    const levelList = document.getElementById('legend-level-list');
    const locationList = document.getElementById('legend-location-list');

    if (metadata.skills) {
      const skillItems: Record<string, { label: string; color: string }> = {};
      for (const [key, item] of Object.entries(metadata.skills)) {
        skillItems[key] = { label: item.skill, color: item.color };
      }
      this.populateFilterGroup(skillList, skillItems, 'skillId');
    }

    if (metadata.levels) {
      const levelItems: Record<string, { label: string; color: string }> = {};
      for (const [key, item] of Object.entries(metadata.levels)) {
        levelItems[key] = { label: item.level, color: item.color };
      }
      this.populateFilterGroup(levelList, levelItems, 'levelId');
    }

    if (metadata.locations) {
      const locationItems: Record<string, { label: string; color: string }> = {};
      for (const [key, item] of Object.entries(metadata.locations)) {
        locationItems[key] = { label: item.location, color: item.color };
      }
      this.populateFilterGroup(locationList, locationItems, 'locationId');
    }
  }

  private initDialog(): void {
    this.dialog = document.getElementById('particle-dialog') as HTMLDialogElement | null;
    if (!this.dialog) return;

    // Cache dialog element references (CR-12)
    this.modalName = document.getElementById('modal-name');
    this.modalDesig = document.getElementById('modal-desig');
    this.modalLevel = document.getElementById('modal-level');
    this.modalLocation = document.getElementById('modal-location');
    this.modalEmpId = document.getElementById('modal-empid');
    this.modalAvatar = document.getElementById('modal-avatar') as HTMLImageElement | null;
    this.modalFocusBtn = document.getElementById('btn-modal-focus');
    this.modalGalaxyName = document.getElementById('modal-galaxy-name');
    this.modalSystemMass = document.getElementById('modal-system-mass');
    this.modalCoords = document.getElementById('modal-coords');
    this.modalDistance = document.getElementById('modal-distance');
    this.modalSkillsCount = document.getElementById('modal-skills-count');
    this.modalClientsList = document.getElementById('modal-clients-list');
    this.modalSupervisorCard = document.getElementById('modal-supervisor-card');
    this.modalSupervisorName = document.getElementById('modal-supervisor-name');
    this.modalSuperviseeSection = document.getElementById('modal-supervisees-section');
    this.modalSuperviseeList = document.getElementById('modal-supervisees-list');
    this.modalSkillsList = document.getElementById('modal-skills-list');

    // Close button
    document.getElementById('dialog-close-btn')?.addEventListener('click', () => {
      this.dialog?.close();
    });

    // Listen for dialog close to notify router
    this.dialog.addEventListener('close', () => {
      this.listeners.onCloseNodeDetails?.();
    });

    // Modern Web Guidance backdrop click dismissal (CR-22)
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      this.dialog.addEventListener('click', (event: MouseEvent) => {
        if (event.target === this.dialog) {
          this.dialog?.close();
        }
      });
    }
  }

  public getCurrentFilters(): SimulationFilters {
    return { ...this.currentFilters };
  }

  public updateFilterStatus(matchCount: number, searchQuery: string, currentIndex: number = 0): void {
    const searchBox = document.querySelector('.search-box');
    const feedbackEl = document.getElementById('search-feedback');
    const feedbackText = document.getElementById('search-feedback-text');
    const navControls = document.getElementById('search-nav-controls');
    const matchBadge = document.getElementById('search-match-badge');

    const cleanQuery = searchQuery.trim();

    if (cleanQuery.length > 0 && matchCount === 0) {
      searchBox?.classList.add('not-found');
      if (feedbackEl) feedbackEl.style.display = 'flex';
      if (feedbackText) {
        feedbackText.textContent = `No employee found matching "${cleanQuery}"`;
      }
      if (navControls) navControls.style.display = 'none';
    } else {
      searchBox?.classList.remove('not-found');
      if (feedbackEl) feedbackEl.style.display = 'none';

      if (cleanQuery.length > 0 && matchCount > 0) {
        if (navControls) navControls.style.display = 'inline-flex';
        if (matchBadge) {
          matchBadge.textContent = matchCount === 1
            ? '1 match'
            : `${currentIndex + 1} of ${matchCount}`;
        }
      } else {
        if (navControls) navControls.style.display = 'none';
      }
    }
  }

  public setActiveDataset(mode: 'project' | 'team'): void {
    const projectBtn = document.getElementById('btn-view-project');
    const teamBtn = document.getElementById('btn-view-team');
    if (mode === 'project') {
      projectBtn?.classList.add('active');
      projectBtn?.setAttribute('aria-selected', 'true');
      teamBtn?.classList.remove('active');
      teamBtn?.setAttribute('aria-selected', 'false');
    } else {
      teamBtn?.classList.add('active');
      teamBtn?.setAttribute('aria-selected', 'true');
      projectBtn?.classList.remove('active');
      projectBtn?.setAttribute('aria-selected', 'false');
    }
  }

  public closeDetails(): void {
    if (this.dialog && this.dialog.open) {
      this.dialog.close();
    }
  }

  private initCharts(): void {
    const topBilledCanvas = document.getElementById('chart-top-billed') as HTMLCanvasElement | null;
    const statusCanvas = document.getElementById('chart-status') as HTMLCanvasElement | null;

    if (topBilledCanvas) {
      this.topBilledChart = new Chart(topBilledCanvas, {
        type: 'bar',
        data: {
          labels: ['Release 4.1', 'Release 4.2', 'HFS', 'NACM', 'TOC'],
          datasets: [
            {
              label: 'Revenue ($M)',
              data: [1.2, 0.8, 3.4, 0.45, 2.3],
              backgroundColor: 'rgba(56, 189, 248, 0.8)',
              borderColor: '#38bdf8',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8', font: { size: 10 } }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8', font: { size: 10 } }
            }
          }
        }
      });
    }

    if (statusCanvas) {
      this.statusChart = new Chart(statusCanvas, {
        type: 'radar',
        data: {
          labels: ['Delivery', 'Quality', 'Milestones', 'Budget', 'Innovation'],
          datasets: [
            {
              label: 'Target',
              data: [90, 85, 80, 95, 75],
              borderColor: '#38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.25)',
              borderWidth: 2
            },
            {
              label: 'Current',
              data: [85, 78, 88, 82, 70],
              borderColor: '#ec4899',
              backgroundColor: 'rgba(236, 72, 153, 0.2)',
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#94a3b8', font: { size: 10 } }
            }
          },
          scales: {
            r: {
              angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
              pointLabels: { color: '#cbd5e1', font: { size: 10 } },
              ticks: { display: false }
            }
          }
        }
      });
    }
  }

  public showNodeDetails(node: ParticleNode, nodeMap: Map<number, ParticleNode>): void {
    if (!this.dialog) return;

    // Populate details using cached DOM references (CR-12)
    if (this.modalName) this.modalName.textContent = node.name;
    if (this.modalDesig) this.modalDesig.textContent = node.desig;
    if (this.modalLevel) this.modalLevel.textContent = `Level ${node.level}`;
    if (this.modalEmpId) this.modalEmpId.textContent = `ID: ${node.empID}`;
    if (this.modalLocation) {
      this.modalLocation.textContent = node.locationName;
      this.modalLocation.style.borderColor = node.locationColor;
    }

    // Populate Cosmic & Astrophysics Insights
    if (this.modalGalaxyName) this.modalGalaxyName.textContent = node.clusterName || 'Cosmic System';
    if (this.modalSystemMass) {
      this.modalSystemMass.textContent = `${node.systemMass.toFixed(1)} M☉ (${node.isRoot ? 'Galaxy Nucleus' : `Orbit Tier ${node.depth}`})`;
    }
    if (this.modalCoords) {
      this.modalCoords.textContent = `X: ${Math.round(node.x)}, Y: ${Math.round(node.y)}, Z: ${Math.round(node.z)}`;
    }
    if (this.modalDistance) {
      this.modalDistance.textContent = `${Math.round(node.projZ)} units (${Math.round(node.projScale * 100)}% view size)`;
    }
    if (this.modalSkillsCount) {
      this.modalSkillsCount.textContent = `${node.skills.length} skills`;
    }

    // Populate Clients / Accounts
    if (this.modalClientsList) {
      const clientItems = node.clients && node.clients.length > 0
        ? node.clients
        : ['Core Engineering', 'Enterprise Systems'];
      this.modalClientsList.innerHTML = clientItems
        .map((c) => `<span class="client-badge">${c}</span>`)
        .join('');
    }

    // 3D Fly-to navigation button
    if (this.modalFocusBtn) {
      this.modalFocusBtn.onclick = () => {
        this.dialog?.close();
        this.listeners.onFocusNode3D(node.empID);
      };
    }

    if (this.modalAvatar) {
      this.modalAvatar.src = node.avatarUrl || '/assets/images/emp-images/avatar.png';
      this.modalAvatar.onerror = () => {
        if (this.modalAvatar) this.modalAvatar.src = '/assets/images/emp-images/avatar.png';
      };
    }

    // Supervisor details
    if (node.supervisorId && nodeMap.has(node.supervisorId)) {
      const supervisor = nodeMap.get(node.supervisorId)!;
      if (this.modalSupervisorCard && this.modalSupervisorName) {
        this.modalSupervisorCard.style.display = 'flex';
        this.modalSupervisorName.textContent = supervisor.name;
        this.modalSupervisorCard.onclick = () => {
          this.dialog?.close();
          this.listeners.onSelectNode(supervisor.empID);
        };
      }
    } else if (this.modalSupervisorCard) {
      this.modalSupervisorCard.style.display = 'none';
    }

    // Supervisees list
    if (this.modalSuperviseeSection && this.modalSuperviseeList) {
      if (node.children.length > 0) {
        this.modalSuperviseeSection.style.display = 'block';
        this.modalSuperviseeList.innerHTML = '';
        for (const childId of node.children) {
          const child = nodeMap.get(childId);
          if (!child) continue;
          const chip = document.createElement('button');
          chip.className = 'supervisee-chip';
          chip.innerHTML = `<span>${child.name}</span><small>${child.level}</small>`;
          chip.onclick = () => {
            this.dialog?.close();
            this.listeners.onSelectNode(child.empID);
          };
          this.modalSuperviseeList.appendChild(chip);
        }
      } else {
        this.modalSuperviseeSection.style.display = 'none';
      }
    }

    // Skills breakdown
    if (this.modalSkillsList) {
      this.modalSkillsList.innerHTML = '';
      for (const s of node.skills) {
        const item = document.createElement('div');
        item.className = 'skill-tag';
        item.innerHTML = `
          <span class="skill-name" style="border-left: 3px solid ${s.color}">${s.name}</span>
          <span class="skill-level" style="background-color: ${s.levelColor}">${s.levelName}</span>
        `;
        this.modalSkillsList.appendChild(item);
      }
    }

    // Update charts with slight dynamic variations based on employee ID
    if (this.topBilledChart) {
      const seed = (node.empID % 7) + 1;
      this.topBilledChart.data.datasets[0].data = [
        0.5 + seed * 0.4,
        0.8 + seed * 0.2,
        1.5 + seed * 0.5,
        0.3 + seed * 0.1,
        1.2 + seed * 0.3
      ];
      this.topBilledChart.update();
    }

    if (this.statusChart) {
      const seed = (node.empID % 10) * 2;
      this.statusChart.data.datasets[1].data = [
        Math.min(100, 75 + seed),
        Math.min(100, 80 + seed),
        Math.min(100, 70 + seed),
        Math.min(100, 85 + seed),
        Math.min(100, 68 + seed)
      ];
      this.statusChart.update();
    }

    // Open dialog via modern top-layer showModal
    if (!this.dialog.open) {
      this.dialog.showModal();
    }
  }

  public updateHUD(fps: number, nodeCount: number, zoom: number): void {
    const zoomPercent = Math.round(zoom * 100);

    if (this.hudFps) this.hudFps.textContent = `${Math.round(fps)} FPS`;
    if (this.hudNodes) this.hudNodes.textContent = `${nodeCount} Nodes`;
    if (this.hudZoom) this.hudZoom.textContent = `${zoomPercent}%`;
    if (this.zoomSliderVal) this.zoomSliderVal.textContent = `${zoomPercent}%`;

    // Sync slider position if user is not currently dragging it
    if (this.zoomSlider && document.activeElement !== this.zoomSlider) {
      this.zoomSlider.value = Math.max(5, Math.min(280, zoomPercent)).toString();
    }
  }

  public showLoader(title: string = 'Synthesizing Galaxy', subtitle: string = 'Connecting to backend & computing orbital fields...'): void {
    if (this.loaderTitle) this.loaderTitle.textContent = title;
    if (this.loaderSubtitle) this.loaderSubtitle.textContent = subtitle;
    if (this.loader) this.loader.classList.add('active');
  }

  public hideLoader(): void {
    if (this.loader) {
      this.loader.classList.remove('active');
    }
  }
}

