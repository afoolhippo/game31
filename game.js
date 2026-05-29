'use strict';

const HOME_URL = 'https://afoolhippo.github.io/home/?skipTitle=1';
const GAME_URL = 'https://afoolhippo.github.io/game30/';

const MAX_LIFE = 2000;

const CARD_MASTER = {
  kaba: {
    id: 'kaba',
    type: 'monster',
    name: 'カバ',
    atk: 800,
    def: 800,
    image: 'card_kaba.png'
  },
  nasman: {
    id: 'nasman',
    type: 'monster',
    name: 'ナスマン',
    atk: 900,
    def: 500,
    image: 'card_nasman.png'
  },
  tomatoman: {
    id: 'tomatoman',
    type: 'monster',
    name: 'トマトマン',
    atk: 600,
    def: 900,
    image: 'card_tomatoman.png'
  },
  haburashiman: {
    id: 'haburashiman',
    type: 'monster',
    name: '歯ブラシマン',
    atk: 800,
    def: 700,
    image: 'card_haburashiman.png'
  },
  kame: {
    id: 'kame',
    type: 'monster',
    name: 'カメ',
    atk: 300,
    def: 1200,
    image: 'card_kame.png'
  },
  kappa: {
    id: 'kappa',
    type: 'monster',
    name: '河童',
    atk: 1300,
    def: 300,
    image: 'card_kappa.png'
  },
  bombonigiri: {
    id: 'bombonigiri',
    type: 'destroy',
    name: '爆弾おにぎり',
    image: 'card_bombonigiri.png'
  },
  gameni: {
    id: 'gameni',
    type: 'powerup',
    name: 'がめ煮',
    boost: 300,
    image: 'card_gameni.png'
  }
};

const DECK_LIST = [
  'kaba', 'kaba', 'kaba', 'kaba',
  'nasman', 'nasman', 'nasman', 'nasman',
  'tomatoman', 'tomatoman',
  'haburashiman', 'haburashiman', 'haburashiman',
  'kame',
  'kappa',
  'bombonigiri', 'bombonigiri', 'bombonigiri',
  'gameni', 'gameni'
];

