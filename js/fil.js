/*
 * fil.js — der lebendige Faden.
 * 17 Fasern (eine pro Nachhaltigkeitsziel) winden sich als Zopf um eine gemeinsame Mittellinie.
 * Die Mittellinie nimmt je Bildschirm eine andere Form an (Welle, Weg durch Knoten, Schlinge,
 * Wäscheleine) und gleitet weich von einer Form zur nächsten. Berührungen ziehen den Faden an.
 * Koordinaten: Bühnenpixel 1080 × 1920.
 */
(function (global) {
  'use strict';

  var W = 1080, H = 1920;
  var QUALITY = {
    high:     { points: 96, scaleCap: 2,   glow: true,  particles: 42 },
    balanced: { points: 72, scaleCap: 1.5, glow: true,  particles: 26 },
    low:      { points: 52, scaleCap: 1,   glow: false, particles: 0 }
  };
  var ORDER = ['high', 'balanced', 'low'];

  function hexToRgb(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function lighten(rgb, k) {
    return [rgb[0] + (255 - rgb[0]) * k, rgb[1] + (255 - rgb[1]) * k, rgb[2] + (255 - rgb[2]) * k].map(Math.round);
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')'; }

  // Catmull-Rom durch Stützpunkte, liefert dichte Punktliste
  function catmull(pts, samplesPerSeg) {
    var out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (var s = 0; s < samplesPerSeg; s++) {
        var t = s / samplesPerSeg, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(pts[pts.length - 1].slice());
    return out;
  }

  // Polylinie gleichmäßig nach Bogenlänge auf n Punkte verteilen
  function resample(poly, n, out) {
    var lens = [0], i;
    for (i = 1; i < poly.length; i++) {
      var dx = poly[i][0] - poly[i - 1][0], dy = poly[i][1] - poly[i - 1][1];
      lens.push(lens[i - 1] + Math.sqrt(dx * dx + dy * dy));
    }
    var total = lens[lens.length - 1] || 1, j = 1;
    for (i = 0; i < n; i++) {
      var target = total * i / (n - 1);
      while (j < lens.length - 1 && lens[j] < target) j++;
      var seg = lens[j] - lens[j - 1] || 1, f = (target - lens[j - 1]) / seg;
      out[i * 2] = poly[j - 1][0] + (poly[j][0] - poly[j - 1][0]) * f;
      out[i * 2 + 1] = poly[j - 1][1] + (poly[j][1] - poly[j - 1][1]) * f;
    }
    return out;
  }

  // ---------- Formen (liefern Stützpunkte, t = Zeit in s) ----------
  var SHAPES = {
    // Diagonale, lebendige S-Kurve zwischen Tagline und Startaufforderung:
    // Titel oben und Aufforderung unten bleiben frei lesbar.
    attract: function (t) {
      var pts = [], amp = 210 + 40 * Math.sin(t * 0.21);
      for (var i = 0; i <= 26; i++) {
        var s = i / 26;
        var wob = amp * Math.sin(s * Math.PI * 2.2 + t * 0.32) * (0.6 + 0.4 * Math.sin(s * 3 + t * 0.17));
        pts.push([-180 + s * 1440 + 0.25 * wob, 470 + s * 760 + wob]);
      }
      return pts;
    },
    through: function (t, o) {
      var pts = o.points.map(function (p, i) {
        return [p[0] + 7 * Math.sin(t * 0.9 + i * 1.7), p[1] + 7 * Math.cos(t * 0.7 + i * 1.3)];
      });
      return catmull(pts, 12);
    },
    loop: function (t, o) {
      var cx = o.cx, cy = o.cy, r = o.r, pts = [], i;
      var breathe = 1 + 0.02 * Math.sin(t * 1.1);
      var inY = o.inY != null ? o.inY : 1.9, outY = o.outY != null ? o.outY : -1.4;
      pts.push([-160, cy + r * inY]);
      pts.push([cx - r * 2.0, cy + r * inY * 0.7]);
      for (i = 0; i <= 28; i++) {
        var a = Math.PI * 0.75 + i / 28 * Math.PI * 2.05;
        pts.push([cx + Math.cos(a) * r * breathe, cy + Math.sin(a) * r * breathe]);
      }
      pts.push([cx + r * 2.1, cy + r * outY]);
      pts.push([W + 160, cy + r * outY * 1.5]);
      return catmull(pts, 3);
    },
    line: function (t, o) {
      var pts = [];
      for (var i = 0; i <= 30; i++) {
        var x = -120 + i / 30 * (W + 240);
        pts.push([x, lineY(o, x) + 2.5 * Math.sin(t * 0.8 + i * 0.6)]);
      }
      return pts;
    },
    horizon: function (t, o) {
      var pts = [], y0 = o.y || 1700, amp = o.amp != null ? o.amp : 1;
      for (var i = 0; i <= 30; i++) {
        var x = -120 + i / 30 * (W + 240);
        pts.push([x, y0 + amp * (22 * Math.sin(x / 170 + t * 0.55) + 10 * Math.sin(x / 61 - t * 0.9))]);
      }
      return pts;
    }
  };

  // Wäscheleine: leichter Durchhang zwischen zwei Aufhängepunkten
  function lineY(o, x) {
    var u = (x - 540) / 640;
    return o.y + (o.sag || 60) * (1 - u * u);
  }

  function Fil(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.colorsHex = opts.colors;
    this.colors = opts.colors.map(function (h, i) {
      var rgb = hexToRgb(h);
      return lighten(rgb, i >= 15 ? 0.38 : 0.16); // dunkle Ziele 16/17 für den dunklen Grund aufhellen
    });
    this.reduced = !!opts.reducedMotion;
    this.particlesOn = opts.particles !== false;
    this.autoQuality = opts.quality === 'auto' || !opts.quality;
    this.qualityName = this.autoQuality ? 'high' : opts.quality;
    this.q = QUALITY[this.qualityName];
    this.n = this.q.points;
    this.cur = new Float32Array(this.n * 2);
    this.tgt = new Float32Array(this.n * 2);
    this.disp = new Float32Array(this.n * 2);
    this.scale = 1;
    this.t = 0;
    this.last = 0;
    this.running = false;
    this.shape = { fn: SHAPES.attract, opts: {}, width: 70, deform: true, twist: 2.2, spin: 0.55, alpha: 1 };
    this.width = 70; this.alpha = 1;
    this.pointer = { x: 0, y: 0, active: false, power: 0 };
    this.ripples = [];
    this.frameTimes = [];
    this.slowSince = 0;
    this.fps = 60;
    this.particles = [];
    var seed = resample(this.shape.fn(0, {}), this.n, this.cur);
    this.cur.set(seed);
    this._spawnParticles();
    this._loop = this._loop.bind(this);
  }

  Fil.prototype._spawnParticles = function () {
    this.particles = [];
    if (!this.particlesOn || this.reduced) return;
    for (var i = 0; i < this.q.particles; i++) {
      this.particles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 6, vy: -4 - Math.random() * 10,
        r: 1.4 + Math.random() * 2.6, c: this.colors[i % 17], a: 0.15 + Math.random() * 0.3, ph: Math.random() * 6.28
      });
    }
  };

  Fil.prototype.resize = function (stageScale, dpr) {
    this.scale = Math.max(0.5, Math.min(stageScale * (dpr || 1), this.q.scaleCap));
    this.canvas.width = Math.round(W * this.scale);
    this.canvas.height = Math.round(H * this.scale);
    this.canvas.style.width = W + 'px';
    this.canvas.style.height = H + 'px';
    this.lastStage = stageScale; this.lastDpr = dpr;
  };

  Fil.prototype.setQuality = function (name, auto) {
    if (!QUALITY[name]) return;
    this.autoQuality = !!auto;
    if (name === this.qualityName) return;
    this.qualityName = name; this.q = QUALITY[name];
    var old = this.cur, oldN = this.n, poly = [];
    for (var i = 0; i < oldN; i++) poly.push([old[i * 2], old[i * 2 + 1]]);
    this.n = this.q.points;
    this.cur = new Float32Array(this.n * 2); this.tgt = new Float32Array(this.n * 2); this.disp = new Float32Array(this.n * 2);
    resample(poly, this.n, this.cur);
    this._spawnParticles();
    if (this.lastStage) this.resize(this.lastStage, this.lastDpr);
  };

  Fil.prototype.setReduced = function (on) { this.reduced = !!on; this._spawnParticles(); };

  /**
   * Form setzen. name: attract | through | loop | line | horizon
   * opts: Formparameter + { width, deform, twist, spin, alpha }
   */
  Fil.prototype.setShape = function (name, opts) {
    opts = opts || {};
    this.shape = {
      fn: SHAPES[name] || SHAPES.horizon, opts: opts,
      width: opts.width != null ? opts.width : 40,
      deform: !!opts.deform, twist: opts.twist || 2.4, spin: opts.spin != null ? opts.spin : 0.5,
      alpha: opts.alpha != null ? opts.alpha : 1
    };
  };

  Fil.prototype.lineY = function (o, x) { return lineY(o, x); };

  Fil.prototype.touch = function (x, y, active) {
    this.pointer.x = x; this.pointer.y = y; this.pointer.active = active;
  };

  Fil.prototype.ripple = function (x, y) {
    if (this.reduced) return;
    this.ripples.push({ x: x, y: y, t: 0 });
  };

  Fil.prototype.start = function () {
    if (this.running) return;
    this.running = true; this.last = performance.now();
    requestAnimationFrame(this._loop);
  };
  Fil.prototype.stop = function () { this.running = false; };

  Fil.prototype._loop = function (now) {
    if (!this.running) return;
    var dt = Math.min(0.05, (now - this.last) / 1000 || 0.016);
    this.last = now;
    this._track(dt, now);
    this._step(dt);
    this._draw();
    requestAnimationFrame(this._loop);
  };

  // Bildrate messen und bei Bedarf Qualität senken
  Fil.prototype._track = function (dt, now) {
    this.frameTimes.push(dt);
    if (this.frameTimes.length > 60) this.frameTimes.shift();
    var avg = this.frameTimes.reduce(function (a, b) { return a + b; }, 0) / this.frameTimes.length;
    this.fps = Math.round(1 / avg);
    if (!this.autoQuality || this.frameTimes.length < 60) return;
    if (avg > 1 / 38) {
      if (!this.slowSince) this.slowSince = now;
      if (now - this.slowSince > 3000) {
        var idx = ORDER.indexOf(this.qualityName);
        if (idx < ORDER.length - 1) { this.setQuality(ORDER[idx + 1], true); this.frameTimes = []; }
        this.slowSince = 0;
      }
    } else this.slowSince = 0;
  };

  Fil.prototype._step = function (dt) {
    var speed = this.reduced ? 0.25 : 1;
    this.t += dt * speed;
    var sh = this.shape, n = this.n;
    resample(sh.fn(this.t, sh.opts), n, this.tgt);
    var k = 1 - Math.exp(-dt * (this.reduced ? 6 : 2.6));
    var kd = 1 - Math.exp(-dt * 7);
    var p = this.pointer;
    p.power += ((p.active && sh.deform ? 1 : 0) - p.power) * (1 - Math.exp(-dt * 5));
    for (var i = 0; i < n; i++) {
      var ix = i * 2, iy = ix + 1;
      this.cur[ix] += (this.tgt[ix] - this.cur[ix]) * k;
      this.cur[iy] += (this.tgt[iy] - this.cur[iy]) * k;
      var wantX = 0, wantY = 0;
      if (p.power > 0.01) {
        var dx = p.x - this.cur[ix], dy = p.y - this.cur[iy];
        var w = Math.exp(-(dx * dx + dy * dy) / (2 * 230 * 230)) * 0.55 * p.power;
        wantX = dx * w; wantY = dy * w;
      }
      this.disp[ix] += (wantX - this.disp[ix]) * kd;
      this.disp[iy] += (wantY - this.disp[iy]) * kd;
    }
    this.width += (sh.width - this.width) * k;
    this.alpha += (sh.alpha - this.alpha) * k;
    for (var r = this.ripples.length - 1; r >= 0; r--) {
      this.ripples[r].t += dt;
      if (this.ripples[r].t > 1.4) this.ripples.splice(r, 1);
    }
    for (var q = 0; q < this.particles.length; q++) {
      var pa = this.particles[q];
      pa.x += pa.vx * dt; pa.y += pa.vy * dt; pa.ph += dt;
      if (pa.y < -20) { pa.y = H + 20; pa.x = Math.random() * W; }
      if (pa.x < -20) pa.x = W + 20; if (pa.x > W + 20) pa.x = -20;
    }
  };

  Fil.prototype._draw = function () {
    var ctx = this.ctx, s = this.scale, n = this.n, sh = this.shape;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // Partikel
    for (var q = 0; q < this.particles.length; q++) {
      var pa = this.particles[q];
      ctx.fillStyle = rgba(pa.c, pa.a * (0.6 + 0.4 * Math.sin(pa.ph)) * this.alpha);
      ctx.beginPath(); ctx.arc(pa.x, pa.y, pa.r, 0, 6.2832); ctx.fill();
    }

    // Mittellinie inkl. Verformung, Normalen
    var px = new Float32Array(n), py = new Float32Array(n), nx = new Float32Array(n), ny = new Float32Array(n), i;
    for (i = 0; i < n; i++) { px[i] = this.cur[i * 2] + this.disp[i * 2]; py[i] = this.cur[i * 2 + 1] + this.disp[i * 2 + 1]; }
    for (i = 0; i < n; i++) {
      var a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
      var tx = px[b] - px[a], ty = py[b] - py[a], l = Math.sqrt(tx * tx + ty * ty) || 1;
      nx[i] = -ty / l; ny[i] = tx / l;
    }
    // Wellen von Berührungen verbreitern den Zopf kurz
    var rip = new Float32Array(n);
    for (var r = 0; r < this.ripples.length; r++) {
      var R = this.ripples[r], front = R.t * 900, fade = 1 - R.t / 1.4;
      for (i = 0; i < n; i++) {
        var dd = Math.abs(Math.hypot(px[i] - R.x, py[i] - R.y) - front);
        rip[i] += Math.exp(-dd * dd / (2 * 90 * 90)) * fade;
      }
    }

    var Wd = this.width, tw = sh.twist, t = this.t, spin = sh.spin, alpha = this.alpha;
    var glow = this.q.glow;
    var xs = new Float32Array(n), ys = new Float32Array(n), depth = new Float32Array(n);
    for (var k = 0; k < 17; k++) {
      var phase = k * 6.2832 / 17, col = this.colors[k];
      for (i = 0; i < n; i++) {
        var u = i / (n - 1);
        var ang = 6.2832 * tw * u + phase + t * spin;
        var off = Wd * (1 + 1.6 * rip[i]) * Math.sin(ang);
        xs[i] = px[i] + nx[i] * off;
        ys[i] = py[i] + ny[i] * off;
        depth[i] = Math.cos(ang);
      }
      // hinten liegende Abschnitte zuerst, dünn und gedämpft
      this._strokeWhere(xs, ys, depth, false, rgba(col, 0.32 * alpha), 2.2);
      if (glow) this._strokeWhere(xs, ys, depth, true, rgba(col, 0.10 * alpha), 11);
      this._strokeWhere(xs, ys, depth, true, rgba(col, 0.92 * alpha), 3.4);
    }
    ctx.globalCompositeOperation = 'source-over';
  };

  Fil.prototype._strokeWhere = function (xs, ys, depth, front, style, lw) {
    var ctx = this.ctx, n = xs.length, open = false;
    ctx.strokeStyle = style; ctx.lineWidth = lw;
    ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var on = front ? depth[i] >= -0.05 : depth[i] < 0.05;
      if (on) {
        if (!open) { ctx.moveTo(xs[i], ys[i]); open = true; } else ctx.lineTo(xs[i], ys[i]);
      } else open = false;
    }
    ctx.stroke();
  };

  global.Fil = Fil;
  global.FilShapes = { lineY: lineY, catmull: catmull };
})(window);
