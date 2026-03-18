/**
 * server.js — Express backend for grocery-app
 *
 * In production (Railway):
 *   - Connects to Railway PostgreSQL via DATABASE_URL env var
 *   - Serves the Vite build from /dist
 *   - Exposes /api/items REST endpoints
 *
 * If DATABASE_URL is not set the server still starts and serves
 * the frontend; API calls return 503 and the frontend falls back
 * to localStorage automatically.
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const app  = express();
const PORT = process.env.PORT || 3007;

// ─── Database (optional) ──────────────────────────────────────
let pool = null;
let dbReady = false;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  });
} else {
  console.warn('⚠️  DATABASE_URL not set — running without database (localStorage only)');
}

// Auto-create table on startup
async function initDb() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS grocery_items (
      id          TEXT PRIMARY KEY,
      name        TEXT        NOT NULL,
      quantity    INTEGER     NOT NULL DEFAULT 1,
      price       NUMERIC     NOT NULL DEFAULT 0,
      unit        TEXT        NOT NULL DEFAULT 'יח׳',
      completed   BOOLEAN     NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ          DEFAULT now()
    );
  `);
  dbReady = true;
  console.log('✅ DB ready');
}

// Middleware that rejects API calls when DB is unavailable
function requireDb(req, res, next) {
  if (!dbReady) {
    return res.status(503).json({ error: 'Database not available' });
  }
  next();
}

// ─── Middleware ───────────────────────────────────────────────
app.use(express.json());

// Serve built Vite files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));
}

// ─── API Routes ───────────────────────────────────────────────

// GET /api/items
app.get('/api/items', requireDb, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM grocery_items ORDER BY created_at ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/items — upsert one item
app.post('/api/items', requireDb, async (req, res) => {
  const { id, name, quantity, price, unit, completed } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO grocery_items (id, name, quantity, price, unit, completed)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         name      = EXCLUDED.name,
         quantity  = EXCLUDED.quantity,
         price     = EXCLUDED.price,
         unit      = EXCLUDED.unit,
         completed = EXCLUDED.completed
       RETURNING *`,
      [id, name, quantity, price, unit ?? 'יח׳', completed ?? false]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/items/seed — replace entire list
app.post('/api/items/seed', requireDb, async (req, res) => {
  const items = req.body;
  try {
    await pool.query('DELETE FROM grocery_items');
    for (const item of items) {
      await pool.query(
        `INSERT INTO grocery_items (id, name, quantity, price, unit, completed)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [item.id, item.name, item.quantity, item.price, item.unit ?? 'יח׳', item.completed ?? false]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/items/:id — remove one item
app.delete('/api/items/:id', requireDb, async (req, res) => {
  try {
    await pool.query('DELETE FROM grocery_items WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/items — clear all
app.delete('/api/items', requireDb, async (req, res) => {
  try {
    await pool.query('DELETE FROM grocery_items');
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback — must be last
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

// ─── Start (always, even without DB) ─────────────────────────
async function start() {
  try {
    await initDb();
  } catch (err) {
    console.error('⚠️  DB init failed:', err.message, '— continuing without DB');
  }

  app.listen(PORT, '0.0.0.0', () =>
    console.log(`🚀 Server listening on port ${PORT} | DB: ${dbReady ? 'connected' : 'offline'}`)
  );
}

start();
