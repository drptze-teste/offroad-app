# Off-road App (central multimídia ADAK Android 13)

> Projeto NOVO e independente. Não misturar com NR-1, estúdio, CRM ou blogs.

## Objetivo
PWA para a central multimídia do carro (ADAK, Android 13, Chrome): três relógios
off-road — inclinômetro (pitch/roll), altímetro e bússola/GPS. Layout paisagem,
tela sempre ligada, instalável pela opção "Adicionar à tela inicial".

## Estado atual (04/set/2026)
- **Fase 1 — página de teste de sensores** (`index.html`): detecta o que a central tem
  (orientação, acelerômetro, magnetômetro, GPS/altitude, Generic Sensor API, Wake Lock).
  O usuário abre na central, toca em "Iniciar teste" e fotografa a tela.
- Fase 2 (depende do resultado): desenhar os três relógios. Mostrar prévia HTML antes de codar.

## Stack
HTML + CSS + JS puro, sem build. `manifest.json` + `sw.js` (cache offline). Precisa de HTTPS
para GPS e sensores (localhost também vale).

## Hospedagem
_(ainda não definida — GitHub Pages em repo próprio `drptze-teste/offroad-app` ou Firebase Hosting em projeto próprio)_

## Servir localmente
```bash
npx --yes serve -l 5173 .
```

## Prévia do design
- `preview.html` — maquete animada dos três relógios (dados simulados). Ver em https://drptze-teste.github.io/offroad-app/preview.html

## Resultado do teste de sensores (10/set/2026)
A central ADAK **só tem GPS** — sem acelerômetro e sem magnetômetro. Logo o **inclinômetro do carro saiu de vez**.

## Pivô: Painel de Expedição (GPS + internet)
`preview.html` v6 agora é um painel de expedição com:
- Altímetro (GPS + relevo) e **inclinação do terreno em %** estimada por altitude÷distância (não é a inclinação do carro; só em movimento).
- Bússola de rumo (GPS, em movimento) + **waypoints** "voltar para" (carro/acampamento/início) com seta e distância.
- **Sol e luz do dia** (nascer/pôr/luz restante) via biblioteca SunCalc.
- Velocímetro, odômetro "Tamanho da aventura" (ligar/pausar/zerar), clima reativo (Open-Meteo).
- **Coordenadas** decimal/GMS/Plus Code + compartilhar/copiar.
- **Registro de rota (track)** com mini-mapa e exportar GPX (download só no app instalado).
- **SOS**: abrir Google Maps da central em "oficina mecânica"/"guincho" perto (filtro aberto agora + telefone nativos do Maps); **"Onde estou"** (cidade via geocodificação reversa + coordenada); **contato de confiança** salvo em localStorage + "Pedir resgate" via link wa.me (usuário confirma o envio).

Pendências para o app real: geocodificação reversa da cidade (grátis, ex. BigDataCloud/Nominatim); decidir lista de oficinas "abertas agora" dentro do app (Google Places = pago) vs. abrir o Google Maps (grátis, recomendado).

## Prévia v9 — duas telas deslizáveis + abertura Willys
- `preview.html` agora tem **duas telas que trocam arrastando** (scroll-snap horizontal) com abas "Aventura" / "Deu Ruim":
  - **Aventura:** altímetro, bússola, sol/luz, velocímetro + mapa e trajeto (odômetro/track/waypoints).
  - **Deu Ruim:** SOS — DEU RUIM (oficinas/guincho → lista de telefones com Ligar), "Onde estou" (cidade/distrito/bairro), coordenadas para resgate e contato de confiança.
- Abertura: jipe agora é um **Willys conversível** (cockpit aberto, para-brisa em pé, estepe) e o **pneu do logo ficou mais robusto** (banda grossa + garras alternadas).

