import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const server = Fastify({
  logger: true
});

const isProd = process.env.NODE_ENV === 'production';
await server.register(cors, {
  origin: isProd ? (process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(',') : false) : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

// Register rate limiter for API endpoints (CR-04)
await server.register(rateLimit, {
  global: false
});

// Health check endpoint
server.get('/api/health', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'connected', timestamp: Date.now() };
  } catch (err) {
    return { status: 'error', database: 'disconnected', error: String(err) };
  }
});

interface SystemConfigMap {
  levelRadius?: Record<string, number>;
  orbitalDistance?: Record<string, number>;
  levelMass?: Record<string, number>;
  [key: string]: unknown;
}

// Metadata endpoint
server.get('/api/metadata', async (req, reply) => {
  const [skills, levels, locations, configs] = await Promise.all([
    prisma.skill.findMany({ orderBy: { id: 'asc' } }),
    prisma.level.findMany({ orderBy: { id: 'asc' } }),
    prisma.location.findMany({ orderBy: { id: 'asc' } }),
    prisma.systemConfig.findMany()
  ]);

  const skillCatalog: Record<string, { skill: string; color: string }> = {};
  for (const s of skills) {
    skillCatalog[s.id.toString()] = { skill: s.skill, color: s.color };
  }

  const levelCatalog: Record<string, { level: string; color: string }> = {};
  for (const l of levels) {
    levelCatalog[l.id.toString()] = { level: l.level, color: l.color };
  }

  const locationCatalog: Record<string, { location: string; color: string }> = {};
  for (const loc of locations) {
    locationCatalog[loc.id.toString()] = { location: loc.location, color: loc.color };
  }

  // Strictly typed SystemConfigMap (CR-23)
  const configMap: SystemConfigMap = {};
  for (const c of configs) {
    configMap[c.key] = c.value as any;
  }

  // Set Cache-Control header for metadata (1 minute freshness, allows 304 revalidation)
  reply.header('Cache-Control', 'public, max-age=60');

  return {
    skills: skillCatalog,
    levels: levelCatalog,
    locations: locationCatalog,
    configs: {
      levelRadius: (configMap['levelRadius'] as Record<string, number>) || {},
      orbitalDistance: (configMap['orbitalDistance'] as Record<string, number>) || {},
      levelMass: (configMap['levelMass'] as Record<string, number>) || {}
    }
  };
});

// Dataset endpoint: 'project' | 'team'
server.get<{ Params: { type: string } }>(
  '/api/datasets/:type',
  {
    schema: {
      params: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: ['project', 'team'] }
        }
      }
    }
  },
  async (req, reply) => {
    const datasetType = req.params.type;
    const employees = await prisma.employee.findMany({
      where: { dataset: datasetType }
    });

    const recordMap: Record<string, any> = {};
    for (const emp of employees) {
      recordMap[emp.empID.toString()] = {
        name: emp.name,
        empID: emp.empID,
        avatar: emp.avatar || '',
        location: emp.location,
        desig: emp.desig,
        level: emp.level,
        supervisor: emp.supervisor ?? undefined,
        totalSupervisee: emp.totalSupervisee,
        nucleus: emp.nucleus ?? false,
        email: emp.email ?? undefined,
        client: (emp.client as string[]) || [],
        skill: (emp.skill as Array<{ id: number; level: number }>) || []
      };
    }

    return recordMap;
  }
);

// Single employee detail
server.get<{ Params: { empID: string } }>(
  '/api/employees/:empID',
  {
    schema: {
      params: {
        type: 'object',
        required: ['empID'],
        properties: {
          empID: { type: 'string', pattern: '^[0-9]+$' }
        }
      }
    }
  },
  async (req, reply) => {
    const empID = Number(req.params.empID);
    const emp = await prisma.employee.findFirst({
      where: { empID }
    });

    if (!emp) {
      return reply.status(404).send({ error: `Employee ${empID} not found` });
    }

    return emp;
  }
);

interface EmployeePayload {
  empID?: number | string;
  name?: string;
  dataset?: string;
  avatar?: string;
  location?: number | string;
  desig?: string;
  level?: string;
  supervisor?: number | string | null;
  totalSupervisee?: number | string;
  nucleus?: boolean;
  email?: string | null;
  client?: string[];
  skill?: Array<{ id: number; level: number }>;
}

