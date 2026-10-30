import {normalize} from './model.js';
import {Engine} from './controller.js';
import {DatasetApi} from './api.js';
import {datasetFromPath, navigateToDataset, type DatasetName} from './router.js';
import {store} from './store.js';
import {$, el, text, announce} from './dom.js';
import {DirectoryView} from './directory-view.js';
import {ProfileView} from './profile-view.js';
import {renderLegend} from './legend-view.js';
import {showScreen} from './view-state.js';

const api = new DatasetApi();
let request = 0;
let loadingDataset: DatasetName | null = null;
let directoryOpen = window.innerWidth > 740;

function closeFlightMenu(): void {
  $('fly-menu').hidden = true;
  $('fly-menu-button').setAttribute('aria-expanded', 'false');
}
function renderFlightDestinations(): void {
  const list = $('flight-destinations'); list.replaceChildren();
  if (!store.graph) return;
  for (const index of store.graph.roots) {
    const node = store.graph.nodes[index], button = el('button', 'flight-destination');
    button.append(el('span', '', node.name), el('small', '', `${node.children.length} direct satellites`));
    button.addEventListener('click', () => {
      store.engine?.flyToSystem(index); closeFlightMenu();
      announce(`Flying to ${node.name}'s particle system.`);
    });
    list.append(button);
  }
}
function updateInsets(): void {
  const narrow = window.innerWidth <= 740;
  const right = directoryOpen && !narrow ? window.innerWidth - $('personnel').getBoundingClientRect().left + 20 : 24;
  store.engine?.setInsets({left: narrow ? 18 : 28, right, top: narrow ? 195 : 220, bottom: narrow ? 165 : 130});
}
function setDirectory(open: boolean, restoreFocus = false): void {
  directoryOpen = open; $('personnel').hidden = !open;
  $('toggle-directory').setAttribute('aria-expanded', String(open));
  updateInsets();
  if (!open && restoreFocus) $('toggle-directory').focus();
}
function playback(running: boolean): void {
  $('play-pause').setAttribute('aria-pressed', String(running));
  text('play-label', running ? 'Pause motion' : 'Resume motion');
  text('play-icon', running ? 'Ⅱ' : '▶');
  text('scene-state', running ? 'FREE FLIGHT · ACTIVE' : 'SIMULATION PAUSED');
}
function selectPerson(index: number, focus = false): void {
  if (!store.graph || !store.engine) return;
  setDirectory(true);
  store.selected = index; store.engine.select(index);
  if (focus) store.engine.focus(index);
  profile.render(index);
}
function clearSelection(): void {
  store.selected = -1; store.engine?.select(-1); showScreen('directory');
  $<HTMLInputElement>('search').focus({preventScroll: true});
}
const directory = new DirectoryView(selectPerson);
const profile = new ProfileView(() => store.graph, () => store.engine, selectPerson);

async function loadDataset(name: DatasetName): Promise<void> {
  if (loadingDataset === name || (store.engine && store.activeDataset === name)) return;
  loadingDataset = name;
  const current = ++request;
  api.cancel(); store.engine?.destroy(); store.engine = null;
  store.graph = null; store.selected = -1; store.activeDataset = null; directory.clear();
  closeFlightMenu(); $('flight-destinations').replaceChildren();
  $<HTMLButtonElement>('fly-menu-button').disabled = true;
  $('loading').hidden = false; $('error').hidden = true;
  for (const id of ['team', 'project']) $(`${id}-view`).setAttribute('aria-pressed', String(id === name));
  try {
    const data = await api.load(name);
    if (current !== request) return;
    const graph = normalize(data);
    store.graph = graph;
    store.activeDataset = name; loadingDataset = null;
    renderFlightDestinations();
    $<HTMLButtonElement>('fly-menu-button').disabled = graph.roots.length === 0;
    text('page-title', name === 'team' ? 'Team constellation' : 'Project constellation');
    text('people-count', String(graph.nodes.length));
    text('connection-count', String(graph.nodes.length - graph.roots.length));
    text('group-count', String(graph.roots.length));
    text('directory-badge', String(graph.nodes.length));
    text('scene-caption', `${graph.roots.length} ${graph.roots.length === 1 ? 'nucleus' : 'nuclei'} / spatial motion`);
    const engine = new Engine($<HTMLCanvasElement>('universe'), graph, {
      select: index => selectPerson(index), playback,
      zoom: scale => text('zoom-level', `${Math.round(scale * 100)}%`),
      stats: (visible, ms, cache, fps, interval) => {
        text('render-status', `${visible} of ${graph.nodes.length} people in view`);
        text('metrics-content', `Canvas 2D · ${fps.toFixed(1)} FPS observed · p95 frame interval ${interval.toFixed(1)} ms · p95 frame work ${ms.toFixed(2)} ms (last 120 draws) · sprite cache ${cache.toFixed(1)} MiB / 24 MiB. Frame work includes simulation, picking and CPU draw submission; excludes GPU completion. Frame pacing adapts to workload.`);
      }
    });
    store.engine = engine; updateInsets();
    engine.speed = Number($<HTMLInputElement>('speed').value);
    engine.orbits = $('toggle-orbits').getAttribute('aria-pressed') === 'true';
    showScreen('directory'); directory.setDataset(graph, engine); renderLegend(graph);
    $('loading').hidden = true;
    announce(`${name === 'team' ? 'Team' : 'Project'} view loaded with ${graph.nodes.length} people.`);
  } catch (error) {
    if (current !== request) return;
    loadingDataset = null; $('loading').hidden = true;
    store.engine?.destroy(); store.engine = null; store.graph = null; store.activeDataset = null;
    text('error-message', error instanceof Error ? error.message : 'The visualization could not load.');
    $('error').hidden = false; playback(false);
  }
}
function changeDataset(name: DatasetName): void {
  navigateToDataset(name); void loadDataset(name);
}

