/* ============================================================
   khyzr: the logo pattern  ·  <khyzr-logo-pattern>  ·  KhyzrLogoPattern
   The logo pattern is the khyzr symbol repeated edge to
   edge, tone on tone, so its blades close into rings. Two looks: one for white type,
   one for ink type. Both are presets of this engine, and the only two it carries.

   Usage:
     <script src="design-system/assets/pattern/khyzr-logo-pattern.js"></script>
     <div style="position:relative;overflow:hidden">
       <khyzr-logo-pattern theme="dark" style="position:absolute;inset:0"></khyzr-logo-pattern>
       …content…
     </div>

   Attributes:
     theme    "dark" (the look for white type, the default) | "light" (the look for ink type)
     preset   a preset by name
     recipe   a recipe as JSON, for a look of its own

   The symbol is eight blades in a 160 × 160 box: each a quarter ring about one corner,
   an inner lane and an outer lane, stacked back pair, middle four, front pair. Every
   arrangement here places those blades (path data verbatim from khyzr-symbol_on-dark.svg)
   by translate, turn and scale only. One arrangement, the echo, continues the mark's own
   radii outward as whole rings; those are drawn to the mark's measure, not taken from it.

   A "recipe" is a plain object of the values in DEFAULTS. The same recipe draws the same
   picture at any size: every length is a share of the frame, every choice comes from the seed.

   Script:
     KhyzrLogoPattern.draw(ctx, recipe, w, h, opts)   onto a 2D context at its default transform, w × h canvas pixels
     KhyzrLogoPattern.still(recipe, w, h, opts)       a new canvas
     KhyzrLogoPattern.svg(recipe, w, h, opts)         the same picture as SVG text: real paths, no grain
     KhyzrLogoPattern.layout(recipe, w, h)            the placed pieces, for anything else
     KhyzrLogoPattern.presets / .DEFAULTS / .ARRANGEMENTS
   opts.ground === false leaves the ground out (the pattern alone, on transparency).

   Grounds: any hex, or 'field-dark' / 'field-light', the two looks of the khyzr pattern. Those need
   khyzr-field.js on the page; until its shader is compiled (or without it) the ground is a flat
   green and draw() reports pending.

   Floors: nothing moves. The element is one canvas, redrawn when its box changes size. Without
   JavaScript it draws nothing and its container's own ground shows.
   ============================================================ */
