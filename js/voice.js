/* voice.js — botão de voz: ouve (Web Speech, precisa de internet na maioria) e FALA a resposta (offline). */
window.OFF = window.OFF || {};
(function (OFF) {
  'use strict';
  const V = OFF.voice = {};
  const $ = id => document.getElementById(id);

  V.speak = t => { try { if (!('speechSynthesis' in window)) return; const u = new SpeechSynthesisUtterance(t); u.lang = 'pt-BR'; u.rate = 1.03; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (_) {} };

  function bubble(t) { const b = $('voicebubble'); if (!b) return; b.textContent = t; b.classList.add('show'); clearTimeout(bubble._t); bubble._t = setTimeout(() => b.classList.remove('show'), 8000); }
  V.show = bubble;

  // answerFn(texto) -> string (resposta pronta para falar e mostrar)
  V.init = function (answerFn) {
    const btn = $('micbtn'); if (!btn) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let busy = false;
    btn.addEventListener('click', () => {
      if (busy) return;
      if (!SR) { const a = answerFn('resumo'); bubble(a); V.speak(a); return; }   // sem reconhecimento: fala o resumo
      const r = new SR(); r.lang = 'pt-BR'; r.interimResults = false; r.maxAlternatives = 1;
      busy = true; btn.classList.add('listening'); bubble('Ouvindo… fale o comando');
      r.onresult = e => { const t = e.results[0][0].transcript; bubble('“' + t + '”'); const a = answerFn(t); setTimeout(() => { bubble(a); V.speak(a); }, 200); };
      r.onerror = e => { bubble(e.error === 'not-allowed' ? 'Libere o microfone para usar a voz.' : (e.error === 'no-speech' ? 'Não ouvi nada. Toque e fale de novo.' : 'Sem internet para ouvir. Toque de novo para o resumo falado.')); if (e.error === 'network') { const a = answerFn('resumo'); setTimeout(() => { bubble(a); V.speak(a); }, 400); } };
      r.onend = () => { busy = false; btn.classList.remove('listening'); };
      try { r.start(); } catch (_) { busy = false; btn.classList.remove('listening'); }
    });
  };
})(window.OFF);
