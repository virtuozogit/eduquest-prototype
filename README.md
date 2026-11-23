# EduQuest — Prototype

> **Learning that feels like a game, not a task.**
> A clickable prototype by **EduTech Innovators** (Silverio · Aglugub · Rey · Villegas · Perez) for CCINOV8.

EduQuest is a gamified, mobile-first learning platform for Filipino elementary students. This prototype mixes **Canvas LMS** structure (subjects, modules, assignments, teacher dashboards) with **Kahoot** energy (timed questions, colored answer shapes, speed points, streaks, leaderboards, podium). It adds the feature that sets EduQuest apart: **instant feedback with an explanation after every answer.**

Sample content: **Grade 4 · Mathematics, Science, English** (10 quests, 90 questions). Each quest lists the competency it teaches, written in a MATATAG-like style (sample content).

---

## Run it locally

No install, no build step. Pick one:

1. **Double-click `index.html`.** It opens in your browser.
2. *(Optional)* Run a local server from this folder: `python -m http.server 8000`, then open <http://localhost:8000>.

You need an internet connection the first time, because the libraries, fonts, and avatars load from CDNs.

## Deploy to GitHub Pages

1. Create a new **public** repository on GitHub, for example `eduquest-prototype`.
2. Upload every file in this folder **with the same structure** (`index.html`, `css/`, `js/`, `README.md`):
   - **On the website:** *Add file → Upload files*, drag the files and folders in, then *Commit changes*.
   - **With git:**
     ```bash
     git init
     git add .
     git commit -m "EduQuest prototype"
     git branch -M main
     git remote add origin https://github.com/<your-username>/eduquest-prototype.git
     git push -u origin main
     ```
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, set **Source: Deploy from a branch**, **Branch: `main`**, folder **`/ (root)`**, then click **Save**.
5. Wait about 1–2 minutes and refresh. Your site appears at
   `https://<your-username>.github.io/eduquest-prototype/`

All paths are relative, so the site works inside the `/eduquest-prototype/` subfolder.

---

## What’s inside

| Role | Screens |
|---|---|
| **Student** (mobile-first) | Home (avatar, level, XP, streak, badges, subject cards, teacher assignments) · Quest map · Lesson · Kahoot-style challenge with instant feedback · Results (stars, XP, badges, review mistakes, class leaderboard) · Badges · Join live game · **BattleQuest** (quiz-powered RPG with an inventory) |
| **Teacher** (Canvas-like) | Class dashboard (Lean Canvas key metrics, charts, sortable roster) · Mastery heatmap · Challenge library + assign with due date · Quiz builder · Host Live Game (PIN, lobby, bots, answer chart, top 5, podium) |
| **Parent** | Weekly time chart · progress stats · subjects improving vs. needing help · recent badges · **daily screen-time limit** · download/delete child data (RA 10173) · plan info (parents only) |

### Scoring and adaptive rules (see `js/quiz.js`)

- **Points:** 500 for a correct answer + up to 500 speed bonus (shrinks over the 20 s timer) × **streak multiplier** (×1.0, ×1.1, … up to ×1.5).
- **Stars:** 85%+ = 3 ⭐, 60%+ = 2 ⭐, otherwise 1 ⭐ (finishing always earns a star).
- **XP:** 10 per correct answer + 5 per star + 25 the first time you finish a quest. 150 XP per level.
- **Adaptive difficulty:** each challenge uses 6 of the quest’s 9 questions.
  - Accuracy **≥ 80%** → next attempt uses more medium/hard questions (🚀 Level Up).
  - Accuracy **< 50%** → the app suggests re-reading the lesson and serves easier questions (🌱 Warm-up).
  - Otherwise, the difficulty stays the same (⭐ Balanced).

### BattleQuest (see `js/battle.js`)

A quiz-powered RPG that uses the same questions as the quests. Open it from the student home card or the **BattleQuest** tab.

- **Correct answer → your hero attacks.** Answers in a row build a **combo** (×1.0, ×1.25, … up to ×2.5 damage). A wrong answer ends the combo.
- **Critical hits:** every attack has a chance to deal **double damage**. The chance (CRIT %) comes from your equipped weapon.
- **Wrong answer → the monster hits you**, and you see the right answer and the explanation. The monster also attacks when its 15-second meter fills.
- **Stages:** monsters from Philippine folklore (Duwende, Tikbalang, Kapre, Bakunawa…). Every 5th stage is a **boss**. Stages 1–2 use easy questions, 3–5 easy + medium, 6+ all levels. Choose all subjects or one.
- **Loot:** every win drops a **weapon (ATK + CRIT %), shield (DEF) or armor (HP)** in Common, Rare, Epic, or Legendary. Weapons come in five types: sword, bow, spear, hammer, and staff. Weapon CRIT % by rarity: Common 3–6%, Rare 6–10%, Epic 10–15%, Legendary 15–22%. Bosses always drop Rare or better, and loot gets stronger on higher stages.
- **Inventory:** open it from camp (🎒 Inventory button) or after a fight. It shows your equipped gear and every item, compares each one with what you're wearing (▲/▼ ATK and CRIT), and lets you equip it.
- **XP:** each win adds 5 + 2 × stage XP (+15 for a boss) to the student's normal level. Losing a fight keeps all gear.

