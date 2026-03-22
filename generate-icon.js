/**
 * generate-icon.js
 * Draws a grocery cart icon in pure Node.js — no npm packages needed.
 * Outputs: public/apple-touch-icon.png (180px), public/icon-192.png, public/icon-512.png
 *
 * Run: node generate-icon.js
 * Also called automatically via "prebuild" in package.json
 */

import { deflateSync }                        from 'zlib';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname }                       from 'path';
import { fileURLToPath }                       from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC    = join(__dirname, 'public');

if (!existsSync(PUBLIC)) mkdirSync(PUBLIC);

// ─── Minimal PNG encoder (no dependencies) ───────────────────

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
}

function pngChunk(type, data) {
  const t   = Buffer.from(type, 'ascii');
  const crc = u32(crc32(Buffer.concat([t, data])));
  return Buffer.concat([u32(data.length), t, data, crc]);
}

function encodePNG(width, height, pixels /* Uint8Array RGBA */) {
  // Build raw scanlines: 1 filter byte + RGBA per pixel
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter = None
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 4;
      const d = y * (1 + width * 4) + 1 + x * 4;
      raw[d] = pixels[s]; raw[d+1] = pixels[s+1];
      raw[d+2] = pixels[s+2]; raw[d+3] = pixels[s+3];
    }
  }
  const ihdr = Buffer.concat([u32(width), u32(height),
    Buffer.from([8, 6, 0, 0, 0])]); // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Drawing helpers ──────────────────────────────────────────

function makeCanvas(W, H) {
  const px = new Uint8Array(W * H * 4);
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = (Math.round(y) * W + Math.round(x)) * 4;
    px[i] = r; px[i+1] = g; px[i+2] = b; px[i+3] = a;
  };
  const rect = (x, y, w, h, r, g, b) => {
    for (let py = y; py < y + h; py++)
      for (let px2 = x; px2 < x + w; px2++)
        set(px2, py, r, g, b);
  };
  const circle = (cx, cy, radius, r, g, b) => {
    const r2 = radius * radius;
    for (let dy = -radius; dy <= radius; dy++)
      for (let dx = -radius; dx <= radius; dx++)
        if (dx*dx + dy*dy <= r2) set(cx+dx, cy+dy, r, g, b);
  };
  return { px, set, rect, circle };
}

// ─── Grocery cart icon ────────────────────────────────────────
// Draws on a SIZE×SIZE canvas.
// Design: green background + white shopping cart.

function drawGroceryIcon(SIZE) {
  const { px, rect, circle } = makeCanvas(SIZE, SIZE);
  const s = SIZE / 180; // scale factor relative to 180px reference

  // ── Background: grocery green ──
  const [BR, BG, BB] = [22, 163, 74]; // #16a34a
  rect(0, 0, SIZE, SIZE, BR, BG, BB);

  // Slightly darker rounded corner hint (4 corner squares)
  const [DR, DG, DB] = [17, 127, 58]; // darker green
  const cr = Math.round(22 * s);
  for (let y = 0; y < cr; y++)
    for (let x = 0; x < cr; x++) {
      const dx = cr - x, dy = cr - y;
      if (dx*dx + dy*dy > cr*cr) {
        // top-left
        const i0 = (y * SIZE + x) * 4;
        px[i0]=DR; px[i0+1]=DG; px[i0+2]=DB; px[i0+3]=255;
        // top-right
        const x2 = SIZE-1-x;
        const i1 = (y * SIZE + x2) * 4;
        px[i1]=DR; px[i1+1]=DG; px[i1+2]=DB; px[i1+3]=255;
        // bottom-left
        const y2 = SIZE-1-y;
        const i2 = (y2 * SIZE + x) * 4;
        px[i2]=DR; px[i2+1]=DG; px[i2+2]=DB; px[i2+3]=255;
        // bottom-right
        const i3 = (y2 * SIZE + x2) * 4;
        px[i3]=DR; px[i3+1]=DG; px[i3+2]=DB; px[i3+3]=255;
      }
    }

  const W = 255, GN = 255, WB = 255; // white

  // ── Cart handle: horizontal bar ──
  const hx = Math.round(54*s), hy = Math.round(42*s);
  const hw = Math.round(76*s), hh = Math.round(11*s);
  rect(hx, hy, hw, hh, W, GN, WB);

  // ── Cart handle: left vertical stem ──
  const sx = hx, sy = hy + hh;
  const sw = Math.round(11*s), sh = Math.round(28*s);
  rect(sx, sy, sw, sh, W, GN, WB);

  // ── Cart body (basket) ──
  const bx = Math.round(28*s), by = Math.round(70*s);
  const bw = Math.round(126*s), bh = Math.round(65*s);
  rect(bx, by, bw, bh, W, GN, WB);

  // Inner cutout → makes it look like an open basket
  const ix = Math.round(42*s), iy = Math.round(83*s);
  const iw = Math.round(98*s), ih = Math.round(42*s);
  rect(ix, iy, iw, ih, BR, BG, BB);

  // ── Cart base bar ──
  rect(bx, by + bh, bw, Math.round(9*s), W, GN, WB);

  // ── Wheels ──
  const wr = Math.round(14*s);
  circle(Math.round(55*s),  Math.round(156*s), wr, W, GN, WB);
  circle(Math.round(125*s), Math.round(156*s), wr, W, GN, WB);

  // Wheel hubs (small green circles)
  const hr = Math.round(5*s);
  circle(Math.round(55*s),  Math.round(156*s), hr, BR, BG, BB);
  circle(Math.round(125*s), Math.round(156*s), hr, BR, BG, BB);

  return { px, W: SIZE, H: SIZE };
}

// ─── Generate & save ─────────────────────────────────────────

const sizes = [
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png',         size: 192 },
  { file: 'icon-512.png',         size: 512 },
];

for (const { file, size } of sizes) {
  const { px, W, H } = drawGroceryIcon(size);
  const png = encodePNG(W, H, px);
  writeFileSync(join(PUBLIC, file), png);
  console.log(`✅ Generated public/${file} (${size}×${size}, ${(png.length/1024).toFixed(1)} KB)`);
}
