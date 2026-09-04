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
