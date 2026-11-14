// CatUp Mini App v2 - improved fidelity + animations
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  try { tg.setHeaderColor('#0a0a0c'); tg.setBackgroundColor('#0a0a0c'); } catch(e){}
}

// Unlock audio on first user gesture (required by browsers)
document.addEventListener('click', function unlockAudio() {
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  document.removeEventListener('click', unlockAudio);
}, { once: true });
document.addEventListener('touchstart', function unlockAudioTouch() {
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  document.removeEventListener('touchstart', unlockAudioTouch);
}, { once: true });

// ========== ANTI-BOT ==========
function isRealUser() {
  // Allow in browser for testing, block obvious bots in Telegram
  if (!tg) return true; // local testing
  if (!tg.initData || tg.initData.length < 10) return false;
  const u = tg.initDataUnsafe?.user;
  if (!u || !u.id) return false;
  if (u.is_bot === true) return false;
  return true;
}


// ========== SOUND SYSTEM (Web Audio) ==========
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let engineOsc = null;
let engineGain = null;
let engineFilter = null;
let meowTimeout = null;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new AudioCtx();
}

function startEngineSound() {
  initAudio();
  if (engineOsc) return;

  engineOsc = audioCtx.createOscillator();
  engineGain = audioCtx.createGain();
  engineFilter = audioCtx.createBiquadFilter();

  engineOsc.type = 'sawtooth';
  engineOsc.frequency.value = 55;          // low idle
  engineFilter.type = 'lowpass';
  engineFilter.frequency.value = 400;
  engineGain.gain.value = 0.0001;

  engineOsc.connect(engineFilter);
  engineFilter.connect(engineGain);
  engineGain.connect(audioCtx.destination);

  engineOsc.start();
  // fade in
  engineGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.3);
}

function updateEngineSound(mult) {
  if (!engineOsc || !audioCtx) return;
  // pitch rises with multiplier
  const freq = 55 + Math.min(mult * 28, 220);
  engineOsc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.08);
  engineFilter.frequency.setTargetAtTime(350 + mult * 80, audioCtx.currentTime, 0.1);
  // slight volume increase
  const vol = Math.min(0.08 + mult * 0.012, 0.18);
  engineGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.1);
}

function stopEngineSound() {
  if (!engineGain || !audioCtx) return;
  engineGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
  setTimeout(() => {
    if (engineOsc) {
      try { engineOsc.stop(); } catch(e){}
      engineOsc = null;
      engineGain = null;
      engineFilter = null;
    }
  }, 450);
}

function playMeow() {
  initAudio();
  const t = audioCtx.currentTime;

  // simple cat-like meow using two oscillators
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc1.type = 'sine';
  osc2.type = 'triangle';
  filter.type = 'bandpass';
  filter.frequency.value = 900;
  filter.Q.value = 4;

  osc1.frequency.setValueAtTime(800, t);
  osc1.frequency.linearRampToValueAtTime(1200, t + 0.12);
  osc1.frequency.linearRampToValueAtTime(600, t + 0.35);

  osc2.frequency.setValueAtTime(400, t);
  osc2.frequency.linearRampToValueAtTime(700, t + 0.15);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
  gain.gain.linearRampToValueAtTime(0.0001, t + 0.4);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  osc1.start(t);
  osc2.start(t);
  osc1.stop(t + 0.45);
  osc2.stop(t + 0.45);
}

function scheduleRandomMeows() {
  clearTimeout(meowTimeout);
  function nextMeow() {
    if (!state.crashRunning) return;
    playMeow();
    // next meow in 2.5 – 6 seconds
    meowTimeout = setTimeout(nextMeow, 2500 + Math.random() * 3500);
  }
  meowTimeout = setTimeout(nextMeow, 1800 + Math.random() * 2000);
}

function stopMeows() {
  clearTimeout(meowTimeout);
  meowTimeout = null;
}

// ========== STATE ==========
let state = {
  balance: 100,
  xBalance: 0,
  demoMode: false,
  currentCase: null,
  inventory: [],
  stakeItem: null,
  targetItem: null,
  // Crash
  crashRunning: false,
  crashMult: 1.00,
  crashBet: 0,
  crashCashed: false,
  crashInterval: null,
  crashCountdown: false,
  // Mines
  minesSize: 5,
  minesGrid: [],
  minesRevealed: 0,
  minesBet: 0,
  minesActive: false,
  minesMultiplier: 1,
  // Wheel
  wheelPlayers: [],
  wheelBank: 0,
  wheelSpinning: false,
  wheelTimer: null,
  wheelCountdown: 0,
  // Cat
  catRunning: false,
  catMult: 1.00,
  catBet: 0,
  catDiff: 'easy',
  catInterval: null,
  catY: 50,
};

