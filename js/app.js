/* =====================================================================
   app.js — the main Alpine.js app: routing, shared state, helpers
   ---------------------------------------------------------------------
   index.html uses <body x-data="app()">. This file builds that object
   by merging the core below with the mixins from:
     quiz.js (challenge engine) · live.js (live game) · dashboard.js ·
     battle.js (BattleQuest)
   Routes use the URL hash, e.g. #/student/subject/math, so the site
   works from a file and from a GitHub Pages subfolder.
   ===================================================================== */

// Merge objects while keeping getters/methods intact
function mergeMixins(target, ...sources) {
  sources.forEach(src => Object.defineProperties(target, Object.getOwnPropertyDescriptors(src)));
  return target;
}

const SCREEN_TICK_SECONDS = 5;   // how often we count learning time
const BREAK_SNOOZE_MINUTES = 5;  // "5 more minutes" button for parents

function app() {
  const core = {
    data: EQ_DATA,

    // ---- routing ----
    screen: 'landing',   // e.g. 'student-home', 'teacher-heatmap'
    role: '',            // 'student' | 'teacher' | 'parent' | ''
    param: '',           // e.g. subject id or quest id

    // ---- saved state (localStorage) ----
    student: Store.get('student', null) || defaultStudent(),
    settings: Store.get('settings', { limitMin: 0, sound: true }),
    assignments: Store.get('assignments', []),
    customQuizzes: Store.get('quizzes', []),

    // ---- UI state ----
    toastMsg: '',
    showBreak: false,
    breakSnoozeUntil: 0,
    showAvatarModal: false,
    showResetModal: false,
    avatarDraft: { nickname: '', avatar: '' },
    libraryFilter: 'all',
    librarySearch: '',
    previewQuiz: null,
    assignDraft: null,     // { quizId, title, due }
    builder: null,

    init() {
      Sound.setEnabled(this.settings.sound);
      this.setupIcons();
      window.addEventListener('hashchange', () => this.onRoute());
      this.onRoute();
      setInterval(() => this.screenTimeTick(), SCREEN_TICK_SECONDS * 1000);
      this.resetBuilder();
    },

    /* ============================ ROUTING ============================ */
    go(hash) { location.hash = hash; },

    onRoute() {
      const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
      const prev = this.screen;
      const role = parts[0] || '';
      let screen = 'landing', param = '';

      if (role === 'student') {
        const sub = parts[1] || 'home';
        screen = 'student-' + sub;
        param = parts[2] || '';
      } else if (role === 'teacher') {
        screen = 'teacher-' + (parts[1] || 'dashboard');
      } else if (role === 'parent') {
        screen = 'parent';
      }

      // Leaving screens that run timers → clean up
      if (prev === 'student-play' && screen !== 'student-play') { this.stopQuizTimer(); if (this.quiz) this.quiz.phase = 'done'; }
      if (prev === 'teacher-live' && screen !== 'teacher-live') this.liveCleanup();
      if (prev === 'student-join' && screen !== 'student-join') this.playerLeave();
      if (prev === 'student-battle' && screen !== 'student-battle') this.leaveFight();

      // Guard: results need a finished challenge
      if (screen === 'student-results' && !this.results) { this.go('#/student'); return; }

      this.role = role;
      this.screen = screen;
      this.param = param;
      window.scrollTo(0, 0);

      if (screen === 'student-play') this.startChallenge(param);
      if (screen === 'teacher-dashboard') this.$nextTick(() => this.drawTeacherCharts());
      if (screen === 'parent') this.$nextTick(() => this.drawParentCharts());
    },

    /* ============================ ICONS ==============================
       Lucide turns <i data-lucide="star"></i> into an SVG icon. Alpine
       adds/removes elements as screens change, so we watch the page and
       convert any new <i data-lucide> tags. For icon names that change,
       use x-html="icon('name')".                                        */
    setupIcons() {
      const render = () => {
        if (window.lucide && document.querySelector('i[data-lucide]')) {
          lucide.createIcons(lucide.icons ? { icons: lucide.icons } : undefined);
        }
      };
      let queued = false;
      new MutationObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; render(); });
      }).observe(document.body, { childList: true, subtree: true });
      render();
    },
    icon(name, cls = 'w-5 h-5') { return `<i data-lucide="${name}" class="${cls}"></i>`; },

    // The EduQuest logo (purple tile, open book, yellow star) as inline SVG
    logo(cls = 'w-10 h-10') {
      return `<svg viewBox="0 0 64 64" class="${cls}" role="img" aria-label="EduQuest logo">
        <rect width="64" height="64" rx="16" fill="#5B3FD9"/>
        <polygon points="32,9 34.2,14.9 40.6,15.2 35.6,19.2 37.3,25.3 32,21.8 26.7,25.3 28.4,19.2 23.4,15.2 29.8,14.9" fill="#FBBF24"/>
        <path d="M12 32q10-4 19 1v19q-9-5-19-1z" fill="#fff"/>
        <path d="M52 32q-10-4-19 1v19q9-5 19-1z" fill="#E0DBFB"/></svg>`;
    },

    // Kahoot-style answer shapes: 0 triangle, 1 diamond, 2 circle, 3 square
    shapeSvg(i, cls = 'w-7 h-7') {
      const paths = {
        triangle: '<path d="M12 3 22 20H2z"/>',
        diamond: '<path d="M12 2 22 12 12 22 2 12z"/>',
        circle: '<circle cx="12" cy="12" r="10"/>',
        square: '<rect x="3" y="3" width="18" height="18" rx="2"/>'
      };
      return `<svg viewBox="0 0 24 24" class="${cls}" fill="currentColor" aria-hidden="true">${paths[this.shapes[i].name]}</svg>`;
    },

    // Winding dashed path behind the quest map nodes. Each step is 112px
    // tall; nodes sit at 20% / 80% of the width (see .quest-step in CSS).
    questPath(count) {
      const step = 112, x = i => (i === count ? 50 : i % 2 ? 80 : 20);
      let d = `M ${x(0)} ${step / 2}`;
      for (let i = 0; i < count; i++) {
        const y1 = step / 2 + i * step, y2 = y1 + step;
        d += ` C ${x(i)} ${y1 + step / 2}, ${x(i + 1)} ${y2 - step / 2}, ${x(i + 1)} ${y2}`;
      }
      return d;
    },

    teacherNav: [
      { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
      { id: 'heatmap', label: 'Mastery', icon: 'grid-3x3' },
      { id: 'library', label: 'Library', icon: 'library' },
      { id: 'builder', label: 'Quiz Builder', icon: 'pencil-ruler' },
      { id: 'live', label: 'Host Live', icon: 'radio' }
    ],
    teacherTitle() {
      const item = this.teacherNav.find(n => 'teacher-' + n.id === this.screen);
      return item ? item.label : 'Teacher';
    },

    openPlayerTab() { window.open(location.href.split('#')[0] + '#/student/join', '_blank'); },
    totalStars() { return Object.values(this.student.quests).reduce((s, p) => s + (p.stars || 0), 0); },

    /* ============================ HELPERS ============================ */
    avatarUrl(seed) { return 'https://api.dicebear.com/9.x/big-smile/svg?radius=50&backgroundColor=c0aede,d1d4f9,ffd5dc,ffdfbf,b6e3f4&seed=' + encodeURIComponent(seed || 'EduQuest'); },
    fmt(n) { return Util.fmt(n); },
    shortDate(k) { return Util.shortDate(k); },
    subject(id) { return EQ_DATA.subjects.find(s => s.id === id); },

    // Find a built-in quest OR a teacher-made quiz by id
    findQuiz(id) {
      for (const s of EQ_DATA.subjects) {
        const q = s.quests.find(q => q.id === id);
        if (q) return { ...q, subjectId: s.id, custom: false };
      }
      const c = this.customQuizzes.find(q => q.id === id);
      return c ? { ...c, custom: true } : null;
    },

    toast(msg) {
      this.toastMsg = msg;
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => { this.toastMsg = ''; }, 2600);
    },

    saveStudent() { Store.set('student', this.student); },

    toggleSound() {
      this.settings.sound = !this.settings.sound;
      Sound.setEnabled(this.settings.sound);
      Store.set('settings', this.settings);
      if (this.settings.sound) Sound.click();
    },

    /* ========================= STUDENT ============================== */
    level() { return Scoring.level(this.student.xp); },
    levelProgress() { return Scoring.levelProgress(this.student.xp); },
    xpToNext() { return XP_PER_LEVEL - (this.student.xp % XP_PER_LEVEL); },
    hasBadge(id) { return this.student.badges.includes(id); },
    badge(id) { return EQ_DATA.badges.find(b => b.id === id); },
    // Streak only counts if the last learning day was today or yesterday
    streakCount() {
      const s = this.student.streak;
      return s.last === Util.dayKey(0) || s.last === Util.dayKey(-1) ? s.count : 0;
    },

    // 'completed' | 'available' | 'locked' — a quest unlocks when the one before it is finished
    questStatus(subject, index) {
      const q = subject.quests[index];
      if (this.student.quests[q.id]) return 'completed';
      if (index === 0 || this.student.quests[subject.quests[index - 1].id]) return 'available';
      return 'locked';
    },
    questStars(id) { return this.student.quests[id]?.stars || 0; },

    subjectProgress(subject) {
      const done = subject.quests.filter(q => this.student.quests[q.id]).length;
      return { done, total: subject.quests.length, pct: Math.round((100 * done) / subject.quests.length) };
    },
    nextQuest(subject) {
      return subject.quests.find((q, i) => this.questStatus(subject, i) === 'available') || subject.quests[subject.quests.length - 1];
    },

    openQuest(subject, index) {
      if (this.questStatus(subject, index) === 'locked') {
        Sound.wrong();
        this.toast('Finish the quest before this one to unlock it! 🔒');
        return;
      }
      Sound.click();
      this.go('#/student/lesson/' + subject.quests[index].id);
    },

    modeInfo(questId) {
      const mode = this.student.quests[questId]?.mode || 'normal';
      return Adaptive.LABELS[mode];
    },

    openAvatarModal() {
      this.avatarDraft = { nickname: this.student.nickname, avatar: this.student.avatar };
      this.showAvatarModal = true;
    },
    saveAvatar() {
      const nick = this.avatarDraft.nickname.trim().slice(0, 12);
      if (!nick) { this.toast('Pick a fun nickname first!'); return; }
      this.student.nickname = nick;
      this.student.avatar = this.avatarDraft.avatar;
      this.saveStudent();
      this.showAvatarModal = false;
      Sound.pop();
    },

    /* ======================= ASSIGNMENTS ============================ */
    // Assignments show on the student home. "Done" = played on/after the day it was assigned.
    myAssignments() {
      return this.assignments
        .map(a => {
          const quiz = this.findQuiz(a.quizId);
          if (!quiz) return null;
          const p = this.student.quests[a.quizId];
          const done = !!p && p.lastPlayed >= a.assigned;
          const overdue = !done && a.due < Util.dayKey(0);
          return { ...a, quiz, done, overdue, subject: this.subject(quiz.subjectId) };
        })
        .filter(Boolean)
        .sort((a, b) => a.due.localeCompare(b.due));
    },

    openAssign(quizId) {
      const quiz = this.findQuiz(quizId);
      this.assignDraft = { quizId, title: quiz.title, due: Util.dayKey(3) };
    },
    saveAssignment() {
      const d = this.assignDraft;
      if (!d.due) { this.toast('Choose a due date.'); return; }
      this.assignments = this.assignments.filter(a => a.quizId !== d.quizId); // one active assignment per quiz
      this.assignments.push({ id: 'as-' + Date.now(), quizId: d.quizId, due: d.due, assigned: Util.dayKey(0) });
      Store.set('assignments', this.assignments);
      this.assignDraft = null;
      this.toast('Assigned to ' + EQ_DATA.className + '! Students will see it on their home screen. ✅');
    },
    removeAssignment(id) {
      this.assignments = this.assignments.filter(a => a.id !== id);
      Store.set('assignments', this.assignments);
    },

    /* ======================== LIBRARY =============================== */
    libraryItems() {
      const search = this.librarySearch.trim().toLowerCase();
      const builtIn = this.allQuests().map(q => ({ ...q, custom: false }));
      const mine = this.customQuizzes.map(q => ({ ...q, custom: true, subject: this.subject(q.subjectId), competency: 'Custom quiz by ' + EQ_DATA.teacherName }));
      return [...builtIn, ...mine].filter(item => {
        if (this.libraryFilter === 'mine' && !item.custom) return false;
        if (!['all', 'mine'].includes(this.libraryFilter) && item.subjectId !== this.libraryFilter) return false;
        if (!search) return true;
        return (item.title + ' ' + item.competency).toLowerCase().includes(search);
      });
    },
    difficultyMix(questions) {
      const count = d => questions.filter(q => q.difficulty === d).length;
      return count('easy') + ' easy · ' + count('medium') + ' medium · ' + count('hard') + ' hard';
    },

    /* ====================== QUIZ BUILDER ============================ */
    blankQuestion() { return { uid: Math.random().toString(36).slice(2), question: '', choices: ['', '', '', ''], answer: 0, explain: '', difficulty: 'medium' }; },
    resetBuilder() { this.builder = { title: '', subjectId: 'math', questions: [this.blankQuestion()], errors: [] }; },
    addBuilderQuestion() { this.builder.questions.push(this.blankQuestion()); },
    removeBuilderQuestion(i) { if (this.builder.questions.length > 1) this.builder.questions.splice(i, 1); },

    // Pre-fills a short example so the demo is quick
    fillSampleQuiz() {
      this.builder = {
        title: 'Philippine Heroes Quick Check', subjectId: 'english', errors: [],
        questions: [
          { uid: 's1', question: 'Who wrote “Noli Me Tangere”?', choices: ['Andres Bonifacio', 'Jose Rizal', 'Apolinario Mabini', 'Emilio Aguinaldo'], answer: 1, explain: 'Jose Rizal wrote Noli Me Tangere in 1887.', difficulty: 'easy' },
          { uid: 's2', question: 'What is the plural of “hero”?', choices: ['heros', 'heroes', 'heroies', 'hero'], answer: 1, explain: 'Hero ends in o after a consonant, so we add -es: heroes.', difficulty: 'medium' },
          { uid: 's3', question: 'Which word is a proper noun?', choices: ['hero', 'Mabini', 'country', 'teacher'], answer: 1, explain: 'Mabini is the name of a specific person, so it is a proper noun.', difficulty: 'easy' }
        ]
      };
    },

    saveBuilderQuiz() {
      const b = this.builder;
      const errors = [];
      if (!b.title.trim()) errors.push('Give your quiz a title.');
      b.questions.forEach((q, i) => {
        if (!q.question.trim()) errors.push('Question ' + (i + 1) + ' needs text.');
        if (q.choices.some(c => !c.trim())) errors.push('Question ' + (i + 1) + ' needs all 4 choices.');
        if (!q.explain.trim()) errors.push('Question ' + (i + 1) + ' needs an explanation (this powers instant feedback).');
      });
      b.errors = errors;
      if (errors.length) return;
      const quiz = {
        id: 'custom-' + Date.now(),
        title: b.title.trim(),
        subjectId: b.subjectId,
        created: Util.dayKey(0),
        questions: b.questions.map(q => ({ ...q, question: q.question.trim(), choices: q.choices.map(c => c.trim()), explain: q.explain.trim() }))
      };
      this.customQuizzes.push(quiz);
      Store.set('quizzes', this.customQuizzes);
      this.resetBuilder();
      this.toast('Quiz saved! Play it, assign it, or host it live. 🎉');
    },
    deleteCustomQuiz(id) {
      this.customQuizzes = this.customQuizzes.filter(q => q.id !== id);
      this.assignments = this.assignments.filter(a => a.quizId !== id);
      Store.set('quizzes', this.customQuizzes);
      Store.set('assignments', this.assignments);
    },

    /* ======================= SCREEN TIME ============================
       While a student screen is open and visible, add learning time for
       today. When the parent's daily limit is reached, show a friendly
       break reminder (not a punishment).                              */
    screenTimeTick() {
      if (this.role !== 'student' || document.visibilityState !== 'visible') return;
      const today = Util.dayKey(0);
      this.student.time = this.student.time || {};
      this.student.time[today] = (this.student.time[today] || 0) + SCREEN_TICK_SECONDS;
      this.saveStudent();
      const limit = Number(this.settings.limitMin);
      if (limit > 0 && this.student.time[today] >= limit * 60 && Date.now() > this.breakSnoozeUntil && !this.showBreak) {
        this.showBreak = true;
        if (this.quiz) this.stopQuizTimer(); // pause the challenge clock
        Sound.pop();
      }
    },
    todayMinutes() { return Math.floor(((this.student.time || {})[Util.dayKey(0)] || 0) / 60); },
    todaySeconds() { return (this.student.time || {})[Util.dayKey(0)] || 0; },

    takeBreak() {
      this.showBreak = false;
      this.breakSnoozeUntil = Date.now() + BREAK_SNOOZE_MINUTES * 60 * 1000;
      this.go('#/');
    },
    parentExtend() {
      this.showBreak = false;
      this.breakSnoozeUntil = Date.now() + BREAK_SNOOZE_MINUTES * 60 * 1000;
      // The challenge clock was paused by the reminder — restart this question
      if (this.quiz && ['question', 'getready'].includes(this.quiz.phase)) this.showQuestion();
    },
    saveSettings() {
      Store.set('settings', this.settings);
      this.toast('Saved! Daily limit: ' + (Number(this.settings.limitMin) ? this.settings.limitMin + ' min' : 'off'));
      this.$nextTick(() => this.drawParentCharts());
    },
    resetTodayTime() {
      this.student.time[Util.dayKey(0)] = 0;
      this.breakSnoozeUntil = 0;
      this.saveStudent();
      this.toast('Today’s timer reset (demo).');
      this.$nextTick(() => this.drawParentCharts());
    },

    /* ==================== PARENT DATA RIGHTS ======================== */
    // RA 10173 gives parents the right to access their child's data.
    exportChildData() {
      const blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), student: this.student }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'eduquest-child-data.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },

    /* ========================= RESET ================================ */
    resetDemo() {
      Store.reset();
      location.hash = '#/';
      location.reload();
    }
  };

  return mergeMixins(core, quizMixin(), dashboardMixin(), liveMixin(), battleMixin());
}
