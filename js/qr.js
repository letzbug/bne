/*
 * qr.js — abhängigkeitsfreier QR-Code-Generator (Byte-Modus, Versionen 1–40).
 * Nach ISO/IEC 18004, Aufbau angelehnt an Project Nayuki (MIT-Lizenz).
 * Läuft vollständig offline.
 *   QR.encode(text, "M")  -> { size, version, isDark(x, y) }
 *   QR.toSVG(text, { ecl, margin, dark, light, title })  -> SVG-String
 */
(function (global) {
  'use strict';

  var ECL = { L: { ord: 0, bits: 1 }, M: { ord: 1, bits: 0 }, Q: { ord: 2, bits: 3 }, H: { ord: 3, bits: 2 } };

  var ECC_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  ];
  var NUM_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  ];

  function utf8Bytes(str) {
    if (typeof TextEncoder !== 'undefined') return Array.prototype.slice.call(new TextEncoder().encode(str));
    var out = [], s = unescape(encodeURIComponent(str));
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }

  function numRawDataModules(ver) {
    var result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) result -= 36;
    }
    return result;
  }

  function numDataCodewords(ver, ecl) {
    return Math.floor(numRawDataModules(ver) / 8) - ECC_PER_BLOCK[ecl.ord][ver] * NUM_BLOCKS[ecl.ord][ver];
  }

  function gfMul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xFF;
  }

  function rsDivisor(degree) {
    var result = [];
    for (var i = 0; i < degree - 1; i++) result.push(0);
    result.push(1);
    var root = 1;
    for (i = 0; i < degree; i++) {
      for (var j = 0; j < result.length; j++) {
        result[j] = gfMul(result[j], root);
        if (j + 1 < result.length) result[j] ^= result[j + 1];
      }
      root = gfMul(root, 0x02);
    }
    return result;
  }

  function rsRemainder(data, divisor) {
    var result = divisor.map(function () { return 0; });
    data.forEach(function (b) {
      var factor = b ^ result.shift();
      result.push(0);
      divisor.forEach(function (coef, i) { result[i] ^= gfMul(coef, factor); });
    });
    return result;
  }

  function getBit(x, i) { return ((x >>> i) & 1) !== 0; }

  function encode(text, eclName) {
    var ecl = ECL[eclName] || ECL.M;
    var bytes = utf8Bytes(String(text));
    var ver, dataCap;
    for (ver = 1; ver <= 40; ver++) {
      dataCap = numDataCodewords(ver, ecl) * 8;
      if (4 + (ver < 10 ? 8 : 16) + bytes.length * 8 <= dataCap) break;
    }
    if (ver > 40) throw new Error('QR: data too long');

    var bb = [];
    function push(val, len) { for (var i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1); }
    push(0x4, 4);
    push(bytes.length, ver < 10 ? 8 : 16);
    bytes.forEach(function (b) { push(b, 8); });
    push(0, Math.min(4, dataCap - bb.length));
    push(0, (8 - bb.length % 8) % 8);
    for (var pad = 0xEC; bb.length < dataCap; pad ^= 0xEC ^ 0x11) push(pad, 8);

    var data = [], i, j;
    for (i = 0; i < bb.length; i += 8) {
      var v = 0;
      for (j = 0; j < 8; j++) v = (v << 1) | bb[i + j];
      data.push(v);
    }

    var numBlocks = NUM_BLOCKS[ecl.ord][ver];
    var blockEccLen = ECC_PER_BLOCK[ecl.ord][ver];
    var rawCodewords = Math.floor(numRawDataModules(ver) / 8);
    var numShortBlocks = numBlocks - rawCodewords % numBlocks;
    var shortBlockLen = Math.floor(rawCodewords / numBlocks);
    var divisor = rsDivisor(blockEccLen);
    var blocks = [], k = 0;
    for (i = 0; i < numBlocks; i++) {
      var dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
      k += dat.length;
      var ecc = rsRemainder(dat, divisor);
      if (i < numShortBlocks) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var codewords = [];
    for (i = 0; i < blocks[0].length; i++) {
      for (j = 0; j < blocks.length; j++) {
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) codewords.push(blocks[j][i]);
      }
    }

    var size = ver * 4 + 17;
    var modules = [], isFn = [];
    for (i = 0; i < size; i++) {
      modules.push(new Array(size).fill(false));
      isFn.push(new Array(size).fill(false));
    }
    function setFn(x, y, dark) { modules[y][x] = dark; isFn[y][x] = true; }

    for (i = 0; i < size; i++) { setFn(6, i, i % 2 === 0); setFn(i, 6, i % 2 === 0); }

    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = cx + dx, yy = cy + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) setFn(xx, yy, d !== 2 && d !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);

    var align = [];
    if (ver > 1) {
      var numAlign = Math.floor(ver / 7) + 2;
      var step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (numAlign * 2 - 2)) * 2;
      align = [6];
      for (var pos = size - 7; align.length < numAlign; pos -= step) align.splice(1, 0, pos);
    }
    for (i = 0; i < align.length; i++) for (j = 0; j < align.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === align.length - 1) || (i === align.length - 1 && j === 0)) continue;
      for (var ay = -2; ay <= 2; ay++) for (var ax = -2; ax <= 2; ax++)
        setFn(align[i] + ax, align[j] + ay, Math.max(Math.abs(ax), Math.abs(ay)) !== 1);
    }

    function drawFormat(mask) {
      var d = (ecl.bits << 3) | mask, rem = d, n;
      for (n = 0; n < 10; n++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var bits = ((d << 10) | rem) ^ 0x5412;
      for (n = 0; n <= 5; n++) setFn(8, n, getBit(bits, n));
      setFn(8, 7, getBit(bits, 6));
      setFn(8, 8, getBit(bits, 7));
      setFn(7, 8, getBit(bits, 8));
      for (n = 9; n < 15; n++) setFn(14 - n, 8, getBit(bits, n));
      for (n = 0; n < 8; n++) setFn(size - 1 - n, 8, getBit(bits, n));
      for (n = 8; n < 15; n++) setFn(8, size - 15 + n, getBit(bits, n));
      setFn(8, size - 8, true);
    }
    drawFormat(0);

    if (ver >= 7) {
      var r = ver;
      for (i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
      var vbits = (ver << 12) | r;
      for (i = 0; i < 18; i++) {
        var bit = getBit(vbits, i), a = size - 11 + i % 3, b = Math.floor(i / 3);
        setFn(a, b, bit); setFn(b, a, bit);
      }
    }

    var bitIdx = 0, total = codewords.length * 8;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (j = 0; j < 2; j++) {
          var x = right - j;
          var upward = ((right + 1) & 2) === 0;
          var y = upward ? size - 1 - vert : vert;
          if (!isFn[y][x] && bitIdx < total) {
            modules[y][x] = getBit(codewords[bitIdx >>> 3], 7 - (bitIdx & 7));
            bitIdx++;
          }
        }
      }
    }

    function maskFn(m, x, y) {
      switch (m) {
        case 0: return (x + y) % 2 === 0;
        case 1: return y % 2 === 0;
        case 2: return x % 3 === 0;
        case 3: return (x + y) % 3 === 0;
        case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
        case 5: return (x * y) % 2 + (x * y) % 3 === 0;
        case 6: return ((x * y) % 2 + (x * y) % 3) % 2 === 0;
        default: return ((x + y) % 2 + (x * y) % 3) % 2 === 0;
      }
    }
    function applyMask(m) {
      for (var yy = 0; yy < size; yy++) for (var xx = 0; xx < size; xx++)
        if (!isFn[yy][xx] && maskFn(m, xx, yy)) modules[yy][xx] = !modules[yy][xx];
    }
    function penalty() {
      var p = 0, xx, yy, run, c;
      for (yy = 0; yy < size; yy++) {
        run = 1;
        for (xx = 1; xx < size; xx++) {
          if (modules[yy][xx] === modules[yy][xx - 1]) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
        }
      }
      for (xx = 0; xx < size; xx++) {
        run = 1;
        for (yy = 1; yy < size; yy++) {
          if (modules[yy][xx] === modules[yy - 1][xx]) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
        }
      }
      for (yy = 0; yy < size - 1; yy++) for (xx = 0; xx < size - 1; xx++) {
        c = modules[yy][xx];
        if (c === modules[yy][xx + 1] && c === modules[yy + 1][xx] && c === modules[yy + 1][xx + 1]) p += 3;
      }
      var pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
      function scan(get) {
        for (var s = 0; s <= size - 11; s++) {
          var m1 = true, m2 = true;
          for (var q = 0; q < 11; q++) {
            var val = get(s + q) ? 1 : 0;
            if (val !== pat1[q]) m1 = false;
            if (val !== pat2[q]) m2 = false;
          }
          if (m1) p += 40;
          if (m2) p += 40;
        }
      }
      for (yy = 0; yy < size; yy++) scan(function (q) { return modules[yy][q]; });
      for (xx = 0; xx < size; xx++) scan(function (q) { return modules[q][xx]; });
      var dark = 0;
      for (yy = 0; yy < size; yy++) for (xx = 0; xx < size; xx++) if (modules[yy][xx]) dark++;
      var tot = size * size;
      p += Math.max(0, Math.ceil(Math.abs(dark * 20 - tot * 10) / tot) - 1) * 10;
      return p;
    }

    var best = 0, bestP = Infinity;
    for (var m = 0; m < 8; m++) {
      applyMask(m); drawFormat(m);
      var pp = penalty();
      if (pp < bestP) { bestP = pp; best = m; }
      applyMask(m);
    }
    applyMask(best); drawFormat(best);

    return {
      size: size, version: ver, mask: best,
      isDark: function (x, y) { return x >= 0 && y >= 0 && x < size && y < size && modules[y][x]; }
    };
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function toSVG(text, opts) {
    opts = opts || {};
    var qr = encode(text, opts.ecl || 'M');
    var margin = opts.margin == null ? 4 : opts.margin;
    var dim = qr.size + margin * 2, d = '';
    for (var y = 0; y < qr.size; y++) for (var x = 0; x < qr.size; x++)
      if (qr.isDark(x, y)) d += 'M' + (x + margin) + ' ' + (y + margin) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dim + ' ' + dim + '" shape-rendering="crispEdges" role="img"' +
      (opts.title ? ' aria-label="' + esc(opts.title) + '"' : '') + '>' +
      '<rect width="' + dim + '" height="' + dim + '" fill="' + (opts.light || '#ffffff') + '"/>' +
      '<path d="' + d + '" fill="' + (opts.dark || '#000000') + '"/></svg>';
  }

  global.QR = { encode: encode, toSVG: toSVG };
})(typeof window !== 'undefined' ? window : globalThis);
