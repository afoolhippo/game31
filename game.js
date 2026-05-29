'use strict';

const HOME_URL = 'https://afoolhippo.github.io/home/?skipTitle=1';
const GAME_URL = 'https://afoolhippo.github.io/game31/';

const MAX_LIFE = 15;
const HAND_SIZE = 5;

const CARD_MASTER = {
  kaba: {
    id: 'kaba',
    type: 'monster',
    name: 'カバ',
    power: 7,
    image: 'card_kaba.png'
  },
  nasman: {
    id: 'nasman',
    type: 'monster',
    name: 'ナスマン',
    power: 9,
    image: 'card_nasman.png'
  },
  tomatoman: {
    id: 'tomatoman',
    type: 'monster',
    name: 'トマトマン',
    power: 5,
    image: 'card_tomatoman.png'
  },
  haburashiman: {
    id: 'haburashiman',
    type: 'monster',
    name: '歯ブラシマン',
    power: 6,
    image: 'card_haburashiman.png'
  },
  axolotl: {
    id: 'axolotl',
    type: 'monster',
    name: 'ウーパールーパー',
    power: 4,
    image: 'card_axolotl.png'
  },
  kame: {
    id: 'kame',
    type: 'monster',
    name: 'カメ',
    power: 8,
    image: 'card_kame.png'
  },
  kappa: {
    id: 'kappa',
    type: 'monster',
    name: '河童',
    power: 10,
    image: 'card_kappa.png'
  }
};

const DECK_LIST = [
  'kaba', 'kaba', 'kaba', 'kaba',
  'nasman', 'nasman', 'nasman',
  'tomatoman', 'tomatoman', 'tomatoman', 'tomatoman',
  'haburashiman', 'haburashiman', 'haburashiman',
  'axolotl', 'axolotl', 'axolotl',
  'kame', 'kame',
  'kappa'
];

const state = {
  playerLife: MAX_LIFE,
  cpuLife: MAX_LIFE,
  playerDeck: [],
  cpuDeck: [],
  playerHand: [],
  cpuHand: [],
  playerCard: null,
  cpuCard: null,
  locked: false,
  gameOver: false,
  turnCount: 0
};

const $ = (id) => document.getElementById(id);

const screens = {
  title: $('titleScreen'),
  game: $('gameScreen'),
  result: $('resultScreen')
};

const bgm = $('bgm');

function setAppHeight() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
}
window.addEventListener('resize', setAppHeight);
setAppHeight();

function cloneCard(id) {
  return {
    ...CARD_MASTER[id],
    uid: `${id}_${Date.now()}_${Math.random().toString(16).slice(2)}`
  };
}

function makeDeck() {
  return shuffle(DECK_LIST.map(cloneCard));
}

function shuffle(array) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove('active'));
  screens[name].classList.add('active');
}

function playBgm() {
  bgm.volume = 0.42;
  bgm.loop = true;
  bgm.play().catch(() => {});
}

function stopBgm() {
  bgm.pause();
  bgm.currentTime = 0;
}

function startGame() {
  state.playerLife = MAX_LIFE;
  state.cpuLife = MAX_LIFE;
  state.playerDeck = makeDeck();
  state.cpuDeck = makeDeck();
  state.playerHand = [];
  state.cpuHand = [];
  state.playerCard = null;
  state.cpuCard = null;
  state.locked = false;
  state.gameOver = false;
  state.turnCount = 0;

  for (let i = 0; i < HAND_SIZE; i++) {
    drawCard('player');
    drawCard('cpu');
  }

  showScreen('game');
  playBgm();
  setMessage('手札からカードを選ぼう！');
  renderAll();
}

function drawCard(owner) {
  const deck = owner === 'player' ? state.playerDeck : state.cpuDeck;
  const hand = owner === 'player' ? state.playerHand : state.cpuHand;

  if (deck.length > 0 && hand.length < HAND_SIZE) {
    hand.push(deck.shift());
  }
}

function renderAll() {
  $('playerLife').textContent = Math.max(0, state.playerLife);
  $('cpuLife').textContent = Math.max(0, state.cpuLife);
  $('playerDeckCount').textContent = state.playerDeck.length;
  $('cpuDeckCount').textContent = state.cpuDeck.length;

  renderBattleCard('player');
  renderBattleCard('cpu');
  renderHand();
}

function renderBattleCard(owner) {
  const el = owner === 'player' ? $('playerBattleCard') : $('cpuBattleCard');
  const card = owner === 'player' ? state.playerCard : state.cpuCard;

  if (!card) {
    el.className = owner === 'cpu' ? 'battle-card back-card' : 'battle-card empty-card';
    el.innerHTML = owner === 'cpu' ? '?' : '未選択';
    return;
  }

  el.className = 'battle-card';
  el.innerHTML = cardLargeHtml(card);
}

function renderHand() {
  const handEl = $('playerHand');
  handEl.innerHTML = '';

  state.playerHand.forEach((card, index) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = cardSmallHtml(card);
    div.addEventListener('click', () => playPlayerCard(index));
    handEl.appendChild(div);
  });
}

function cardSmallHtml(card) {
  return `
    <img src="${card.image}" alt="${card.name}" onerror="this.style.display='none'">
    <div class="card-name">${card.name}</div>
    <div class="card-power">つよさ ${card.power}</div>
  `;
}

function cardLargeHtml(card) {
  return `
    <img src="${card.image}" alt="${card.name}" onerror="this.style.display='none'">
    <div class="card-name">${card.name}</div>
    <div class="card-power">つよさ ${card.power}</div>
  `;
}

