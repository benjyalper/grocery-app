/**
 * api.js — frontend client for the Express/PostgreSQL backend
 *
 * Sends JWT in Authorization header for all authenticated requests.
 * Falls back gracefully if the API is unavailable.
 */

const BASE = '/api';

// ─── Token helpers ────────────────────────────────────────────
const TOKEN_KEY    = 'grocery-auth-token';
const USERNAME_KEY = 'grocery-auth-username';

export function getToken()    { return localStorage.getItem(TOKEN_KEY); }
export function getUsername() { return localStorage.getItem(USERNAME_KEY); }

export function saveAuth(token, username) {
  localStorage.setItem(TOKEN_KEY,    token);
  localStorage.setItem(USERNAME_KEY, username);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

// ─── Core fetch helper ────────────────────────────────────────
async function req(method, path, body, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
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

// ─── Items endpoints (all require auth) ───────────────────────
export async function apiGetItems()       { return req('GET',    '/items'); }
export async function apiUpsertItem(item) { return req('POST',   '/items', item); }
export async function apiDeleteItem(id)   { return req('DELETE', `/items/${id}`); }
export async function apiSeedItems(items) { return req('POST',   '/items/seed', items); }
