export interface Lookup { id: string; label: string; color: string }
export interface Person {
  id: string; name: string; title: string; grade: string; locationId: string;
  avatar: string; parentId: string | null; reportedCount: number;
  skills: {id: string; levelId: string}[];
}
export interface Dataset { name: string; people: Person[]; skills: Lookup[]; levels: Lookup[]; locations: Lookup[] }
export interface Node extends Person {
  parent: number; children: number[]; depth: number; radius: number;
  /** Relative volume at equal density: radius³ summed over this node's whole subtree. */
  systemMass:number;
  location: Lookup; resolvedSkills: {skill: Lookup; level: Lookup}[];
}
export interface Graph { name: string; nodes: Node[]; roots: number[]; order: number[]; byId: Map<string, number>; source: Dataset }
const radii: Record<string, number> = {'4A':60,'4B':55,'5A':50,'5B':45,'6A':40,'6B':35,'7A':30,'7B':25,'8A':20,'8B':15};
function invariant(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function lookups(items: Lookup[], name: string): Map<string, Lookup> {
  invariant(Array.isArray(items), `Missing ${name} lookup.`);
  const result = new Map<string, Lookup>();
  for (const item of items) {
    invariant(item && typeof item.id === 'string' && typeof item.label === 'string' && /^#[\da-f]{6}$/i.test(item.color), `Invalid ${name} entry.`);
    invariant(!result.has(item.id), `Duplicate ${name} ID: ${item.id}`);
    result.set(item.id, {...item});
  }
  return result;
}
export function normalize(input: unknown): Graph {
  invariant(input && typeof input === 'object', 'Expected a dataset object.');
  const source = structuredClone(input) as Dataset;
  invariant(typeof source.name === 'string' && Array.isArray(source.people), 'Missing dataset name or people.');
  const skills = lookups(source.skills,'skill'), levels = lookups(source.levels,'level'), locations = lookups(source.locations,'location');
  const byId = new Map<string, number>();
  const people = [...source.people].sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  const nodes: Node[] = people.map((p,index) => {
    invariant(p && typeof p.id === 'string' && p.id.length && !byId.has(p.id), `Missing or duplicate person ID: ${p?.id}`);
    invariant(typeof p.name === 'string' && typeof p.title === 'string', `Invalid name/title: ${p.id}`);
    invariant(p.parentId === null || typeof p.parentId === 'string', `Invalid supervisor: ${p.id}`);
    invariant(Number.isFinite(p.reportedCount) && p.reportedCount >= 0, `Invalid reported headcount: ${p.id}`);
    invariant(typeof p.avatar === 'string' && /^[\w.-]+$/.test(p.avatar), `Invalid avatar filename: ${p.id}`);
    invariant(radii[p.grade] && locations.has(p.locationId), `Unknown grade/location: ${p.id}`);
    invariant(Array.isArray(p.skills), `Missing skills: ${p.id}`);
    const resolvedSkills = p.skills.map(s => {
      invariant(s && skills.has(s.id) && levels.has(s.levelId), `Unknown skill/proficiency: ${p.id}`);
      return {skill:skills.get(s.id)!, level:levels.get(s.levelId)!};
    });
    byId.set(p.id,index);
    return {...p, parent:-1, children:[], depth:0, radius:radii[p.grade], systemMass:radii[p.grade]**3, location:locations.get(p.locationId)!, resolvedSkills};
  });
  const roots: number[] = [];
  nodes.forEach((node,index) => {
    if (node.parentId === null) roots.push(index);
    else {
      invariant(byId.has(node.parentId), `Missing supervisor ${node.parentId} for ${node.id}.`);
      node.parent = byId.get(node.parentId)!;
      nodes[node.parent].children.push(index);
    }
  });
  const order = [...roots];
  for (let head=0; head<order.length; head++) {
    const index=order[head];
    for (const child of nodes[index].children) { nodes[child].depth=nodes[index].depth+1; order.push(child); }
  }
  invariant(order.length === nodes.length, 'Reporting hierarchy contains a cycle.');
  // Reverse traversal counts every descendant once, regardless of input order or depth.
  for(let at=order.length-1;at>=0;at--) {
    const node=nodes[order[at]];
    if(node.parent>=0)nodes[node.parent].systemMass+=node.systemMass;
  }
  return {name:source.name,nodes,roots,order,byId,source};
}