const CASES = {
  secret: {
    name: 'Secret', price: 199, icon: './assets/secret.jpg', limit: true, img: true,
    prizes: [
      { name: 'Chill Flame', icon: './assets/chill-flame.jpg', img: true, value: 500, weight: 15 },
      { name: 'Vice Cream', icon: './assets/vice-cream.jpg', img: true, value: 300, weight: 30 },
      { name: 'Snoop Dog', icon: '🐶', value: 800, weight: 5 },
      { name: '100⭐', icon: '⭐', value: 100, weight: 60 },
      { name: '50⭐', icon: '⭐', value: 50, weight: 65 },
      { name: '5⭐', icon: '⭐', value: 5, weight: 35 },
    ]
  },
  newgift: {
    name: 'New Gift', price: 299, icon: './assets/new-gift.jpg', limit: true, img: true,
    prizes: [
      { name: 'Mad Pumpkin', icon: './assets/mad-pumpkin.jpg', img: true, value: 1200, weight: 3 },
      { name: 'Candy Cane', icon: '🍬', value: 150, weight: 34 },
      { name: 'Lol Pop', icon: './assets/lol-pop.jpg', img: true, value: 120, weight: 28 },
      { name: 'Vice Cream', icon: './assets/vice-cream.jpg', img: true, value: 300, weight: 32 },
      { name: '150⭐', icon: '⭐', value: 150, weight: 65 },
      { name: '100⭐', icon: '⭐', value: 100, weight: 55 },
    ]
  },
  newmask: {
    name: 'New Mask', price: 499, icon: './assets/new-mask.jpg', limit: false, img: true,
    prizes: [
      { name: 'Myth Mask', icon: './assets/myth-mask.jpg', img: true, value: 2000, weight: 5 },
      { name: 'Fresh Socks', icon: '🧦', value: 200, weight: 39 },
      { name: 'Input Key', icon: '🔑', value: 400, weight: 15 },
      { name: 'Candy Cane', icon: '🍬', value: 150, weight: 44 },
      { name: '300⭐', icon: '⭐', value: 300, weight: 69 },
    ]
  },
  nftcase: {
    name: 'NFT Case', price: 149, icon: './assets/nft-case.jpg', limit: false, img: true,
    prizes: [
      { name: 'Star Notepad', icon: '📓', value: 350, weight: 10 },
      { name: 'Witch Hat', icon: './assets/witch-hat.jpg', img: true, value: 280, weight: 11 },
      { name: 'Moon Pendant', icon: './assets/moon-pendant.jpg', img: true, value: 420, weight: 9 },
      { name: '50⭐', icon: '⭐', value: 50, weight: 65 },
      { name: '25⭐', icon: '⭐', value: 25, weight: 70 },
    ]
  },
  meow: {
    name: 'Meow', price: 199, icon: './assets/meow.jpg', limit: false, img: true,
    prizes: [
      { name: 'Scared Cat', icon: './assets/scared-cat.jpg', img: true, value: 50000, weight: 0.000001 },
      { name: 'Ion Gem', icon: './assets/ion-gem.jpg', img: true, value: 10000, weight: 0.000002 },
      { name: '50⭐', icon: '⭐', value: 50, weight: 75 },
      { name: '75⭐', icon: '⭐', value: 75, weight: 67 },
    ]
  },
  watch: {
    name: 'Watch', price: 249, icon: './assets/watch.jpg', limit: false, img: true,
    prizes: [
      { name: 'Swiss Watch', icon: './assets/swiss-watch.jpg', img: true, value: 100000, weight: 0.0000001 },
      { name: 'Kissed Frog', icon: './assets/kissed-frog.jpg', img: true, value: 50000, weight: 0.00000001 },
      { name: 'Big Year', icon: './assets/big-year.jpg', img: true, value: 800, weight: 30 },
      { name: '150⭐', icon: '⭐', value: 150, weight: 55 },
      { name: '100⭐', icon: '⭐', value: 100, weight: 70 },
      { name: '75⭐', icon: '⭐', value: 75, weight: 80 },
    ]
  }
};

// ========== INIT ==========
function init() {
  if (!isRealUser()) {
    document.body.innerHTML = `<div class="bot-block"><h2>🚫 Доступ запрещён</h2><p>Это приложение доступно только реальным пользователям Telegram.<br>Боты и автоматизированные клиенты заблокированы.</p></div>`;
    return;
  }
  loadState();
  renderCases();
  updateBalanceUI();
  showScreen('games');
  if (state.inventory.length === 0) {
    state.inventory = [
      { name: 'Candy Cane', icon: '🍬', value: 150, id: 1 },
      { name: '50⭐', icon: '⭐', value: 50, id: 2 },
    ];
  }
}

