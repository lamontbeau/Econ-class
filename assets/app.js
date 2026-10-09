/* 事件研究基准期探索器 + 课前诊断自测
   纯前端，无后端依赖，可直接部署于 GitHub Pages。
   《高级计量经济学与AI运用》课程站 */
'use strict';

var T = [-4, -3, -2, -1, 0, 1, 2, 3];

/* 三组案例的"真值"系数，均以 k0=-4 为原始基准 */
/* sigma 经校准，使 k0=-4 时各组的显著性形态与课堂发放的静态图一致：
   A 组事前全不显著；B 组仅 t=-1 显著；C 组事前全不显著（靠斜率才能识破） */
var CASES = {
  A: { name: 'A 组', sigma: 0.037,
       b: [0.00, -0.02, 0.03, 0.01, 0.31, 0.44, 0.49, 0.53],
       truth: '真实满足平行趋势' },
  B: { name: 'B 组', sigma: 0.040,
       b: [0.00, 0.04, 0.11, 0.24, 0.42, 0.51, 0.55, 0.58],
       truth: '预期效应型伪平行' },
  C: { name: 'C 组', sigma: 0.068,
       b: [0.00, 0.07, 0.15, 0.22, 0.30, 0.38, 0.44, 0.51],
       truth: '差异趋势型伪平行' }
};

/* 以 k0 重新中心化：beta_k - beta_k0；标准误按 sigma*sqrt(|k-k0|) 近似 */
function rebase(cs, k0) {
  var i0 = T.indexOf(k0), out = [];
  for (var i = 0; i < T.length; i++) {
    var d = Math.abs(T[i] - k0);
    out.push({ t: T[i], b: cs.b[i] - cs.b[i0], se: cs.sigma * Math.sqrt(d),
               base: T[i] === k0 });
  }
  return out;
}

function preSlope(pts) {
  var p = pts.filter(function (d) { return d.t < 0; });
  var n = p.length, sx = 0, sy = 0, sxy = 0, sxx = 0;
  p.forEach(function (d) { sx += d.t; sy += d.b; sxy += d.t * d.b; sxx += d.t * d.t; });
  return (n * sxy - sx * sy) / (n * sxx - sx * sx);
}

function anySigPre(pts) {
  return pts.some(function (d) {
    return d.t < 0 && !d.base && Math.abs(d.b) - 1.96 * d.se > 0;
  });
}

/* ---------------- SVG 绘图 ---------------- */
var W = 560, H = 340, M = { t: 18, r: 16, b: 44, l: 54 };

function draw(el, pts, k0) {
  var iw = W - M.l - M.r, ih = H - M.t - M.b;
  var lo = -0.55, hi = 0.75;
  pts.forEach(function (d) {
    lo = Math.min(lo, d.b - 1.96 * d.se - 0.06);
    hi = Math.max(hi, d.b + 1.96 * d.se + 0.06);
  });
  var x = function (t) { return M.l + (t + 4.5) / 8 * iw; };
  var y = function (v) { return M.t + (hi - v) / (hi - lo) * ih; };
  var s = ['<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" ' +
           'role="img" aria-label="事件研究图，基准期 t=' + k0 + '">'];

  /* y 网格 */
  for (var g = Math.ceil(lo * 5) / 5; g <= hi; g += 0.2) {
    var gv = Math.round(g * 100) / 100;
    s.push('<line x1="' + M.l + '" y1="' + y(gv).toFixed(1) + '" x2="' +
      (W - M.r) + '" y2="' + y(gv).toFixed(1) +
      '" stroke="#D3DDEC" stroke-width="1"/>');
    s.push('<text x="' + (M.l - 9) + '" y="' + (y(gv) + 4).toFixed(1) +
      '" font-size="11" fill="#5E6A82" text-anchor="end">' +
      gv.toFixed(1) + '</text>');
  }
  /* 零线与政策线 */
  s.push('<line x1="' + M.l + '" y1="' + y(0).toFixed(1) + '" x2="' +
    (W - M.r) + '" y2="' + y(0).toFixed(1) +
    '" stroke="#5E6A82" stroke-width="1.4"/>');
  s.push('<line x1="' + x(-0.5).toFixed(1) + '" y1="' + M.t + '" x2="' +
    x(-0.5).toFixed(1) + '" y2="' + (H - M.b) +
    '" stroke="#B46A00" stroke-width="1.4" stroke-dasharray="5 4"/>');

  /* 事前趋势外推线 */
  var k = preSlope(pts), i0 = T.indexOf(k0);
  var a = pts[i0].b - k * k0;
  s.push('<line x1="' + x(-4.3).toFixed(1) + '" y1="' + y(a + k * -4.3).toFixed(1) +
    '" x2="' + x(3.3).toFixed(1) + '" y2="' + y(a + k * 3.3).toFixed(1) +
    '" stroke="#990011" stroke-width="1.2" stroke-dasharray="6 4" opacity="0.6"/>');

  /* 系数点与置信区间 */
  pts.forEach(function (d) {
    var xp = x(d.t), ci = 1.96 * d.se;
    var sig = !d.base && Math.abs(d.b) - ci > 0;
    var col = d.base ? '#5E6A82' : (sig && d.t < 0 ? '#990011' : '#1E2761');
    if (!d.base) {
      s.push('<line x1="' + xp.toFixed(1) + '" y1="' + y(d.b - ci).toFixed(1) +
        '" x2="' + xp.toFixed(1) + '" y2="' + y(d.b + ci).toFixed(1) +
        '" stroke="' + col + '" stroke-width="1.6"/>');
      [d.b - ci, d.b + ci].forEach(function (v) {
        s.push('<line x1="' + (xp - 4).toFixed(1) + '" y1="' + y(v).toFixed(1) +
          '" x2="' + (xp + 4).toFixed(1) + '" y2="' + y(v).toFixed(1) +
          '" stroke="' + col + '" stroke-width="1.6"/>');
      });
    }
    s.push('<circle cx="' + xp.toFixed(1) + '" cy="' + y(d.b).toFixed(1) +
      '" r="' + (d.base ? 5 : 4.6) + '" fill="' +
      (d.base ? '#D3DDEC' : '#fff') + '" stroke="' + col + '" stroke-width="2"/>');
    s.push('<text x="' + xp.toFixed(1) + '" y="' + (H - M.b + 18) +
      '" font-size="11.5" fill="#5E6A82" text-anchor="middle">' +
      (d.t < 0 ? '−' + Math.abs(d.t) : d.t) + '</text>');
  });
  s.push('<text x="' + (M.l + iw / 2) + '" y="' + (H - 6) +
    '" font-size="11.5" fill="#5E6A82" text-anchor="middle">' +
    '相对政策时点 t（灰点为基准期）</text>');
  s.push('</svg>');
  el.innerHTML = s.join('');
}

/* ---------------- 联动读数 ---------------- */
function render() {
  var key = document.querySelector('[name=esCase]:checked').value;
  var k0 = parseInt(document.querySelector('[name=esBase]:checked').value, 10);
  var cs = CASES[key], pts = rebase(cs, k0);
  draw(document.getElementById('esChart'), pts, k0);

  var sl = preSlope(pts), b0 = pts[T.indexOf(0)].b, sig = anySigPre(pts);
  var naive = sig ? '判为不可信' : '判为可信';
  document.getElementById('esRead').innerHTML =
    '<tr><td>事前系数中是否存在显著项</td><td><b>' +
      (sig ? '有' : '无') + '</b></td></tr>' +
    '<tr><td>事前拟合斜率（每期）</td><td><b>' + sl.toFixed(3) +
      '</b>　<span style="color:#5E6A82">换基准期不改变斜率</span></td></tr>' +
    '<tr><td>事后首期效应 &beta;<sub>0</sub></td><td><b>' + b0.toFixed(2) +
      '</b></td></tr>' +
    '<tr><td>按"事前不显著即通过"的判法</td><td><b style="color:' +
      (sig ? '#990011' : '#B46A00') + '">' + naive + '</b></td></tr>';
  document.getElementById('esHint').innerHTML =
    { A: '换任何基准期，事前斜率都是 0.008、事后效应都在 0.30 上下——' +
         '<b>对基准期不敏感，这才是可信设计的签名特征。</b>',
      B: '基准期移到 −1，事后效应从 0.42 掉到 0.18。违背没有消失，' +
         '只是从事前跑到了基准另一侧——<b>预期效应被基准期吸收，政策效应被严重低估。</b>',
      C: '注意：<b>四个基准期下，事前系数没有一个是显著的</b>——' +
         '按"不显著即通过"的判法，C 组永远过关。但事前斜率恒为 0.074，' +
         '与事后斜率相同；基准期移到 −1 后事后效应从 0.30 塌到 0.08。' +
         '<b>能识破它的只有斜率，不是显著性。</b>'
    }[key];
}

