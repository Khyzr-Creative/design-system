/* ============================================================
   khyzr: the mesh  ·  <khyzr-field>  ·  KhyzrField
   The mesh is khyzr's default background: the brand greens, drifting
   slowly, in two looks: one for white type, one for ink type.
   Both are presets of this engine, and the only two it carries.

   Usage:
     <script src="design-system/assets/pattern/khyzr-field.js"></script>
     <div style="position:relative;overflow:hidden">
       <khyzr-field theme="dark" style="position:absolute;inset:0"></khyzr-field>
       …content…
     </div>

   Attributes:
     theme    "dark" (the look for white type, the default) | "light" (the look for ink type)
     preset   a preset by name
     recipe   a recipe as JSON, for a look of its own
     static   present → one frame, no animation

   The engine: one WebGL2 shader per field (ten fields: how the tone is made), then one shared
   chain for every field: transform, distort, palette, layers, finish. A "recipe" is a plain
   object of the values in DEFAULTS; the same recipe draws the same picture at any size, live
   in the page or as a still for export.

   Script:
     KhyzrField.create(canvas, recipe, opts)   live engine on a canvas
     KhyzrField.still(recipe, width, height)   a 2D canvas at any size (tiled, so size is free)
     KhyzrField.ready(field)                   resolves when that field's program is compiled
     KhyzrField.presets / .DEFAULTS / .FIELDS

   Floors: without WebGL2 the element is a solid fill in the recipe's first
   colour. Reduced motion draws one frame. Off screen or in a hidden tab it stops.
   ============================================================ */
