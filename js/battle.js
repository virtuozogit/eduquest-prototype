/* =====================================================================
   battle.js — Monster Battle: an idle "auto-clicker" RPG powered by quiz
   ---------------------------------------------------------------------
   How it works:
     - Each STAGE has a monster (every 5th stage is a boss).
     - Answer multiple-choice questions. A CORRECT answer = your hero
       attacks. Correct answers in a row build a COMBO.
     - While your combo is alive, your hero also AUTO-ATTACKS every
       second (the "auto-clicker" part). A wrong answer ends the combo.
     - The monster fills an attack meter and hits you when it's full,
       and also hits you when you answer wrong.
     - Beat the monster → LOOT (sword, shield, armor) + XP + next stage.
   Gear stats:  weapon → ATK   shield → DEF   armor → max HP
   Contains:
     1. Settings  2. Monsters + loot tables  3. BattleRules
     4. battleMixin() — Alpine state + methods. app.js merges it in.
   ===================================================================== */

/* 1. SETTINGS ------------------------------------------------------- */
const HERO_BASE_ATK = 10;
const HERO_BASE_HP = 100;
const MONSTER_ATTACK_SECONDS = 15;   // monster hits you when its meter fills
const AUTO_ATTACK_SECONDS = 1;       // auto-attack speed while combo is alive
const BOSS_EVERY = 5;                // every 5th stage is a boss
const INVENTORY_LIMIT = 24;          // oldest unequipped items are dropped past this

/* 2. MONSTERS + LOOT ------------------------------------------------
   Kid-friendly creatures from Philippine folklore. After stage 10 the
   list repeats with stronger stats.                                    */
const MONSTERS = [
  { name: 'Duwende', emoji: '🍄', line: 'A tiny trickster with a mushroom hat!' },
  { name: 'Paniki', emoji: '🦇', line: 'A noisy bat from the old cave.' },
  { name: 'Giant Alimango', emoji: '🦀', line: 'Watch out for its big claws!' },
  { name: 'Tikbalang', emoji: '🐴', line: 'It loves to make travelers lost.' },
  { name: 'Kapre', emoji: '👹', line: 'BOSS! The giant of the balete tree.', boss: true },
  { name: 'Sigbin', emoji: '🐺', line: 'It walks backward with its head down.' },
  { name: 'Santelmo', emoji: '🔥', line: 'A floating ball of fire!' },
  { name: 'Bungisngis', emoji: '👺', line: 'A one-eyed giant who never stops laughing.' },
  { name: 'Sea Serpent', emoji: '🐍', line: 'It rises from the deep blue sea.' },
  { name: 'Bakunawa', emoji: '🐉', line: 'BOSS! The dragon that tries to eat the moon.', boss: true }
];

const RARITIES = {
  common: { name: 'Common', mult: 1, cls: 'rarity-common' },
  rare: { name: 'Rare', mult: 1.6, cls: 'rarity-rare' },
  epic: { name: 'Epic', mult: 2.4, cls: 'rarity-epic' },
  legendary: { name: 'Legendary', mult: 3.5, cls: 'rarity-legendary' }
};

// stat = which hero stat the slot boosts; base = value of a common item at stage 1
const SLOTS = {
  weapon: { label: 'Sword', stat: 'ATK', base: 3, emoji: '🗡️',
    names: { common: 'Bamboo Sword', rare: 'Iron Bolo', epic: 'Kampilan of Courage', legendary: 'Sunfire Kampilan' } },
  shield: { label: 'Shield', stat: 'DEF', base: 2, emoji: '🛡️',
    names: { common: 'Rattan Shield', rare: 'Narra Kalasag', epic: 'Moonstone Kalasag', legendary: 'Dragon Scale Kalasag' } },
  armor: { label: 'Armor', stat: 'HP', base: 15, emoji: '🥋',
    names: { common: 'Abaca Vest', rare: 'Carabao Leather Armor', epic: 'Pearl Mail', legendary: 'Golden Sun Armor' } }
};

