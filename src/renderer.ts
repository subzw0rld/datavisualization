import type {Node} from './model.js';
import {Simulation, hash, segmentIntersectsRect, type Camera, type Bounds} from './simulation.js';
class Artwork {
  private images=new Map<string,HTMLImageElement>();
  private signatures=new Map<Node,string>();
  private cache=new Map<string,{canvas:HTMLCanvasElement; bytes:number;used:number}>();
  private bytes=0;
  private disposed=false;
  private epoch=0;private built=0;private started=0;pending=false;
  readonly counters={hits:0,misses:0,created:0,evictions:0};
  beginFrame():void {this.epoch++;
    for(const [key,entry] of this.cache)if(entry.used<this.epoch-2){this.cache.delete(key);this.bytes-=entry.bytes;this.counters.evictions++;}
    this.built=0;this.started=performance.now();this.pending=false;}
  readonly budget=24*1024*1024;
  constructor(nodes:Node[],invalidate:()=>void) {
    for(const node of nodes)this.signatures.set(node,JSON.stringify([node.radius,node.avatar,node.location.color,node.resolvedSkills.map(s=>[s.skill.color,s.level.color])]));
    for (const filename of new Set(nodes.map(n=>n.avatar))) {
      const image=new Image(); image.src=new URL(`../assets/avatars/${filename}`,import.meta.url).href;
      image.decode().then(()=>{
        if(this.disposed)return;
        this.images.set(filename,image);this.clear();invalidate();
      }).catch(()=>{/* A drawn silhouette stays usable when an image cannot load. */});
    }
  }
  get(node:Node,resolution:number,priority=false):HTMLCanvasElement|null {
    const key=`${this.signatures.get(node)}@${resolution}`;
    const existing=this.cache.get(key);
    if(existing) {existing.used=this.epoch;this.counters.hits++;this.cache.delete(key);this.cache.set(key,existing);return existing.canvas;}
    this.counters.misses++;
    const radius=node.radius, outer=radius+29, size=outer*2;
    const estimate=Math.ceil(size*resolution)**2*4;
    // Admission control prevents an oversized working set from cycling forever.
    if(!priority&&this.bytes+estimate>this.budget)return null;
    if(this.built>=8 || (this.built>0&&performance.now()-this.started>3)){this.pending=true;return null;}
    this.built++;this.counters.created++;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=Math.ceil(size*resolution);
    const ctx=canvas.getContext('2d')!;
    ctx.scale(canvas.width/size,canvas.height/size);ctx.translate(outer,outer);
    this.draw(ctx,node);
    const bytes=canvas.width*canvas.height*4;
    while(this.bytes+bytes>this.budget && this.cache.size) {
      const oldest=this.cache.keys().next().value!;this.bytes-=this.cache.get(oldest)!.bytes;this.cache.delete(oldest);this.counters.evictions++;
    }
    this.cache.set(key,{canvas,bytes,used:this.epoch});this.bytes+=bytes;
    return canvas;
  }
  draw(ctx:CanvasRenderingContext2D,node:Node):void {
    const radius=node.radius;
    const core=ctx.createRadialGradient(-radius*.3,-radius*.4,0,0,0,radius);
    core.addColorStop(0,'#477d8a');core.addColorStop(.55,'#173e50');core.addColorStop(1,'#04121e');
    ctx.fillStyle=core;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(0,0,radius-3,0,Math.PI*2);ctx.clip();
    const image=this.images.get(node.avatar);
    if(image&&node.avatar!=='avatar.png') {
      const sourceSize=Math.min(image.naturalWidth,image.naturalHeight), target=Math.min(radius*1.65,68);
      ctx.drawImage(image,(image.naturalWidth-sourceSize)/2,0,sourceSize,sourceSize,-target/2,-target/2,target,target);
    } else {
      ctx.fillStyle='#79b2bf';ctx.beginPath();ctx.arc(0,-radius*.25,radius*.25,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(0,radius*.55,radius*.58,radius*.48,0,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
    const ring=(inner:number,outer:number,start:number,end:number,color:string)=>{
      ctx.beginPath();ctx.arc(0,0,outer,start,end);ctx.arc(0,0,inner,end,start,true);ctx.closePath();ctx.fillStyle=color;ctx.fill();
    };
    ring(radius,radius+7,0,Math.PI*2,node.location.color);
    node.resolvedSkills.forEach((s,i)=>{
      const start=i/node.resolvedSkills.length*Math.PI*2-Math.PI/2, end=(i+1)/node.resolvedSkills.length*Math.PI*2-Math.PI/2;
      const gap=node.resolvedSkills.length>1?.012:0;
      ring(radius+7,radius+14,start+gap,end-gap,s.skill.color);
      ring(radius+14,radius+21,start+gap,end-gap,s.level.color);
    });
    ctx.strokeStyle='#75c7d375';ctx.lineWidth=.75;ctx.shadowColor='#50c8e0';ctx.shadowBlur=4;
    ctx.beginPath();ctx.arc(0,0,radius+23.5,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
  }
  clear():void {this.cache.clear();this.bytes=0;}
  destroy():void {this.disposed=true;this.clear();this.images.clear();this.signatures.clear();}
  get memoryMiB():number {return this.bytes/1048576;}
}
interface RenderOptions {selected:number;hovered:number;matches:Set<number>|null;orbits:boolean; pulse:number;parallax?:{x:number;y:number}}
export class Renderer {
  private ctx:CanvasRenderingContext2D;
  readonly artwork:Artwork;
  private starfield:HTMLCanvasElement|null=null;
  private gridfield:HTMLCanvasElement|null=null;
  width=1;height=1;dpr=1;visible=0;
  private buckets=new Map<number,number>();
  resizeCount=0;
  constructor(readonly canvas:HTMLCanvasElement,readonly simulation:Simulation,invalidate:()=>void) {
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('This browser does not support Canvas 2D.');this.ctx=ctx;
    this.artwork=new Artwork(simulation.graph.nodes,invalidate);
  }
  resize(width:number,height:number):boolean {
    const dpr=Math.min(window.devicePixelRatio||1,2);
    if(this.starfield&&this.width===Math.max(1,width)&&this.height===Math.max(1,height)&&this.dpr===dpr)return false;
    this.resizeCount++;
    this.width=Math.max(1,width);this.height=Math.max(1,height);
    // A bounded display scale balances sharpness and pixel work on dense screens.
    this.dpr=Math.min(window.devicePixelRatio||1,2);
    this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);
    this.starfield=document.createElement('canvas');this.starfield.width=this.canvas.width;this.starfield.height=this.canvas.height;
    this.gridfield=document.createElement('canvas');this.gridfield.width=this.canvas.width;this.gridfield.height=this.canvas.height;
    const sky=this.starfield.getContext('2d')!;sky.scale(this.dpr,this.dpr);
    const count=Math.min(500,Math.ceil(this.width*this.height/4200));
    for(let i=0;i<count;i++) {
      const x=hash(`star-x:${i}`)*this.width,y=hash(`star-y:${i}`)*this.height,bright=hash(`star-a:${i}`);
      sky.fillStyle=`rgba(130,196,222,${.12+bright*.38})`;sky.beginPath();sky.arc(x,y,bright>.94?1.2:.6,0,Math.PI*2);sky.fill();
      if(bright>.97){sky.strokeStyle='#6ba7c21b';sky.lineWidth=.6;sky.beginPath();sky.moveTo(x-4,y);sky.lineTo(x+4,y);sky.moveTo(x,y-4);sky.lineTo(x,y+4);sky.stroke();}
    }
    // Keep the grid in its own layer so it can sit closer to the foreground than the stars.
    const grid=this.gridfield.getContext('2d')!;grid.scale(this.dpr,this.dpr);
    const cx=this.width*.43,cy=this.height*.52;
    grid.strokeStyle='#40879a0c';grid.lineWidth=.7;
    for(let r=120;r<Math.max(this.width,this.height);r+=120){grid.beginPath();grid.arc(cx,cy,r,0,Math.PI*2);grid.stroke();}
    for(let angle=0;angle<Math.PI*2;angle+=Math.PI/6){grid.beginPath();grid.moveTo(cx+Math.cos(angle)*50,cy+Math.sin(angle)*50);grid.lineTo(cx+Math.cos(angle)*1800,cy+Math.sin(angle)*1800);grid.stroke();}
    return true;
  }
  restore():void {this.starfield=null;this.gridfield=null;this.artwork.clear();this.resize(this.width,this.height);}
  draw(camera:Camera,options:RenderOptions):void {
    this.artwork.beginFrame();
    const ctx=this.ctx,sim=this.simulation,nodes=sim.graph.nodes,{selected,hovered,matches}=options;
    const parallax=options.parallax??{x:0,y:0};
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    // The tiled layers move at different rates, creating depth while the particle
    // system is dragged. Tiling prevents empty edges during a large pan.
    this.drawParallaxLayer(ctx,this.starfield,parallax.x*.08,parallax.y*.08);
    this.drawParallaxLayer(ctx,this.gridfield,parallax.x*.32,parallax.y*.32);
    ctx.setTransform(this.dpr*camera.scale,0,0,this.dpr*camera.scale,this.dpr*camera.x,this.dpr*camera.y);
    const view:Bounds={x:-camera.x/camera.scale,y:-camera.y/camera.scale,width:this.width/camera.scale,height:this.height/camera.scale};
    if(options.orbits) {
      ctx.strokeStyle='#95afbf19';ctx.lineWidth=1/camera.scale;ctx.setLineDash([3/camera.scale,7/camera.scale]);
      for(const i of sim.graph.order) if(nodes[i].parent>=0) {
        const parent=nodes[i].parent,radius=sim.orbit[i];
        const near={x:0,y:0,scale:0},far={x:0,y:0,scale:0};
        sim.project(sim.x[parent],sim.y[parent],sim.z[parent]+radius,near);
        sim.project(sim.x[parent],sim.y[parent],sim.z[parent]-radius,far);
        const maxScale=Math.max(near.scale,far.scale);
        const projectedRadius=radius*maxScale;
        if(projectedRadius*camera.scale<3)continue;
        const left=Math.min(near.x,far.x)-projectedRadius,right=Math.max(near.x,far.x)+projectedRadius;
        const top=Math.min(near.y,far.y)-projectedRadius,bottom=Math.max(near.y,far.y)+projectedRadius;
        if(right<view.x||left>view.x+view.width||bottom<view.y||top>view.y+view.height)continue;
        const steps=projectedRadius*camera.scale<24?12:projectedRadius*camera.scale<80?24:48;
        const point={x:0,y:0,scale:0};let connected=false;
        ctx.beginPath();
        for(let step=0;step<=steps;step++) {
          sim.projectOrbit(i,step/steps*Math.PI*2,point);
          if(point.scale===0){connected=false;continue;}
          if(connected)ctx.lineTo(point.x,point.y);else ctx.moveTo(point.x,point.y);
          connected=true;
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    ctx.lineWidth=1/camera.scale;
    for(let i=0;i<nodes.length;i++) {
      const parent=nodes[i].parent;if(parent<0)continue;
      if(sim.depthScale[i]===0||sim.depthScale[parent]===0)continue;
      if(!segmentIntersectsRect(sim.projectedX[i],sim.projectedY[i],sim.projectedX[parent],sim.projectedY[parent],view))continue;
      const active=selected===i||selected===parent;
      ctx.globalAlpha=matches && !matches.has(i) && !matches.has(parent) && !active ? .12 : 1;
      ctx.strokeStyle=active?'#7ae7efb0':'#6abacd42';
      ctx.beginPath();ctx.moveTo(sim.projectedX[i],sim.projectedY[i]);ctx.lineTo(sim.projectedX[parent],sim.projectedY[parent]);ctx.stroke();
    }
    this.visible=0;
    let fallbackDetails=0;
    for(const i of sim.depthOrder) {
      const node=nodes[i],r=(node.radius+29)*sim.depthScale[i],x=sim.projectedX[i],y=sim.projectedY[i];
      if(sim.depthScale[i]===0)continue;
      if(x+r<view.x||y+r<view.y||x-r>view.x+view.width||y-r>view.y+view.height)continue;
      this.visible++;
      ctx.globalAlpha=matches&&!matches.has(i)&&i!==selected ? .16 : 1;
      const diameter=r*2*camera.scale,priority=i===selected||i===hovered;
      let sprite:HTMLCanvasElement|null=null;
      if(diameter>=36||priority) {
        const desired=Math.max(.125,Math.min(3,this.dpr*camera.scale*sim.depthScale[i]));
        let resolution=this.buckets.get(i)??0;
        if(desired>resolution*1.2||desired<resolution*.6)resolution=2**Math.ceil(Math.log2(desired));
        resolution=Math.min(3,resolution);this.buckets.set(i,resolution);
        sprite=this.artwork.get(node,resolution,priority);
      }
      if(sprite)ctx.drawImage(sprite,x-r,y-r,r*2,r*2);
      else if(priority||((diameter>=36)&&fallbackDetails<8)) {
        // Limit uncached detail work while preserving the active person.
        fallbackDetails++;
        ctx.save();ctx.translate(x,y);ctx.scale(sim.depthScale[i],sim.depthScale[i]);
        this.artwork.draw(ctx,node);ctx.restore();
      } else {
        ctx.fillStyle=node.location.color;ctx.beginPath();ctx.arc(x,y,node.radius*sim.depthScale[i],0,Math.PI*2);ctx.fill();
        if(diameter>=12){ctx.strokeStyle='#92d1dc';ctx.lineWidth=1/camera.scale;ctx.beginPath();ctx.arc(x,y,(node.radius+14)*sim.depthScale[i],0,Math.PI*2);ctx.stroke();}
      }
      if(i===selected||i===hovered) {
        const pulse=i===selected?Math.sin(options.pulse*Math.PI)*5:0;
        ctx.strokeStyle=i===selected?'#93f4fa':'#8de3ef90';ctx.lineWidth=1/camera.scale;
        for(let a=0;a<4;a++){ctx.beginPath();ctx.arc(x,y,r+7+Math.max(0,pulse),a*Math.PI/2+.12,(a+1)*Math.PI/2-.12);ctx.stroke();}
      }
    }
    ctx.globalAlpha=1;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    // Labels stay crisp in screen space; only leaders and the active person label at overview scale.
    const labels=new Set([selected,hovered,...sim.graph.roots]);
    const occupied:Bounds[]=[];
    ctx.textAlign='center';ctx.textBaseline='top';ctx.font='10px "SFMono-Regular", Consolas, monospace';
    for(const i of labels) {
      if(i<0 || sim.depthScale[i]===0 || (matches&&!matches.has(i)&&i!==selected))continue;
      const node=nodes[i],x=sim.projectedX[i]*camera.scale+camera.x,y=(sim.projectedY[i]+(node.radius+30)*sim.depthScale[i])*camera.scale+camera.y;
      if(x<0||x>this.width||y<0||y>this.height-10)continue;
      const label=node.name, width=ctx.measureText(label).width;
      const box={x:x-width/2-5,y:y-2,width:width+10,height:17};
      if(occupied.some(b=>box.x<b.x+b.width+5&&box.x+box.width+5>b.x&&box.y<b.y+b.height+3&&box.y+box.height+3>b.y))continue;
      occupied.push(box);
      ctx.fillStyle='#061420cc';ctx.fillRect(x-width/2-5,y-2,width+10,17);
      ctx.fillStyle=i===selected?'#a6f7ff':'#78aab9';ctx.fillText(label,x,y);
    }
  }
  private drawParallaxLayer(ctx:CanvasRenderingContext2D,layer:HTMLCanvasElement|null,x:number,y:number):void {
    if(!layer)return;
    const width=this.canvas.width,height=this.canvas.height,physicalX=x*this.dpr,physicalY=y*this.dpr;
    const offsetX=((physicalX%width)+width)%width,offsetY=((physicalY%height)+height)%height;
    ctx.save();
    for(const dx of [-width,0,width]) for(const dy of [-height,0,height])
      ctx.drawImage(layer,offsetX+dx,offsetY+dy);
    ctx.restore();
  }
  destroy():void {this.artwork.destroy();this.starfield=null;this.gridfield=null;}
}
