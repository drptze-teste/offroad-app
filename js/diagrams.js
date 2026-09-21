/* diagrams.js — diagramas educativos em SVG (offline) para cada spec off-road. */
window.OFF = window.OFF || {};
(function (OFF) {
  'use strict';
  const wrap = inner => `<svg viewBox="0 0 240 150" width="100%" preserveAspectRatio="xMidYMid meet" role="img">${inner}</svg>`;
  const car = `<rect x="-30" y="-13" width="60" height="15" rx="5" fill="#182430" stroke="#ff8a3d" stroke-width="2"/>
    <rect x="-17" y="-22" width="30" height="11" rx="3" fill="#182430" stroke="#ff8a3d" stroke-width="2"/>
    <rect x="-13" y="-20" width="21" height="8" rx="2" fill="#0c141c"/>
    <circle cx="-19" cy="4" r="7.5" fill="#0b0f14" stroke="#ffb45c" stroke-width="2"/>
    <circle cx="19" cy="4" r="7.5" fill="#0b0f14" stroke="#ffb45c" stroke-width="2"/>`;
  const D2R = Math.PI / 180;
  // arco no vértice (cx,cy) do ângulo a1..a2 (graus acima da horizontal), y p/ baixo
  function arc(cx, cy, r, a1, a2) {
    const p = a => [cx + r * Math.cos(a * D2R), cy - r * Math.sin(a * D2R)];
    const [x1, y1] = p(a1), [x2, y2] = p(a2);
    return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 0 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="#ffd23f" stroke-width="2"/>`;
  }
  const lbl = (x, y, t, c) => `<text x="${x}" y="${y}" fill="${c || '#eaf1f6'}" font-family="Rajdhani,sans-serif" font-weight="700" font-size="15" text-anchor="middle">${t}</text>`;
  const ground = (x1, x2, y) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#3a4a58" stroke-width="2"/>`;

  const D = OFF.diagrams = {};

  D.ataque = () => wrap(`${ground(8, 150, 120)}
    <line x1="150" y1="120" x2="228" y2="66" stroke="#ff8a3d" stroke-width="3"/>
    ${arc(150, 120, 34, 0, 35)} ${lbl(196, 112, 'ângulo')}
    <g transform="translate(78,108.5)">${car}</g>`);

  D.saida = () => wrap(`${ground(90, 232, 120)}
    <line x1="90" y1="120" x2="12" y2="66" stroke="#ff8a3d" stroke-width="3"/>
    ${arc(90, 120, 34, 145, 180)} ${lbl(46, 112, 'ângulo')}
    <g transform="translate(162,108.5) scale(-1,1)">${car}</g>`);

  D.rampa = () => wrap(`${ground(8, 90, 128)} ${ground(150, 232, 128)}
    <path d="M90 128 L120 86 L150 128" fill="none" stroke="#ff8a3d" stroke-width="3"/>
    ${arc(120, 90, 26, 200, 340)} ${lbl(120, 74, 'barriga')}
    <g transform="translate(120,80) rotate(0)">${car}</g>`);

  D.solo = () => wrap(`${ground(8, 232, 128)}
    <g transform="translate(120,112.5)">${car}</g>
    <line x1="150" y1="114" x2="150" y2="128" stroke="#3ddc84" stroke-width="2"/>
    <path d="M150 114 l-3 4 M150 114 l3 4 M150 128 l-3 -4 M150 128 l3 -4" stroke="#3ddc84" stroke-width="2" fill="none"/>
    ${lbl(180, 124, 'altura', '#3ddc84')}`);

  D.vadeacao = () => wrap(`${ground(8, 232, 128)}
    <rect x="70" y="104" width="162" height="24" fill="rgba(90,169,230,.35)"/>
    <line x1="70" y1="104" x2="232" y2="104" stroke="#5aa9e6" stroke-width="2"/>
    <g transform="translate(120,112.5)">${car}</g>
    <line x1="158" y1="104" x2="158" y2="128" stroke="#5aa9e6" stroke-width="2"/>
    ${lbl(196, 100, 'profundidade', '#5aa9e6')}`);

  D.inclinacao = () => wrap(`<line x1="8" y1="132" x2="232" y2="92" stroke="#3a4a58" stroke-width="2"/>
    <g transform="translate(120,104) rotate(-10)">${car}</g>
    ${arc(120, 118, 40, 0, 10)} ${lbl(120, 138, 'inclinação lateral', '#ffd23f')}`);

  D.guincho = () => wrap(`${ground(8, 232, 122)}
    <g transform="translate(150,110.5)">${car}</g>
    <rect x="26" y="86" width="8" height="36" rx="2" fill="#2f6470"/>
    <circle cx="30" cy="80" r="12" fill="#14232b" stroke="#2f6470" stroke-width="2"/>
    <line x1="42" y1="104" x2="121" y2="104" stroke="#ffb45c" stroke-width="2" stroke-dasharray="4 4"/>
    <path d="M52 100 l-8 4 l8 4" fill="none" stroke="#ff8a3d" stroke-width="2"/>
    ${lbl(150, 138, 'força de tração', '#ffb45c')}`);
})(window.OFF);