/* 3. RULES ------------------------------------------------------------ */
const BattleRules = {
  isBoss(stage) { return stage % BOSS_EVERY === 0; },

  monster(stage) {
    const base = MONSTERS[(stage - 1) % MONSTERS.length];
    const boss = this.isBoss(stage);
    const hp = Math.round(60 * Math.pow(1.3, stage - 1) * (boss ? 2.2 : 1));
    const atk = Math.round((8 + 3 * (stage - 1)) * (boss ? 1.4 : 1));
    return { ...base, boss, hp, maxHp: hp, atk };
  },

  // Harder questions appear as stages go up
  difficulties(stage) {
    if (stage <= 2) return ['easy'];
    if (stage <= 5) return ['easy', 'medium'];
    return ['easy', 'medium', 'hard'];
  },

  // Combo multiplier: ×1.0, ×1.25, ×1.5 ... max ×2.5
  comboMult(combo) { return Math.min(1 + 0.25 * Math.max(0, combo - 1), 2.5); },

  // Auto-attack hits for 20% of ATK, boosted by the combo (at least 1)
  autoDamage(atk, combo) { return Math.max(1, Math.round(atk * 0.2 * this.comboMult(combo))); },

  // Bosses always drop Rare or better
  rollRarity(boss) {
    const r = Math.random() * 100;
    if (boss) return r < 10 ? 'legendary' : r < 40 ? 'epic' : 'rare';
    return r < 3 ? 'legendary' : r < 15 ? 'epic' : r < 45 ? 'rare' : 'common';
  },

  makeItem(stage, boss) {
    const slot = Util.pick(Object.keys(SLOTS));
    const rarity = this.rollRarity(boss);
    const s = SLOTS[slot];
    return {
      id: 'it-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      slot, rarity, emoji: s.emoji, name: s.names[rarity],
      power: Math.round(s.base * RARITIES[rarity].mult * (1 + 0.2 * (stage - 1))),
      stage
    };
  },

  // XP for beating a monster (feeds the normal student level)
  xp(stage, boss) { return 5 + stage * 2 + (boss ? 15 : 0); }
};

function defaultBattle() {
  const stick = { id: 'it-start-1', slot: 'weapon', rarity: 'common', emoji: '🗡️', name: 'Training Stick', power: 2, stage: 1 };
  const shirt = { id: 'it-start-2', slot: 'armor', rarity: 'common', emoji: '🥋', name: 'Cotton Shirt', power: 10, stage: 1 };
  return { stage: 1, best: 1, wins: 0, inventory: [stick, shirt], equipped: { weapon: stick.id, shield: null, armor: shirt.id } };
}

/* 4. ALPINE MIXIN -----------------------------------------------------
   The fight loop timer lives OUTSIDE Alpine's reactive state (like the
   challenge timer in quiz.js).                                         */
let battleTimer = null;

