/* vehicles.js — specs off-road por modelo (valores APROXIMADOS do fabricante; confirmar no manual) + peças básicas.
   Tudo offline. O usuário edita "Meu veículo". */
window.OFF = window.OFF || {};
(function (OFF) {
  'use strict';
  const U = OFF.util;

  // rótulos, unidades e qual diagrama ilustra cada spec
  OFF.specMeta = [
    { key: 'ataque',     nome: 'Ângulo de ataque',      un: '°',  dia: 'ataque',
      exp: 'Maior rampa que a FRENTE consegue subir sem a dianteira raspar. Quanto maior, melhor para atacar obstáculos.' },
    { key: 'saida',      nome: 'Ângulo de saída',       un: '°',  dia: 'saida',
      exp: 'Maior rampa que a TRASEIRA vence sem o para-choque de trás bater ao descer/sair do obstáculo.' },
    { key: 'rampa',      nome: 'Ângulo de rampa',       un: '°',  dia: 'rampa',
      exp: 'Lombada/crista máxima que dá para passar sem encostar a BARRIGA do carro no chão.' },
    { key: 'solo',       nome: 'Altura do solo',        un: 'mm', dia: 'solo',
      exp: 'Vão livre entre o ponto mais baixo do carro e o chão. Define o tamanho da pedra/buraco que passa por baixo.' },
    { key: 'vadeacao',   nome: 'Vadeação (água)',       un: 'mm', dia: 'vadeacao', aviso: true,
      exp: 'Profundidade MÁXIMA de água que dá para atravessar devagar. Passar disso entra água no motor — dano grave.' },
    { key: 'inclinacao', nome: 'Inclinação lateral máx',un: '°',  dia: 'inclinacao', aviso: true,
      exp: 'Ângulo lateral máximo antes do risco de capotar. Regra de ouro: na dúvida, encare a ladeira de frente, não de lado.' },
    { key: 'guincho',    nome: 'Guincho (tração máx)',  un: 'kg', dia: 'guincho',
      exp: 'Peso máximo que o guincho puxa. Ideal: pelo menos 1,5× o peso do seu carro carregado.' },
  ];

  // valores aproximados — SEMPRE conferir no manual. '' = preencher em Meu veículo.
  OFF.vehicles = {
    meu:      { nome: 'Meu veículo', editavel: true, ataque: '', saida: '', rampa: '', solo: '', vadeacao: '', inclinacao: '', guincho: '' },
    tank300:  { nome: 'GWM Tank 300', ataque: 33, saida: 34, rampa: 23, solo: 224, vadeacao: 700, inclinacao: '', guincho: '' },
    defender: { nome: 'Land Rover Defender', ataque: 38, saida: 40, rampa: 28, solo: 291, vadeacao: 900, inclinacao: 45, guincho: '' },
    jetourt3: { nome: 'Jetour T3', ataque: 37, saida: 35, rampa: 24, solo: 220, vadeacao: 600, inclinacao: '', guincho: '', aprox: true },
  };

  // peças de reposição / kit básico de trilha (genérico, seguro para qualquer 4x4)
  OFF.pecas = [
    'Estepe cheio + macaco + chave de roda',
    'Kit tapa-furo (macarrão) + bomba de ar 12V',
    'Cabo/cinta de reboque (acima do peso do carro)',
    'Manilhas (grilhões) e uma pá',
    'Cabo de chupeta (bateria auxiliar)',
    'Fusíveis reserva + lâmpadas do farol/lanterna',
    'Correia auxiliar (poly-V) do motor',
    'Filtro de ar sobressalente',
    'Óleo do motor (1 L) + fluido de freio',
    'Água/aditivo do radiador + mangueira reserva',
    'Abraçadeiras, arame, fita alta fusão e enforca-gato',
    'Lanterna + pilhas + primeiros socorros',
  ];

  // veículo escolhido + edições do "meu"
  OFF.getVehicles = () => {
    const custom = U.load('veh_meu', null);
    if (custom) OFF.vehicles.meu = Object.assign({ nome: 'Meu veículo', editavel: true }, custom, { editavel: true });
    return OFF.vehicles;
  };
  OFF.saveMeu = obj => U.save('veh_meu', Object.assign({ nome: obj.nome || 'Meu veículo' }, obj));
  OFF.selectedVeh = () => U.load('veh_sel', 'meu');
  OFF.selectVeh = k => U.save('veh_sel', k);
})(window.OFF);
