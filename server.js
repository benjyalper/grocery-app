/**
 * server.js — Express backend for grocery-app
 *
 * In production (Railway):
 *   - Connects to Railway PostgreSQL via DATABASE_URL
 *   - Serves the Vite build from /dist
 *   - Exposes /api/items REST endpoints
 *
 * In development:
 *   - Run alongside Vite dev server (Vite proxies /api here)
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const app  = express();
const PORT = process.env.PORT || 3007; // 3007 in dev; Railway overrides with PORT

// ─── Database ────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

// Create table if it doesn't exist (auto-migration on startup)
async function initDb() {
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
  console.log('✅ DB ready');
}

// ─── Middleware ───────────────────────────────────────────────
app.use(express.json());

// Serve built Vite files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));
}

// ─── API Routes ───────────────────────────────────────────────

// GET /api/items — return all items ordered by creation time
app.get('/api/items', async (req, res) => {
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

// POST /api/items — insert or update a single item (upsert)
app.post('/api/items', async (req, res) => {
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

// POST /api/items/seed — replace all items (used on reset)
app.post('/api/items/seed', async (req, res) => {
  const items = req.body; // array of items
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
app.delete('/api/items/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM grocery_items WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/items — clear all items
app.delete('/api/items', async (req, res) => {
  try {
    await pool.query('DELETE FROM grocery_items');
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback — send index.html for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

// ─── Start ────────────────────────────────────────────────────
initDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () =>
      console.log(`🚀 Server listening on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ Failed to init DB:', err.message);
    process.exit(1);
  });
