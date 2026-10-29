// Diagnostic only: imports the existing build without modifying application code.
// Usage: node reports/audit-5000-performance.mjs /path/to/captured-dataset.json
// Canvas stubs count real renderer operations; timings are NOT browser FPS.
import fs from 'node:fs';
import {normalize} from '../dist/model.js';
import {Simulation,fitCamera,pick} from '../dist/simulation.js';
import {Renderer} from '../dist/renderer.js';
const data=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const graph=normalize(data);
let allocations=0,pixels=0,calls={};
const context=new Proxy({}, {get:(_,key)=>{
  if(key==='createRadialGradient')return ()=>({addColorStop(){}});
  if(key==='measureText')return text=>({width:text.length*6});
  return ()=>{calls[key]=(calls[key]||0)+1;};
},set:()=>true});
class Canvas {
  width=0;_height=0;
  set height(value){this._height=value;}
  get height(){return this._height;}
  getContext(){pixels+=this.width*this.height;return context;}
}
globalThis.document={createElement:()=>{allocations++;return new Canvas();}};
globalThis.window={devicePixelRatio:2};
// Keep avatar decoding pending to isolate the stable-state renderer.
globalThis.Image=class {decode(){return new Promise(()=>{});}};
const signatures=new Map(graph.nodes.map(n=>[JSON.stringify([n.radius,n.avatar,n.location.color,n.resolvedSkills.map(s=>[s.skill.color,s.level.color])]),n]));
const footprint=resolution=>[...signatures.values()].reduce((sum,n)=>sum+Math.ceil((n.radius+29)*2*resolution)**2*4,0)/1048576;
const scenarios=[];
for(const [width,height,scale] of [[1440,900,null],[1920,1080,null],[1440,900,1.1]]) {
  const sim=new Simulation(graph),renderer=new Renderer(new Canvas(),sim,()=>{});
  renderer.resize(width,height);
  const camera=fitCamera(sim.currentBounds(),width-372,height-350);camera.x+=28;camera.y+=220;
  if(scale){const i=graph.roots[0];camera.scale=scale;camera.x=(width-372)/2-sim.x[i]*scale;camera.y=height/2-sim.y[i]*scale;}
  const frames=[];
  for(let frame=0;frame<6;frame++) {
    sim.update(1/60);allocations=0;pixels=0;calls={};
    const start=performance.now();
    renderer.draw(camera,{selected:-1,hovered:-1,matches:null,orbits:false,pulse:1});
    frames.push({frame,visible:renderer.visible,newSpriteCanvases:allocations,newRawPixelMiB:pixels*4/1048576,cacheMiB:renderer.artwork.memoryMiB,stubCpuMs:performance.now()-start,arcs:calls.arc||0,strokes:calls.stroke||0,images:calls.drawImage||0});
  }
  const started=performance.now();for(let i=0;i<100;i++)pick(sim,-1,-1);
  scenarios.push({width,height,camera,frames,pickMissAverageMs:(performance.now()-started)/100});
  renderer.destroy();
}
const sim=new Simulation(graph),camera=fitCamera(sim.currentBounds(),1068,550);camera.x+=28;camera.y+=220;
const visibility=[];let previous=0;
for(let seconds=0;seconds<=1800;seconds+=10){sim.update(seconds-previous);previous=seconds;let visible=0;for(let i=0;i<graph.nodes.length;i++){const r=(graph.nodes[i].radius+29)*sim.depthScale[i]*camera.scale,x=sim.x[i]*camera.scale+camera.x,y=sim.y[i]*camera.scale+camera.y;if(x+r>=0&&x-r<=1440&&y+r>=0&&y-r<=900)visible++;}visibility.push({seconds,visible});}
console.log(JSON.stringify({method:'Actual dist renderer with no-op Canvas; operation counts and raw pixel allocations only. No GPU, DOM layout, image rasterization, GC, or browser FPS measurement.',dataset:{nodes:graph.nodes.length,roots:graph.roots.length,edges:graph.nodes.length-graph.roots.length,uniqueSprites:signatures.size,maxDepth:Math.max(...graph.nodes.map(n=>n.depth)),avatars:new Set(graph.nodes.map(n=>n.avatar)).size},uniqueSpriteMiB:{resolution05:footprint(.5),resolution1:footprint(1),resolution25:footprint(2.5)},scenarios,visibility:{durationSeconds:1800,sampleIntervalSeconds:10,min:visibility.reduce((a,b)=>a.visible<b.visible?a:b),max:visibility.reduce((a,b)=>a.visible>b.visible?a:b)}},null,2));
