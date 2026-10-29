// Read-only probes of the original source. Canvas/DOM stubs count calls; they do
// not measure browser rendering performance or emulate image decoding.
// Usage: node reports/audit-particle-system.mjs /path/to/datavisualization
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = process.argv[2];
if (!root) throw new Error('Pass the path to the original repository.');
const read = name => fs.readFileSync(path.join(root, 'assets/js', name), 'utf8');
function boot(file) {
  const calls = {}, invalid = [], listeners = new Map(), elements = new Map();
  let images = 0;
  const context = {};
  for (const op of ['beginPath','closePath','moveTo','lineTo','stroke','arc','fill','drawImage','clearRect']) {
    context[op] = (...args) => {
      calls[op] = (calls[op] || 0) + 1;
      if (args.some(v => typeof v === 'number' && !Number.isFinite(v))) invalid.push(op);
    };
  }
  function element(key) {
    if (!elements.has(key)) elements.set(key, {
      classList: { add() {}, remove() {}, contains() { return false; } },
      parentElement: { classList: { add() {}, remove() {}, contains() { return false; } } },
      addEventListener(type, fn) { listeners.set(`${key}:${type}`, fn); },
      getContext() { return context; }, setAttribute() {}, textContent: ''
    });
    return elements.get(key);
  }
  const scope = vm.createContext({
    document: { querySelector: element, getElementById: element },
    window: { innerWidth: 1280, innerHeight: 720, requestAnimationFrame() {} },
    Image: class { constructor(w,h) { this.width=w; this.height=h; images++; } },
    console: { log() { calls.log=(calls.log||0)+1; } }
  });
  vm.runInContext('Math.random = () => 0.75;', scope);
  vm.runInContext(read('Util.js'), scope);
  vm.runInContext(read(file), scope);
  const raw = JSON.parse(JSON.stringify(scope.data));
  vm.runInContext(read('particle-system.js'), scope);
  return {scope, raw, calls, invalid, listeners, elements, images};
}
function inspect(file) {
  const h = boot(file), {scope:s, raw} = h;
  const records = Object.values(raw), ids = Object.keys(raw);
  const roots = records.filter(x => !x.supervisor);
  const edges = records.filter(x => x.supervisor);
  const children = Object.fromEntries(ids.map(id => [id, []]));
  for (const n of edges) children[n.supervisor]?.push(n.empID);
  const bad = () => Object.values(s.data).filter(n => !Number.isFinite(n.x) || !Number.isFinite(n.y)).map(n=>n.empID);
  const firstFrameInvalidIds = bad();
  const firstCalls = {...h.calls};
  const firstFrameNonfiniteDrawCalls = h.invalid.length;
  const mismatches = records.filter(n => (n.totalSupervisee || 0) !== children[n.empID].length)
    .map(n=>({id:n.empID, declared:n.totalSupervisee||0, actual:children[n.empID].length}));
  const missingParents = edges.filter(n=>!raw[n.supervisor]).map(n=>n.empID);
  const missingLookups = records.filter(n=>!s.config[n.level] || (n.supervisor&&!s.obitalDistance[n.level]) || !s.locationData[n.location] || n.skill.some(k=>!s.skillData[k.id]||!s.levelData[k.level])).map(n=>n.empID);
  const cycles = [];
  for (const n of records) {
    const seen = new Set(); let current=n;
    while(current) {
      if(seen.has(current.empID)) {cycles.push(n.empID); break;}
      seen.add(current.empID); current=raw[current.supervisor];
    }
  }
  const beforeParent = edges.filter(n=>ids.indexOf(String(n.empID))<ids.indexOf(String(n.supervisor))).map(n=>n.empID);
  const rootPositions = roots.map(n=>({id:n.empID,x:s.data[n.empID].x,y:s.data[n.empID].y}));
  s.particleSystem.animate();
  const secondFrameInvalidIds = bad();
  const rootMotion = rootPositions.map(n=>({id:n.id, dx:s.data[n.id].x-n.x,dy:s.data[n.id].y-n.y}));
  const sourceMutated = typeof s.data[ids[0]].location !== 'number';
  assert.equal(s.particleSystem.data, s.data);
  let reinitError = null;
  try { s.particleSystem.init(); s.particleSystem.drawParticle(); }
  catch(e) { reinitError = `${e.name}: ${e.message}`; }
  const motion = [60,120,144].map(frames => {
    const t=boot(file), child=Object.values(t.scope.data).find(n=>n.supervisor);
    const initial=t.scope.particleSystem.thetaArr[child.empID];
    for(let i=0;i<frames;i++) t.scope.particleSystem.animate();
    return {frames, radians:Number((t.scope.particleSystem.thetaArr[child.empID]-initial).toFixed(6))};
  });
  const c=boot(file), chosen=Object.values(c.scope.data)[0];
  for(const n of Object.values(c.scope.data)) {n.x=10000;n.y=10000;}
  chosen.x=100; chosen.y=100;
  const click=c.listeners.get('particleContainer:click');
  click({clientX:400,clientY:100});
  const translatedClickHits = c.scope.particleSelected===chosen.empID;
  click({clientX:100,clientY:100});
  const unshiftedClickHits = c.scope.particleSelected===chosen.empID;
  assert.equal(unshiftedClickHits,true); assert.equal(translatedClickHits,false);
  return {
    dataset:file, nodes:records.length, roots:roots.length, edges:edges.length,
    skillEntries:records.reduce((a,n)=>a+n.skill.length,0),
    avatarURLs:[...new Set(records.map(n=>n.avatar||'avatar.png'))],
    imageObjects:h.images, missingParents, missingLookups, cycles,
    declaredChildCountMismatches:mismatches, childEnumeratedBeforeParent:beforeParent,
    firstFrameInvalidIds, secondFrameInvalidIds, firstDrawCalls:firstCalls,
    firstFrameNonfiniteDrawCalls, sourceMutated, reinitError,
    rootMotionAfterOneFrame:rootMotion, frameRateProbe:motion,
    translatedClickHits, unshiftedClickHits
  };
}
const datasets=['particleData.js','teamData.js'].map(inspect);
assert.equal(datasets[0].nodes,6);
assert.ok(datasets.every(d=>d.reinitError && d.sourceMutated));
assert.ok(datasets[1].firstFrameInvalidIds.length>0);
assert.equal(datasets[1].secondFrameInvalidIds.length,0);
process.stdout.write(JSON.stringify({
  commit:execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  runtime:process.version,
  method:'Original scripts executed in Node vm with deterministic random=0.75, 1280x720 viewport and stub DOM/Canvas/Image. Operation counts and logic checks only, not FPS or GPU measurements.',
  datasets
},null,2)+'\n');
