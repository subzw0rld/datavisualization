import type {Graph} from './model.js';
/** Search metadata is built once per dataset; pages bound DOM and accessibility work. */
export class DirectoryIndex {
  readonly order:number[];
  private search:string[];
  readonly pageSize=60;
  constructor(private graph:Graph) {
    this.order=graph.nodes.map((_,i)=>i).sort((a,b)=>graph.nodes[a].name.localeCompare(graph.nodes[b].name));
    this.search=graph.nodes.map(n=>[n.name,n.title,n.grade,...n.resolvedSkills.map(s=>s.skill.label)].join(' ').toLocaleLowerCase());
  }
  match(query:string,location:string):number[] {
    query=query.toLocaleLowerCase().trim();
    return this.order.filter(i=>(!location||this.graph.nodes[i].locationId===location)&&(!query||this.search[i].includes(query)));
  }
  page(matches:number[],page:number):number[] {return matches.slice(page*this.pageSize,(page+1)*this.pageSize);}
}
