'use strict';

// ===== ゲーム状態 =====
let player = null;
let enemy = null;
let battlePhase = 'cmd';
let cmds = [];
let sel = 0;
let typing = false;
let typingTimer = null;
let startTime = 0;
let spellMenuPresses = 0;
let brokeInnCount = 0;
let equipBrowseCounts = { weapon: 0, armor: 0, shield: 0 };

function newPlayer() {
  return {
    hp: 45, maxHp: 45,
    mp: 15, maxMp: 15,
    lv: 1, exp: 0, gold: 60,
    atk: 16, def: 8,
    items: [{ name: 'やくそう', n: 2 }],
    spells: [],
    equipped: { weapon: '木の棒', armor: '布の服', shield: null },
    soldOut: { weapon: [], armor: [], shield: [] },
    area: 0,
    kills: 0,
    midBossDefeated: [false, false],
    fieldEncounters: 0,
    darkCaveToggle: 0,
    bonusTime: 0,
    cheated: false,
    poisoned: false,
  };
}

// ===== ユーティリティ =====
function rand(n) { return Math.floor(Math.random() * n); }

function damage(atk, def) {
  const base = Math.max(1, atk - def);
  return base + rand(Math.max(1, Math.floor(base * 0.25)));
}

function hpClass(hp, max) {
  if (hp / max > 0.5) return 'hp-hi';
  if (hp / max > 0.25) return 'hp-md';
  return 'hp-lo';
}

function getElapsedMs() { return Date.now() - startTime + player.bonusTime; }
function isOvertime()   { return getElapsedMs() > 24 * 3600 * 1000; }

// ===== UI ユーティリティ =====
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

function msgEl() {
  const b = document.getElementById('screen-battle');
  return b.classList.contains('active')
    ? document.getElementById('battle-message')
    : document.getElementById('explore-message');
}

function typeMsg(text, cb) {
  const el = msgEl();
  if (!el) { cb && cb(); return; }
  if (typingTimer) clearInterval(typingTimer);
  el.innerHTML = '';
  typing = true;
  let i = 0;
  const chars = [...text];
  typingTimer = setInterval(() => {
    if (i >= chars.length) {
      clearInterval(typingTimer);
      typing = false;
      if (cb) setTimeout(cb, 350);
      return;
    }
    const c = chars[i++];
    if (c === '\n') el.appendChild(document.createElement('br'));
    else el.appendChild(document.createTextNode(c));
  }, 35);
}

function skipTyping() {
  if (!typing || !typingTimer) return;
  clearInterval(typingTimer);
  typing = false;
}

let msgQ = [];
function qMsg(msgs, cb) { msgQ = [...msgs]; nextMsg(cb); }
function nextMsg(cb) {
  if (!msgQ.length) { cb && cb(); return; }
  typeMsg(msgQ.shift(), () => nextMsg(cb));
}

function renderCmds(id) {
  const el = document.getElementById(id);
  el.innerHTML = '';
  cmds.forEach((c, i) => {
    const d = document.createElement('div');
    d.className = 'cmd-item' + (i === sel ? ' selected' : '');
    d.textContent = c.label;
    d.addEventListener('click', () => { if (typing) { skipTyping(); return; } sel = i; c.fn(); });
    el.appendChild(d);
  });
}

function clearCmds(id) { document.getElementById(id).innerHTML = ''; }

function shakeEnemy() {
  const el = document.getElementById('enemy-emoji');
  el.style.animation = 'none';
  el.classList.add('shake');
  setTimeout(() => { el.classList.remove('shake'); el.style.animation = ''; }, 450);
}
function shakePlayer() {
  const el = document.getElementById('battle-status');
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 450);
}

// ===== レベルアップ =====
function checkLevelUp() {
  const msgs = [];
  while (player.lv < 99 && player.exp >= EXP_TABLE[player.lv + 1]) {
    player.lv++;
    // 幸運の粉を1個以上持っている場合は成長量が最大値になる
    const hasLuck = player.items.some(i => i.name === '幸運の粉' && i.n > 0);
    const hg = hasLuck ? 17 : 10 + rand(8);
    const mg = hasLuck ? 7  : 4 + rand(4);
    const ag = hasLuck ? 5  : 3 + rand(3);
    const dg = hasLuck ? 3  : 2 + rand(2);
    player.maxHp += hg; player.hp = Math.min(player.hp + hg, player.maxHp);
    player.maxMp += mg; player.mp = Math.min(player.mp + mg, player.maxMp);
    player.atk += ag; player.def += dg;
    const luckTag = hasLuck ? '（幸運の粉効果：最大成長！）' : '';
    msgs.push(`レベルが　${player.lv}に　あがった！${luckTag}`);
    msgs.push(`HP+${hg}　MP+${mg}　こうげき+${ag}　まもり+${dg}`);
    Object.entries(SPELLS).forEach(([name, s]) => {
      if (s.lv === player.lv && !player.spells.includes(name)) {
        player.spells.push(name);
        msgs.push(`「${name}」を　おぼえた！`);
      }
    });
  }
  return msgs;
}