/* ---------------- 六道诊断题自测 ---------------- */
var QUIZ = [
  { q: '平行趋势假设约束的是已观测到的事前趋势，还是反事实趋势？',
    o: ['已观测到的事前趋势', '反事实趋势'], a: 1,
    why: '假设约束的是"若无政策会怎样"这一反事实。事前趋势只是它的可观测推论，是间接证据。' },
  { q: '【陷阱题】事前系数逐个不显著，即可判定平行趋势成立，对吗？',
    o: ['对', '不对'], a: 1,
    why: '未拒绝原假设不等于原假设为真。标准误过大时，"不显著"只说明没检验出来。这是本课程 71% 学生在前测中犯的错。' },
  { q: '报告事件研究结果时，关于基准期必须交代什么？',
    o: ['软件默认即可，无需说明', '选了哪一期、为什么，并做敏感性检验'], a: 1,
    why: '基准期是研究者的选择，直接决定图形形状。存在预期效应时取 −1 会把预期吸收进基准。' },
  { q: '差异趋势与预期效应，对 DID 估计的偏误方向分别是？',
    o: ['都高估', '差异趋势通常高估，预期效应通常低估'], a: 1,
    why: '差异趋势把趋势差异误计为效应；预期效应让一部分效应提前发生，被基准期吸收。' },
  { q: '【陷阱题】安慰剂检验显示伪政策系数不显著，是否说明识别策略可信？',
    o: ['是', '不足以说明'], a: 1,
    why: '取决于设计：伪时点是否仍含真实政策期、随机指派重复多少次、判读标准是什么。说不清设计的安慰剂检验不构成证据。' },
  { q: '事后系数显著为正，能否说明政策有效？',
    o: ['能', '要先看事后各点是否落在事前趋势外推线上'], a: 1,
    why: '若事后点全部落在外推线上，显著性来自趋势本身。这正是上面 C 组的形态。' }
];

function buildQuiz() {
  var box = document.getElementById('quiz');
  if (!box) return;
  QUIZ.forEach(function (item, i) {
    var d = document.createElement('div');
    d.className = 'card tint';
    d.style.marginBottom = '14px';
    var opts = item.o.map(function (o, j) {
      return '<label style="display:block;cursor:pointer;margin:6px 0">' +
        '<input type="radio" name="q' + i + '" value="' + j + '"> ' + o + '</label>';
    }).join('');
    d.innerHTML = '<h4>第 ' + (i + 1) + ' 题　' + item.q + '</h4>' +
      '<div class="ui" style="font-size:15px">' + opts + '</div>' +
      '<p class="fb" style="display:none;margin:12px 0 0;padding:11px 14px;' +
      'background:#fff;border-left:3px solid #B46A00;font-size:14.5px"></p>';
    box.appendChild(d);
    d.addEventListener('change', function () {
      var pick = +d.querySelector('input:checked').value;
      var fb = d.querySelector('.fb');
      fb.style.display = 'block';
      fb.innerHTML = (pick === item.a ? '' : '<b style="color:#990011">' +
        '这是前测中的高频误区。</b> ') + item.why +
        '<br><span style="color:#5E6A82">课上的智能体不会像这样直接给解释——' +
        '它只会追问。这里给出说明，是因为你已经作答了。</span>';
    });
  });
}

/* ---------------- IV / RDD / SCM 交互诊断关卡 ---------------- */
function olsSimple(x, y) {
  var n = x.length, sx = 0, sy = 0, i;
  for (i = 0; i < n; i++) { sx += x[i]; sy += y[i]; }
  var mx = sx / n, my = sy / n, sxy = 0, sxx = 0;
  for (i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) * (x[i] - mx); }
  var b = sxy / sxx, a = my - b * mx, sse = 0;
  for (i = 0; i < n; i++) { var r = y[i] - (a + b * x[i]); sse += r * r; }
  var seB = Math.sqrt((sse / (n - 2)) / sxx);
  var t = b / seB;
  return { a: a, b: b, t: t, f: t * t };
}

function seeded(seed) {
  return {
    next: function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; },
    randn: function () {
      var u = Math.max(this.next(), 1e-9), v = this.next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
  };
}

var IVN = 70, ivZ = [], ivEps = [];
(function () {
  var r = seeded(12345);
  for (var i = 0; i < IVN; i++) {
    ivZ.push((i / (IVN - 1)) * 5 - 2.5 + r.randn() * 0.12);
    ivEps.push(r.randn());
  }
})();

function drawIV() {
  var slider = document.getElementById('ivStrength');
  var slope = 0.02 + (slider.value / 100) * 1.55;
  var x = [], y = [], i;
  for (i = 0; i < IVN; i++) { x.push(ivZ[i]); y.push(slope * ivZ[i] + ivEps[i] * 0.55); }
  var fit = olsSimple(x, y), f = fit.f, strong = f >= 10;
  document.getElementById('ivLabel').textContent =
    slider.value < 33 ? '弱' : (slider.value < 66 ? '中等' : '强');

  var w = 560, h = 320, m = { t: 18, r: 16, b: 44, l: 54 };
  var iw = w - m.l - m.r, ih = h - m.t - m.b;
  var xlo = -3, xhi = 3;
  var ylo = Math.min.apply(null, y) - 0.3, yhi = Math.max.apply(null, y) + 0.3;
  var xs = function (v) { return m.l + (v - xlo) / (xhi - xlo) * iw; };
  var ys = function (v) { return m.t + (yhi - v) / (yhi - ylo) * ih; };
  var col = strong ? '#17766B' : '#A8321E';

  var s = ['<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" role="img" aria-label="工具变量强弱散点图">'];
  for (i = 0; i < x.length; i++) {
    s.push('<circle cx="' + xs(x[i]).toFixed(1) + '" cy="' + ys(y[i]).toFixed(1) +
      '" r="3.6" fill="white" stroke="#0D3B4F" stroke-width="1"/>');
  }
  s.push('<line x1="' + xs(xlo).toFixed(1) + '" y1="' + ys(fit.a + fit.b * xlo).toFixed(1) +
    '" x2="' + xs(xhi).toFixed(1) + '" y2="' + ys(fit.a + fit.b * xhi).toFixed(1) +
    '" stroke="' + col + '" stroke-width="2"/>');
  s.push('<line x1="' + m.l + '" y1="' + (h - m.b) + '" x2="' + (w - m.r) + '" y2="' + (h - m.b) +
    '" stroke="#5B6B72" stroke-width="1"/>');
  s.push('<text x="' + (m.l + iw / 2) + '" y="' + (h - 8) +
    '" font-size="11.5" fill="#5B6B72" text-anchor="middle">工具变量 Z</text>');
  s.push('<text x="' + (m.l + 8) + '" y="' + (m.t + 16) + '" font-size="13" font-weight="bold" fill="' +
    col + '">F 统计量 = ' + f.toFixed(1) + '</text>');
  s.push('</svg>');
  document.getElementById('ivChart').innerHTML = s.join('');

  document.getElementById('ivRead').innerHTML =
    '<tr><td>第一阶段 F 统计量</td><td><b>' + f.toFixed(1) + '</b></td></tr>' +
    '<tr><td>经验阈值</td><td><b>10</b></td></tr>' +
    '<tr><td>判定</td><td><b style="color:' + col + '">' +
    (strong ? '可信 · 强工具' : '不可信 · 弱工具') + '</b></td></tr>';
  document.getElementById('ivHint').innerHTML = strong ?
    'F 已超过经验阈值 10，工具变量对内生变量有足够解释力，2SLS 估计量的偏误可以接受。' :
    'F 低于阈值 10，第一阶段几乎没有解释力。此时 2SLS 不是"更保守的 OLS"，' +
    '而可能是偏误更大、置信区间更不可靠的估计量。';
}

var rddData = {};
(function () {
  var r = seeded(777), n = 220, clean = [], bunch = [], i, xu, xb, xb2;
  for (i = 0; i < n; i++) {
    xu = (i / (n - 1)) * 20 - 10;
    clean.push({ x: xu, y: 0.4 + 0.03 * xu + 0.9 * (xu >= 0 ? 1 : 0) + r.randn() * 0.35 });
  }
  var m1 = Math.floor(n * 0.78), m2 = n - m1;
  for (i = 0; i < m1; i++) {
    xb = Math.max(-10, Math.min(10, r.randn() * 3.4));
    bunch.push({ x: xb, y: 0.4 + 0.03 * xb + 0.9 * (xb >= 0 ? 1 : 0) + r.randn() * 0.35 });
  }
  for (i = 0; i < m2; i++) {
    xb2 = Math.max(-10, Math.min(10, -0.6 + r.randn() * 0.5));
    bunch.push({ x: xb2, y: 0.4 + 0.03 * xb2 + 0.9 * (xb2 >= 0 ? 1 : 0) + r.randn() * 0.35 });
  }
  rddData.clean = clean; rddData.bunch = bunch;
})();

function localFit(pts, side) {
  var sub = pts.filter(function (p) { return side < 0 ? p.x < 0 : p.x >= 0; });
  return olsSimple(sub.map(function (p) { return p.x; }), sub.map(function (p) { return p.y; }));
}

