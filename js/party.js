/* =====================================================================
   party.js — BattleQuest with classmates: TEAM RAID + DUEL
   ---------------------------------------------------------------------
   This prototype has no server, so classmates are practice BOTS made
   from the 20 classmates in data.js. Each bot's "skill" (0–1) controls
   how often it answers right and how fast. Real cross-device play
   would need a backend.

   TEAM RAID (#/student/battle/raid)
     - Team up with 3 classmates against a big raid boss.
     - YOU answer questions: right = you attack (ATK × combo, can crit).
     - Each teammate attacks on their own every few seconds.
     - The team shares one TEAM HP bar. The boss hits the whole team
       when its meter fills, and hits again when you answer wrong.
     - Win → guaranteed Epic or Legendary loot + XP.

   DUEL (#/student/battle/duel)
     - You and a classmate get the SAME question at the same time.
     - Each right answer attacks the other player. Whoever answers
       right FASTER gets a +25% speed bonus.
     - First to 0 HP loses (or the most HP left after 10 rounds).
     - Win or lose, you earn trophies and XP for playing. A WIN also
       drops loot (Rare or better if the opponent was "Tough").

   Contains: 1. Settings  2. Raid bosses  3. PartyRules  4. partyMixin()
   ===================================================================== */

/* 1. SETTINGS ------------------------------------------------------- */
const RAID_TEAM_SIZE = 3;            // classmates who join you
const RAID_BOSS_SECONDS = 10;        // boss hits the whole team when its meter fills
const RAID_MATE_POWER = 1.6;         // teammates' damage boost (they have no combo like you)
const DUEL_TIME = 15;                // seconds per duel question
const DUEL_MAX_ROUNDS = 10;
const DUEL_SPEED_BONUS = 1.25;       // faster right answer does +25% damage
const DUEL_TROPHIES = { win: 20, draw: 10, loss: 5 };   // never lose trophies for trying
const DUEL_XP = { win: 20, draw: 12, loss: 8 };

/* 2. RAID BOSSES -----------------------------------------------------
   hp/atk grow with the player's progress (see PartyRules.scale/atkScale).
   recommended = the BattleQuest stage you should reach first (shown as a tip).
   event: true = a SPECIAL EVENT boss: shown in its own highlighted banner,
   open to every player, and always drops Legendary loot. */
const RAID_BOSSES = [
  { id: 'kapre', name: 'Giant Kapre', emoji: '👹', tier: 'Normal', recommended: 1, hp: 700, atk: 28, xp: 40,
    levels: ['easy', 'medium'], line: 'The giant of the balete tree wants a rematch!' },
  { id: 'bakunawa', name: 'Bakunawa, Moon Eater', emoji: '🐉', tier: 'Hard', recommended: 4, hp: 1100, atk: 38, xp: 60,
    levels: ['easy', 'medium', 'hard'], line: 'Protect the moon! Every right answer helps.' },
  { id: 'minokawa', name: 'Minokawa, Sky Giant', emoji: '🦅', tier: 'Legendary', recommended: 7, hp: 1300, atk: 34, xp: 90,
    levels: ['medium', 'hard'], line: 'A bird as big as an island. Only a strong team can win!' },
  { id: 'emperor-doom', name: 'Emperor Doom', emoji: '🦹', art: 'emperor-doom', tier: 'Special Event', event: true, recommended: 1, hp: 900, atk: 25, xp: 120,
    levels: ['easy', 'medium'], line: 'The iron-masked emperor wants to rule every classroom. Stop him together!' }
];

/* Emperor Doom's picture (original art): a green hood around a riveted
   metal mask with glowing eyes. Bosses with `art` use this instead of
   their emoji (see bossSprite() below). */
