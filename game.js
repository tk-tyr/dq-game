'use strict';

// ===== EXP テーブル (lv 1-99) =====
// t[lv] = そのレベルに到達するために必要な累積EXP
function buildExpTable() {
  const t = [0, 0]; // t[1]=0: lv1には0EXPで到達
  for (let lv = 1; lv <= 98; lv++) {
    t.push(t[lv] + Math.round(20 * Math.pow(lv, 1.3)));
  }
  return t; // t[2]=20, t[10]~1550, t[20]~8100, t[60]~220000, t[99]~267000
}
const EXP_TABLE = buildExpTable();

// ===== モンスターデータ =====
const MONSTERS = {
  // 平原
  'スライム':        { lv: 1,  hp: 8,    atk: 8,   def: 2,  exp: 3,   gold: 2,   emoji: '🟣' },
  'ドラキー':        { lv: 3,  hp: 14,   atk: 14,  def: 3,  exp: 6,   gold: 4,   emoji: '🦇' },
  'おおありくい':    { lv: 5,  hp: 25,   atk: 20,  def: 5,  exp: 10,  gold: 6,   emoji: '🐜' },
  'キメラ':          { lv: 7,  hp: 32,   atk: 24,  def: 6,  exp: 13,  gold: 9,   emoji: '🦅' },
  'リザードマン':    { lv: 9,  hp: 38,   atk: 28,  def: 8,  exp: 17,  gold: 11,  emoji: '🦎' },
  // 平原 中ボス
  'ゴーレム':        { lv: 12, hp: 70,   atk: 30,  def: 14, exp: 70,  gold: 50,  emoji: '🗿', isMidBoss: true },
  // 暗黒洞窟
  'メタルスライム':  { lv: 15, hp: 4,    atk: 20,  def: 100,exp: 60,  gold: 30,  emoji: '⚪' },
  'オーク':          { lv: 12, hp: 40,   atk: 30,  def: 10, exp: 18,  gold: 12,  emoji: '👹' },
  'トロル':          { lv: 16, hp: 65,   atk: 42,  def: 15, exp: 30,  gold: 18,  emoji: '👺' },
  'スライムベス':    { lv: 14, hp: 45,   atk: 25,  def: 10, exp: 20,  gold: 15,  emoji: '🟢', usesPoison: true },
  'ポイズントード':  { lv: 18, hp: 55,   atk: 32,  def: 12, exp: 26,  gold: 18,  emoji: '🐸', usesPoison: true },
  'スカルナイト':    { lv: 20, hp: 58,   atk: 40,  def: 14, exp: 28,  gold: 22,  emoji: '⚔️' },
  'アンデッド':      { lv: 24, hp: 72,   atk: 48,  def: 18, exp: 36,  gold: 26,  emoji: '🧟' },
  // 暗黒洞窟 中ボス
  'ボストロール':    { lv: 28, hp: 120,  atk: 52,  def: 20, exp: 120, gold: 70,  emoji: '👾', isMidBoss: true },
  // 魔王の城
  'デスナイト':      { lv: 28, hp: 90,   atk: 58,  def: 22, exp: 55,  gold: 35,  emoji: '💀' },
  'キラーマシン':    { lv: 32, hp: 105,  atk: 66,  def: 28, exp: 72,  gold: 48,  emoji: '🤖' },
  'ドラゴン':        { lv: 36, hp: 120,  atk: 72,  def: 30, exp: 90,  gold: 55,  emoji: '🐉' },
  'ダースドラゴン':  { lv: 42, hp: 145,  atk: 80,  def: 36, exp: 105, gold: 68,  emoji: '🔥' },
  'デスバイパー':    { lv: 34, hp: 95,   atk: 62,  def: 24, exp: 65,  gold: 42,  emoji: '🐍', usesPoison: true },
  'キングサーペント':{ lv: 44, hp: 130,  atk: 78,  def: 34, exp: 95,  gold: 62,  emoji: '🦂', usesPoison: true },
  // メタル系
  'メタルキング':    { lv: 50, hp: 8,    atk: 55,  def: 255,exp: 600, gold: 200, emoji: '👑' },
  // ラスボス
  '魔王ゾーマ':      { lv: 60, hp: 250,  atk: 100, def: 30, exp: 0,   gold: 0,   emoji: '👿', isBoss: true, usesPoison: true },
  // 裏ボス
  '深淵の魔神':      { lv: 90, hp: 3000, atk: 330, def: 80, exp: 0,   gold: 0,   emoji: '🌑', isBoss: true, isSecretBoss: true, usesPoison: true },
};

