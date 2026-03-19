/**
 * server.js — Express backend for grocery-app
 * Multi-user: each user has their own isolated grocery list.
 *
 * Auth: JWT (HS256) via jsonwebtoken
 * Passwords: hashed with bcryptjs
 * DB: Railway PostgreSQL via DATABASE_URL
 */

import express         from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg              from 'pg';
import bcrypt          from 'bcryptjs';
import jwt             from 'jsonwebtoken';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const app  = express();
const PORT = process.env.PORT || 3007;

// JWT secret — set JWT_SECRET in Railway env vars; fallback for local dev only
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// ─── Database ─────────────────────────────────────────────────
let pool    = null;
let dbReady = false;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  });
} else {
  console.warn('⚠️  DATABASE_URL not set — running without database');
}

async function initDb() {
  if (!pool) return;

  // Users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      username    TEXT UNIQUE NOT NULL,
      password    TEXT        NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT now()
    );
  `);

  // Items table — now with user_id
  await pool.query(`
    CREATE TABLE IF NOT EXISTS grocery_items (
      id          TEXT    NOT NULL,
      user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name        TEXT    NOT NULL,
      quantity    INTEGER NOT NULL DEFAULT 1,
      price       NUMERIC NOT NULL DEFAULT 0,
      unit        TEXT    NOT NULL DEFAULT 'יח׳',
      completed   BOOLEAN NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ      DEFAULT now(),
      PRIMARY KEY (id, user_id)
    );
  `);

  dbReady = true;
  console.log('✅ DB ready');
}

// ─── Middleware ───────────────────────────────────────────────
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));
}

// Returns 503 when DB is not connected
function requireDb(req, res, next) {
  if (!dbReady) return res.status(503).json({ error: 'Database not available' });
  next();
}

// Verifies JWT and attaches req.userId
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'לא מחובר — יש להתחבר תחילה' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'פג תוקף ההתחברות — יש להתחבר מחדש' });
  }
}

// Helper: generate a short random ID
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Auth Routes ──────────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', requireDb, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'שם משתמש וסיסמה הם שדות חובה' });
  if (username.trim().length < 2)
    return res.status(400).json({ error: 'שם משתמש חייב להכיל לפחות 2 תווים' });
  if (password.length < 4)
    return res.status(400).json({ error: 'הסיסמה חייבת להכיל לפחות 4 תווים' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const id   = genId();
    await pool.query(
      'INSERT INTO users (id, username, password) VALUES ($1, $2, $3)',
      [id, username.trim(), hash]
    );
    const token = jwt.sign({ sub: id, username: username.trim() }, JWT_SECRET, { expiresIn: '90d' });
    res.json({ token, username: username.trim() });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'שם המשתמש כבר תפוס — נסה שם אחר' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', requireDb, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'שם משתמש וסיסמה הם שדות חובה' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username.trim()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)  return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });

    const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '90d' });
    res.json({ token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Items Routes (all require auth) ─────────────────────────

// GET /api/items
app.get('/api/items', requireDb, requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM grocery_items WHERE user_id = $1 ORDER BY created_at ASC',
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/items — upsert one item
app.post('/api/items', requireDb, requireAuth, async (req, res) => {
  const { id, name, quantity, price, unit, completed } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO grocery_items (id, user_id, name, quantity, price, unit, completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id, user_id) DO UPDATE SET
         name      = EXCLUDED.name,
         quantity  = EXCLUDED.quantity,
         price     = EXCLUDED.price,
         unit      = EXCLUDED.unit,
         completed = EXCLUDED.completed
       RETURNING *`,
      [id, req.userId, name, quantity, price, unit ?? 'יח׳', completed ?? false]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/items/seed — replace entire list for this user
app.post('/api/items/seed', requireDb, requireAuth, async (req, res) => {
  const items = req.body;
  try {
    await pool.query('DELETE FROM grocery_items WHERE user_id = $1', [req.userId]);
    for (const item of items) {
      await pool.query(
        `INSERT INTO grocery_items (id, user_id, name, quantity, price, unit, completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [item.id, req.userId, item.name, item.quantity, item.price, item.unit ?? 'יח׳', item.completed ?? false]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/items/:id
app.delete('/api/items/:id', requireDb, requireAuth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM grocery_items WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/items — clear all for this user
app.delete('/api/items', requireDb, requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM grocery_items WHERE user_id = $1', [req.userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

// ─── Start ────────────────────────────────────────────────────
async function start() {
  try {
    await initDb();
  } catch (err) {
    console.error('⚠️  DB init failed:', err.message, '— continuing without DB');
  }
  app.listen(PORT, '0.0.0.0', () =>
    console.log(`🚀 Server on port ${PORT} | DB: ${dbReady ? 'connected' : 'offline'}`)
  );
}

start();
