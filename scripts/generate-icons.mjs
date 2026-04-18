/**
 * Generate Highlight Sync extension icons at 16x16, 48x48, and 128x128.
 *
 * Design: A rounded-rect background with an indigo-to-violet gradient,
 * a stylized highlighter pen drawn diagonally, and a glowing highlight
 * stroke underneath it. The pen has a body, tip, and cap with subtle
 * depth cues.
 *
 * Uses only Node.js built-ins — outputs raw PNG via zlib deflate.
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

// ── Helpers ────────────────────────────────────────────────────────

function clamp(v, lo = 0, hi = 255) {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(c1, c2, t) {
  return [
    clamp(lerp(c1[0], c2[0], t)),
    clamp(lerp(c1[1], c2[1], t)),
    clamp(lerp(c1[2], c2[2], t)),
    clamp(lerp(c1[3], c2[3], t)),
  ];
}

/** Alpha-composite src over dst (both [r,g,b,a] with a in 0..255). */
function compositeOver(dst, src) {
  const sa = src[3] / 255;
  const da = dst[3] / 255;
  const outA = sa + da * (1 - sa);
  if (outA === 0) return [0, 0, 0, 0];
  return [
    clamp((src[0] * sa + dst[0] * da * (1 - sa)) / outA),
    clamp((src[1] * sa + dst[1] * da * (1 - sa)) / outA),
    clamp((src[2] * sa + dst[2] * da * (1 - sa)) / outA),
    clamp(outA * 255),
  ];
}

/** Distance from point (px,py) to the line segment (ax,ay)-(bx,by). */
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Rounded rect SDF (negative = inside). */
function roundedRectSDF(x, y, cx, cy, hw, hh, r) {
  const dx = Math.max(Math.abs(x - cx) - hw + r, 0);
  const dy = Math.max(Math.abs(y - cy) - hh + r, 0);
  return Math.hypot(dx, dy) - r;
}

/** SDF for an oriented capsule (line segment with radius). */
function capsuleSDF(px, py, ax, ay, bx, by, radius) {
  return distToSegment(px, py, ax, ay, bx, by) - radius;
}

