import fs from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const execFileAsync=promisify(execFile);
const MAX_CLIENTS=20;

export function startHmr(app,root){
  const clients=new Set();
  let timer=null,running=false,queued=false;
  app.get('/__hmr',(_request,reply)=>{
    if(clients.size>=MAX_CLIENTS)return reply.code(503).send('Too many reload clients');
    reply.hijack();
    const response=reply.raw;
    response.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});
    response.write('retry: 1000\n\n');
    clients.add(response);
    response.on('close',()=>clients.delete(response));
  });
  const notify=()=>{for(const client of clients){try{client.write('event: reload\ndata: changed\n\n');}catch{clients.delete(client);}}};
  const rebuild=async()=>{
    if(running){queued=true;return;}
    running=true;
    try{await execFileAsync(process.execPath,['node_modules/typescript/bin/tsc','--pretty','false'],{cwd:root});notify();}
    catch(error){app.log.error({err:error},'HMR TypeScript build failed');}
    finally{running=false;if(queued){queued=false;void rebuild();}}
  };
  const watched=[path.join(root,'src'),path.join(root,'index.html'),path.join(root,'styles.css'),path.join(root,'assets')];
  const watchers=watched.map(target=>fs.watch(target,{recursive:true},(_,filename)=>{
    if(filename?.toString().includes('~'))return;
    clearTimeout(timer);
    timer=setTimeout(()=>filename?.toString().endsWith('.ts')?void rebuild():notify(),100);
  }));
  return ()=>{clearTimeout(timer);for(const watcher of watchers)watcher.close();for(const client of clients)client.end();clients.clear();};
}
