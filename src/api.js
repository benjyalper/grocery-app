/**
 * api.js — frontend client for the Express/PostgreSQL backend
 *
 * Auth token is kept in MEMORY ONLY (not localStorage).
 * This means every new page load / link open requires a fresh sign-in.
 */

const BASE = '/api';

// ─── In-memory auth store (cleared on every page load) ────────
let _token    = null;
let _username = null;

export function getToken()    { return _token; }
export function getUsername() { return _username; }

export function saveAuth(token, username) {
  _token    = token;
  _username = username;
}

export function clearAuth() {
  _token    = null;
  _username = null;
}

// ─── Core fetch helper ────────────────────────────────────────
async function req(method, path, body, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && _token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.parse(text).error || text; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// ─── Auth endpoints ───────────────────────────────────────────
export async function apiRegister(username, password) {
  const data = await req('POST', '/auth/register', { username, password }, false);
  saveAuth(data.token, data.username);
  return data;
}

export async function apiLogin(username, password) {
  const data = await req('POST', '/auth/login', { username, password }, false);
  saveAuth(data.token, data.username);
  return data;
}

// ─── Normalise DB row: PostgreSQL returns NUMERIC as string ───
function normaliseItem(item) {
  return {
    ...item,
    price:    parseFloat(item.price)     || 0,
    quantity: parseInt(item.quantity, 10) || 0,
  };
}

// ─── Items endpoints (all require auth) ───────────────────────
export async function apiGetItems()           { return (await req('GET', '/items')).map(normaliseItem); }
export async function apiUpsertItem(item)     { return req('POST',   '/items',        item); }
export async function apiDeleteItem(id)       { return req('DELETE', `/items/${id}`); }
export async function apiSeedItems(items)     { return req('POST',   '/items/seed',   items); }
