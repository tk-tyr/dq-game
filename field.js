'use strict';

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
    { label: 'やめる', fn: () => {
      equipBrowseCounts.weapon = 0;
      equipBrowseCounts.armor  = 0;
      equipBrowseCounts.shield = 0;
      setExploreCmds();
      typeMsg('またきてね！');
    } },
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
  cmds.push({ label: 'もどる', fn: () => {
    equipBrowseCounts[type]++;
    if (equipBrowseCounts[type] >= 7) {
      equipBrowseCounts[type] = 0;
      const freeItem = base.find(e =>
        e.buy > 0 &&
        !player.soldOut[type].includes(e.name) &&
        !e.name.startsWith('ロトの')
      );
      if (freeItem) {
        const idx = base.findIndex(e => e.name === freeItem.name);
        for (let i = 0; i <= idx; i++) {
          if (base[i].buy > 0 && !player.soldOut[type].includes(base[i].name)) {
            player.soldOut[type].push(base[i].name);
          }
        }
        equipItem(freeItem);
        updateExploreUI();
        typeMsg(
          `ふしぎなことが　おきた！\n${freeItem.name}が　どこからか　あらわれた！\n（下位の装備は　うりきれになった）`,
          () => doEquipShop()
        );
      } else {
        doEquipShop();
      }
    } else {
      doEquipShop();
    }
  }});
  sel = 0;
  renderCmds('explore-cmd-list');
  typeMsg(`現在の装備: ${player.equipped[type] || 'なし'}\nなにを　かいますか？`);
}

