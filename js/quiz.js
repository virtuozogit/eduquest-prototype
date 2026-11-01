/* =====================================================================
   quiz.js — the Kahoot-style challenge engine
   ---------------------------------------------------------------------
   Contains:
     1. Settings (time per question, points)
     2. Scoring  — points, streak multiplier, stars, XP, levels
     3. Adaptive — the simple rules that choose question difficulty
     4. Badges   — the rules that unlock badges
     5. quizMixin() — the Alpine state + methods used by the challenge
        screen. app.js merges this into the main app.
   ===================================================================== */

/* 1. SETTINGS ------------------------------------------------------- */
const QUIZ_TIME = 20;               // seconds per question
const QUESTIONS_PER_CHALLENGE = 6;  // questions picked from a quest's pool of 9
const BASE_POINTS = 500;            // points for any correct answer
const SPEED_BONUS = 500;            // extra points for answering fast (max)
const XP_PER_LEVEL = 150;           // XP needed for each new level

/* 2. SCORING -------------------------------------------------------- */
const Scoring = {
  // Streak multiplier: 1st correct in a row ×1.0, 2nd ×1.1, 3rd ×1.2 ... max ×1.5
  multiplier(streak) {
    return Math.min(1 + 0.1 * Math.max(0, streak - 1), 1.5);
  },
  // Points = (base + speed bonus) × streak multiplier
  // Speed bonus shrinks from 500 to 0 as the 20-second timer runs out.
  points(secondsLeft, streak) {
    return Math.round((BASE_POINTS + SPEED_BONUS * (secondsLeft / QUIZ_TIME)) * this.multiplier(streak));
  },
  // Every finished challenge earns at least 1 star (we celebrate effort!)
  stars(accuracy) {
    if (accuracy >= 85) return 3;
    if (accuracy >= 60) return 2;
    return 1;
  },
  // XP = 10 per correct answer + 5 per star + 25 the first time you finish a quest
  xp(correct, stars, firstClear) {
    return correct * 10 + stars * 5 + (firstClear ? 25 : 0);
  },
  level(xp) { return Math.floor(xp / XP_PER_LEVEL) + 1; },
  levelProgress(xp) { return Math.round(((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100); }
};

/* 3. ADAPTIVE LOGIC (rules-based) ----------------------------------
   Each quest remembers a "mode" for the student:
     'down'   = warm-up   → mostly EASY questions   (3 easy, 2 medium, 1 hard)
     'normal' = balanced  →                         (2 easy, 2 medium, 2 hard)
     'up'     = level up  → mostly MEDIUM/HARD      (1 easy, 2 medium, 3 hard)
   After each challenge:
     accuracy ≥ 80%  → move one step UP   (more medium/hard next time)
     accuracy < 50%  → move one step DOWN (easier questions + re-read lesson)
     otherwise       → stay the same
   ------------------------------------------------------------------- */
const Adaptive = {
  MIX: {
    down: { easy: 3, medium: 2, hard: 1 },
    normal: { easy: 2, medium: 2, hard: 2 },
    up: { easy: 1, medium: 2, hard: 3 }
  },
  LABELS: {
    down: { name: 'Warm-up', emoji: '🌱', note: 'More easy questions to build your confidence.' },
    normal: { name: 'Balanced', emoji: '⭐', note: 'A mix of easy, medium, and hard questions.' },
    up: { name: 'Level Up', emoji: '🚀', note: 'More medium and hard questions — you’re ready!' }
  },

  // Pick questions from the pool following the mix for this mode.
  pick(pool, mode) {
    const mix = this.MIX[mode] || this.MIX.normal;
    const chosen = [];
    ['easy', 'medium', 'hard'].forEach(level => {
      const bucket = Util.shuffle(pool.filter(q => q.difficulty === level));
      chosen.push(...bucket.slice(0, mix[level]));
    });
    // If a bucket was too small, top up with any unused questions
    const leftovers = Util.shuffle(pool.filter(q => !chosen.includes(q)));
    while (chosen.length < Math.min(QUESTIONS_PER_CHALLENGE, pool.length)) chosen.push(leftovers.shift());
    // Easy first, hard last — like climbing a mountain
    const order = { easy: 0, medium: 1, hard: 2 };
    return chosen.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
  },

  nextMode(accuracy, mode) {
    if (accuracy >= 80) return mode === 'down' ? 'normal' : 'up';
    if (accuracy < 50) return mode === 'up' ? 'normal' : 'down';
    return mode;
  },

  // Friendly message explaining what changed
  message(accuracy, oldMode, newMode) {
    if (accuracy >= 80 && oldMode === 'up') return 'Amazing! You’re already at the top level — keep shining! 🏆';
    if (accuracy >= 80) return 'Great job! Leveling up the difficulty 🚀 Next time you’ll get more medium and hard questions.';
    if (accuracy < 50) return 'Let’s power up first! 💪 Re-read the lesson, and next time we’ll start with easier questions.';
    return 'Nice work! You’re on track ⭐ Score 80% or more to level up the difficulty.';
  }
};

/* 4. BADGES ----------------------------------------------------------
   evaluate() returns the ids of badges unlocked by this result.
   r = the result object built in finishChallenge().                   */
const Badges = {
  evaluate(student, r) {
    const has = id => student.badges.includes(id);
    const unlocked = [];
    const unlock = id => { if (!has(id)) unlocked.push(id); };

    unlock('first-steps');
    if (r.accuracy === 100) unlock('perfect');
    if (r.bestStreak >= 5) unlock('on-fire');
    if (r.avgTime < 6 && r.accuracy >= 80) unlock('speedy');
    if (r.improved) unlock('comeback');
    if (student.streak.count >= 3) unlock('steady');

    const triedSubject = s => s.quests.some(q => student.quests[q.id]);
    if (EQ_DATA.subjects.every(triedSubject)) unlock('explorer');

    EQ_DATA.subjects.forEach(s => {
      if (s.quests.every(q => student.quests[q.id])) unlock(s.id + '-star');
    });
    return unlocked;
  }
};

/* 5. ALPINE MIXIN -----------------------------------------------------
   Timers are kept OUTSIDE Alpine's reactive state on purpose.         */
let quizTimer = null;

function quizMixin() {
  return {
    quiz: null,      // the challenge in progress
    results: null,   // the last finished challenge (results screen)

    shapes: [
      { name: 'triangle', cls: 'ans-red', label: 'Red triangle' },
      { name: 'diamond', cls: 'ans-blue', label: 'Blue diamond' },
      { name: 'circle', cls: 'ans-yellow', label: 'Yellow circle' },
      { name: 'square', cls: 'ans-green', label: 'Green square' }
    ],

    startChallenge(id) {
      const src = this.findQuiz(id);
      if (!src) { this.go('#/student'); return; }
      const progress = this.student.quests[id];
      const mode = src.custom ? 'normal' : (progress?.mode || 'normal');
      const questions = src.custom ? Util.shuffle(src.questions) : Adaptive.pick(src.questions, mode);

      this.quiz = {
        id, custom: !!src.custom, title: src.title, code: src.code || 'Teacher quiz',
        subjectId: src.subjectId, mode, questions,
        index: 0, phase: 'getready', countdown: 3, timeLeft: QUIZ_TIME,
        chosen: null, score: 0, streak: 0, bestStreak: 0, correct: 0,
        answers: [], lastPoints: 0, message: ''
      };
      this.stopQuizTimer();
      Sound.tick();
      quizTimer = setInterval(() => {
        this.quiz.countdown--;
        if (this.quiz.countdown > 0) { Sound.tick(); return; }
        this.showQuestion();
      }, 900);
    },

    currentQuestion() { return this.quiz ? this.quiz.questions[this.quiz.index] : null; },

    showQuestion() {
      this.stopQuizTimer();
      const quiz = this.quiz;
      quiz.phase = 'question';
      quiz.chosen = null;
      quiz.timeLeft = QUIZ_TIME;
      Sound.go();
      const started = performance.now();
      let lastWhole = QUIZ_TIME;
      quizTimer = setInterval(() => {
        quiz.timeLeft = Math.max(0, QUIZ_TIME - (performance.now() - started) / 1000);
        const whole = Math.ceil(quiz.timeLeft);
        if (whole !== lastWhole && whole <= 5 && whole > 0) Sound.tick(); // ticking in the last 5 seconds
        lastWhole = whole;
        if (quiz.timeLeft <= 0) this.answer(null); // time ran out
      }, 100);
    },

    // choice = 0..3, or null when the timer ran out
    answer(choice) {
      const quiz = this.quiz;
      if (!quiz || quiz.phase !== 'question') return;
      this.stopQuizTimer();
      const q = this.currentQuestion();
      const isCorrect = choice === q.answer;
      let points = 0;
      if (isCorrect) {
        quiz.streak++;
        quiz.bestStreak = Math.max(quiz.bestStreak, quiz.streak);
        points = Scoring.points(quiz.timeLeft, quiz.streak);
        quiz.score += points;
        quiz.correct++;
        quiz.message = Util.pick(EQ_DATA.cheers);
        Sound.correct();
        if (quiz.streak >= 3) Celebrate.small();
      } else {
        quiz.streak = 0;
        quiz.message = choice === null ? EQ_DATA.timeUpLines[0] : Util.pick(EQ_DATA.encouragements);
        Sound.wrong();
      }
      quiz.chosen = choice;
      quiz.lastPoints = points;
      quiz.answers.push({ q, chosen: choice, isCorrect, points, time: QUIZ_TIME - quiz.timeLeft });
      quiz.phase = 'feedback';
    },

    nextQuestion() {
      if (!this.quiz) return;
      if (this.quiz.index + 1 < this.quiz.questions.length) {
        this.quiz.index++;
        this.showQuestion();
      } else {
        this.finishChallenge();
      }
    },

    stopQuizTimer() { clearInterval(quizTimer); quizTimer = null; },

    quitChallenge() {
      const back = this.quiz && !this.quiz.custom ? '#/student/subject/' + this.quiz.subjectId : '#/student';
      this.stopQuizTimer();
      this.quiz.phase = 'done';
      this.go(back);
    },

    finishChallenge() {
      this.stopQuizTimer();
      const quiz = this.quiz;
      const s = this.student;
      const total = quiz.questions.length;
      const accuracy = Math.round((100 * quiz.correct) / total);
      const stars = Scoring.stars(accuracy);
      const prev = s.quests[quiz.id];
      const xpGained = Scoring.xp(quiz.correct, stars, !prev);
      const newMode = quiz.custom ? 'normal' : Adaptive.nextMode(accuracy, quiz.mode);
      const oldLevel = Scoring.level(s.xp);

      // Save progress for this quest
      s.quests[quiz.id] = {
        attempts: (prev?.attempts || 0) + 1,
        firstAccuracy: prev ? prev.firstAccuracy : accuracy,
        bestAccuracy: Math.max(prev?.bestAccuracy || 0, accuracy),
        lastAccuracy: accuracy,
        bestScore: Math.max(prev?.bestScore || 0, quiz.score),
        stars: Math.max(prev?.stars || 0, stars),
        mode: newMode,
        lastPlayed: Util.dayKey(0)
      };
      s.xp += xpGained;

      // Daily learning streak
      const today = Util.dayKey(0);
      if (s.streak.last !== today) {
        s.streak.count = s.streak.last === Util.dayKey(-1) ? s.streak.count + 1 : 1;
        s.streak.last = today;
      }

      const result = {
        id: quiz.id, title: quiz.title, code: quiz.code, custom: quiz.custom, subjectId: quiz.subjectId,
        score: quiz.score, correct: quiz.correct, total, accuracy, stars, xpGained,
        bestStreak: quiz.bestStreak,
        avgTime: Util.avg(quiz.answers.map(a => a.time)),
        improved: !!prev && accuracy > prev.bestAccuracy,
        levelUp: Scoring.level(s.xp) > oldLevel,
        newLevel: Scoring.level(s.xp),
        oldMode: quiz.mode, newMode,
        adaptiveMessage: quiz.custom ? '' : Adaptive.message(accuracy, quiz.mode, newMode),
        mistakes: quiz.answers.filter(a => !a.isCorrect)
      };
      result.newBadges = Badges.evaluate(s, result);
      s.badges.push(...result.newBadges);
      result.leaderboard = this.buildQuestLeaderboard(quiz.id, quiz.score);
      this.saveStudent();

      // (We keep this.quiz around: setting it to null while the challenge
      // screen is still on the page causes errors. Changing the route
      // removes the screen; startChallenge() replaces the object.)
      quiz.phase = 'done';
      this.results = result;
      this.go('#/student/results');
      setTimeout(() => {
        if (result.newBadges.length || result.levelUp || stars === 3) { Celebrate.big(); Sound.fanfare(); }
        else Celebrate.burst();
      }, 300);
    },

    // Classmate scores for this quest (simulated from their mastery) + you
    buildQuestLeaderboard(questId, myScore) {
      const mates = EQ_DATA.classmates.filter(c => c.mastery[questId] != null);
      const pool = Util.shuffle(mates.length >= 5 ? mates : EQ_DATA.classmates).slice(0, 5);
      const rows = pool.map(c => {
        const m = c.mastery[questId] ?? Math.round(c.skill * 100);
        return { name: c.nickname, avatar: c.avatar, score: Math.round((m / 100) * QUESTIONS_PER_CHALLENGE * (600 + Math.random() * 300)), me: false };
      });
      rows.push({ name: this.student.nickname + ' (you)', avatar: this.student.avatar, score: myScore, me: true });
      return rows.sort((a, b) => b.score - a.score);
    }
  };
}
