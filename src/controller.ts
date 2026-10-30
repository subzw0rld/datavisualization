import type {Graph} from './model.js';
import {Simulation,fitCamera,pointerToWorld,pick,type Camera} from './simulation.js';
import {Renderer} from './renderer.js';
export interface EngineCallbacks {select:(index:number)=>void;playback:(running:boolean)=>void;stats:(visible:number,ms:number,cache:number,fps:number,interval:number)=>void;zoom:(scale:number)=>void}
export class Engine {
  readonly simulation:Simulation;readonly renderer:Renderer;
  camera:Camera={x:0,y:0,scale:1};selected=-1;hovered=-1;matches:Set<number>|null=null;
  orbits=false;speed=1;running=true;
  private fitted=true;
  private raf:number|null=null;private last:number|null=null;private dirty=true;private disposed=false;
  private pointer:{x:number;y:number}|null=null;
  private contextLost=false;private failures=0;private cost=0;private nextFrame=0;
  readonly diagnostics:{type:string;at:number;value?:number}[]=[];
  private record(type:string,value?:number):void {this.diagnostics.push({type,at:performance.now(),value});if(this.diagnostics.length>240)this.diagnostics.shift();}
  private selectedAt=0;private lastStats=0;private samples:number[]=[];
  private performanceObserver:PerformanceObserver|null=null;
  private observer:ResizeObserver;private abort=new AbortController();
  private reduced=matchMedia('(prefers-reduced-motion: reduce)');
  private insets={left:24,right:350,top:130,bottom:110};
  private dragging:{id:number;x:number;y:number;cameraX:number;cameraY:number;parallaxX:number;parallaxY:number;moved:boolean}|null=null;
  private parallax={x:0,y:0};
  constructor(readonly canvas:HTMLCanvasElement,graph:Graph,private callbacks:EngineCallbacks) {
    this.simulation=new Simulation(graph);this.renderer=new Renderer(canvas,this.simulation,()=>this.invalidate());
    this.running=!this.reduced.matches;
    const options={signal:this.abort.signal};
    if(typeof PerformanceObserver!=='undefined'&&PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
      this.performanceObserver=new PerformanceObserver(list=>{for(const entry of list.getEntries())this.record('longtask',entry.duration);});
      this.performanceObserver.observe({entryTypes:['longtask']});
    }
    window.addEventListener('error',()=>this.record('window-error'),options);
    window.addEventListener('unhandledrejection',()=>this.record('unhandled-rejection'),options);
    window.addEventListener('pagehide',()=>this.record('pagehide'),options);
    window.addEventListener('pageshow',()=>this.record('pageshow'),options);
    const resize=()=>{
      const rect=canvas.getBoundingClientRect(),first=this.renderer.resizeCount===0;
      const w=this.renderer.width,h=this.renderer.height;
      if(this.renderer.resize(rect.width,rect.height)) {
        this.record('resize');
        if(first||this.fitted)this.fit();else {this.camera.x+=(rect.width-w)/2;this.camera.y+=(rect.height-h)/2;this.invalidate();}
      }
    };
    this.observer=new ResizeObserver(resize);this.observer.observe(canvas);
    window.addEventListener('resize',resize,options);
    canvas.addEventListener('contextlost',e=>{e.preventDefault();this.contextLost=true;this.last=null;this.cancel();this.record('contextlost');},options);
    canvas.addEventListener('contextrestored',()=>{this.contextLost=false;this.failures=0;this.renderer.restore();this.record('contextrestored');this.invalidate();},options);
    document.addEventListener('visibilitychange',()=>{this.record(document.hidden?'hidden':'visible');this.last=null;if(document.hidden)this.cancel();else this.invalidate();},options);
    this.reduced.addEventListener('change',()=>{if(this.reduced.matches)this.setRunning(false);},options);
    canvas.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;canvas.setPointerCapture(e.pointerId);
      this.dragging={id:e.pointerId,x:e.clientX,y:e.clientY,cameraX:this.camera.x,cameraY:this.camera.y,
        parallaxX:this.parallax.x,parallaxY:this.parallax.y,moved:false};
    },options);
    canvas.addEventListener('pointermove',e=>{
      if(this.dragging) {
        const dx=e.clientX-this.dragging.x,dy=e.clientY-this.dragging.y;
        if(Math.hypot(dx,dy)>4)this.dragging.moved=true;
        if(this.dragging.moved) {
          this.fitted=false;this.camera.x=this.dragging.cameraX+dx;this.camera.y=this.dragging.cameraY+dy;
          // Background layers travel only a fraction of the foreground drag.
          // Keeping this offset persistent avoids a visible snap when the pointer is released.
          this.parallax.x=this.dragging.parallaxX+dx*.18;this.parallax.y=this.dragging.parallaxY+dy*.18;
          this.invalidate();
        }
      } else {
        this.pointer={x:e.clientX,y:e.clientY};this.invalidate();
      }
    },options);
    canvas.addEventListener('pointerup',e=>{
      if(!this.dragging)return;
      if(!this.dragging.moved) {
        const p=pointerToWorld(e.clientX,e.clientY,canvas.getBoundingClientRect(),this.renderer.width,this.renderer.height,this.camera);
        const index=pick(this.simulation,p.x,p.y,i=>!this.matches||this.matches.has(i),this.simulation.depthOrder);
        if(index>=0)this.callbacks.select(index);
      }
      this.dragging=null;
    },options);
    canvas.addEventListener('pointercancel',()=>{this.dragging=null;},options);
    canvas.addEventListener('lostpointercapture',()=>{this.dragging=null;},options);
    canvas.addEventListener('pointerleave',()=>{this.pointer=null;this.hovered=-1;this.invalidate();},options);
    canvas.addEventListener('wheel',e=>{
      e.preventDefault();const rect=canvas.getBoundingClientRect();
      this.zoom(Math.exp(-e.deltaY*.001),e.clientX-rect.left,e.clientY-rect.top);
    },{...options,passive:false});
    canvas.addEventListener('keydown',e=>{
      if(e.key===' '){e.preventDefault();this.setRunning(!this.running);}
      if(e.key==='+'||e.key==='=')this.zoom(1.2);
      if(e.key==='-')this.zoom(1/1.2);
      if(e.key==='0')this.fit();
      const shifts:Record<string,[number,number]>={ArrowLeft:[30,0],ArrowRight:[-30,0],ArrowUp:[0,30],ArrowDown:[0,-30]};
      if(shifts[e.key]){e.preventDefault();this.fitted=false;this.camera.x+=shifts[e.key][0];this.camera.y+=shifts[e.key][1];this.invalidate();}
    },options);
    this.callbacks.playback(this.running);this.invalidate();
  }
  setInsets(insets:typeof this.insets):void {
    const changed=Object.keys(insets).some(key=>insets[key as keyof typeof insets]!==this.insets[key as keyof typeof insets]);
    this.insets=insets;
    if(changed&&this.fitted&&this.renderer.resizeCount>0)this.fit();
  }
  fit():void {
    const {left,right,top,bottom}=this.insets;
    const width=Math.max(160,this.renderer.width-left-right),height=Math.max(160,this.renderer.height-top-bottom);
    this.fitted=true;this.simulation.spread(width/height);
    this.camera=fitCamera(this.simulation.currentBounds(),width,height);this.parallax={x:0,y:0};
    this.camera.x+=left;this.camera.y+=top;this.callbacks.zoom(this.camera.scale);this.invalidate();
  }
  zoom(factor:number,x=this.renderer.width/2,y=this.renderer.height/2):void {
    this.fitted=false;
    const scale=Math.min(2.5,Math.max(.0001,this.camera.scale*factor)),ratio=scale/this.camera.scale;
    this.camera={x:x-(x-this.camera.x)*ratio,y:y-(y-this.camera.y)*ratio,scale};
    this.callbacks.zoom(scale);this.invalidate();
  }
  focus(index:number):void {
    this.fitted=false;
    const {left,right,top,bottom}=this.insets;
    this.camera={scale:1.1,x:(this.renderer.width+left-right)/2-this.simulation.projectedX[index]*1.1,y:(this.renderer.height+top-bottom)/2-this.simulation.projectedY[index]*1.1};this.parallax={x:0,y:0};
    this.callbacks.zoom(this.camera.scale);this.invalidate();
  }
  select(index:number):void {this.selected=index;this.selectedAt=performance.now();this.invalidate();}
  setRunning(running:boolean):void {this.running=running;this.last=null;this.callbacks.playback(running);this.invalidate();}
  invalidate():void {if(this.disposed)return;this.failures=0;this.dirty=true;if(this.raf===null&&!document.hidden)this.raf=requestAnimationFrame(this.frame);}
  private frame=(now:number):void=>{
    this.raf=null;if(this.disposed||document.hidden)return;
    if(this.contextLost)return;
    if(!this.dirty&&now<this.nextFrame){this.raf=requestAnimationFrame(this.frame);return;}
    const begin=performance.now();
    if(this.running&&this.last!==null)this.record('interval',now-this.last);
    if(this.running&&this.last!==null)this.simulation.update((now-this.last)/1000*this.speed);
    this.last=now;
    if(this.pointer) {
      const p=pointerToWorld(this.pointer.x,this.pointer.y,this.canvas.getBoundingClientRect(),this.renderer.width,this.renderer.height,this.camera);
      this.hovered=pick(this.simulation,p.x,p.y,i=>!this.matches||this.matches.has(i),this.simulation.depthOrder);
      this.canvas.style.cursor=this.hovered<0?'grab':'pointer';this.pointer=null;
    }
    const pulse=this.reduced.matches?1:Math.min(1,(now-this.selectedAt)/700);
    if(this.dirty||this.running||this.renderer.artwork.pending||(this.selected>=0&&pulse<1)) {
      try {this.renderer.draw(this.camera,{selected:this.selected,hovered:this.hovered,matches:this.matches,orbits:this.orbits,pulse,parallax:this.parallax});this.failures=0;}
      catch(error) {this.record('draw-error');if(++this.failures===1)console.error('Canvas draw failed',error);if(this.failures>=3){this.setRunning(false);this.cancel();return;}}
      const elapsed=performance.now()-begin;
      this.cost=this.cost?this.cost*.8+elapsed*.2:elapsed;
      // Follow available refresh cadence when cheap, yield proportionally when busy.
      this.nextFrame=now+this.cost*1.5;
      this.record('work',elapsed);
      this.samples.push(performance.now()-begin);if(this.samples.length>120)this.samples.shift();
      this.dirty=false;
      if(now-this.lastStats>750||!this.running) {
        const sorted=[...this.samples].sort((a,b)=>a-b);
        const intervals=this.diagnostics.filter(e=>e.type==='interval').map(e=>e.value!).sort((a,b)=>a-b);
        const average=intervals.reduce((sum,v)=>sum+v,0)/intervals.length;
        this.callbacks.stats(this.renderer.visible,sorted[Math.floor((sorted.length-1)*.95)]||0,this.renderer.artwork.memoryMiB,this.running&&average?1000/average:0,intervals[Math.floor((intervals.length-1)*.95)]||0);this.lastStats=now;
      }
    }
    if(this.running||this.renderer.artwork.pending||(this.selected>=0&&pulse<1))this.raf=requestAnimationFrame(this.frame);
  };
  private cancel():void {if(this.raf!==null)cancelAnimationFrame(this.raf);this.raf=null;}
  destroy():void {this.disposed=true;this.cancel();this.observer.disconnect();this.performanceObserver?.disconnect();this.abort.abort();this.renderer.destroy();}
}
