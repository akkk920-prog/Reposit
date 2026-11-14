// CatUp Mini App
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#0f0f12');
  tg.setBackgroundColor('#0f0f12');
}

// ============ STATE ============
let state = {
  balance: 100, // starting for demo
  xBalance: 0,
  demoMode: false,
  currentCase: null,
  inventory: [], // NFT/gifts
  stakeItem: null,
  targetItem: null,
  // Crash
  crashRunning: false,
  crashMult: 1.00,
  crashBet: 0,
  crashCashed: false,
  crashInterval: null,
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
  // Cat
  catRunning: false,
  catMult: 1.00,
  catBet: 0,
  catDiff: 'easy',
  catInterval: null,
  catY: 50,
};

// Cases data
const CASES = {
  secret: {
    name: 'Secret',
    price: 199,
    icon: '🎭',
    limit: true,
    prizes: [
      { name: 'Chill Flame', icon: '🔥', value: 500, weight: 15 },
      { name: 'Vice Cream', icon: '🍦', value: 300, weight: 30 },
      { name: 'Snoop Dog', icon: '🐶', value: 800, weight: 5 },
      { name: '100⭐', icon: '⭐', value: 100, weight: 60 },
      { name: '50⭐', icon: '⭐', value: 50, weight: 65 },
      { name: '5⭐', icon: '⭐', value: 5, weight: 35 },
    ]
  },
  newgift: {
    name: 'New Gift',
    price: 299,
    icon: '🎃',
    limit: true,
    prizes: [
      { name: 'Mad Pumpkin', icon: '🎃', value: 1200, weight: 3 },
      { name: 'Candy Cane', icon: '🍬', value: 150, weight: 34 },
      { name: 'Lol Pop', icon: '🍭', value: 120, weight: 28 },
      { name: 'Vice Cream', icon: '🍦', value: 300, weight: 32 },
      { name: '150⭐', icon: '⭐', value: 150, weight: 65 },
      { name: '100⭐', icon: '⭐', value: 100, weight: 55 },
    ]
  },
  newmask: {
    name: 'New Mask',
    price: 499,
    icon: '🎭',
    limit: false,
    prizes: [
      { name: 'Myth Mask', icon: '🗿', value: 2000, weight: 5 },
      { name: 'Fresh Socks', icon: '🧦', value: 200, weight: 39 },
      { name: 'Input Key', icon: '🔑', value: 400, weight: 15 },
      { name: 'Candy Cane', icon: '🍬', value: 150, weight: 44 },
      { name: '300⭐', icon: '⭐', value: 300, weight: 69 },
    ]
  },
  nftcase: {
    name: 'NFT Case',
    price: 149,
    icon: '🐸',
    limit: false,
    prizes: [
      { name: 'Star Notepad', icon: '📓', value: 350, weight: 10 },
      { name: 'Witch Hat', icon: '🎩', value: 280, weight: 11 },
      { name: 'Moon Pendant', icon: '🌙', value: 420, weight: 9 },
      { name: '50⭐', icon: '⭐', value: 50, weight: 65 },
      { name: '25⭐', icon: '⭐', value: 25, weight: 70 },
    ]
  },
  meow: {
    name: 'Meow',
    price: 199,
    icon: '🐱',
    limit: false,
    prizes: [
      { name: 'Scared Cat', icon: '🙀', value: 50000, weight: 0.000001 },
      { name: 'Ion Gem', icon: '💎', value: 10000, weight: 0.000002 },
      { name: '50⭐', icon: '⭐', value: 50, weight: 75 },
      { name: '75⭐', icon: '⭐', value: 75, weight: 67 },
    ]
  },
  watch: {
    name: 'Watch',
    price: 249,
    icon: '⌚',
    limit: false,
    prizes: [
      { name: 'Swiss Watch', icon: '⌚', value: 100000, weight: 0.0000001 },
      { name: 'Kissed Frog', icon: '🐸', value: 50000, weight: 0.00000001 },
      { name: 'Big Year', icon: '📅', value: 800, weight: 30 },
      { name: '150⭐', icon: '⭐', value: 150, weight: 55 },
      { name: '100⭐', icon: '⭐', value: 100, weight: 70 },
      { name: '75⭐', icon: '⭐', value: 75, weight: 80 },
    ]
  }
};