function setMessage(text) {
  $('messageBox').textContent = text;
}

function playPlayerCard(handIndex) {
  if (state.locked || state.gameOver) return;

  const playerCard = state.playerHand.splice(handIndex, 1)[0];
  const cpuIndex = chooseCpuCardIndex();

  if (cpuIndex < 0) {
    state.playerHand.splice(handIndex, 0, playerCard);
    finishByLife();
    return;
  }

  const cpuCard = state.cpuHand.splice(cpuIndex, 1)[0];

  state.playerCard = playerCard;
  state.cpuCard = cpuCard;
  state.locked = true;
  state.turnCount++;

  renderAll();
  setMessage(`${playerCard.name}を出した！\nCPUもカードを出した！`);

  setTimeout(() => resolveTurn(playerCard, cpuCard), 650);
}

function chooseCpuCardIndex() {
  if (state.cpuHand.length === 0) return -1;

  const cpuStrong = getStrongestCard(state.cpuHand);
  const cpuWeak = getWeakestCard(state.cpuHand);
  const cpuMid = getMiddleCard(state.cpuHand);

  if (state.cpuLife <= 5 && cpuStrong.index !== -1) {
    return Math.random() < 0.8 ? cpuStrong.index : cpuMid.index;
  }

  if (state.playerLife <= 5 && cpuStrong.index !== -1) {
    return Math.random() < 0.7 ? cpuStrong.index : cpuMid.index;
  }

  if (state.turnCount <= 2 && cpuWeak.index !== -1) {
    return Math.random() < 0.55 ? cpuWeak.index : cpuMid.index;
  }

  const r = Math.random();

  if (r < 0.35 && cpuWeak.index !== -1) return cpuWeak.index;
  if (r < 0.75 && cpuMid.index !== -1) return cpuMid.index;
  return cpuStrong.index;
}

function getStrongestCard(hand) {
  let index = -1;
  let power = -999;

  hand.forEach((card, i) => {
    if (card.power > power) {
      power = card.power;
      index = i;
    }
  });

  return { index, power };
}

function getWeakestCard(hand) {
  let index = -1;
  let power = 999;

  hand.forEach((card, i) => {
    if (card.power < power) {
      power = card.power;
      index = i;
    }
  });

  return { index, power };
}

function getMiddleCard(hand) {
  if (hand.length === 0) return { index: -1, power: 0 };

  const sorted = hand
    .map((card, index) => ({ card, index }))
    .sort((a, b) => a.card.power - b.card.power);

  const mid = sorted[Math.floor(sorted.length / 2)];
  return { index: mid.index, power: mid.card.power };
}

function resolveTurn(playerCard, cpuCard) {
  let msg = '';

  msg += `${playerCard.name} つよさ${playerCard.power}\n`;
  msg += `VS\n`;
  msg += `${cpuCard.name} つよさ${cpuCard.power}\n`;

  const diff = playerCard.power - cpuCard.power;

  if (diff > 0) {
    state.cpuLife -= diff;
    msg += `YOUの勝ち！\nCPUに${diff}ダメージ！`;
  } else if (diff < 0) {
    state.playerLife -= Math.abs(diff);
    msg += `CPUの勝ち！\nYOUに${Math.abs(diff)}ダメージ！`;
  } else {
    msg += '引き分け！\nダメージなし！';
  }

  setMessage(msg.trim());
  renderAll();

  if (checkGameEnd()) return;

  setTimeout(nextTurn, 1050);
}

function nextTurn() {
  if (state.gameOver) return;

  state.playerCard = null;
  state.cpuCard = null;

  drawCard('player');
  drawCard('cpu');

  if (state.playerHand.length === 0 && state.cpuHand.length === 0) {
    finishByLife();
    return;
  }

  state.locked = false;
  setMessage('次のカードを選ぼう！');
  renderAll();
}

function checkGameEnd() {
  if (state.cpuLife <= 0 && state.playerLife <= 0) {
    finishByLife();
    return true;
  }

  if (state.cpuLife <= 0) {
    endGame(true);
    return true;
  }

  if (state.playerLife <= 0) {
    endGame(false);
    return true;
  }

  return false;
}

function finishByLife() {
  if (state.playerLife >= state.cpuLife) {
    endGame(true);
  } else {
    endGame(false);
  }
}

function endGame(isWin) {
  state.gameOver = true;
  state.locked = true;

  if (isWin) {
    $('resultImage').src = 'result_win.png';
    $('resultTitle').textContent = 'カバマスター';
    $('resultComment').textContent = '勝利をつかんだ！';
  } else {
    $('resultImage').src = 'result_lose.png';
    $('resultTitle').textContent = '修行中';
    $('resultComment').textContent = 'もう一度挑戦しよう！';
  }

  setTimeout(() => {
    showScreen('result');
  }, 900);
}

function shareResult() {
  const title = $('resultTitle').textContent;
  const comment = $('resultComment').textContent;
  const text = `カバカードで「${title}」！\n${comment}\n#カバゲーセン\n${GAME_URL}`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

$('startBtn').addEventListener('click', startGame);
$('titleImage').addEventListener('click', startGame);

$('backTitleBtn').addEventListener('click', () => {
  stopBgm();
  showScreen('title');
});

$('retryBtn').addEventListener('click', startGame);

$('homeBtn').addEventListener('click', () => {
  window.location.href = HOME_URL;
});

$('shareBtn').addEventListener('click', shareResult);