function saveState() {
  localStorage.setItem('catup_state', JSON.stringify({
    balance: state.balance,
    xBalance: state.xBalance,
    demoMode: state.demoMode,
    inventory: state.inventory
  }));
}

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem('catup_state'));
    if (s) {
      state.balance = s.balance ?? 100;
      state.xBalance = s.xBalance ?? 0;
      state.demoMode = s.demoMode ?? false;
      state.inventory = s.inventory ?? [];
    }
  } catch(e) {}
}

function updateBalanceUI() {
  const b = Math.floor(state.balance);
  document.getElementById('balanceDisplay').textContent = b;
  document.getElementById('xBalanceDisplay').textContent = Math.floor(state.xBalance);
  document.getElementById('profileBalance').textContent = b;
  document.getElementById('upgradeBalance').textContent = state.balance.toFixed(2);
  document.getElementById('maxBalance').textContent = b;
  const demoBadge = document.getElementById('demoBadge');
  if (demoBadge) demoBadge.style.display = state.demoMode ? 'block' : 'none';
  const demoToggle = document.getElementById('demoToggle');
  if (demoToggle) demoToggle.checked = state.demoMode;
  saveState();
}

// ========== NAV ==========
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) el.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.querySelector(`.nav-item[data-screen="${name}"]`);
  if (nav) nav.classList.add('active');
  else if (['cases','case-open','upgrade','crash','mines','wheel','cat','topup'].includes(name)) {
    document.querySelector('.nav-item[data-screen="games"]')?.classList.add('active');
  }

  if (name === 'cases') renderCases();
  if (name === 'upgrade') updateUpgradeUI();
  if (name === 'mines') renderMinesGrid();
  if (name === 'wheel') { drawWheel(); updateWheelUI(); }
  if (name === 'profile') updateBalanceUI();
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

// ========== CASES ==========
function renderCases() {
  const grid = document.getElementById('casesGrid');
  grid.innerHTML = '';
  Object.entries(CASES).forEach(([key, c]) => {
    const card = document.createElement('div');
    card.className = 'case-card';
    card.onclick = () => openCaseScreen(key);
    const iconHtml = c.img 
      ? `<img src="${c.icon}" alt="${c.name}" class="case-img">`
      : `<div class="icon">${c.icon}</div>`;
    card.innerHTML = `
      ${c.limit ? '<div class="limit">Лимит</div>' : ''}
      ${iconHtml}
      <div class="name">${c.name}</div>
      <div class="price">⭐ ${c.price}</div>
    `;
    grid.appendChild(card);
  });
}

function openCaseScreen(key) {
  state.currentCase = key;
  const c = CASES[key];
  document.getElementById('caseOpenTitle').textContent = c.name;
  document.getElementById('casePrice').textContent = state.demoMode ? '0' : c.price;
  const track = document.getElementById('rouletteTrack');
  track.innerHTML = '';
  track.style.transition = 'none';
  track.style.transform = 'translateX(0)';
  for (let i = 0; i < 40; i++) {
    const p = weightedRandom(c.prizes);
    const item = document.createElement('div');
    item.className = 'roulette-item';
    item.innerHTML = `${prizeIconHtml(p)}<div class="val">⭐${p.value}</div>`;
    track.appendChild(item);
  }
  const live = document.getElementById('liveItems');
  live.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const p = weightedRandom(c.prizes);
    const d = document.createElement('div');
    d.className = 'live-item';
    d.innerHTML = prizeIconHtml(p);
    live.appendChild(d);
  }
  showScreen('case-open');
}


function prizeIconHtml(p) {
  if (p.img || (p.icon && p.icon.startsWith('./assets/'))) {
    return `<img src="${p.icon}" alt="${p.name}" class="prize-img">`;
  }
  return `<span class="prize-emoji">${p.icon}</span>`;
}

function weightedRandom(prizes) {
  const total = prizes.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of prizes) {
    r -= p.weight;
    if (r <= 0) return p;
  }
  return prizes[prizes.length - 1];
}

