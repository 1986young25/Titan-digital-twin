import express from 'express';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import crypto from 'crypto';
import 'dotenv/config';

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Route example
  app.post('/api/auth/login', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      const dbUser = await getOrCreateUser(req.user.uid, req.user.email || '');
      res.json({ message: 'User synced successfully', user: dbUser });
    } catch (error: any) {
      console.error('Failed to sync user:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  // Titan Real-Time Streaming Endpoint (SSE)
  app.get('/api/stream/titan', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Initial state
    const nodes = {
      Alpha: { lat: 37.4221, lng: -122.0841, status: 'SECURE', health: 100 },
      Bravo: { lat: 37.4230, lng: -122.0830, status: 'SECURE', health: 100 },
      Sigma: { lat: 37.4215, lng: -122.0850, status: 'SECURE', health: 100 },
    };

    let operationsCount = 0;

    const interval = setInterval(() => {
      // Simulate micro-fracture detection and acoustic emissions
      const fractureDetected = Math.random() > 0.8;
      let acousticEvent = null;
      
      if (fractureDetected) {
        const nodeKeys = Object.keys(nodes) as (keyof typeof nodes)[];
        const affectedNode = nodeKeys[Math.floor(Math.random() * nodeKeys.length)];
        
        // Random slight degradation
        nodes[affectedNode].health = Math.max(0, nodes[affectedNode].health - (Math.random() * 2));
        
        if (nodes[affectedNode].health < 90) {
           nodes[affectedNode].status = 'WARNING';
        }

        acousticEvent = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          node: affectedNode,
          latencyUs: (240 + Math.random() * 5).toFixed(2),
          intensity: (Math.random() * 10).toFixed(2),
          frequencyHz: 3.69
        };
      }

      // Simulate cryptographic ledger operations
      operationsCount += Math.floor(Math.random() * 500) + 38000; // Simulated ops
      const stateHash = crypto.createHash('sha256').update(`${Date.now()}-${operationsCount}`).digest('hex');

      const payload = {
        timestamp: new Date().toISOString(),
        nodes,
        acousticEvent,
        ledger: {
          hash: stateHash,
          opsPerSec: operationsCount,
        }
      };

      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }, 1000); // 1Hz update rate for the UI

    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  });

  // Vite integration
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  const port = process.env.PORT || 3000;
  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer().catch((e) => console.error(e));
