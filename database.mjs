import pg from 'pg';

export function createDatabase(connectionString) {
  const pool = new pg.Pool({connectionString, connectionTimeoutMillis: 5000, max: 4});
  pool.on('error', error => console.error('Idle database connection failed:', error));
  return {
    async ping() { await pool.query('SELECT 1'); },
    async dataset(name) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN READ ONLY ISOLATION LEVEL REPEATABLE READ');
        const people = await client.query('SELECT "empID", name, desig, level, location, avatar, supervisor, "totalSupervisee", skill FROM "Employee" WHERE dataset = $1 ORDER BY "empID"', [name]);
        const skills = await client.query('SELECT id, skill, color FROM "Skill" ORDER BY id');
        const levels = await client.query('SELECT id, level, color FROM "Level" ORDER BY id');
        const locations = await client.query('SELECT id, location, color FROM "Location" ORDER BY id');
        await client.query('COMMIT');
        const lookup = (rows, field) => rows.map(row => ({id:String(row.id), label:row[field], color:row.color}));
        const locationEntries=lookup(locations.rows,'location');
        const knownLocations=new Set(locationEntries.map(item=>item.id));
        for(const p of people.rows) if(!knownLocations.has(String(p.location))) {
          locationEntries.push({id:String(p.location),label:`Unknown location (${p.location})`,color:'#647b87'});
          knownLocations.add(String(p.location));
        }
        return {name, people:people.rows.map(p => ({id:String(p.empID), name:p.name, title:p.desig, grade:p.level,
          locationId:String(p.location), avatar:p.avatar || 'avatar.png', parentId:p.supervisor ? String(p.supervisor) : null,
          reportedCount:p.totalSupervisee || 0, skills:(p.skill || []).map(s => ({id:String(s.id), levelId:String(s.level)}))})),
          skills:lookup(skills.rows,'skill'), levels:lookup(levels.rows,'level'), locations:locationEntries};
      } catch (error) { await client.query('ROLLBACK').catch(()=>{}); throw error; }
      finally { client.release(); }
    },
    close:()=>pool.end()
  };
}