function openCase() {
  const key = state.currentCase;
  const c = CASES[key];
  if (!state.demoMode && state.balance < c.price) {
    alert('Недостаточно звёзд!');
    return;
  }
  if (!state.demoMode) {
    state.balance -= c.price;
    updateBalanceUI();
  }

  const prize = weightedRandom(c.prizes);
  const track = document.getElementById('rouletteTrack');
  track.innerHTML = '';
  const items = [];
  for (let i = 0; i < 50; i++) items.push(weightedRandom(c.prizes));
  items[42] = prize;
  items.forEach(p => {
    const item = document.createElement('div');
    item.className = 'roulette-item';
    item.innerHTML = `${prizeIconHtml(p)}<div class="val">⭐${p.value}</div>`;
    track.appendChild(item);
  });

  track.style.transition = 'none';
  track.style.transform = 'translateX(0)';
  // Force reflow
  void track.offsetWidth;

  const itemW = 90;
  const centerOffset = (window.innerWidth > 430 ? 430 : window.innerWidth) / 2 - 45;
  const targetX = 42 * itemW - centerOffset + (Math.random() * 30 - 15);

  requestAnimationFrame(() => {
    track.style.transition = 'transform 5.2s cubic-bezier(0.12, 0.8, 0.2, 1)';
    track.style.transform = `translateX(-${targetX}px)`;
  });

  setTimeout(() => {
    showPrize(prize);
    if (!state.demoMode) {
      if (prize.name.includes('⭐')) {
        state.balance += prize.value;
      } else {
        state.inventory.push({ ...prize, id: Date.now() });
      }
      updateBalanceUI();
    }
  }, 5400);
}

function showPrize(prize) {
  document.getElementById('prizeImage').innerHTML = prizeIconHtml(prize);
  document.getElementById('prizeName').textContent = prize.name;
  document.getElementById('prizeValue').textContent = prize.value;
  document.getElementById('screen-prize').classList.add('active');
}

function closePrize() {
  document.getElementById('screen-prize').classList.remove('active');
  showScreen('case-open');
}

function sharePrize() {
  if (tg) tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent('Я выиграл в CatUp!'));
  else alert('Поделиться!');
}

function toggleCaseSettings() {
  document.getElementById('screen-case-settings').classList.add('active');
}

function toggleDemo() {
  state.demoMode = document.getElementById('demoToggle').checked;
  updateBalanceUI();
  if (state.currentCase) {
    document.getElementById('casePrice').textContent = state.demoMode ? '0' : CASES[state.currentCase].price;
  }
}

function showPrizes() {
  const c = CASES[state.currentCase];
  let msg = 'Призы кейса ' + c.name + ':\n\n';
  c.prizes.forEach(p => msg += `${p.icon} ${p.name} — ⭐${p.value}\n`);
  alert(msg);
}

// ========== UPGRADE ==========
function updateUpgradeUI() {
  const percent = calcUpgradeChance();
  document.getElementById('upgradePercent').textContent = percent.toFixed(2) + '%';
  const progress = document.getElementById('upgradeProgress');
  progress.style.strokeDashoffset = 283 - (283 * percent / 100);
  document.getElementById('stakeDisplay').textContent = state.stakeItem ? `${state.stakeItem.icon} ${state.stakeItem.name}` : 'Выбрать';
  document.getElementById('targetDisplay').textContent = state.targetItem ? `${state.targetItem.icon} ${state.targetItem.name}` : 'Выбрать';
}

function calcUpgradeChance() {
  if (!state.stakeItem || !state.targetItem) return 77.66;
  const ratio = state.stakeItem.value / state.targetItem.value;
  return Math.min(95, Math.max(5, ratio * 80));
}

function selectStake() { openSelectItem('stake'); }
function selectTarget() { openSelectItem('target'); }

function openSelectItem(type) {
  document.getElementById('selectTitle').textContent = type === 'stake' ? 'Выбрать ставку' : 'Выбрать цель';
  const list = document.getElementById('selectItemsList');
  const empty = document.getElementById('nftEmpty');
  list.innerHTML = '';

  const starsOpt = document.createElement('div');
  starsOpt.className = 'item-row';
  starsOpt.innerHTML = `<div class="icon">⭐</div><div class="info"><div class="name">Звёзды</div><div class="val">Баланс: ${Math.floor(state.balance)}</div></div>`;
  starsOpt.onclick = () => {
    const amount = prompt('Сколько звёзд?', '50');
    if (amount && !isNaN(amount) && +amount > 0 && +amount <= state.balance) {
      const item = { name: amount + '⭐', icon: '⭐', value: +amount, isStars: true };
      if (type === 'stake') state.stakeItem = item;
      else state.targetItem = item;
      closeModal('screen-select-item');
      updateUpgradeUI();
    }
  };
  list.appendChild(starsOpt);

  if (state.inventory.length === 0) {
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    state.inventory.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `<div class="icon">${prizeIconHtml(item)}</div><div class="info"><div class="name">${item.name}</div><div class="val">⭐ ${item.value}</div></div>`;
      row.onclick = () => {
        if (type === 'stake') state.stakeItem = { ...item, invIdx: idx };
        else state.targetItem = { ...item };
        closeModal('screen-select-item');
        updateUpgradeUI();
      };
      list.appendChild(row);
    });
  }
  document.getElementById('screen-select-item').classList.add('active');
}