function doBuyEquip(item, type) {
  equipBrowseCounts.weapon = 0;
  equipBrowseCounts.armor  = 0;
  equipBrowseCounts.shield = 0;
  if (player.gold < item.buy) { typeMsg('おカネが　たりない！'); return; }
  const oldAtk = player.atk, oldDef = player.def;
  player.gold -= item.buy;
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
    return `${name}: ${inv ? inv.n : 0}/7`;
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
    { label: 'どうぐを　つかう',             fn: doFieldItems },
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

function pickEnemy(area, playerLv) {
  let monsters = AREAS[area].monsters;
  // 全エリア共通: プレイヤーLVと差が2以内の敵のみ出現
  // （LV1でおおありくい/キメラ等が出ないよう上限も設定）
  const eligible = monsters.filter(m => Math.abs(MONSTERS[m].lv - playerLv) <= 2);
  if (eligible.length) {
    monsters = eligible;
  } else {
    // 適正レベル帯の敵がいない場合はレベルが最も近い敵を出す
    const closest = monsters.reduce((a, b) =>
      Math.abs(MONSTERS[a].lv - playerLv) <= Math.abs(MONSTERS[b].lv - playerLv) ? a : b
    );
    monsters = [closest];
  }
  const weights = monsters.map(m => Math.max(1, 11 - Math.abs(MONSTERS[m].lv - playerLv)));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rand(total);
  for (let i = 0; i < monsters.length; i++) {
    r -= weights[i];
    if (r < 0) return monsters[i];
  }
  return monsters[monsters.length - 1];
}

function doWalk() {
  resetCaveToggle();

  if (player.poisoned) {
    const dmg = Math.max(1, Math.floor(player.maxHp * 0.03));
    player.hp = Math.max(1, player.hp - dmg);
    updateExploreUI();
    if (player.hp <= 1) {
      typeMsg(`どくで　HP1に！\nはやく　どくけしそうを！`);
      return;
    }
  }

  // 平原: 裏ボス出現判定
  if (player.area === 0) {
    player.fieldEncounters++;
    const yaku = player.items.find(i => i.name === 'やくそう')?.n    || 0;
    const doku = player.items.find(i => i.name === 'どくけしそう')?.n || 0;
    const luck = player.items.find(i => i.name === '幸運の粉')?.n    || 0;
    const hasRotoEquip = player.equipped.weapon === 'ロトの剣' &&
                         player.equipped.armor  === 'ロトの鎧' &&
                         player.equipped.shield === 'ロトの盾';
    if ((yaku >= 7 && doku >= 7 && luck >= 7 && hasRotoEquip) || player.fieldEncounters >= 777) {
      if (player.fieldEncounters >= 777) player.fieldEncounters = 0;
      typeMsg('大地が　ふるえた...\n深淵の魔神が　あらわれた！', () => startBattle('深淵の魔神'));
      return;
    }
  }

  // 暗黒洞窟: 幸運の粉7個 → メタルスライム確定遭遇
  if (player.area === 1) {
    const luckInv = player.items.find(i => i.name === '幸運の粉');
    if (luckInv && luckInv.n >= 7) {
      luckInv.n = 0;
      typeMsg('幸運の粉が　かがやいた！\nメタルスライムが　あらわれた！', () => startBattle('メタルスライム'));
      return;
    }
  }

  // 魔王の城: 幸運の粉7個 → メタルキング確定遭遇
  if (player.area === 2) {
    const luckInv = player.items.find(i => i.name === '幸運の粉');
    if (luckInv && luckInv.n >= 7) {
      luckInv.n = 0;
      typeMsg('幸運の粉が　きんいろに　ひかった！\nメタルキングが　あらわれた！', () => startBattle('メタルキング'));
      return;
    }
  }

  if (Math.random() < 0.65) {
    // 暗黒洞窟: エンカウントの5回に1回はメタルスライム
    if (player.area === 1 && rand(5) === 0) {
      typeMsg('なにかが　ひかっている！\nメタルスライムが　あらわれた！', () => startBattle('メタルスライム'));
      return;
    }
    const m = pickEnemy(player.area, player.lv);
    typeMsg(`${m}に　であった！`, () => startBattle(m));
  } else {
    typeMsg('このあたりは　しずかだ。', () => updateExploreUI());
  }
}

// 暗黒洞窟連続往来カウントをリセット（移動以外の操作を行ったとき）
function resetCaveToggle() { player.darkCaveToggle = 0; }

function handleCaveToggle(from, to) {
  if (from !== 1 && to !== 1) return false;
  player.darkCaveToggle++;
  if (player.darkCaveToggle % 7 === 0) {
    player.bonusTime += 24 * 3600 * 1000;
    return true;
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
  const wasPoisoned = player.poisoned;
  player.poisoned = false;
  updateExploreUI();
  typeMsg(`ゆっくり　おやすみください...\nHP・MPが　全回復した！${wasPoisoned ? '\nどくも　なおった！' : ''}（${cost}G）`);
}

function doFieldItems() {
  resetCaveToggle();
  const usable = player.items.filter(i => i.n > 0 && ['heal', 'cure'].includes(ITEMS[i.name]?.type));
  if (!usable.length) {
    typeMsg('つかえるどうぐが　ない。');
    return;
  }
  cmds = usable.map(i => ({
    label: `${i.name}(${i.n}コ)　${ITEMS[i.name].desc}`,
    fn: () => doFieldUseItem(i.name),
  }));
  cmds.push({ label: 'やめる', fn: () => { setExploreCmds(); typeMsg(''); } });
  sel = 0;
  renderCmds('explore-cmd-list');
  typeMsg('どのどうぐを　つかいますか？');
}

function doFieldUseItem(name) {
  const d = ITEMS[name];
  const inv = player.items.find(i => i.name === name);
  if (!inv || inv.n <= 0) return;
  inv.n--;
  if (d.type === 'heal') {
    const before = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + d.power);
    updateExploreUI();
    typeMsg(`${name}を　つかった！　HP+${player.hp - before}！`);
  } else if (d.type === 'cure') {
    player.poisoned = false;
    updateExploreUI();
    typeMsg(`${name}を　つかった！　どくが　なおった！`);
  }
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
