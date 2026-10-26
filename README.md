# 🪐 Orbital Particle System — High Performance Data Visualization

A high-performance, interactive 3D orbital particle system designed to visualize organizational structures, reporting hierarchies, individual skill matrices, and locations. Built with TypeScript and HTML5 Canvas, this project leverages offscreen sprite caching, 3D perspective projection, orbital physics, spatial partitioning, and client-side deep-link routing to deliver fluid 60 FPS animations.

---

## 🌟 Key Features

- **3D Orbital Physics Simulation**:
  - Hierarchical planetary-style orbits where supervisees orbit supervisors around dynamically inclined 3D orbital planes.
  - Smooth physics simulation with velocity damping, orbital momentum, and brownian wander motions for root supervisors.
- **High-Performance Canvas Rendering**:
  - **Offscreen Sprite Caching**: Pre-renders complex multi-ring node graphics (core avatar, location ring, skill distribution, and proficiency level rings) into cached offscreen canvases.
  - **Spatial Hashing**: Screen-space spatial grid partitioning for fast ray-casting and hover hit-testing.
  - **Perspective Projection**: 3D world coordinates transformed to camera view space with dynamic depth scaling, focal length adjustments, and alpha falloff.
- **Enhanced Realism**: Increased spacing between galaxy clusters for clearer visualization and more accurate orbital dynamics.
- **Deep-Linked Client-Side Routing**:
  - Seamless navigation between views:
    - `/project` or `/#/project`: Focused sub-team visualization (6 nodes).
    - `/team` or `/#/team`: Full organizational cluster visualization (64 nodes).
    - Node deep-links (e.g. `/team?node=1001` or `/project?node=10`): Smooth camera fly-to animation and auto-selection of the specified node.
- **Rich Interactive UI & Glassmorphism Controls**:
  - **Camera Controls**: Orbit drag, 3D tilt, smooth panning, mouse-wheel zoom, and reset center.
  - **Search & Filtering**: Search nodes in real-time by employee name, job title, and skill. Filter across locations, proficiency levels, and skill categories.
  - **Node Inspector Drawer**: Comprehensive profile breakdown with avatar, supervisory relationships, direct reports, and Chart.js skill radar/distribution analytics.
  - **Playback Controls**: Play/pause simulation, simulation speed multiplier (0.5x, 1.0x, 2.0x), and toggleable orbit trajectory rings.
  - **Metrics HUD**: Live FPS counter and active particle count display.

---

## 🏗️ Architecture & Project Structure

```text
├── index.html               # Main application markup & glassmorphic UI controls
├── package.json             # Project dependencies and npm scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
├── src/
│   ├── main.ts              # Application bootstrap & animation loop
│   ├── types.ts             # TypeScript interfaces for nodes, catalogs, and engine state
│   ├── style.css            # Modern dark-theme styling, glassmorphism, and responsive layout
│   ├── router/
│   │   └── Router.ts        # SPA history & hash routing with query parameter support
│   ├── data/
│   │   ├── DataLoader.ts    # Ingestion, hierarchical tree parsing, and orbital calculations
│   │   ├── metadata.ts      # Skill catalogs, level tiers, location color definitions
│   │   ├── projectData.ts   # Project dataset (6 nodes)
│   │   └── teamData.ts      # Organizational dataset (64 nodes)
│   ├── engine/
│   │   ├── Camera.ts        # 3D view camera, target transitions, rotation & zoom
│   │   ├── Simulation.ts    # Physics loop, orbital mechanics, and wander forces
│   │   ├── Renderer.ts      # Canvas draw pipelines, connections, selection rings, & labels
│   │   ├── SpriteCache.ts   # Cached offscreen canvas generation for node glyphs
│   │   └── SpatialHashGrid.ts # Spatial acceleration structure for hit testing & interactions
│   └── ui/
│       └── UIManager.ts     # HUD bindings, filter menus, inspector drawer, & Chart.js integration
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18+ recommended)
- `npm` or any modern package manager (`pnpm`, `yarn`)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/subzw0rld/datavisualization.git
   cd ParticleSystemOptimisationApproach
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the Vite development server:
```bash
npm run dev
```
Open your browser and navigate to the local URL (usually `http://localhost:5173`).

### Building for Production

Compile TypeScript and build the optimized static bundle:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

---

## 🎮 Navigation & Keyboard Shortcuts

| Interaction / Key | Action |
| :--- | :--- |
| **Left Click + Drag** (on background) | Orbit / rotate camera in 3D space |
| **Right Click + Drag** / **Shift + Drag** | Pan camera across the simulation plane |
| **Scroll Wheel / Pinch** | Zoom in / Zoom out |
| **Left Click** (on node) | Focus camera on node and open details drawer |
| **Press `/`** | Quick focus on the search bar |
| **Escape** | Deselect node and close details drawer |
| **Center Button** | Recenter camera to origin |

---

## 🛠️ Tech Stack

- **Core**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Graphics & Rendering**: HTML5 Canvas 2D API with 3D projection algorithms
- **Charts & Metrics**: [Chart.js](https://www.chartjs.org/)
- **Styling**: Modern CSS3 (Glassmorphism, CSS Custom Properties, Flexbox & Grid)
