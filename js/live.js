/* =====================================================================
   live.js — "Host Live Game" (Kahoot-style) with bots + real players
   ---------------------------------------------------------------------
   HOST (teacher tab):  setup → lobby → question → reveal → … → podium
   BOTS: classmates from data.js. Each bot has a "skill" (0–1) that
         controls how often it is right and how fast it answers.
   REAL PLAYERS (bonus): a second browser tab opens #/student/join,
         types the PIN + a nickname, and talks to the host through the
         BroadcastChannel API (tabs of the same site in the same browser).

   Messages on channel "eduquest-live" (all include `pin`):
     player → host : join {playerId, nickname, avatar} · answer {playerId, index, choice} · leave
     host → player : joined · join-error · question · reveal · end · closed
   ===================================================================== */

const LIVE_TIME = 20;        // seconds per question
const LIVE_QUESTIONS = 5;    // questions per live game
const LIVE_BOTS = 8;         // bot players that join the lobby
const CHANNEL_NAME = 'eduquest-live';

// Non-reactive handles (timers + channels)
let liveTimers = [];
let liveTick = null;
let liveChannel = null;
let liveQuestionStart = 0;
let playerChannel = null;

function liveMixin() {
  return {
    /* ======================= HOST ======================= */
    live: {
      phase: 'setup', sourceId: 'math-1', pin: '', title: '',
      players: [], questions: [], index: 0, timeLeft: LIVE_TIME,
      answers: {}, counts: [0, 0, 0, 0]
    },

    liveSupported() { return 'BroadcastChannel' in window; },

    liveSources() {
      return [
        ...this.allQuests().map(q => ({ id: q.id, label: q.subject.name + ' · ' + q.title })),
        ...this.customQuizzes.map(q => ({ id: q.id, label: 'My quiz · ' + q.title }))
      ];
    },

    liveCreate() {
      const src = this.findQuiz(this.live.sourceId);
      if (!src) return;
      this.liveClearTimers();
      const questions = src.custom
        ? Util.shuffle(src.questions).slice(0, LIVE_QUESTIONS)
        : Adaptive.pick(src.questions, 'normal').slice(0, LIVE_QUESTIONS);
      Object.assign(this.live, {
        phase: 'lobby', title: src.title, questions, index: 0, players: [], answers: {}, counts: [0, 0, 0, 0],
        pin: String(Math.floor(100000 + Math.random() * 900000))
      });
      this.liveOpenChannel();

      // Bots join the lobby one by one
      Util.shuffle(EQ_DATA.classmates).slice(0, LIVE_BOTS).forEach((c, i) => {
        liveTimers.push(setTimeout(() => {
          this.live.players.push({ id: c.id, nickname: c.nickname, avatar: c.avatar, isBot: true, skill: c.skill, score: 0, streak: 0, lastPoints: 0, lastCorrect: null });
          Sound.pop();
        }, 900 + i * 750));
      });
    },

    liveOpenChannel() {
      if (!this.liveSupported()) return;
      if (liveChannel) liveChannel.close();
      liveChannel = new BroadcastChannel(CHANNEL_NAME);
      liveChannel.onmessage = e => this.liveOnMessage(e.data);
    },

    // JSON copy first: postMessage cannot send Alpine's reactive proxies
    liveSend(msg) { if (liveChannel) liveChannel.postMessage(JSON.parse(JSON.stringify({ ...msg, pin: this.live.pin }))); },

    liveOnMessage(m) {
      if (!m || m.pin !== this.live.pin) return;
      if (m.type === 'join') {
        const already = this.live.players.find(p => p.id === m.playerId);
        if (this.live.phase !== 'lobby' && !already) {
          this.liveSend({ type: 'join-error', playerId: m.playerId, reason: 'This game already started. Wait for the next one!' });
          return;
        }
        if (!already) {
          this.live.players.push({ id: m.playerId, nickname: String(m.nickname).slice(0, 14), avatar: m.avatar, isBot: false, skill: 0, score: 0, streak: 0, lastPoints: 0, lastCorrect: null });
          Sound.pop();
        }
        this.liveSend({ type: 'joined', playerId: m.playerId, title: this.live.title });
      }
      if (m.type === 'answer' && this.live.phase === 'question' && m.index === this.live.index) {
        this.liveRecordAnswer(m.playerId, m.choice);
      }
      if (m.type === 'leave' && this.live.phase === 'lobby') {
        this.live.players = this.live.players.filter(p => p.id !== m.playerId);
      }
    },

    liveRealPlayers() { return this.live.players.filter(p => !p.isBot).length; },
    liveCurrent() { return this.live.questions[this.live.index]; },
    liveAnsweredCount() { return Object.keys(this.live.answers).length; },
    liveRanked() { return this.live.players.slice().sort((a, b) => b.score - a.score); },

    liveStart() {
      if (!this.live.players.length) return;
      this.liveClearTimers();      // stop any bots still waiting to join
      this.live.index = 0;
      this.liveShowQuestion();
    },

    liveShowQuestion() {
      this.liveClearTimers();
      const live = this.live;
      const q = this.liveCurrent();
      Object.assign(live, { phase: 'question', answers: {}, counts: [0, 0, 0, 0], timeLeft: LIVE_TIME });
      liveQuestionStart = performance.now();
      Sound.go();
      this.liveSend({ type: 'question', index: live.index, total: live.questions.length, question: q.question, choices: q.choices, time: LIVE_TIME });

      // Bots: chance of being right = skill, adjusted by difficulty.
      // Faster answers for higher skill (between ~2 and ~15 seconds).
      const adjust = { easy: 0.1, medium: 0, hard: -0.15 };
      live.players.filter(p => p.isBot).forEach(bot => {
        const chance = Math.min(0.97, Math.max(0.2, bot.skill + adjust[q.difficulty]));
        const right = Math.random() < chance;
        const wrongChoices = [0, 1, 2, 3].filter(i => i !== q.answer);
        const choice = right ? q.answer : Util.pick(wrongChoices);
        const delay = (2 + Math.random() * (LIVE_TIME - 6) * (1.25 - bot.skill)) * 1000;
        liveTimers.push(setTimeout(() => this.liveRecordAnswer(bot.id, choice), delay));
      });

      let lastWhole = LIVE_TIME;
      liveTick = setInterval(() => {
        live.timeLeft = Math.max(0, LIVE_TIME - (performance.now() - liveQuestionStart) / 1000);
        const whole = Math.ceil(live.timeLeft);
        if (whole !== lastWhole && whole <= 5 && whole > 0) Sound.tick();
        lastWhole = whole;
        if (live.timeLeft <= 0) this.liveReveal();
      }, 100);
    },

    // Same scoring idea as the solo challenge: base + speed bonus × streak
    liveRecordAnswer(playerId, choice) {
      const live = this.live;
      if (live.phase !== 'question' || live.answers[playerId] !== undefined) return;
      const player = live.players.find(p => p.id === playerId);
      if (!player || choice == null || choice < 0 || choice > 3) return;
      const q = this.liveCurrent();
      const seconds = (performance.now() - liveQuestionStart) / 1000;
      const correct = choice === q.answer;
      let points = 0;
      if (correct) {
        player.streak++;
        points = Math.round((BASE_POINTS + SPEED_BONUS * Math.max(0, 1 - seconds / LIVE_TIME)) * Scoring.multiplier(player.streak));
      } else {
        player.streak = 0;
      }
      player.score += points;
      player.lastPoints = points;
      player.lastCorrect = correct;
      live.answers[playerId] = choice;
      live.counts[choice]++;
      if (this.liveAnsweredCount() >= live.players.length) liveTimers.push(setTimeout(() => this.liveReveal(), 500));
    },

    liveReveal() {
      const live = this.live;
      if (live.phase !== 'question') return;
      this.liveClearTimers();
      // Players who didn't answer get 0 points and lose their streak
      live.players.forEach(p => {
        if (live.answers[p.id] === undefined) { p.lastPoints = 0; p.lastCorrect = false; p.streak = 0; }
      });
      live.phase = 'reveal';
      Sound.pop();
      const q = this.liveCurrent();
      const ranked = this.liveRanked();
      const results = {};
      ranked.forEach((p, i) => { if (!p.isBot) results[p.id] = { correct: p.lastCorrect, points: p.lastPoints, score: p.score, rank: i + 1, streak: p.streak }; });
      this.liveSend({ type: 'reveal', index: live.index, correct: q.answer, correctText: q.choices[q.answer], explain: q.explain, results, players: ranked.length });
      this.$nextTick(() => this.liveDrawChart());
    },

    liveDrawChart() {
      const q = this.liveCurrent();
      const colors = ['#D61F3B', '#1368CE', '#F5B800', '#1E7B0A'];
      drawChart('chart-live', {
        type: 'bar',
        data: {
          labels: q.choices.map((c, i) => (i === q.answer ? '✓ ' : '') + this.shapes[i].label),
          datasets: [{ label: 'Players', data: this.live.counts.slice(), backgroundColor: colors, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 64 }]
        },
        options: baseBarOptions({
          plugins: { legend: { display: false }, tooltip: { callbacks: { title: items => q.choices[items[0].dataIndex], label: c => ' ' + c.raw + ' player' + (c.raw === 1 ? '' : 's') } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: CHART_INK, font: { family: 'Nunito', weight: '700' } } },
            y: { beginAtZero: true, grid: { color: CHART_GRID }, border: { display: false }, ticks: { color: CHART_INK, precision: 0 } }
          }
        })
      });
    },

    liveNext() {
      if (this.live.index + 1 < this.live.questions.length) {
        this.live.index++;
        this.liveShowQuestion();
      } else {
        this.liveEnd();
      }
    },

    liveEnd() {
      this.liveClearTimers();
      this.live.phase = 'podium';
      const ranked = this.liveRanked();
      const results = {};
      ranked.forEach((p, i) => { if (!p.isBot) results[p.id] = { rank: i + 1, score: p.score }; });
      this.liveSend({ type: 'end', results, podium: ranked.slice(0, 3).map(p => p.nickname), players: ranked.length });
      setTimeout(() => { Sound.fanfare(); Celebrate.big(); }, 400);
    },

    // DEMO "Skip to podium": end the game now with the current scores
    liveSkipToPodium() {
      if (!['question', 'reveal'].includes(this.live.phase)) return;
      this.liveEnd();
    },

    liveClearTimers() {
      liveTimers.forEach(clearTimeout);
      liveTimers = [];
      clearInterval(liveTick);
      liveTick = null;
    },

    // Called when the teacher leaves the Host screen or clicks "End game"
    liveCleanup() {
      this.liveClearTimers();
      if (liveChannel) { this.liveSend({ type: 'closed' }); liveChannel.close(); liveChannel = null; }
      this.live.phase = 'setup';
      this.live.players = [];
    },

    /* ======================= PLAYER (second tab) ======================= */
    player: { phase: 'form', pin: '', nickname: '', id: '', title: '', question: null, index: -1, choice: null, result: null, final: null, error: '', total: 0 },

    playerJoin() {
      const p = this.player;
      p.error = '';
      if (!this.liveSupported()) { p.error = 'This browser does not support live games (BroadcastChannel).'; return; }
      if (!/^\d{6}$/.test(p.pin.trim())) { p.error = 'The game PIN has 6 numbers.'; return; }
      p.nickname = this.student.nickname; // play under the student's own profile name
      p.pin = p.pin.trim();
      p.id = 'p-' + Math.random().toString(36).slice(2, 9);
      p.phase = 'connecting';
      if (playerChannel) playerChannel.close();
      playerChannel = new BroadcastChannel(CHANNEL_NAME);
      playerChannel.onmessage = e => this.playerOnMessage(e.data);
      playerChannel.postMessage({ type: 'join', pin: p.pin, playerId: p.id, nickname: p.nickname, avatar: this.student.avatar });
      setTimeout(() => {
        if (p.phase === 'connecting') {
          p.phase = 'form';
          p.error = 'No game found with that PIN. Make sure the teacher’s “Host Live Game” screen is open in another tab of this same browser.';
        }
      }, 2500);
    },

    playerOnMessage(m) {
      const p = this.player;
      if (!m || m.pin !== p.pin) return;
      if (m.playerId && m.playerId !== p.id) return; // a message for another player
      switch (m.type) {
        case 'joined': p.phase = 'lobby'; p.title = m.title; Sound.pop(); break;
        case 'join-error': p.phase = 'form'; p.error = m.reason; break;
        case 'question':
          Object.assign(p, { phase: 'question', index: m.index, total: m.total, question: { text: m.question, choices: m.choices }, choice: null });
          Sound.go();
          break;
        case 'reveal': {
          const r = m.results[p.id] || { correct: false, points: 0, score: 0, rank: m.players };
          p.result = { ...r, correctIdx: m.correct, correctText: m.correctText, explain: m.explain, players: m.players };
          p.phase = 'reveal';
          r.correct ? Sound.correct() : Sound.wrong();
          break;
        }
        case 'end':
          p.final = { ...(m.results[p.id] || {}), podium: m.podium, players: m.players };
          p.phase = 'end';
          if (p.final.rank && p.final.rank <= 3) { Celebrate.big(); Sound.fanfare(); }
          break;
        case 'closed':
          if (p.phase !== 'end') { p.phase = 'form'; p.error = 'The teacher closed the game.'; }
          break;
      }
    },

    playerAnswer(i) {
      const p = this.player;
      if (p.phase !== 'question') return;
      p.choice = i;
      p.phase = 'answered';
      Sound.click();
      playerChannel.postMessage({ type: 'answer', pin: p.pin, playerId: p.id, index: p.index, choice: i });
    },

    playerLeave() {
      if (playerChannel) {
        playerChannel.postMessage({ type: 'leave', pin: this.player.pin, playerId: this.player.id });
        playerChannel.close();
        playerChannel = null;
      }
      Object.assign(this.player, { phase: 'form', error: '', question: null, result: null, final: null });
    }
  };
}
