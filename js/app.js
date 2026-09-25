/* app.js — orquestra tudo: navegação, abertura, loop de GPS, consumo, veículo, socorro, PWA. */
(function (OFF) {
  'use strict';
  const U = OFF.util, geo = OFF.geo, S = OFF.services, ui = OFF.ui, fuel = OFF.fuel;
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const SIM = params.has('sim') || location.hash.indexOf('sim') >= 0;

  const toastEl = $('toast');
  function toast(m) { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => toastEl.classList.remove('show'), 1900); }

  // ---------- PWA ----------
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  let wakeLock = null;
  async function keepAwake() { try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (_) {} }
  keepAwake(); document.addEventListener('visibilitychange', () => { if (!document.hidden) keepAwake(); });

  // ---------- navegação ----------
  const screens = [...document.querySelectorAll('.screen')];
  const navBtns = [...document.querySelectorAll('#nav button')];
  function go(name) {
    screens.forEach(s => s.classList.toggle('active', s.dataset.screen === name));
    navBtns.forEach(b => b.classList.toggle('on', b.dataset.go === name));
    if (name === 'consumo') renderFuel();
    if (name === 'veiculo') renderVehicle();
  }
  navBtns.forEach(b => b.addEventListener('click', () => go(b.dataset.go)));

  // ---------- localização compartilhável ----------
  let lastPlace = U.load('place', null);
  function locMsg() {
    const c = lastPlace && lastPlace.city && lastPlace.city !== '—' ? lastPlace.city + '\n' : '';
    return `Estou aqui\n${c}${geo.lat.toFixed(5)}, ${geo.lon.toFixed(5)}\nhttps://maps.google.com/?q=${geo.lat.toFixed(5)},${geo.lon.toFixed(5)}`;
  }
  const copy = t => { try { navigator.clipboard.writeText(t); } catch (_) {} };

  // ---------- painel: botões ----------
  $('btnGo').addEventListener('click', () => { const on = geo.tripStart(); $('btnGo').classList.toggle('primary', !on); $('btnGo').innerHTML = on ? '❚❚ Pausar' : '▶ Ligar'; });
  $('btnRst').addEventListener('click', () => { geo.tripReset(); toast('Odômetro zerado'); });
  $('btnRec').addEventListener('click', () => { const on = geo.recStart(); $('btnRec').classList.toggle('on', on); $('btnRec').innerHTML = on ? '■ Parar' : '● Gravar'; toast(on ? 'Gravando a rota' : 'Gravação pausada'); });
  $('btnGpx').addEventListener('click', exportGpx);
  $('wpStart').addEventListener('click', () => geo.markWaypoint('Início') ? toast('Início marcado aqui') : toast('Sem GPS ainda'));
  $('wpHotel').addEventListener('click', () => geo.markWaypoint('Hotel') ? toast('Hotel marcado aqui') : toast('Sem GPS ainda'));
  $('wpCar').addEventListener('click', () => geo.markWaypoint('Carro') ? toast('Carro marcado aqui') : toast('Sem GPS ainda'));
  $('wpCamp').addEventListener('click', () => geo.markWaypoint('Acampamento') ? toast('Acampamento marcado') : toast('Sem GPS ainda'));

  function exportGpx() {
    if (!geo.track.length) return toast('Grave a rota primeiro');
    let g = '<?xml version="1.0"?>\n<gpx version="1.1" creator="Offroad"><trk><name>Aventura</name><trkseg>\n';
    geo.track.forEach(p => { g += `<trkpt lat="${p.lat.toFixed(6)}" lon="${p.lon.toFixed(6)}"></trkpt>\n`; });
    g += '</trkseg></trk></gpx>';
    try { const b = new Blob([g], { type: 'application/gpx+xml' }), u = URL.createObjectURL(b), a = document.createElement('a');
      a.href = u; a.download = 'aventura.gpx'; a.click(); URL.revokeObjectURL(u); toast('GPX exportado (' + geo.track.length + ' pontos)'); }
    catch (_) { toast('GPX pronto'); }
  }

  // ---------- socorro ----------
  $('btnShare').addEventListener('click', () => { if (geo.lat == null) return toast('Sem GPS'); copy(locMsg()); toast('Localização copiada'); });
  $('btnCopy').addEventListener('click', () => { if (geo.lat == null) return toast('Sem GPS'); copy(geo.lat.toFixed(5) + ', ' + geo.lon.toFixed(5)); toast('Coordenada copiada'); });
  const contactNum = $('contactNum');
  contactNum.value = U.load('contact', '') || '';
  contactNum.addEventListener('change', () => U.save('contact', contactNum.value));
  $('btnRescue').addEventListener('click', () => {
    if (geo.lat == null) return toast('Sem GPS');
    const num = (contactNum.value || '').replace(/\D/g, '');
    const city = lastPlace && lastPlace.city && lastPlace.city !== '—' ? ' (' + lastPlace.city + ')' : '';
    const text = encodeURIComponent(`SOS! Preciso de ajuda${city}. ${geo.lat.toFixed(5)}, ${geo.lon.toFixed(5)}. https://maps.google.com/?q=${geo.lat.toFixed(5)},${geo.lon.toFixed(5)}`);
    if (num) { try { window.open(`https://wa.me/${num}?text=${text}`, '_blank'); } catch (_) {} toast('Abrindo WhatsApp (você confirma o envio)'); }
    else toast('Defina o WhatsApp do contato');
  });
  $('btnWhere').addEventListener('click', () => {
    if (geo.lat == null) return toast('Sem GPS');
    if (!U.online()) { fillPlace(lastPlace); return toast('Offline — mostrando último conhecido'); }
    toast('Buscando cidade…');
    S.place(geo.lat, geo.lon).then(p => { lastPlace = p; fillPlace(p); copy(locMsg()); toast(p ? 'Localização copiada' : 'Não encontrei a cidade'); });
  });
  function fillPlace(p) { $('wCity').textContent = (p && p.city) || '—'; $('wDist').textContent = (p && p.district) || '—'; $('wHood').textContent = (p && p.hood) || '—'; }
  fillPlace(lastPlace);

  // modal oficinas/guincho
  const telHref = t => 'tel:' + (t || '').replace(/[^0-9+]/g, '');
  function openList(title, promise, q) {
    $('sosTitle').textContent = title;
    $('sosList').innerHTML = '<div class="sositem"><div class="info">Buscando perto de você…</div></div>';
    $('sosMaps').href = geo.lat != null ? S.mapsSearch(q, geo.lat, geo.lon) : '#';
    $('sosback').classList.add('show');
    promise.then(items => {
      if (!items.length) { $('sosList').innerHTML = '<div class="sositem"><div class="info">Nada no OpenStreetMap aqui. Use o Google Maps abaixo.</div></div>'; return; }
      $('sosList').innerHTML = items.map(o => `<div class="sositem"><div class="info">
        <div class="nm">${esc(o.nm)}</div>
        <div class="mt">${o.dist != null ? U.fmtKm(o.dist) + ' km' : ''}${o.tel ? ' · <span class="ph">' + esc(o.tel) + '</span>' : ' · sem telefone'}${o.hours ? ' · ' + esc(o.hours) : ''}</div>
      </div><div class="acts">${o.tel ? `<a class="callbtn" href="${telHref(o.tel)}">Ligar</a>` : ''}
        ${o.lat != null ? `<a class="routebtn" href="https://www.google.com/maps/search/?api=1&query=${o.lat},${o.lon}" target="_blank" rel="noopener">Rota</a>` : ''}</div></div>`).join('');
    });
  }
  const esc = s => String(s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  $('btnOfic').addEventListener('click', () => { if (geo.lat == null) return toast('Sem GPS'); openList('Oficinas próximas', S.oficinas(geo.lat, geo.lon), 'oficina mecânica'); });
  $('btnGuincho').addEventListener('click', () => { if (geo.lat == null) return toast('Sem GPS'); openList('Guincho / reboque', S.guincho(geo.lat, geo.lon), 'guincho'); });
  $('sosClose').addEventListener('click', () => $('sosback').classList.remove('show'));
  $('sosback').addEventListener('click', e => { if (e.target.id === 'sosback') $('sosback').classList.remove('show'); });

  // ---------- Spotify (atalho + playlists salvas offline) ----------
  function renderPlaylists() {
    const pls = U.load('playlists', []);
    $('plList').innerHTML = pls.length ? pls.map((p, i) => `<span style="display:inline-flex;gap:4px"><a class="act" href="${esc(p.u)}" target="_blank" rel="noopener">▶ ${esc(p.t)}</a><button class="act" data-del="${i}" style="padding:9px 11px">✕</button></span>`).join('') : '<span class="coord-sub">nenhuma playlist salva ainda</span>';
    [...document.querySelectorAll('#plList [data-del]')].forEach(b => b.addEventListener('click', () => { const a = U.load('playlists', []); a.splice(+b.dataset.del, 1); U.save('playlists', a); renderPlaylists(); }));
  }
  $('plAdd').addEventListener('click', () => {
    const u = $('plInput').value.trim(); if (!/^https?:\/\//.test(u) && !/^spotify:/.test(u)) return toast('Cole um link do Spotify');
    const a = U.load('playlists', []); a.push({ t: 'Playlist ' + (a.length + 1), u }); U.save('playlists', a); $('plInput').value = ''; renderPlaylists(); toast('Playlist salva');
  });
  renderPlaylists();

  // ---------- recarga elétrica ----------
  function openChargers() {
    if (geo.lat == null) { toast('Sem GPS'); return; }
    $('sosTitle').textContent = 'Recarga elétrica perto';
    $('sosList').innerHTML = '<div class="sositem"><div class="info">Buscando pontos de recarga…</div></div>';
    $('sosMaps').href = S.mapsSearch('posto de recarga carro elétrico', geo.lat, geo.lon);
    $('sosback').classList.add('show');
    const myPlug = OFF.plugMatch(OFF.getEnergy(OFF.selectedVeh()).plug);
    S.chargers(geo.lat, geo.lon, OFF.getOcmKey()).then(items => {
      if (!items.length) { $('sosList').innerHTML = '<div class="sositem"><div class="info">' + (OFF.getOcmKey() ? 'Nenhum ponto de recarga por aqui.' : 'Para listar postos no app, adicione uma chave grátis do Open Charge Map na tela Veículo.') + ' Use o Google Maps abaixo.</div></div>'; return; }
      $('sosList').innerHTML = items.map(o => {
        const mine = myPlug && o.plugs.some(p => p.indexOf(myPlug) >= 0);
        const plugTxt = o.plugs.length ? o.plugs.join(', ') : 'plugs não informados';
        return `<div class="sositem"><div class="info"><div class="nm">${esc(o.nm)}${mine ? ' ✅ seu plug' : ''}</div>
          <div class="mt">${U.fmtKm(o.dist)} km · <span class="ph">${esc(plugTxt)}</span></div></div>
          <div class="acts">${o.lat != null ? `<a class="routebtn" href="https://www.google.com/maps/search/?api=1&query=${o.lat},${o.lon}" target="_blank" rel="noopener">Rota</a>` : ''}</div></div>`;
      }).join('');
    });
  }
  $('btnCharge').addEventListener('click', openChargers);

  // ---------- escolha do carro na 1ª abertura ----------
  function firstRunCar() {
    if (U.load('seen', false)) return;
    const vehs = OFF.getVehicles();
    $('carList').innerHTML = Object.keys(vehs).map(k => `<button class="act" data-v="${k}" style="width:100%;justify-content:flex-start;margin-bottom:8px">${esc(vehs[k].nome)}</button>`).join('');
    $('carback').classList.add('show');
    const pick = k => { if (k) OFF.selectVeh(k); U.save('seen', true); $('carback').classList.remove('show'); };
    [...document.querySelectorAll('#carList [data-v]')].forEach(b => b.addEventListener('click', () => pick(b.dataset.v)));
    $('carSkip').addEventListener('click', () => pick(null));
  }

  // ---------- consumo ----------
  $('fuelTank').value = fuel.tank;
  $('fuelTank').addEventListener('change', () => { fuel.setTank($('fuelTank').value); renderFuel(); });
  $('fuelAdd').addEventListener('click', () => { const L = $('fuelLiters').value; if (fuel.addFill(L, geo.odoKm)) { $('fuelLiters').value = ''; toast('Abastecimento registrado'); renderFuel(); } else toast('Informe os litros'); });
  $('fuelUndo').addEventListener('click', () => { fuel.undo(); renderFuel(); toast('Último removido'); });
  $('fuelReset').addEventListener('click', () => { fuel.reset(); renderFuel(); toast('Histórico zerado'); });
  function renderFuel() {
    const a = fuel.avgKmL(), rf = fuel.rangeFull(), rl = fuel.rangeLeft(geo.odoKm);
    $('fuelAvg').textContent = a ? a.toFixed(1).replace('.', ',') : '—';
    $('fuelRange').textContent = rf ? Math.round(rf) : '—';
    $('fuelLeft').textContent = rl != null ? Math.round(rl) : '—';
    $('fuelHist').innerHTML = fuel.log.length ? fuel.log.slice().reverse().map((e, i, arr) => {
      const idx = fuel.log.length - i;
      return `<div><span>#${idx} · ${e.liters} L</span><span>odô ${e.odo.toFixed(1)} km</span></div>`;
    }).join('') : '<div style="border:0">Sem abastecimentos ainda.</div>';
  }

  // ---------- veículo ----------
  function renderVehicle() {
    const vehs = OFF.getVehicles(), sel = OFF.selectedVeh();
    $('vsel').innerHTML = Object.keys(vehs).map(k => `<button data-v="${k}" class="${k === sel ? 'on' : ''}">${esc(vehs[k].nome)}</button>`).join('');
    [...$('vsel').children].forEach(b => b.addEventListener('click', () => { OFF.selectVeh(b.dataset.v); renderVehicle(); }));
    const v = vehs[sel], editing = v.editavel;
    $('vgrid').innerHTML = OFF.specMeta.map(m => {
      const val = v[m.key]; const has = val !== '' && val != null;
      const valHtml = editing
        ? `<input class="cinput vedit" data-k="${m.key}" type="number" inputmode="numeric" value="${has ? val : ''}" placeholder="—"> ${m.un}`
        : `<span class="val ${m.aviso ? 'warn' : ''}">${has ? val + ' ' + m.un : '—'}</span>`;
      return `<div class="vcard"><div class="dia">${OFF.diagrams[m.dia]()}</div>
        <div class="nm"><span>${m.nome}</span>${editing ? '' : valHtml}</div>
        ${editing ? '<div class="nm" style="margin-top:6px">' + valHtml + '</div>' : ''}
        <div class="exp">${m.exp}</div></div>`;
    }).join('');
    if (editing) [...document.querySelectorAll('.vedit')].forEach(inp => inp.addEventListener('change', () => {
      const obj = { nome: v.nome }; document.querySelectorAll('.vedit').forEach(x => obj[x.dataset.k] = x.value === '' ? '' : +x.value);
      OFF.saveMeu(obj); toast('Meu veículo salvo');
    }));
    // peças
    const done = U.load('pecas_done', {});
    $('pecas').innerHTML = OFF.pecas.map((p, i) => `<li class="${done[i] ? 'done' : ''}"><input type="checkbox" data-i="${i}" ${done[i] ? 'checked' : ''}><span>${esc(p)}</span></li>`).join('');
    [...document.querySelectorAll('#pecas input')].forEach(c => c.addEventListener('change', () => {
      const d = U.load('pecas_done', {}); d[c.dataset.i] = c.checked; U.save('pecas_done', d); c.closest('li').classList.toggle('done', c.checked);
    }));
    // manutenção & fluidos (editável, offline)
    const man = OFF.getManut(sel);
    $('manut').innerHTML = OFF.manutMeta.map(m => `<div class="mrow"><span class="mk">${esc(m.nome)}</span><input class="cinput medit" data-k="${m.key}" value="${esc(man[m.key] || '')}" placeholder="— toque para preencher"></div>`).join('');
    [...document.querySelectorAll('.medit')].forEach(inp => inp.addEventListener('change', () => {
      const o = {}; document.querySelectorAll('.medit').forEach(x => o[x.dataset.k] = x.value); OFF.saveManut(sel, o); toast('Manutenção salva');
    }));
    // fóruns & peças (busca — sempre válida, abre com internet)
    const nm = encodeURIComponent(v.nome.replace(/\(.*\)/, '').trim());
    $('forums').innerHTML = [
      ['🔧 Fórum & manutenção', `https://www.google.com/search?q=${nm}+f%C3%B3rum+manuten%C3%A7%C3%A3o`],
      ['🔎 Códigos de filtro', `https://www.google.com/search?q=${nm}+c%C3%B3digo+filtro+%C3%B3leo+ar+combust%C3%ADvel+cabine`],
      ['🛒 Peças', `https://www.google.com/search?q=pe%C3%A7as+${nm}`],
    ].map(([t, u]) => `<a class="act" href="${u}" target="_blank" rel="noopener">${t}</a>`).join('');
    // energia & recarga (por veículo)
    const en = OFF.getEnergy(sel);
    $('energyTipo').value = en.tipo;
    $('energyPlug').innerHTML = '<option value="">—</option>' + OFF.plugs.map(p => `<option value="${p.id}">${p.t}</option>`).join('');
    $('energyPlug').value = en.plug || '';
    $('ocmKey').value = OFF.getOcmKey();
    $('ocmKey').onchange = () => { OFF.saveOcmKey($('ocmKey').value.trim()); toast('Chave salva'); };
    const combust = en.tipo === 'combustao';
    $('plugWrap').hidden = combust; $('ocmWrap').hidden = combust;
    const saveEnergy = () => { const o = { tipo: $('energyTipo').value, plug: $('energyPlug').value }; OFF.saveEnergy(sel, o); const c = o.tipo === 'combustao'; $('plugWrap').hidden = c; $('ocmWrap').hidden = c; };
    $('energyTipo').onchange = saveEnergy; $('energyPlug').onchange = saveEnergy;
  }

  // ---------- clima + cidade (internet, com cache) ----------
  let lastWxTs = 0, lastPlaceTs = 0, lastWeather = U.load('weather', null);
  function refreshWeather() { if (geo.lat == null || !U.online()) { lastWeather = U.load('weather', null); ui.setWeather(lastWeather); return; } S.weather(geo.lat, geo.lon).then(w => { lastWeather = w; ui.setWeather(w); }); lastWxTs = Date.now(); }
  function maybeServices() {
    if (geo.lat == null) return;
    const now = Date.now();
    if (now - lastWxTs > 15 * 60000) refreshWeather();
    if (U.online() && now - lastPlaceTs > 5 * 60000) { lastPlaceTs = now; S.place(geo.lat, geo.lon).then(p => { if (p) { lastPlace = p; } }); }
  }

  // ---------- loop principal ----------
  let firstFix = false;
  geo.on(g => { ui.update(g, lastPlace); if (!firstFix && g.lat != null) { firstFix = true; refreshWeather(); if (U.online()) S.place(g.lat, g.lon).then(p => { if (p) { lastPlace = p; fillPlace(p); } }); } });

  function estrada() {
    $('eSpd').textContent = geo.lat == null ? '—' : Math.round(geo.speed);
    $('eHdg').textContent = geo.heading == null ? 'parado' : Math.round(geo.heading) + '° ' + U.cardeal(geo.heading);
    $('eAvg').textContent = Math.round(geo.avgSpeed());
    $('eCity').textContent = (lastPlace && lastPlace.city) || '—';
    $('eCoord').textContent = geo.lat == null ? '—' : geo.lat.toFixed(5) + ', ' + geo.lon.toFixed(5);
    $('eOdo').textContent = geo.odoKm.toFixed(0);
    const rl = fuel.rangeLeft(geo.odoKm), rf = fuel.rangeFull();
    $('eRange').textContent = rl != null ? Math.round(rl) : (rf ? Math.round(rf) : '—');
    const en = OFF.getEnergy(OFF.selectedVeh()), pl = OFF.plugs.find(p => p.id === en.plug);
    $('myPlug').textContent = en.tipo === 'combustao' ? 'combustão' : (pl ? pl.t : 'defina em Veículo');
  }

  const isActive = name => { const s = document.querySelector('.screen[data-screen="' + name + '"]'); return s && s.classList.contains('active'); };
  let acc = 0, last = performance.now();
  function loop(now) {
    try {
      const dt = now - last; last = now;
      ui.tickSmooth(geo); ui.tickAmbient();
      acc += dt;
      if (acc > 500) { acc = 0; estrada(); maybeServices(); if (isActive('consumo')) renderFuel(); }
    } catch (_) { /* nunca deixa o loop morrer */ }
    finally { requestAnimationFrame(loop); }
  }

  // ---------- assistente de voz ----------
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const cardealFala = c => ({ N: 'norte', NE: 'nordeste', L: 'leste', SE: 'sudeste', S: 'sul', SO: 'sudoeste', O: 'oeste', NO: 'noroeste' }[c] || c);
  function sunPhrase() {
    if (geo.lat == null) return 'Ainda sem GPS para calcular o sol.';
    const t = U.sunTimes(new Date(), geo.lat, geo.lon), now = new Date();
    if (now > t.sunset) return 'Já anoiteceu. O sol nasce às ' + U.fmtClock(t.sunrise) + '.';
    if (now < t.sunrise) return 'O sol nasce às ' + U.fmtClock(t.sunrise) + '.';
    return 'Faltam ' + U.fmtDur(t.sunset - now) + ' de luz. O sol se põe às ' + U.fmtClock(t.sunset) + '.';
  }
  function wpPhrase(name) {
    const wp = geo.waypoints[name];
    if (!wp) return 'Você ainda não marcou o ' + name.toLowerCase() + '. Marque na tela Painel.';
    if (geo.lat == null) return 'Sem GPS agora.';
    const here = { lat: geo.lat, lon: geo.lon }, d = U.haversine(here, wp), b = U.bearing(here, wp);
    return 'O ' + name.toLowerCase() + ' está a ' + U.fmtKm(d) + ' quilômetros, para ' + cardealFala(U.cardeal(b)) + '.';
  }
  function voiceAnswer(text) {
    const t = norm(text), has = (...w) => w.some(x => t.includes(x)), g = geo;
    if (has('resumo', 'status', 'como estamos', 'me atualiza')) {
      const p = [];
      if (lastPlace && lastPlace.city && lastPlace.city !== '—') p.push('Você está em ' + lastPlace.city + '.');
      if (g.lat != null) p.push('Velocidade ' + Math.round(g.speed) + ' quilômetros por hora.');
      if (g.trip.dist > 0) p.push('Rodou ' + g.trip.dist.toFixed(1).replace('.', ',') + ' quilômetros na aventura.');
      const rl = fuel.rangeLeft(g.odoKm); if (rl != null) p.push('Autonomia cerca de ' + Math.round(rl) + ' quilômetros.');
      p.push(sunPhrase());
      return p.join(' ') || 'Ainda estou buscando o GPS.';
    }
    if (has('recarga', 'carregar', 'bateria', 'eletric', 'posto de recarga')) { openChargers(); return 'Procurando pontos de recarga perto de você.'; }
    if (has('combustivel', 'consumo', 'gasolina', 'gastando', 'gasto', 'media de')) {
      const a = fuel.avgKmL(), rl = fuel.rangeLeft(g.odoKm);
      if (!a) return 'Ainda não tenho o consumo. Registre dois abastecimentos completos na tela Consumo.';
      return 'Consumo médio ' + a.toFixed(1).replace('.', ',') + ' quilômetros por litro.' + (rl != null ? ' Restam cerca de ' + Math.round(rl) + ' quilômetros.' : '');
    }
    if (has('hotel')) return wpPhrase('Hotel');
    if (has('acampamento')) return wpPhrase('Acampamento');
    if (has('carro')) return wpPhrase('Carro');
    if (has('inicio', 'voltar', 'comeco', 'ponto inicial', 'de volta')) return wpPhrase(g.active || 'Início');
    if (has('onde estou', 'onde eu estou', 'minha localizacao', 'que lugar', 'cidade')) {
      if (g.lat == null) return 'Ainda sem GPS.';
      const c = lastPlace && lastPlace.city && lastPlace.city !== '—' ? ('Você está em ' + lastPlace.city + '. ') : '';
      return c + 'Coordenada ' + g.lat.toFixed(4) + ', ' + g.lon.toFixed(4) + '.';
    }
    if (has('luz', 'sol ', 'escurece', 'anoitece', 'do dia')) return sunPhrase();
    if (has('altitude', 'altimetro', 'altura')) return g.alt != null ? 'Altitude ' + Math.round(g.alt) + ' metros.' : 'Sem altitude do GPS ainda.';
    if (has('velocidade', 'quao rapido', 'que velocidade')) return g.lat == null ? 'Sem GPS.' : 'Velocidade ' + Math.round(g.speed) + ' quilômetros por hora.';
    if (has('clima', 'tempo', 'chuva', 'temperatura', 'graus')) { const w = lastWeather; return w ? (w.desc + ', ' + w.temp + ' graus' + (w.rainProb != null ? ', chance de chuva ' + w.rainProb + ' por cento' : '') + '.') : 'Sem dados de clima agora.'; }
    if (has('rodei', 'distancia', 'aventura', 'trajeto')) return g.trip.dist > 0 ? 'Você rodou ' + g.trip.dist.toFixed(1).replace('.', ',') + ' quilômetros, em ' + Math.round(g.trip.moveSec / 60) + ' minutos.' : 'A aventura ainda não começou. Toque em Ligar no odômetro.';
    return 'Posso dizer: consumo, quanto você rodou, luz do dia, onde você está, voltar ao hotel, ao carro ou ao início, clima e recarga.';
  }

  // ---------- boot ----------
  ui.buildStatic();
  if (SIM) { $('simBadge').hidden = false; geo.startSim(); } else geo.startReal();
  requestAnimationFrame(loop);
  runSplash();
  firstRunCar();
  OFF.voice.init(voiceAnswer);

  // relógio nada, mas mantém serviços vivos
  setInterval(maybeServices, 60000);

  /* ================= ABERTURA (vídeo do jipinho Lego — 7 s) ================= */
  function runSplash() {
    const splash = $('splash'), skip = $('skip'); if (!splash) return;
    if (params.has('nosplash')) { splash.remove(); skip.remove(); return; }
    const v = $('introvid'); let done = false;
    function finish() { if (done) return; done = true; try { v && v.pause(); } catch (_) {} splash.classList.add('hide'); skip.style.display = 'none'; setTimeout(() => { splash.remove(); skip.remove(); }, 550); }
    skip.addEventListener('click', finish);
    splash.addEventListener('click', () => { if (v && v.paused) { v.play().catch(() => {}); } });   // toque tenta (re)iniciar
    if (v) {
      v.addEventListener('timeupdate', () => { if (v.currentTime >= 7) finish(); });                 // usa só os 7 primeiros segundos
      v.addEventListener('ended', finish);
      v.addEventListener('error', () => setTimeout(finish, 300));
      const p = v.play(); if (p && p.catch) p.catch(() => {});                                        // autoplay mudo
    }
    setTimeout(finish, 8000); // trava de segurança
  }
})(window.OFF);
