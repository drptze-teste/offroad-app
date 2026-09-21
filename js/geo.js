/* geo.js — posição (GPS real ou simulada), odômetro, track, inclinação do terreno, waypoints. */
window.OFF = window.OFF || {};
(function (OFF) {
  'use strict';
  const U = OFF.util;

  const geo = OFF.geo = {
    ok: false,            // já recebeu ao menos uma posição
    sim: false,
    lat: null, lon: null, alt: null,
    acc: null, altAcc: null,
    speed: 0,             // km/h
    heading: null,        // graus (só em movimento)
    grade: 0,             // % inclinação do terreno (EMA)
    odoKm: 0,             // distância total acumulada (p/ consumo), persistida
    // trip
    trip: { on: false, dist: 0, moveSec: 0, climb: 0, vmax: 0 },
    track: [],            // [{lat,lon}]
    trackKm: 0,
    recording: false,
    waypoints: {},        // nome -> {lat,lon}
    active: null,
    error: null,
    listeners: [],
  };

  geo.on = fn => geo.listeners.push(fn);
  const emit = () => geo.listeners.forEach(f => { try { f(geo); } catch (_) {} });

  // estado persistido
  geo.track = U.load('track', []);
  geo.trackKm = U.load('trackKm', 0);
  geo.odoKm = U.load('odoKm', 0);
  geo.waypoints = U.load('waypoints', {});
  geo.active = U.load('wpActive', null);

  let prevAlt = null, prevFix = null, gradeEMA = 0, lastTrackPt = null, lastMoveTs = null;

  function ingest(lat, lon, alt, acc, altAcc, speed, heading, ts) {
    geo.lat = lat; geo.lon = lon; geo.alt = alt; geo.acc = acc; geo.altAcc = altAcc;
    geo.speed = (speed != null && !Number.isNaN(speed)) ? speed * 3.6 : geo.speed;
    if (heading != null && !Number.isNaN(heading)) geo.heading = heading;
    const moving = geo.speed > 2.5 && (acc == null || acc < 40);

    const here = { lat, lon };
    // distância desde o último fix
    let dKm = 0;
    if (prevFix) dKm = U.haversine(prevFix, here);

    // odômetro total (p/ consumo) — sempre que em movimento
    if (moving && dKm > 0 && dKm < 1) { geo.odoKm += dKm; U.save('odoKm', geo.odoKm); }

    // odômetro
    if (geo.trip.on) {
      const dt = lastMoveTs ? (ts - lastMoveTs) / 1000 : 0;
      if (moving && dKm < 1) { geo.trip.dist += dKm; geo.trip.moveSec += dt; }
      if (prevAlt != null && alt != null && alt > prevAlt) geo.trip.climb += (alt - prevAlt);
      if (geo.speed > geo.trip.vmax) geo.trip.vmax = geo.speed;
    }
    lastMoveTs = ts;

    // inclinação do terreno (dAlt / dDist)
    if (moving && prevAlt != null && alt != null && dKm > 0.002 && dKm < 1) {
      const g = U.clamp((alt - prevAlt) / (dKm * 1000) * 100, -45, 45);
      gradeEMA = gradeEMA * 0.8 + g * 0.2;
    }
    geo.grade = gradeEMA;

    // track (grava a cada >15 m quando ligado)
    if (geo.recording) {
      if (!lastTrackPt || U.haversine(lastTrackPt, here) > 0.015) {
        if (lastTrackPt) geo.trackKm += U.haversine(lastTrackPt, here);
        lastTrackPt = here; geo.track.push(here);
        if (geo.track.length > 6000) geo.track.shift();
        U.save('track', geo.track); U.save('trackKm', geo.trackKm);
      }
    }

    if (alt != null) prevAlt = alt;
    prevFix = here;
    geo.ok = true; geo.error = null;
    emit();
  }

  // ---------- controles ----------
  geo.tripStart = () => { geo.trip.on = !geo.trip.on; return geo.trip.on; };
  geo.tripReset = () => { geo.trip = { on: geo.trip.on, dist: 0, moveSec: 0, climb: 0, vmax: 0 }; emit(); };
  geo.recStart = () => { geo.recording = !geo.recording; if (geo.recording) lastTrackPt = geo.lat != null ? { lat: geo.lat, lon: geo.lon } : null; return geo.recording; };
  geo.markWaypoint = name => { if (geo.lat == null) return false; geo.waypoints[name] = { lat: geo.lat, lon: geo.lon }; geo.active = name; U.save('waypoints', geo.waypoints); U.save('wpActive', name); emit(); return true; };
  geo.setActive = name => { geo.active = name; U.save('wpActive', name); emit(); };
  geo.toTarget = () => {
    const t = geo.active && geo.waypoints[geo.active]; if (!t || geo.lat == null) return null;
    const here = { lat: geo.lat, lon: geo.lon };
    return { name: geo.active, dist: U.haversine(here, t), bearing: U.bearing(here, t) };
  };
  geo.avgSpeed = () => geo.trip.moveSec > 5 ? geo.trip.dist / (geo.trip.moveSec / 3600) : 0;

  // ---------- fontes ----------
  geo.startReal = () => {
    if (!('geolocation' in navigator)) { geo.error = 'GPS não suportado'; emit(); return; }
    navigator.geolocation.watchPosition(
      p => { const c = p.coords; ingest(c.latitude, c.longitude, c.altitude, c.accuracy, c.altitudeAccuracy, c.speed, c.heading, p.timestamp || Date.now()); },
      err => { geo.error = err.code === 1 ? 'Permissão de localização negada' : (err.code === 3 ? 'GPS sem sinal' : 'Erro de GPS'); emit(); },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 30000 }
    );
  };

  geo.startSim = () => {
    geo.sim = true;
    let lat = -22.4187, lon = -44.6035, t = 0;
    if (!geo.waypoints.Carro) { geo.waypoints.Carro = { lat, lon }; geo.active = 'Carro'; }
    setInterval(() => {
      t += 1;
      const hdg = (120 + Math.sin(t / 30) * 45 + 360) % 360;
      const spd = 26 + Math.sin(t / 12) * 12;          // km/h
      const alt = 1420 + Math.sin(t / 20) * 30;
      const dxkm = spd / 3600 * 1.2;                    // acelerado p/ demo
      const hr = hdg * Math.PI / 180;
      lat += (dxkm / 110.574) * Math.cos(hr);
      lon += (dxkm / (111.32 * Math.cos(lat * Math.PI / 180))) * Math.sin(hr);
      ingest(lat, lon, alt, 8, 12, spd / 3.6, hdg, Date.now());
    }, 1000);
  };
})(window.OFF);