function doUpgrade() {
  if (!state.stakeItem || !state.targetItem) {
    alert('Выберите ставку и цель!');
    return;
  }
  const chance = calcUpgradeChance() / 100;
  const success = Math.random() < chance;

  if (state.stakeItem.isStars) {
    if (state.balance < state.stakeItem.value) { alert('Недостаточно звёзд'); return; }
    state.balance -= state.stakeItem.value;
  } else {
    state.inventory.splice(state.stakeItem.invIdx, 1);
  }

  if (success) {
    if (state.targetItem.isStars) state.balance += state.targetItem.value;
    else state.inventory.push({ ...state.targetItem, id: Date.now() });
    alert('Успех! Получено: ' + state.targetItem.name);
  } else {
    alert('Неудача... Ставка сгорела.');
  }

  state.stakeItem = null;
  state.targetItem = null;
  updateBalanceUI();
  updateUpgradeUI();
}

// ========== CRASH ==========
function placeCrashBet() {
  if (state.crashRunning || state.crashCountdown) return;
  const amount = Number(document.getElementById('crashBetAmount').value);
  if (amount < 1 || amount > state.balance) { alert('Некорректная ставка'); return; }
  state.balance -= amount;
  state.crashBet = amount;
  state.crashCashed = false;
  state.crashMult = 1.00;
  updateBalanceUI();

  document.getElementById('crashBetBtn').style.display = 'none';
  document.getElementById('crashCashoutBtn').style.display = 'none';

  // 10 second countdown before flight
  state.crashCountdown = true;
  let sec = 10;
  document.getElementById('crashMult').textContent = sec;
  const countdownInterval = setInterval(() => {
    sec--;
    if (sec > 0) {
      document.getElementById('crashMult').textContent = sec;
    } else {
      clearInterval(countdownInterval);
      state.crashCountdown = false;
      startCrashFlight();
    }
  }, 1000);
}

function startCrashFlight() {
  state.crashRunning = true;
  document.getElementById('crashCashoutBtn').style.display = 'block';
  const car = document.getElementById('crashCar');
  car.classList.add('flying');
  startEngineSound();
  scheduleRandomMeows();
  let height = 20;
  let crashAt = Math.random() < 0.20 ? (5 + Math.random() * 18) : (1.05 + Math.random() * 3.2);

  state.crashInterval = setInterval(() => {
    state.crashMult += 0.012 + (state.crashMult * 0.009);
    height = Math.min(180, 20 + (state.crashMult - 1) * 24);
    car.style.bottom = height + 'px';
    document.getElementById('crashMult').textContent = 'x' + state.crashMult.toFixed(2);
    document.getElementById('cashoutMult').textContent = state.crashMult.toFixed(2);
    updateEngineSound(state.crashMult);

    if (state.crashMult >= crashAt) {
      clearInterval(state.crashInterval);
      state.crashRunning = false;
      car.classList.remove('flying');
      stopEngineSound();
      stopMeows();
      car.style.bottom = '8px';
      document.getElementById('crashMult').textContent = 'CRASH x' + state.crashMult.toFixed(2);
      if (!state.crashCashed) state.crashBet = 0;
      setTimeout(() => {
        document.getElementById('crashBetBtn').style.display = 'block';
        document.getElementById('crashCashoutBtn').style.display = 'none';
        document.getElementById('crashMult').textContent = 'x1.00';
        car.style.bottom = '20px';
      }, 2200);
    }
  }, 45);
}

function cashoutCrash() {
  if (!state.crashRunning || state.crashCashed) return;
  state.crashCashed = true;
  const win = Math.floor(state.crashBet * state.crashMult);
  state.balance += win;
  updateBalanceUI();
  clearInterval(state.crashInterval);
  state.crashRunning = false;
  document.getElementById('crashCar').classList.remove('flying');
  stopEngineSound();
  stopMeows();
  document.getElementById('crashCashoutBtn').style.display = 'none';
  document.getElementById('crashBetBtn').style.display = 'block';
  document.getElementById('crashMult').textContent = 'Забрано x' + state.crashMult.toFixed(2);
  setTimeout(() => {
    document.getElementById('crashMult').textContent = 'x1.00';
    document.getElementById('crashCar').style.bottom = '20px';
  }, 1600);
}

function adjustCrashBet(delta) {
  const input = document.getElementById('crashBetAmount');
  let v = Number(input.value) + delta;
  if (v < 1) v = 1;
  input.value = v;
}

