import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root = process.argv[2];
if (!root) throw new Error('Usage: node scripts/import-legacy-data.mjs <original-checkout>');
fs.mkdirSync('assets/data', {recursive: true});
fs.mkdirSync('assets/avatars', {recursive: true});
for (const [name, file] of [['project','particleData.js'], ['team','teamData.js']]) {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(root,'assets/js',file),'utf8'), context);
  const people = Object.values(context.data).map(p => ({
    id: String(p.empID), name:p.name, title:p.desig, grade:p.level,
    locationId:String(p.location), avatar:p.avatar || 'avatar.png',
    parentId:p.supervisor ? String(p.supervisor) : null,
    reportedCount:p.totalSupervisee || 0,
    skills:p.skill.map(s=>({id:String(s.id), levelId:String(s.level)}))
  }));
  const lookup = (source, field) => Object.entries(source).map(([id,v])=>({id,label:v[field],color:v.color}));
  const result = {name, people, skills:lookup(context.skillData,'skill'),
    levels:lookup(context.levelData,'level'), locations:lookup(context.locationData,'location')};
  fs.writeFileSync(`assets/data/${name}.json`, JSON.stringify(result,null,2)+'\n');
}
for (const name of ['avatar.png','me.png']) {
  fs.copyFileSync(path.join(root,'assets/images/emp-images',name), `assets/avatars/${name}`);
}
console.log('Imported both original datasets and two avatars. Unused email/client fields omitted.');
