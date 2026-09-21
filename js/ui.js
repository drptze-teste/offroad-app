/* ui.js — desenho e atualização dos mostradores, bússola, sol, mini-mapa e clima ambiente. */
window.OFF = window.OFF || {};
(function (OFF) {
  'use strict';
  const U = OFF.util;
  const $ = id => document.getElementById(id);
  const rad = d => (d - 90) * Math.PI / 180;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };

  const ui = OFF.ui = {};
  let hdgShown = 120; // suavização da bússola

  ui.buildStatic = function () {
    // altímetro: ticks 0..3000 em 270°
    const at = $('altTicks');
    for (let i = 0; i <= 10; i++) { const ang = -135 + i * 27, r2 = i % 5 === 0 ? 76 : 82;
      at.appendChild(el('line', { x1: 98 + 90 * Math.cos(rad(ang + 90)), y1: 98 + 90 * Math.sin(rad(ang + 90)),
        x2: 98 + r2 * Math.cos(rad(ang + 90)), y2: 98 + r2 * Math.sin(rad(ang + 90)), stroke: '#3a4a58', 'stroke-width': i % 5 === 0 ? 3 : 2 })); }
    // rosa dos ventos
    const rose = $('rose');
    for (let a = 0; a < 360; a += 15) { const long = a % 90 === 0, r2 = long ? 70 : 78;
      rose.appendChild(el('line', { x1: 82 * Math.cos(rad(a + 90)), y1: 82 * Math.sin(rad(a + 90)), x2: r2 * Math.cos(rad(a + 90)), y2: r2 * Math.sin(rad(a + 90)), stroke: '#3a4a58', 'stroke-width': 2 })); }
    [['N', 0, '#ff8a3d'], ['L', 90, '#eaf1f6'], ['S', 180, '#eaf1f6'], ['O', 270, '#eaf1f6']].forEach(([t, a, c]) => {
      const x = 58 * Math.cos(rad(a + 90)), y = 58 * Math.sin(rad(a + 90));
      const tx = el('text', { x, y: y + 6, 'text-anchor': 'middle', fill: c, 'font-family': 'Rajdhani', 'font-weight': 700, 'font-size': 20 }); tx.textContent = t; rose.appendChild(tx);
    });
    rose.appendChild(el('path', { d: 'M0 -40 L7 0 L0 9 L-7 0 Z', fill: '#ff4d4d' }));
    // arco do sol (semicírculo)
    let d = ''; for (let i = 0; i <= 40; i++) { const th = 180 - i / 40 * 180, x = 98 + 80 * Math.cos(th * Math.PI / 180), y = 128 - 80 * Math.sin(th * Math.PI / 180); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
    $('sunArc').setAttribute('d', d);
    this.sizeAmbient();
    addEventListener('resize', () => this.sizeAmbient());
  };

  function altArc(val) { const f = U.clamp(val / 3000, 0, 1), a0 = -135, a1 = -135 + f * 270, big = (a1 - a0) > 180 ? 1 : 0;
    const x0 = 98 + 90 * Math.cos(rad(a0 + 90)), y0 = 98 + 90 * Math.sin(rad(a0 + 90)), x1 = 98 + 90 * Math.cos(rad(a1 + 90)), y1 = 98 + 90 * Math.sin(rad(a1 + 90));
    return `M${x0} ${y0} A 90 90 0 ${big} 1 ${x1} ${y1}`; }

  // ---------- atualização por evento de GPS ----------
  ui.update = function (geo, place) {
    const no = geo.lat == null;
    // altímetro
    if (geo.alt != null) { $('altArc').setAttribute('d', altArc(geo.alt));
      const ang = -135 + (geo.alt / 3000) * 270; $('altNeedle').setAttribute('x2', 98 + 80 * Math.cos(rad(ang + 90))); $('altNeedle').setAttribute('y2', 98 + 80 * Math.sin(rad(ang + 90)));
      $('altBig').textContent = Math.round(geo.alt); } else $('altBig').textContent = no ? '—' : 's/ alt';
    $('grade').textContent = (geo.grade >= 0 ? '+' : '') + Math.round(geo.grade) + '%';
    $('altAcc').textContent = geo.altAcc != null ? '±' + Math.round(geo.altAcc) : '—';
    // velocidade
    $('spd').textContent = no ? '—' : Math.round(geo.speed);
    $('vAvg').textContent = Math.round(geo.avgSpeed());
    $('vMax').textContent = Math.round(geo.trip.vmax);
    // coordenadas
    if (!no) { $('coordDMS').textContent = U.coordDMS(geo.lat, geo.lon);
      $('coordDec').textContent = geo.lat.toFixed(5) + ', ' + geo.lon.toFixed(5); $('coordOLC').textContent = U.olc(geo.lat, geo.lon); }
    // odômetro
    $('tDist').textContent = geo.trip.dist.toFixed(1).replace('.', ',');
    $('tTime').textContent = U.fmtTime(geo.trip.moveSec);
    $('tAvg').textContent = Math.round(geo.avgSpeed());
    $('tClimb').textContent = Math.round(geo.trip.climb);
    // track
    $('trkPts').textContent = geo.track.length; $('trkKm').textContent = U.fmtKm(geo.trackKm);
    ui.drawMap(geo);
    // waypoint
    const tgt = geo.toTarget();
    if (tgt) { $('wpName').textContent = tgt.name; $('wpDist').textContent = U.fmtKm(tgt.dist) + ' km'; $('wpActive').textContent = tgt.name; $('wpActiveDist').textContent = U.fmtKm(tgt.dist) + ' km'; $('wparrow').style.opacity = tgt.dist < 0.02 ? .15 : 1; }
    else { $('wpName').textContent = '—'; $('wpDist').textContent = 'marque'; $('wpActive').textContent = '—'; $('wpActiveDist').textContent = '—'; }
    // sol
    if (!no) ui.updateSun(geo);
    // cidade no rodapé
    if (place && place.city) { const n = $('near'); if (n) n.textContent = place.city; }
    // status GPS
    const g = $('gpsVal'); if (g) g.textContent = geo.error ? geo.error : (no ? 'buscando…' : '±' + Math.round(geo.acc || 0) + ' m');
    $('gpsChip').classList.toggle('bad', !!geo.error);
  };

  ui.updateSun = function (geo) {
    const now = new Date(), t = U.sunTimes(now, geo.lat, geo.lon), fmt = d => isNaN(d) ? '--:--' : U.fmtClock(d);
    $('sunrise').textContent = fmt(t.sunrise); $('sunset').textContent = fmt(t.sunset);
    let frac = .5, light = '—';
    if (!isNaN(t.sunrise) && !isNaN(t.sunset)) {
      frac = (now - t.sunrise) / (t.sunset - t.sunrise);
      if (now < t.sunrise) { light = 'nasce ' + fmt(t.sunrise); frac = 0; }
      else if (now > t.sunset) { light = 'anoiteceu'; frac = 1; }
      else light = U.fmtDur(t.sunset - now);
    }
    $('lightBig').textContent = light; frac = U.clamp(frac, 0, 1);
    const th = 180 - frac * 180, x = 98 + 80 * Math.cos(th * Math.PI / 180), y = 128 - 80 * Math.sin(th * Math.PI / 180);
    $('sun').setAttribute('transform', `translate(${(x - 98).toFixed(1)},${(y - 48).toFixed(1)})`);
    $('sunDot').setAttribute('fill', (frac <= 0 || frac >= 1) ? '#5a6b7a' : '#ffce54');
  };

  // ---------- suavização contínua (bússola) ----------
  ui.tickSmooth = function (geo) {
    const target = (geo.heading != null) ? geo.heading : hdgShown;
    let dd = ((target - hdgShown + 540) % 360) - 180; hdgShown += dd * 0.15;
    const h = (hdgShown + 360) % 360;
    $('rose').setAttribute('transform', `translate(98,98) rotate(${(-h).toFixed(1)})`);
    $('hdgBig').textContent = geo.heading == null ? '—' : Math.round(h);
    $('hdgCard').textContent = geo.heading == null ? 'parado' : U.cardeal(h);
    const tgt = geo.toTarget();
    if (tgt) $('wparrow').setAttribute('transform', `translate(98,98) rotate(${(tgt.bearing - h).toFixed(1)})`);
  };

  // ---------- mini-mapa ----------
  ui.drawMap = function (geo) {
    const c = $('minimap'), x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height);
    const pts = geo.track.concat(geo.lat != null ? [{ lat: geo.lat, lon: geo.lon }] : []);
    if (pts.length < 2) { x.fillStyle = '#3a4a58'; x.font = '13px sans-serif'; x.textAlign = 'center'; x.fillText('grave a rota para ver o traçado', c.width / 2, c.height / 2); return; }
    let a = 1e9, b = -1e9, cc = 1e9, d = -1e9;
    pts.forEach(p => { a = Math.min(a, p.lat); b = Math.max(b, p.lat); cc = Math.min(cc, p.lon); d = Math.max(d, p.lon); });
    const pad = 14, w = c.width - pad * 2, h = c.height - pad * 2, sx = v => pad + (d === cc ? .5 : (v - cc) / (d - cc)) * w, sy = v => pad + (b === a ? .5 : 1 - (v - a) / (b - a)) * h;
    x.beginPath(); pts.forEach((p, i) => { const px = sx(p.lon), py = sy(p.lat); i ? x.lineTo(px, py) : x.moveTo(px, py); });
    x.strokeStyle = '#ff8a3d'; x.lineWidth = 2.4; x.stroke();
    const last = pts[pts.length - 1], first = pts[0];
    x.fillStyle = '#3ddc84'; x.beginPath(); x.arc(sx(last.lon), sy(last.lat), 4.5, 0, 7); x.fill();
    x.fillStyle = '#5aa9e6'; x.beginPath(); x.arc(sx(first.lon), sy(first.lat), 3.5, 0, 7); x.fill();
  };

  // ---------- clima: card + ambiente animado ----------
  const cv = () => $('ambient'); let ctx, W = 0, H = 0, cat = 'mild', flash = 0, bolt = null; const parts = [];
  ui.sizeAmbient = function () { const c = cv(); if (!c) return; ctx = c.getContext('2d'); W = c.width = innerWidth; H = c.height = innerHeight; };
  const TINT = { cold: 'rgba(60,130,220,.14)', mild: 'transparent', hot: 'rgba(255,80,20,.10)', rain: 'rgba(70,92,120,.20)' };
  const ICON = { cold: '❄', mild: '☀', hot: '🔥', rain: '🌧' };
  ui.setWeather = function (wx) {
    if (!wx) { $('wxt').textContent = '—'; $('wxcap').textContent = 'sem clima'; return; }
    cat = wx.cat || 'mild'; parts.length = 0;
    $('wxt').textContent = wx.temp; $('wxic').textContent = ICON[cat]; $('wxcap').textContent = wx.desc + (wx.rainProb != null ? ' · chuva ' + wx.rainProb + '%' : '');
    document.documentElement.style.setProperty('--tint', TINT[cat]);
  };
  function bolts() { const x0 = W * (.15 + Math.random() * .7); let x = x0, y = 8; const p = [[x, y]]; const n = 3 + (Math.random() * 2 | 0); for (let i = 0; i < n; i++) { x += (Math.random() - .5) * 26; y += 14 + Math.random() * 16; p.push([x, y]); } return p; }
  ui.tickAmbient = function () {
    if (!ctx) return; ctx.clearRect(0, 0, W, H);
    if (cat === 'cold' && parts.length < 80) parts.push({ x: Math.random() * W, y: -5, vy: .5 + Math.random(), vx: (Math.random() - .5) * .5, r: 1 + Math.random() * 2.2, a: .5 + Math.random() * .4, t: 's' });
    else if (cat === 'hot' && parts.length < 60) parts.push({ x: Math.random() * W, y: H + 5, vy: -(1 + Math.random() * 2), vx: (Math.random() - .5) * .6, r: 1.4 + Math.random() * 2.6, a: .7, life: 1, t: 'e' });
    else if (cat === 'rain' && parts.length < 130) parts.push({ x: Math.random() * W, y: -12, vy: 9 + Math.random() * 4, vx: -1.6, len: 9 + Math.random() * 8, a: .35 + Math.random() * .3, t: 'r' });
    if (cat === 'hot') { const g = ctx.createLinearGradient(0, H, 0, H - 70); g.addColorStop(0, 'rgba(255,90,20,.35)'); g.addColorStop(1, 'rgba(255,90,20,0)'); ctx.fillStyle = g; ctx.fillRect(0, H - 70, W, 70); }
    if (cat === 'rain') { if (flash <= 0 && Math.random() < .006) { flash = 8; bolt = bolts(); }
      if (flash > 0) { ctx.fillStyle = `rgba(200,215,245,${(flash / 8) * .14})`; ctx.fillRect(0, 0, W, H);
        if (bolt) { ctx.beginPath(); ctx.moveTo(bolt[0][0], bolt[0][1]); for (let i = 1; i < bolt.length; i++) ctx.lineTo(bolt[i][0], bolt[i][1]); ctx.strokeStyle = `rgba(226,238,255,${Math.min(1, flash / 5)})`; ctx.lineWidth = 2.2; ctx.stroke(); } flash--; } }
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.x += p.vx; p.y += p.vy;
      if (p.t === 's') { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fillStyle = `rgba(220,235,255,${p.a})`; ctx.fill(); if (p.y > H + 5) parts.splice(i, 1); }
      else if (p.t === 'r') { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 2, p.y - p.len); ctx.strokeStyle = `rgba(170,195,230,${p.a})`; ctx.lineWidth = 1.3; ctx.stroke(); if (p.y > H + 8) parts.splice(i, 1); }
      else { p.life -= .012; p.a = Math.max(0, p.life * .8); ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fillStyle = `rgba(255,${120 + Math.random() * 80 | 0},30,${p.a})`; ctx.fill(); if (p.life <= 0 || p.y < H * .45) parts.splice(i, 1); } }
  };
})(window.OFF);
