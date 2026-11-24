# EduQuest — Prototype

> **Learning that feels like a game, not a task.**
> A clickable prototype by **EduTech Innovators** (Silverio · Aglugub · Rey · Villegas · Perez) for CCINOV8.

EduQuest is a gamified, mobile-first learning platform for Filipino elementary students. This prototype mixes **Canvas LMS** structure (subjects, modules, assignments, teacher dashboards) with **Kahoot** energy (timed questions, colored answer shapes, speed points, streaks, leaderboards, podium). It adds the feature that sets EduQuest apart: **instant feedback with an explanation after every answer.**

Sample content: **Grade 4 · Mathematics, Science, English** (10 quests, 90 questions). Each quest lists the competency it teaches, written in a MATATAG-like style (sample content).

---

## Run it locally

`index.html` is pre-built, so you can run the prototype right away:

1. **Double-click `index.html`.** It opens in your browser.
2. *(Optional)* Run a local server from this folder: `python -m http.server 8000`, then open <http://localhost:8000>.

You need an internet connection the first time, because the libraries, fonts, and avatars load from CDNs.

### Building HTML after editing templates

The HTML screens are split into Jinja2 templates inside `templates/`. Whenever you edit `templates/index.base.html` or any file in `templates/partials/`, rebuild `index.html` before previewing or pushing:

```bash
pip install jinja2   # one-time setup
python3 build.py     # compiles templates/ into index.html
```

## Deploy to GitHub Pages

> **Important:** Always run `python3 build.py` and commit the updated `index.html` before pushing, since GitHub Pages serves the compiled `index.html` directly.

1. Create a new **public** repository on GitHub, for example `eduquest-prototype`.
2. Upload every file in this folder **with the same structure** (`index.html`, `build.py`, `templates/`, `css/`, `js/`, `README.md`):
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
| **Student** (mobile-first) | Home (avatar, level, XP, streak, badges, subject cards, teacher assignments) · Quest map · Lesson · Kahoot-style challenge with instant feedback · Results (stars, XP, badges, review mistakes, class leaderboard) · Badges · Join live game (with podium) · **BattleQuest** (quiz-powered RPG with an inventory) |
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
- **Inventory:** open it from camp (🎒 Inventory button) or after a fight. Tap a **Weapon, Shield, or Armor** slot at camp (or in the inventory) to see only that kind of gear. It shows your equipped gear and every item, compares each one with what you're wearing (▲/▼ ATK and CRIT), and lets you equip it.
- **XP:** each win adds 5 + 2 × stage XP (+15 for a boss) to the student's normal level. Losing a fight keeps all gear.

#### Play with classmates (see `js/party.js`)

There is no server, so classmates are **simulated players** built from the 20 demo classmates. Each one's skill sets how often they answer right and how fast.

- **Team Raid:** pick 3 classmates (or tap **Quick match**) and a raid boss: Giant Kapre (Normal), Bakunawa (Hard), Minokawa (Legendary), or the **special event boss, Emperor Doom**. Emperor Doom has his own highlighted event banner, is beatable by every player (even at Stage 1), and always drops **Legendary** loot. To make a different boss the event, set `event: true` on it in `js/party.js`. You answer questions while your teammates attack on their own. The team shares one HP bar. The boss hits everyone when its meter fills, and hits again when you answer wrong. Winning gives guaranteed **Epic or Legendary** loot, XP, and a damage ranking with an MVP.
- **Duel:** pick a classmate (labeled Easier, Even, or Tough). You both get the same question with a 15-second timer. Each right answer attacks the other player, and the **faster** right answer does +25% damage. First to 0 HP loses, or the one with more HP left after 10 rounds wins. Every duel earns trophies and XP, even a loss (win +20, draw +10, loss +5 trophies), so students are never punished for trying. A **win also drops loot**, Rare or better when you beat a Tough opponent.

### Child safety (from our business plan)

Cartoon avatars (DiceBear) and nicknames only · no ads, no purchases shown to kids · break reminder at the parent’s limit · encouraging feedback for wrong answers (soft sound, 💡 instead of ❌) · DepEd and RA 10173 notice in the footer.

---

## Built with (the code and tools we used)

EduQuest is a **static website**: plain files that run in the browser, with **no server, no database, and no app store install**. Everything below is free.

### Languages

| Language | Used for |
|---|---|
| **HTML** | Every screen (student, teacher, parent, pop-ups), split into templates in `templates/` |
| **CSS** | Colors, the Kahoot-style answer buttons, quest map, heatmap, BattleQuest effects, animations (`css/style.css`) |
| **JavaScript** (plain, no framework build) | All app logic in `js/`: quizzes, scoring, adaptive difficulty, badges, BattleQuest, live games, dashboards |
| **Python** | Only `build.py`, which joins the HTML templates into `index.html` (not needed to run the site) |

### Libraries (loaded from CDNs with `<script>`/`<link>` tags, no install needed)

