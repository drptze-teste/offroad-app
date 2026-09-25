/* services.js — clima (Open-Meteo), geocodificação reversa (BigDataCloud), oficinas/guincho (OpenStreetMap). Grátis, sem chave. */
window.OFF = window.OFF || {};
(function (OFF) {
  'use strict';
  const U = OFF.util;

  function fetchJSON(url, opts, ms) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms || 15000);
    return fetch(url, Object.assign({ signal: ctl.signal }, opts || {}))
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .finally(() => clearTimeout(t));
  }

  const S = OFF.services = {};

  // ---------- clima ----------
  // WMO weather codes -> categoria visual
  function categoria(code, temp) {
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'cold';       // neve
    if ([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code)) return 'rain'; // chuva
    if (temp <= 12) return 'cold';
    if (temp >= 29) return 'hot';
    return 'mild';
  }
  const WMO = { 0:'céu limpo',1:'poucas nuvens',2:'parcialmente nublado',3:'nublado',45:'neblina',48:'nevoeiro',
    51:'chuvisco',53:'chuvisco',55:'chuvisco',61:'chuva fraca',63:'chuva',65:'chuva forte',
    71:'neve',73:'neve',75:'neve forte',80:'pancadas',81:'pancadas',82:'temporal',95:'tempestade',96:'tempestade',99:'tempestade' };

  S.weather = (lat, lon) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=temperature_2m,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1&timezone=auto`;
    return fetchJSON(url, null, 12000).then(d => {
      const c = d.current || {};
      const probs = (d.hourly && d.hourly.precipitation_probability) || [];
      const out = {
        temp: Math.round(c.temperature_2m), code: c.weather_code,
        wind: Math.round(c.wind_speed_10m), rainProb: probs.length ? Math.max(...probs.slice(0, 6)) : null,
        desc: WMO[c.weather_code] || 'tempo', cat: categoria(c.weather_code, c.temperature_2m), ts: Date.now(),
      };
      U.save('weather', out); return out;
    }).catch(() => U.load('weather', null));
  };

  // ---------- cidade / distrito / bairro ----------
  S.place = (lat, lon) => {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`;
    return fetchJSON(url, null, 12000).then(d => {
      const uf = (d.principalSubdivisionCode || '').split('-')[1] || '';
      const city = (d.city || d.locality || '').trim();
      const admin = ((d.localityInfo && d.localityInfo.administrative) || [])
        .filter(a => a.name && a.name !== city).sort((a, b) => (b.order || 0) - (a.order || 0)).map(a => a.name);
      const out = {
        city: city ? (city + (uf ? ' – ' + uf : '')) : '—',
        district: admin[1] || admin[0] || '—',
        hood: admin[0] || '—', ts: Date.now(),
      };
      U.save('place', out); return out;
    }).catch(() => U.load('place', null));
  };

  // ---------- oficinas / guincho (Overpass / OpenStreetMap) ----------
  function overpass(ql) {
    return fetchJSON('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(ql) }, 22000);
  }
  function parse(elements, lat, lon) {
    return (elements || []).map(el => {
      const t = el.tags || {}; const p = el.lat != null ? el : (el.center || {});
      const dist = (p.lat != null) ? U.haversine({ lat, lon }, { lat: p.lat, lon: p.lon }) : null;
      return { nm: t.name || 'Oficina', tel: t.phone || t['contact:phone'] || null, hours: t.opening_hours || null, dist, lat: p.lat, lon: p.lon };
    }).filter(o => o.nm).sort((a, b) => (a.dist || 99) - (b.dist || 99)).slice(0, 10);
  }
  S.oficinas = (lat, lon) => {
    const ql = `[out:json][timeout:20];(nwr["shop"="car_repair"](around:25000,${lat},${lon});nwr["shop"="tyres"](around:25000,${lat},${lon}););out center tags 30;`;
    return overpass(ql).then(d => parse(d.elements, lat, lon)).catch(() => []);
  };
  S.guincho = (lat, lon) => {
    const ql = `[out:json][timeout:20];(nwr["service:vehicle:towing"="yes"](around:40000,${lat},${lon});nwr["shop"="car_repair"]["name"~"guincho|reboque|24",i](around:40000,${lat},${lon}););out center tags 30;`;
    return overpass(ql).then(d => parse(d.elements, lat, lon)).catch(() => []);
  };

  // link p/ Google Maps (fallback com "aberto agora" e telefone nativos)
  S.mapsSearch = (q, lat, lon) => `https://www.google.com/maps/search/${encodeURIComponent(q)}/@${lat.toFixed(5)},${lon.toFixed(5)},14z`;

  // ---------- recarga elétrica (Open Charge Map, grátis) ----------
  S.chargers = (lat, lon, key) => {
    const url = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lon}&distance=40&distanceunit=KM&maxresults=25&compact=true&verbose=false${key ? '&key=' + encodeURIComponent(key) : ''}`;
    return fetchJSON(url, key ? { headers: { 'X-API-Key': key } } : null, 15000).then(list => (Array.isArray(list) ? list : []).map(p => {
      const ai = p.AddressInfo || {};
      const plugs = [...new Set((p.Connections || []).map(c => c.ConnectionType && c.ConnectionType.Title).filter(Boolean))];
      const dist = ai.Distance != null ? ai.Distance : U.haversine({ lat, lon }, { lat: ai.Latitude, lon: ai.Longitude });
      return { nm: ai.Title || 'Ponto de recarga', dist, plugs, lat: ai.Latitude, lon: ai.Longitude };
    }).sort((a, b) => (a.dist || 999) - (b.dist || 999))).catch(() => []);
  };
})(window.OFF);
