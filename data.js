'use strict';

function buildExpTable() {
  const t = [0, 0];
  for (let lv = 1; lv <= 98; lv++) {
    t.push(t[lv] + Math.round(2 * Math.pow(lv, 1.3)));
  }
  return t; // t[2]=2, t[10]~154, t[20]~810, t[60]~10700, t[99]~33800
}
const EXP_TABLE = buildExpTable();

const MONSTERS = {
  // 平原
  'スライム':        { lv: 1,  hp: 12,   atk: 12,  def: 3,  exp: 4,   gold: 3,   emoji: '🟣' },
  'ドラキー':        { lv: 3,  hp: 22,   atk: 20,  def: 5,  exp: 9,   gold: 8,   emoji: '🦇' },
  'おおありくい':    { lv: 5,  hp: 38,   atk: 30,  def: 8,  exp: 15,  gold: 12,  emoji: '🐜' },
  'キメラ':          { lv: 7,  hp: 55,   atk: 45,  def: 12, exp: 22,  gold: 18,  emoji: '🦅' },
  'リザードマン':    { lv: 9,  hp: 72,   atk: 50,  def: 16, exp: 30,  gold: 25,  emoji: '🦎' },
  'ゴーレム':        { lv: 12, hp: 230,  atk: 80,  def: 30, exp: 120, gold: 100, emoji: '🗿', isMidBoss: true },
  // 暗黒洞窟
  'メタルスライム':  { lv: 15, hp: 2,    atk: 30,  def: 250,exp: 130, gold: 80,  emoji: '⚪' },
  'オーク':          { lv: 12, hp: 82,   atk: 93,  def: 20, exp: 30,  gold: 28,  emoji: '👹' },
  'スライムベス':    { lv: 14, hp: 92,   atk: 89,  def: 20, exp: 35,  gold: 30,  emoji: '🟢', usesPoison: true },
  'トロル':          { lv: 16, hp: 118,  atk: 107, def: 24, exp: 46,  gold: 40,  emoji: '👺' },
  'ポイズントード':  { lv: 18, hp: 108,  atk: 100, def: 23, exp: 44,  gold: 38,  emoji: '🐸', usesPoison: true },
  'スカルナイト':    { lv: 20, hp: 132,  atk: 117, def: 30, exp: 55,  gold: 50,  emoji: '⚔️' },
  'アンデッド':      { lv: 24, hp: 162,  atk: 123, def: 35, exp: 72,  gold: 68,  emoji: '🧟' },
  'ボストロール':    { lv: 28, hp: 500,  atk: 165, def: 40, exp: 180, gold: 160, emoji: '👾', isMidBoss: true },
  // 魔王の城
  'デスナイト':      { lv: 28, hp: 168,  atk: 178, def: 40, exp: 85,  gold: 105, emoji: '💀' },
  'キラーマシン':    { lv: 32, hp: 202,  atk: 185, def: 48, exp: 110, gold: 140, emoji: '🤖' },
  'デスバイパー':    { lv: 34, hp: 185,  atk: 180, def: 44, exp: 98,  gold: 120, emoji: '🐍', usesPoison: true },
  'ドラゴン':        { lv: 36, hp: 235,  atk: 188, def: 54, exp: 132, gold: 160, emoji: '🐉' },
  'ダースドラゴン':  { lv: 42, hp: 288,  atk: 202, def: 65, exp: 158, gold: 200, emoji: '🔥' },
  'キングサーペント':{ lv: 44, hp: 300,  atk: 210, def: 68, exp: 160, gold: 225, emoji: '🦂', usesPoison: true },
  // メタル系
  'メタルキング':    { lv: 50, hp: 3,   atk: 100,  def: 500,exp: 1500,gold: 600, emoji: '👑' },
  // ボス
  '魔王ゾーマ':      { lv: 60, hp: 999,  atk: 280, def: 100, exp: 3000,   gold: 0,   emoji: '👿', isBoss: true, usesPoison: true },
  '深淵の魔神':      { lv: 90, hp: 9999, atk: 500, def: 150,exp: 0,   gold: 0,   emoji: '🌑', isBoss: true, isSecretBoss: true },
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
  'ホイミ':    { mp: 35,   type: 'heal',      power: 60,  lv: 5,  desc: 'HPを回復（LVで増加）' },
  'メラ':      { mp: 50,  type: 'fixed',     power: 100, lv: 12, desc: 'メタル系以外に固定100ダメージ' },
  'イオナズン': { mp: 60,  type: 'fixed',     power: 170, lv: 30, desc: 'メタル系以外に固定170ダメージ' },
  'ギガディン': { mp: 90,  type: 'fixed',     power: 300, lv: 45, desc: 'メタル系以外に固定300ダメージ' },
  'マダンテ':   { mp: 333, type: 'fixed',     power: 6666,lv: 77, desc: 'メタル系以外に固定6666ダメージ' },
  'デス！':    { mp: 500, type: 'instakill', power: 0,   lv: 99, desc: '必中の即死呪文' },
};

const ITEMS = {
  'やくそう':     { buy: 7, type: 'heal',  power: 40, desc: 'HP+40' },
  'どくけしそう': { buy: 14, type: 'cure',  power: 0,  desc: '毒を治す' },
  '幸運の粉':     { buy: 77, type: 'lucky', power: 0,  desc: 'ふしぎな　こな' },
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
  { name: 'ロトの剣', atk: 110, buy: 3500 },
];
const ARMORS = [
  { name: '布の服',   def: 0,   buy: 0    },
  { name: '革の鎧',   def: 8,   buy: 120  },
  { name: '鉄の鎧',   def: 20,  buy: 600  },
  { name: '魔法の鎧', def: 38,  buy: 1600 },
  { name: 'ロトの鎧', def: 75,  buy: 5000 },
];
const SHIELDS = [
  { name: '木の盾',   def: 5,   buy: 50   },
  { name: '鉄の盾',   def: 14,  buy: 300  },
  { name: '魔法の盾', def: 25,  buy: 900  },
  { name: 'ロトの盾', def: 50,  buy: 3500 },
];

function findEquip(name) {
  return [...WEAPONS, ...ARMORS, ...SHIELDS].find(e => e.name === name) || null;
}