| Library | Version | What it does in EduQuest |
|---|---|---|
| [Tailwind CSS](https://tailwindcss.com) (Play CDN) | 3.4.5 | Utility classes for layout, spacing, and colors |
| [DaisyUI](https://daisyui.com) | 4.12.10 | Ready-made buttons, cards, modals, badges, and the EduQuest color theme |
| [Alpine.js](https://alpinejs.dev) | 3.14.1 | Makes the pages interactive: app state, screens, clicks, timers |
| [Chart.js](https://www.chartjs.org) | 4.4.4 | Teacher and parent charts (class averages, mastery levels, weekly time, live answer chart) |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | 1.9.3 | Confetti for wins, badges, and podiums |
| [Lucide](https://lucide.dev) | 0.460.0 | Line icons (home, badges, search, and more) |
| [DiceBear](https://www.dicebear.com) "Big Smile" | API 9.x | Cartoon avatars made from a nickname (no real photos) |
| [Google Fonts](https://fonts.google.com) | – | **Fredoka** (playful headings) and **Nunito** (easy-to-read text) |
| [Jinja2](https://jinja.palletsprojects.com) | any 3.x | Template tool used by `build.py` (only for teammates who edit the HTML) |

### Built-in browser features (no library needed)

| Feature | What it does in EduQuest |
|---|---|
| **localStorage** | Saves progress, XP, badges, gear, assignments, quizzes, and settings in the browser (`js/store.js`) |
| **Web Audio API** | Makes all sound effects as generated beeps, so there are no audio files (`js/sound.js`) |
| **BroadcastChannel API** | Lets a second browser tab join a live game as a real player (`js/live.js`) |
| **URL hash routing** (`#/student`, `#/teacher/…`) | Moves between screens without reloading, and works from a file or any web host |
| **Blob downloads** | The parent's "Download data" button (RA 10173 right to access) |

### How the code is organized

- **One Alpine app:** `js/app.js` creates the app and merges in "mixins" (groups of features) from `quiz.js`, `dashboard.js`, `live.js`, `battle.js`, and `party.js`.
- **All content in one file:** subjects, quests, lessons, 90 questions, badges, and the 20 practice classmates are in `js/data.js`, so non-programmers can edit them.
- **Simulated classmates:** there is no server, so classmates in live games, raids, and duels are bots whose "skill" controls how often and how fast they answer.

### Tools

| Tool | Used for |
|---|---|
| **Git + GitHub** | Version control and teamwork (branches and pull requests) |
| **Netlify** (or GitHub Pages) | Free hosting of the static site; no build command needed |
| **VS Code** | Code editor |
| **Google Chrome** | Testing, including phone-size screens |
| **`js/testscript.js`** | 313 automatic checks; open the site with `?test=1` and look in the browser console (F12) |

## Files (for teammates)

```
build.py                     compiles templates/ into index.html (run after editing HTML templates)
index.html                   generated output containing every screen (do not edit directly)
templates/
  index.base.html            base shell: <head>, landing role picker, footer, script imports
  partials/
    student.html             all Student screens (Home, Quest Map, Lesson, Challenge, BattleQuest, Results, Badges, Live)
    teacher.html             all Teacher screens (Dashboard, Heatmap, Library, Quiz Builder, Host Live Game)
    parent.html              Parent dashboard, screen-time controls, and privacy settings
    modals.html              all modals (Break, Avatar, Assign, Preview, Reset, Weekly Streak, Stars Path) + toast
css/style.css                theme colors, answer buttons, quest map, heatmap, animations
js/data.js                   ALL content: subjects, quests, lessons, questions, badges, 20 fake classmates
js/store.js                  localStorage helpers, "Reset demo", the demo student's starting progress
js/sound.js                  generated beep sound effects (Web Audio API) + confetti helpers
js/quiz.js                   challenge engine: scoring, adaptive rules, badges
js/dashboard.js              teacher + parent data and Chart.js charts
js/live.js                   Host Live Game, bots, BroadcastChannel two-tab play
js/battle.js                 BattleQuest: monsters, weapons + loot tables, combo/critical-hit fight loop
js/party.js                  BattleQuest with classmates: Team Raid (co-op boss) and Duel (1-vs-1)
js/app.js                    Alpine app: routing (#/student, #/teacher/…), screen time, assignments, quiz builder
```

**Common edits**

- **Edit HTML or UI layout:** edit the matching file in `templates/` (e.g. `templates/partials/student.html`), then run `python3 build.py` to regenerate `index.html`.
- **Add or change a question:** in `js/data.js`, copy a line like
  `Q('easy', 'Question?', ['A', 'B', 'C', 'D'], 1, 'Why B is right.')`
  The `1` is the index of the correct choice (0 = first).
- **Change timer or points:** constants at the top of `js/quiz.js` (and `js/live.js` for live games).
- **Change monsters, loot, or battle balance:** the lists and constants at the top of `js/battle.js` (and `js/party.js` for raids and duels).
- **Change colors:** the theme block at the top of `css/style.css`, and each subject’s `color` in `data.js`.

**Libraries:** see **Built with** above. The browser console shows a “cdn.tailwindcss.com should not be used in production” warning. That is expected for a prototype. Howler.js is not loaded because there are no audio files.

**Saved data:** everything is stored in the browser’s `localStorage` under keys starting with `eduquest.v1.`. Click **Reset demo** (footer, teacher sidebar, or Parent → Delete data) to restore the starting demo.

**Skip to end (demo):** every quest challenge, BattleQuest fight, Team Raid, and Duel has a **⏭ Skip to end (demo)** button at the bottom that finishes it as a win (Host Live Game has **Skip to podium**). It is for presentations. To hide it, set `demoSkip: false` in `js/app.js`.

**Two-tab live game:** both tabs must be in the **same browser**. It also works from a double-clicked file in Chrome/Edge, but the GitHub Pages URL is the most reliable.