function drawRDD() {
  var key = document.querySelector('[name=rddCase]:checked').value;
  var pts = rddData[key];
  var fitL = localFit(pts, -1), fitR = localFit(pts, 1);
  var jump = (fitR.a + fitR.b * 0) - (fitL.a + fitL.b * 0);
  var near = pts.filter(function (p) { return p.x > -1.4 && p.x < 0; }).length;
  var share = near / pts.length, bunched = share > 0.12;

  var w = 560, h = 320, m = { t: 18, r: 16, b: 44, l: 54 };
  var iw = w - m.l - m.r, ih = h - m.t - m.b;
  var xlo = -10.4, xhi = 10.4, ylo = -0.6, yhi = 3.2;
  var xs = function (v) { return m.l + (v - xlo) / (xhi - xlo) * iw; };
  var ys = function (v) { return m.t + (yhi - v) / (yhi - ylo) * ih; };
  var col = bunched ? '#A8321E' : '#17766B';

  var s = ['<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" role="img" aria-label="断点回归散点图">'];
  pts.forEach(function (p) {
    s.push('<circle cx="' + xs(p.x).toFixed(1) + '" cy="' + ys(p.y).toFixed(1) +
      '" r="2.6" fill="#BFD3DA" stroke="#0D3B4F" stroke-width="0.6" opacity="0.9"/>');
  });
  s.push('<line x1="' + xs(0).toFixed(1) + '" y1="' + m.t + '" x2="' + xs(0).toFixed(1) +
    '" y2="' + (h - m.b) + '" stroke="#2C7A3F" stroke-width="1.3" stroke-dasharray="5 4"/>');
  [[-10, 0, fitL], [0, 10, fitR]].forEach(function (seg) {
    s.push('<line x1="' + xs(seg[0]).toFixed(1) + '" y1="' + ys(seg[2].a + seg[2].b * seg[0]).toFixed(1) +
      '" x2="' + xs(seg[1]).toFixed(1) + '" y2="' + ys(seg[2].a + seg[2].b * seg[1]).toFixed(1) +
      '" stroke="' + col + '" stroke-width="2.2"/>');
  });
  s.push('<text x="' + (m.l + iw / 2) + '" y="' + (h - 8) +
    '" font-size="11.5" fill="#5B6B72" text-anchor="middle">断点变量（居中后）</text>');
  s.push('</svg>');
  document.getElementById('rddChart').innerHTML = s.join('');

  document.getElementById('rddRead').innerHTML =
    '<tr><td>断点处跳升幅度</td><td><b>' + jump.toFixed(2) + '</b></td></tr>' +
    '<tr><td>断点左侧密度占比（−1.4,0）</td><td><b>' + (share * 100).toFixed(0) + '%</b></td></tr>' +
    '<tr><td>判定</td><td><b style="color:' + col + '">' +
    (bunched ? '不可信 · 密度堆积' : '可信 · 密度均匀') + '</b></td></tr>';
  document.getElementById('rddHint').innerHTML = bunched ?
    '断点左侧样本明显堆积（McCrary 密度检验会被拒绝），个体可能自我选择跨过断点，' +
    '"断点附近如同随机分配"的假设失效。' :
    '断点两侧局部线性拟合平滑衔接，密度也大致均匀——这是"随机分配"假设成立的信号。';
}

var scmT = [], scmTreat = [], scmGood = [], scmBad = [];
(function () {
  var r = seeded(999);
  for (var t = -8; t <= 8; t++) {
    scmT.push(t);
    var base = 2.0 + 0.05 * t, treatEff = t >= 0 ? 0.02 * (t + 1) + 0.35 : 0;
    scmTreat.push(base + treatEff + r.randn() * 0.06);
    scmGood.push(base + r.randn() * 0.05);
    scmBad.push((2.0 - 0.05 * t) + r.randn() * 0.05);
  }
})();

function drawSCM() {
  var slider = document.getElementById('scmFit');
  var alpha = slider.value / 100;
  var synth = scmT.map(function (t, i) { return alpha * scmGood[i] + (1 - alpha) * scmBad[i]; });
  var preErr = 0, cnt = 0;
  scmT.forEach(function (t, i) { if (t < 0) { preErr += Math.pow(scmTreat[i] - synth[i], 2); cnt++; } });
  preErr = Math.sqrt(preErr / cnt);
  var good = preErr < 0.15;
  document.getElementById('scmLabel').textContent = good ? '优良' : (preErr < 0.3 ? '一般' : '不佳');

  var w = 560, h = 320, m = { t: 18, r: 16, b: 44, l: 54 };
  var iw = w - m.l - m.r, ih = h - m.t - m.b;
  var xlo = -8.5, xhi = 8.5;
  var allv = scmTreat.concat(synth);
  var ylo = Math.min.apply(null, allv) - 0.2, yhi = Math.max.apply(null, allv) + 0.2;
  var xs = function (v) { return m.l + (v - xlo) / (xhi - xlo) * iw; };
  var ys = function (v) { return m.t + (yhi - v) / (yhi - ylo) * ih; };
  var col = good ? '#17766B' : '#A8321E';

  function path(vals) {
    return scmT.map(function (t, i) {
      return (i === 0 ? 'M' : 'L') + xs(t).toFixed(1) + ',' + ys(vals[i]).toFixed(1);
    }).join(' ');
  }

  var s = ['<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" role="img" aria-label="合成控制法拟合图">'];
  s.push('<line x1="' + xs(-0.5).toFixed(1) + '" y1="' + m.t + '" x2="' + xs(-0.5).toFixed(1) +
    '" y2="' + (h - m.b) + '" stroke="#2C7A3F" stroke-width="1.3" stroke-dasharray="5 4"/>');
  s.push('<path d="' + path(scmTreat) + '" fill="none" stroke="#0D3B4F" stroke-width="2.2"/>');
  s.push('<path d="' + path(synth) + '" fill="none" stroke="' + col +
    '" stroke-width="2.2" stroke-dasharray="6 4"/>');
  scmT.forEach(function (t, i) {
    s.push('<circle cx="' + xs(t).toFixed(1) + '" cy="' + ys(scmTreat[i]).toFixed(1) +
      '" r="3" fill="#0D3B4F"/>');
    s.push('<circle cx="' + xs(t).toFixed(1) + '" cy="' + ys(synth[i]).toFixed(1) +
      '" r="3" fill="' + col + '"/>');
  });
  s.push('<text x="' + (m.l + iw / 2) + '" y="' + (h - 8) +
    '" font-size="11.5" fill="#5B6B72" text-anchor="middle">相对政策时点</text>');
  s.push('<text x="' + (m.l + 4) + '" y="' + (m.t + 14) +
    '" font-size="11.5" fill="#0D3B4F">━ 处理组（真实）</text>');
  s.push('<text x="' + (m.l + 4) + '" y="' + (m.t + 30) +
    '" font-size="11.5" fill="' + col + '">┅ 合成对照组</text>');
  s.push('</svg>');
  document.getElementById('scmChart').innerHTML = s.join('');

  document.getElementById('scmRead').innerHTML =
    '<tr><td>处理前拟合 RMSE</td><td><b>' + preErr.toFixed(3) + '</b></td></tr>' +
    '<tr><td>判定</td><td><b style="color:' + col + '">' +
    (good ? '可信 · 拟合优良' : '不可信 · 拟合不佳') + '</b></td></tr>';
  document.getElementById('scmHint').innerHTML = good ?
    '处理前两条曲线几乎重合，处理后才出现差距——这个差距才能被归因于政策本身。' :
    '处理前两条曲线已经偏离，donor pool 权重本身就不可信，处理后的"差距"无法排除趋势混淆的解释。';
}

/* ---------------- 知识图谱交互 ---------------- */
var KG_MODULES = [
  ['模块一 研究范式与假设', 4, '#2E7BD6', [
    ['第1章 导论', 0, [['因果推断范式', 0], ['相关不等于因果', 0], ['AI能力与边界', 1]]],
    ['第2章 识别策略', 0, [['研究问题提炼', 1], ['潜在结果框架', 0], ['识别策略选择', 0]]]
  ]],
  ['模块二 数据工程与诊断', 6, '#12A47A', [
    ['第3章 数据工程', 0, [['多源数据匹配', 0], ['AI辅助清洗', 1], ['变量口径核验', 1]]],
    ['第4章 OLS与内生性', 0, [['OLS性质回顾', 0], ['内生性来源', 0], ['遗漏变量偏误', 0]]],
    ['第5章 面板与固定效应', 0, [['双向固定效应', 0], ['聚类稳健标准误', 0], ['面板数据结构', 0]]]
  ]],
  ['模块三 因果推断：DID', 6, '#C97A00', [
    ['第6章 DID原理', 0, [['两期DID识别', 0], ['平行趋势假设', 0], ['SUTVA与溢出', 0]]],
    ['第7章 平行趋势检验', 1, [['事件研究法', 0], ['预期效应识别', 1], ['差异趋势证伪', 1]]],
    ['第8章 交错DID', 0, [['负权重问题', 0], ['异质性处理效应', 0], ['新估计量比较', 0]]]
  ]],
  ['模块四 识别策略与方法拓展', 10, '#7C5BC7', [
    ['第9章 工具变量法', 0, [['排他性约束', 0], ['弱工具变量', 0], ['LATE解释', 0]]],
    ['第10章 断点回归', 0, [['断点识别假设', 0], ['带宽选择', 0], ['操纵检验', 0]]],
    ['第11章 合成控制法', 0, [['权重构造', 0], ['安慰剂检验', 0], ['DID与SCM取舍', 0]]],
    ['第12章 机器学习', 0, [['正则化与选择', 0], ['双重机器学习', 0], ['AI预测vs因果', 1]]],
    ['第13章 空间计量', 0, [['空间权重矩阵', 0], ['空间溢出分解', 0], ['时空双重差分', 0]]]
  ]],
  ['模块五 复现与学术表达', 6, '#C7457F', [
    ['第14章 结果表达', 0, [['学术表格规范', 0], ['系数图可视化', 1], ['结果解读边界', 0]]],
    ['第15章 可复现研究', 0, [['代码归档规范', 0], ['AI使用披露', 1], ['学术诚信底线', 0]]],
    ['第16章 综合汇报', 0, [['研究设计自证', 0], ['同行互评研判', 1], ['答辩与质疑回应', 0]]]
  ]]
];