$('team-view').addEventListener('click', () => changeDataset('team'));
$('project-view').addEventListener('click', () => changeDataset('project'));
$('retry-load').addEventListener('click', () => void loadDataset(datasetFromPath()));
window.addEventListener('popstate', () => void loadDataset(datasetFromPath()));
$('fly-menu-button').addEventListener('click', () => {
  const menu = $('fly-menu'); menu.hidden = !menu.hidden;
  $('fly-menu-button').setAttribute('aria-expanded', String(!menu.hidden));
});
document.addEventListener('pointerdown', event => {
  if (!(event.target as Element).closest('.flight-control')) closeFlightMenu();
});
$('search').addEventListener('input', () => directory.queueSearch());
$('location-filter').addEventListener('change', () => directory.queueSearch());
$('directory-previous').addEventListener('click', () => directory.previous());
$('directory-next').addEventListener('click', () => directory.next());
$('directory-tab').addEventListener('click', clearSelection);
$('legend-tab').addEventListener('click', () => showScreen('legend'));
$('back-directory').addEventListener('click', clearSelection);
$('play-pause').addEventListener('click', () => {
  if (!store.engine) return;
  store.engine.setRunning(!store.engine.running);
  announce(store.engine.running ? 'Motion resumed.' : 'Motion paused.');
});
$('fit').addEventListener('click', () => store.engine?.fit());
$('zoom-in').addEventListener('click', () => store.engine?.zoom(1.25));
$('zoom-out').addEventListener('click', () => store.engine?.zoom(.8));
$('toggle-orbits').addEventListener('click', () => {
  const engine = store.engine;
  if (!engine) return;
  engine.orbits = !engine.orbits;
  $('toggle-orbits').setAttribute('aria-pressed', String(engine.orbits));
  engine.invalidate();
});
$('speed').addEventListener('input', () => {
  const speed = Number($<HTMLInputElement>('speed').value);
  if (store.engine) store.engine.speed = speed;
  text('speed-value', `${speed}×`);
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!$('fly-menu').hidden) { closeFlightMenu(); $('fly-menu-button').focus(); }
  else if (store.selected >= 0) clearSelection();
});
window.addEventListener('pagehide', () => {
  ++request; api.cancel(); directory.clear();
  store.engine?.destroy(); store.engine = null; store.graph = null;
  store.activeDataset = null; loadingDataset = null;
});
window.addEventListener('pageshow', event => { if (event.persisted) void loadDataset(datasetFromPath()); });
$('toggle-directory').addEventListener('click', () => setDirectory(!directoryOpen, true));
$('close-directory').addEventListener('click', () => setDirectory(false, true));
$('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    announce('Browser fullscreen is unavailable. The application still fills the browser viewport.');
    text('scene-state', 'FULLSCREEN UNAVAILABLE · VIEWPORT MODE');
  }
});
document.addEventListener('fullscreenchange', () => {
  const active = Boolean(document.fullscreenElement), button = $('fullscreen');
  button.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
  button.title = active ? 'Exit fullscreen' : 'Enter fullscreen';
  button.querySelector('.button-text')!.textContent = active ? ' Exit fullscreen' : ' Fullscreen';
});
window.addEventListener('resize', updateInsets);
setDirectory(directoryOpen);
const initialDataset = datasetFromPath();
navigateToDataset(initialDataset, true);
void loadDataset(initialDataset);