const EMPEROR_DOOM_SVG = `
<svg viewBox="0 0 100 100" class="boss-art" role="img" aria-label="Emperor Doom: a green hood and a metal mask">
  <defs>
    <linearGradient id="doomMetal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F8FAFC"/><stop offset=".45" stop-color="#CBD5E1"/><stop offset="1" stop-color="#64748B"/>
    </linearGradient>
    <linearGradient id="doomHood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#22C55E"/><stop offset="1" stop-color="#14532D"/>
    </linearGradient>
  </defs>
  <!-- hood + cloak -->
  <path d="M50 5C27 5 15 24 15 46L13 80C13 91 30 97 50 97C70 97 87 91 87 80L85 46C85 24 73 5 50 5Z" fill="url(#doomHood)" stroke="#052E16" stroke-width="2"/>
  <!-- dark inside of the hood -->
  <path d="M50 15C33 15 25 30 25 48L25 76L75 76L75 48C75 30 67 15 50 15Z" fill="#052E16"/>
  <!-- metal mask -->
  <path d="M50 21C38 21 31 31 31 45L32 62C33 71 41 77 50 77C59 77 67 71 68 62L69 45C69 31 62 21 50 21Z" fill="url(#doomMetal)" stroke="#334155" stroke-width="1.5"/>
  <!-- shine on the metal -->
  <path d="M38 27C35 32 34 38 34 45" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".7"/>
  <!-- angry brows + nose ridge -->
  <path d="M36 37L46 40M64 37L54 40" stroke="#334155" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M50 40V57" stroke="#64748B" stroke-width="2"/>
  <!-- eye slits with a green glow -->
  <rect x="36" y="42" width="11" height="5" rx="2.5" fill="#0F172A"/>
  <rect x="53" y="42" width="11" height="5" rx="2.5" fill="#0F172A"/>
  <ellipse cx="41.5" cy="44.5" rx="3" ry="1.6" fill="#A3E635"/>
  <ellipse cx="58.5" cy="44.5" rx="3" ry="1.6" fill="#A3E635"/>
  <!-- mouth grille -->
  <rect x="41" y="60" width="18" height="7" rx="2" fill="#475569"/>
  <path d="M45 60V67M50 60V67M55 60V67" stroke="#CBD5E1" stroke-width="1.2"/>
  <!-- rivets -->
  <g fill="#94A3B8" stroke="#475569" stroke-width=".6">
    <circle cx="35" cy="53" r="1.6"/><circle cx="65" cy="53" r="1.6"/>
    <circle cx="39" cy="70" r="1.6"/><circle cx="61" cy="70" r="1.6"/>
  </g>
  <!-- hood edge -->
  <path d="M25 76L25 48C25 30 33 15 50 15C67 15 75 30 75 48L75 76" stroke="#4ADE80" stroke-width="1.5" fill="none" opacity=".6"/>
</svg>`;

/* 3. RULES ------------------------------------------------------------ */
const PartyRules = {
  // Raids get tougher as the player clears more BattleQuest stages.
  // Boss HP grows faster than boss ATK so a well-geared team can survive.
  scale(best) { return 1 + 0.15 * (best - 1); },
  atkScale(best) { return 1 + 0.08 * (best - 1); },

  // A classmate's battle stats, based on the player's own stats so the
  // match is fair, then adjusted by the classmate's skill.
  mateStats(mate, you) {
    return {
      atk: Math.max(5, Math.round(you.atk * (0.6 + 0.6 * mate.skill))),
      def: Math.round(you.def * (0.5 + 0.7 * mate.skill)),
      hp: Math.round(you.hp * (0.8 + 0.4 * mate.skill)),
      crit: Math.round(4 + 12 * mate.skill),
      accuracy: Math.min(0.95, mate.skill + 0.05),
      power: Math.round(you.atk * (0.6 + 0.6 * mate.skill) + you.hp * (0.8 + 0.4 * mate.skill) / 5)
    };
  },

  // How long a bot takes to answer (seconds). Higher skill = faster.
  thinkTime(skill, max) { return Math.min(max - 1, (2 + Math.random() * 7) * (1.3 - skill)); },

  // Raid loot is always Epic or better: roll boss loot until it isn't Rare
  // (boss loot is Rare/Epic/Legendary, so this ends up 75% Epic, 25% Legendary)
  // Special event bosses always drop Legendary.
  raidLoot(stage, legendaryOnly) {
    let item;
    do { item = BattleRules.makeItem(stage, true); } while (item.rarity === 'rare' || (legendaryOnly && item.rarity !== 'legendary'));
    return item;
  }
};

/* 4. ALPINE MIXIN ------------------------------------------------------
   Timers live outside Alpine's reactive state (like the other games). */
let raidTimer = null;
let duelTimer = null;
let duelBotTimer = null;