// ========== MINES ==========
function setMinesSize(size) {
  state.minesSize = size;
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.size-btn[data-size="${size}"]`).classList.add('active');
  if (!state.minesActive) renderMinesGrid();
}

function renderMinesGrid() {
  const grid = document.getElementById('minesGrid');
  grid.style.gridTemplateColumns = `repeat(${state.minesSize}, 54px)`;
  grid.innerHTML = '';
  const total = state.minesSize * state.minesSize;
  for (let i = 0; i < total; i++) {
    const cell = document.createElement('div');
    cell.className = 'mine-cell';
    cell.textContent = '?';
    cell.dataset.idx = i;
    cell.onclick = () => revealMine(i);
    grid.appendChild(cell);
  }
}

function startMines() {
  const amount = Number(document.getElementById('minesBet').value);
  if (amount < 1 || amount > state.balance) { alert('Некорректная ставка'); return; }
  state.balance -= amount;
  state.minesBet = amount;
  state.minesActive = true;
  state.minesRevealed = 0;
  state.minesMultiplier = 1;
  updateBalanceUI();

  const total = state.minesSize * state.minesSize;
  const mineCount = Math.max(1, Math.floor(total * 0.22));
  state.minesGrid = Array(total).fill(false);
  let placed = 0;
  while (placed < mineCount) {
    const idx = Math.floor(Math.random() * total);
    if (!state.minesGrid[idx]) { state.minesGrid[idx] = true; placed++; }
  }

  renderMinesGrid();
  document.getElementById('minesStartBtn').style.display = 'none';
  document.getElementById('minesCashoutBtn').style.display = 'block';
  document.getElementById('minesWin').textContent = amount;
}

function revealMine(idx) {
  if (!state.minesActive) return;
  const cells = document.querySelectorAll('.mine-cell');
  const cell = cells[idx];
  if (cell.classList.contains('revealed') || cell.classList.contains('bomb')) return;

  if (state.minesGrid[idx]) {
    // BOMB + explosion animation
    cell.textContent = '💣';
    cell.classList.add('bomb');
    const exp = document.createElement('div');
    exp.className = 'explosion';
    cell.appendChild(exp);
    setTimeout(() => exp.remove(), 600);

    state.minesActive = false;
    state.minesGrid.forEach((isMine, i) => {
      if (isMine) {
        cells[i].textContent = '💣';
        cells[i].classList.add('bomb');
      }
    });
    document.getElementById('minesStartBtn').style.display = 'block';
    document.getElementById('minesCashoutBtn').style.display = 'none';
    setTimeout(() => alert('💥 Бум! Вы проиграли.'), 350);
  } else {
    // GOLD success
    cell.textContent = '👑';
    cell.classList.add('revealed', 'safe', 'gold-flash');
    state.minesRevealed++;
    state.minesMultiplier = 1 + state.minesRevealed * (0.28 + (state.minesSize - 3) * 0.09);
    const win = Math.floor(state.minesBet * state.minesMultiplier);
    document.getElementById('minesWin').textContent = win;
  }
}

function cashoutMines() {
  if (!state.minesActive) return;
  const win = Math.floor(state.minesBet * state.minesMultiplier);
  state.balance += win;
  state.minesActive = false;
  updateBalanceUI();
  document.getElementById('minesStartBtn').style.display = 'block';
  document.getElementById('minesCashoutBtn').style.display = 'none';
  alert('Забрано ⭐' + win);
}

// ========== WHEEL ==========
function drawWheel(highlightIdx = -1) {
  const canvas = document.getElementById('wheelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 150, cy = 150, r = 140;
  ctx.clearRect(0, 0, 300, 300);

  const players = state.wheelPlayers.length ? state.wheelPlayers : [
    { name: '—', amount: 1, color: '#f5e6c8' },
    { name: '—', amount: 1, color: '#fbbf24' },
    { name: '—', amount: 1, color: '#ff6b00' }
  ];

  const total = players.reduce((s, p) => s + p.amount, 0) || 1;
  // Colors matching the reference photo (cream / light orange / bright orange)
  const colors = ['#f5e6c8', '#fbbf24', '#ff6b00', '#f59e0b', '#ea580c', '#d97706', '#fcd34d'];
  let start = -Math.PI / 2;

  players.forEach((p, i) => {
    const slice = (p.amount / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + slice);
    ctx.fillStyle = p.color || colors[i % colors.length];
    ctx.fill();

    // Subtle border between segments
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (i === highlightIdx) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 5;
      ctx.stroke();
    }

    // Draw avatar circle on the segment (like in the photo)
    const mid = start + slice / 2;
    const avatarR = Math.min(18, r * 0.14);
    const dist = r * 0.62;
    const ax = cx + Math.cos(mid) * dist;
    const ay = cy + Math.sin(mid) * dist;

    // White ring
    ctx.beginPath();
    ctx.arc(ax, ay, avatarR + 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Avatar background
    ctx.beginPath();
    ctx.arc(ax, ay, avatarR, 0, Math.PI * 2);
    ctx.fillStyle = p.color || colors[i % colors.length];
    ctx.fill();

    // Initial letter
    ctx.fillStyle = '#1a1a22';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const letter = (p.name && p.name[0]) ? p.name[0].toUpperCase() : '?';
    ctx.fillText(letter, ax, ay);

    start += slice;
  });

  // Outer soft glow ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 6;
  ctx.stroke();
}

function updateWheelUI() {
  document.getElementById('wheelBank').textContent = state.wheelBank;
  const el = document.getElementById('wheelPlayers');
  if (state.wheelPlayers.length === 0) {
    el.innerHTML = '<div style="text-align:center;color:#666;padding:12px;font-size:13px;">Ожидание игроков...</div>';
  } else {
    el.innerHTML = state.wheelPlayers.map(p => `
      <div class="player-row">
        <div>
          <strong>${p.name}</strong>
          <div class="chance">Шанс ${p.chance}%</div>
        </div>
        <div>⭐ ${p.amount}</div>
      </div>
    `).join('');
  }
  drawWheel();
}

function joinWheel() {
  if (state.wheelSpinning) return;
  if (!isRealUser()) {
    alert('Только реальные пользователи могут участвовать');
    return;
  }
  const amount = Number(document.getElementById('wheelBet').value);
  if (amount < 10 || amount > state.balance) {
    alert('Минимум 10⭐ или недостаточно средств');
    return;
  }

  // Check if already joined
  const myName = tg?.initDataUnsafe?.user?.first_name || 'Вы';
  if (state.wheelPlayers.some(p => p.name === myName)) {
    alert('Вы уже в игре');
    return;
  }

  state.balance -= amount;
  state.wheelBank += amount;
  state.wheelPlayers.push({
    name: myName,
    amount,
    chance: 0,
    color: ['#ff6b00','#f59e0b','#fbbf24','#ea580c'][state.wheelPlayers.length % 4]
  });

  // Recalc chances
  state.wheelPlayers.forEach(p => {
    p.chance = Math.round((p.amount / state.wheelBank) * 100);
  });
  updateBalanceUI();
  updateWheelUI();

  // If 2+ players → start 30s timer
  if (state.wheelPlayers.length >= 2 && !state.wheelTimer) {
    startWheelTimer();
  }
}

function startWheelTimer() {
  state.wheelCountdown = 30;
  const timerEl = document.getElementById('wheelTimer');
  if (timerEl) timerEl.textContent = `Запуск через ${state.wheelCountdown}с`;

  state.wheelTimer = setInterval(() => {
    state.wheelCountdown--;
    if (timerEl) timerEl.textContent = state.wheelCountdown > 0 ? `Запуск через ${state.wheelCountdown}с` : 'Крутим!';
    if (state.wheelCountdown <= 0) {
      clearInterval(state.wheelTimer);
      state.wheelTimer = null;
      spinWheel();
    }
  }, 1000);
}

function spinWheel() {
  if (state.wheelSpinning || state.wheelPlayers.length < 2) return;
  state.wheelSpinning = true;
  document.getElementById('wheelJoinBtn').style.display = 'none';
  document.getElementById('wheelWaitBtn').style.display = 'block';

  // Weighted winner
  let r = Math.random() * state.wheelBank;
  let winner = state.wheelPlayers[0];
  let winnerIdx = 0;
  for (let i = 0; i < state.wheelPlayers.length; i++) {
    r -= state.wheelPlayers[i].amount;
    if (r <= 0) { winner = state.wheelPlayers[i]; winnerIdx = i; break; }
  }

  // Spin animation
  const canvas = document.getElementById('wheelCanvas');
  let rot = 0;
  const totalRot = 2800 + Math.random() * 1000 + (winnerIdx * (360 / Math.max(1, state.wheelPlayers.length)));
  const duration = 7500;
  const start = performance.now();

  function animate(now) {
    const t = Math.min(1, (now - start) / duration);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - t, 3);
    rot = ease * totalRot;
    canvas.style.transform = `rotate(${rot}deg)`;
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      // Done
      const myName = tg?.initDataUnsafe?.user?.first_name || 'Вы';
      if (winner.name === myName) {
        state.balance += state.wheelBank;
        alert('🎉 Вы выиграли банк ⭐' + state.wheelBank + '!');
      } else {
        alert('Победитель: ' + winner.name + ' (⭐' + state.wheelBank + ')');
      }
      state.wheelPlayers = [];
      state.wheelBank = 0;
      state.wheelSpinning = false;
      updateBalanceUI();
      updateWheelUI();
      document.getElementById('wheelJoinBtn').style.display = 'block';
      document.getElementById('wheelWaitBtn').style.display = 'none';
      const timerEl = document.getElementById('wheelTimer');
      if (timerEl) timerEl.textContent = '';
      canvas.style.transform = 'rotate(0deg)';
    }
  }
  requestAnimationFrame(animate);
}

// ========== CAT ==========
function setCatDiff(diff) {
  state.catDiff = diff;
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.diff-btn[data-diff="${diff}"]`).classList.add('active');
}

