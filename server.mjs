import 'dotenv/config';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import fs from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createDatabase} from './database.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||4173);
const host=process.env.HOST||'127.0.0.1';
const database=process.env.DATABASE_URL ? createDatabase(process.env.DATABASE_URL) : null;
const hmrClients=new Set();
const execFileAsync=promisify(execFile);
let watcher=null;
let reloadTimer=null;
let buildRunning=false;
let buildQueued=false;
export const app=Fastify({logger:true});

app.addHook('onSend',async(_request,reply,payload)=>{
  reply.header('X-Content-Type-Options','nosniff');
  return payload;
});
app.register(fastifyStatic,{root:path.join(root,'assets'),prefix:'/assets/',decorateReply:false,cacheControl:false});
app.register(fastifyStatic,{root:path.join(root,'dist'),prefix:'/dist/',decorateReply:false,cacheControl:false});
app.register(fastifyStatic,{root,prefix:'/',serve:false,decorateReply:true,cacheControl:false});

for(const name of ['team','project']) app.get(`/api/datasets/${name}`,async(_request,reply)=>{
  reply.header('Cache-Control','no-store');
  if(!database)return reply.code(503).send({error:'Database is not configured.'});
  try{return await database.dataset(name);}
  catch(error){app.log.error({err:error},'Dataset query failed');return reply.code(503).send({error:'Could not load data from the database.'});}
});
for(const route of ['/','/team-view','/project-view'])app.get(route,(_request,reply)=>reply.sendFile('index.html'));
app.get('/styles.css',(_request,reply)=>reply.sendFile('styles.css'));
app.get('/__hmr',(_request,reply)=>{
  reply.hijack();
  const response=reply.raw;
  response.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});
  response.write('retry: 1000\n\n');
  hmrClients.add(response);
  response.on('close',()=>hmrClients.delete(response));
});
function notifyReload(){for(const client of hmrClients){try{client.write('event: reload\\ndata: changed\\n\\n');}catch{hmrClients.delete(client);}}}
async function rebuildAndReload(){
  if(buildRunning){buildQueued=true;return;}
  buildRunning=true;
  try{await execFileAsync(process.execPath,['node_modules/typescript/bin/tsc','--pretty','false'],{cwd:root});notifyReload();}
  catch(error){app.log.error({err:error},'HMR TypeScript build failed');}
  finally{buildRunning=false;if(buildQueued){buildQueued=false;void rebuildAndReload();}}
}
function startHmr(){
  if(process.env.DEV_HMR==='0')return;
  const watched=[path.join(root,'src'),path.join(root,'index.html'),path.join(root,'styles.css'),path.join(root,'assets')];
  const changed=(filename)=>{
    if(filename?.toString().includes('~'))return;
    clearTimeout(reloadTimer);
    reloadTimer=setTimeout(()=>{
      if(filename?.toString().endsWith('.ts'))void rebuildAndReload();else notifyReload();
    },100);
  };
  watcher={close(){for(const item of watchers)item.close();}};
  const watchers=watched.map(target=>fs.watch(target,{recursive:true},(_,filename)=>changed(filename)));
}
app.addHook('onClose',async()=>{watcher?.close();clearTimeout(reloadTimer);for(const client of hmrClients)client.end();hmrClients.clear();if(database)await database.close();});
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{void app.close();});
  try{await app.listen({port,host});}
  catch(error){app.log.error(error);process.exitCode=1;}
  startHmr();
}