(function (root) {
  'use strict';

  // ---------- the mark ----------
  var BLADE_D = [
    'M 46.019531 46.019531 C 40.046875 51.988281 33.089844 56.679688 25.339844 59.957031 C 17.300781 63.355469 8.777344 65.078125 0 65.078125 L 0 46.445312 C 25.648438 46.445312 46.445312 25.648438 46.445312 0 L 65.078125 0 C 65.078125 8.777344 63.355469 17.300781 59.957031 25.339844 C 56.679688 33.089844 51.988281 40.046875 46.019531 46.019531',
    'M 87.058594 58.722656 C 83.304688 64.277344 78.996094 69.5 74.246094 74.25 C 69.5 78.996094 64.277344 83.304688 58.722656 87.058594 C 53.105469 90.851562 47.101562 94.109375 40.878906 96.742188 C 27.921875 102.222656 14.167969 105.003906 0 105.003906 L 0 86.367188 C 47.699219 86.367188 86.367188 47.699219 86.367188 0 L 105.003906 0 C 105.003906 14.167969 102.222656 27.921875 96.742188 40.878906 C 94.109375 47.101562 90.851562 53.105469 87.058594 58.722656',
    'M 46.019531 113.980469 C 40.046875 108.011719 33.089844 103.320312 25.339844 100.042969 C 17.300781 96.644531 8.777344 94.921875 0 94.921875 L 0 113.554688 C 25.648438 113.554688 46.445312 134.351562 46.445312 160 L 65.078125 160 C 65.078125 151.222656 63.355469 142.699219 59.957031 134.660156 C 56.679688 126.910156 51.988281 119.953125 46.019531 113.980469',
    'M 87.058594 101.277344 C 83.304688 95.722656 78.996094 90.5 74.246094 85.75 C 69.5 81.003906 64.277344 76.695312 58.722656 72.941406 C 53.105469 69.148438 47.101562 65.890625 40.878906 63.257812 C 27.921875 57.777344 14.167969 54.996094 0 54.996094 L 0 73.632812 C 47.699219 73.632812 86.367188 112.300781 86.367188 160 L 105.003906 160 C 105.003906 145.832031 102.222656 132.078125 96.742188 119.121094 C 94.109375 112.898438 90.851562 106.894531 87.058594 101.277344',
    'M 113.980469 46.019531 C 119.953125 51.988281 126.910156 56.679688 134.660156 59.957031 C 142.699219 63.355469 151.222656 65.078125 160 65.078125 L 160 46.445312 C 134.351562 46.445312 113.554688 25.648438 113.554688 0 L 94.921875 0 C 94.921875 8.777344 96.644531 17.300781 100.042969 25.339844 C 103.320312 33.089844 108.011719 40.046875 113.980469 46.019531',
    'M 72.941406 58.722656 C 76.695312 64.277344 81.003906 69.5 85.753906 74.25 C 90.5 78.996094 95.722656 83.304688 101.277344 87.058594 C 106.894531 90.851562 112.898438 94.109375 119.121094 96.742188 C 132.078125 102.222656 145.832031 105.003906 160 105.003906 L 160 86.367188 C 112.300781 86.367188 73.632812 47.699219 73.632812 0 L 54.996094 0 C 54.996094 14.167969 57.777344 27.921875 63.257812 40.878906 C 65.890625 47.101562 69.148438 53.105469 72.941406 58.722656',
    'M 113.980469 113.980469 C 119.953125 108.011719 126.910156 103.320312 134.660156 100.042969 C 142.699219 96.644531 151.222656 94.921875 160 94.921875 L 160 113.554688 C 134.351562 113.554688 113.554688 134.351562 113.554688 160 L 94.921875 160 C 94.921875 151.222656 96.644531 142.699219 100.042969 134.660156 C 103.320312 126.910156 108.011719 119.953125 113.980469 113.980469',
    'M 72.941406 101.277344 C 76.695312 95.722656 81.003906 90.5 85.753906 85.75 C 90.5 81.003906 95.722656 76.695312 101.277344 72.941406 C 106.894531 69.148438 112.898438 65.890625 119.121094 63.257812 C 132.078125 57.777344 145.832031 54.996094 160 54.996094 L 160 73.632812 C 112.300781 73.632812 73.632812 112.300781 73.632812 160 L 54.996094 160 C 54.996094 145.832031 57.777344 132.078125 63.257812 119.121094 C 65.890625 112.898438 69.148438 106.894531 72.941406 101.277344'
  ];
  var LAYER = [0, 0, 1, 1, 1, 1, 2, 2];                       // back, middle, front
  var CORNER = [[0, 0], [0, 0], [0, 160], [0, 160], [160, 0], [160, 0], [160, 160], [160, 160]];
  var R_IN = [46.445312, 86.367188], R_OUT = [65.078125, 105.003906];   // the two lanes
  var BAND = 18.633, GAP = 21.289;                            // a lane's width, and the space between the lanes
  var MARK = { dark: ['#136E13', '#149314', '#5CBA5C'], light: ['#149314', '#136E13', '#0C4A0C'] };
  // The tile on which two blades at opposite corners join their neighbours edge to edge:
  // both lanes (inner + outer radius), or one lane alone (twice its middle radius).
  var TILE = { double: R_IN[0] + R_OUT[1], outer: R_IN[1] + R_OUT[1], inner: R_IN[0] + R_OUT[0] };

  var SEG = BLADE_D.map(function (d) {
    var t = d.split(/\s+/), out = [], i = 0, n;
    while (i < t.length) { n = t[i] === 'C' ? 6 : 2; out.push([t[i]].concat(t.slice(i + 1, i + 1 + n).map(Number))); i += n + 1; }
    return out;
  });
  var BOX = CORNER.map(function (c, i) {
    var R = R_OUT[i % 2];
    return [c[0] ? 160 - R : 0, c[1] ? 160 - R : 0, c[0] ? 160 : R, c[1] ? 160 : R];
  });
  var SETS = { symbol: [0, 1, 2, 3, 4, 5, 6, 7], blade: [7], back: [0, 1], middle: [2, 3, 4, 5], front: [6, 7] };
  function boxOf(set) {
    var b = [1e9, 1e9, -1e9, -1e9];
    set.forEach(function (i) { b[0] = Math.min(b[0], BOX[i][0]); b[1] = Math.min(b[1], BOX[i][1]); b[2] = Math.max(b[2], BOX[i][2]); b[3] = Math.max(b[3], BOX[i][3]); });
    return b;
  }
  function own(set) { return set.map(function (i) { return [i, LAYER[i] / 2]; }); }          // each blade in its own layer's tone
  function flat(set, tone) { return set.map(function (i) { return [i, tone]; }); }           // the whole piece in one tone

  var ARRANGEMENTS = ['crop', 'weave', 'repeat', 'scatter', 'bloom', 'echo'];
  var SHAPES = ['symbol', 'blade', 'back', 'middle', 'front'];
  var LATTICES = ['square', 'brick', 'half-drop', 'diamond'];
  var TURNS = ['none', 'alternate', 'rows', 'quarter', 'diagonal', 'free', 'outward'];
  var WEAVES = ['random', 'waves', 'rings', 'columns'];
  var LANES = ['double', 'outer', 'inner'];
  var SOURCES = ['one', 'two', 'four'];
  var COLOURS = ['tonal', 'mark', 'ink', 'outline'];
  var FIELDS = {
    'field-dark': { preset: 'The pattern, for white type', rep: '#043304' },
    'field-light': { preset: 'The pattern, for ink type', rep: '#C4DCC4' }
  };

  var DEFAULTS = {
    arrangement: 'crop', shape: 'symbol',
    scale: 1, density: 0.5, spacing: 0.35, variety: 0.5, grow: 0.5, twist: 0, jitter: 0, falloff: 0, seed: 7,
    lattice: 'square', turn: 'none', weave: 'random', lanes: 'double', sources: 'two',
    colour: 'tonal', strength: 0.5, spread: 0.6, invert: 0, ink: 'auto', line: 2.5, opacity: 1,
    solid: 0, depth: 0,
    ground: '#030503', moment: 0,
    ox: 0, oy: 0, rotate: 0, fade: 0, fadeAngle: 180,
    grain: 0.05, grainSize: 1
  };
  var ENUMS = { arrangement: ARRANGEMENTS, shape: SHAPES, lattice: LATTICES, turn: TURNS, weave: WEAVES, lanes: LANES, sources: SOURCES, colour: COLOURS };

  // ---------- small things ----------
  var RAD = Math.PI / 180, TAU = Math.PI * 2;
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function rgb(h) {
    h = String(h || '#000').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16) || 0;
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function hexOf(c) { return '#' + c.map(function (v) { return ('0' + Math.round(clamp(v, 0, 255)).toString(16)).slice(-2); }).join('').toUpperCase(); }
  function mix(a, b, t) { a = rgb(a); b = rgb(b); return hexOf([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); }
  function lum(h) { var c = rgb(h).map(function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  // one number in [0, 1) from a seed, a cell and a channel
  function hash(seed, x, y, ch) {
    var h = Math.imul((seed | 0) ^ 0x9E3779B9, 0x85EBCA6B);
    h = Math.imul(h ^ ((x | 0) + 0x7F4A7C15), 0xC2B2AE35); h ^= h >>> 15;
    h = Math.imul(h ^ Math.imul(y | 0, 0x27D4EB2F), 0x165667B1); h ^= h >>> 13;
    h = Math.imul(h ^ Math.imul(ch | 0, 0x9E3779B1), 0x85EBCA6B); h ^= h >>> 16;
    h = Math.imul(h, 0xC2B2AE35); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }
  function norm(recipe) {
    var r = {}, k;
    for (k in DEFAULTS) r[k] = DEFAULTS[k];
    if (typeof recipe === 'string') { try { recipe = JSON.parse(recipe); } catch (e) { recipe = null; } }
    if (recipe) for (k in recipe) if (k in DEFAULTS && recipe[k] != null) r[k] = recipe[k];
    for (k in ENUMS) if (ENUMS[k].indexOf(r[k]) < 0) r[k] = DEFAULTS[k];
    for (k in DEFAULTS) if (typeof DEFAULTS[k] === 'number') r[k] = +r[k] || 0;
    r.seed = Math.round(r.seed);
    if (!FIELDS[r.ground] && !/^#[0-9a-f]{6}$/i.test(r.ground)) r.ground = DEFAULTS.ground;
    if (r.ink !== 'auto' && !/^#[0-9a-f]{6}$/i.test(r.ink)) r.ink = 'auto';
    return r;
  }
  function groundRep(r) { return FIELDS[r.ground] ? FIELDS[r.ground].rep : r.ground; }
  function isDark(r) { return lum(groundRep(r)) < 0.2; }
  // The frame's unit: its height on a 16:9 frame, and the same share of the area on any other shape.
  function unit(w, h) { return 0.75 * Math.sqrt(w * h); }
  // symbol space → the pattern's space: the point (ax, ay) lands on (cx, cy), at this size and turn
  function mat(cx, cy, size, deg, ax, ay) {
    var s = size / 160, t = deg * RAD, c = Math.cos(t) * s, n = Math.sin(t) * s;
    return [c, n, -n, c, cx - (c * ax - n * ay), cy - (n * ax + c * ay)];
  }

  // ---------- where every piece goes ----------
  // Returns { pieces, unit, merge, open }. A piece is { m, parts: [[blade, tone]…], a } or { ring: [cx, cy, r, width], tone, a }.
  // merge: same-toned blades are one path (edge-to-edge blades join without a seam, and the stack is by layer).
  // open: blades are drawn without their end caps when outlined (they continue into a neighbour).
  function layout(recipe, w, h) {
    var r = norm(recipe), U = unit(w, h), pieces = [], merge = false, open = false;
    var square = Math.abs(r.rotate % 90) < 1e-6;
    var rot = r.rotate * RAD, co = Math.cos(rot), si = Math.sin(rot), gx = w / 2 + r.ox * U, gy = h / 2 + r.oy * U;
    if (square) { co = Math.round(co); si = Math.round(si); gx = Math.round(gx); gy = Math.round(gy); }   // tiles land on whole pixels
    var pad = r.depth > 0 ? 0.09 * U : 2, seed = r.seed;
    // the frame's box in the pattern's space: the pattern turns and slides under the frame
    var bx0 = 1e9, bx1 = -1e9, by0 = 1e9, by1 = -1e9;
    [[0, 0], [w, 0], [0, h], [w, h]].forEach(function (p) {
      var x = p[0] - gx, y = p[1] - gy, u = co * x + si * y, v = -si * x + co * y;
      bx0 = Math.min(bx0, u); bx1 = Math.max(bx1, u); by0 = Math.min(by0, v); by1 = Math.max(by1, v);
    });
    function toFrame(m) { return [co * m[0] - si * m[1], si * m[0] + co * m[1], co * m[2] - si * m[3], si * m[2] + co * m[3], co * m[4] - si * m[5] + gx, si * m[4] + co * m[5] + gy]; }
    // how much of a blade's length lies inside the frame, 0 to 1 (nine points along the middle of its arc)
    function shown(M, bi) {
      var c = CORNER[bi], rr = (R_IN[bi % 2] + R_OUT[bi % 2]) / 2, n = 0, k, t, x, y, X, Y;
      for (k = 0; k < 9; k++) {
        t = (k + 0.5) / 9 * Math.PI / 2; x = c[0] + (c[0] ? -rr : rr) * Math.cos(t); y = c[1] + (c[1] ? -rr : rr) * Math.sin(t);
        X = M[0] * x + M[2] * y + M[4]; Y = M[1] * x + M[3] * y + M[5];
        if (X >= 0 && X <= w && Y >= 0 && Y <= h) n++;
      }
      return n / 9;
    }
    function put(m, parts, a, box, scraps) {
      var M = toFrame(m);
      if (scraps && shown(M, parts[parts.length - 1][0]) < 0.4) return;   // a piece that only pokes an end into the frame is left out
      var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, i, x, y, cx, cy;
      for (i = 0; i < 4; i++) {
        cx = box[i & 1 ? 2 : 0]; cy = box[i & 2 ? 3 : 1]; x = M[0] * cx + M[2] * cy + M[4]; y = M[1] * cx + M[3] * cy + M[5];
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      if (x1 < -pad || x0 > w + pad || y1 < -pad || y0 > h + pad) return;
      pieces.push({ m: M, parts: parts, a: a == null ? 1 : a });
    }
    var set = SETS[r.shape], sbox = boxOf(set), i, j, k;
    function turnOf(i, j, ch) {
      var t = r.turn;
      if (t === 'alternate') return ((i + j) & 1) * 90;
      if (t === 'rows') return (((j % 4) + 4) % 4) * 90;
      if (t === 'quarter') return Math.floor(hash(seed, i, j, ch) * 4) * 90;
      if (t === 'diagonal') return 45;
      if (t === 'free') return hash(seed, i, j, ch) * 360;
      return 0;
    }

    if (r.arrangement === 'crop') {
      // one enormous symbol, bleeding off the frame. Sized on the frame's diagonal, so from scale 1.4 up
      // (more as it slides off centre) no edge of the mark's own box shows, whatever the frame's shape.
      merge = true;
      put(mat(0, 0, 0.735 * Math.sqrt(w * w + h * h) * r.scale, 0, 80, 80), own(set), 1, sbox);

    } else if (r.arrangement === 'repeat') {
      // the symbol on a lattice. At spacing 0 the blades of neighbours close into whole rings.
      var S = 0.14 * U * r.scale, tight = Math.abs(r.spacing) < 1e-6 && r.jitter === 0 && (r.turn === 'none' || r.turn === 'alternate' || r.turn === 'rows' || r.turn === 'quarter');
      if (tight && square) S = Math.max(4, Math.round(S));
      var c = S * (1 + Math.max(0, r.spacing)), cw = c, chh = c, mg = S * 1.7;
      if (r.lattice === 'diamond') { cw = c * Math.SQRT2; chh = cw / 2; }
      merge = r.jitter === 0 && r.turn !== 'free'; open = tight && r.lattice === 'square';
      for (j = Math.floor((by0 - mg) / chh) - 1; j <= Math.ceil((by1 + mg) / chh); j++) for (i = Math.floor((bx0 - mg) / cw) - 1; i <= Math.ceil((bx1 + mg) / cw); i++) {
        var x = i * cw, y = j * chh, sz = 1;
        if ((r.lattice === 'brick' || r.lattice === 'diamond') && (j & 1)) x += cw / 2;
        if (r.lattice === 'half-drop' && (i & 1)) y += chh / 2;
        if (r.jitter > 0) { x += (hash(seed, i, j, 11) - 0.5) * r.jitter * c * 0.7; y += (hash(seed, i, j, 12) - 0.5) * r.jitter * c * 0.7; sz = 1 + (hash(seed, i, j, 13) - 0.5) * r.jitter * 0.6; }
        put(mat(x + S / 2, y + S / 2, S * sz, turnOf(i, j, 14), 80, 80), own(set), 1, sbox);
      }

    } else if (r.arrangement === 'weave') {
      // two blades at opposite corners of a tile, turned by rule: the arcs join into running lines (a Truchet tiling).
      // The tile is cut so the mark's own lanes meet their neighbours exactly.
      var T = TILE[r.lanes], ideal = 0.22 * U * r.scale, tile = square ? Math.max(6, Math.round(ideal)) : ideal;
      var two = r.lanes === 'double', lanes = two ? [0, 1] : r.lanes === 'outer' ? [1] : [0];
      var s = tile / T, far = tile - 160 * s, M = 6, arcs = [], ids = {}, parent = [], low = [];
      merge = true; open = true;
      // Every arc runs between two crossings on the tile's edges. Joining the crossings finds each
      // whole strand, so a strand keeps one tone from end to end.
      var node = function (kind, i, j, slot) {
        var key = kind + ',' + i + ',' + j + ',' + slot, n = ids[key];
        if (n == null) { n = ids[key] = parent.length; parent.push(n); low.push(hash(seed, i, j, 23 + kind * 2 + slot)); }
        return n;
      };
      var find = function (n) { while (parent[n] !== n) { parent[n] = parent[parent[n]]; n = parent[n]; } return n; };
      var arm = function (corner, i, j) {   // corner: the blade pair's first index (0 TL, 2 BL, 4 TR, 6 BR)
        lanes.forEach(function (l, li) {
          var near = two ? l : 0, away = two ? 1 - l : 0, a, b;   // which crossing on an edge, counted from its low end
          if (corner === 0) { a = node(0, i, j, near); b = node(1, i, j, near); }
          else if (corner === 6) { a = node(0, i, j + 1, away); b = node(1, i + 1, j, away); }
          else if (corner === 4) { a = node(0, i, j, away); b = node(1, i + 1, j, near); }
          else { a = node(1, i, j, away); b = node(0, i, j + 1, near); }
          a = find(a); b = find(b);
          if (a !== b) { parent[b] = a; low[a] = Math.min(low[a], low[b]); }
          arcs.push([corner + l, i, j, a]);
        });
      };
      // the same tiles at every size: counted on the unrounded tile, a few beyond the frame so most strands close
      var q = 1e-6, j0 = Math.floor(by0 / ideal + q) - M, j1 = Math.ceil(by1 / ideal - q) + M, i0 = Math.floor(bx0 / ideal + q) - M, i1 = Math.ceil(bx1 / ideal - q) + M;
      for (j = j0; j <= j1; j++) for (i = i0; i <= i1; i++) {
        var o = r.weave === 'random' ? (hash(seed, i, j, 21) < 0.5 ? 0 : 1) : r.weave === 'rings' ? (i + j) & 1 : r.weave === 'columns' ? j & 1 : 0;
        if (r.weave !== 'random' && hash(seed, i, j, 22) < r.jitter * 0.5) o = 1 - o;
        if (o) { arm(4, i, j); arm(2, i, j); } else { arm(0, i, j); arm(6, i, j); }
      }
      arcs.forEach(function (a) {
        var corner = a[0] & 6, x = a[1] * tile, y = a[2] * tile, tone = Math.floor(hash(seed, Math.floor(low[find(a[3])] * 1e9), 0, 29) * 3) / 2;
        put([s, 0, 0, s, corner >= 4 ? x + far : x, corner === 2 || corner === 6 ? y + far : y], [[a[0], tone]], 1, BOX[a[0]]);
      });

    } else if (r.arrangement === 'scatter') {
      // pieces at varied size, turn and tone: one to a cell of a loose grid, so they spread evenly and stay put when the frame slides
      var N = Math.round(5 + r.density * r.density * 215), g = Math.sqrt(w * h / N), base = 0.45 * U * r.scale, list = [];
      var reach = base * Math.pow(3, r.variety);
      for (j = Math.floor((by0 - reach) / g) - 1; j <= Math.ceil((by1 + reach) / g); j++) for (i = Math.floor((bx0 - reach) / g) - 1; i <= Math.ceil((bx1 + reach) / g); i++) {
        var size = base * Math.pow(3, (hash(seed, i, j, 31) * 2 - 1) * r.variety), tone = hash(seed, i, j, 35), parts, box;
        if (r.shape === 'symbol') { parts = own(set); box = sbox; }
        else if (r.shape === 'blade') { k = Math.floor(hash(seed, i, j, 36) * 8); parts = [[k, tone]]; box = BOX[k]; }
        else { parts = flat(set, tone); box = sbox; }
        var deg = r.turn === 'none' ? 0 : r.turn === 'free' ? hash(seed, i, j, 34) * 360 : r.turn === 'diagonal' ? 45 + Math.floor(hash(seed, i, j, 34) * 4) * 90 : Math.floor(hash(seed, i, j, 34) * 4) * 90;
        list.push({ key: size * (0.7 + 0.6 * hash(seed, i, j, 37)), m: mat((i + 0.5 + (hash(seed, i, j, 32) - 0.5) * 0.9) * g, (j + 0.5 + (hash(seed, i, j, 33) - 0.5) * 0.9) * g, size, deg, (box[0] + box[2]) / 2, (box[1] + box[3]) / 2), parts: parts, box: box });
      }
      list.sort(function (a, b) { return b.key - a.key; });   // the large pieces lie underneath
      list.forEach(function (p) { put(p.m, p.parts, 1, p.box, r.shape !== 'symbol'); });

    } else if (r.arrangement === 'bloom') {
      // pieces on a sunflower spiral, growing as they leave the centre
      var Nb = Math.round(10 + r.density * r.density * 490), p = 0.5 + 0.45 * r.grow, Rb = 0.95 * U * r.scale, cb = Rb / Math.pow(Nb, p), GA = 137.50776 * RAD, a0 = hash(seed, 0, 0, 41) * TAU;
      var bulge = r.shape === 'blade' || r.shape === 'front' ? 135 : -45;   // which way the piece's arcs face
      for (k = Nb; k >= 1; k--) {
        var ang = k * GA + a0, rad = cb * Math.pow(k, p), f = k / Nb;
        var local = cb * Math.sqrt(TAU * p) * Math.pow(k, p - 0.5), bs = local * 2 / (1 + Math.max(0, r.spacing));
        var bx = rad * Math.cos(ang), by = rad * Math.sin(ang);
        if (r.jitter > 0) { bx += (hash(seed, k, 0, 42) - 0.5) * r.jitter * local * 1.5; by += (hash(seed, k, 0, 43) - 0.5) * r.jitter * local * 1.5; bs *= 1 + (hash(seed, k, 0, 44) - 0.5) * r.jitter; }
        var bd = r.turn === 'outward' ? ang / RAD + bulge : r.turn === 'free' ? hash(seed, k, 0, 45) * 360 : r.turn === 'quarter' ? Math.floor(hash(seed, k, 0, 45) * 4) * 90 : r.turn === 'diagonal' ? 45 : 0;
        put(mat(bx, by, bs, bd + r.twist, (sbox[0] + sbox[2]) / 2, (sbox[1] + sbox[3]) / 2), r.shape === 'symbol' ? own(set) : flat(set, f), 1 - r.falloff * Math.pow(f, 1.5), sbox);
      }

    } else if (r.arrangement === 'echo') {
      // the mark's two radii continued outward as rings, from the corners the mark draws them from
      var es = 0.07 * U * r.scale / (BAND + GAP), band = BAND * es, pitch = band + GAP * es * (0.65 + Math.max(0, r.spacing)), first = R_IN[0] * es;
      var far2 = (0.2 + r.density) * Math.sqrt(w * w + h * h), hw = w / 2, hh = h / 2, src;
      var all = [[-hw, -hh, 0], [hw, -hh, 0.5], [-hw, hh, 0.5], [hw, hh, 1]];
      if (r.sources === 'four') src = all;
      else if (r.sources === 'two') src = seed & 1 ? [[hw, -hh, 0], [-hw, hh, 1]] : [[-hw, -hh, 0], [hw, hh, 1]];
      else src = [[all[[3, 0, 1, 2][seed & 3]][0], all[[3, 0, 1, 2][seed & 3]][1], 1]];
      src.forEach(function (c) {
        var n, rin;
        for (n = 0; (rin = first + n * pitch) < far2 && n < 400; n++)
          pieces.push({ ring: [co * c[0] - si * c[1] + gx, si * c[0] + co * c[1] + gy, rin + band / 2, band], tone: c[2], a: 1 - r.falloff * (rin / far2) });
      });
    }
    return { pieces: pieces, unit: U, merge: merge, open: open, recipe: r };
  }

  // ---------- colour ----------
  function inkOf(r) {
    if (r.colour !== 'tonal' && r.ink !== 'auto') return r.ink;
    // the tonal green: the mark's middle green on the near-blacks, its light green on the mid greens
    // (where the middle one would vanish), khyzr green on anything light
    var l = lum(groundRep(r)), dark = l < 0.2;
    return r.invert > 0.5 ? (dark ? '#000000' : '#FFFFFF') : dark ? (l < 0.06 ? '#149314' : '#5CBA5C') : '#0A690A';
  }
  // tone 0 is the back of the mark, 1 its front; a is the piece's own strength
  function styler(r) {
    var rep = groundRep(r), dark = isDark(r), o = clamp(r.opacity, 0, 1);
    if (r.colour === 'mark') { var fills = dark ? MARK.dark : MARK.light; return function (tone, a) { return { c: fills[tone < 0.34 ? 0 : tone < 0.67 ? 1 : 2], a: a * o }; }; }
    var ink = inkOf(r), solid = r.solid > 0.5 && r.colour !== 'outline', k = clamp(r.strength, 0, 1);
    return function (tone, a) {
      var v = k * (1 - r.spread * (1 - tone));
      return solid ? { c: mix(rep, ink, v), a: a * o } : { c: ink, a: v * a * o };
    };
  }
  // The drawing as a short list of paths, the same list for canvas and for SVG.
  function ops(L) {
    var r = L.recipe, st = styler(r), out = [], groups = {}, order = [], i, j, P, key, G, s;
    for (i = 0; i < L.pieces.length; i++) {
      P = L.pieces[i];
      if (P.ring) { s = st(P.tone, P.a); out.push({ ring: P.ring, c: s.c, a: s.a }); continue; }
      if (L.merge) {
        for (j = 0; j < P.parts.length; j++) {
          key = P.parts[j][1] + '|' + P.a;
          if (!groups[key]) { s = st(P.parts[j][1], P.a); groups[key] = { tone: P.parts[j][1], parts: [], c: s.c, a: s.a }; order.push(groups[key]); }
          groups[key].parts.push([P.parts[j][0], P.m]);
        }
      } else {
        G = null;
        for (j = 0; j < P.parts.length; j++) {
          if (!G || G.tone !== P.parts[j][1]) { s = st(P.parts[j][1], P.a); G = { tone: P.parts[j][1], parts: [], c: s.c, a: s.a }; out.push(G); }
          G.parts.push([P.parts[j][0], P.m]);
        }
      }
    }
    order.sort(function (a, b) { return a.tone - b.tone; });
    return out.concat(order);
  }
  function trace(pen, bi, m, open) {
    var S = SEG[bi], i, q, a = m[0], b = m[1], c = m[2], d = m[3], e = m[4], f = m[5];
    for (i = 0; i < S.length; i++) {
      q = S[i];
      if (q[0] === 'C') pen.bezierCurveTo(a * q[1] + c * q[2] + e, b * q[1] + d * q[2] + f, a * q[3] + c * q[4] + e, b * q[3] + d * q[4] + f, a * q[5] + c * q[6] + e, b * q[5] + d * q[6] + f);
      else if (q[0] === 'M' || open) pen.moveTo(a * q[1] + c * q[2] + e, b * q[1] + d * q[2] + f);
      else pen.lineTo(a * q[1] + c * q[2] + e, b * q[1] + d * q[2] + f);
    }
    if (!open) pen.closePath();
  }
  function shadowOf(r, U) {
    if (!(r.depth > 0) || r.colour === 'outline') return null;
    return { rgb: isDark(r) ? [0, 0, 0] : [3, 40, 3], a: (isDark(r) ? 0.85 : 0.5) * r.depth, blur: r.depth * 0.036 * U, dy: r.depth * 0.012 * U };
  }
  // the clear side: 0 where the pattern is gone, 1 where it is whole, along a line across the frame
  function fadeOf(r, w, h) {
    if (!(r.fade > 0.001)) return null;
    var t = r.fadeAngle * RAD, dx = Math.cos(t), dy = Math.sin(t), E = Math.abs(w / 2 * dx) + Math.abs(h / 2 * dy), soft = 0.45, p0 = r.fade * (1 + soft) - soft;
    var at = function (u) { return clamp((u - p0) / soft, 0, 1); }, stops = [0, clamp(p0, 0, 1), clamp(p0 + soft, 0, 1), 1];
    return { x1: w / 2 + dx * E, y1: h / 2 + dy * E, x2: w / 2 - dx * E, y2: h / 2 - dy * E, stops: stops.map(function (u) { return [u, at(u)]; }) };
  }

  // ---------- canvas ----------
  var fcache = [];
  function fieldCanvas(r, w, h) {
    var KF = root.KhyzrField, F = FIELDS[r.ground], i, k, p = {};
    if (!KF || !F || !KF.presets[F.preset] || !KF.isReady('mesh')) return null;
    var key = r.ground + '|' + r.moment + '|' + w + 'x' + h;
    for (i = 0; i < fcache.length; i++) if (fcache[i].key === key) return fcache[i].canvas;
    for (k in KF.presets[F.preset]) p[k] = KF.presets[F.preset][k];
    p.moment = (p.moment || 0) + r.moment;
    var c = KF.still(p, w, h);
    if (w * h <= 2.6e6) { fcache.push({ key: key, canvas: c }); if (fcache.length > 10) fcache.shift(); }
    return c;
  }
  var grainTile = null;
  function grainOf() {
    if (grainTile) return grainTile;
    var n = 512, c = document.createElement('canvas'), x, img, d, i, s = 1234567, v;
    c.width = c.height = n; x = c.getContext('2d'); img = x.createImageData(n, n); d = img.data;
    for (i = 0; i < d.length; i += 4) {
      s = (Math.imul(s, 1664525) + 1013904223) | 0; v = (s >>> 8 & 0xFFFF) / 65535;
      d[i] = d[i + 1] = d[i + 2] = v < 0.5 ? 0 : 255; d[i + 3] = Math.abs(v - 0.5) * 510;
    }
    x.putImageData(img, 0, 0);
    return (grainTile = c);
  }
  function paint(ctx, L) {
    var r = L.recipe, list = ops(L), sh = shadowOf(r, L.unit), outline = r.colour === 'outline', lw = Math.max(0.5, r.line * L.unit / 1080), i, j, o, path;
    if (sh) { ctx.shadowColor = 'rgba(' + sh.rgb.join(',') + ',' + sh.a + ')'; ctx.shadowBlur = sh.blur; ctx.shadowOffsetY = sh.dy; }
    for (i = 0; i < list.length; i++) {
      o = list[i]; ctx.globalAlpha = clamp(o.a, 0, 1);
      if (o.ring) {
        ctx.strokeStyle = o.c; ctx.beginPath();
        if (outline) { ctx.lineWidth = lw; ctx.arc(o.ring[0], o.ring[1], o.ring[2] - o.ring[3] / 2, 0, TAU); ctx.moveTo(o.ring[0] + o.ring[2] + o.ring[3] / 2, o.ring[1]); ctx.arc(o.ring[0], o.ring[1], o.ring[2] + o.ring[3] / 2, 0, TAU); }
        else { ctx.lineWidth = o.ring[3]; ctx.arc(o.ring[0], o.ring[1], o.ring[2], 0, TAU); }
        ctx.stroke();
        continue;
      }
      path = new Path2D();
      for (j = 0; j < o.parts.length; j++) trace(path, o.parts[j][0], o.parts[j][1], outline && L.open);
      if (outline) { ctx.strokeStyle = o.c; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(path); }
      else { ctx.fillStyle = o.c; ctx.fill(path); }
    }
    ctx.globalAlpha = 1; ctx.shadowColor = 'rgba(0,0,0,0)'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  }
  function draw(ctx, recipe, w, h, opts) {
    opts = opts || {};
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    var L = layout(recipe, w, h), r = L.recipe, pending = false, F = fadeOf(r, w, h), g;
    var ground = function () {
      var field = FIELDS[r.ground] ? fieldCanvas(r, w, h) : null;
      if (field) ctx.drawImage(field, 0, 0, w, h);
      else { pending = !!FIELDS[r.ground] && !!root.KhyzrField; ctx.fillStyle = groundRep(r); ctx.fillRect(0, 0, w, h); }
    };
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
    if (F) {
      // the pattern alone first, cleared toward one side, then the ground laid in behind it: no second canvas, at any size
      ctx.clearRect(0, 0, w, h);
      paint(ctx, L);
      g = ctx.createLinearGradient(F.x1, F.y1, F.x2, F.y2);
      F.stops.forEach(function (s) { g.addColorStop(s[0], 'rgba(0,0,0,' + s[1] + ')'); });
      ctx.globalCompositeOperation = 'destination-in'; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-over'; if (opts.ground !== false) ground();
      ctx.globalCompositeOperation = 'source-over';
    } else {
      if (opts.ground === false) ctx.clearRect(0, 0, w, h); else ground();
      paint(ctx, L);
    }
    if (r.grain > 0 && opts.ground !== false && opts.grain !== false) {
      // sized to the frame: 1 is one pixel of a 1080-high picture, and it thins out below that as the field's grain does
      var cell = r.grainSize * L.unit / 1080, k = Math.max(0.5, cell);
      ctx.globalAlpha = clamp(r.grain * 0.6 * Math.min(1, cell * 1.4), 0, 1); ctx.imageSmoothingEnabled = false;
      ctx.scale(k, k); ctx.fillStyle = ctx.createPattern(grainOf(), 'repeat'); ctx.fillRect(0, 0, w / k + 1, h / k + 1);
    }
    ctx.restore();
    return { pieces: L.pieces.length, pending: pending };
  }
  function still(recipe, w, h, opts) {
    var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    c.info = draw(c.getContext('2d'), recipe, c.width, c.height, opts);
    return c;
  }

  // ---------- SVG ----------
  function num(v) { return String(+v.toFixed(2)); }
  function Pen() { this.d = ''; }
  Pen.prototype.moveTo = function (x, y) { this.d += 'M' + num(x) + ' ' + num(y); };
  Pen.prototype.lineTo = function (x, y) { this.d += 'L' + num(x) + ' ' + num(y); };
  Pen.prototype.bezierCurveTo = function (a, b, c, d, e, f) { this.d += 'C' + num(a) + ' ' + num(b) + ' ' + num(c) + ' ' + num(d) + ' ' + num(e) + ' ' + num(f); };
  Pen.prototype.closePath = function () { this.d += 'Z'; };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  // opts.ground === false: the pattern alone. A field ground is set in as a JPEG the size of the frame.
  function svg(recipe, w, h, opts) {
    opts = opts || {};
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    var L = layout(recipe, w, h), r = L.recipe, list = ops(L), sh = shadowOf(r, L.unit), F = fadeOf(r, w, h), outline = r.colour === 'outline';
    var lw = num(Math.max(0.5, r.line * L.unit / 1080)), lean = {}, k, defs = '', body = '', ground = '', i, j, o, pen, paintAttr, fx = sh ? ' filter="url(#depth)"' : '';
    for (k in DEFAULTS) if (r[k] !== DEFAULTS[k] || k === 'arrangement') lean[k] = r[k];
    defs += '<clipPath id="frame"><rect width="' + w + '" height="' + h + '"/></clipPath>';
    if (sh) defs += '<filter id="depth" x="-1" y="-1" width="3" height="3" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="' + num(sh.dy) + '" stdDeviation="' + num(sh.blur / 2) + '" flood-color="rgb(' + sh.rgb.join(',') + ')" flood-opacity="' + num(sh.a) + '"/></filter>';
    if (F) defs += '<linearGradient id="clear" gradientUnits="userSpaceOnUse" x1="' + num(F.x1) + '" y1="' + num(F.y1) + '" x2="' + num(F.x2) + '" y2="' + num(F.y2) + '">' +
      F.stops.map(function (s) { return '<stop offset="' + num(s[0]) + '" stop-color="#fff" stop-opacity="' + num(s[1]) + '"/>'; }).join('') +
      '</linearGradient><mask id="fade" maskUnits="userSpaceOnUse" x="0" y="0" width="' + w + '" height="' + h + '"><rect width="' + w + '" height="' + h + '" fill="url(#clear)"/></mask>';
    if (opts.ground !== false) {
      if (FIELDS[r.ground]) {
        var fc = fieldCanvas(r, w, h);
        ground = fc ? '<image width="' + w + '" height="' + h + '" preserveAspectRatio="none" xlink:href="' + fc.toDataURL('image/jpeg', 0.92) + '"/>' : '<rect width="' + w + '" height="' + h + '" fill="' + groundRep(r) + '"/>';
      } else ground = '<rect width="' + w + '" height="' + h + '" fill="' + r.ground + '"/>';
    }
    for (i = 0; i < list.length; i++) {
      o = list[i];
      paintAttr = outline ? ' fill="none" stroke="' + o.c + '" stroke-opacity="' + num(clamp(o.a, 0, 1)) + '" stroke-width="' + lw + '" stroke-linejoin="round"' : ' fill="' + o.c + '" fill-opacity="' + num(clamp(o.a, 0, 1)) + '"';
      if (o.ring) {
        if (outline) body += '<circle cx="' + num(o.ring[0]) + '" cy="' + num(o.ring[1]) + '" r="' + num(o.ring[2] - o.ring[3] / 2) + '"' + paintAttr + '/><circle cx="' + num(o.ring[0]) + '" cy="' + num(o.ring[1]) + '" r="' + num(o.ring[2] + o.ring[3] / 2) + '"' + paintAttr + '/>\n';
        else body += '<circle cx="' + num(o.ring[0]) + '" cy="' + num(o.ring[1]) + '" r="' + num(o.ring[2]) + '" fill="none" stroke="' + o.c + '" stroke-opacity="' + num(clamp(o.a, 0, 1)) + '" stroke-width="' + num(o.ring[3]) + '"' + fx + '/>\n';
        continue;
      }
      pen = new Pen();
      for (j = 0; j < o.parts.length; j++) trace(pen, o.parts[j][0], o.parts[j][1], outline && L.open);
      body += '<path d="' + pen.d + '"' + paintAttr + (outline ? '' : fx) + '/>\n';
    }
    return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">\n' +
      '<title>khyzr logo pattern, ' + r.arrangement + '</title>\n<desc>' + esc(JSON.stringify(lean)) + '</desc>\n<defs>' + defs + '</defs>\n' + ground + '\n' +
      '<g clip-path="url(#frame)"><g' + (F ? ' mask="url(#fade)"' : '') + '>\n' + body + '</g></g>\n</svg>\n';
  }

  // ---------- looks: starting points, each a different composition ----------
  // The first ADOPTED looks are the khyzr logo pattern, and the only looks here. LEAD is where any exploration
  // that follows them would begin: there are none.
  var ADOPTED = 2, LEAD = 0;
  var presets = {
    'The logo pattern, for white type': { arrangement: 'repeat', scale: 1.64, spacing: 0, turn: 'rows', colour: 'ink', strength: 1, spread: 0.7, ink: '#053805', solid: 1, ground: '#043304', ox: 0.2, oy: 0.1, fade: 0.26, fadeAngle: 143 },
    'The logo pattern, for ink type': { arrangement: 'repeat', scale: 1.64, spacing: 0, turn: 'rows', colour: 'ink', strength: 1, spread: 0.8, ink: '#EFF7EF', opacity: 0.3, ground: '#DBE9DB', ox: 0.2, oy: 0.1, fade: 0.26, fadeAngle: 143 }
  };

  // ---------- the element ----------
  if (root.customElements && !customElements.get('khyzr-logo-pattern')) {
    customElements.define('khyzr-logo-pattern', class extends HTMLElement {
      static get observedAttributes() { return ['recipe', 'preset', 'theme']; }
      connectedCallback() {
        if (this._c) return;
        this.style.display = this.style.display || 'block';
        var c = this._c = document.createElement('canvas'), self = this;
        c.style.cssText = 'display:block;width:100%;height:100%';
        c.setAttribute('aria-hidden', 'true');
        this.appendChild(c);
        if (root.ResizeObserver) { this._ro = new ResizeObserver(function () { self._draw(); }); this._ro.observe(this); }
        this._draw();
      }
      disconnectedCallback() { if (this._ro) this._ro.disconnect(); if (this._c) this._c.remove(); this._c = this._ro = null; }
      attributeChangedCallback() { if (this._c) this._draw(); }
      _recipe() {
        var p = this.getAttribute('preset'), j = this.getAttribute('recipe');
        var theme = this.getAttribute('theme') === 'light' ? 'The logo pattern, for ink type' : 'The logo pattern, for white type';
        return j ? norm(j) : norm(presets[p] || presets[theme]);
      }
      _draw() {
        var c = this._c, box = this.getBoundingClientRect(), px = Math.min(root.devicePixelRatio || 1, 2), self = this;
        var w = Math.round(box.width * px), h = Math.round(box.height * px), r = this._recipe(), info;
        this.style.backgroundColor = groundRep(r);
        if (w < 1 || h < 1) return;
        if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
        info = draw(c.getContext('2d'), r, w, h);
        if (info.pending && root.KhyzrField && !this._wait) {
          this._wait = true;
          root.KhyzrField.ready('mesh').then(function () { self._wait = false; if (self._c) self._draw(); });
        }
      }
    });
  }

  root.KhyzrLogoPattern = {
    draw: draw, still: still, svg: svg, layout: layout, norm: norm, presets: presets, ADOPTED: ADOPTED, LEAD: LEAD, DEFAULTS: DEFAULTS,
    ARRANGEMENTS: ARRANGEMENTS, SHAPES: SHAPES, LATTICES: LATTICES, TURNS: TURNS, WEAVES: WEAVES, LANES: LANES, SOURCES: SOURCES, COLOURS: COLOURS,
    FIELDS: FIELDS, MARK: MARK, BLADES: BLADE_D, isDark: isDark, groundRep: groundRep, lum: lum
  };
})(window);