const AREAS = [
  {
    name: '平原',     emoji: '🌿',
    desc: '広大な平原が広がっている。\nスライムやドラキーが出没する。',
    monsters: ['スライム', 'ドラキー', 'おおありくい', 'キメラ', 'リザードマン'],
    hasTown: true, nextArea: 1, nextName: '暗黒洞窟',
    midBoss: 'ゴーレム', midBossIdx: 0,
    midBossDesc: '平原の　はずれで\nゴーレムが　たちはだかった！',
  },
  {
    name: '暗黒洞窟', emoji: '⛏',
    desc: '薄暗い洞窟が続いている。\n強力なモンスターが潜んでいる。',
    monsters: ['オーク', 'トロル', 'スライムベス', 'ポイズントード', 'スカルナイト', 'アンデッド'],
    hasTown: false, nextArea: 2, nextName: '魔王の城',
    prevArea: 0, prevName: '平原',
    midBoss: 'ボストロール', midBossIdx: 1,
    midBossDesc: '洞窟の最深部で\nボストロールが立ちはだかった！',
  },
  {
    name: '魔王の城', emoji: '🏰',
    desc: '邪悪な気配が漂う城だ。\n最奥に魔王ゾーマが待ち構えている。',
    monsters: ['デスナイト', 'キラーマシン', 'ドラゴン', 'ダースドラゴン', 'デスバイパー', 'キングサーペント'],
    hasTown: false, nextArea: null, hasBoss: true,
    prevArea: 1, prevName: '暗黒洞窟',
  },
];

const SPELLS = {
  'ホイミ':     { mp: 4,  type: 'heal',     power: 35, lv: 3,  desc: 'HPを回復' },
  'ギラ':       { mp: 6,  type: 'fire',     power: 40, lv: 5,  desc: '炎で攻撃' },
  'ベギラマ':   { mp: 12, type: 'fire',     power: 90, lv: 10, desc: '強炎で攻撃' },
  'デス！':     { mp: 999,type: 'instakill',power: 0,  lv: 99, desc: '必中の即死呪文' },
};

const ITEMS = {
  'やくそう':     { buy: 10, type: 'heal',   power: 35, desc: 'HP+35' },
  'どくけしそう': { buy: 12, type: 'cure',   power: 0,  desc: '毒を治す' },
  '幸運の粉':     { buy: 50, type: 'lucky',  power: 0,  desc: 'ふしぎな　こな' },
};

const SHOP_BY_AREA = [
  ['やくそう', 'どくけしそう', '幸運の粉'],
  ['やくそう', 'どくけしそう', '幸運の粉'],
  ['やくそう', '幸運の粉'],
];

// ===== 装備データ =====
const WEAPONS = [
  { name: '木の棒',   atk: 0,   buy: 0    },
  { name: '銅の剣',   atk: 12,  buy: 80   },
  { name: '鉄の剣',   atk: 28,  buy: 350  },
  { name: '炎の剣',   atk: 55,  buy: 1200 },
  { name: 'ロトの剣', atk: 110, buy: 6000 },
];
const ARMORS = [
  { name: '布の服',   def: 0,   buy: 0    },
  { name: '革の鎧',   def: 8,   buy: 120  },
  { name: '鉄の鎧',   def: 20,  buy: 600  },
  { name: '魔法の鎧', def: 38,  buy: 2000 },
  { name: 'ロトの鎧', def: 75,  buy: 9000 },
];
const SHIELDS = [
  { name: '木の盾',   def: 5,   buy: 50   },
  { name: '鉄の盾',   def: 14,  buy: 300  },
  { name: '魔法の盾', def: 25,  buy: 1000 },
  { name: 'ロトの盾', def: 50,  buy: 5000 },
];

function findEquip(name) {
  return [...WEAPONS, ...ARMORS, ...SHIELDS].find(e => e.name === name) || null;
}

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