function startCatGame() {
  const amount = Number(document.getElementById('catBet').value);
  if (amount < 1 || amount > state.balance) { alert('Некорректная ставка'); return; }
  state.balance -= amount;
  state.catBet = amount;
  state.catMult = 1.00;
  state.catRunning = true;
  state.catY = 50;
  updateBalanceUI();

  document.getElementById('catStartBtn').style.display = 'none';
  document.getElementById('catCashoutBtn').style.display = 'block';
  document.getElementById('catMult').textContent = '1.00';

  const speeds = { easy: 1.8, medium: 3.2, hard: 4.8, hardcore: 6.5 };
  const speed = speeds[state.catDiff] || 1.8;
  const container = document.getElementById('lanes');
  container.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const lane = document.createElement('div');
    lane.className = 'lane';
    lane.style.top = (i * 20) + '%';
    container.appendChild(lane);
  }

  const cat = document.getElementById('catPlayer');
  cat.style.top = '50%';
  let cars = [];

  state.catInterval = setInterval(() => {
    if (!state.catRunning) return;
    cars.forEach(c => {
      c.x -= speed;
      c.el.style.left = c.x + 'px';
      if (c.x < 55 && c.x > 8) {
        const catLane = Math.floor(state.catY / 20);
        if (Math.abs(c.lane - catLane) < 1) endCatGame(false);
      }
    });
    cars = cars.filter(c => c.x > -50);

    if (Math.random() < 0.028 + speed * 0.008) {
      const lane = Math.floor(Math.random() * 5);
      const el = document.createElement('div');
      el.className = 'car';
      el.textContent = '🚗';
      el.style.top = (lane * 20 + 4) + '%';
      el.style.left = '100%';
      container.appendChild(el);
      cars.push({ el, x: container.parentElement.offsetWidth || 300, lane });
    }

    state.catMult += 0.0045 * (speed / 2);
    document.getElementById('catMult').textContent = state.catMult.toFixed(2);
  }, 40);

  document.getElementById('roadContainer').onclick = (e) => {
    if (!state.catRunning) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    state.catY = Math.max(5, Math.min(90, y));
    cat.style.top = state.catY + '%';
  };
}