// ============ INIT ============
function init() {
  loadState();
  renderCases();
  updateBalanceUI();
  showScreen('games');
  // Add some mock inventory for testing upgrade
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
  document.getElementById('balanceDisplay').textContent = Math.floor(state.balance);
  document.getElementById('xBalanceDisplay').textContent = Math.floor(state.xBalance);
  document.getElementById('profileBalance').textContent = Math.floor(state.balance);
  document.getElementById('upgradeBalance').textContent = state.balance.toFixed(2);
  document.getElementById('maxBalance').textContent = Math.floor(state.balance);
  const demoBadge = document.getElementById('demoBadge');
  if (demoBadge) demoBadge.style.display = state.demoMode ? 'block' : 'none';
  const demoToggle = document.getElementById('demoToggle');
  if (demoToggle) demoToggle.checked = state.demoMode;
  saveState();
}

// ============ NAVIGATION ============
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) el.classList.add('active');

  // Bottom nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.querySelector(`.nav-item[data-screen="${name}"]`);
  if (nav) nav.classList.add('active');
  else if (['cases','case-open','upgrade','crash','mines','wheel','cat','topup'].includes(name)) {
    document.querySelector('.nav-item[data-screen="games"]')?.classList.add('active');
  }

  // Reset some states
  if (name === 'cases') renderCases();
  if (name === 'upgrade') updateUpgradeUI();
  if (name === 'mines') renderMinesGrid();
  if (name === 'wheel') drawWheel();
  if (name === 'profile') updateBalanceUI();
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

