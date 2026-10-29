import type {Graph} from './model.js';
export interface Bounds {x: number; y: number; width: number; height: number}
export interface Projection {x:number;y:number;scale:number}
/** Positive Z points toward the viewer; geometry before the near plane is clipped. */
export function perspectiveScale(z:number,focalLength:number):number {
  const distance=focalLength-z;
  return distance>=focalLength*.1?focalLength/distance:0;
}
export interface Camera {x:number; y:number; scale:number}
export function hash(text: string): number {
  let value=2166136261;
  for (const c of text) value=Math.imul(value^c.charCodeAt(0),16777619);
  return (value>>>0)/4294967296;
}
// Avalanche the string hash so adjacent record IDs do not produce adjacent positions.
function random(seed:string):number {
  let value=(hash(seed)*4294967296)>>>0;
  value=Math.imul(value^(value>>>16),0x7feb352d);
  value=Math.imul(value^(value>>>15),0x846ca68b);
  return ((value^(value>>>16))>>>0)/4294967296;
}
interface ScatterPoint {x:number;y:number;clearance:number}
/** Bounded rejection sampling: prefer clear space, accept the least crowded fallback. */
class Scatter {
  private cells=new Map<string,ScatterPoint[]>();
  constructor(private cellSize:number) {}
  place<T extends ScatterPoint>(candidate:(attempt:number)=>T):T {
    let best:T|undefined,bestScore=-1;
    for(let attempt=0;attempt<16;attempt++) {
      const point=candidate(attempt),cx=Math.floor(point.x/this.cellSize),cy=Math.floor(point.y/this.cellSize);
      let score=1;
      for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++) {
        for(const other of this.cells.get(`${cx+dx}:${cy+dy}`)??[]) {
          score=Math.min(score,Math.hypot(point.x-other.x,point.y-other.y)/(point.clearance+other.clearance));
        }
      }
      if(score>bestScore){best=point;bestScore=score;}
      if(score>=1)break;
    }
    const chosen=best!,key=`${Math.floor(chosen.x/this.cellSize)}:${Math.floor(chosen.y/this.cellSize)}`;
    const cell=this.cells.get(key);if(cell)cell.push(chosen);else this.cells.set(key,[chosen]);
    return chosen;
  }
}
export class Simulation {
  readonly x: Float64Array; readonly y: Float64Array; readonly z: Float64Array;
  readonly projectedX:Float64Array;readonly projectedY:Float64Array;
  readonly focalLength:number;readonly rootDepth:Float64Array;
  readonly rootProjectionScale:Float64Array;
  private layoutAspect=0;
  readonly depthScale: Float64Array; readonly inclination: Float64Array; readonly angularSpeed: Float64Array;
  readonly orbit: Float64Array; readonly phase: Float64Array; readonly orbitRotation:Float64Array;
  readonly anchorX: Float64Array; readonly anchorY: Float64Array;
  readonly velocityX: Float64Array; readonly velocityY: Float64Array;
  readonly extent: Float64Array;
  readonly bounds: Bounds;
  readonly depthOrder:number[];
  readonly centralSystem:number;
  time=0;
  constructor(readonly graph: Graph) {
    const n=graph.nodes.length;
    this.depthOrder=[...graph.order];
    // Roots are normalized by ID, so equal masses retain a stable tie-break.
    this.centralSystem=graph.roots.reduce((best,i)=>best<0||graph.nodes[i].systemMass>graph.nodes[best].systemMass?i:best,-1);
    this.projectedX=new Float64Array(n);this.projectedY=new Float64Array(n);this.rootDepth=new Float64Array(n);this.rootProjectionScale=new Float64Array(n);
    this.x=new Float64Array(n); this.y=new Float64Array(n); this.z=new Float64Array(n);
    this.depthScale=new Float64Array(n); this.inclination=new Float64Array(n); this.angularSpeed=new Float64Array(n);
    this.orbit=new Float64Array(n); this.phase=new Float64Array(n);this.orbitRotation=new Float64Array(n);
    this.anchorX=new Float64Array(n); this.anchorY=new Float64Array(n);
    this.velocityX=new Float64Array(n);this.velocityY=new Float64Array(n);
    this.extent=Float64Array.from(graph.nodes,p=>p.radius+35);
    const orbitByGrade:Record<string,number>={'5B':400,'6A':300,'6B':300,'7A':200,'7B':200,'8A':120,'8B':120};
    for (const index of graph.order) {
      const node=graph.nodes[index];
      const maxClearance=node.children.reduce((r,i)=>Math.max(r,(graph.nodes[i].radius+35)*1.6),1);
      const scatter=new Scatter(maxClearance*2);
      for(const child of node.children) {
        const person=graph.nodes[child],inner=(orbitByGrade[person.grade]??400)*2.4;
        const outer=Math.max(inner*2.2,Math.sqrt(node.children.length)*maxClearance*2.5);
        const point=scatter.place(attempt=>{
          const seed=`${person.id}:scatter:${attempt}`;
          const orbit=Math.sqrt(inner*inner+random(`${seed}:radius`)*(outer*outer-inner*inner));
          const phase=random(`${seed}:phase`)*Math.PI*2;
          const tilt=.15+random(`${seed}:tilt`)*.85,rotation=random(`${seed}:rotation`)*Math.PI*2;
          const x=Math.cos(phase)*orbit,y=Math.sin(phase)*orbit*Math.cos(tilt);
          return {x:x*Math.cos(rotation)-y*Math.sin(rotation),y:x*Math.sin(rotation)+y*Math.cos(rotation),
            clearance:(person.radius+35)*1.6,orbit,phase,tilt,rotation};
        });
        this.orbit[child]=point.orbit;this.phase[child]=point.phase;
        this.inclination[child]=point.tilt;this.orbitRotation[child]=point.rotation;
        this.angularSpeed[child]=.3*Math.sqrt(30/person.radius)*(.7+random(`${person.id}:speed`)*.6);
      }
    }
    for (const index of [...graph.order].reverse()) {
      for (const child of graph.nodes[index].children) this.extent[index]=Math.max(this.extent[index],this.orbit[child]+this.extent[child]);
    }
    const largest=Math.max(0,...graph.roots.map(i=>this.extent[i]));
    // Keep the full orbital depth envelope safely beyond the near plane.
    this.focalLength=Math.max(2000,largest*4);
    this.bounds={x:0,y:0,width:1,height:1};
    graph.roots.forEach(index=>{
      const node=graph.nodes[index];
      this.rootDepth[index]=(.45-random(`${node.id}:distance`)*2.25)*this.focalLength;
      const initialZ=this.rootDepth[index]+Math.sin(hash(`${node.id}:depth`)*Math.PI*2)*this.focalLength*.04;
      this.rootProjectionScale[index]=perspectiveScale(initialZ,this.focalLength);
      // Smaller particles travel faster; headings are independent and reproducible.
      const magnitude=30*Math.sqrt(30/node.radius);
      const heading=hash(`${node.id}:heading`)*Math.PI*2;
      this.velocityX[index]=Math.cos(heading)*magnitude;
      this.velocityY[index]=Math.sin(heading)*magnitude;
    });
    this.spread(1.65);
  }
  /** Distribute viewing directions, then unproject them to each group's own depth. */
  spread(aspect:number):void {
    aspect=Math.max(.25,Math.min(6,aspect));
    if(Math.abs(aspect-this.layoutAspect)<.01)return;
    this.layoutAspect=aspect;
    const roots=this.graph.roots;
    const footprint=(i:number)=>this.extent[i]*this.rootProjectionScale[i];
    const largest=roots.reduce((max,i)=>Math.max(max,footprint(i)),0);
    const area=roots.reduce((sum,i)=>sum+(footprint(i)*2)**2,0);
    const height=Math.max(950,largest*3,Math.sqrt(area*3.5/aspect)),width=height*aspect;
    this.bounds.width=width;this.bounds.height=height;
    const scatter=new Scatter(Math.max(1,largest*1.4));
    // Place the heaviest system first so other groups respect its soft separation.
    const placement=this.centralSystem<0?roots:[this.centralSystem,...roots.filter(i=>i!==this.centralSystem)];
    for(const i of placement) {
      const node=this.graph.nodes[i],margin=footprint(i);
      const point=scatter.place(attempt=>({
        x:i===this.centralSystem?width/2:margin+random(`${node.id}:root-x:${attempt}`)*(width-2*margin),
        y:i===this.centralSystem?height/2:margin+random(`${node.id}:root-y:${attempt}`)*(height-2*margin),clearance:margin*.7
      }));
      // Distant groups need greater physical offsets to occupy the same angular field.
      this.anchorX[i]=width/2+(point.x-width/2)/this.rootProjectionScale[i]-this.velocityX[i]*this.time;
      this.anchorY[i]=height/2+(point.y-height/2)/this.rootProjectionScale[i]-this.velocityY[i]*this.time;
    }
    this.update(0);
  }
  rootBounds(index:number):Bounds {
    const scale=this.rootProjectionScale[index],margin=this.extent[index];
    const width=this.bounds.width/scale+margin*2,height=this.bounds.height/scale+margin*2;
    return {x:this.bounds.width/2-width/2,y:this.bounds.height/2-height/2,width,height};
  }
  update(dt: number): void {
    if (!Number.isFinite(dt) || dt<0) return;
    this.time+=dt;
    for (const index of this.graph.order) {
      const p=this.graph.nodes[index];
      if (p.parent<0) {
        // Wrap only after the entire group passes a world edge. Descendants
        // move with their root, so wrapping never stretches a reporting line.
        const margin=this.extent[index],scale=this.rootProjectionScale[index];
        const halfWidth=this.bounds.width/(2*scale)+margin,halfHeight=this.bounds.height/(2*scale)+margin;
        this.x[index]=wrap(this.anchorX[index]+this.velocityX[index]*this.time,this.bounds.width/2-halfWidth,this.bounds.width/2+halfWidth);
        this.y[index]=wrap(this.anchorY[index]+this.velocityY[index]*this.time,this.bounds.height/2-halfHeight,this.bounds.height/2+halfHeight);
        this.z[index]=this.rootDepth[index]+Math.sin(hash(`${p.id}:depth`)*Math.PI*2+this.time*.05)*this.focalLength*.04;
      } else {
        const angle=this.phase[index]+this.time*this.angularSpeed[index];
        const x=Math.cos(angle)*this.orbit[index],y=Math.sin(angle)*this.orbit[index]*Math.cos(this.inclination[index]);
        const rotation=this.orbitRotation[index];
        this.x[index]=this.x[p.parent]+x*Math.cos(rotation)-y*Math.sin(rotation);
        this.y[index]=this.y[p.parent]+x*Math.sin(rotation)+y*Math.cos(rotation);
        this.z[index]=this.z[p.parent]+Math.sin(angle)*this.orbit[index]*Math.sin(this.inclination[index]);
      }
    }
    this.projectPositions();
    this.depthOrder.sort((a,b)=>this.z[a]-this.z[b]||a-b);
  }
  project(x:number,y:number,z:number,out:Projection):void {
    out.scale=perspectiveScale(z,this.focalLength);
    out.x=this.bounds.width/2+(x-this.bounds.width/2)*out.scale;
    out.y=this.bounds.height/2+(y-this.bounds.height/2)*out.scale;
  }
  projectPositions():void {
    const point:Projection={x:0,y:0,scale:0};
    for(let i=0;i<this.x.length;i++) {
      this.project(this.x[i],this.y[i],this.z[i],point);
      this.projectedX[i]=point.x;this.projectedY[i]=point.y;this.depthScale[i]=point.scale;
    }
  }
  projectOrbit(index:number,angle:number,out:Projection):void {
    const parent=this.graph.nodes[index].parent;
    const x=Math.cos(angle)*this.orbit[index],y=Math.sin(angle)*this.orbit[index]*Math.cos(this.inclination[index]);
    const rotation=this.orbitRotation[index];
    this.project(this.x[parent]+x*Math.cos(rotation)-y*Math.sin(rotation),
      this.y[parent]+x*Math.sin(rotation)+y*Math.cos(rotation),
      this.z[parent]+Math.sin(angle)*this.orbit[index]*Math.sin(this.inclination[index]),out);
  }
  currentBounds():Bounds {
    if(!this.graph.nodes.length)return {x:0,y:0,width:1,height:1};
    let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
    this.graph.nodes.forEach((node,i)=>{
      if(this.depthScale[i]===0)return;
      const r=(node.radius+35)*this.depthScale[i];
      left=Math.min(left,this.projectedX[i]-r);right=Math.max(right,this.projectedX[i]+r);
      top=Math.min(top,this.projectedY[i]-r);bottom=Math.max(bottom,this.projectedY[i]+r);
    });
    return Number.isFinite(left)?{x:left,y:top,width:right-left,height:bottom-top}:{x:0,y:0,width:1,height:1};
  }
}
function wrap(value:number,min:number,max:number):number {const length=max-min;return ((value-min)%length+length)%length+min;}
export function fitCamera(bounds:Bounds,width:number,height:number):Camera {
  const scale=Math.max(.0001,Math.min((width-100)/bounds.width,(height-100)/bounds.height,1.5));
  return {scale,x:(width-bounds.width*scale)/2-bounds.x*scale,y:(height-bounds.height*scale)/2-bounds.y*scale};
}
export function pointerToWorld(clientX:number,clientY:number,rect:{left:number;top:number;width:number;height:number},width:number,height:number,camera:Camera) {
  return {x:((clientX-rect.left)*width/rect.width-camera.x)/camera.scale,
    y:((clientY-rect.top)*height/rect.height-camera.y)/camera.scale};
}
export function pick(sim:Simulation,x:number,y:number,visible:(index:number)=>boolean=()=>true,order:readonly number[]=[...sim.graph.order].sort((a,b)=>sim.z[a]-sim.z[b]||a-b)):number {
  for (let at=order.length-1;at>=0;at--) {
    const i=order[at];
    if (!visible(i)||sim.depthScale[i]===0) continue;
    const radius=(sim.graph.nodes[i].radius+21)*sim.depthScale[i];
    if ((x-sim.projectedX[i])**2+(y-sim.projectedY[i])**2<=radius**2) return i;
  }
  return -1;
}
export function segmentIntersectsRect(x1:number,y1:number,x2:number,y2:number,r:Bounds):boolean {
  let t0=0,t1=1;
  const dx=x2-x1,dy=y2-y1;
  
  for(let i=0;i<4;i++) {
    const p=i===0?-dx:i===1?dx:i===2?-dy:dy;
    const q=i===0?x1-r.x:i===1?r.x+r.width-x1:i===2?y1-r.y:r.y+r.height-y1;
    if(p===0) {if(q<0)return false;}
    else {const t=q/p;if(p<0)t0=Math.max(t0,t);else t1=Math.min(t1,t);if(t0>t1)return false;}
  }
  return true;
}