function newPlayer() {
  return {
    hp: 35, maxHp: 35,
    mp: 12, maxMp: 12,
    lv: 1, exp: 0, gold: 60,
    atk: 14, def: 6,
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

// ===== レベルアップ (最大lv99) =====
function checkLevelUp() {
  const msgs = [];
  while (player.lv < 99 && player.exp >= EXP_TABLE[player.lv + 1]) {
    player.lv++;
    const hg = 8 + rand(6), mg = 3 + rand(3), ag = 2 + rand(3), dg = 1 + rand(2);
    player.maxHp += hg; player.hp = Math.min(player.hp + hg, player.maxHp);
    player.maxMp += mg; player.mp = Math.min(player.mp + mg, player.maxMp);
    player.atk += ag; player.def += dg;
    msgs.push(`レベルが　${player.lv}に　あがった！`);
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

// ===== チート: ステータスカンスト =====
function maxOutStats() {
  player.maxHp = 999; player.hp = 999;
  player.maxMp = 999; player.mp = 999;
  player.atk = 250; player.def = 120;
  player.lv = 99; player.exp = EXP_TABLE[99];
  player.gold += 99999;
  player.spells = Object.keys(SPELLS);
  player.midBossDefeated = [true, true];
  player.cheated = true;
}

// ===== 装備システム =====
function equipItem(item) {
  const type = WEAPONS.find(w => w.name === item.name) ? 'weapon'
             : ARMORS.find(a => a.name === item.name)  ? 'armor' : 'shield';
  const oldName = player.equipped[type];
  if (oldName) {
    const old = findEquip(oldName);
    if (old) {
      if (type === 'weapon') player.atk -= old.atk;
      else player.def -= old.def;
    }
  }
  player.equipped[type] = item.name;
  if (type === 'weapon') player.atk += item.atk;
  else player.def += item.def;
}

function doEquipShop() {
  resetCaveToggle();
  const eq = player.equipped;
  cmds = [
    { label: '武器を　かう', fn: () => doEquipCategory('weapon') },
    { label: '鎧を　かう',   fn: () => doEquipCategory('armor') },
    { label: '盾を　かう',   fn: () => doEquipCategory('shield') },
    { label: 'やめる', fn: () => { setExploreCmds(); typeMsg('またきてね！'); } },
  ];
  sel = 0;
  renderCmds('explore-cmd-list');
  typeMsg(
    `ぼうぐや　いらっしゃい！\nおカネ: ${player.gold}G\n` +
    `武器: ${eq.weapon || 'なし'}　鎧: ${eq.armor || 'なし'}　盾: ${eq.shield || 'なし'}`
  );
}

function doEquipCategory(type) {
  const base = type === 'weapon' ? WEAPONS : type === 'armor' ? ARMORS : SHIELDS;
  const list = base.filter(e => e.buy > 0 && !player.soldOut[type].includes(e.name));
  if (!list.length) {
    typeMsg('この　しゅるいは　すべて　うりきれだ。', () => doEquipShop());
    return;
  }
  cmds = list.map(item => {
    const stat = type === 'weapon' ? `ATK+${item.atk}` : `DEF+${item.def}`;
    const tag  = player.equipped[type] === item.name ? '★' : '';
    return { label: `${item.name}(${item.buy}G) ${stat}${tag}`, fn: () => doBuyEquip(item, type) };
  });
  cmds.push({ label: 'もどる', fn: doEquipShop });
  sel = 0;
  renderCmds('explore-cmd-list');
  typeMsg(`現在の装備: ${player.equipped[type] || 'なし'}\nなにを　かいますか？`);
}

function doBuyEquip(item, type) {
  if (player.gold < item.buy) { typeMsg('おカネが　たりない！'); return; }
  const oldAtk = player.atk, oldDef = player.def;
  player.gold -= item.buy;

  // 購入したアイテムとそれ以下のティアを全て売り切れにする
  const base = type === 'weapon' ? WEAPONS : type === 'armor' ? ARMORS : SHIELDS;
  const idx = base.findIndex(e => e.name === item.name);
  for (let i = 0; i <= idx; i++) {
    if (base[i].buy > 0 && !player.soldOut[type].includes(base[i].name)) {
      player.soldOut[type].push(base[i].name);
    }
  }

  equipItem(item);
  updateExploreUI();
  const diff = type === 'weapon' ? `こうげき: ${oldAtk} → ${player.atk}` : `まもり: ${oldDef} → ${player.def}`;
  typeMsg(`${item.name}を　そうびした！\n${diff}　（うりきれ）`);
}

function doCheckEquip() {
  resetCaveToggle();
  const eq = player.equipped;
  const wa = eq.weapon ? (findEquip(eq.weapon)?.atk || 0) : 0;
  const aa = eq.armor  ? (findEquip(eq.armor)?.def  || 0) : 0;
  const sa = eq.shield ? (findEquip(eq.shield)?.def  || 0) : 0;

  const itemLines = Object.keys(ITEMS).map(name => {
    const inv = player.items.find(i => i.name === name);
    const n = inv ? inv.n : 0;
    return `${name}: ${n}/7`;
  }).join('　');

  typeMsg(
    `【装備中】\n` +
    `⚔ 武器: ${eq.weapon || 'なし'}(ATK+${wa})\n` +
    `🛡 鎧:　 ${eq.armor  || 'なし'}(DEF+${aa})\n` +
    `🔰 盾:　 ${eq.shield || 'なし'}(DEF+${sa})\n` +
    `ATK: ${player.atk}　DEF: ${player.def}\n` +
    `【道具】\n` +
    itemLines
  );
}

// ===== バトル =====
function startBattle(monName) {
  const d = MONSTERS[monName];
  enemy = {
    name: monName, hp: d.hp, maxHp: d.hp,
    atk: d.atk, def: d.def, exp: d.exp, gold: d.gold, emoji: d.emoji,
    isBoss: d.isBoss || false, isMidBoss: d.isMidBoss || false,
    isSecretBoss: d.isSecretBoss || false, healSelf: d.healSelf || false,
    usesPoison: d.usesPoison || false,
  };

  // メタル系と遭遇 → 幸運の粉を全て消費
  if (monName === 'メタルスライム' || monName === 'メタルキング') {
    const luck = player.items.find(i => i.name === '幸運の粉');
    if (luck && luck.n > 0) luck.n = 0;
  }

  battlePhase = 'cmd';
  show('battle');
  updateBattleUI();
  const tag = d.isSecretBoss ? '【裏ボス】' : d.isMidBoss ? '【中ボス】' : d.isBoss ? '【魔王】' : '';
  typeMsg(`${tag}${monName}が　あらわれた！`, () => {
    if (isOvertime()) {
      // 24時間超え: 敵が先制で哀れみのコメントをしてHP1になる
      const pitySentences = [
        `${monName}「...おぬし、　ずいぶん　くたびれているな。」`,
        `${monName}「せめて　これくらいは　してやろう。」`,
      ];
      battlePhase = 'animating';
      clearCmds('battle-cmd-list');
      qMsg(pitySentences, () => {
        enemy.hp = 1;
        updateBattleUI();
        typeMsg('敵は　じぶんのHPを　1に　した。', () => {
          battlePhase = 'cmd';
          setBattleCmds();
        });
      });
    } else {
      setBattleCmds();
    }
  });
}

function updateBattleUI() {
  document.getElementById('enemy-emoji').textContent = enemy.emoji;
  document.getElementById('enemy-name-label').textContent =
    (enemy.isSecretBoss ? '【裏ボス】' : enemy.isMidBoss ? '【中ボス】' : enemy.isBoss ? '【魔王】' : '') + enemy.name;
  const pct = enemy.hp / enemy.maxHp;
  const fill = document.getElementById('enemy-hp-fill');
  fill.style.width = (pct * 100) + '%';
  fill.style.background = pct > 0.5 ? '#44ff44' : pct > 0.25 ? '#ffff44' : '#ff4444';
  document.getElementById('enemy-hp-text').textContent = `HP: ${enemy.hp}/${enemy.maxHp}`;

  const bHp = document.getElementById('b-hp');
  bHp.textContent = `${player.hp}/${player.maxHp}${player.poisoned ? ' ☠' : ''}`;
  bHp.className = hpClass(player.hp, player.maxHp);
  document.getElementById('b-mp').textContent = `${player.mp}/${player.maxMp}`;
  document.getElementById('b-lv').textContent = player.lv;
}

function setBattleCmds() {
  if (battlePhase !== 'cmd') return;
  cmds = [
    { label: 'たたかう', fn: doAtk },
    { label: 'じゅもん', fn: openSpells },
    { label: 'どうぐ',   fn: openItems },
    { label: 'にげる',   fn: doRun },
  ];
  sel = 0;
  renderCmds('battle-cmd-list');
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

// チート1: じゅもん7回連続 → 敵HP1 (ボス/裏ボスは逆効果: 自分のHP・MPが1に)
function openSpells() {
  spellMenuPresses++;
  if (spellMenuPresses >= 7) {
    spellMenuPresses = 0;
    clearCmds('battle-cmd-list');
    battlePhase = 'animating';

    if (enemy.isBoss || enemy.isSecretBoss) {
      // ボス・裏ボスへのチートは特別演出: プレイヤーのHP・MPが1になる
      qMsg([
        'じゅもんが　ゆがんで　はねかえった！',
        `${enemy.name}「ふははは！\nその　ちからは　わしには　きかぬ！」`,
        'ゆうしゃは　せいめいりょくを　うばわれた！',
      ], () => {
        player.hp = 1;
        player.mp = 1;
        updateBattleUI();
        shakePlayer();
        typeMsg('HP・MPが　1に　なった！', () => {
          battlePhase = 'cmd';
          setBattleCmds();
        });
      });
    } else {
      // 通常敵: 敵のHPが1になる
      enemy.hp = 1;
      updateBattleUI();
      typeMsg('なにか　ふしぎな　ちからが　はたらいた！\n敵の　HPが　1に　なった！', () => {
        battlePhase = 'cmd';
        setBattleCmds();
      });
    }
    return;
  }
  if (!player.spells.length) {
    typeMsg('まだ　じゅもんを　しらない。', () => setBattleCmds());
    return;
  }
  cmds = player.spells.map(n => ({ label: `${n}(MP:${SPELLS[n].mp})`, fn: () => doSpell(n) }));
  cmds.push({ label: 'もどる', fn: setBattleCmds });
  sel = 0;
  renderCmds('battle-cmd-list');
}

function doAtk() {
  spellMenuPresses = 0;
  battlePhase = 'animating';
  clearCmds('battle-cmd-list');

  // 24時間超え: 全ての敵がわざと負ける
  if (isOvertime()) {
    enemy.hp = 0;
    updateBattleUI();
    typeMsg(`${enemy.name}は　たたかうのを　やめた。\n「もう　まいった...」`, () => winBattle());
    return;
  }

  const dmg = damage(player.atk, enemy.def);
  enemy.hp = Math.max(0, enemy.hp - dmg);
  shakeEnemy();
  updateBattleUI();
  typeMsg(`こうげき！　${enemy.name}に　${dmg}の　ダメージ！`, () => {
    enemy.hp <= 0 ? winBattle() : enemyTurn();
  });
}

function doSpell(name) {
  spellMenuPresses = 0;
  const s = SPELLS[name];
  if (player.mp < s.mp) { typeMsg('MPが　たりない！', () => setBattleCmds()); return; }
  battlePhase = 'animating';
  clearCmds('battle-cmd-list');
  player.mp -= s.mp;
  updateBattleUI();
  if (s.type === 'heal') {
    const h = s.power + rand(15);
    player.hp = Math.min(player.maxHp, player.hp + h);
    updateBattleUI();
    typeMsg(`${name}！　HPが　${h}　かいふくした！`, () => enemyTurn());
  } else if (s.type === 'instakill') {
    shakeEnemy();
    enemy.hp = 0;
    updateBattleUI();
    typeMsg(`${name}！\n${enemy.name}は　いきたえた！`, () => winBattle());
  } else {
    const dmg = Math.max(1, s.power - Math.floor(enemy.def / 2) + rand(20));
    enemy.hp = Math.max(0, enemy.hp - dmg);
    shakeEnemy();
    updateBattleUI();
    typeMsg(`${name}！　${enemy.name}に　${dmg}の　ダメージ！`, () => {
      enemy.hp <= 0 ? winBattle() : enemyTurn();
    });
  }
}

function openItems() {
  const have = player.items.filter(i => i.n > 0 && ITEMS[i.name]?.type !== 'lucky');
  if (!have.length) { typeMsg('つかえるどうぐが　ない。', () => setBattleCmds()); return; }
  cmds = have.map(i => ({ label: `${i.name}(${i.n}コ)`, fn: () => doItem(i.name) }));
  cmds.push({ label: 'もどる', fn: setBattleCmds });
  sel = 0;
  renderCmds('battle-cmd-list');
}

function doItem(name) {
  spellMenuPresses = 0;
  const d = ITEMS[name];
  const inv = player.items.find(i => i.name === name);
  if (!inv || inv.n <= 0) return;
  battlePhase = 'animating';
  clearCmds('battle-cmd-list');
  inv.n--;
  if (d.type === 'heal') {
    player.hp = Math.min(player.maxHp, player.hp + d.power);
    updateBattleUI();
    typeMsg(`${name}を　つかった！　HP+${d.power}！`, () => enemyTurn());
  } else if (d.type === 'cure') {
    player.poisoned = false;
    updateBattleUI();
    typeMsg(`${name}を　つかった！　どくが　なおった！`, () => enemyTurn());
  }
}

function doRun() {
  spellMenuPresses = 0;
  if (enemy.isBoss || enemy.isMidBoss || rand(3) === 0) {
    typeMsg('しかし　まわりこまれた！', () => enemyTurn());
  } else {
    typeMsg('うまく　にげきった！', () => {
      enemy = null;
      show('explore');
      updateExploreUI();
      typeMsg('あぶなかった...');
    });
  }
}

function afterEnemyTurn() {
  if (player.poisoned) {
    const dmg = Math.max(1, Math.floor(player.maxHp * 0.05));
    player.hp = Math.max(0, player.hp - dmg);
    shakePlayer();
    updateBattleUI();
    typeMsg(`どくの　ダメージ！　${dmg}！`, () => {
      if (player.hp <= 0) typeMsg('どくで　ゆうしゃは　たおれた...', () => setTimeout(() => show('gameover'), 800));
      else { battlePhase = 'cmd'; setBattleCmds(); }
    });
  } else {
    battlePhase = 'cmd';
    setBattleCmds();
  }
}

function enemyTurn() {
  battlePhase = 'enemy';
  if (enemy.healSelf && enemy.hp < enemy.maxHp * 0.7 && rand(2) === 0) {
    const h = 30 + rand(20);
    enemy.hp = Math.min(enemy.maxHp, enemy.hp + h);
    updateBattleUI();
    typeMsg(`${enemy.name}は　きずを　なおした！（HP+${h}）`, () => afterEnemyTurn());
    return;
  }
  const usePoison = enemy.usesPoison && !player.poisoned && rand(3) === 0;
  const isSpecial = (enemy.isMidBoss || enemy.isBoss) ? rand(3) === 0 : rand(5) === 0;
  const mult = isSpecial ? (enemy.isBoss ? 1.8 : 1.5) : 1;
  const dmg = Math.max(1, Math.floor(damage(enemy.atk, player.def) * mult));
  player.hp = Math.max(0, player.hp - dmg);
  if (usePoison) player.poisoned = true;
  shakePlayer();
  updateBattleUI();
  let msg;
  if (usePoison)                                         msg = `${enemy.name}の　どくこうげき！　${dmg}の　ダメージ！\nゆうしゃは　どくに　おかされた！`;
  else if (isSpecial && (enemy.isBoss || enemy.isSecretBoss)) msg = `${enemy.name}の　とくしゅこうげき！　${dmg}の　ダメージ！`;
  else if (isSpecial && enemy.isMidBoss)                 msg = `${enemy.name}の　とくしゅこうげき！　${dmg}の　ダメージ！`;
  else                                                   msg = `${enemy.name}の　こうげき！　ゆうしゃに　${dmg}の　ダメージ！`;
  typeMsg(msg, () => {
    if (player.hp <= 0) typeMsg('ゆうしゃは　たおれた...', () => setTimeout(() => show('gameover'), 800));
    else afterEnemyTurn();
  });
}

function winBattle() {
  player.exp += enemy.exp;
  player.gold += enemy.gold;
  player.kills++;
  const wasBoss = enemy.isBoss;
  const isSecret = enemy.isSecretBoss;
  const wasMidBoss = enemy.isMidBoss;
  const midBossIdx = wasMidBoss ? AREAS[player.area].midBossIdx : -1;
  const msgs = [
    `${enemy.name}を　たおした！`,
    `${enemy.exp}けいけんちと　${enemy.gold}Gを　てにいれた！`,
    ...checkLevelUp(),
  ];
  enemy = null;
  qMsg(msgs, () => {
    if (wasBoss) {
      gameClear(isSecret);
    } else if (wasMidBoss) {
      if (midBossIdx >= 0) player.midBossDefeated[midBossIdx] = true;
      show('explore');
      updateExploreUI();
      setExploreCmds();
      typeMsg('しょうりした！　みちが　ひらけた！');
    } else {
      show('explore');
      updateExploreUI();
      typeMsg('しょうりした！');
    }
  });
}

// ===== フィールド =====
function showExplore() {
  show('explore');
  updateExploreUI();
  setExploreCmds();
  typeMsg(AREAS[player.area].desc);
}

function updateExploreUI() {
  const a = AREAS[player.area];
  document.getElementById('area-name-badge').textContent = a.name;
  document.getElementById('area-bg-art').textContent = a.emoji;

  const hp = document.getElementById('st-hp');
  hp.textContent = `HP:${player.hp}/${player.maxHp}${player.poisoned ? ' ☠' : ''}`;
  hp.className = hpClass(player.hp, player.maxHp);
  document.getElementById('st-mp').textContent = `MP:${player.mp}/${player.maxMp}`;
  document.getElementById('st-lv').textContent = `LV:${player.lv}`;
  const toNext = player.lv < 99 ? EXP_TABLE[player.lv + 1] - player.exp : 0;
  document.getElementById('st-exp').textContent = player.lv >= 99 ? 'LV:MAX' : `次LV:${Math.max(0, toNext)}`;
  document.getElementById('st-gold').textContent = `G:${player.gold}`;
}

function setExploreCmds() {
  const a = AREAS[player.area];
  cmds = [
    { label: '歩く（ランダムエンカウント）', fn: doWalk },
    { label: '装備を　確認する',             fn: doCheckEquip },
  ];
  if (a.hasTown) {
    cmds.push({ label: `宿屋（${10 + player.lv * 5}G）HP/MP全回復`, fn: doInn });
    cmds.push({ label: '道具屋', fn: doShop });
    cmds.push({ label: 'ぼうぐや', fn: doEquipShop });
  }
  if (a.hasBoss) cmds.push({ label: '魔王ゾーマに　いどむ！', fn: doBoss });
  if (a.nextArea !== null) {
    const midOk = !a.midBoss || player.midBossDefeated[a.midBossIdx];
    cmds.push({ label: midOk ? `→ ${a.nextName}へ` : `→ ${a.nextName}（中ボスを倒せ）`, fn: doMove });
  }
  if (a.prevArea !== undefined) {
    cmds.push({ label: `← ${a.prevName}へ戻る`, fn: doMoveBack });
  }
  sel = 0;
  renderCmds('explore-cmd-list');
}

// ===== 出現敵を選択 =====
function pickEnemy(area, playerLv) {
  const monsters = AREAS[area].monsters;
  if (area === 0) {
    // 平原: プレイヤーLVより3以上低い敵は出現しない
    const eligible = monsters.filter(m => MONSTERS[m].lv >= playerLv - 2);
    const pool = eligible.length ? eligible : [monsters[monsters.length - 1]];
    return pool[rand(pool.length)];
  }
  // 暗黒洞窟・魔王の城: レベルが近いほど高確率で出現
  const weights = monsters.map(m => Math.max(1, 10 - Math.abs(MONSTERS[m].lv - playerLv)));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rand(total);
  for (let i = 0; i < monsters.length; i++) {
    r -= weights[i];
    if (r < 0) return monsters[i];
  }
  return monsters[monsters.length - 1];
}

// ===== 歩く（特殊条件判定つき） =====
function doWalk() {
  resetCaveToggle();
  const a = AREAS[player.area];

  // フィールドでの毒ダメージ
  if (player.poisoned) {
    const dmg = Math.max(1, Math.floor(player.maxHp * 0.03));
    player.hp = Math.max(1, player.hp - dmg);
    updateExploreUI();
    if (player.hp <= 1) {
      typeMsg(`どくで　HP1に！\nはやく　どくけしそうを！`);
      return;
    }
  }

  // 平原限定: 777回エンカウント OR (アイテム7個ずつ AND ロトの装備一式) → 裏ボス
  if (player.area === 0) {
    player.fieldEncounters++;
    const yaku = player.items.find(i => i.name === 'やくそう')?.n    || 0;
    const doku = player.items.find(i => i.name === 'どくけしそう')?.n || 0;
    const luck = player.items.find(i => i.name === '幸運の粉')?.n    || 0;
    const hasRotoEquip = player.equipped.weapon === 'ロトの剣' &&
                         player.equipped.armor  === 'ロトの鎧' &&
                         player.equipped.shield === 'ロトの盾';
    const itemCondition = yaku >= 7 && doku >= 7 && luck >= 7 && hasRotoEquip;

    if (itemCondition || player.fieldEncounters >= 777) {
      if (player.fieldEncounters >= 777) player.fieldEncounters = 0;
      typeMsg('大地が　ふるえた...\n深淵の魔神が　あらわれた！', () => startBattle('深淵の魔神'));
      return;
    }
    // 平原では幸運の粉は無効（ランダムエンカウントのみ）
  } else if (player.area === 1) {
    // 暗黒洞窟: 幸運の粉7個 → メタルスライム確定
    const luckInv = player.items.find(i => i.name === '幸運の粉');
    if (luckInv && luckInv.n >= 7) {
      luckInv.n = 0;
      typeMsg('幸運の粉が　かがやいた！\nメタルスライムが　あらわれた！', () => startBattle('メタルスライム'));
      return;
    }
    // 暗黒洞窟: 5回に1回メタルスライムが出現
    if (rand(5) === 0) {
      typeMsg('なにかが　ひかっている！\nメタルスライムが　あらわれた！', () => startBattle('メタルスライム'));
      return;
    }
  } else if (player.area === 2) {
    // 魔王の城: 幸運の粉7個 → メタルキング確定
    const luckInv = player.items.find(i => i.name === '幸運の粉');
    if (luckInv && luckInv.n >= 7) {
      luckInv.n = 0;
      typeMsg('幸運の粉が　きんいろに　ひかった！\nメタルキングが　あらわれた！', () => startBattle('メタルキング'));
      return;
    }
  }

  if (Math.random() < 0.65) {
    const m = pickEnemy(player.area, player.lv);
    typeMsg(`${m}に　であった！`, () => startBattle(m));
  } else {
    typeMsg('このあたりは　しずかだ。', () => updateExploreUI());
  }
}

// 暗黒洞窟連続往来カウントをリセット（移動以外の操作を行ったとき）
function resetCaveToggle() { player.darkCaveToggle = 0; }

// ===== エリア移動 (暗黒洞窟連続往来カウント付き) =====
function handleCaveToggle(from, to) {
  if (from !== 1 && to !== 1) return false;
  player.darkCaveToggle++;
  if (player.darkCaveToggle % 7 === 0) {
    player.bonusTime += 24 * 3600 * 1000;
    return true; // 時間チート発動
  }
  return false;
}

function doMove() {
  const a = AREAS[player.area];
  if (a.nextArea === null) return;
  if (a.midBoss && !player.midBossDefeated[a.midBossIdx]) {
    typeMsg(a.midBossDesc, () => startBattle(a.midBoss));
    return;
  }
  const from = player.area;
  player.area = a.nextArea;
  if (handleCaveToggle(from, player.area)) {
    showExplore();
    typeMsg('時間の　ながれが　おかしくなった...\nプレイ時間が　24時間　すすんだ！');
  } else {
    showExplore();
  }
}

function doMoveBack() {
  const a = AREAS[player.area];
  if (a.prevArea === undefined) return;
  const from = player.area;
  player.area = a.prevArea;
  if (handleCaveToggle(from, player.area)) {
    showExplore();
    typeMsg('時間の　ながれが　おかしくなった...\nプレイ時間が　24時間　すすんだ！');
  } else {
    showExplore();
  }
}

// チート2: 所持金なしで宿屋7回連続 → 特別シナリオ＋カンスト
function doInn() {
  resetCaveToggle();
  const cost = 10 + player.lv * 5;
  if (player.gold < cost) {
    brokeInnCount++;
    if (brokeInnCount >= 7) {
      brokeInnCount = 0;
      qMsg([
        `おカネが　たりない！（${cost}G　ひつよう）`,
        '....',
        'ん？　うしろに　だれかが　いる...',
        '「わかものよ。\nそんなに　くるしいのかい？」',
        '白いひげの　ろうじんが　あらわれた。',
        '「わしは　この　くにの　まほうつかいじゃ。」',
        '「おぬしの　ゆうかんさを　みていたよ。」',
        '「このちからを　うけとりなさい！」',
        '★★★　ステータスが　カンストした！　★★★',
      ], () => {
        maxOutStats();
        updateExploreUI();
        setExploreCmds();
        typeMsg('ゆうしゃの　ちからが　かんせいした！\n（チート使用が　きろくされました）');
      });
      return;
    }
    typeMsg(`おカネが　たりない！（${cost}G　ひつよう）`);
    return;
  }
  brokeInnCount = 0;
  player.gold -= cost;
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  updateExploreUI();
  typeMsg(`ゆっくり　おやすみください...\nHP・MPが　全回復した！（${cost}G）`);
}

function doShop() {
  resetCaveToggle();
  const stock = SHOP_BY_AREA[player.area];
  cmds = stock.map(name => ({
    label: `${name}（${ITEMS[name].buy}G）　${ITEMS[name].desc}`,
    fn: () => doBuy(name),
  }));
  cmds.push({ label: 'やめる', fn: () => { setExploreCmds(); typeMsg('またきてね！'); } });
  sel = 0;
  renderCmds('explore-cmd-list');
  typeMsg(`いらっしゃい！　おカネは　${player.gold}G　あります。`);
}

function doBuy(name) {
  const price = ITEMS[name].buy;
  if (player.gold < price) { typeMsg('おカネが　たりない！'); return; }
  const inv = player.items.find(i => i.name === name);
  if (inv && inv.n >= 7) { typeMsg(`${name}は　これ以上　もてない！（最大7個）`); return; }
  player.gold -= price;
  if (inv) inv.n++; else player.items.push({ name, n: 1 });
  updateExploreUI();
  typeMsg(`${name}を　かった！　（のこり　${player.gold}G）`);
}

function doBoss() {
  resetCaveToggle();
  typeMsg('魔王ゾーマの　もとへ　むかう...', () => startBattle('魔王ゾーマ'));
}

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
  startTime = Date.now();
  showExplore();
}
