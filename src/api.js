/**
 * api.js — frontend client for the Express/PostgreSQL backend
 *
 * In production:  calls /api/items  (same origin as the app)
 * In development: Vite proxies /api → http://localhost:3007
 *
 * Falls back gracefully if the API is unavailable
 * (e.g. running dev without the Express server).
 */

const BASE = '/api';

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Load all items from the database */
export async function apiGetItems()       { return req('GET',    '/items'); }

/** Insert or update a single item */
export async function apiUpsertItem(item) { return req('POST',   '/items', item); }

/** Delete a single item by id */
export async function apiDeleteItem(id)   { return req('DELETE', `/items/${id}`); }

/** Replace the entire list (used for reset) */
export async function apiSeedItems(items) { return req('POST',   '/items/seed', items); }