var kgMods = [], kgChaps = [], kgPts = [];
(function () {
  KG_MODULES.forEach(function (m, mi) {
    kgMods.push({ name: m[0], hrs: m[1], col: m[2] });
    m[3].forEach(function (c) {
      var ci = kgChaps.length;
      kgChaps.push({ name: c[0], star: !!c[1], modIdx: mi, pts: [] });
      c[2].forEach(function (p) {
        var pi = kgPts.length;
        kgPts.push({ name: p[0], ai: !!p[1], chapIdx: ci, modIdx: mi });
        kgChaps[ci].pts.push(pi);
      });
    });
  });
})();

function kgLayout() {
  var GAP = 6, cur = 0;
  var counts = kgMods.map(function (m, mi) {
    return kgPts.filter(function (p) { return p.modIdx === mi; }).length;
  });
  var total = counts.reduce(function (a, b) { return a + b; }, 0);
  var span = 360 - GAP * kgMods.length;
  kgMods.forEach(function (m, mi) {
    var arc = span * counts[mi] / total;
    m.deg = cur + arc / 2;
    var sub = cur;
    kgChaps.forEach(function (c, ci) {
      if (c.modIdx !== mi) return;
      var cCnt = c.pts.length;
      var cArc = arc * cCnt / counts[mi];
      c.deg = sub + cArc / 2;
      var step = cArc / cCnt;
      c.pts.forEach(function (pi, j) { kgPts[pi].deg = sub + step * (j + 0.5); });
      sub += cArc;
    });
    cur += arc + GAP;
  });
}
kgLayout();

var kgState = null;
function kgPolar(r, deg) {
  var a = deg * Math.PI / 180;
  return [320 + r * Math.sin(a), 320 - r * Math.cos(a)];
}
var KG_R_MOD = 92, KG_R_CH = 172, KG_R_PT = 242, KG_R_LAB = 256, KG_SZ = 640;

function kgDim(mi, ci, pi) {
  if (!kgState) return false;
  if (kgState.type === 'mod') return kgState.idx !== mi;
  if (kgState.type === 'chap') return kgChaps[kgState.idx].modIdx !== mi ||
    (ci !== undefined && kgState.idx !== ci);
  if (kgState.type === 'pt') { var pp = kgPts[kgState.idx];
    return pp.modIdx !== mi || (ci !== undefined && pp.chapIdx !== ci); }
  return false;
}

function drawKG() {
  var aiOnly = document.getElementById('kgAiOnly').checked;
  var s = ['<svg viewBox="0 0 ' + KG_SZ + ' ' + KG_SZ + '" width="100%" ' +
    'role="img" aria-label="课程知识图谱，可点击节点查看详情">'];

  [KG_R_MOD, KG_R_CH, KG_R_PT].forEach(function (r) {
    s.push('<circle cx="320" cy="320" r="' + r + '" fill="none" stroke="#D3DDEC" ' +
      'stroke-width="1" stroke-dasharray="2 4"/>');
  });

  kgMods.forEach(function (m, mi) {
    var p1 = kgPolar(KG_R_MOD, m.deg);
    var dim = kgDim(mi);
    s.push('<line x1="320" y1="320" x2="' + p1[0].toFixed(1) + '" y2="' + p1[1].toFixed(1) +
      '" stroke="' + m.col + '" stroke-width="1.4" opacity="' + (dim ? 0.12 : 0.55) + '"/>');
  });
  kgChaps.forEach(function (c, ci) {
    var m = kgMods[c.modIdx];
    var p0 = kgPolar(KG_R_MOD, m.deg), p1 = kgPolar(KG_R_CH, c.deg);
    var dim = kgDim(c.modIdx, ci);
    s.push('<line x1="' + p0[0].toFixed(1) + '" y1="' + p0[1].toFixed(1) + '" x2="' +
      p1[0].toFixed(1) + '" y2="' + p1[1].toFixed(1) + '" stroke="' + m.col +
      '" stroke-width="1.1" opacity="' + (dim ? 0.08 : 0.4) + '"/>');
  });
  kgPts.forEach(function (p, pi) {
    var c = kgChaps[p.chapIdx], m = kgMods[p.modIdx];
    var p0 = kgPolar(KG_R_CH, c.deg), p1 = kgPolar(KG_R_PT, p.deg);
    var dim = kgDim(p.modIdx, p.chapIdx, pi) || (aiOnly && !p.ai);
    var col = p.ai ? '#B46A00' : m.col;
    s.push('<line x1="' + p0[0].toFixed(1) + '" y1="' + p0[1].toFixed(1) + '" x2="' +
      p1[0].toFixed(1) + '" y2="' + p1[1].toFixed(1) + '" stroke="' + col +
      '" stroke-width="' + (p.ai ? 1.2 : 0.9) + '" opacity="' + (dim ? 0.06 : (p.ai ? 0.7 : 0.32)) + '"/>');
  });

  kgPts.forEach(function (p, pi) {
    var m = kgMods[p.modIdx];
    var xy = kgPolar(KG_R_PT, p.deg);
    var dim = kgDim(p.modIdx, p.chapIdx, pi) || (aiOnly && !p.ai);
    var col = p.ai ? '#B46A00' : m.col;
    var sel = kgState && kgState.type === 'pt' && kgState.idx === pi;
    s.push('<circle data-kg="pt:' + pi + '" cx="' + xy[0].toFixed(1) + '" cy="' + xy[1].toFixed(1) +
      '" r="' + (sel ? 6.5 : 4.6) + '" fill="' + col + '" stroke="#fff" stroke-width="1.3" ' +
      'opacity="' + (dim ? 0.18 : 1) + '" style="cursor:pointer"/>');
    if (p.ai) s.push('<circle cx="' + xy[0].toFixed(1) + '" cy="' + xy[1].toFixed(1) +
      '" r="8.4" fill="none" stroke="#B46A00" stroke-width="1.1" opacity="' + (dim ? 0.1 : 0.85) + '"/>');
    var deg = ((p.deg % 360) + 360) % 360, flip = deg > 90 && deg < 270;
    var lab = kgPolar(KG_R_LAB, p.deg);
    s.push('<text data-kg="pt:' + pi + '" x="' + lab[0].toFixed(1) + '" y="' + lab[1].toFixed(1) +
      '" font-size="9.5" fill="' + (p.ai ? '#B46A00' : '#5E6A82') + '" opacity="' + (dim ? 0.25 : 1) +
      '" text-anchor="' + (flip ? 'end' : 'start') +
      '" transform="rotate(' + (flip ? deg + 180 : deg).toFixed(1) + ' ' + lab[0].toFixed(1) + ' ' + lab[1].toFixed(1) +
      ')" style="cursor:pointer">' + p.name + (p.ai ? ' ◆' : '') + '</text>');
  });

  kgChaps.forEach(function (c, ci) {
    var m = kgMods[c.modIdx], xy = kgPolar(KG_R_CH, c.deg);
    var dim = kgDim(c.modIdx, ci);
    var sel = kgState && kgState.type === 'chap' && kgState.idx === ci;
    s.push('<circle data-kg="chap:' + ci + '" cx="' + xy[0].toFixed(1) + '" cy="' + xy[1].toFixed(1) +
      '" r="' + (sel ? 15 : 12) + '" fill="#fff" stroke="' + m.col + '" stroke-width="2.2" ' +
      'opacity="' + (dim ? 0.2 : 1) + '" style="cursor:pointer"/>');
    if (c.star) s.push('<circle cx="' + xy[0].toFixed(1) + '" cy="' + xy[1].toFixed(1) +
      '" r="19" fill="none" stroke="#B46A00" stroke-width="1.6" opacity="' + (dim ? 0.15 : 0.95) + '"/>');
    s.push('<text x="' + xy[0].toFixed(1) + '" y="' + (xy[1] + 24).toFixed(1) +
      '" font-size="10" fill="#25304A" text-anchor="middle" font-weight="bold" ' +
      'opacity="' + (dim ? 0.25 : 1) + '">' + c.name.replace('第', '第').split(' ')[0] + '</text>');
  });

  kgMods.forEach(function (m, mi) {
    var xy = kgPolar(KG_R_MOD, m.deg);
    var dim = kgDim(mi);
    var sel = kgState && kgState.type === 'mod' && kgState.idx === mi;
    s.push('<circle data-kg="mod:' + mi + '" cx="' + xy[0].toFixed(1) + '" cy="' + xy[1].toFixed(1) +
      '" r="' + (sel ? 21 : 18) + '" fill="' + m.col + '" opacity="' + (dim ? 0.25 : 0.92) +
      '" style="cursor:pointer"/>');
    var deg = ((m.deg % 360) + 360) % 360, up = deg < 90 || deg > 270;
    s.push('<text x="' + xy[0].toFixed(1) + '" y="' + (xy[1] + (up ? -26 : 32)).toFixed(1) +
      '" font-size="11.5" fill="' + m.col + '" text-anchor="middle" font-weight="bold" ' +
      'opacity="' + (dim ? 0.35 : 1) + '">' + m.name.split(' ')[0] + '</text>');
  });

  s.push('<circle cx="320" cy="320" r="46" fill="#1E2761"/>');
  s.push('<text x="320" y="316" font-size="12.5" fill="#fff" text-anchor="middle" font-weight="bold">高级计量</text>');
  s.push('<text x="320" y="332" font-size="12.5" fill="#B46A00" text-anchor="middle" font-weight="bold">经济学与AI</text>');
  s.push('</svg>');
  document.getElementById('kgChart').innerHTML = s.join('');

  document.querySelectorAll('#kgChart [data-kg]').forEach(function (el) {
    el.addEventListener('click', function () {
      var parts = el.getAttribute('data-kg').split(':');
      var type = parts[0], idx = parseInt(parts[1], 10);
      kgState = (kgState && kgState.type === type && kgState.idx === idx) ?
        null : { type: type, idx: idx };
      drawKG();
      kgUpdateInfo();
    });
  });
}