// Create employee (CR-04: Schema validation, rate limiting, and 409 Conflict instead of silent upsert overwrite)
server.post<{ Body: EmployeePayload }>(
  '/api/employees',
  {
    config: {
      rateLimit: {
        max: 60,
        timeWindow: '1 minute'
      }
    },
    schema: {
      body: {
        type: 'object',
        required: ['empID', 'name', 'dataset'],
        properties: {
          empID: { type: ['integer', 'string'], minLength: 1 },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          dataset: { type: 'string', enum: ['project', 'team'] },
          avatar: { type: 'string', maxLength: 255 },
          location: { type: ['integer', 'string'] },
          desig: { type: 'string', maxLength: 100 },
          level: { type: 'string', maxLength: 10 },
          supervisor: { type: ['integer', 'string', 'null'] },
          totalSupervisee: { type: ['integer', 'string'] },
          nucleus: { type: 'boolean' },
          email: { type: ['string', 'null'], maxLength: 150 },
          client: { type: 'array', items: { type: 'string', maxLength: 100 } },
          skill: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'level'],
              properties: {
                id: { type: 'integer' },
                level: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  },
  async (req, reply) => {
    const body = req.body;
    const empID = Number(body.empID);
    const dataset = body.dataset!;

    if (isNaN(empID) || empID <= 0) {
      return reply.status(400).send({ error: 'empID must be a positive integer' });
    }

    // Check if record already exists to maintain RESTful semantics (CR-04)
    const existing = await prisma.employee.findUnique({
      where: {
        empID_dataset: {
          empID,
          dataset
        }
      }
    });

    if (existing) {
      return reply.status(409).send({
        error: `Employee record with empID ${empID} already exists in dataset '${dataset}'. Use PUT /api/employees/${empID} to update.`
      });
    }

    const created = await prisma.employee.create({
      data: {
        empID,
        dataset,
        name: body.name!,
        avatar: body.avatar || '',
        location: Number(body.location || 1),
        desig: body.desig || 'Team Member',
        level: body.level || '6A',
        supervisor: body.supervisor ? Number(body.supervisor) : null,
        totalSupervisee: Number(body.totalSupervisee || 0),
        nucleus: Boolean(body.nucleus),
        email: body.email || null,
        client: body.client || [],
        skill: body.skill || []
      }
    });

    return reply.status(201).send(created);
  }
);

// Update employee (CR-04: Schema validation, rate limiting)
server.put<{ Params: { empID: string }; Body: EmployeePayload }>(
  '/api/employees/:empID',
  {
    config: {
      rateLimit: {
        max: 60,
        timeWindow: '1 minute'
      }
    },
    schema: {
      params: {
        type: 'object',
        required: ['empID'],
        properties: {
          empID: { type: 'string', pattern: '^[0-9]+$' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', maxLength: 100 },
          dataset: { type: 'string', enum: ['project', 'team'] },
          avatar: { type: 'string', maxLength: 255 },
          location: { type: ['integer', 'string'] },
          desig: { type: 'string', maxLength: 100 },
          level: { type: 'string', maxLength: 10 },
          supervisor: { type: ['integer', 'string', 'null'] },
          totalSupervisee: { type: ['integer', 'string'] },
          nucleus: { type: 'boolean' },
          email: { type: ['string', 'null'], maxLength: 150 },
          client: { type: 'array', items: { type: 'string', maxLength: 100 } },
          skill: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'level'],
              properties: {
                id: { type: 'integer' },
                level: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  },
  async (req, reply) => {
    const empID = Number(req.params.empID);
    const body = req.body;
    const dataset = body.dataset || 'team';

    const updated = await prisma.employee.updateMany({
      where: { empID, dataset },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.avatar !== undefined && { avatar: body.avatar }),
        ...(body.location && { location: Number(body.location) }),
        ...(body.desig && { desig: body.desig }),
        ...(body.level && { level: body.level }),
        ...(body.supervisor !== undefined && { supervisor: body.supervisor ? Number(body.supervisor) : null }),
        ...(body.totalSupervisee !== undefined && { totalSupervisee: Number(body.totalSupervisee) }),
        ...(body.nucleus !== undefined && { nucleus: Boolean(body.nucleus) }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.client !== undefined && { client: body.client }),
        ...(body.skill !== undefined && { skill: body.skill })
      }
    });

    if (updated.count === 0) {
      return reply.status(404).send({ error: 'Employee record not found for update' });
    }

    return { success: true, count: updated.count };
  }
);

// Delete employee (CR-04: Schema validation, rate limiting)
server.delete<{ Params: { empID: string }; Querystring: { dataset?: string } }>(
  '/api/employees/:empID',
  {
    config: {
      rateLimit: {
        max: 60,
        timeWindow: '1 minute'
      }
    },
    schema: {
      params: {
        type: 'object',
        required: ['empID'],
        properties: {
          empID: { type: 'string', pattern: '^[0-9]+$' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          dataset: { type: 'string', enum: ['project', 'team'] }
        }
      }
    }
  },
  async (req, reply) => {
    const empID = Number(req.params.empID);
    const dataset = req.query.dataset;

    const deleted = await prisma.employee.deleteMany({
      where: {
        empID,
        ...(dataset ? { dataset } : {})
      }
    });

    return { success: true, count: deleted.count };
  }
);

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

try {
  await server.listen({ port: PORT, host: HOST });
  console.log(`🚀 Particle Visualizer Backend ready at http://localhost:${PORT}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
