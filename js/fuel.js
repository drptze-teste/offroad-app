/* fuel.js — média de consumo (método tanque-cheio) + autonomia. Offline, localStorage. */
window.OFF = window.OFF || {};
(function (OFF) {
  'use strict';
  const U = OFF.util;

  const fuel = OFF.fuel = {
    tank: U.load('fuel_tank', 60),      // litros
    log: U.load('fuel_log', []),        // [{odo, liters, ts}] odo = geo.odoKm no abastecimento
  };

  fuel.setTank = L => { fuel.tank = Math.max(1, +L || 0); U.save('fuel_tank', fuel.tank); };

  // registra abastecimento: 'liters' abastecidos agora, com o odômetro atual do GPS
  fuel.addFill = (liters, odoKm) => {
    liters = +liters; if (!(liters > 0)) return false;
    fuel.log.push({ odo: odoKm, liters, ts: Date.now() });
    if (fuel.log.length > 60) fuel.log.shift();
    U.save('fuel_log', fuel.log); return true;
  };
  fuel.undo = () => { fuel.log.pop(); U.save('fuel_log', fuel.log); };
  fuel.reset = () => { fuel.log = []; U.save('fuel_log', fuel.log); };

  // média km/L pelo método tanque-cheio: distância entre abastecimentos ÷ litros do 2º
  fuel.avgKmL = () => {
    if (fuel.log.length < 2) return null;
    let dist = 0, lit = 0;
    for (let i = 1; i < fuel.log.length; i++) {
      const d = fuel.log[i].odo - fuel.log[i - 1].odo;
      if (d > 0) { dist += d; lit += fuel.log[i].liters; }
    }
    return lit > 0 ? dist / lit : null;
  };

  fuel.lastOdo = () => fuel.log.length ? fuel.log[fuel.log.length - 1].odo : null;
  fuel.rangeFull = () => { const a = fuel.avgKmL(); return a ? fuel.tank * a : null; };   // km com tanque cheio
  fuel.rangeLeft = odoNow => {                                                            // km restantes (estima cheio no último abastn.)
    const a = fuel.avgKmL(), last = fuel.lastOdo();
    if (a == null || last == null) return null;
    return Math.max(0, fuel.tank * a - (odoNow - last));
  };
})(window.OFF);