function kgUpdateInfo() {
  var box = document.getElementById('kgInfo');
  if (!kgState) {
    box.innerHTML = '<p style="margin:0">5 大模块 · 16 章 · 48 个知识点 · ' +
      '10 个人工智能应用节点 · 共 32 学时。点击图中的节点查看其详细内容。</p>';
    return;
  }
  if (kgState.type === 'mod') {
    var m = kgMods[kgState.idx];
    var chs = kgChaps.filter(function (c) { return c.modIdx === kgState.idx; });
    box.innerHTML = '<h4 style="color:' + m.col + '">' + m.name + '</h4>' +
      '<p><b>学时：</b>' + m.hrs + '</p>' +
      '<p style="margin:0"><b>包含章节：</b>' + chs.map(function (c) { return c.name; }).join('　') + '</p>';
  } else if (kgState.type === 'chap') {
    var c = kgChaps[kgState.idx], mm = kgMods[c.modIdx];
    var pts = c.pts.map(function (pi) { return kgPts[pi]; });
    box.innerHTML = '<h4 style="color:' + mm.col + '">' + c.name +
      (c.star ? ' <span class="tag">课例</span>' : '') + '</h4>' +
      '<p><b>所属模块：</b>' + mm.name + '</p>' +
      '<p style="margin:0"><b>知识点：</b>' + pts.map(function (p) {
        return p.ai ? '<span style="color:#B46A00">' + p.name + ' ◆</span>' : p.name;
      }).join('　') + '</p>';
  } else {
    var p = kgPts[kgState.idx], c2 = kgChaps[p.chapIdx], m2 = kgMods[p.modIdx];
    box.innerHTML = '<h4 style="color:' + (p.ai ? '#B46A00' : m2.col) + '">' + p.name +
      (p.ai ? ' ◆' : '') + '</h4>' +
      '<p><b>所属章节：</b>' + c2.name + '</p>' +
      '<p style="margin:0"><b>所属模块：</b>' + m2.name +
      (p.ai ? '<br><span style="color:#B46A00">该知识点设有人工智能应用节点</span>' : '') + '</p>';
  }
}

/* ---------------- 课中反问陪练（增强版：多样化回复 + 上下文记忆） ---------------- */
var AGENT_RULES = [
  { kw: ['过了', '可信', '通过', '成立', '满足', '符合'],
    preset: '这张图的平行趋势过了吗？',
    replies: [
      '你看的是哪几个点——事前的每一个系数，还是把它们连起来看？置信区间你注意到了吗？',
      '先说说你的判断依据是什么？是看单个系数的显著性，还是看整体趋势的斜率？',
      '能具体讲讲"过了"是指什么？事前系数不显著就算过，还是要满足别的条件？'
    ]},
  { kw: ['不显著', '没显著', '不拒绝', '不能拒绝'],
    preset: '事前系数都不显著，应该就没问题吧？',
    replies: [
      '这个样本量下，多大的差异才能被检出来？把三个事前系数连成一条线，你看到的是平的还是有斜率？',
      '"不显著"等于"差异为零"吗？如果样本量很小，一个 0.05 的系数可能也检测不出来，但趋势还在那里。',
      '你看到事前系数不显著，那事前斜率是多少？如果斜率和事后一样大，你还觉得没问题吗？'
    ]},
  { kw: ['平的', '看起来', '图上', '看着', '视觉'],
    preset: '图上看着挺平的啊。',
    replies: [
      '纵轴范围设的是多少？如果把 y 轴从 −4 到 9 拉开来看，"平"还会是平的吗？',
      '我们看的是同一张图吗？能不能量化一下"平"——比如算算事前的拟合斜率？',
      '"看起来平"是因为纵轴压缩了，还是因为真的没有趋势？你能用数值判断一下吗？'
    ]},
  { kw: ['基准期', '基准', '为什么选', 't=-1', 't=-4'],
    preset: '基准期为什么选 t=−1？',
    replies: [
      '换成另一期你预期图形会怎么变？如果换了基准期结论就反过来了，你会信哪一张？',
      '基准期的选择会改变系数的数值，但不会改变事前趋势的斜率。你验证过斜率在不同基准期下是否一致吗？',
      '如果基准期移到 t=−4，事后效应变小了，这说明什么——是政策效应变弱了，还是有部分效应被新基准期"吸收"了？'
    ]},
  { kw: ['ai说', 'ai 说', '模型说', '它说', 'gpt', 'deepseek', '文心', '通义', 'kimi', 'chatgpt'],
    preset: 'AI说这个设计没问题。',
    replies: [
      '这是它的判断，还是你自己核验过的判断？你能说出一条它没提到的理由吗？',
      'AI 给的是建议还是确定的结论？如果它判断错了，你能从图里找到反驳它的证据吗？',
      '你用 AI 的时候有没有披露你给了它什么信息？如果它看到的数据和你看到的不一样，结论可能完全相反。'
    ]},
  { kw: ['答案', '正确答案', '直接告诉我', '告诉我结论', '到底对不对'],
    preset: '你就直接告诉我答案吧。',
    replies: [
      '这门课前测只统计完成度，不统计答对率，写错不扣分；但我现在告诉你答案，明天课上的判断训练就没有靶子了。我们换个问法——你觉得哪个点最值得怀疑？',
      '如果我直接给答案，你记住的只是这一道题的对错；但如果你自己推理出来，下次遇到新情况你才有办法判断。你更想要哪一种？',
      '研究设计没有标准答案，只有"更可信"或"不太可信"的判断。你现在能列出三条让你怀疑的地方吗？'
    ]},
  { kw: ['差异趋势', '预期效应', '哪一种', '区分', '有什么不同'],
    preset: '差异趋势和预期效应要怎么区分？',
    replies: [
      '如果把基准期往前移一期，两种情况下事后效应各自会怎么变？变化的方向一样吗？',
      '差异趋势是"一直在分离"，预期效应是"政策前就已经开始反应"。你能从事前斜率和基准期敏感性看出区别吗？',
      '如果事前斜率和事后一样，这是哪一种？如果事前斜率为零、但基准期一换事后效应就塌了，又是哪一种？'
    ]},
  { kw: ['系数', '数值', '大小', '效应值'],
    preset: '这个系数看起来挺大的，应该就是有效应吧？',
    replies: [
      '系数大不代表因果效应大——可能是事前就有差异趋势。你看过事前的拟合斜率了吗？',
      '事后系数是 0.30，但如果事前每期也在涨 0.07，那政策带来的净效应其实只有多少？',
      '数值大小要放在标准误的背景下看。如果置信区间是 [−0.1, 0.7]，你还确定效应真的存在吗？'
    ]},
  { kw: ['稳健性', '换一种', '敏感', '稳定'],
    preset: '我换了一种方法，结果还是显著的，应该就稳健了吧？',
    replies: [
      '换方法后事后效应的数值变了多少？如果从 0.30 掉到 0.08，即使还显著，你觉得稳健吗？',
      '稳健性不只是看显著性，更要看系数本身稳不稳定。事前斜率在不同设定下变了吗？',
      '你换的是什么——控制变量、样本范围，还是基准期？不同维度的稳健性检验含义不一样。'
    ]},
  { kw: ['样本', '数据', '观测值', '样本量'],
    preset: '样本量这么大，不显著应该就是真的没差异吧？',
    replies: [
      '样本大确实让检验更有power，但"不显著"不等于"没有差异"——可能是差异太小、也可能是设计有问题掩盖了差异。',
      '样本量大的时候，即使很小的斜率也可能被检测出来显著。你算过事前斜率的经济显著性了吗？',
      '大样本下如果事前斜率 0.07 却不显著，反而更可疑——要么是标准误算错了，要么是趋势被某种方式抵消了。'
    ]}
];

var AGENT_FALLBACK = [
  '能具体说说，你是从图上的哪个特征得出这个判断的？',
  '如果这条依据不成立，你的结论会变吗？',
  '你能想到一个会推翻这个判断的反例吗？',
  '换一个角度看：如果你是审稿人，你会质疑这张图的哪一点？',
  '这个判断背后的计量逻辑是什么？能用一句话说清楚吗？'
];

var agentContext = [];  // 记录最近3轮对话，用于避免重复