function cashoutCat() {
  if (!state.catRunning) return;
  endCatGame(true);
}

function endCatGame(won) {
  clearInterval(state.catInterval);
  state.catRunning = false;
  document.getElementById('catStartBtn').style.display = 'block';
  document.getElementById('catCashoutBtn').style.display = 'none';
  document.getElementById('roadContainer').onclick = null;
  document.getElementById('lanes').innerHTML = '';

  if (won) {
    const win = Math.floor(state.catBet * state.catMult);
    state.balance += win;
    updateBalanceUI();
    alert('Успех! Забрано ⭐' + win);
  } else {
    alert('Кошку сбила машина... Ставка сгорела.');
  }
  state.catMult = 1;
  document.getElementById('catMult').textContent = '1.00';
}

// ========== PROFILE / TOPUP ==========
function switchTopupTab(tab) {
  document.querySelectorAll('.topup-tabs .tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.topup-tabs .tab[data-tab="${tab}"]`).classList.add('active');
  document.getElementById('topupStars').style.display = tab === 'stars' ? 'block' : 'none';
  document.getElementById('topupGram').style.display = tab === 'gram' ? 'block' : 'none';
  document.getElementById('topupGifts').style.display = tab === 'gifts' ? 'block' : 'none';
}

let topupAmount = 200;
function setTopupAmount(v) {
  topupAmount = v;
  document.querySelector('#topupStars .amount').textContent = v + ' ⭐';
  document.querySelector('#topupStars .approx').textContent = `~ ${(v * 0.01215).toFixed(2)} GRAM (-10%)`;
}

function buyStars() {
  if (confirm(`Купить ${topupAmount} ⭐? (симуляция)`)) {
    state.balance += topupAmount;
    updateBalanceUI();
    alert('Баланс пополнен на ⭐' + topupAmount);
    showScreen('profile');
  }
}

function openGiftBot() {
  document.getElementById('screen-gift-bot').classList.add('active');
}

function goToBot() {
  if (tg) tg.openTelegramLink('https://t.me/Avstralua');
  else window.open('https://t.me/Avstralua', '_blank');
  closeModal('screen-gift-bot');
}

function inviteFriends() {
  if (tg) {
    tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent('Присоединяйся к CatUp!') + '&text=' + encodeURIComponent('Играй и зарабатывай звёзды!'));
  }
  state.balance += 2;
  updateBalanceUI();
  alert('+2 ⭐ за приглашение (симуляция)');
}

// Start
document.addEventListener('DOMContentLoaded', init);