// ===== チート: LV99最小値カンスト =====
// 通常レベル上げで全て最小値だった場合のLV99ステータス（初期値 + 98レベル×最小成長）
// LV99最小: HP=1025, MP=407, ATK=310, DEF=204
// ロト全装備込みで深淵の魔神がギリギリ倒せるバランス
function maxOutStats() {
  const weaponBonus = player.equipped.weapon ? (findEquip(player.equipped.weapon)?.atk || 0) : 0;
  const armorBonus  = player.equipped.armor  ? (findEquip(player.equipped.armor)?.def  || 0) : 0;
  const shieldBonus = player.equipped.shield ? (findEquip(player.equipped.shield)?.def  || 0) : 0;
  player.maxHp = 45 + 98 * 10; // 1025
  player.hp    = player.maxHp;
  player.maxMp = 15 + 98 * 4;  // 407
  player.mp    = player.maxMp;
  player.atk   = (16 + 98 * 3) + weaponBonus;  // 310 + 装備
  player.def   = (8  + 98 * 2) + armorBonus + shieldBonus;  // 204 + 装備
  player.lv = 99; player.exp = EXP_TABLE[99];
  player.gold += 99999;
  player.spells = Object.keys(SPELLS);
  player.midBossDefeated = [true, true];
  player.cheated = true;
}

// ===== ゲームクリア =====
function gameClear(isSecret = false) {
  const sec = Math.floor(getElapsedMs() / 1000);
  const eq = player.equipped;
  const titleEl = document.querySelector('#screen-clear h2');
  const subEl   = document.querySelector('#screen-clear .clear-sub');
  if (titleEl) titleEl.textContent = isSecret ? '🌟 真のエンディング！ 🌟' : '🏆 おめでとう！ 🏆';
  if (subEl)   subEl.textContent   = isSecret
    ? '深淵の魔神を倒し、真の平和が訪れた！'
    : 'せかいに　へいわが　もどった！';
  document.getElementById('clear-stats').innerHTML =
    `レベル: ${player.lv}<br>` +
    `たおしたモンスター: ${player.kills}ひき<br>` +
    `武器: ${eq.weapon || 'なし'}　鎧: ${eq.armor || 'なし'}　盾: ${eq.shield || 'なし'}<br>` +
    `プレイ時間: ${Math.floor(sec / 60)}分${sec % 60}秒` +
    (player.cheated ? '<br><span style="color:#ff8844">※チート使用</span>' : '') +
    (isOvertime() ? '<br><span style="color:#8844ff">※タイムシフト使用</span>' : '');
  show('clear');
}

// ===== 入力 =====
document.addEventListener('keydown', e => {
  const active = document.querySelector('.screen.active');
  if (!active) return;
  const id = active.id;
  if (id === 'screen-title') { if (e.key === 'Enter' || e.key === ' ') startGame(); return; }
  if (id === 'screen-gameover' || id === 'screen-clear') { if (e.key === 'Enter' || e.key === ' ') show('title'); return; }
  if (typing) { if (e.key === 'Enter' || e.key === 'z' || e.key === ' ') skipTyping(); return; }
  const listId = id === 'screen-battle' ? 'battle-cmd-list' : 'explore-cmd-list';
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    sel = (sel - 1 + cmds.length) % cmds.length;
    renderCmds(listId);
    e.preventDefault();
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    sel = (sel + 1) % cmds.length;
    renderCmds(listId);
    e.preventDefault();
  } else if (e.key === 'Enter' || e.key === 'z' || e.key === 'Z') {
    cmds[sel]?.fn();
  } else if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
    if (id === 'screen-explore') setExploreCmds();
    else if (id === 'screen-battle' && battlePhase === 'cmd') setBattleCmds();
  }
});

document.getElementById('screen-title').addEventListener('click', startGame);
document.getElementById('screen-gameover').addEventListener('click', () => show('title'));
document.getElementById('screen-clear').addEventListener('click', () => show('title'));

function startGame() {
  player = newPlayer();
  spellMenuPresses = 0;
  brokeInnCount = 0;
  equipBrowseCounts = { weapon: 0, armor: 0, shield: 0 };
  startTime = Date.now();
  showExplore();
}
