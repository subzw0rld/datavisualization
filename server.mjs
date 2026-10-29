import 'dotenv/config';
import http from 'node:http';
import {createDatabase} from './database.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||4173);
const host=process.env.HOST||'127.0.0.1';
const database=process.env.DATABASE_URL ? createDatabase(process.env.DATABASE_URL) : null;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.map':'application/json'};
const server=http.createServer(async(req,res)=>{
  try {
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname==='/api/datasets/team'||pathname==='/api/datasets/project') {
      if(!database){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Database is not configured.'}));return;}
      try {
        const data=await database.dataset(pathname.split('/').pop());
        res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
        res.end(req.method==='HEAD'?undefined:JSON.stringify(data));
      } catch(error) {console.error('Dataset query failed:',error.message);res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'Could not load data from the database.'}));}
      return;
    }
    // The visualization is a small client-side app. Serve its shell for each
    // view route so those URLs also work when opened or refreshed directly.
    const file=pathname==='/'||pathname==='/team-view'||pathname==='/project-view'?'/index.html':pathname;
    const full=path.resolve(root,'.'+file);
    const allowed=file==='/index.html'||file==='/styles.css'||file.startsWith('/assets/')||file.startsWith('/dist/');
    if(!allowed||!full.startsWith(root+path.sep)){res.writeHead(404);res.end('Not found');return;}
    const data=await fs.readFile(full);
    res.writeHead(200,{'Content-Type':types[path.extname(full)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:data);
  } catch {res.writeHead(404);res.end('Not found');}
});
server.listen(port,host,()=>console.log(`Orbit is running on ${host}:${port}`));
for(const signal of ['SIGINT','SIGTERM']) process.once(signal,()=>server.close(()=>{if(database)database.close().finally(()=>process.exit(0));else process.exit(0);}));
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