## APP REAL v1 (21/set/2026) — webapp instalável, offline-first
Raiz `index.html` agora é o APP (a página de teste virou `teste-sensores.html`; `preview.html` = referência de design). Stack: HTML+CSS+JS puro, sem framework/sem build. Namespace global `OFF`.
- Módulos em `js/`: `util` (formatos, coordenadas GMS/PlusCode, SunCalc inline p/ offline, haversine/bearing, load/save), `geo` (GPS real + modo `#sim`/`?sim=1`; odômetro trip + odoKm total, track, inclinação do terreno EMA, waypoints — tudo persistido), `services` (clima Open-Meteo, cidade BigDataCloud, oficinas/guincho Overpass/OSM — grátis, com cache e timeout), `fuel` (média km/L método tanque-cheio + autonomia), `vehicles` (specs aprox. por modelo + peças), `diagrams` (SVG educativos), `ui` (desenho dos relógios/bússola/sol/mini-mapa/clima), `app` (navegação, loop, fiação, abertura).
- **5 telas** (nav inferior): Painel, Estrada, Consumo, Veículo, Socorro. Responsivo 7"→multimídias grandes (Tank 300 / Jetour T3 / Land Rover).
- **PWA:** `manifest.webmanifest` (fullscreen/landscape), `sw.js` (cache-first do shell → offline; APIs passam pela rede). Instalável por "Adicionar à tela inicial". Wake Lock mantém a tela.
- **Abertura:** vídeo do usuário `assets/intro.mp4` (Lego "Mundo dos Tijolos"), usa os 7 primeiros segundos (para em 7s por código) + botão Pular + trava 8s.
- Verificado no modo `#sim` (o proxy do navegador remove `?query`, use hash): 5 telas OK, clima/cidade/oficinas reais responderam.
- Pendências: PNGs de ícone (hoje SVG serve para Chrome Android); specs Jetour T3 conferir; bairro em zona rural vem como região IBGE (em cidade vem o bairro real).

## v1.1 (21/set/2026) — carro do usuário, manutenção, Spotify, correções da revisão
- Carro do usuário: **Mitsubishi Pajero GLS-B 1999 (3p)** como preset e selecionado por padrão (specs aprox., editáveis).
- **Escolha do carro na 1ª abertura** (modal #carback; flag `off_seen`).
- Tela Veículo: **ficha de Manutenção & fluidos editável offline** (óleo/câmbio/transfer/freio/radiador + códigos de filtro em branco p/ preencher) + **Fóruns & peças** (links de busca Google gerados do nome do modelo). Códigos de peça NÃO são inventados (sem API confiável grátis) — usuário preenche/consulta fórum.
- Tela Estrada: **Som · Spotify** — Abrir Spotify + playlists salvas offline (localStorage). "Mais tocadas" automático e "tocar no player" = fase 2 (precisa OAuth/Premium, online).
- Correções da revisão por subagente: SW cacheia item a item (`Promise.allSettled`, o vídeo de 4,77MB não derruba o offline); `loop()` com try/finally (um erro nunca congela o rAF); removido código morto `$('consumo')`; DMS trata carry de 60"; `recStart` usa `!= null`.

## v1.2 (25/set/2026) — voz + elétrico
- **Assistente por voz** (`js/voice.js` + `voiceAnswer` no app.js): botão 🎙️ flutuante. Fala as respostas (TTS offline); ouvir usa Web Speech (precisa de internet na maioria dos navegadores). Intenções por palavra-chave (offline, dos dados): resumo/status, consumo+autonomia, quanto rodei, luz do dia, onde estou (cidade), voltar ao hotel/carro/início (dist+direção falada), altitude, velocidade, clima, recarga. Balão #voicebubble mostra o texto.
- **Waypoint Hotel** no Painel (marcar hotel e voltar a ele).
- **Elétrico:** por veículo, Tipo (combustão/híbrido/elétrico) + Plug (Type2/CCS2/CHAdeMO/GB-T/Tesla) na tela Veículo. Botão "Postos de recarga perto" (Estrada + comando de voz) via **Open Charge Map** — que agora **EXIGE chave** (grátis em openchargemap.org): campo `#ocmKey` salvo offline. Sem chave, cai no **Google Maps** (sem cadastro). Destaca ✅ quando o plug do posto bate com o seu.
- SW cache v4 (inclui voice.js).
- **Sobre CarPlay/Android Auto:** decidido ficar no PWA + voz por ora; CarPlay/Android Auto só rodam apps nativos em categorias fechadas (não dá para pôr esse painel lá) — fica como fase futura (app nativo).
