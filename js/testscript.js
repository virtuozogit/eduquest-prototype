/* =====================================================================
   tests.js — Zero-dependency unit & logic test suite for EduQuest
   Run in browser console: runEduQuestTests()
   Or open index.html?test=1 to run automatically on load.
   ===================================================================== */

function runEduQuestTests() {
  let passed = 0;
  let failed = 0;
  const failures = [];

  function assert(condition, name) {
    if (condition) {
      passed++;
      console.log(`%c✓ PASS:%c ${name}`, 'color:#16a34a;font-weight:bold', 'color:inherit');
    } else {
      failed++;
      failures.push(name);
      console.error(`✗ FAIL: ${name}`);
    }
  }

  function assertEqual(actual, expected, name) {
    assert(actual === expected, `${name} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
  }

  console.group('🧪 EduQuest Prototype Test Suite');

  // 1. DATA INTEGRITY TESTS
  console.group('1. Data & Questions Integrity');
  assert(EQ_DATA.subjects.length === 3, 'Has 3 subjects (Math, Science, English)');
  EQ_DATA.subjects.forEach(subj => {
    subj.quests.forEach(q => {
      assert(q.questions.length === 9, `${q.id} has 9 questions`);
      q.questions.forEach((item, idx) => {
        assert(item.choices.length === 4, `${q.id} Q${idx + 1} has 4 choices`);
        assert(item.answer >= 0 && item.answer <= 3, `${q.id} Q${idx + 1} has valid answer index`);
        assert(typeof item.explain === 'string' && item.explain.trim().length > 0, `${q.id} Q${idx + 1} has explanation`);
      });
    });
  });
  console.groupEnd();

  // 2. SCORING & ADAPTIVE ENGINE TESTS (quiz.js)
  console.group('2. Scoring & Adaptive Rules');
  assertEqual(Scoring.multiplier(1), 1.0, 'Streak 1 multiplier is 1.0');
  assertEqual(Scoring.multiplier(3), 1.2, 'Streak 3 multiplier is 1.2');
  assertEqual(Scoring.multiplier(10), 1.5, 'Streak multiplier caps at 1.5');
  assertEqual(Scoring.points(20, 1), 1000, 'Instant answer at streak 1 gives 1000 pts');
  assertEqual(Scoring.points(0, 1), 500, '0s left answer at streak 1 gives 500 pts');
  assertEqual(Scoring.stars(90), 3, '90% accuracy gives 3 stars');
  assertEqual(Scoring.stars(60), 2, '60% accuracy gives 2 stars');
  assertEqual(Scoring.stars(20), 1, '20% accuracy still gives 1 star');
  assertEqual(Scoring.level(0), 1, '0 XP is Level 1');
  assertEqual(Scoring.level(150), 2, '150 XP is Level 2');

  assertEqual(Adaptive.nextMode(85, 'normal'), 'up', '85% in normal levels up to up');
  assertEqual(Adaptive.nextMode(40, 'normal'), 'down', '40% in normal drops to down');
  assertEqual(Adaptive.nextMode(65, 'normal'), 'normal', '65% in normal stays normal');
  const samplePool = EQ_DATA.subjects[0].quests[0].questions;
  const pickedUp = Adaptive.pick(samplePool, 'up');
  assertEqual(pickedUp.length, 6, 'Adaptive.pick returns 6 questions');
  assertEqual(pickedUp[0].difficulty, 'easy', 'Questions are sorted easiest first');
  assertEqual(pickedUp[5].difficulty, 'hard', 'Questions are sorted hardest last');
  console.groupEnd();

  // 3. BADGES EVALUATION TESTS (quiz.js)
  console.group('3. Badge Unlocking');
  const mockStudent = defaultStudent();
  mockStudent.badges = [];
  const mockResult = { accuracy: 100, bestStreak: 5, avgTime: 4.5, improved: true };
  const unlocked = Badges.evaluate(mockStudent, mockResult);
  assert(unlocked.includes('first-steps'), 'Unlocks First Steps');
  assert(unlocked.includes('perfect'), 'Unlocks Perfect Score on 100%');
  assert(unlocked.includes('on-fire'), 'Unlocks On Fire on 5 streak');
  assert(unlocked.includes('speedy'), 'Unlocks Lightning Fast under 6s');
  assert(unlocked.includes('comeback'), 'Unlocks Comeback Kid when improved');
  assert(unlocked.includes('explorer'), 'Unlocks Explorer when all 3 subjects played');
  console.groupEnd();

  // 4. BATTLEQUEST & PARTY RULES (battle.js & party.js)
  console.group('4. BattleQuest & Raid Rules');
  assert(BattleRules.isBoss(5) && !BattleRules.isBoss(4), 'Every 5th stage is a boss');
  assertEqual(BattleRules.comboMult(1), 1.0, 'Battle combo 1 is x1.0');
  assertEqual(BattleRules.comboMult(10), 2.5, 'Battle combo caps at x2.5');
  const bossLoot = BattleRules.makeItem(5, true);
  assert(['rare', 'epic', 'legendary'].includes(bossLoot.rarity), 'Boss loot is never common');
  const eventLoot = PartyRules.raidLoot(1, true);
  assertEqual(eventLoot.rarity, 'legendary', 'Special event raid always drops Legendary loot');
  console.groupEnd();

  // 5. DASHBOARD MASTERY BANDS (dashboard.js)
  console.group('5. Dashboard Mastery Bands');
  assertEqual(MASTERY.band(null), 'none', 'null mastery is none');
  assertEqual(MASTERY.band(80), 'high', '80% is high (Mastered)');
  assertEqual(MASTERY.band(50), 'mid', '50% is mid (Developing)');
  assertEqual(MASTERY.band(49), 'low', '49% is low (Needs help)');
  console.groupEnd();

  // 6. STORAGE ISOLATION TEST (store.js)
  console.group('6. LocalStorage Wrapper');
  Store.set('__test_key__', { ok: true });
  assertEqual(Store.get('__test_key__', null)?.ok, true, 'Store.set and Store.get round-trip works');
  localStorage.removeItem('eduquest.v1.__test_key__');
  console.groupEnd();

  console.groupEnd();
  console.log(`\n%cTest Summary: ${passed} passed, ${failed} failed`, `font-weight:bold;font-size:14px;color:${failed ? '#e11d48' : '#16a34a'}`);
  return { passed, failed, failures };
}

// Auto-run if ?test=1 is in the URL
if (location.search.includes('test=1')) {
  window.addEventListener('load', () => setTimeout(runEduQuestTests, 500));
}