function agentBubble(text, who) {
  var box = document.getElementById('agentChat');
  var d = document.createElement('div');
  d.style.maxWidth = '86%';
  d.style.padding = '9px 13px';
  d.style.borderRadius = '10px';
  d.style.fontSize = '14.5px';
  d.style.lineHeight = '1.55';
  if (who === 'me') {
    d.style.alignSelf = 'flex-end';
    d.style.background = '#1E2761';
    d.style.color = '#fff';
  } else {
    d.style.alignSelf = 'flex-start';
    d.style.background = '#EEF4FD';
    d.style.color = '#141A3A';
    d.style.borderLeft = '3px solid #B46A00';
  }
  d.textContent = text;
  box.appendChild(d);
  box.scrollTop = box.scrollHeight;
}

var agentFallbackIdx = 0;
function agentReply(msg) {
  var low = msg.toLowerCase();
  for (var i = 0; i < AGENT_RULES.length; i++) {
    var r = AGENT_RULES[i];
    for (var j = 0; j < r.kw.length; j++) {
      if (low.indexOf(r.kw[j]) !== -1) {
        // 从该规则的多个回复中选一个，避免重复最近用过的
        var pool = r.replies.filter(function(rep) {
          return agentContext.indexOf(rep) === -1;
        });
        if (pool.length === 0) pool = r.replies;  // 都用过了就重置
        var selected = pool[Math.floor(Math.random() * pool.length)];
        agentContext.push(selected);
        if (agentContext.length > 3) agentContext.shift();
        return selected;
      }
    }
  }
  var a = AGENT_FALLBACK[agentFallbackIdx % AGENT_FALLBACK.length];
  agentFallbackIdx++;
  agentContext.push(a);
  if (agentContext.length > 3) agentContext.shift();
  return a;
}

function agentSendMsg(text) {
  text = text.trim();
  if (!text) return;
  agentBubble(text, 'me');
  document.getElementById('agentInput').value = '';
  setTimeout(function () { agentBubble(agentReply(text), 'ai'); }, 380);
}

function agentInit() {
  document.getElementById('agentChat').innerHTML = '';
  agentContext = [];  // 重置上下文
  agentBubble('说说看，你觉得这张图能不能证明政策有效？', 'ai');
  var box = document.getElementById('agentPresets');
  box.innerHTML = '';
  AGENT_RULES.forEach(function (r) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = r.preset;
    b.style.textAlign = 'left';
    b.style.padding = '8px 12px';
    b.style.border = '1px solid var(--line)';
    b.style.borderRadius = '6px';
    b.style.background = '#fff';
    b.style.cursor = 'pointer';
    b.style.fontSize = '13.5px';
    b.style.color = '#141A3A';
    b.addEventListener('click', function () { agentSendMsg(r.preset); });
    box.appendChild(b);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('esChart')) {
    document.querySelectorAll('[name=esCase],[name=esBase]').forEach(
      function (el) { el.addEventListener('change', render); });
    render();
  }
  if (document.getElementById('ivChart')) {
    document.getElementById('ivStrength').addEventListener('input', drawIV);
    drawIV();
  }
  if (document.getElementById('rddChart')) {
    document.querySelectorAll('[name=rddCase]').forEach(
      function (el) { el.addEventListener('change', drawRDD); });
    drawRDD();
  }
  if (document.getElementById('scmChart')) {
    document.getElementById('scmFit').addEventListener('input', drawSCM);
    drawSCM();
  }
  if (document.getElementById('kgChart')) {
    document.getElementById('kgAiOnly').addEventListener('change', drawKG);
    document.getElementById('kgReset').addEventListener('click', function () {
      kgState = null;
      document.getElementById('kgAiOnly').checked = false;
      drawKG();
      kgUpdateInfo();
    });
    drawKG();
    kgUpdateInfo();
  }
  if (document.getElementById('agentChat')) {
    document.getElementById('agentSend').addEventListener('click', function () {
      agentSendMsg(document.getElementById('agentInput').value);
    });
    document.getElementById('agentInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') agentSendMsg(this.value);
    });
    document.getElementById('agentReset').addEventListener('click', agentInit);
    agentInit();
  }
  buildQuiz();

  /* ---------------- 教师端数据可视化 ---------------- */
  if (document.getElementById('comparisonChart')) {
    initTeacherDashboard();
  }
});

/* ============ 教师端数据回路可视化 ============ */

var METRICS_DATA = {
  accuracy: {
    name: '判断正确率',
    before: 29,
    after: 84,
    unit: '%',
    desc: '课堂研判表平均正确率从 29% 提升至 84%。AI 赋能后，学生在课前已通过智能体诊断暴露误区，课中研判时能够调用前测时被追问过的判断链，显著提升准确性。'
  },
  interaction: {
    name: '师生互动频次',
    before: 12,
    after: 63,
    unit: '次/节',
    desc: '单节课师生互动频次从 12 次/节提升至 63 次/节。智能体承接了个体化追问，释放教师精力用于组织集体研判和质疑回应，实现"一对多"与"一对一"的结合。'
  },
  revision: {
    name: '作业迭代轮次',
    before: 1.2,
    after: 2.6,
    unit: '轮',
    desc: '学生平均提交轮次从 1.2 轮提升至 2.6 轮。智能体在每轮提交后标注判断链缺口但不给答案，学生需自行补齐后重提交，培养迭代完善的习惯。'
  },
  disclosure: {
    name: 'AI披露完整度',
    before: 52,
    after: 89,
    unit: '%',
    desc: '披露表完整度（七项全部填写）从 52% 提升至 89%。智能体逐项核查披露表，缺项直接标注"待补齐"并说明缺什么，倒逼学生养成全程记录的习惯。'
  }
};

var currentMetric = 'accuracy';

function drawComparison(metric) {
  var data = METRICS_DATA[metric];
  var w = 680, h = 280, m = {t: 40, r: 20, b: 50, l: 70};
  var iw = w - m.l - m.r, ih = h - m.t - m.b;

  var max = Math.max(data.before, data.after);
  var scale = metric === 'revision' ? 3.5 : (metric === 'interaction' ? 70 : 100);

  var barH = 50, gap = 80;
  var y1 = m.t + 30, y2 = y1 + barH + gap;

  var beforeW = (data.before / scale) * iw;
  var afterW = (data.after / scale) * iw;

  var s = ['<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%">'];

  // 标题
  s.push('<text x="' + (w/2) + '" y="24" font-size="15" font-weight="bold" fill="#1E2761" text-anchor="middle">' +
    data.name + '对比（AI 赋能前 vs 后）</text>');

  // AI 赋能前
  s.push('<text x="' + (m.l - 10) + '" y="' + (y1 + barH/2 + 5) + '" font-size="13" fill="#5E6A82" text-anchor="end">赋能前</text>');
  s.push('<rect x="' + m.l + '" y="' + y1 + '" width="' + beforeW.toFixed(1) + '" height="' + barH + '" fill="#A8B8CC" rx="4"/>');
  s.push('<text x="' + (m.l + beforeW + 10) + '" y="' + (y1 + barH/2 + 6) + '" font-size="16" font-weight="bold" fill="#5E6A82">' +
    data.before + ' ' + data.unit + '</text>');

  // AI 赋能后
  s.push('<text x="' + (m.l - 10) + '" y="' + (y2 + barH/2 + 5) + '" font-size="13" fill="#5E6A82" text-anchor="end">赋能后</text>');
  s.push('<rect x="' + m.l + '" y="' + y2 + '" width="' + afterW.toFixed(1) + '" height="' + barH + '" fill="#17766B" rx="4"/>');
  s.push('<text x="' + (m.l + afterW + 10) + '" y="' + (y2 + barH/2 + 6) + '" font-size="16" font-weight="bold" fill="#17766B">' +
    data.after + ' ' + data.unit + '</text>');

  // 提升幅度
  var increase = ((data.after - data.before) / data.before * 100).toFixed(0);
  s.push('<text x="' + (w/2) + '" y="' + (h - 10) + '" font-size="13" fill="#B46A00" text-anchor="middle" font-weight="bold">↑ 提升 ' +
    increase + '%</text>');

  s.push('</svg>');
  document.getElementById('comparisonChart').innerHTML = s.join('');
  document.getElementById('comparisonText').innerHTML = '<b>' + data.name + '：</b>' + data.desc;
}

