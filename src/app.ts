import {normalize,type Graph,type Lookup} from './model.js';
import {Engine} from './controller.js';
import {DirectoryIndex} from './directory.js';
const $=<T extends HTMLElement>(id:string):T=>{const el=document.getElementById(id);if(!el)throw new Error(`Missing element: ${id}`);return el as T;};
const text=(id:string,value:string)=>{$(id).textContent=value;};
const el=<K extends keyof HTMLElementTagNameMap>(tag:K,className='',content=''):HTMLElementTagNameMap[K]=>{
  const node=document.createElement(tag);node.className=className;node.textContent=content;return node;
};
let graph:Graph|null=null,engine:Engine|null=null,request=0,selected=-1;
let directoryIndex:DirectoryIndex|null=null,directoryPage=0,directoryMatches:number[]=[];
let activeDataset:string|null=null,loadingDataset:string|null=null,searchFrame:number|null=null;
let directoryOpen=window.innerWidth>740;
function closeFlightMenu():void {
  $('fly-menu').hidden=true;$('fly-menu-button').setAttribute('aria-expanded','false');
}
function renderFlightDestinations():void {
  const list=$('flight-destinations');list.replaceChildren();
  if(!graph)return;
  for(const index of graph.roots) {
    const node=graph.nodes[index],button=el('button','flight-destination');
    button.append(el('span','',node.name),el('small','',`${node.children.length} direct satellites`));
    button.addEventListener('click',()=>{engine?.flyToSystem(index);closeFlightMenu();announce(`Flying to ${node.name}'s particle system.`);});
    list.append(button);
  }
}
const routes={team:'/team-view',project:'/project-view'} as const;
function datasetFromPath(): 'team'|'project' {
  return window.location.pathname===routes.project?'project':'team';
}
function navigateToDataset(name:'team'|'project',replace=false):void {
  const path=routes[name];
  if(window.location.pathname!==path) {
    window.history[replace?'replaceState':'pushState']({},'',path);
  }
}
function updateInsets():void {
  const narrow=window.innerWidth<=740;
  const right=directoryOpen&&!narrow?window.innerWidth-$('personnel').getBoundingClientRect().left+20:24;
  engine?.setInsets({left:narrow?18:28,right,top:narrow?195:220,bottom:narrow?165:130});
}
function setDirectory(open:boolean,restoreFocus=false):void {
  directoryOpen=open;$('personnel').hidden=!open;
  $('toggle-directory').setAttribute('aria-expanded',String(open));
  updateInsets();
  if(!open&&restoreFocus)$('toggle-directory').focus();
}
let screen:'directory'|'profile'|'legend'='directory';
function showScreen(next:typeof screen):void {
  screen=next;
  $('directory-panel').hidden=next!=='directory';$('profile-panel').hidden=next!=='profile';$('legend-panel').hidden=next!=='legend';
  $('directory-tab').setAttribute('aria-pressed',String(next==='directory'));
  $('legend-tab').setAttribute('aria-pressed',String(next==='legend'));
}
function announce(message:string):void {text('announcement',message);}
function playback(running:boolean):void {
  $('play-pause').setAttribute('aria-pressed',String(running));text('play-label',running?'Pause motion':'Resume motion');text('play-icon',running?'Ⅱ':'▶');
  text('scene-state',running?'FREE FLIGHT · ACTIVE':'SIMULATION PAUSED');
}
function renderDirectory():void {
  if(!graph||!engine)return;
  const query=$<HTMLInputElement>('search').value.toLocaleLowerCase().trim(), location=$<HTMLSelectElement>('location-filter').value;
  directoryMatches=directoryIndex!.match(query,location);
  const matching=directoryMatches.map(index=>({node:graph!.nodes[index],index}));
  directoryPage=Math.min(directoryPage,Math.max(0,Math.ceil(matching.length/directoryIndex!.pageSize)-1));
  engine.matches=query||location?new Set(matching.map(p=>p.index)):null;engine.invalidate();
  text('result-count',`${matching.length} ${matching.length===1?'PERSON':'PEOPLE'}`);
  const fragment=document.createDocumentFragment();
  for(const index of directoryIndex!.page(directoryMatches,directoryPage)) {
    const node=graph.nodes[index];
    const button=el('button','person-row');button.setAttribute('aria-label',`${node.name}, ${node.title}`);
    const initials=node.name.split(/\s+/).slice(0,2).map(s=>s[0]).join('');
    button.append(el('span','person-avatar',initials));
    const copy=el('span','person-copy');copy.append(el('strong','',node.name),el('small','',node.title));button.append(copy,el('span','','↗'));
    button.addEventListener('click',()=>selectPerson(index,true));fragment.append(button);
  }
  if(!matching.length)fragment.append(el('p','no-results','No people match your search. Try another name, skill, or location.'));
  $('people-list').replaceChildren(fragment);$('people-list').scrollTop=0;
  const pages=Math.max(1,Math.ceil(matching.length/directoryIndex!.pageSize));
  text('directory-page',`Page ${directoryPage+1} of ${pages}`);
  $<HTMLButtonElement>('directory-previous').disabled=directoryPage===0;
  $<HTMLButtonElement>('directory-next').disabled=directoryPage+1>=pages;
}
function relationButton(index:number):HTMLButtonElement {
  const node=graph!.nodes[index],button=el('button','relation-button',`${node.name} ↗`);
  button.addEventListener('click',()=>selectPerson(index,true));return button;
}
function selectPerson(index:number,focus=false):void {
  if(!graph||!engine)return;
  setDirectory(true);
  selected=index;engine.select(index);if(focus)engine.focus(index);
  const node=graph.nodes[index],card=el('div','profile-card');
  const avatar=el('img','profile-avatar');avatar.src=`/assets/avatars/${node.avatar}`;avatar.alt='';avatar.addEventListener('error',()=>{avatar.hidden=true;},{once:true});
  const name=el('h2','',node.name);name.tabIndex=-1;
  card.append(avatar,name,el('p','profile-title',node.title));card.append(el('span','badge',`Grade ${node.grade}`),el('span','badge',`${node.children.length} direct reports in view`));
  const section=(label:string)=>{const s=el('section','profile-section');s.append(el('h3','',label));card.append(s);return s;};
  section('Location').append(el('p','',node.location.label));
  const supervisor=section('Reports to');supervisor.append(node.parent>=0?relationButton(node.parent):el('p','','Group leader · no supervisor in this view'));
  const skills=section(`Skills & proficiency · ${node.resolvedSkills.length}`);
  for(const s of node.resolvedSkills) {
    const row=el('div','skill-row'),label=el('div','skill-label');label.append(el('span','',s.skill.label),el('small','',s.level.label));
    const track=el('div','skill-track'),fill=el('span');fill.style.width=`${Number(s.level.id)/4*100}%`;fill.style.backgroundColor=s.skill.color;track.append(fill);row.append(label,track);skills.append(row);
  }
  if(!node.resolvedSkills.length)skills.append(el('p','','No skills listed.'));
  const reports=section('Reporting relationships');
  if(node.children.length)for(const child of node.children)reports.append(relationButton(child));
  else reports.append(el('p','','No direct reports in this view.'));
  if(node.reportedCount!==node.children.length)reports.append(el('p','small-note',`The original data reports ${node.reportedCount} direct report(s); ${node.children.length} are present in this view.`));
  const focusButton=el('button','focus-button','Center on this person ↗');focusButton.addEventListener('click',()=>engine?.focus(index));card.append(focusButton,el('p','small-note','The network continues moving during inspection. Use Pause motion to hold the scene.'));
  $('profile-content').replaceChildren(card);showScreen('profile');$('profile-panel').scrollTop=0;name.focus({preventScroll:true});
  announce(`${node.name} selected. ${engine.running?'Simulation continues.':'Simulation is paused.'}`);
}
function clearSelection():void {selected=-1;engine?.select(-1);showScreen('directory');$<HTMLInputElement>('search').focus({preventScroll:true});}
function renderLegend():void {
  if(!graph)return;
  const fragment=document.createDocumentFragment();
  const group=(name:string,items:Lookup[])=>{
    const section=el('div','legend-group');section.append(el('h3','',name));
    for(const item of items){const row=el('div','legend-entry'),swatch=el('span','swatch');swatch.style.backgroundColor=item.color;row.append(swatch,document.createTextNode(item.label));section.append(row);}
    fragment.append(section);
  };
  group('Locations',graph.source.locations);group('Proficiency',graph.source.levels);group('Skills',graph.source.skills);
  $('legend-content').replaceChildren(fragment);
}
async function loadDataset(name:'team'|'project'):Promise<void> {
  if(loadingDataset===name||(engine&&activeDataset===name))return;
  loadingDataset=name;
  const current=++request;engine?.destroy();engine=null;graph=null;selected=-1;
  closeFlightMenu();$('flight-destinations').replaceChildren();$<HTMLButtonElement>('fly-menu-button').disabled=true;
  $('loading').hidden=false;$('error').hidden=true;
  for(const id of ['team','project'])$(`${id}-view`).setAttribute('aria-pressed',String(id===name));
  try {
    const response=await fetch(`/api/datasets/${name}`);if(!response.ok){const body=await response.json().catch(()=>null);throw new Error(body?.error || `Could not load the ${name} dataset (${response.status}).`);}
    const data:unknown=await response.json();if(current!==request)return;
    graph=normalize(data);directoryIndex=new DirectoryIndex(graph);directoryPage=0;activeDataset=name;loadingDataset=null;
    renderFlightDestinations();$<HTMLButtonElement>('fly-menu-button').disabled=graph.roots.length===0;
    text('page-title',name==='team'?'Team constellation':'Project constellation');
    text('people-count',String(graph.nodes.length));text('connection-count',String(graph.nodes.length-graph.roots.length));text('group-count',String(graph.roots.length));text('directory-badge',String(graph.nodes.length));
    text('scene-caption',`${graph.roots.length} ${graph.roots.length===1?'nucleus':'nuclei'} / spatial motion`);
    $<HTMLInputElement>('search').value='';
    const locations=$<HTMLSelectElement>('location-filter');locations.replaceChildren(new Option('All locations',''),...graph.source.locations.map(l=>new Option(l.label,l.id)));
    engine=new Engine($<HTMLCanvasElement>('universe'),graph,{
      select:i=>selectPerson(i),playback,
      zoom:scale=>text('zoom-level',`${Math.round(scale*100)}%`),
      stats:(visible,ms,cache,fps,interval)=>{text('render-status',`${visible} of ${graph!.nodes.length} people in view`);text('metrics-content',`Canvas 2D · ${fps.toFixed(1)} FPS observed · p95 frame interval ${interval.toFixed(1)} ms · p95 frame work ${ms.toFixed(2)} ms (last 120 draws) · sprite cache ${cache.toFixed(1)} MiB / 24 MiB. Frame work includes simulation, picking and CPU draw submission; excludes GPU completion. Frame pacing adapts to workload.`);}
    });
    updateInsets();
    engine.speed=Number($<HTMLInputElement>('speed').value);engine.orbits=$('toggle-orbits').getAttribute('aria-pressed')==='true';
    showScreen('directory');renderDirectory();renderLegend();$('loading').hidden=true;
    announce(`${name==='team'?'Team':'Project'} view loaded with ${graph.nodes.length} people.`);
  } catch(error) {
    if(current!==request)return;loadingDataset=null;$('loading').hidden=true;engine?.destroy();engine=null;
    text('error',error instanceof Error?error.message:'The visualization could not load.');$('error').hidden=false;playback(false);
  }
}
$('team-view').addEventListener('click',()=>{navigateToDataset('team');void loadDataset('team');});
$('fly-menu-button').addEventListener('click',()=>{const menu=$('fly-menu');menu.hidden=!menu.hidden;$('fly-menu-button').setAttribute('aria-expanded',String(!menu.hidden));});
document.addEventListener('pointerdown',event=>{if(!(event.target as Element).closest('.flight-control'))closeFlightMenu();});
$('project-view').addEventListener('click',()=>{navigateToDataset('project');void loadDataset('project');});
window.addEventListener('popstate',()=>void loadDataset(datasetFromPath()));
const queueSearch=()=>{directoryPage=0;if(searchFrame!==null)cancelAnimationFrame(searchFrame);searchFrame=requestAnimationFrame(()=>{searchFrame=null;renderDirectory();});};
$('search').addEventListener('input',queueSearch);$('location-filter').addEventListener('change',queueSearch);
$('directory-previous').addEventListener('click',()=>{directoryPage=Math.max(0,directoryPage-1);renderDirectory();});
$('directory-next').addEventListener('click',()=>{directoryPage++;renderDirectory();});
$('directory-tab').addEventListener('click',clearSelection);
$('legend-tab').addEventListener('click',()=>showScreen('legend'));
$('back-directory').addEventListener('click',clearSelection);
$('play-pause').addEventListener('click',()=>{if(engine){engine.setRunning(!engine.running);announce(engine.running?'Motion resumed.':'Motion paused.');}});
$('fit').addEventListener('click',()=>engine?.fit());$('zoom-in').addEventListener('click',()=>engine?.zoom(1.25));$('zoom-out').addEventListener('click',()=>engine?.zoom(.8));
$('toggle-orbits').addEventListener('click',()=>{if(engine){engine.orbits=!engine.orbits;$('toggle-orbits').setAttribute('aria-pressed',String(engine.orbits));engine.invalidate();}});
$('speed').addEventListener('input',()=>{const speed=Number($<HTMLInputElement>('speed').value);if(engine)engine.speed=speed;text('speed-value',`${speed}×`);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(!$('fly-menu').hidden){closeFlightMenu();$('fly-menu-button').focus();}else if(selected>=0)clearSelection();}});
window.addEventListener('pagehide',()=>{engine?.destroy();engine=null;});
window.addEventListener('pageshow',event=>{if(event.persisted)void loadDataset(datasetFromPath());});
$('toggle-directory').addEventListener('click',()=>setDirectory(!directoryOpen,true));
$('close-directory').addEventListener('click',()=>setDirectory(false,true));
$('fullscreen').addEventListener('click',async()=>{
  try {
    if(document.fullscreenElement)await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {announce('Browser fullscreen is unavailable. The application still fills the browser viewport.');text('scene-state','FULLSCREEN UNAVAILABLE · VIEWPORT MODE');}
});
document.addEventListener('fullscreenchange',()=>{
  const active=Boolean(document.fullscreenElement),button=$('fullscreen');
  button.setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');button.title=active?'Exit fullscreen':'Enter fullscreen';
  button.querySelector('.button-text')!.textContent=active?' Exit fullscreen':' Fullscreen';
});
window.addEventListener('resize',updateInsets);
setDirectory(directoryOpen);
const initialDataset=datasetFromPath();
navigateToDataset(initialDataset,true);
void loadDataset(initialDataset);