function battleMixin() {
  return {
    hero: Store.get('battle', null) || defaultBattle(),
    battleSubject: 'all',
    fight: null,      // the fight in progress (null or phase 'done' = at camp)
    lootFilter: 'all',

    saveHero() { Store.set('battle', this.hero); },

    /* ---------------- gear + stats ---------------- */
    item(id) { return this.hero.inventory.find(i => i.id === id) || null; },
    equippedItem(slot) { return this.item(this.hero.equipped[slot]); },
    gearPower(slot) { return this.equippedItem(slot)?.power || 0; },
    heroAtk() { return HERO_BASE_ATK + this.gearPower('weapon'); },
    heroDef() { return this.gearPower('shield'); },
    heroMaxHp() { return HERO_BASE_HP + this.gearPower('armor'); },
    isEquipped(item) { return this.hero.equipped[item.slot] === item.id; },
    // +/- compared with what is equipped in the same slot
    gearDiff(item) { return item.power - this.gearPower(item.slot); },

    equip(item) {
      this.hero.equipped[item.slot] = item.id;
      this.saveHero();
      Sound.pop();
    },

    sortedInventory() {
      const order = { legendary: 0, epic: 1, rare: 2, common: 3 };
      return this.hero.inventory
        .filter(i => this.lootFilter === 'all' || i.slot === this.lootFilter)
        .slice()
        .sort((a, b) => order[a.rarity] - order[b.rarity] || b.power - a.power);
    },

    setStage(n) {
      this.hero.stage = Math.max(1, Math.min(this.hero.best, n));
      this.saveHero();
      Sound.click();
    },

    /* ---------------- questions ---------------- */
    battlePool(stage) {
      const levels = BattleRules.difficulties(stage);
      const subjects = EQ_DATA.subjects.filter(s => this.battleSubject === 'all' || s.id === this.battleSubject);
      const pool = [];
      subjects.forEach(s => s.quests.forEach(q => q.questions.forEach(qq => {
        if (levels.includes(qq.difficulty)) pool.push({ ...qq, subjectEmoji: s.emoji });
      })));
      return Util.shuffle(pool);
    },

    nextBattleQuestion() {
      const f = this.fight;
      if (!f.deck.length) f.deck = this.battlePool(f.stage);
      f.question = f.deck.shift();
      f.chosen = null;
      f.phase = 'question';
    },

    /* ---------------- fight loop ---------------- */
    startFight() {
      const stage = this.hero.stage;
      this.fight = {
        stage, monster: BattleRules.monster(stage),
        hp: this.heroMaxHp(), maxHp: this.heroMaxHp(),
        deck: this.battlePool(stage), question: null, chosen: null,
        phase: 'intro', combo: 0, bestCombo: 0, correct: 0, answered: 0,
        meter: 0, autoClock: 0, autoTotal: 0,
        floats: [], heroAnim: '', monsterAnim: '', message: '',
        loot: null, xpGained: 0, levelUp: false
      };
      Sound.go();
      this.stopBattleTimer();
      setTimeout(() => { if (this.fight?.phase === 'intro') this.nextBattleQuestion(); }, 1400);

      let last = performance.now();
      battleTimer = setInterval(() => {
        const now = performance.now();
        const dt = (now - last) / 1000;
        last = now;
        this.battleTick(dt);
      }, 100);
    },

    battleTick(dt) {
      const f = this.fight;
      if (!f || f.phase !== 'question' || this.showBreak) return;

      // AUTO-ATTACK: only while the combo is alive
      if (f.combo > 0) {
        f.autoClock += dt;
        if (f.autoClock >= AUTO_ATTACK_SECONDS) {
          f.autoClock = 0;
          const dmg = BattleRules.autoDamage(this.heroAtk(), f.combo);
          f.autoTotal += dmg;
          this.damageMonster(dmg, 'auto');
          if (f.monster.hp <= 0) return;
        }
      }

      // MONSTER METER: when full, the monster attacks
      f.meter += dt;
      if (f.meter >= MONSTER_ATTACK_SECONDS) {
        f.meter = 0;
        this.monsterAttack();
      }
    },

    battleAnswer(choice) {
      const f = this.fight;
      if (!f || f.phase !== 'question') return;
      const q = f.question;
      f.chosen = choice;
      f.answered++;

      if (choice === q.answer) {
        f.combo++;
        f.correct++;
        f.bestCombo = Math.max(f.bestCombo, f.combo);
        const crit = Math.random() < 0.1;
        const dmg = Math.round(this.heroAtk() * BattleRules.comboMult(f.combo) * (crit ? 1.5 : 1));
        f.message = (crit ? 'CRITICAL HIT! ' : '') + Util.pick(EQ_DATA.cheers);
        f.phase = 'hit';
        this.playAnim('heroAnim', 'anim-lunge');
        Sound.correct();
        Sound.hit();
        this.damageMonster(dmg, crit ? 'crit' : 'hit');
        if (f.monster.hp > 0) setTimeout(() => { if (this.fight === f && f.phase === 'hit') this.nextBattleQuestion(); }, 750);
      } else {
        f.combo = 0;
        f.autoClock = 0;
        f.message = Util.pick(EQ_DATA.encouragements);
        f.phase = 'feedback';
        Sound.wrong();
        this.monsterAttack();
      }
    },

    // Continue after reading the explanation for a wrong answer
    battleContinue() {
      const f = this.fight;
      if (!f || f.phase !== 'feedback') return;
      Sound.click();
      this.nextBattleQuestion();
    },

    damageMonster(dmg, kind) {
      const f = this.fight;
      f.monster.hp = Math.max(0, f.monster.hp - dmg);
      this.addFloat('monster', (kind === 'crit' ? '💥 ' : '') + '-' + dmg, 'float-' + kind);
      this.playAnim('monsterAnim', 'anim-shake');
      if (f.monster.hp <= 0) this.winFight();
    },

    monsterAttack() {
      const f = this.fight;
      const dmg = Math.max(1, f.monster.atk - this.heroDef());
      f.hp = Math.max(0, f.hp - dmg);
      f.meter = 0;
      this.addFloat('hero', '-' + dmg, 'float-hurt');
      this.playAnim('monsterAnim', 'anim-lunge-left');
      this.playAnim('heroAnim', 'anim-shake');
      if (f.hp <= 0) this.loseFight();
    },

    addFloat(side, text, cls) {
      const f = this.fight;
      const id = Math.random().toString(36).slice(2);
      f.floats.push({ id, side, text, cls, x: Math.round(Math.random() * 40 - 20) });
      setTimeout(() => { f.floats = f.floats.filter(x => x.id !== id); }, 900);
    },

    playAnim(key, cls) {
      const f = this.fight;
      f[key] = '';
      requestAnimationFrame(() => { f[key] = cls; });
      setTimeout(() => { if (f[key] === cls) f[key] = ''; }, 450);
    },

    winFight() {
      const f = this.fight;
      if (f.phase === 'victory') return;
      this.stopBattleTimer();
      f.phase = 'victory';
      f.loot = BattleRules.makeItem(f.stage, f.monster.boss);
      f.xpGained = BattleRules.xp(f.stage, f.monster.boss);

      const h = this.hero;
      h.inventory.push(f.loot);
      // Auto-equip if the slot is empty
      if (!h.equipped[f.loot.slot]) h.equipped[f.loot.slot] = f.loot.id;
      this.trimInventory();
      h.wins++;
      if (f.stage === h.best) h.best++;
      h.stage = Math.min(h.best, f.stage + 1);
      this.saveHero();

      const oldLevel = Scoring.level(this.student.xp);
      this.student.xp += f.xpGained;
      f.levelUp = Scoring.level(this.student.xp) > oldLevel;
      this.saveStudent();

      setTimeout(() => {
        Sound.fanfare();
        if (f.monster.boss || f.loot.rarity === 'legendary' || f.levelUp) Celebrate.big();
        else Celebrate.burst();
      }, 250);
    },

    loseFight() {
      this.stopBattleTimer();
      this.fight.phase = 'defeat';
      Sound.wrong();
    },

    trimInventory() {
      const h = this.hero;
      const equipped = Object.values(h.equipped);
      while (h.inventory.length > INVENTORY_LIMIT) {
        const i = h.inventory.findIndex(it => !equipped.includes(it.id));
        if (i < 0) break;
        h.inventory.splice(i, 1);
      }
    },

    nextFight() { Sound.click(); this.startFight(); },

    // (Like quiz.js, we never set fight to null while its screen is open;
    // phase 'done' sends the player back to camp.)
    leaveFight() {
      this.stopBattleTimer();
      if (this.fight) this.fight.phase = 'done';
    },
    inFight() { return !!this.fight && this.fight.phase !== 'done'; },

    stopBattleTimer() { clearInterval(battleTimer); battleTimer = null; }
  };
}
