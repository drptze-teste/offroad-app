/* util.js — helpers puros, sem dependências. Namespace global OFF. */
window.OFF = window.OFF || {};
(function (OFF) {
  'use strict';

  const U = OFF.util = {};

  // ---------- números / tempo ----------
  U.fmt = (v, d = 1) => (v == null || Number.isNaN(v)) ? '—' : Number(v).toFixed(d);
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.pad2 = n => String(n).padStart(2, '0');

  U.fmtKm = km => (km == null || Number.isNaN(km)) ? '—' : (km < 10 ? km.toFixed(1) : km.toFixed(0)).replace('.', ',');
  U.fmtTime = s => { s = Math.floor(s); return U.pad2(Math.floor(s / 60)) + ':' + U.pad2(s % 60); };
  U.fmtClock = d => U.pad2(d.getHours()) + ':' + U.pad2(d.getMinutes());
  U.fmtDur = ms => { if (ms <= 0) return 'anoiteceu'; const h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000); return h > 0 ? `${h}h${U.pad2(m)}` : `${m} min`; };

  // ---------- coordenadas ----------
  U.dms = (v, pos, neg) => {
    const h = v >= 0 ? pos : neg; v = Math.abs(v);
    let d = Math.floor(v), m = Math.floor((v - d) * 60), s = Math.round((v - d - m / 60) * 3600);
    if (s === 60) { s = 0; m++; } if (m === 60) { m = 0; d++; }
    return `${d}°${U.pad2(m)}'${U.pad2(s)}"${h}`;
  };
  U.coordDMS = (lat, lon) => U.dms(lat, 'N', 'S') + '  ' + U.dms(lon, 'L', 'O');

  const OLC_A = '23456789CFGHJMPQRVWX';
  U.olc = (lat, lon) => {
    let la = lat + 90, lo = lon + 180, code = ''; const res = [20, 1, 0.05, 0.0025, 0.000125];
    for (let i = 0; i < 5; i++) code += OLC_A[Math.floor(la / res[i]) % 20] + OLC_A[Math.floor(lo / res[i]) % 20];
    return code.slice(0, 8) + '+' + code.slice(8);
  };

  const R = 6371, toRad = d => d * Math.PI / 180, toDeg = r => r * 180 / Math.PI;
  U.haversine = (a, b) => {
    const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s)); // km
  };
  U.bearing = (a, b) => {
    const y = Math.sin(toRad(b.lon - a.lon)) * Math.cos(toRad(b.lat));
    const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lon - a.lon));
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  };
  U.cardeal = deg => ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'][Math.round(((deg % 360) + 360) % 360 / 45) % 8];

  // ---------- sol (algoritmo SunCalc inline p/ funcionar offline) ----------
  const rad = Math.PI / 180, dayMs = 864e5, J1970 = 2440588, J2000 = 2451545, e = rad * 23.4397;
  const toJulian = date => date.valueOf() / dayMs - 0.5 + J1970;
  const fromJulian = j => new Date((j + 0.5 - J1970) * dayMs);
  const toDays = date => toJulian(date) - J2000;
  const solarMeanAnomaly = d => rad * (357.5291 + 0.98560028 * d);
  const eclipticLongitude = M => M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + Math.PI;
  const declination = l => Math.asin(Math.sin(e) * Math.sin(l));
  const J0 = 0.0009;
  const approxTransit = (Ht, lw, n) => J0 + (Ht + lw) / (2 * Math.PI) + n;
  const solarTransitJ = (ds, M, L) => J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const hourAngle = (h, phi, dec) => Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
  U.sunTimes = (date, lat, lng) => {
    const lw = rad * -lng, phi = rad * lat, d = toDays(date);
    const n = Math.round(d - J0 - lw / (2 * Math.PI));
    const ds = approxTransit(0, lw, n);
    const M = solarMeanAnomaly(ds), L = eclipticLongitude(M), dec = declination(L);
    const Jnoon = solarTransitJ(ds, M, L), h0 = rad * -0.833;
    const w = hourAngle(h0, phi, dec), a = approxTransit(w, lw, n);
    const Jset = solarTransitJ(a, M, L), Jrise = Jnoon - (Jset - Jnoon);
    return { sunrise: fromJulian(Jrise), sunset: fromJulian(Jset), noon: fromJulian(Jnoon) };
  };

  // ---------- persistência segura ----------
  U.load = (k, def) => { try { const v = localStorage.getItem('off_' + k); return v == null ? def : JSON.parse(v); } catch (_) { return def; } };
  U.save = (k, v) => { try { localStorage.setItem('off_' + k, JSON.stringify(v)); } catch (_) {} };

  U.online = () => navigator.onLine !== false;
})(window.OFF);