// ============ CASES ============
function renderCases() {
  const grid = document.getElementById('casesGrid');
  grid.innerHTML = '';
  Object.entries(CASES).forEach(([key, c]) => {
    const card = document.createElement('div');
    card.className = 'case-card';
    card.onclick = () => openCaseScreen(key);
    card.innerHTML = `
      ${c.limit ? '<div class="limit">Лимит</div>' : ''}
      <div class="icon">${c.icon}</div>
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
  // Build roulette preview
  const track = document.getElementById('rouletteTrack');
  track.innerHTML = '';
  track.style.transition = 'none';
  track.style.transform = 'translateX(0)';
  // Fill with random prizes for visual
  for (let i = 0; i < 30; i++) {
    const p = weightedRandom(c.prizes);
    const item = document.createElement('div');
    item.className = 'roulette-item';
    item.innerHTML = `${p.icon}<div class="val">⭐${p.value}</div>`;
    track.appendChild(item);
  }
  // Live items mock
  const live = document.getElementById('liveItems');
  live.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const p = weightedRandom(c.prizes);
    const d = document.createElement('div');
    d.className = 'live-item';
    d.textContent = p.icon;
    live.appendChild(d);
  }
  showScreen('case-open');
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
  // Animate roulette
  const track = document.getElementById('rouletteTrack');
  // Rebuild with prize near the end
  track.innerHTML = '';
  const items = [];
  for (let i = 0; i < 40; i++) {
    items.push(weightedRandom(c.prizes));
  }
  items[35] = prize; // land on this
  items.forEach(p => {
    const item = document.createElement('div');
    item.className = 'roulette-item';
    item.innerHTML = `${p.icon}<div class="val">⭐${p.value}</div>`;
    track.appendChild(item);
  });

  track.style.transition = 'none';
  track.style.transform = 'translateX(0)';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const offset = 35 * 100 - (window.innerWidth / 2 - 50) + Math.random() * 40 - 20;
      track.style.transition = 'transform 4s cubic-bezier(0.15, 0.85, 0.25, 1)';
      track.style.transform = `translateX(-${offset}px)`;
    });
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
  }, 4200);
}

function showPrize(prize) {
  document.getElementById('prizeImage').textContent = prize.icon;
  document.getElementById('prizeName').textContent = prize.name;
  document.getElementById('prizeValue').textContent = prize.value;
  document.getElementById('screen-prize').classList.add('active');
}

function closePrize() {
  document.getElementById('screen-prize').classList.remove('active');
  showScreen('case-open');
}

function sharePrize() {
  if (tg) {
    tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent('Я выиграл в CatUp!'));
  } else {
    alert('Поделиться!');
  }
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
  c.prizes.forEach(p => {
    msg += `${p.icon} ${p.name} — ⭐${p.value}\n`;
  });
  alert(msg);
}

// ============ UPGRADE ============
function updateUpgradeUI() {
  const percent = calcUpgradeChance();
  document.getElementById('upgradePercent').textContent = percent.toFixed(2) + '%';
  const progress = document.getElementById('upgradeProgress');
  const offset = 283 - (283 * percent / 100);
  progress.style.strokeDashoffset = offset;
  document.getElementById('stakeDisplay').textContent = state.stakeItem ? `${state.stakeItem.icon} ${state.stakeItem.name}` : 'Выбрать';
  document.getElementById('targetDisplay').textContent = state.targetItem ? `${state.targetItem.icon} ${state.targetItem.name}` : 'Выбрать';
}

function calcUpgradeChance() {
  if (!state.stakeItem || !state.targetItem) return 77.66;
  const ratio = state.stakeItem.value / state.targetItem.value;
  // Higher stake relative to target = higher chance
  let chance = Math.min(95, Math.max(5, ratio * 80));
  return chance;
}

function selectStake() {
  openSelectItem('stake');
}

function selectTarget() {
  openSelectItem('target');
}

function openSelectItem(type) {
  document.getElementById('selectTitle').textContent = type === 'stake' ? 'Выбрать ставку' : 'Выбрать цель';
  const list = document.getElementById('selectItemsList');
  const empty = document.getElementById('nftEmpty');
  list.innerHTML = '';

  // Stars as option
  const starsOpt = document.createElement('div');
  starsOpt.className = 'item-row';
  starsOpt.innerHTML = `<div class="icon">⭐</div><div class="info"><div class="name">Звёзды</div><div class="val">Ваш баланс: ${Math.floor(state.balance)}</div></div>`;
  starsOpt.onclick = () => {
    const amount = prompt('Сколько звёзд?', '50');
    if (amount && !isNaN(amount) && amount > 0 && amount <= state.balance) {
      const item = { name: amount + '⭐', icon: '⭐', value: Number(amount), isStars: true };
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
      row.innerHTML = `<div class="icon">${item.icon}</div><div class="info"><div class="name">${item.name}</div><div class="val">⭐ ${item.value}</div></div>`;
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
    if (state.balance < state.stakeItem.value) {
      alert('Недостаточно звёзд');
      return;
    }
    state.balance -= state.stakeItem.value;
  } else {
    // Remove from inventory
    state.inventory.splice(state.stakeItem.invIdx, 1);
  }

  if (success) {
    if (state.targetItem.isStars) {
      state.balance += state.targetItem.value;
    } else {
      state.inventory.push({ ...state.targetItem, id: Date.now() });
    }
    alert('Успех! Вы получили ' + state.targetItem.name);
  } else {
    alert('Неудача... Ставка сгорела.');
  }

  state.stakeItem = null;
  state.targetItem = null;
  updateBalanceUI();
  updateUpgradeUI();
}

// ============ CRASH ============
function placeCrashBet() {
  if (state.crashRunning) return;
  const amount = Number(document.getElementById('crashBetAmount').value);
  if (amount < 1 || amount > state.balance) {
    alert('Некорректная ставка');
    return;
  }
  state.balance -= amount;
  state.crashBet = amount;
  state.crashCashed = false;
  state.crashMult = 1.00;
  updateBalanceUI();

  document.getElementById('crashBetBtn').style.display = 'none';
  document.getElementById('crashCashoutBtn').style.display = 'block';

  // Start flying
  state.crashRunning = true;
  const car = document.getElementById('crashCar');
  let height = 30;
  // Crash point: mostly low, 20% chance for big (>5x)
  let crashAt;
  if (Math.random() < 0.20) {
    crashAt = 5 + Math.random() * 20; // big
  } else {
    crashAt = 1.01 + Math.random() * 3.5;
  }

  state.crashInterval = setInterval(() => {
    state.crashMult += 0.01 + (state.crashMult * 0.008);
    height = Math.min(180, 30 + (state.crashMult - 1) * 25);
    car.style.bottom = height + 'px';
    document.getElementById('crashMult').textContent = 'x' + state.crashMult.toFixed(2);
    document.getElementById('cashoutMult').textContent = state.crashMult.toFixed(2);

    if (state.crashMult >= crashAt) {
      // Crash!
      clearInterval(state.crashInterval);
      state.crashRunning = false;
      car.style.bottom = '10px';
      document.getElementById('crashMult').textContent = 'CRASH x' + state.crashMult.toFixed(2);
      if (!state.crashCashed) {
        state.crashBet = 0;
        // lost
      }
      setTimeout(() => {
        document.getElementById('crashBetBtn').style.display = 'block';
        document.getElementById('crashCashoutBtn').style.display = 'none';
        document.getElementById('crashMult').textContent = 'x1.00';
        car.style.bottom = '30px';
      }, 2000);
    }
  }, 50);
}

function cashoutCrash() {
  if (!state.crashRunning || state.crashCashed) return;
  state.crashCashed = true;
  const win = Math.floor(state.crashBet * state.crashMult);
  state.balance += win;
  updateBalanceUI();
  clearInterval(state.crashInterval);
  state.crashRunning = false;
  document.getElementById('crashCashoutBtn').style.display = 'none';
  document.getElementById('crashBetBtn').style.display = 'block';
  document.getElementById('crashMult').textContent = 'Забрано x' + state.crashMult.toFixed(2);
  setTimeout(() => {
    document.getElementById('crashMult').textContent = 'x1.00';
    document.getElementById('crashCar').style.bottom = '30px';
  }, 1500);
}

function adjustCrashBet(delta) {
  const input = document.getElementById('crashBetAmount');
  let v = Number(input.value) + delta;
  if (v < 1) v = 1;
  input.value = v;
}

// ============ MINES ============
function setMinesSize(size) {
  state.minesSize = size;
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.size-btn[data-size="${size}"]`).classList.add('active');
  if (!state.minesActive) renderMinesGrid();
}

function renderMinesGrid() {
  const grid = document.getElementById('minesGrid');
  grid.style.gridTemplateColumns = `repeat(${state.minesSize}, 56px)`;
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
  if (amount < 1 || amount > state.balance) {
    alert('Некорректная ставка');
    return;
  }
  state.balance -= amount;
  state.minesBet = amount;
  state.minesActive = true;
  state.minesRevealed = 0;
  state.minesMultiplier = 1;
  updateBalanceUI();

  // Place mines (about 20-25% of cells)
  const total = state.minesSize * state.minesSize;
  const mineCount = Math.max(1, Math.floor(total * 0.22));
  state.minesGrid = Array(total).fill(false);
  let placed = 0;
  while (placed < mineCount) {
    const idx = Math.floor(Math.random() * total);
    if (!state.minesGrid[idx]) {
      state.minesGrid[idx] = true;
      placed++;
    }
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
    // Bomb!
    cell.textContent = '💣';
    cell.classList.add('bomb');
    state.minesActive = false;
    // Reveal all
    state.minesGrid.forEach((isMine, i) => {
      if (isMine) {
        cells[i].textContent = '💣';
        cells[i].classList.add('bomb');
      }
    });
    document.getElementById('minesStartBtn').style.display = 'block';
    document.getElementById('minesCashoutBtn').style.display = 'none';
    setTimeout(() => alert('Бум! Вы проиграли.'), 300);
  } else {
    cell.textContent = '👑';
    cell.classList.add('revealed', 'safe');
    state.minesRevealed++;
    // Increase mult
    state.minesMultiplier = 1 + state.minesRevealed * (0.3 + (state.minesSize - 3) * 0.1);
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

// ============ WHEEL ============
function drawWheel() {
  const canvas = document.getElementById('wheelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 150, cy = 150, r = 140;
  ctx.clearRect(0, 0, 300, 300);

  // Simple colored segments
  const colors = ['#ff6b00', '#ffaa00', '#f5e6c8', '#ff8c00', '#e65c00', '#ffcc66'];
  const segments = 6;
  for (let i = 0; i < segments; i++) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, (i / segments) * Math.PI * 2 - Math.PI/2, ((i+1)/segments) * Math.PI * 2 - Math.PI/2);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
  }
  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 6;
  ctx.stroke();
}

function joinWheel() {
  const amount = Number(document.getElementById('wheelBet').value);
  if (amount < 10 || amount > state.balance) {
    alert('Минимум 10⭐ или недостаточно средств');
    return;
  }
  state.balance -= amount;
  state.wheelBank += amount;
  state.wheelPlayers.push({
    name: tg?.initDataUnsafe?.user?.first_name || 'Вы',
    amount,
    chance: 0
  });
  // Recalc chances
  state.wheelPlayers.forEach(p => {
    p.chance = Math.round((p.amount / state.wheelBank) * 100);
  });
  updateBalanceUI();
  renderWheelPlayers();
  document.getElementById('wheelBank').textContent = state.wheelBank;

  // Auto spin after few players or timeout for demo
  if (state.wheelPlayers.length >= 3) {
    setTimeout(spinWheel, 1500);
  } else {
    // Add mock players
    setTimeout(() => {
      if (state.wheelPlayers.length < 3) {
        const mocks = [
          { name: 'Samir', amount: 100 },
          { name: 'Руслан', amount: 100 },
          { name: 'Artem', amount: 50 }
        ];
        mocks.forEach(m => {
          if (state.wheelPlayers.length < 4) {
            state.wheelBank += m.amount;
            state.wheelPlayers.push({ ...m, chance: 0 });
          }
        });
        state.wheelPlayers.forEach(p => p.chance = Math.round((p.amount / state.wheelBank) * 100));
        renderWheelPlayers();
        document.getElementById('wheelBank').textContent = state.wheelBank;
        setTimeout(spinWheel, 1000);
      }
    }, 2000);
  }
}

function renderWheelPlayers() {
  const el = document.getElementById('wheelPlayers');
  el.innerHTML = state.wheelPlayers.map(p => `
    <div class="player-row">
      <div>
        <strong>${p.name}</strong>
        <div style="font-size:12px;color:#aaa">Шанс ${p.chance}%</div>
      </div>
      <div>⭐ ${p.amount}</div>
    </div>
  `).join('');
}

function spinWheel() {
  if (state.wheelSpinning || state.wheelPlayers.length === 0) return;
  state.wheelSpinning = true;
  document.getElementById('wheelJoinBtn').style.display = 'none';
  document.getElementById('wheelWaitBtn').style.display = 'block';

  // Weighted winner
  const total = state.wheelBank;
  let r = Math.random() * total;
  let winner = state.wheelPlayers[0];
  for (const p of state.wheelPlayers) {
    r -= p.amount;
    if (r <= 0) { winner = p; break; }
  }

  // Animate canvas rotation (simple)
  const canvas = document.getElementById('wheelCanvas');
  let rot = 0;
  const spin = setInterval(() => {
    rot += 15;
    canvas.style.transform = `rotate(${rot}deg)`;
  }, 30);

  setTimeout(() => {
    clearInterval(spin);
    // Winner
    if (winner.name === (tg?.initDataUnsafe?.user?.first_name || 'Вы')) {
      state.balance += state.wheelBank;
      alert('Вы выиграли банк ⭐' + state.wheelBank + '!');
    } else {
      alert('Победитель: ' + winner.name + ' (⭐' + state.wheelBank + ')');
    }
    state.wheelPlayers = [];
    state.wheelBank = 0;
    state.wheelSpinning = false;
    updateBalanceUI();
    renderWheelPlayers();
    document.getElementById('wheelBank').textContent = '0';
    document.getElementById('wheelJoinBtn').style.display = 'block';
    document.getElementById('wheelWaitBtn').style.display = 'none';
    canvas.style.transform = 'rotate(0deg)';
  }, 4000);
}

// ============ CAT GAME ============
function setCatDiff(diff) {
  state.catDiff = diff;
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.diff-btn[data-diff="${diff}"]`).classList.add('active');
}

function startCatGame() {
  const amount = Number(document.getElementById('catBet').value);
  if (amount < 1 || amount > state.balance) {
    alert('Некорректная ставка');
    return;
  }
  state.balance -= amount;
  state.catBet = amount;
  state.catMult = 1.00;
  state.catRunning = true;
  state.catY = 50;
  updateBalanceUI();

  document.getElementById('catStartBtn').style.display = 'none';
  document.getElementById('catCashoutBtn').style.display = 'block';
  document.getElementById('catMult').textContent = '1.00';

  const speeds = { easy: 2, medium: 3.5, hard: 5, hardcore: 7 };
  const speed = speeds[state.catDiff] || 2;
  const container = document.getElementById('lanes');
  container.innerHTML = '';
  // Create 5 lanes
  for (let i = 0; i < 5; i++) {
    const lane = document.createElement('div');
    lane.className = 'lane';
    lane.style.top = (i * 20) + '%';
    container.appendChild(lane);
  }

  const cat = document.getElementById('catPlayer');
  cat.style.top = '50%';

  // Spawn cars
  let cars = [];
  state.catInterval = setInterval(() => {
    if (!state.catRunning) return;
    // Move existing cars
    cars.forEach(c => {
      c.x -= speed;
      c.el.style.left = c.x + 'px';
      // Collision check
      if (c.x < 60 && c.x > 10) {
        const catLane = Math.floor(state.catY / 20);
        if (Math.abs(c.lane - catLane) < 1) {
          // Hit!
          endCatGame(false);
        }
      }
    });
    cars = cars.filter(c => c.x > -50);

    // Spawn new
    if (Math.random() < 0.03 + speed * 0.01) {
      const lane = Math.floor(Math.random() * 5);
      const el = document.createElement('div');
      el.className = 'car';
      el.textContent = '🚗';
      el.style.top = (lane * 20 + 5) + '%';
      el.style.left = '100%';
      container.appendChild(el);
      cars.push({ el, x: container.parentElement.offsetWidth, lane });
    }

    // Increase mult slowly
    state.catMult += 0.005 * (speed / 2);
    document.getElementById('catMult').textContent = state.catMult.toFixed(2);
  }, 50);

  // Click road to move cat
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

// ============ PROFILE / TOPUP ============
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
  // In real app: create invoice via backend and tg.openInvoice
  // For demo we simulate
  if (confirm(`Купить ${topupAmount} ⭐ за Telegram Stars? (симуляция)`)) {
    state.balance += topupAmount;
    updateBalanceUI();
    alert('Баланс пополнен на ⭐' + topupAmount);
    showScreen('profile');
  }
  // Real way would be:
  // fetch('/api/create-invoice', {body: JSON.stringify({amount: topupAmount})})
  //   .then(r => r.json())
  //   .then(d => tg.openInvoice(d.invoiceLink, status => { if(status==='paid') ... }));
}

function openGiftBot() {
  document.getElementById('screen-gift-bot').classList.add('active');
}

function goToBot() {
  if (tg) {
    tg.openTelegramLink('https://t.me/Avstralua');
  } else {
    window.open('https://t.me/Avstralua', '_blank');
  }
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