const state = {
  playerLp: MAX_LIFE,
  cpuLp: MAX_LIFE,
  playerDeck: [],
  cpuDeck: [],
  playerHand: [],
  cpuHand: [],
  playerField: [null, null, null],
  cpuField: [null, null, null],
  turn: 'player',
  selectedAttackerIndex: null,
  selectedDestroyCardIndex: null,
  selectedPowerupCardIndex: null,
  playerSummoned: false,
  playerUsedSpecial: false,
  gameOver: false
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
    uid: `${id}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    atkBoost: 0
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

function setMessage(text) {
  $('messageBox').textContent = text;
}

function getAtk(card) {
  return card.atk + (card.atkBoost || 0);
}

function updateInfo() {
  $('playerLp').textContent = `${Math.max(0, state.playerLp)} / のこりカード ${state.playerDeck.length}`;
  $('cpuLp').textContent = `${Math.max(0, state.cpuLp)} / のこりカード ${state.cpuDeck.length}`;
}

function startGame() {
  state.playerLp = MAX_LIFE;
  state.cpuLp = MAX_LIFE;
  state.playerDeck = makeDeck();
  state.cpuDeck = makeDeck();
  state.playerHand = [];
  state.cpuHand = [];
  state.playerField = [null, null, null];
  state.cpuField = [null, null, null];
  state.turn = 'player';
  state.selectedAttackerIndex = null;
  state.selectedDestroyCardIndex = null;
  state.selectedPowerupCardIndex = null;
  state.playerSummoned = false;
  state.playerUsedSpecial = false;
  state.gameOver = false;

  for (let i = 0; i < 5; i++) {
    drawCard('player');
    drawCard('cpu');
  }

  showScreen('game');
  playBgm();
  renderAll();
  setMessage('あなたのターン！\n手札からカードを選ぼう。');
}

function drawCard(owner) {
  const deck = owner === 'player' ? state.playerDeck : state.cpuDeck;
  const hand = owner === 'player' ? state.playerHand : state.cpuHand;

  if (deck.length > 0) {
    hand.push(deck.shift());
  }
}

function renderAll() {
  updateInfo();
  renderField('player');
  renderField('cpu');
  renderHand();
  $('turnText').textContent = state.turn === 'player' ? 'あなたのターン' : 'CPUのターン';
}

function renderField(owner) {
  const fieldEl = owner === 'player' ? $('playerField') : $('cpuField');
  const field = owner === 'player' ? state.playerField : state.cpuField;

  fieldEl.innerHTML = '';

  field.forEach((card, index) => {
    const div = document.createElement('div');
    div.className = 'slot';

    if (!card) {
      div.textContent = '空き';
    } else {
      div.className = `card ${card.position === 'defense' ? 'defense' : ''} ${card.attacked ? 'used' : ''}`;
      div.innerHTML = cardHtml(card);

      if (owner === 'player') {
        div.addEventListener('click', () => {
          if (state.selectedPowerupCardIndex !== null) {
            powerupTarget(index);
          } else {
            selectAttacker(index);
          }
        });
      } else {
        div.addEventListener('click', () => {
          if (state.selectedDestroyCardIndex !== null) {
            destroyTarget(index);
          } else {
            attackTarget(index);
          }
        });
      }
    }

    fieldEl.appendChild(div);
  });
}

function renderHand() {
  const handEl = $('playerHand');
  handEl.innerHTML = '';

  state.playerHand.forEach((card, index) => {
    const div = document.createElement('div');
    div.className = 'card hand-card';
    div.innerHTML = cardHtml(card);
    div.addEventListener('click', () => playCard(index));
    handEl.appendChild(div);
  });
}

function cardHtml(card) {
  let stat = '';

  if (card.type === 'monster') {
    stat = `<div class="card-stats">こうげき ${getAtk(card)}<br>ぼうぎょ ${card.def}</div>`;
  } else if (card.type === 'destroy') {
    stat = `<div class="card-stats">相手1体<br>破壊</div>`;
  } else if (card.type === 'powerup') {
    stat = `<div class="card-stats">こうげき<br>+${card.boost}</div>`;
  }

  const pos = card.type === 'monster' && card.position
    ? `<div class="card-stats">${card.position === 'attack' ? '攻撃表示' : '守備表示'}</div>`
    : '';

  const boosted = card.type === 'monster' && card.atkBoost
    ? `<div class="card-stats">強化中</div>`
    : '';

  return `
    <img src="${card.image}" alt="${card.name}" onerror="this.style.display='none'">
    <div class="card-name">${card.name}</div>
    ${stat}
    ${pos}
    ${boosted}
  `;
}

function playCard(handIndex) {
  if (state.gameOver || state.turn !== 'player') return;

  const card = state.playerHand[handIndex];
  if (!card) return;

  state.selectedAttackerIndex = null;
  state.selectedDestroyCardIndex = null;
  state.selectedPowerupCardIndex = null;

  if (card.type === 'destroy') {
    if (state.playerUsedSpecial) {
      setMessage('特殊カードは1ターンに1回まで！');
      return;
    }

    if (!state.cpuField.some(Boolean)) {
      setMessage('相手フィールドにモンスターがいない！');
      return;
    }

    openDestroyModal(card, handIndex);
    return;
  }

  if (card.type === 'powerup') {
    if (state.playerUsedSpecial) {
      setMessage('特殊カードは1ターンに1回まで！');
      return;
    }

    if (!state.playerField.some(Boolean)) {
      setMessage('味方フィールドにモンスターがいない！');
      return;
    }

    openPowerupModal(card, handIndex);
    return;
  }

  if (state.playerSummoned) {
    setMessage('召喚は1ターンに1回まで！');
    return;
  }

  const emptyIndex = state.playerField.findIndex(slot => slot === null);

  if (emptyIndex === -1) {
    setMessage('フィールドがいっぱいだ！');
    return;
  }

  openSummonModal(card, handIndex, emptyIndex);
}

function openSummonModal(card, handIndex, fieldIndex) {
  const modal = $('modal');
  const content = $('modalContent');

  content.innerHTML = `
    <img src="${card.image}" class="modal-card-img" alt="${card.name}" onerror="this.style.display='none'">
    <div class="modal-title">${card.name}を召喚！</div>
    <div>こうげき ${card.atk}<br>ぼうぎょ ${card.def}</div>
    <div class="modal-buttons">
      <button id="atkPosBtn">攻撃表示</button>
      <button id="defPosBtn">守備表示</button>
      <button id="cancelBtn">やめる</button>
    </div>
  `;

  modal.classList.remove('hidden');

  $('atkPosBtn').onclick = () => summonPlayerCard(handIndex, fieldIndex, 'attack');
  $('defPosBtn').onclick = () => summonPlayerCard(handIndex, fieldIndex, 'defense');
  $('cancelBtn').onclick = closeModal;
}

function openDestroyModal(card, handIndex) {
  const modal = $('modal');
  const content = $('modalContent');

  content.innerHTML = `
    <img src="${card.image}" class="modal-card-img" alt="${card.name}" onerror="this.style.display='none'">
    <div class="modal-title">${card.name}</div>
    <div>相手モンスターを1体破壊する！</div>
    <div class="modal-buttons">
      <button id="useDestroyBtn">使う</button>
      <button id="cancelBtn">やめる</button>
    </div>
  `;

  modal.classList.remove('hidden');

  $('useDestroyBtn').onclick = () => {
    closeModal();
    state.selectedDestroyCardIndex = handIndex;
    setMessage('破壊したい相手モンスターをタップ！');
  };

  $('cancelBtn').onclick = closeModal;
}

function openPowerupModal(card, handIndex) {
  const modal = $('modal');
  const content = $('modalContent');

  content.innerHTML = `
    <img src="${card.image}" class="modal-card-img" alt="${card.name}" onerror="this.style.display='none'">
    <div class="modal-title">${card.name}</div>
    <div>味方モンスター1体のこうげき +${card.boost}！</div>
    <div class="modal-buttons">
      <button id="usePowerupBtn">使う</button>
      <button id="cancelBtn">やめる</button>
    </div>
  `;

  modal.classList.remove('hidden');

  $('usePowerupBtn').onclick = () => {
    closeModal();
    state.selectedPowerupCardIndex = handIndex;
    setMessage('強化したい味方モンスターをタップ！');
  };

  $('cancelBtn').onclick = closeModal;
}

function closeModal() {
  $('modal').classList.add('hidden');
}

function summonPlayerCard(handIndex, fieldIndex, position) {
  const card = state.playerHand.splice(handIndex, 1)[0];

  card.position = position;
  card.attacked = false;
  card.atkBoost = card.atkBoost || 0;

  state.playerField[fieldIndex] = card;
  state.playerSummoned = true;

  closeModal();

  setMessage(`${card.name}を召喚！\nこうげき ${getAtk(card)}\nぼうぎょ ${card.def}`);
  renderAll();
}

function destroyTarget(targetIndex) {
  if (state.gameOver || state.turn !== 'player') return;

  const target = state.cpuField[targetIndex];

  if (!target) {
    setMessage('そこにはモンスターがいない！');
    return;
  }

  const handIndex = state.selectedDestroyCardIndex;
  const card = state.playerHand[handIndex];

  if (!card || card.type !== 'destroy') {
    state.selectedDestroyCardIndex = null;
    return;
  }

  state.playerHand.splice(handIndex, 1);
  state.cpuField[targetIndex] = null;
  state.playerUsedSpecial = true;
  state.selectedDestroyCardIndex = null;

  setMessage(`爆弾おにぎり！\n${target.name}を破壊した！`);
  renderAll();
}

function powerupTarget(targetIndex) {
  if (state.gameOver || state.turn !== 'player') return;

  const target = state.playerField[targetIndex];

  if (!target) {
    setMessage('そこには味方モンスターがいない！');
    return;
  }

  const handIndex = state.selectedPowerupCardIndex;
  const card = state.playerHand[handIndex];

  if (!card || card.type !== 'powerup') {
    state.selectedPowerupCardIndex = null;
    return;
  }

  state.playerHand.splice(handIndex, 1);
  target.atkBoost = (target.atkBoost || 0) + card.boost;
  state.playerUsedSpecial = true;
  state.selectedPowerupCardIndex = null;

  setMessage(`がめ煮パワー！\n${target.name}のこうげきが${card.boost}アップ！`);
  renderAll();
}

function selectAttacker(index) {
  if (state.gameOver || state.turn !== 'player') return;

  state.selectedDestroyCardIndex = null;
  state.selectedPowerupCardIndex = null;

  const card = state.playerField[index];

  if (!card) return;

  if (card.position === 'defense') {
    setMessage('守備表示のモンスターは攻撃できない！');
    return;
  }

  if (card.attacked) {
    setMessage('このモンスターはもう攻撃した！');
    return;
  }

  state.selectedAttackerIndex = index;

  const hasCpuMonster = state.cpuField.some(Boolean);

  if (hasCpuMonster) {
    setMessage(`${card.name}で攻撃！\n攻撃したい相手カードをタップ！`);
  } else {
    setMessage(`${card.name}でダイレクトアタック！`);
    setTimeout(() => directAttack('player', index), 350);
  }
}

function attackTarget(targetIndex) {
  if (state.gameOver || state.turn !== 'player') return;

  if (state.selectedAttackerIndex === null) return;

  const target = state.cpuField[targetIndex];

  if (!target) {
    setMessage('そこにはモンスターがいない！');
    return;
  }

  battle('player', state.selectedAttackerIndex, targetIndex);
  state.selectedAttackerIndex = null;
}

function battle(attackerOwner, attackerIndex, targetIndex) {
  const atkField = attackerOwner === 'player' ? state.playerField : state.cpuField;
  const defField = attackerOwner === 'player' ? state.cpuField : state.playerField;
  const attacker = atkField[attackerIndex];
  const defender = defField[targetIndex];

  if (!attacker || !defender || attacker.position !== 'attack') return;

  attacker.attacked = true;

  const attackerAtk = getAtk(attacker);

  let msg = `${attacker.name}の攻撃！\n`;

  if (defender.position === 'attack') {
    const defenderAtk = getAtk(defender);
    const diff = attackerAtk - defenderAtk;

    if (diff > 0) {
      defField[targetIndex] = null;
      damage(attackerOwner === 'player' ? 'cpu' : 'player', diff);
      msg += `${defender.name}を撃破！\n${Math.abs(diff)}ダメージ！`;
    } else if (diff < 0) {
      atkField[attackerIndex] = null;
      damage(attackerOwner, Math.abs(diff));
      msg += `返り討ち！\n${Math.abs(diff)}ダメージ！`;
    } else {
      atkField[attackerIndex] = null;
      defField[targetIndex] = null;
      msg += '相打ち！';
    }
  } else {
    const diff = attackerAtk - defender.def;

    if (diff > 0) {
      defField[targetIndex] = null;
      msg += `${defender.name}を撃破！\n守備表示なのでダメージなし！`;
    } else if (diff < 0) {
      damage(attackerOwner, Math.abs(diff));
      msg += `守備が固い！\n${Math.abs(diff)}ダメージ！`;
    } else {
      msg += '守備力と互角！';
    }
  }

  setMessage(msg);
  renderAll();
  checkGameEnd();
}

function directAttack(owner, attackerIndex) {
  const field = owner === 'player' ? state.playerField : state.cpuField;
  const enemyField = owner === 'player' ? state.cpuField : state.playerField;
  const attacker = field[attackerIndex];

  if (!attacker || attacker.position !== 'attack' || attacker.attacked) return;
  if (enemyField.some(Boolean)) return;

  attacker.attacked = true;

  const atk = getAtk(attacker);
  damage(owner === 'player' ? 'cpu' : 'player', atk);

  setMessage(`${attacker.name}のダイレクトアタック！\n${atk}ダメージ！`);
  renderAll();
  checkGameEnd();
}

function damage(target, amount) {
  if (target === 'player') {
    state.playerLp -= amount;
  } else {
    state.cpuLp -= amount;
  }
}

function endPlayerTurn() {
  if (state.gameOver || state.turn !== 'player') return;

  state.turn = 'cpu';
  state.selectedAttackerIndex = null;
  state.selectedDestroyCardIndex = null;
  state.selectedPowerupCardIndex = null;

  setMessage('CPUのターン！');
  renderAll();

  setTimeout(cpuTurn, 650);
}

function startPlayerTurn() {
  if (state.gameOver) return;

  state.turn = 'player';
  state.playerSummoned = false;
  state.playerUsedSpecial = false;
  resetAttacks(state.playerField);
  drawCard('player');

  setMessage('あなたのターン！\nカードを選ぼう。');
  renderAll();
}

function resetAttacks(field) {
  field.forEach(card => {
    if (card) card.attacked = false;
  });
}

function cpuTurn() {
  if (state.gameOver) return;

  resetAttacks(state.cpuField);
  drawCard('cpu');

  cpuUseDestroyIfUseful();
  cpuUsePowerupIfUseful();
  cpuSummonIfPossible();

  setTimeout(cpuAttackPhase, 850);
}

function cpuUseDestroyIfUseful() {
  const destroyIndex = state.cpuHand.findIndex(card => card.type === 'destroy');

  if (destroyIndex === -1) return;
  if (!state.playerField.some(Boolean)) return;

  const shouldUseDestroy = Math.random() < 0.65;

  if (!shouldUseDestroy) return;

  const targetIndex = chooseCpuDestroyTarget();
  const target = state.playerField[targetIndex];

  if (!target) return;

  state.cpuHand.splice(destroyIndex, 1);
  state.playerField[targetIndex] = null;

  setMessage(`CPUは爆弾おにぎり！\n${target.name}を破壊した！`);
  renderAll();
}

function cpuUsePowerupIfUseful() {
  const powerupIndex = state.cpuHand.findIndex(card => card.type === 'powerup');

  if (powerupIndex === -1) return;
  if (!state.cpuField.some(card => card && card.position === 'attack')) return;

  const shouldUsePowerup = Math.random() < 0.65;

  if (!shouldUsePowerup) return;

  const targetIndex = chooseCpuPowerupTarget();
  const target = state.cpuField[targetIndex];

  if (!target) return;

  const card = state.cpuHand.splice(powerupIndex, 1)[0];
  target.atkBoost = (target.atkBoost || 0) + card.boost;

  setMessage(`CPUはがめ煮！\n${target.name}のこうげきが${card.boost}アップ！`);
  renderAll();
}

function cpuSummonIfPossible() {
  const emptyIndex = state.cpuField.findIndex(slot => slot === null);
  const monsterIndex = chooseCpuMonsterIndex();

  if (emptyIndex === -1 || monsterIndex === -1) return;

  const card = state.cpuHand.splice(monsterIndex, 1)[0];

  card.position = chooseCpuPosition(card);
  card.attacked = false;
  card.atkBoost = card.atkBoost || 0;

  state.cpuField[emptyIndex] = card;

  setMessage(`CPUは${card.name}を召喚！\n${card.position === 'attack' ? '攻撃表示' : '守備表示'}`);
  renderAll();
}

function chooseCpuDestroyTarget() {
  let bestIndex = -1;
  let bestScore = -999;

  state.playerField.forEach((card, index) => {
    if (!card) return;

    const score = Math.max(getAtk(card), card.def);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function chooseCpuPowerupTarget() {
  let bestIndex = -1;
  let bestAtk = -999;

  state.cpuField.forEach((card, index) => {
    if (!card || card.position !== 'attack') return;

    const atk = getAtk(card);

    if (atk > bestAtk) {
      bestAtk = atk;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function chooseCpuMonsterIndex() {
  let bestIndex = -1;
  let bestScore = -999;

  state.cpuHand.forEach((card, index) => {
    if (card.type !== 'monster') return;

    const score = Math.max(card.atk, card.def);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function chooseCpuPosition(card) {
  if (card.id === 'kame') {
    return Math.random() < 0.55 ? 'defense' : 'attack';
  }

  if (card.def >= card.atk + 300) {
    return Math.random() < 0.55 ? 'defense' : 'attack';
  }

  return 'attack';
}

function cpuAttackPhase() {
  if (state.gameOver) return;

  const attackers = state.cpuField
    .map((card, index) => ({ card, index }))
    .filter(obj => obj.card && obj.card.position === 'attack' && !obj.card.attacked);

  if (attackers.length === 0) {
    setTimeout(startPlayerTurn, 650);
    return;
  }

  runCpuAttack(attackers, 0);
}

function runCpuAttack(attackers, i) {
  if (state.gameOver || i >= attackers.length) {
    setTimeout(startPlayerTurn, 650);
    return;
  }

  const attackerObj = attackers[i];
  const attacker = state.cpuField[attackerObj.index];

  if (!attacker || attacker.attacked) {
    runCpuAttack(attackers, i + 1);
    return;
  }

  const targetIndex = chooseCpuTarget(attacker);

  if (targetIndex === -1) {
    directAttack('cpu', attackerObj.index);
  } else {
    battle('cpu', attackerObj.index, targetIndex);
  }

  setTimeout(() => runCpuAttack(attackers, i + 1), 900);
}

function chooseCpuTarget(attacker) {
  const candidates = state.playerField
    .map((card, index) => ({ card, index }))
    .filter(obj => obj.card);

  if (candidates.length === 0) return -1;

  let best = candidates[0];
  let bestScore = -9999;

  candidates.forEach(obj => {
    const target = obj.card;
    let score = 0;

    if (target.position === 'attack') {
      score = getAtk(attacker) - getAtk(target);
    } else {
      score = getAtk(attacker) - target.def;
    }

    if (score > bestScore) {
      bestScore = score;
      best = obj;
    }
  });

  return best.index;
}

function checkGameEnd() {
  updateInfo();

  if (state.cpuLp <= 0) {
    endGame(true);
    return true;
  }

  if (state.playerLp <= 0) {
    endGame(false);
    return true;
  }

  return false;
}

function endGame(isWin) {
  state.gameOver = true;

  if (isWin) {
    $('resultImage').src = 'result_win.png';
    $('resultTitle').textContent = 'カバマスター';
    $('resultComment').textContent = 'デュエルを制した！';
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

$('endTurnBtn').addEventListener('click', endPlayerTurn);

$('retryBtn').addEventListener('click', startGame);

$('homeBtn').addEventListener('click', () => {
  window.location.href = HOME_URL;
});

$('shareBtn').addEventListener('click', shareResult);