function drawHeatmap() {
  var data = [
    {id: 'M01', name: '误认为"不显著=成立"', val: 71},
    {id: 'M02', name: '忽略事前拟合斜率', val: 65},
    {id: 'M03', name: '基准期敏感性未检验', val: 58},
    {id: 'M04', name: '"图上看起来平"', val: 52},
    {id: 'M05', name: '置信区间判读错误', val: 38},
    {id: 'M06', name: '混淆差异趋势与预期效应', val: 35},
    {id: 'M07', name: 'AI输出未核验直接使用', val: 29},
    {id: 'M08', name: '稳健性检验缺失', val: 24},
    {id: 'M09', name: '经济显著性vs统计显著性', val: 19},
    {id: 'M10', name: '数据生成过程未考虑', val: 14}
  ];

  var w = 760, h = 400, cellW = 150, cellH = 38, m = {t: 30, r: 10, b: 10, l: 10};
  var cols = 5;

  var s = ['<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%">'];

  // 标题
  s.push('<text x="' + (w/2) + '" y="18" font-size="14" font-weight="bold" fill="#1E2761" text-anchor="middle">课前诊断误区分布热力图（n=63）</text>');

  data.forEach(function(d, i) {
    var x = m.l + (i % cols) * cellW;
    var y = m.t + Math.floor(i / cols) * cellH;
    var color = d.val >= 70 ? '#990011' : (d.val >= 60 ? '#C97A00' : (d.val >= 40 ? '#D4A017' : '#17766B'));
    var opacity = 0.35 + (d.val / 100) * 0.65;

    s.push('<rect x="' + x + '" y="' + y + '" width="' + (cellW-4) + '" height="' + (cellH-4) + '" fill="' + color + '" opacity="' + opacity + '" rx="4" stroke="' + color + '" stroke-width="1.5"/>');
    s.push('<text x="' + (x + 8) + '" y="' + (y + 16) + '" font-size="11" font-weight="bold" fill="#1E2761">' + d.id + '</text>');
    s.push('<text x="' + (x + cellW - 12) + '" y="' + (y + 16) + '" font-size="13" font-weight="bold" fill="' + color + '" text-anchor="end">' + d.val + '%</text>');
    s.push('<text x="' + (x + 8) + '" y="' + (y + 30) + '" font-size="10" fill="#25304A">' + d.name + '</text>');
  });

  // 图例
  var legendY = h - 50;
  var legendItems = [
    {label: '≥70% 严重', color: '#990011'},
    {label: '60-69% 较重', color: '#C97A00'},
    {label: '40-59% 中等', color: '#D4A017'},
    {label: '<40% 轻度', color: '#17766B'}
  ];

  legendItems.forEach(function(item, i) {
    var x = m.l + i * 140;
    s.push('<rect x="' + x + '" y="' + legendY + '" width="20" height="20" fill="' + item.color + '" opacity="0.6" rx="3"/>');
    s.push('<text x="' + (x + 26) + '" y="' + (legendY + 14) + '" font-size="11" fill="#5E6A82">' + item.label + '</text>');
  });

  s.push('</svg>');
  document.getElementById('heatmapChart').innerHTML = s.join('');
}

var QUESTION_DATA = [
  {
    time: '14:20-14:30',
    questions: [
      {q: '基准期为什么选 t=−1', count: 8},
      {q: '事前不显著算不算过', count: 6},
      {q: '差异趋势 vs 预期效应', count: 5},
      {q: '图上看着挺平的', count: 3},
      {q: '换个基准期会怎样', count: 2}
    ],
    stuck: ['第4组（3次"看不出来"）', '第11组（2次重复同一问题）']
  },
  {
    time: '14:30-14:40',
    questions: [
      {q: '换个基准期会怎样', count: 4},
      {q: '斜率怎么算', count: 3},
      {q: '置信区间要看吗', count: 3},
      {q: '这是哪种违背', count: 2},
      {q: 'AI说可信但我觉得不对', count: 1}
    ],
    stuck: ['第4组（已解锁）']
  },
  {
    time: '14:40-14:50',
    questions: [
      {q: '我们组判断不一致怎么办', count: 3},
      {q: '能再看一遍 C 组的图吗', count: 2},
      {q: '斜率和显著性哪个更重要', count: 2},
      {q: '这道题有标准答案吗', count: 1},
      {q: '下节课讲什么', count: 1}
    ],
    stuck: []
  }
];

var currentTimeSlot = 0;

function drawQuestionBoard() {
  var data = QUESTION_DATA[currentTimeSlot];
  var html = '<h4>提问频次排行（' + data.time + '）</h4>';
  html += '<table style="margin-top:12px"><tr><th style="width:60%">问题</th><th>提问次数</th></tr>';

  data.questions.forEach(function(q, i) {
    var highlight = i < 3 ? ' style="background:#FFF8E7"' : '';
    html += '<tr' + highlight + '><td>' + q.q + '</td><td><b>' + q.count + ' 次</b>' +
      (i < 3 ? ' <span class="tag" style="background:#B46A00;color:#fff">高频</span>' : '') + '</td></tr>';
  });

  html += '</table>';
  document.getElementById('questionBoard').innerHTML = html;

  var stuckHtml = '<div class="note"><b>卡住小组：</b>';
  if (data.stuck.length === 0) {
    stuckHtml += '无';
  } else {
    stuckHtml += data.stuck.join('、');
  }
  stuckHtml += '</div>';
  document.getElementById('stuckGroups').innerHTML = stuckHtml;
}

function drawRevisionChart() {
  var data = [
    {rounds: 1, count: 8, label: '1轮'},
    {rounds: 2, count: 24, label: '2轮'},
    {rounds: 3, count: 21, label: '3轮'},
    {rounds: 4, count: 7, label: '4轮'},
    {rounds: 5, count: 3, label: '≥5轮'}
  ];

  var w = 400, h = 260, m = {t: 20, r: 20, b: 50, l: 50};
  var iw = w - m.l - m.r, ih = h - m.t - m.b;
  var barW = iw / data.length - 8;
  var max = Math.max.apply(null, data.map(function(d) { return d.count; }));

  var s = ['<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%">'];

  data.forEach(function(d, i) {
    var x = m.l + i * (iw / data.length) + 4;
    var barH = (d.count / max) * ih;
    var y = h - m.b - barH;

    var color = d.rounds === 1 ? '#A8B8CC' : (d.rounds === 2 ? '#17766B' : '#2E7BD6');

    s.push('<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + barH.toFixed(1) + '" fill="' + color + '" rx="3"/>');
    s.push('<text x="' + (x + barW/2).toFixed(1) + '" y="' + (y - 6).toFixed(1) + '" font-size="12" font-weight="bold" fill="' + color + '" text-anchor="middle">' + d.count + '</text>');
    s.push('<text x="' + (x + barW/2).toFixed(1) + '" y="' + (h - m.b + 18) + '" font-size="11" fill="#5E6A82" text-anchor="middle">' + d.label + '</text>');
  });

  s.push('<text x="' + (m.l - 10) + '" y="' + (h - m.b + 18) + '" font-size="11" fill="#5E6A82" text-anchor="end">迭代轮次</text>');

  s.push('</svg>');
  document.getElementById('revisionChart').innerHTML = s.join('');
}

function drawJudgmentScoreChart() {
  var data = [
    {range: '<18分', count: 3},
    {range: '18-21分', count: 8},
    {range: '21-24分', count: 11},
    {range: '24-27分', count: 17},
    {range: '≥27分', count: 24}
  ];

  var w = 400, h = 260, m = {t: 20, r: 20, b: 50, l: 50};
  var iw = w - m.l - m.r, ih = h - m.t - m.b;
  var barW = iw / data.length - 8;
  var max = Math.max.apply(null, data.map(function(d) { return d.count; }));

  var s = ['<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%">'];

  data.forEach(function(d, i) {
    var x = m.l + i * (iw / data.length) + 4;
    var barH = (d.count / max) * ih;
    var y = h - m.b - barH;

    var color = i < 2 ? '#A8321E' : (i < 3 ? '#D4A017' : '#17766B');

    s.push('<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + barH.toFixed(1) + '" fill="' + color + '" rx="3"/>');
    s.push('<text x="' + (x + barW/2).toFixed(1) + '" y="' + (y - 6).toFixed(1) + '" font-size="12" font-weight="bold" fill="' + color + '" text-anchor="middle">' + d.count + '</text>');
    s.push('<text x="' + (x + barW/2).toFixed(1) + '" y="' + (h - m.b + 18) + '" font-size="10" fill="#5E6A82" text-anchor="middle">' + d.range + '</text>');
  });

  s.push('</svg>');
  document.getElementById('judgmentScoreChart').innerHTML = s.join('');
}

function drawSatisfactionChart() {
  var items = [
    {name: '教学内容实用性', score: 4.7},
    {name: 'AI工具融合度', score: 4.6},
    {name: '判断能力提升感', score: 4.5},
    {name: '智能体响应质量', score: 4.4},
    {name: '作业反馈及时性', score: 4.3}
  ];

  var w = 760, h = 200, m = {t: 10, r: 140, b: 10, l: 180};
  var iw = w - m.l - m.r, ih = h - m.t - m.b;
  var rowH = ih / items.length;

  var s = ['<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%">'];

  items.forEach(function(item, i) {
    var y = m.t + i * rowH;
    var barW = (item.score / 5) * iw;

    s.push('<text x="' + (m.l - 10) + '" y="' + (y + rowH/2 + 4) + '" font-size="13" fill="#25304A" text-anchor="end">' + item.name + '</text>');
    s.push('<rect x="' + m.l + '" y="' + (y + 4) + '" width="' + barW.toFixed(1) + '" height="' + (rowH - 8) + '" fill="#17766B" rx="3"/>');
    s.push('<text x="' + (m.l + barW + 10) + '" y="' + (y + rowH/2 + 4) + '" font-size="14" font-weight="bold" fill="#17766B">' + item.score.toFixed(1) + '</text>');

    // 5分刻度线
    for (var j = 0; j <= 5; j++) {
      var x = m.l + (j / 5) * iw;
      s.push('<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y + rowH) + '" stroke="#D3DDEC" stroke-width="1"/>');
    }
  });

  // 刻度标签
  for (var k = 0; k <= 5; k++) {
    var x = m.l + (k / 5) * iw;
    s.push('<text x="' + x + '" y="' + (h - m.b + 16) + '" font-size="11" fill="#5E6A82" text-anchor="middle">' + k + '</text>');
  }

  s.push('</svg>');
  document.getElementById('satisfactionChart').innerHTML = s.join('');
}

function initTeacherDashboard() {
  // 对比图表
  drawComparison(currentMetric);

  document.querySelectorAll('.metric-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.metric-btn').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      currentMetric = this.getAttribute('data-metric');
      drawComparison(currentMetric);
    });
  });

  // 热力图
  drawHeatmap();

  // 提问看板
  drawQuestionBoard();

  document.querySelectorAll('.time-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.time-btn').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      currentTimeSlot = parseInt(this.getAttribute('data-time'));
      drawQuestionBoard();
    });
  });

  // 迭代轮次
  if (document.getElementById('revisionChart')) {
    drawRevisionChart();
  }

  // 判断链得分
  if (document.getElementById('judgmentScoreChart')) {
    drawJudgmentScoreChart();
  }

  // 教师AI引导模块
  if (document.getElementById('teachingPhaseChart')) {
    drawTeachingPhase(currentPhase);

    document.querySelectorAll('.phase-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.phase-btn').forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        currentPhase = this.getAttribute('data-phase');
        drawTeachingPhase(currentPhase);
      });
    });
  }

  if (document.getElementById('guidanceEffectChart')) {
    drawGuidanceEffect();
  }

  // 满意度
  if (document.getElementById('satisfactionChart')) {
    drawSatisfactionChart();
  }
}

