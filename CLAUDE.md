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
