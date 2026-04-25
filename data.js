'use strict';

function buildExpTable() {
  const t = [0, 0];
  for (let lv = 1; lv <= 98; lv++) {
    t.push(t[lv] + Math.round(4 * Math.pow(lv, 1.3)));
  }
  return t; // t[2]=4, t[10]~310, t[20]~1620, t[60]~44000, t[99]~67000
}
const EXP_TABLE = buildExpTable();

const MONSTERS = {
  // 平原
  'スライム':        { lv: 1,  hp: 12,   atk: 12,  def: 3,  exp: 4,   gold: 2,   emoji: '🟣' },
  'ドラキー':        { lv: 3,  hp: 22,   atk: 20,  def: 5,  exp: 9,   gold: 5,   emoji: '🦇' },
  'おおありくい':    { lv: 5,  hp: 38,   atk: 30,  def: 8,  exp: 15,  gold: 8,   emoji: '🐜' },
  'キメラ':          { lv: 7,  hp: 55,   atk: 42,  def: 12, exp: 22,  gold: 12,  emoji: '🦅' },
  'リザードマン':    { lv: 9,  hp: 72,   atk: 56,  def: 16, exp: 30,  gold: 16,  emoji: '🦎' },
  'ゴーレム':        { lv: 12, hp: 320,  atk: 88,  def: 32, exp: 110, gold: 65,  emoji: '🗿', isMidBoss: true },
  // 暗黒洞窟
  'メタルスライム':  { lv: 15, hp: 6,    atk: 30,  def: 120,exp: 150, gold: 55,  emoji: '⚪' },
  'オーク':          { lv: 12, hp: 82,   atk: 58,  def: 18, exp: 30,  gold: 18,  emoji: '👹' },
  'スライムベス':    { lv: 14, hp: 92,   atk: 54,  def: 20, exp: 35,  gold: 20,  emoji: '🟢', usesPoison: true },
  'トロル':          { lv: 16, hp: 118,  atk: 72,  def: 24, exp: 46,  gold: 27,  emoji: '👺' },
  'ポイズントード':  { lv: 18, hp: 108,  atk: 68,  def: 23, exp: 42,  gold: 25,  emoji: '🐸', usesPoison: true },
  'スカルナイト':    { lv: 20, hp: 132,  atk: 82,  def: 30, exp: 55,  gold: 34,  emoji: '⚔️' },
  'アンデッド':      { lv: 24, hp: 162,  atk: 98,  def: 36, exp: 72,  gold: 45,  emoji: '🧟' },
  'ボストロール':    { lv: 28, hp: 620,  atk: 165, def: 52, exp: 180, gold: 105, emoji: '👾', isMidBoss: true },
  // 魔王の城
  'デスナイト':      { lv: 28, hp: 168,  atk: 102, def: 40, exp: 85,  gold: 70,  emoji: '💀' },
  'キラーマシン':    { lv: 32, hp: 202,  atk: 118, def: 48, exp: 110, gold: 92,  emoji: '🤖' },
  'デスバイパー':    { lv: 34, hp: 185,  atk: 110, def: 44, exp: 98,  gold: 81,  emoji: '🐍', usesPoison: true },
  'ドラゴン':        { lv: 36, hp: 235,  atk: 128, def: 54, exp: 132, gold: 105, emoji: '🐉' },
  'ダースドラゴン':  { lv: 42, hp: 288,  atk: 148, def: 65, exp: 158, gold: 130, emoji: '🔥' },
  'キングサーペント':{ lv: 44, hp: 268,  atk: 142, def: 60, exp: 145, gold: 122, emoji: '🦂', usesPoison: true },
  // メタル系
  'メタルキング':    { lv: 50, hp: 10,   atk: 75,  def: 255,exp: 2500,gold: 500, emoji: '👑' },
  // ボス
  '魔王ゾーマ':      { lv: 60, hp: 750,  atk: 165, def: 58, exp: 0,   gold: 0,   emoji: '👿', isBoss: true, usesPoison: true },
  '深淵の魔神':      { lv: 90, hp: 6000, atk: 420, def: 130,exp: 0,   gold: 0,   emoji: '🌑', isBoss: true, isSecretBoss: true, usesPoison: true },
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
  'ホイミ':   { mp: 4,   type: 'heal',      power: 35, lv: 3,  desc: 'HPを回復（LVで増加）' },
  'ギラ':     { mp: 6,   type: 'fire',      power: 40, lv: 5,  desc: '炎で攻撃' },
  'ベギラマ': { mp: 12,  type: 'fire',      power: 90, lv: 10, desc: '強炎で攻撃' },
  'デス！':   { mp: 450, type: 'instakill', power: 0,  lv: 99, desc: '必中の即死呪文' },
};

const ITEMS = {
  'やくそう':     { buy: 10, type: 'heal',  power: 35, desc: 'HP+35' },
  'どくけしそう': { buy: 12, type: 'cure',  power: 0,  desc: '毒を治す' },
  '幸運の粉':     { buy: 50, type: 'lucky', power: 0,  desc: 'ふしぎな　こな' },
};

const SHOP_BY_AREA = [
  ['やくそう', 'どくけしそう', '幸運の粉'],
  ['やくそう', 'どくけしそう', '幸運の粉'],
  ['やくそう', '幸運の粉'],
];

const WEAPONS = [
  { name: '木の棒',   atk: 0,   buy: 0    },
  { name: '銅の剣',   atk: 12,  buy: 80   },
  { name: '鉄の剣',   atk: 28,  buy: 350  },
  { name: '魔法の剣',   atk: 55,  buy: 1200 },
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