/* ============ 教师 AI 引导教学效果可视化 ============ */

var TEACHING_PHASES = {
  pre: {
    name: '课前诊断',
    steps: [
      {action: '智能体推送诊断题', time: '课前48小时', responsibility: 'AI'},
      {action: '学生作答，AI追问暴露误区', time: '课前24-48小时', responsibility: 'AI'},
      {action: '教师查看误区热力图', time: '课前12小时', responsibility: '教师'},
      {action: '调整课中案例与追问重心', time: '课前准备', responsibility: '教师'}
    ],
    effect: '本班 M01 误区占比 71%，教师将"差异趋势型"案例讲评时间从 12 分钟加倍至 24 分钟。',
    data: {teacher: 35, ai: 65, label: 'AI承担诊断，教师聚焦调整'}
  },
  during: {
    name: '课中研判',
    steps: [
      {action: '双盲研判：学生分组判断图例', time: '课中30分钟', responsibility: '学生'},
      {action: 'AI陪练：随机追问判断依据', time: '课中实时', responsibility: 'AI'},
      {action: '教师监控提问看板', time: '课中实时', responsibility: '教师'},
      {action: '教师针对高频问题集中讲评', time: '课中暂停干预', responsibility: '教师'}
    ],
    effect: '14:35 看板显示"基准期为什么选 t=−1"被问 8 次，教师暂停研判、集中讲解 5 分钟，之后该问题提问频次降至 1 次。',
    data: {teacher: 40, ai: 60, label: 'AI陪练释放教师精力'}
  },
  post: {
    name: '课后作业',
    steps: [
      {action: '学生提交判断链与代码', time: '课后7天内', responsibility: '学生'},
      {action: 'AI逐项核验判断链完整性', time: '提交后即时', responsibility: 'AI'},
      {action: 'AI标注缺口但不给答案', time: '提交后即时', responsibility: 'AI'},
      {action: '教师抽检典型案例并点评', time: '批阅时', responsibility: '教师'}
    ],
    effect: 'AI 标注"第3步未说明基准期选择依据"，学生自行补齐后重提交。平均迭代轮次从 1.2 提升至 2.6，教师只需抽检 15% 的作业深度点评。',
    data: {teacher: 25, ai: 75, label: 'AI承担重复核验'}
  },
  iterate: {
    name: '迭代反馈',
    steps: [
      {action: 'AI记录每次提交的缺口类型', time: '全学期', responsibility: 'AI'},
      {action: '教师查看高频缺口统计', time: '每2周', responsibility: '教师'},
      {action: '教师更新知识库追问模板', time: '学期中调整', responsibility: '教师'},
      {action: 'AI按新模板引导下批学生', time: '更新后', responsibility: 'AI'}
    ],
    effect: '前半学期高频缺口是"未检验基准期敏感性"（占 42%），教师在知识库中增补 Q11 模板，后半学期该缺口占比降至 18%。',
    data: {teacher: 30, ai: 70, label: '教师持续优化AI策略'}
  }
};

var currentPhase = 'pre';

function drawTeachingPhase(phase) {
  var data = TEACHING_PHASES[phase];
  var w = 760, h = 280, m = {t: 40, r: 20, b: 40, l: 20};

  var s = ['<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%">'];

  // 标题
  s.push('<text x="' + (w/2) + '" y="24" font-size="15" font-weight="bold" fill="#1E2761" text-anchor="middle">' +
    data.name + '：教师与AI协同流程</text>');

  // 流程步骤
  var stepH = 42, startY = m.t + 10;

  data.steps.forEach(function(step, i) {
    var y = startY + i * stepH;
    var color = step.responsibility === 'AI' ? '#17766B' : (step.responsibility === '教师' ? '#2E7BD6' : '#5E6A82');
    var bgColor = step.responsibility === 'AI' ? '#E6F7F5' : (step.responsibility === '教师' ? '#EDF4FC' : '#F5F8FD');

    // 序号
    s.push('<circle cx="40" cy="' + (y + 16) + '" r="14" fill="' + color + '"/>');
    s.push('<text x="40" y="' + (y + 21) + '" font-size="12" font-weight="bold" fill="#fff" text-anchor="middle">' + (i+1) + '</text>');

    // 步骤框
    s.push('<rect x="65" y="' + y + '" width="560" height="32" fill="' + bgColor + '" rx="4" stroke="' + color + '" stroke-width="1.5"/>');
    s.push('<text x="75" y="' + (y + 20) + '" font-size="13" fill="#25304A" font-weight="600">' + step.action + '</text>');

    // 时间和责任方
    s.push('<text x="640" y="' + (y + 14) + '" font-size="11" fill="#5E6A82" text-anchor="end">' + step.time + '</text>');
    s.push('<text x="640" y="' + (y + 27) + '" font-size="11" fill="' + color + '" font-weight="bold" text-anchor="end">' + step.responsibility + '</text>');
  });

  s.push('</svg>');
  document.getElementById('teachingPhaseChart').innerHTML = s.join('');
  document.getElementById('teachingPhaseText').innerHTML = '<b>实际效果：</b>' + data.effect;
}

function drawGuidanceEffect() {
  var phases = ['pre', 'during', 'post', 'iterate'];
  var labels = ['课前诊断', '课中研判', '课后作业', '迭代反馈'];

  var w = 760, h = 300, m = {t: 40, r: 140, b: 50, l: 140};
  var iw = w - m.l - m.r, ih = h - m.t - m.b;
  var barH = 36, gap = 16;

  var s = ['<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%">'];

  // 标题
  s.push('<text x="' + (w/2) + '" y="24" font-size="15" font-weight="bold" fill="#1E2761" text-anchor="middle">教师-AI工作量分配（按教学环节）</text>');

  phases.forEach(function(phase, i) {
    var data = TEACHING_PHASES[phase].data;
    var y = m.t + 10 + i * (barH + gap);

    // 环节标签
    s.push('<text x="' + (m.l - 10) + '" y="' + (y + barH/2 + 5) + '" font-size="13" fill="#25304A" font-weight="600" text-anchor="end">' + labels[i] + '</text>');

    // AI 部分（左侧，蓝绿色）
    var aiW = (data.ai / 100) * iw;
    s.push('<rect x="' + m.l + '" y="' + y + '" width="' + aiW.toFixed(1) + '" height="' + barH + '" fill="#17766B" rx="4"/>');
    s.push('<text x="' + (m.l + aiW/2) + '" y="' + (y + barH/2 + 5) + '" font-size="13" font-weight="bold" fill="#fff" text-anchor="middle">AI ' + data.ai + '%</text>');

    // 教师部分（右侧，蓝色）
    var teacherW = (data.teacher / 100) * iw;
    var teacherX = m.l + aiW;
    s.push('<rect x="' + teacherX.toFixed(1) + '" y="' + y + '" width="' + teacherW.toFixed(1) + '" height="' + barH + '" fill="#2E7BD6" rx="4"/>');
    s.push('<text x="' + (teacherX + teacherW/2) + '" y="' + (y + barH/2 + 5) + '" font-size="13" font-weight="bold" fill="#fff" text-anchor="middle">教师 ' + data.teacher + '%</text>');

    // 说明
    s.push('<text x="' + (w - m.r + 10) + '" y="' + (y + barH/2 + 5) + '" font-size="11" fill="#5E6A82">' + data.label + '</text>');
  });

  // 图例
  s.push('<rect x="' + (m.l) + '" y="' + (h - m.b + 20) + '" width="60" height="16" fill="#17766B" rx="3"/>');
  s.push('<text x="' + (m.l + 68) + '" y="' + (h - m.b + 31) + '" font-size="11" fill="#5E6A82">AI 承担</text>');

  s.push('<rect x="' + (m.l + 140) + '" y="' + (h - m.b + 20) + '" width="60" height="16" fill="#2E7BD6" rx="3"/>');
  s.push('<text x="' + (m.l + 208) + '" y="' + (h - m.b + 31) + '" font-size="11" fill="#5E6A82">教师主导</text>');

  s.push('</svg>');
  document.getElementById('guidanceEffectChart').innerHTML = s.join('');
}
