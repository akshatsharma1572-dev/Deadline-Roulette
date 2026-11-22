# Deadline Roulette

**Your deadlines don't wait. Neither should your strategy.**

Deadline Roulette is a gamified student productivity dashboard. It turns assignment tracking into a survival game: missions, XP, levels, achievements, focus sprints, a daily streak, and a panic meter that reflects exactly how close you are to academic meltdown.

Built with plain HTML, CSS, and JavaScript. No frameworks, no backend, no accounts — all data lives in your browser's LocalStorage.

---

## Features

### Dashboard
- Personalized greeting, live date, and a rotating motivational message
- **Survival Score** (0–100) calculated from completed, overdue, and upcoming missions
- **Active Missions** counter with overdue breakdown
- **XP Earned** and progress toward the next level
- **Panic Level** — a weighted pressure score across all pending work
- **Panic Meter** gauge with five tiers: Chill Zone → Slightly Worried → Panic Rising → Critical → Academic Disaster
- Upcoming deadlines with live countdowns
- Quick actions: Add Mission, Spin Roulette, Save My Night, Start Focus Session
- Intel feed (notification bell) listing overdue and due-soon missions

### Mission Control
Full task management with a modern modal editor:
- Add, edit, delete, complete, and undo-complete missions
- Each mission has a name, subject, optional description, deadline date and time, priority (Low / Medium / High / Critical), and estimated duration in minutes
- Search, filter (All / Pending / Completed / Overdue), and sort (deadline / priority / duration)
- Priority-colored cards, overdue badges, and live countdowns
- Validation prevents empty or invalid missions

### Deadline Roulette
The signature feature. Spin the wheel and let fate choose your next mission.
- Animated spin with dramatic reveal
- **Not random:** selection is weighted by overdue status, time remaining, and priority — the most urgent missions are far more likely to be chosen
- Only valid pending missions are eligible; completed tasks are never selected
- Result card shows name, subject, deadline, time remaining, priority, and estimated duration
- **Accept Mission** highlights the task in Mission Control and offers to start a focus session for it
- If there are no pending missions, the roulette politely declines to spin

### Save My Night
An emergency study-plan generator that runs entirely on local logic (no AI, no APIs):
- Scores pending missions by overdue status, 24/48-hour deadline proximity, priority, and quick-win duration
- Produces an ordered plan with per-task durations, total work time, and recommended break count
- **Start Plan** jumps straight into a focus session on the first task

### XP and Levels
- XP rewards by priority: Low 50 · Medium 75 · High 100 · Critical 150
- Early-completion bonus: +50 XP for beating a deadline by 24h+, +25 for 4h+, +10 otherwise
- Level thresholds: 0 / 300 / 700 / 1200 / 1800 XP and beyond
- XP is awarded exactly once per mission — toggling completion back and forth cannot farm points
- Level-up notifications with sound

### Achievements
Eight auto-unlocking badges with progress tracking:
First Mission, Triple Threat, Deadline Destroyer, Mission Master, Speedrunner (finish 24h+ early), Critical Survivor, Night Owl (complete between 12 AM–4 AM), and Perfect Day (five missions in one day).

### Focus Mode
- Customizable focus and break durations (defaults: 25 min focus, 5 min break)
- Start, pause, resume, and reset controls
- Optional mission attachment — focus on a specific task or run a free session
- Animated progress ring with pulsing indicator
- Completed sessions are recorded and feed the statistics page

### Statistics
All values are computed from real stored data:
- Tasks completed, pending, and overdue; completion rate
- 7-day focus-time bar chart
- Current and longest streak, plus a 14-day activity calendar
- Mission breakdown by priority

### Streaks
Completing at least one mission on a calendar day extends your streak. Miss a day and it resets — longest streak is preserved. One completion per day counts, and consecutive days are handled correctly across month boundaries.

### Settings
- Change display name
- Toggle sound effects (Web Audio synth — roulette, level-ups, timer alerts)
- Danger zone with confirmation dialogs: clear all tasks, reset XP and level, reset achievements, full application reset (restores sample missions)

---

## Getting Started

### Option 1: Open directly
Open `index.html` in any modern browser. Everything works from the file system.

### Option 2: Serve locally (recommended)
The project includes a Vite scaffold for live-reload development:

```bash
npm install
npm run dev
```

To create a production build:

```bash
npm run build
```

The optimized output lands in `dist/`.

---

## Project Structure

```
index.html    — full app layout: sidebar, pages, modals, toasts
style.css     — dark gaming theme, layout, animations, responsive rules
script.js     — state, persistence, and all feature logic
```

| File | Responsibility |
|---|---|
| `index.html` | Sidebar navigation, five page sections, task/roulette/plan modals, toast container |
| `style.css` | Design tokens, card and gauge styling, animations, mobile breakpoints |
| `script.js` | LocalStorage model, task CRUD, roulette weighting, panic math, XP/levels, achievements, focus timer, streaks, statistics |

---

## Data and Persistence

All state is stored under a single LocalStorage key (`deadline-roulette-v1`) as one JSON document:

- `tasks` — missions with status, priority, deadline, and XP-award tracking
- `xp`, `level` — progression
- `achievements` — unlocked badge IDs
- `focusSessions` — dated session records feeding the charts
- `streak` — current, longest, and per-day completion log
- `settings` — display name and sound preference
- `seeded` — ensures sample missions are inserted only on first run

Corrupted or missing saved data is handled gracefully: the app falls back to defaults instead of crashing. Everything survives page refreshes, and nothing ever leaves your browser.

### Sample data
On first launch, four sample missions are created (a critical assignment due in 5 hours, a high-priority revision due tomorrow, and two relaxed tasks) so the dashboard isn't empty. They can be deleted individually, all at once, or wiped via a full application reset.

---

## Tech Notes

- **Zero dependencies at runtime** — icons come from the Lucide icon library loaded from a CDN; if that request fails, the app still functions
- Sound effects are synthesized with the Web Audio API (no audio files)
- HTML output is escaped to prevent injection from user-entered task names
- Time-based logic (countdowns, panic, streaks) recalculates continuously, so leaving the tab open keeps numbers honest
- Responsive from mobile (collapsible drawer navigation) to desktop (collapsible sidebar)
- Respects `prefers-reduced-motion`

---

## License

MIT — free to use, modify, and survive with.