function partyMixin() {
  return {
    raid: { phase: 'setup', bossId: 'kapre', picked: [] },
    duel: { phase: 'setup' },

    // The player's own battle stats in one object
    myStats() { return { atk: this.heroAtk(), def: this.heroDef(), hp: this.heroMaxHp(), crit: this.heroCrit() }; },
    raidBoss(id) { return RAID_BOSSES.find(b => b.id === id); },
    // A boss's picture: custom art if it has one, otherwise its emoji
    bossSprite(boss) {
      if (boss.art === 'emperor-doom') return EMPEROR_DOOM_SVG;
      return '<span>' + boss.emoji + '</span>';
    },
    mateCard(mate) { return { ...mate, stats: PartyRules.mateStats(mate, this.myStats()) }; },
    classmateCards() { return EQ_DATA.classmates.map(c => this.mateCard(c)).sort((a, b) => b.stats.power - a.stats.power); },
    myPower() { const s = this.myStats(); return Math.round(s.atk + s.hp / 5); },
    partyQuestions(levels) {
      const subjects = EQ_DATA.subjects.filter(s => this.battleSubject === 'all' || s.id === this.battleSubject);
      const pool = [];
      subjects.forEach(s => s.quests.forEach(q => q.questions.forEach(qq => {
        if (levels.includes(qq.difficulty)) pool.push({ ...qq, subjectEmoji: s.emoji });
      })));
      return Util.shuffle(pool);
    },

    // Short-lived floating numbers / log lines on any game object
    partyFloat(obj, side, text, cls) {
      const id = Math.random().toString(36).slice(2);
      obj.floats.push({ id, side, text, cls, x: Math.round(Math.random() * 60 - 30) });
      setTimeout(() => { obj.floats = obj.floats.filter(f => f.id !== id); }, 900);
    },
    partyLog(obj, text) {
      obj.log.unshift({ id: Math.random().toString(36).slice(2), text });
      obj.log = obj.log.slice(0, 4);
    },
    partyAnim(obj, key, cls) {
      obj[key] = '';
      requestAnimationFrame(() => { obj[key] = cls; });
      setTimeout(() => { if (obj[key] === cls) obj[key] = ''; }, 450);
    },

    // Called by app.js whenever the route changes away from a party screen
    leaveParty() {
      clearInterval(raidTimer); raidTimer = null;
      clearInterval(duelTimer); duelTimer = null;
      clearTimeout(duelBotTimer); duelBotTimer = null;
      // Only reset the phase: replacing the object while its screen is still
      // open would make the closing screen read missing fields.
      if (this.raid.phase !== 'setup') this.raid.phase = 'setup';
      if (this.duel.phase !== 'setup') this.duel.phase = 'setup';
    },

    /* ============================ TEAM RAID ============================ */
    togglePick(id) {
      const p = this.raid.picked;
      if (p.includes(id)) this.raid.picked = p.filter(x => x !== id);
      else if (p.length < RAID_TEAM_SIZE) p.push(id);
      else this.toast('Your team is full! Tap a classmate to remove them first.');
      Sound.click();
    },
    quickMatch() {
      this.raid.picked = Util.shuffle(EQ_DATA.classmates).slice(0, RAID_TEAM_SIZE).map(c => c.id);
      Sound.pop();
    },

    startRaid() {
      if (this.raid.picked.length !== RAID_TEAM_SIZE) { this.toast('Pick ' + RAID_TEAM_SIZE + ' classmates (or tap Quick match).'); return; }
      const base = this.raidBoss(this.raid.bossId);
      const scale = PartyRules.scale(this.hero.best);
      const you = this.myStats();
      const team = [
        { id: 'me', nickname: this.student.nickname, avatar: this.student.avatar, isMe: true, ...you, dmg: 0, clock: 0, next: 0 },
        ...this.raid.picked.map(id => {
          const c = EQ_DATA.classmates.find(x => x.id === id);
          const st = PartyRules.mateStats(c, you);
          return { id: c.id, nickname: c.nickname, avatar: c.avatar, skill: c.skill, ...st, dmg: 0, clock: 0, next: 1.5 + Math.random() * 2 };
        })
      ];
      const teamHp = team.reduce((s, m) => s + m.hp, 0);
      const bossHp = Math.round(base.hp * scale);
      // Update the existing object (and keep the last question until a new one
      // arrives) so a screen that's still closing never reads null.
      Object.assign(this.raid, {
        phase: 'intro',
        boss: { ...base, hp: bossHp, maxHp: bossHp, atk: Math.round(base.atk * PartyRules.atkScale(this.hero.best)) },
        team, teamHp, teamMaxHp: teamHp, meter: 0,
        deck: this.partyQuestions(base.levels), question: this.raid.question || null, chosen: null,
        combo: 0, bestCombo: 0, correct: 0, answered: 0,
        floats: [], log: [], bossAnim: '', message: '', loot: null, xpGained: 0
      });
      Sound.go();
      clearInterval(raidTimer);
      setTimeout(() => { if (this.raid.phase === 'intro') this.nextRaidQuestion(); }, 1400);
      let last = performance.now();
      raidTimer = setInterval(() => {
        const now = performance.now();
        this.raidTick((now - last) / 1000);
        last = now;
      }, 100);
    },

    nextRaidQuestion() {
      const r = this.raid;
      if (!r.deck.length) r.deck = this.partyQuestions(r.boss.levels);
      r.question = r.deck.shift();
      r.chosen = null;
      r.phase = 'question';
    },

    raidTick(dt) {
      const r = this.raid;
      // The fight keeps going while you read feedback, so the team feels alive
      if (!['question', 'hit', 'feedback'].includes(r.phase) || this.showBreak) return;

      // TEAMMATES attack on their own clock
      r.team.filter(m => !m.isMe).forEach(m => {
        m.clock += dt;
        if (m.clock < m.next) return;
        m.clock = 0;
        m.next = (3 + Math.random() * 3) * (1.3 - m.skill);
        if (Math.random() < m.accuracy) {
          const crit = BattleRules.rollCrit(m.crit);
          const dmg = Math.round(m.atk * RAID_MATE_POWER * (crit ? CRIT_MULT : 1));
          this.raidDamage(m, dmg, crit);
          this.partyLog(r, (crit ? '💥 ' : '⚔️ ') + m.nickname + (crit ? ' landed a CRIT for ' : ' hit for ') + dmg + '!');
        } else {
          this.partyLog(r, '🤔 ' + m.nickname + ' is working on a tricky question…');
        }
      });
      if (r.boss.hp <= 0) return;

      // BOSS meter: when full, it hits the whole team
      r.meter += dt;
      if (r.meter >= RAID_BOSS_SECONDS) {
        r.meter = 0;
        this.raidBossAttack(r.boss.atk * 2, '🌪️ ' + r.boss.name + ' hit the whole team!');
      }
    },

    raidAnswer(choice) {
      const r = this.raid;
      if (r.phase !== 'question') return;
      const q = r.question;
      r.chosen = choice;
      r.answered++;
      const me = r.team[0];
      if (choice === q.answer) {
        r.combo++;
        r.correct++;
        r.bestCombo = Math.max(r.bestCombo, r.combo);
        const crit = BattleRules.rollCrit(me.crit);
        const dmg = Math.round(me.atk * BattleRules.comboMult(r.combo) * (crit ? CRIT_MULT : 1));
        r.message = (crit ? 'CRITICAL HIT! ' : '') + Util.pick(EQ_DATA.cheers);
        r.phase = 'hit';
        Sound.correct();
        Sound.hit();
        this.raidDamage(me, dmg, crit);
        if (r.boss.hp > 0) setTimeout(() => { if (this.raid === r && r.phase === 'hit') this.nextRaidQuestion(); }, 750);
      } else {
        r.combo = 0;
        r.message = Util.pick(EQ_DATA.encouragements);
        r.phase = 'feedback';
        Sound.wrong();
        this.raidBossAttack(r.boss.atk, '💢 ' + r.boss.name + ' struck back!');
      }
    },

    raidContinue() {
      if (this.raid.phase !== 'feedback') return;
      Sound.click();
      this.nextRaidQuestion();
    },

    raidDamage(member, dmg, crit) {
      const r = this.raid;
      r.boss.hp = Math.max(0, r.boss.hp - dmg);
      member.dmg += dmg;
      this.partyFloat(r, 'boss', (crit ? '💥 ' : '') + '-' + dmg, crit ? 'float-crit' : 'float-hit');
      this.partyAnim(r, 'bossAnim', 'anim-shake');
      if (r.boss.hp <= 0) this.winRaid();
    },

    raidBossAttack(rawDmg, logText) {
      const r = this.raid;
      const avgDef = Math.round(Util.avg(r.team.map(m => m.def)));
      const dmg = Math.max(5, rawDmg - avgDef);
      r.teamHp = Math.max(0, r.teamHp - dmg);
      r.meter = 0;
      this.partyFloat(r, 'team', '-' + dmg, 'float-hurt');
      this.partyLog(r, logText + ' (-' + dmg + ')');
      this.partyAnim(r, 'bossAnim', 'anim-lunge-left');
      if (r.teamHp <= 0) this.loseRaid();
    },

    winRaid() {
      const r = this.raid;
      if (r.phase === 'victory') return;
      clearInterval(raidTimer); raidTimer = null;
      r.phase = 'victory';
      r.loot = PartyRules.raidLoot(Math.max(this.hero.best, 2), !!r.boss.event);
      r.xpGained = r.boss.xp;
      const h = this.hero;
      h.inventory.push(r.loot);
      if (!h.equipped[r.loot.slot]) h.equipped[r.loot.slot] = r.loot.id;
      this.trimInventory();
      h.raidWins = (h.raidWins || 0) + 1;
      this.saveHero();
      this.student.xp += r.xpGained;
      this.saveStudent();
      setTimeout(() => { Sound.fanfare(); Celebrate.big(); }, 250);
    },

    loseRaid() {
      clearInterval(raidTimer); raidTimer = null;
      this.raid.phase = 'defeat';
      Sound.wrong();
    },

    // Team damage, biggest first (for the results screen)
    raidRanking() { return this.raid.team.slice().sort((a, b) => b.dmg - a.dmg); },
    raidTotalDmg() { return this.raid.team.reduce((s, m) => s + m.dmg, 0) || 1; },

    // DEMO "Skip to end": the team wins the raid right away (your hit finishes it)
    skipRaid() {
      const r = this.raid;
      if (!['intro', 'question', 'hit', 'feedback'].includes(r.phase)) return;
      this.raidDamage(r.team[0], r.boss.hp, false);
    },

    exitRaid() {
      this.leaveParty();
      this.go('#/student/battle');
    },

    /* ============================== DUEL ============================== */
    duelRecord() { return this.hero.duels || { wins: 0, losses: 0, draws: 0, trophies: 0 }; },

    startDuel(mateId) {
      const c = EQ_DATA.classmates.find(x => x.id === mateId);
      const you = this.myStats();
      const st = PartyRules.mateStats(c, you);
      // Update the existing object (and keep the last question/result until
      // new ones arrive) so a screen that's still closing never reads null.
      Object.assign(this.duel, {
        phase: 'intro', round: 0,
        me: { nickname: this.student.nickname, avatar: this.student.avatar, ...you, hpNow: you.hp, combo: 0 },
        foe: { id: c.id, nickname: c.nickname, avatar: c.avatar, skill: c.skill, ...st, hpNow: st.hp, combo: 0 },
        deck: this.partyQuestions(BattleRules.difficulties(this.hero.best)),
        question: this.duel.question || null, result: this.duel.result || null,
        timeLeft: DUEL_TIME, myChoice: null, myTime: null, foeChoice: null, foeTime: null,
        floats: [], meAnim: '', foeAnim: '', outcome: null, trophies: 0, xpGained: 0, loot: null
      });
      Sound.go();
      setTimeout(() => { if (this.duel.phase === 'intro') this.nextDuelRound(); }, 1400);
    },

    nextDuelRound() {
      const d = this.duel;
      if (!d.deck.length) d.deck = this.partyQuestions(BattleRules.difficulties(this.hero.best));
      // (d.result keeps last round's value until resolveDuelRound replaces it)
      Object.assign(d, { round: d.round + 1, question: d.deck.shift(), timeLeft: DUEL_TIME, myChoice: null, myTime: null, foeChoice: null, foeTime: null, phase: 'question' });
      const q = d.question;

      // The classmate bot decides its answer and when it "taps"
      const adjust = { easy: 0.1, medium: 0, hard: -0.15 };
      const right = Math.random() < Math.min(0.95, Math.max(0.2, d.foe.accuracy + adjust[q.difficulty]));
      const foeChoice = right ? q.answer : Util.pick([0, 1, 2, 3].filter(i => i !== q.answer));
      const foeTime = PartyRules.thinkTime(d.foe.skill, DUEL_TIME);
      clearTimeout(duelBotTimer);
      duelBotTimer = setTimeout(() => {
        if (this.duel !== d || d.phase !== 'question') return;
        d.foeChoice = foeChoice;
        d.foeTime = foeTime;
        Sound.pop();
        if (d.myChoice !== null) this.resolveDuelRound();
      }, foeTime * 1000);

      const started = performance.now();
      clearInterval(duelTimer);
      duelTimer = setInterval(() => {
        if (this.showBreak) return;
        d.timeLeft = Math.max(0, DUEL_TIME - (performance.now() - started) / 1000);
        if (d.timeLeft <= 0) this.resolveDuelRound();
      }, 100);
    },

    duelAnswer(choice) {
      const d = this.duel;
      if (d.phase !== 'question' || d.myChoice !== null) return;
      d.myChoice = choice;
      d.myTime = DUEL_TIME - d.timeLeft;
      Sound.click();
      if (d.foeChoice !== null) this.resolveDuelRound();
    },

    // Both answered (or time ran out): work out who hits whom
    resolveDuelRound() {
      const d = this.duel;
      if (d.phase !== 'question') return;
      clearInterval(duelTimer); duelTimer = null;
      clearTimeout(duelBotTimer); duelBotTimer = null;
      const q = d.question;
      const meRight = d.myChoice === q.answer;
      const foeRight = d.foeChoice === q.answer;
      const meFaster = meRight && (!foeRight || d.myTime <= d.foeTime);
      const foeFaster = foeRight && (!meRight || d.foeTime < d.myTime);

      const hit = (atk, attacker, target, faster) => {
        attacker.combo++;
        const crit = BattleRules.rollCrit(attacker.crit);
        const dmg = Math.max(1, Math.round(atk * BattleRules.comboMult(attacker.combo) * (crit ? CRIT_MULT : 1) * (faster ? DUEL_SPEED_BONUS : 1)) - target.def);
        target.hpNow = Math.max(0, target.hpNow - dmg);
        return { dmg, crit, faster };
      };
      const mine = meRight ? hit(d.me.atk, d.me, d.foe, meFaster) : null;
      const theirs = foeRight ? hit(d.foe.atk, d.foe, d.me, foeFaster) : null;
      if (!meRight) d.me.combo = 0;
      if (!foeRight) d.foe.combo = 0;

      d.result = { meRight, foeRight, mine, theirs };
      d.phase = 'reveal';
      if (mine) { this.partyFloat(d, 'foe', (mine.crit ? '💥 ' : '') + '-' + mine.dmg, mine.crit ? 'float-crit' : 'float-hit'); this.partyAnim(d, 'meAnim', 'anim-lunge'); this.partyAnim(d, 'foeAnim', 'anim-shake'); }
      if (theirs) { this.partyFloat(d, 'me', '-' + theirs.dmg, 'float-hurt'); }
      meRight ? Sound.correct() : Sound.wrong();

      if (d.me.hpNow <= 0 || d.foe.hpNow <= 0 || d.round >= DUEL_MAX_ROUNDS) setTimeout(() => this.endDuel(), 900);
    },

    duelNext() {
      if (this.duel.phase !== 'reveal') return;
      Sound.click();
      this.nextDuelRound();
    },

    endDuel() {
      const d = this.duel;
      if (d.phase === 'end') return;
      const mePct = d.me.hpNow / d.me.hp, foePct = d.foe.hpNow / d.foe.hp;
      d.outcome = Math.abs(mePct - foePct) < 0.001 ? 'draw' : mePct > foePct ? 'win' : 'loss';
      d.trophies = DUEL_TROPHIES[d.outcome];
      d.xpGained = DUEL_XP[d.outcome];
      d.phase = 'end';

      const rec = { ...this.duelRecord() };
      rec[d.outcome === 'win' ? 'wins' : d.outcome === 'loss' ? 'losses' : 'draws']++;
      rec.trophies += d.trophies;
      this.hero.duels = rec;

      // WIN → loot. Beating a "Tough" opponent (10%+ stronger) counts like a
      // boss, so the drop is Rare or better.
      d.loot = null;
      if (d.outcome === 'win') {
        const tough = d.foe.power > this.myPower() * 1.1;
        d.loot = BattleRules.makeItem(this.hero.best, tough);
        this.hero.inventory.push(d.loot);
        if (!this.hero.equipped[d.loot.slot]) this.hero.equipped[d.loot.slot] = d.loot.id;
        this.trimInventory();
      }
      this.saveHero();
      this.student.xp += d.xpGained;
      this.saveStudent();

      if (d.outcome === 'win') { Sound.fanfare(); Celebrate.big(); } else Sound.pop();
    },

    // DEMO "Skip to end": you win the duel right away (normal trophies + loot)
    skipDuel() {
      const d = this.duel;
      if (!['intro', 'question', 'reveal'].includes(d.phase)) return;
      clearInterval(duelTimer); duelTimer = null;
      clearTimeout(duelBotTimer); duelBotTimer = null;
      d.foe.hpNow = 0;
      this.endDuel();
    },

    exitDuel() {
      this.leaveParty();
      this.go('#/student/battle/duel');
    }
  };
}