#### Play with classmates (see `js/party.js`)

There is no server, so classmates are **simulated players** built from the 20 demo classmates. Each one's skill sets how often they answer right and how fast.

- **Team Raid:** pick 3 classmates (or tap **Quick match**) and a raid boss: Giant Kapre (Normal), Bakunawa (Hard), Minokawa (Legendary), or the **special event boss, Emperor Doom**. Emperor Doom has his own highlighted event banner, is beatable by every player (even at Stage 1), and always drops **Legendary** loot. To make a different boss the event, set `event: true` on it in `js/party.js`. You answer questions while your teammates attack on their own. The team shares one HP bar. The boss hits everyone when its meter fills, and hits again when you answer wrong. Winning gives guaranteed **Epic or Legendary** loot, XP, and a damage ranking with an MVP.
- **Duel:** pick a classmate (labeled Easier, Even, or Tough). You both get the same question with a 15-second timer. Each right answer attacks the other player, and the **faster** right answer does +25% damage. First to 0 HP loses, or the one with more HP left after 10 rounds wins. Every duel earns trophies and XP, even a loss (win +20, draw +10, loss +5 trophies), so students are never punished for trying. A **win also drops loot**, Rare or better when you beat a Tough opponent.

### Child safety (from our business plan)

Cartoon avatars (DiceBear) and nicknames only · no ads, no purchases shown to kids · break reminder at the parent’s limit · encouraging feedback for wrong answers (soft sound, 💡 instead of ❌) · DepEd and RA 10173 notice in the footer.

---

## Files (for teammates)

```
index.html        every screen (look for the big ===== comment headers)
css/style.css     theme colors, answer buttons, quest map, heatmap, animations
js/data.js        ALL content: subjects, quests, lessons, questions, badges, 20 fake classmates
js/store.js       localStorage helpers, "Reset demo", the demo student's starting progress
js/sound.js       generated beep sound effects (Web Audio API) + confetti helpers
js/quiz.js        challenge engine: scoring, adaptive rules, badges
js/dashboard.js   teacher + parent data and Chart.js charts
js/live.js        Host Live Game, bots, BroadcastChannel two-tab play
js/battle.js      BattleQuest: monsters, weapons + loot tables, combo/critical-hit fight loop
js/party.js       BattleQuest with classmates: Team Raid (co-op boss) and Duel (1-vs-1)
js/app.js         Alpine app: routing (#/student, #/teacher/…), screen time, assignments, quiz builder
```

**Common edits**

- **Add or change a question:** in `js/data.js`, copy a line like
  `Q('easy', 'Question?', ['A', 'B', 'C', 'D'], 1, 'Why B is right.')`
  The `1` is the index of the correct choice (0 = first).
- **Change timer or points:** constants at the top of `js/quiz.js` (and `js/live.js` for live games).
- **Change monsters, loot, or battle balance:** the lists and constants at the top of `js/battle.js` (and `js/party.js` for raids and duels).
- **Change colors:** the theme block at the top of `css/style.css`, and each subject’s `color` in `data.js`.

**Libraries (all from CDNs):** Tailwind CSS (Play CDN) + DaisyUI · Alpine.js · Chart.js · canvas-confetti · Lucide icons · DiceBear avatars · Google Fonts (Fredoka, Nunito). Howler.js is not loaded because there are no audio files. Sounds are generated with the Web Audio API in `js/sound.js`. The browser console shows a “cdn.tailwindcss.com should not be used in production” warning. That is expected for a prototype.

**Saved data:** everything is stored in the browser’s `localStorage` under keys starting with `eduquest.v1.`. Click **Reset demo** (footer, teacher sidebar, or Parent → Delete data) to restore the starting demo.

**Skip to end (demo):** every quest challenge, BattleQuest fight, Team Raid, and Duel has a **⏭ Skip to end (demo)** button at the bottom that finishes it as a win (Host Live Game has **Skip to podium**). It is for presentations. To hide it, set `demoSkip: false` in `js/app.js`.

**Two-tab live game:** both tabs must be in the **same browser**. It also works from a double-clicked file in Chrome/Edge, but the GitHub Pages URL is the most reliable.
