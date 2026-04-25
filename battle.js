'use strict';

function startBattle(monName) {
  const d = MONSTERS[monName];
  enemy = {
    name: monName, hp: d.hp, maxHp: d.hp,
    atk: d.atk, def: d.def, exp: d.exp, gold: d.gold, emoji: d.emoji,
    isBoss: d.isBoss || false, isMidBoss: d.isMidBoss || false,
    isSecretBoss: d.isSecretBoss || false, healSelf: d.healSelf || false,
    usesPoison: d.usesPoison || false,
  };
  battlePhase = 'cmd';
  show('battle');
  updateBattleUI();
  const tag = d.isSecretBoss ? '【裏ボス】' : d.isMidBoss ? '【中ボス】' : d.isBoss ? '【魔王】' : '';
  typeMsg(`${tag}${monName}が　あらわれた！`, () => {
    if (isOvertime()) {
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

// チート1: じゅもん7回連続 → 敵HP1 (ボス/裏ボスは逆効果: 自分のHP・MPが1に)
function openSpells() {
  spellMenuPresses++;
  if (spellMenuPresses >= 7) {
    spellMenuPresses = 0;
    clearCmds('battle-cmd-list');
    battlePhase = 'animating';
    if (enemy.isBoss || enemy.isSecretBoss) {
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
    const h = Math.floor(s.power + player.lv * 1.5) + rand(20);
    player.hp = Math.min(player.maxHp, player.hp + h);
    updateBattleUI();
    typeMsg(`${name}！　HPが　${h}　かいふくした！`, () => enemyTurn());
  } else if (s.type === 'instakill') {
    shakeEnemy();
    enemy.hp = 0;
    updateBattleUI();
    typeMsg(`${name}！\n${enemy.name}は　いきたえた！`, () => winBattle());
  } else if (s.type === 'fixed') {
    const isMetal = enemy.name === 'メタルスライム' || enemy.name === 'メタルキング';
    if (isMetal) {
      typeMsg(`${name}！　しかし　${enemy.name}には　きかない！`, () => enemyTurn());
    } else {
      enemy.hp = Math.max(0, enemy.hp - s.power);
      shakeEnemy();
      updateBattleUI();
      typeMsg(`${name}！　${enemy.name}に　${s.power}の　ダメージ！`, () => {
        enemy.hp <= 0 ? winBattle() : enemyTurn();
      });
    }
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
      setExploreCmds();
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
      if (player.hp <= 0) typeMsg('どくで　ゆうしゃは　たおれた...', () => setTimeout(() => showGameOver(), 800));
      else { battlePhase = 'cmd'; setBattleCmds(); }
    });
  } else {
    battlePhase = 'cmd';
    setBattleCmds();
  }
}

function enemyTurn() {
  battlePhase = 'enemy';
  if (enemy.name === 'メタルスライム' || enemy.name === 'メタルキング') {
    const fleeRate = enemy.name === 'メタルキング' ? 0.75 : 0.5;
    if (Math.random() < fleeRate) {
      typeMsg(`${enemy.name}は　にげだした！`, () => {
        enemy = null;
        show('explore');
        updateExploreUI();
        setExploreCmds();
        typeMsg('にがした...　くやしい！');
      });
      return;
    }
  }
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
  if (usePoison)                                             msg = `${enemy.name}の　どくこうげき！　${dmg}の　ダメージ！\nゆうしゃは　どくに　おかされた！`;
  else if (isSpecial && (enemy.isBoss || enemy.isSecretBoss)) msg = `${enemy.name}の　とくしゅこうげき！　${dmg}の　ダメージ！`;
  else if (isSpecial && enemy.isMidBoss)                     msg = `${enemy.name}の　とくしゅこうげき！　${dmg}の　ダメージ！`;
  else                                                       msg = `${enemy.name}の　こうげき！　ゆうしゃに　${dmg}の　ダメージ！`;
  typeMsg(msg, () => {
    if (player.hp <= 0) typeMsg('ゆうしゃは　たおれた...', () => setTimeout(() => showGameOver(), 800));
    else afterEnemyTurn();
  });
}

function winBattle() {
  const luckInv = player.items.find(i => i.name === '幸運の粉');
  const luckN = luckInv?.n || 0;
  const expGain = luckN > 0 ? Math.floor(enemy.exp * (1 + luckN * 0.1)) : enemy.exp;
  player.exp += expGain;
  player.gold += enemy.gold;
  player.kills++;
  const wasBoss    = enemy.isBoss;
  const isSecret   = enemy.isSecretBoss;
  const wasMidBoss = enemy.isMidBoss;
  const midBossIdx = wasMidBoss ? AREAS[player.area].midBossIdx : -1;
  const isMetal = enemy.name === 'メタルスライム' || enemy.name === 'メタルキング';
  const expMsg = luckN > 0
    ? `${expGain}けいけんちと　${enemy.gold}Gを　てにいれた！（幸運の粉×${luckN}で+${Math.floor(luckN * 10)}%）`
    : `${enemy.exp}けいけんちと　${enemy.gold}Gを　てにいれた！`;
  const msgs = [`${enemy.name}を　たおした！`, expMsg, ...checkLevelUp()];
  if (isMetal && luckN >= 7 && luckInv) {
    luckInv.n = 0;
    msgs.push('幸運の粉の　ちからが　ほとばしった！\n（幸運の粉が　すべて　きえた）');
  }
  enemy = null;
  qMsg(msgs, () => {
    if (wasBoss && !isSecret) {
      player.zomaDefeated = true;
      cmds = [
        { label: 'はい', fn: () => {
          clearCmds('battle-cmd-list');
          typeMsg('深淵の　やみが　うごめきだした...\n深淵の魔神が　あらわれた！', () => startBattle('深淵の魔神'));
        }},
        { label: 'いいえ', fn: () => {
          clearCmds('battle-cmd-list');
          gameClear(false);
        }},
      ];
      sel = 0;
      renderCmds('battle-cmd-list');
      typeMsg('まおうを　たおした！\n...\n「ゆうしゃよ。この　せかいには　まだ\n真の　やみが　のこっている。\n深淵の魔神を　たおしますか？」');
    } else if (wasBoss && isSecret) {
      gameClear(true);
    } else if (wasMidBoss) {
      if (midBossIdx >= 0) player.midBossDefeated[midBossIdx] = true;
      show('explore');
      updateExploreUI();
      setExploreCmds();
      typeMsg('しょうりした！　みちが　ひらけた！');
    } else {
      show('explore');
      updateExploreUI();
      setExploreCmds();
      typeMsg('しょうりした！');
    }
  });
}