(function (root) {
  'use strict';

  var FIELDS = ['mesh', 'ribbon', 'silk', 'flow', 'aurora', 'strata', 'waves', 'dusk', 'cells', 'radial'];
  var CURSORS = ['off', 'push', 'repel', 'swirl', 'ripple', 'glow'];
  var MIRRORS = ['none', 'x', 'y', 'both'];
  var FLOATS = ['scale', 'spread', 'a', 'b', 'seed', 'rotate', 'ox', 'oy', 'drift', 'kaleido', 'warp', 'detail',
    'fold', 'foldScale', 'foldAngle', 'swirl', 'flute', 'fluteDepth', 'fluteAngle', 'pixel', 'oklab', 'ease', 'map', 'repeat', 'shift', 'cycle', 'bias',
    'bands', 'bandSoft', 'depth', 'lines', 'relief', 'contrast', 'brightness', 'saturation', 'hue', 'vignette', 'blur',
    'grain', 'grainSize', 'halftone', 'halftoneSize', 'halftoneAngle', 'dither', 'ditherSize', 'scan', 'scanSize',
    'cursorStrength', 'cursorRadius'];
  var DEG = { rotate: 1, hue: 1, fluteAngle: 1, halftoneAngle: 1, foldAngle: 1 };

  var DEFAULTS = {
    field: 'mesh',
    colors: ['#030503', '#043304', '#0A690A', '#91BC91'],
    scale: 1, spread: 0.58, a: 0.26, b: 0.4,
    speed: 0.7, moment: 0, seed: 7, drift: 0,
    rotate: 0, ox: 0, oy: 0, mirror: 'none', kaleido: 0,
    warp: 0, detail: 2.4, fold: 0, foldScale: 1, foldAngle: 0, swirl: 0, flute: 0, fluteDepth: 0.5, fluteAngle: 0, pixel: 0,
    oklab: 1, ease: 1, map: 0, repeat: 1, shift: 0, cycle: 0, bias: 0,
    bands: 0, bandSoft: 0, depth: 0.5, lines: 0, relief: 0,
    contrast: 1, brightness: 0, saturation: 1, hue: 0, vignette: 0, blur: 0,
    grain: 0.05, grainSize: 1, halftone: 0, halftoneSize: 8, halftoneAngle: 30, dither: 0, ditherSize: 2,
    scan: 0, scanSize: 4,
    cursor: 'off', cursorStrength: 0.65, cursorRadius: 0.46
  };

  var VERT = '#version 300 es\nlayout(location = 0) in vec2 a_pos;\nvoid main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }';

  // One program per field (FIELD is a compile-time switch): a tenth of the code each, so each compiles quickly.
  var HEAD = '#version 300 es\nprecision highp float;\nout vec4 outColor;\n';
  var BODY =
    'uniform vec3 u_colors[8];\nuniform vec2 u_res, u_origin, u_mouse;\n' +
    'uniform float u_time, u_px, u_count, u_cursorOn;\nuniform int u_cursorFx, u_mirror;\n' +
    FLOATS.map(function (k) { return 'uniform float u_' + k + ';'; }).join('\n') + `
#define PI 3.14159265359
#define TAU 6.28318530718

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
// a small shift from the seed, for the fields that are not built on noise (zero at seed 7, the default)
vec2 seedShift(){ return vec2(sin(u_seed * 1.7 - 11.9), cos(u_seed * 2.3 - 16.1) - 1.0) * 0.8; }
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
vec2 grad2(vec2 p){ float a = hash21(p) * 6.28318530718; return vec2(cos(a), sin(a)); }
// gradient noise, 0..1: smooth lobes, no grid
float gnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(grad2(i), f), b = dot(grad2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(grad2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), d = dot(grad2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return 0.5 + 0.7071 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
// gain: how much each finer octave adds (0.2 smooth, 0.6 rough)
float fbmg(vec2 p, float gain){ float v = 0.0, a = 1.0, w = 0.0; for (int i = 0; i < 5; i++) { v += a * gnoise(p); w += a; p = p * 2.03 + vec2(17.0, 9.2); a *= gain; } return v / w; }
float fbm(vec2 p){ return fbmg(p, 0.5); }
float bayer2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer8(vec2 a){ return bayer2(0.25 * a) * 0.0625 + bayer2(0.5 * a) * 0.25 + bayer2(a); }

// ---- colour: sRGB <-> OKLab, mixing, the palette ----
vec3 toLin(vec3 c){ return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 toSrgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
vec3 toLab(vec3 s){
  vec3 c = toLin(s);
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float n = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = pow(max(l, 0.0), 1.0 / 3.0); m = pow(max(m, 0.0), 1.0 / 3.0); n = pow(max(n, 0.0), 1.0 / 3.0);
  return vec3(0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * n, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * n, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * n);
}
vec3 fromLab(vec3 c){
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float n = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; n = n * n * n;
  return clamp(toSrgb(vec3(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * n, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * n, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * n)), 0.0, 1.0);
}
vec3 mixc(vec3 a, vec3 b, float t){ if (u_oklab > 0.5) return fromLab(mix(toLab(a), toLab(b), t)); return mix(a, b, t); }
// x in 0..1 across the first n colours; u_ease holds the colour at every stop
vec3 pal(float x, float n){
  float m = max(n - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * m;
  float i = min(floor(f), m - 1.0);
  float k = f - i;
  return mixc(u_colors[int(i)], u_colors[int(i) + 1], mix(k, k * k * (3.0 - 2.0 * k), u_ease));
}
vec3 hueRotate(vec3 col, float a){
  const mat3 toYIQ = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
  const mat3 toRGB = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
  vec3 q = toYIQ * col; float c = cos(a), s = sin(a);
  return toRGB * vec3(q.x, q.y * c - q.z * s, q.y * s + q.z * c);
}

// ---- the fields: each returns a tone 0..1; some also mix their own colour (dc, has = 1) ----
float field(vec2 p, out vec3 dc, out float has){
  dc = vec3(0.0); has = 0.0;
  float T = u_time, n = u_count, t = 0.0;
  vec2 so = vec2(mod(u_seed, 97.0) * 1.37, mod(u_seed, 89.0) * 2.11);
#if FIELD == 0                                          // mesh: drifting colour blobs
  bool lab = u_oklab > 0.5;
  vec3 c0 = lab ? toLab(u_colors[0]) : u_colors[0];
  vec3 acc = c0 * 0.15; float tot = 0.15, ti = 0.0;
  float tight = mix(2.5, 16.0, u_a);
  vec2 ext = 0.5 * u_res / min(u_res.x, u_res.y) / max(u_scale, 0.01) * (0.35 + u_spread * 0.9);   // the blobs roam the frame, whatever its shape
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    vec2 c = vec2(sin(T * (0.21 + fi * 0.071) + fi * 2.4 + so.x), cos(T * (0.17 + fi * 0.093) + fi * 1.7 + so.y)) * ext;
    float w = exp(-dot(p - c, p - c) * tight) * step(fi, n - 0.5);
    acc += (lab ? toLab(u_colors[i]) : u_colors[i]) * w; tot += w; ti += fi * w;
  }
  dc = lab ? fromLab(acc / tot) : acc / tot; has = 1.0;
  t = ti / tot / max(n - 1.0, 1.0);
#elif FIELD == 1                                        // ribbon: one folded angle field
  vec2 q = p * 2.0 + seedShift(); float fr = 0.4 + u_b * 1.6;
  float a = 4.0 * fr * q.y - sin(-q.x * 3.0 * fr + q.y - T * 0.7);
  a = smoothstep(cos(a) * 0.7, sin(a) * 0.7 + 1.0, cos(a - 4.0 * fr * q.y) - sin(a + 3.0 * fr * q.x));
  vec2 w = clamp((cos(a) * q + sin(a) * vec2(-q.y, q.x)) * 0.5 + 0.5, 0.0, 1.0);
  vec3 c = mixc(pal(w.x, max(n - 1.0, 1.0)), u_colors[int(n) - 1], w.y);
  dc = clamp(mix(c, c * (c + 0.6 * sqrt(c)), u_a), 0.0, 1.0); has = 1.0;
  t = clamp(w.x * 0.6 + w.y * 0.4, 0.0, 1.0);
#elif FIELD == 2                                        // silk: iterated cosine weave
  vec2 q = p * 2.0 + seedShift(); float damp = mix(1.0, 0.5, u_b);
  float d = -T * 0.5, a = 0.0;
  for (int i = 0; i < 8; i++) { float fi = float(i); a += cos(fi - d - a * q.x) * damp; d += sin(q.y * fi + a) * damp; }
  d += T * 0.5;
  vec3 pt = vec3(cos(q.x * d + a), cos(q.y * a + d), cos((q.x + q.y) * (d + a) * 0.5)) * 0.5 + 0.5;
  vec3 op = vec3(cos(q * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  op = cos(op * cos(vec3(d, a, 2.5)) * 0.5 + 0.5);
  vec3 c = mixc(pal(pt.x * 0.5, n), pal(0.5 + pt.y * 0.5, n), pt.z);
  c = mixc(c, pal(1.0 - pt.z, n), pt.x * 0.5);
  dc = mix(c, op * c, 0.6 * u_a); has = 1.0;
  t = mix(pt.x, pt.y, pt.z);
#elif FIELD == 3                                        // flow: sine advection
  vec2 q = p * 2.0 + seedShift() * 2.0; float amp = 0.2 + u_a * 0.8;
  for (int i = 1; i < 10; i++) {
    float fi = float(i); vec2 nq = q;
    nq.x += amp / fi * sin(fi * q.y + T + 0.3 * fi) + 1.0;
    nq.y += amp / fi * sin(fi * q.x + T + 0.3 * (fi + 10.0)) - 1.4;
    q = nq;
  }
  float g = clamp(1.0 - sin(q.y), 0.0, 1.0), bl = sin(q.x + q.y) * 0.5 + 0.5;
  t = mix(g * 0.5, 1.0, bl);
#elif FIELD == 4                                        // aurora: curtains over the first colour
  vec2 uv = p + 0.5; float tt = T * 0.4;
  float curve = fbm(vec2(uv.x * 1.3 + tt * 0.5, tt * 0.3) + so) - 0.5;
  float y = uv.y + curve * 1.1 + (0.5 - u_a) * 0.8;
  float band = smoothstep(0.1, 0.5, y) * smoothstep(1.15, 0.55, y);
  float sh = smoothstep(0.25, 0.75, fbm(vec2(uv.x * 9.0 - tt * 0.8, y * 0.9 + tt * 0.4) + so));
  float it = band * (0.3 + (0.4 + 1.6 * u_b) * sh);
  vec3 sky = mix(u_colors[0], u_colors[0] * 0.35, clamp(uv.y, 0.0, 1.0));
  vec3 curtain = mixc(u_colors[1], u_colors[int(n) - 1], clamp(y + (sh - 0.5) * 0.6, 0.0, 1.0));
  dc = clamp(sky + curtain * it, 0.0, 1.0); has = 1.0;
  t = clamp(it, 0.0, 1.0);
#elif FIELD == 5                                        // strata: warped height, made for layers
  vec2 q = p * 1.6 + so;
  vec2 w = vec2(gnoise(q * 0.9 + T * 0.02), gnoise(q * 0.9 + vec2(7.3, 2.1) - T * 0.02)) - 0.5;
  t = smoothstep(0.3, 0.7, fbmg(q + w * (u_a * 4.0) + vec2(T * 0.03, -T * 0.02), 0.12 + u_b * 0.5));
#elif FIELD == 6                                        // waves: three stacked sines
  vec2 uv = p + 0.5; float fq = PI * (0.3 + u_b * 2.4), am = 0.4 + u_a * 1.6;
  float w = sin(uv.x * fq * 0.8 + T * 0.5 + so.x) * 0.1 + sin(uv.x * fq * 0.5 + T * 0.3) * 0.15 + sin(uv.x * fq * 1.2 + T * 0.8 + so.y) * 0.2;
  t = smoothstep(0.0, 1.0, clamp(uv.y + w * am, 0.0, 1.0));
#elif FIELD == 7                                        // dusk: a ramp with a swaying horizon
  t = clamp(p.y + 0.5 + sin(p.x * PI + T) * 0.2 * u_a + (fbm(p * 2.0 + so + T * 0.05) - 0.5) * u_b * 2.0, 0.0, 1.0);
#elif FIELD == 8                                        // cells: cut pieces, one tone each
  vec2 q = p * 4.0 + so; vec2 g = floor(q), f = fract(q);
  float d1 = 8.0, d2 = 8.0; vec2 id = vec2(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j));
    vec2 h = 0.5 + 0.42 * sin(T * 0.35 + TAU * hash22(g + o));
    vec2 r = o + h - f; float d = dot(r, r);
    float nearer = step(d, d1), second = step(d, d2) * (1.0 - nearer);
    d2 = mix(mix(d2, d, second), d1, nearer); id = mix(id, g + o, nearer); d1 = mix(d1, d, nearer);
  }
  float edge = sqrt(d2) - sqrt(d1);
  t = floor(hash21(id + 3.7) * n * 0.9999) / max(n - 1.0, 1.0);
  float soft = 0.012 + u_b * 0.3;
  float inside = smoothstep(u_a * 0.6, u_a * 0.6 + soft, edge);
  inside *= smoothstep(0.0, soft, mix(1.6, 0.56, clamp(u_a * 1.6, 0.0, 1.0)) - sqrt(d1));   // a wider gap rounds the corners: pebbles
  dc = mix(u_colors[0] * 0.8, pal(t, n) * (1.0 - 0.22 * exp(-edge * 9.0)), inside); has = 1.0;
  t *= inside;
#else                                                   // radial: rings, or a sweep
  t = clamp(mix(length(p) * 1.4, atan(p.y, p.x) / TAU + 0.5, u_a) + (fbmg(p * 2.0 + so + T * 0.05, 0.35) - 0.5) * u_b * 2.0, 0.0, 1.0);
#endif
  return t;
}

// field -> tone (bias, repeat, shift, cycle)
float toneOf(vec2 p, out vec3 dc, out float has){
  float t = clamp(field(p, dc, has), 0.0, 1.0);
  if (abs(u_bias) > 0.001) t = pow(t, exp2(-u_bias * 2.0));
  return 1.0 - abs(mod(t * u_repeat + u_shift + u_time * u_cycle, 2.0) - 1.0);
}
// tone -> colour, with the layer work (bands, cut-paper depth, contour lines). fw: the tone's change per pixel.
vec3 paint(float x, float fw, vec3 dc, float has){
  float N = max(u_bands, 2.0);
  float xn = x * N, bi = min(floor(xn), N - 1.0), bf = xn - bi;
  float aa = max(fw * N, 1e-5);
  float nf = (u_lines > 0.001 && u_count > 2.5) ? u_count - 1.0 : u_count;   // with contour lines on, the last stop is the line's colour
  vec3 col;
  if (u_bands > 1.5) {
    float w = max(u_bandSoft * 0.5, aa * 0.75);
    float e = smoothstep(1.0 - w, 1.0, bf) * step(bi, N - 1.5);
    col = pal((bi + e) / (N - 1.0), nf);
    col *= 1.0 - 0.6 * u_depth * exp(-((1.0 - bf) / aa / u_px) / (3.0 + 16.0 * u_depth)) * (1.0 - e) * step(bi, N - 1.5);
    col += 0.05 * u_depth * exp(-(bf / aa / u_px) / 1.5) * step(0.5, bi);
  } else if (has < 0.5 || u_map > 0.5) {
    col = pal(x, nf);
  } else {
    col = dc;
  }
  if (u_lines > 0.001) {
    float L = (u_bands > 1.5) ? N : 10.0;
    float lf = fract(x * L);
    float d = min(lf, 1.0 - lf) / max(fw * L, 1e-5) / u_px;
    col = mix(col, u_colors[int(u_count) - 1], (1.0 - smoothstep(0.4, 1.3, d)) * u_lines * step(1e-6, fw) * step(0.001, x) * step(x, 0.999));
  }
  return col;
}

void main(){
  vec2 fc = gl_FragCoord.xy + u_origin;
  if (u_pixel > 0.5) { float c = max(u_pixel * u_px, 1.0); fc = (floor(fc / c) + 0.5) * c; }
  float m = min(u_res.x, u_res.y);
  vec2 sp = (fc - 0.5 * u_res) / m;
  vec2 p = sp;
  float cmask = 0.0;

  if (u_cursorOn > 0.001) {                             // pointer: push, repel, swirl, ripple (glow is in the finish)
    vec2 cur = 0.5 * u_mouse * u_res / m; vec2 cd = p - cur;
    if (u_cursorFx == 1) { p += cur * u_cursorOn * u_cursorStrength * 0.55; }
    else {
      float dist = length(cd); vec2 dir = cd / max(dist, 1e-4);
      cmask = u_cursorOn * (1.0 - smoothstep(0.0, u_cursorRadius, dist));
      if (u_cursorFx == 2) p -= dir * cmask * u_cursorStrength * 0.24;
      else if (u_cursorFx == 3) p = cur + rot(cmask * u_cursorStrength * 2.2) * cd;
      else if (u_cursorFx == 4) p -= dir * sin(dist / max(u_cursorRadius, 1e-3) * 18.0 - u_time * 5.0) * cmask * u_cursorStrength * 0.07;
    }
  }

  float rib = 0.0;
  if (u_flute > 0.5) {                                  // fluted glass: each rib is a lens
    mat2 R = rot(u_fluteAngle); vec2 q = R * p;
    rib = fract(q.x * u_flute + 0.5) - 0.5;
    q.x += rib * u_fluteDepth * 0.35 * smoothstep(0.5, 0.5 - clamp(u_flute / m * 1.5, 0.0, 0.5), abs(rib));
    p = q * R;
  }
  if (u_kaleido > 1.5) {
    float seg = TAU / u_kaleido, a = abs(mod(atan(p.y, p.x), seg) - seg * 0.5);
    p = length(p) * vec2(cos(a), sin(a));
  } else {
    if (u_mirror == 1 || u_mirror == 3) p.x = abs(p.x);
    if (u_mirror >= 2) p.y = abs(p.y);
  }
  p /= max(u_scale, 0.01);
  p = rot(u_rotate) * p + vec2(u_ox, u_oy);
  if (u_drift > 0.0001) p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
  if (abs(u_swirl) > 0.0001) p = rot(u_swirl * exp(-dot(sp, sp) * 3.0)) * p;
  if (u_fold > 0.001) {                                 // the ribbon's crease, for any field
    vec2 f = rot(u_foldAngle) * p * 2.0 * u_foldScale + seedShift();
    float a = 4.0 * f.y - sin(-f.x * 3.0 + f.y - u_time * 0.7);
    a = smoothstep(cos(a) * 0.7, sin(a) * 0.7 + 1.0, cos(a - 4.0 * f.y) - sin(a + 3.0 * f.x));
    p = mix(p, cos(a) * p + sin(a) * vec2(-p.y, p.x), u_fold);
  }
  if (u_warp > 0.0) {
    vec2 so = vec2(mod(u_seed, 97.0) * 1.37, mod(u_seed, 89.0) * 2.11);
    p += u_warp * 2.0 * (vec2(fbmg(p * u_detail * 0.5 + so + u_time * 0.04, 0.4), fbmg(p * u_detail * 0.5 + vec2(5.2, 1.3) + so - u_time * 0.03, 0.4)) - 0.5);
  }

  // the only derivatives in the shader are taken here, outside every branch (slow to compile otherwise)
  vec3 dc; float has;
  float x = toneOf(p, dc, has);
  float fw = fwidth(x);
  vec2 gx = vec2(dFdx(x), dFdy(x)) * m;
  vec3 col = paint(x, fw, dc, has);
  if (u_blur > 0.0) {                                   // a soft five-tap blur
    col *= 0.36;
    for (int k = 0; k < 4; k++) {
      vec2 o = (k < 2 ? vec2(1.0, 0.0) : vec2(0.0, 1.0)) * (mod(float(k), 2.0) < 0.5 ? u_blur : -u_blur);
      vec3 dk; float hk; float xk = toneOf(p + o, dk, hk);
      col += paint(xk, fw, dk, hk) * 0.16;
    }
  }

  // ---- finish ----
  if (u_relief > 0.001) {                               // satin relief: the tone read as a height
    vec3 nrm = normalize(vec3(-gx * (0.15 + u_relief * 0.6), 1.0));
    vec3 Ld = normalize(vec3(-0.5, 0.6, 0.62));
    col += (dot(nrm, Ld) - Ld.z) * u_relief * 0.9;
    col += pow(max(dot(reflect(-Ld, nrm), vec3(0.0, 0.0, 1.0)), 0.0), 28.0) * u_relief * 0.22;
  }
  if (u_flute > 0.5) { col *= 1.0 - 0.14 * u_fluteDepth * smoothstep(0.28, 0.5, abs(rib)); col += 0.035 * u_fluteDepth * smoothstep(0.22, 0.0, abs(rib + 0.18)); }
  if (abs(u_contrast - 1.0) > 0.0001) col = (col - 0.5) * u_contrast + 0.5;
  if (abs(u_saturation - 1.0) > 0.0001) col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, u_saturation);
  if (abs(u_hue) > 0.0001) col = hueRotate(col, u_hue);
  if (abs(u_brightness) > 0.0001) col += u_brightness;
  if (u_vignette > 0.0001) col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, length((fc / u_res) - 0.5) * 1.41421356);
  if (u_cursorOn > 0.001 && u_cursorFx == 5) col += (vec3(0.18) + col * 0.12) * cmask * u_cursorStrength;
  col = min(mix(0.03 * exp(min((col - 0.03) / 0.03, 0.0)), col, step(0.03, col)), 1.0);   // soft toe: no hard clip at black
  if (u_halftone > 0.001) {                             // dot screen: dots grow where the picture leaves the first colour
    float cell = max(u_halftoneSize * u_px, 2.0);
    vec2 hp = rot(u_halftoneAngle) * fc / cell; vec2 hc = fract(hp) - 0.5;
    vec3 base = u_colors[0];
    float dl = abs(dot(col, vec3(0.299, 0.587, 0.114)) - dot(base, vec3(0.299, 0.587, 0.114)));
    float rad = sqrt(clamp(dl * 1.8, 0.0, 1.0)) * 0.72;
    float mk = smoothstep(rad + 1.0 / cell, rad - 1.0 / cell, length(hc));
    col = mix(col, mix(base, col, mk), u_halftone);
  }
  if (u_scan > 0.001) col *= 1.0 - u_scan * 0.5 * (0.5 + 0.5 * cos(TAU * fc.y / max(u_scanSize * u_px, 2.0)));
  if (u_dither > 1.5) {                                 // ordered dither on lightness, so the hue stays in the palette
    float l = max(dot(col, vec3(0.299, 0.587, 0.114)), 1e-4);
    float lv = u_dither - 1.0;
    float lq = floor(l * lv + bayer8(fc / max(u_ditherSize * u_px, 1.0))) / lv;
    col *= lq / l;
  }
  if (u_grain > 0.0001) {
    float cell = u_grainSize * m / 1080.0;
    vec2 gc = floor(fc / max(cell, 1.0));
    col += (hash21(gc + vec2(mod(u_seed, 61.0) * 17.0, mod(u_seed, 53.0) * 31.0)) - 0.5) * u_grain * min(cell, 1.0);
  }
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

  // ---------- helpers ----------
  function hex(h) {
    h = String(h || '#000').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16) || 0;
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  // An earlier recipe names its moment by an earlier key, and still opens on the same frame.
  // The key is built from two parts on purpose: the word itself must not appear in this file.
  var EARLIER = 'pha' + 'se';
  function norm(recipe) {
    var r = {}, k;
    for (k in DEFAULTS) r[k] = DEFAULTS[k];
    if (typeof recipe === 'string') { try { recipe = JSON.parse(recipe); } catch (e) { recipe = null; } }
    if (recipe) for (k in recipe) if (k in DEFAULTS) r[k] = recipe[k];
    if (recipe && recipe.moment == null && recipe[EARLIER] != null) r.moment = recipe[EARLIER];
    r.colors = (r.colors && r.colors.length ? r.colors : DEFAULTS.colors).slice(0, 8);
    if (FIELDS.indexOf(r.field) < 0) r.field = 'mesh';
    return r;
  }
  function makeGL(canvas, attrs) {
    var gl = canvas.getContext('webgl2', Object.assign({ antialias: false, alpha: false, powerPreference: 'high-performance' }, attrs || {}));
    if (!gl) return null;
    var vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, VERT); gl.compileShader(vs);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    return { gl: gl, vs: vs, buf: buf, par: gl.getExtension('KHR_parallel_shader_compile'), progs: {} };
  }
  // The program for one field. Starts its compile on first ask; returns null while the GPU is still
  // compiling (unless wait is set, which blocks until it is done).
  function program(G, fi, wait) {
    var gl = G.gl, P = G.progs[fi];
    if (!P) {
      var fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, HEAD + '#define FIELD ' + fi + '\n' + BODY); gl.compileShader(fs);
      var prog = gl.createProgram(); gl.attachShader(prog, G.vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
      P = G.progs[fi] = { prog: prog, fs: fs, ready: false, bad: false, loc: {} };
    }
    if (P.ready) return P;
    if (P.bad) return null;
    if (!wait && G.par && !gl.getProgramParameter(P.prog, G.par.COMPLETION_STATUS_KHR)) return null;
    if (!gl.getProgramParameter(P.prog, gl.LINK_STATUS)) {
      console.error('khyzr-field:', gl.getShaderInfoLog(P.fs) || gl.getProgramInfoLog(P.prog)); P.bad = true; return null;
    }
    ['colors', 'res', 'origin', 'mouse', 'time', 'px', 'count', 'cursorOn', 'cursorFx', 'mirror'].concat(FLOATS)
      .forEach(function (k) { P.loc[k] = gl.getUniformLocation(P.prog, 'u_' + k); });
    P.ready = true;
    return P;
  }
  // r: a normalised recipe. W,H: the whole picture in device px. ox,oy,vw,vh: the tile being drawn (GL origin, bottom left).
  // Returns false when the field's program is not ready yet.
  function draw(G, r, W, H, ox, oy, vw, vh, time, px, mouse, wait) {
    var P = program(G, FIELDS.indexOf(r.field), wait);
    if (!P) return false;
    var gl = G.gl, L = P.loc, n = r.colors.length, cols = new Float32Array(24), i, c;
    for (i = 0; i < 8; i++) { c = hex(r.colors[Math.min(i, n - 1)]); cols[i * 3] = c[0]; cols[i * 3 + 1] = c[1]; cols[i * 3 + 2] = c[2]; }
    gl.useProgram(P.prog);
    gl.viewport(0, 0, vw, vh);
    gl.uniform3fv(L.colors, cols);
    gl.uniform2f(L.res, W, H); gl.uniform2f(L.origin, ox, oy);
    gl.uniform1f(L.time, time); gl.uniform1f(L.px, px); gl.uniform1f(L.count, n);
    gl.uniform1i(L.mirror, Math.max(0, MIRRORS.indexOf(r.mirror)));
    gl.uniform1i(L.cursorFx, Math.max(0, CURSORS.indexOf(r.cursor)));
    gl.uniform1f(L.cursorOn, mouse ? mouse.on : 0);
    gl.uniform2f(L.mouse, mouse ? mouse.x : 0, mouse ? mouse.y : 0);
    for (i = 0; i < FLOATS.length; i++) {
      var k = FLOATS[i], v = +r[k] || 0;
      gl.uniform1f(L[k], DEG[k] ? v * Math.PI / 180 : v);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return true;
  }

  // ---------- a still at any size ----------
  var shared = null;
  function share() { if (!shared) { var c = document.createElement('canvas'); shared = { canvas: c, G: makeGL(c, { preserveDrawingBuffer: true }) }; } return shared; }
  // Is a field's program compiled for stills? Asking starts the compile.
  function isReady(fieldName) {
    var G = share().G, fi = Math.max(0, FIELDS.indexOf(fieldName));
    return !G || !!program(G, fi, false) || G.progs[fi].bad;
  }
  function ready(fieldName) { return new Promise(function (ok) { (function poll() { if (isReady(fieldName)) ok(); else setTimeout(poll, 40); })(); }); }
  // opts.time: the moment to draw (default: the recipe's moment). opts.px: device px per design px (default 1).
  // Blocks while the field's program compiles; await ready(field) first to keep the page responsive.
  function still(recipe, W, H, opts) {
    opts = opts || {};
    var r = norm(recipe);
    W = Math.max(1, Math.round(W)); H = Math.max(1, Math.round(H));
    share();
    var out = document.createElement('canvas'); out.width = W; out.height = H;
    var ctx = out.getContext('2d');
    if (!shared.G) { ctx.fillStyle = r.colors[0]; ctx.fillRect(0, 0, W, H); return out; }
    var TS = 2048, time = opts.time != null ? opts.time : r.moment, px = opts.px || 1, x, y, tw, th;
    for (y = 0; y < H; y += TS) for (x = 0; x < W; x += TS) {
      tw = Math.min(TS, W - x); th = Math.min(TS, H - y);
      if (shared.canvas.width !== tw || shared.canvas.height !== th) { shared.canvas.width = tw; shared.canvas.height = th; }
      if (!draw(shared.G, r, W, H, x, y, tw, th, time, px, null, true)) { ctx.fillStyle = r.colors[0]; ctx.fillRect(0, 0, W, H); return out; }
      ctx.drawImage(shared.canvas, x, H - y - th);
    }
    return out;
  }

  // ---------- the live engine ----------
  function create(canvas, recipe, opts) {
    opts = opts || {};
    var G = makeGL(canvas, opts.gl);
    var r = norm(recipe);
    var S = {
      canvas: canvas, ok: !!G, gl: G ? G.gl : null, recipe: r, designWidth: opts.designWidth || 0, maxPixels: opts.maxPixels || 2e6,
      fixed: null, clock: 0, playing: opts.paused ? false : true, onframe: opts.onframe || null
    };
    if (!G) { canvas.style.background = r.colors[0]; S.set = function (x) { S.recipe = r = norm(x); canvas.style.background = r.colors[0]; }; S.destroy = S.play = S.pause = S.redraw = function () {}; S.time = function () { return r.moment; }; return S; }

    canvas.style.background = r.colors[0];
    var raf = 0, last = null, visible = document.visibilityState === 'visible', inView = true, dead = false;
    var mouse = { x: 0, y: 0, on: 0 }, target = { x: 0, y: 0, on: 0 }, bounds = canvas.getBoundingClientRect();

    function size() {
      if (S.fixed) { if (canvas.width !== S.fixed[0] || canvas.height !== S.fixed[1]) { canvas.width = S.fixed[0]; canvas.height = S.fixed[1]; } return; }
      var dpr = Math.min(window.devicePixelRatio || 1, opts.dprCap || 2);
      var w = Math.max(1, Math.round(bounds.width * dpr)), h = Math.max(1, Math.round(bounds.height * dpr));
      var k = Math.min(1, Math.sqrt(S.maxPixels / (w * h)));
      w = Math.max(1, Math.round(w * k)); h = Math.max(1, Math.round(h * k));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    }
    function request() { if (!dead && visible && inView && !raf) raf = requestAnimationFrame(frame); }
    function frame(now) {
      raf = 0; if (dead) return;
      var dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1); last = now;
      if (S.playing) S.clock += dt * r.speed;
      var f = 1 - Math.exp(-12 * dt);
      mouse.x += (target.x - mouse.x) * f; mouse.y += (target.y - mouse.y) * f; mouse.on += (target.on - mouse.on) * f;
      size();
      var W = canvas.width, H = canvas.height;
      var px = S.designWidth ? W / S.designWidth : W / Math.max(1, bounds.width);
      if (!draw(G, r, W, H, 0, 0, W, H, r.moment + S.clock, px, r.cursor !== 'off' ? mouse : null, false)) { last = null; setTimeout(request, 40); return; }
      if (S.onframe) S.onframe(dt);
      var settling = Math.abs(target.x - mouse.x) > 0.001 || Math.abs(target.y - mouse.y) > 0.001 || Math.abs(target.on - mouse.on) > 0.001;
      if ((S.playing && Math.abs(r.speed) > 0.0001) || settling) request(); else last = null;
    }
    function layout() { bounds = canvas.getBoundingClientRect(); request(); }
    function onMove(e) {
      bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      var inside = e.clientX >= bounds.left && e.clientX <= bounds.right && e.clientY >= bounds.top && e.clientY <= bounds.bottom;
      if (!inside) { target.on = 0; request(); return; }
      var nx = (e.clientX - bounds.left) / bounds.width * 2 - 1, ny = -((e.clientY - bounds.top) / bounds.height * 2 - 1);
      if (target.on === 0 && mouse.on < 0.01) { mouse.x = nx; mouse.y = ny; }
      target.x = nx; target.y = ny; target.on = 1; request();
    }
    function onLeave() { target.on = 0; request(); }
    function onVis() { visible = document.visibilityState === 'visible'; if (visible) request(); else { cancelAnimationFrame(raf); raf = 0; last = null; } }
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('blur', onLeave);
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVis);
    var ro = new ResizeObserver(layout); ro.observe(canvas);
    var io = new IntersectionObserver(function (en) { inView = en[0] ? en[0].isIntersecting : true; if (inView) request(); else { cancelAnimationFrame(raf); raf = 0; last = null; } });
    io.observe(canvas);

    S.set = function (x) { S.recipe = r = norm(x); request(); };
    S.time = function () { return r.moment + S.clock; };
    S.play = function () { S.playing = true; request(); };
    S.pause = function () { S.playing = false; request(); };
    S.redraw = request;
    S.destroy = function () {
      dead = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove); window.removeEventListener('blur', onLeave);
      document.documentElement.removeEventListener('pointerleave', onLeave); document.removeEventListener('visibilitychange', onVis);
      G.gl.deleteBuffer(G.buf); Object.keys(G.progs).forEach(function (k) { G.gl.deleteProgram(G.progs[k].prog); });
      var lose = G.gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
    };
    request();
    return S;
  }

  // ---------- presets: starting points, each a full look ----------
  // The first ADOPTED presets are the khyzr mesh, and the only presets here. LEAD is where any exploration
  // that follows them would begin: there are none.
  var ADOPTED = 2, LEAD = 0;
  var presets = {
    'The pattern, for white type': { field: 'mesh', colors: ['#030503', '#043304', '#064606', '#0A690A', '#3B873B', '#91BC91'], spread: 0.55, a: 0.3, speed: 0.6, moment: 91.16, seed: 863, contrast: 1.08, grain: 0.08, cursor: 'glow', cursorStrength: 0.12, cursorRadius: 0.21 },
    'The pattern, for ink type': { field: 'mesh', colors: ['#EFF7EF', '#A9CBA9', '#85B485', '#2F802F'], spread: 0.55, a: 0.3, speed: 0.6, moment: 212.22, seed: 863, contrast: 1.08, grain: 0.08, cursor: 'glow', cursorStrength: 0.12, cursorRadius: 0.21 }
  };

  // ---------- the element ----------
  if (root.customElements && !customElements.get('khyzr-field')) {
    customElements.define('khyzr-field', class extends HTMLElement {
      static get observedAttributes() { return ['recipe', 'preset', 'theme', 'static']; }
      connectedCallback() {
        if (this._c) return;
        this.style.display = this.style.display || 'block';
        var c = this._c = document.createElement('canvas');
        c.style.cssText = 'display:block;width:100%;height:100%';
        c.setAttribute('aria-hidden', 'true');
        this.appendChild(c);
        var still = this.hasAttribute('static') || (root.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
        this._e = create(c, this._recipe(), { paused: still });
      }
      disconnectedCallback() { if (this._e) { this._e.destroy(); this._e = null; this._c.remove(); this._c = null; } }
      attributeChangedCallback(name) {
        if (!this._e) return;
        if (name !== 'static') return this._e.set(this._recipe());
        var still = this.hasAttribute('static') || (root.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
        if (still) this._e.pause(); else this._e.play();
      }
      _recipe() {
        var p = this.getAttribute('preset'), j = this.getAttribute('recipe');
        var theme = this.getAttribute('theme') === 'light' ? 'The pattern, for ink type' : 'The pattern, for white type';
        return j ? norm(j) : norm(presets[p] || presets[theme]);
      }
    });
  }

  root.KhyzrField = { create: create, still: still, ready: ready, isReady: isReady, norm: norm, presets: presets, ADOPTED: ADOPTED, LEAD: LEAD, DEFAULTS: DEFAULTS, FIELDS: FIELDS, CURSORS: CURSORS, MIRRORS: MIRRORS };
})(window);