/** SDF for a triangle defined by three points. */
function triangleSDF(px, py, v0x, v0y, v1x, v1y, v2x, v2y) {
  // Signed area test
  function sign(x1, y1, x2, y2, x3, y3) {
    return (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
  }
  const d1 = sign(px, py, v0x, v0y, v1x, v1y);
  const d2 = sign(px, py, v1x, v1y, v2x, v2y);
  const d3 = sign(px, py, v2x, v2y, v0x, v0y);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  if (!(hasNeg && hasPos)) return -1; // inside
  // Outside — approximate distance
  const e1 = distToSegment(px, py, v0x, v0y, v1x, v1y);
  const e2 = distToSegment(px, py, v1x, v1y, v2x, v2y);
  const e3 = distToSegment(px, py, v2x, v2y, v0x, v0y);
  return Math.min(e1, e2, e3);
}

// ── Icon rendering ─────────────────────────────────────────────────

function renderIcon(size) {
  const s = size; // alias
  const pixels = new Uint8Array(s * s * 4); // RGBA

  // Scale factor relative to 128
  const f = s / 128;

  // Colors
  const bgGrad1 = [79, 70, 229, 255];   // indigo-600
  const bgGrad2 = [139, 92, 246, 255];   // violet-500
  const bgGrad3 = [99, 102, 241, 255];   // indigo-500

  const highlightColor1 = [250, 204, 21, 220]; // yellow glow start
  const highlightColor2 = [251, 191, 36, 200]; // amber glow end

  const penBody1 = [255, 255, 255, 245]; // pen body light
  const penBody2 = [226, 232, 240, 245]; // pen body darker edge

  const penTip = [55, 48, 163, 255];     // indigo-800 nib
  const penCap = [199, 210, 254, 255];   // indigo-200 cap
  const penCapEdge = [165, 180, 252, 255]; // slightly darker cap edge

  const shadowColor = [30, 27, 75, 100]; // deep indigo shadow

  // Background rounded rect
  const bgRadius = Math.max(s * 0.22, 2);
  const bgHalf = s * 0.5;
  const bgInset = s * 0.02;

  // Highlight stroke: diagonal line from bottom-left to upper-right area
  const hlX1 = s * 0.18, hlY1 = s * 0.78;
  const hlX2 = s * 0.72, hlY2 = s * 0.28;
  const hlRadius = s * 0.065;

  // Pen body: diagonal, slightly offset from the highlight
  const penAngle = Math.atan2(hlY2 - hlY1, hlX2 - hlX1); // ~-45deg
  const penOffX = Math.cos(penAngle + Math.PI / 2) * s * 0.02;
  const penOffY = Math.sin(penAngle + Math.PI / 2) * s * 0.02;

  // Pen segments
  const penStartX = s * 0.22 + penOffX, penStartY = s * 0.75 + penOffY; // tip end
  const penEndX = s * 0.82 + penOffX, penEndY = s * 0.18 + penOffY;     // cap end
  const penBodyRadius = s * 0.052;

  // Pen tip (triangle from pen start going a bit beyond)
  const tipLen = s * 0.1;
  const tipDx = Math.cos(penAngle) * tipLen;
  const tipDy = Math.sin(penAngle) * tipLen;
  const tipPointX = penStartX - tipDx;
  const tipPointY = penStartY - tipDy;
  // Triangle sides perpendicular to pen
  const perpX = Math.cos(penAngle + Math.PI / 2) * penBodyRadius;
  const perpY = Math.sin(penAngle + Math.PI / 2) * penBodyRadius;
  const tipV1X = penStartX + perpX;
  const tipV1Y = penStartY + perpY;
  const tipV2X = penStartX - perpX;
  const tipV2Y = penStartY - perpY;

  // Cap region: last 15% of the pen body
  const capFrac = 0.82;
  const capStartX = lerp(penStartX, penEndX, capFrac);
  const capStartY = lerp(penStartY, penEndY, capFrac);

  // Sparkle positions (small diamond shapes for flair)
  const sparkles = [
    { x: s * 0.15, y: s * 0.35, r: s * 0.025 },
    { x: s * 0.82, y: s * 0.65, r: s * 0.02 },
    { x: s * 0.55, y: s * 0.14, r: s * 0.018 },
  ];

  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const idx = (y * s + x) * 4;
      const px = x + 0.5;
      const py = y + 0.5;

      // 1) Background rounded rect with gradient
      const bgSDF = roundedRectSDF(px, py, bgHalf, bgHalf, bgHalf - bgInset, bgHalf - bgInset, bgRadius);

      if (bgSDF > 1.5) {
        // Fully outside
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
        continue;
      }

      // Gradient: diagonal from top-left to bottom-right with a middle color
      const gradT = (px + py) / (s * 2);
      let bg;
      if (gradT < 0.5) {
        bg = lerpColor(bgGrad1, bgGrad2, gradT * 2);
      } else {
        bg = lerpColor(bgGrad2, bgGrad3, (gradT - 0.5) * 2);
      }

      // Edge anti-aliasing for background
      if (bgSDF > -1.5) {
        const aa = clamp((1.5 - bgSDF) / 3 * 255, 0, 255);
        bg = [bg[0], bg[1], bg[2], clamp((bg[3] / 255) * aa)];
      }

      let pixel = bg;

      // 2) Subtle inner shadow at edges (vignette)
      const innerDist = roundedRectSDF(px, py, bgHalf, bgHalf, bgHalf - bgInset - s * 0.08, bgHalf - bgInset - s * 0.08, bgRadius * 0.8);
      if (innerDist > 0) {
        const vigT = Math.min(innerDist / (s * 0.12), 1);
        const darkened = [
          clamp(pixel[0] * (1 - vigT * 0.15)),
          clamp(pixel[1] * (1 - vigT * 0.15)),
          clamp(pixel[2] * (1 - vigT * 0.15)),
          pixel[3],
        ];
        pixel = darkened;
      }

      // 3) Yellow highlight stroke (glow effect)
      const hlDist = distToSegment(px, py, hlX1, hlY1, hlX2, hlY2);
      // Glow aura
      const glowRadius = hlRadius * 3.5;
      if (hlDist < glowRadius) {
        const glowT = 1 - hlDist / glowRadius;
        const glowAlpha = clamp(glowT * glowT * 60);
        const glowColor = [250, 204, 21, glowAlpha];
        pixel = compositeOver(pixel, glowColor);
      }
      // Core highlight
      if (hlDist < hlRadius + 1) {
        const hlT = distToSegment(px, py, hlX1, hlY1, hlX2, hlY2);
        const lineT = (() => {
          const dx = hlX2 - hlX1, dy = hlY2 - hlY1;
          const lenSq = dx * dx + dy * dy;
          return Math.max(0, Math.min(1, ((px - hlX1) * dx + (py - hlY1) * dy) / lenSq));
        })();
        const hlColor = lerpColor(highlightColor1, highlightColor2, lineT);
        const hlAA = clamp((hlRadius + 1 - hlT) / 2 * 255);
        const hlFinal = [hlColor[0], hlColor[1], hlColor[2], clamp(hlColor[3] * hlAA / 255)];
        pixel = compositeOver(pixel, hlFinal);
      }

      // 4) Pen shadow (slightly offset)
      const shadowOffX = s * 0.015;
      const shadowOffY = s * 0.02;
      const shadowDist = capsuleSDF(px - shadowOffX, py - shadowOffY, penStartX, penStartY, penEndX, penEndY, penBodyRadius + s * 0.008);
      if (shadowDist < 1) {
        const shadowAA = clamp((1 - shadowDist) * 255);
        const shadow = [shadowColor[0], shadowColor[1], shadowColor[2], clamp(shadowColor[3] * shadowAA / 255)];
        pixel = compositeOver(pixel, shadow);
      }

      // 5) Pen body (capsule shape)
      const penDist = capsuleSDF(px, py, penStartX, penStartY, penEndX, penEndY, penBodyRadius);
      if (penDist < 1.5) {
        // Gradient across pen width for 3D effect
        const perpDist = (() => {
          const dx = penEndX - penStartX, dy = penEndY - penStartY;
          const len = Math.hypot(dx, dy);
          const nx = -dy / len, ny = dx / len;
          return (px - penStartX) * nx + (py - penStartY) * ny;
        })();
        const widthT = (perpDist / penBodyRadius + 1) / 2; // 0..1 across pen width
        
        // Along-pen parameter
        const alongT = (() => {
          const dx = penEndX - penStartX, dy = penEndY - penStartY;
          const lenSq = dx * dx + dy * dy;
          return Math.max(0, Math.min(1, ((px - penStartX) * dx + (py - penStartY) * dy) / lenSq));
        })();

        let bodyColor;
        if (alongT > capFrac) {
          // Cap region
          const capT = widthT;
          bodyColor = lerpColor(penCap, penCapEdge, capT);
        } else {
          // Main body with cylindrical shading
          const shade = 0.6 + 0.4 * Math.sin(widthT * Math.PI);
          bodyColor = lerpColor(penBody2, penBody1, shade);
          // Subtle blue tint toward the tip
          if (alongT < 0.15) {
            bodyColor = lerpColor(
              [penTip[0], penTip[1], penTip[2], bodyColor[3]],
              bodyColor,
              alongT / 0.15
            );
          }
        }

        const penAA = clamp((1.5 - penDist) / 3 * 255);
        const penFinal = [bodyColor[0], bodyColor[1], bodyColor[2], clamp(bodyColor[3] * penAA / 255)];
        pixel = compositeOver(pixel, penFinal);
      }

      // 6) Pen tip triangle
      const tipSDF = triangleSDF(px, py, tipPointX, tipPointY, tipV1X, tipV1Y, tipV2X, tipV2Y);
      if (tipSDF < 1.5) {
        const tipAA = clamp((1.5 - tipSDF) / 3 * 255);
        // Gradient from dark tip to lighter toward body
        const tipAlongT = (() => {
          const dx = penStartX - tipPointX, dy = penStartY - tipPointY;
          const lenSq = dx * dx + dy * dy;
          return Math.max(0, Math.min(1, ((px - tipPointX) * dx + (py - tipPointY) * dy) / lenSq));
        })();
        const tipColor = lerpColor(
          [30, 27, 75, 255],    // very dark tip
          penTip,                // indigo body transition
          tipAlongT
        );
        const tipFinal = [tipColor[0], tipColor[1], tipColor[2], clamp(tipAA)];
        pixel = compositeOver(pixel, tipFinal);
      }

      // 7) Sparkle accents
      for (const sp of sparkles) {
        const spDist = Math.abs(px - sp.x) + Math.abs(py - sp.y); // diamond distance
        if (spDist < sp.r * 2) {
          const spT = 1 - spDist / (sp.r * 2);
          const spAlpha = clamp(spT * spT * 200);
          const sparkle = [255, 255, 255, spAlpha];
          pixel = compositeOver(pixel, sparkle);
        }
      }

      // 8) Subtle specular highlight on pen (thin bright line)
      if (penDist < 1.5) {
        const perpDist = (() => {
          const dx = penEndX - penStartX, dy = penEndY - penStartY;
          const len = Math.hypot(dx, dy);
          const nx = -dy / len, ny = dx / len;
          return (px - penStartX) * nx + (py - penStartY) * ny;
        })();
        const specPos = -penBodyRadius * 0.35;
        const specDist = Math.abs(perpDist - specPos);
        const specWidth = penBodyRadius * 0.15;
        if (specDist < specWidth) {
          const specT = 1 - specDist / specWidth;
          const specAlpha = clamp(specT * specT * 120);
          pixel = compositeOver(pixel, [255, 255, 255, specAlpha]);
        }
      }

      pixels[idx] = pixel[0];
      pixels[idx + 1] = pixel[1];
      pixels[idx + 2] = pixel[2];
      pixels[idx + 3] = pixel[3];
    }
  }

  return pixels;
}

// ── PNG encoder (minimal, valid) ───────────────────────────────────

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  // Signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT — filter each row with sub filter (1) for better compression
  const rowBytes = width * 4;
  const raw = Buffer.alloc((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOff = y * (rowBytes + 1);
    raw[rowOff] = 0; // filter: none (simplest)
    rgba.copy
      ? rgba.copy(raw, rowOff + 1, y * rowBytes, (y + 1) * rowBytes)
      : raw.set(rgba.subarray(y * rowBytes, (y + 1) * rowBytes), rowOff + 1);
  }
  const compressed = deflateSync(raw, { level: 9 });

  // IEND
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', iend),
  ]);
}

// ── Generate all sizes ─────────────────────────────────────────────

for (const size of [16, 48, 128]) {
  console.log(`Generating ${size}x${size} icon...`);
  const rgba = renderIcon(size);
  const buf = Buffer.from(rgba);
  const png = encodePNG(size, size, buf);
  const outPath = join(outDir, `icon-${size}.png`);
  writeFileSync(outPath, png);
  console.log(`  → ${outPath} (${png.length} bytes)`);
}

console.log('Done! Icons generated.');
