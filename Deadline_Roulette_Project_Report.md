# PROJECT REPORT

## DEADLINE ROULETTE — THE ULTIMATE STUDENT SURVIVAL SYSTEM

---

**Submitted in partial fulfilment of the requirements for the award of the degree of**

**Bachelor of Technology in Computer Science Engineering**

**SESSION: 2025–26**

---

| | |
|---|---|
| **Submitted By** | **Akshay Sharma** |
| **Roll Number** | **25BCON1465** |
| **Submitted To** | **Ms. Suryanshi** |

---

## CERTIFICATE

This is to certify that the project entitled **"Deadline Roulette — The Ultimate Student Survival System"** submitted by **Akshay Sharma (Roll No. 25BCON1465)** is a record of original work carried out by the candidate under my guidance and supervision, in partial fulfilment of the requirements of the course curriculum.

The work presented in this report is genuine and has not been submitted elsewhere for any other degree or diploma.

&nbsp;

_______________________
**Ms. Suryanshi**
(Project Guide)

Date: ______________
Place: ______________

---

## ACKNOWLEDGEMENT

I would like to express my sincere gratitude to my project guide, **Ms. Suryanshi**, for her continuous support, valuable suggestions, and encouragement throughout the development of this project. Her feedback on both the technical implementation and the user experience of the application helped shape it into its final form.

I am also thankful to the faculty of the university for providing the foundation in web development concepts that made this project possible, and to my classmates who volunteered to test the application and gave honest feedback on its design and usability.

Finally, I thank my family and friends for their patience and support during the course of this work.

**Akshay Sharma**
25BCON1465

---

## ABSTRACT

College students juggle multiple assignments, revisions, and deadlines at the same time, and the most common failure mode is not laziness — it is not knowing *what to work on next*. Procrastination thrives when the task list feels bigger than the time available.

**Deadline Roulette** is a gamified student productivity web application that addresses this problem. It converts academic tasks into "missions" and rewards their completion with **XP**, **levels**, **streaks**, and **achievements**, while a live **Panic Meter** visualises deadline pressure. The application's signature feature, **Deadline Roulette**, intelligently selects the most urgent pending mission when the user cannot decide what to do. A companion feature, **Save My Night**, automatically generates a prioritised, step-by-step study plan for overdue and imminent deadlines, and **Focus Mode** provides a customisable distraction-free study timer.

The application is built entirely with **HTML5, CSS3, and Vanilla JavaScript**, requires no backend, server, or API keys, and persists all user data locally in the browser using **LocalStorage**. This makes it fully offline-capable, private, and instantly usable by any student with a web browser.

**Keywords:** gamification, productivity, time management, web application, LocalStorage, student tools

---

## TABLE OF CONTENTS

1. Introduction
   - 1.1 Overview
   - 1.2 Motivation
   - 1.3 Problem Statement
   - 1.4 Objectives
   - 1.5 Scope
2. Literature Survey / Existing Systems
3. System Analysis
   - 3.1 Feasibility Study
   - 3.2 Functional Requirements
   - 3.3 Non-Functional Requirements
   - 3.4 Hardware & Software Requirements
4. System Design
   - 4.1 Architecture
   - 4.2 Data Model
   - 4.3 Module Design
   - 4.4 Core Algorithms
5. Implementation
6. Testing
7. Conclusion & Future Scope
8. References

---

## CHAPTER 1 — INTRODUCTION

### 1.1 Overview

Deadline Roulette is a single-page web application that presents academic task management as a survival game. Tasks become **Missions**, progress is measured in **XP** and **Levels**, daily consistency builds a **Streak**, milestones unlock **Achievements**, and academic pressure is displayed on a live **Panic Meter**. The interface follows a dark, gaming-inspired dashboard design built for clarity on both desktop and mobile.

### 1.2 Motivation

Students routinely lose marks not because of workload volume but because of poor triage — working on the wrong assignment, starting too late, or freezing when everything is due at once. Existing to-do apps are passive containers: they store tasks but do not help the user choose, start, or finish them. Gamified platforms, by contrast, are proven to increase engagement through immediate feedback loops. The motivation for this project was to combine the triage intelligence of a planner with the engagement mechanics of a game in a tool that needs no installation, no account, and no internet connection.

### 1.3 Problem Statement

To design and develop a responsive, offline-capable web application that helps college students:
- organise academic tasks with deadlines and priorities,
- automatically decide what to work on next when they cannot choose,
- generate an emergency study plan under deadline pressure,
- sustain daily productivity through XP, levels, streaks, and achievements, and
- understand their workload pressure at a glance.

### 1.4 Objectives

1. Build a complete task management system (create, edit, complete, undo, delete, search, filter, sort) with validation.
2. Implement a weighted, non-random **Deadline Roulette** that selects the most critical pending mission.
3. Implement **Save My Night**, a local heuristic planner that sequences pending work for the evening.
4. Implement **Focus Mode**, a customisable Pomodoro-style study timer with session logging.
5. Implement a fair XP and level system with early-completion bonuses and anti-farming protection.
6. Implement eight auto-unlocking achievements and a calendar-based daily streak system.
7. Persist all state in LocalStorage with graceful recovery from corrupted data.
8. Deliver a polished dark-themed, fully responsive interface with zero runtime dependencies and no backend.

### 1.5 Scope

The application is intended for individual student use. All data is stored on the user's own device; there is deliberately no cloud sync, multi-user support, or server component. The scope covers the complete client-side experience: dashboard, task management, roulette, emergency planning, focus sessions, statistics, achievements, streaks, and settings.

---

## CHAPTER 2 — LITERATURE SURVEY / EXISTING SYSTEMS

**Microsoft To Do / Google Tasks** — Reliable general-purpose task lists, but they provide no prioritisation guidance, no urgency visualisation, and no motivational layer. Tasks are entered and forgotten.

**Notion** — Extremely flexible, but structuring it as a student productivity system requires significant setup. New users face a steep learning curve before deriving value.

**Forest / Habitica** — Strong gamification (virtual rewards, streaks), but neither addresses deadline triage. Habitica gamifies habits rather than academic deadlines; Forest gamifies focus time but has no awareness of due dates.

**Todoist** — Offers priority flags and "next up" suggestions, but its smart scheduling requires an account, a network connection, and a paid plan for full functionality.

**Observed gap:** No mainstream tool combines deadline-aware task selection (roulette), emergency planning (Save My Night), focus timing, and gamification in a single private, offline, zero-setup application aimed specifically at college students.

**Proposed system:** Deadline Roulette fills this gap. All intelligence — urgency weighting, panic calculation, plan generation — runs locally on the user's data, in the browser, with complete privacy.

---

## CHAPTER 3 — SYSTEM ANALYSIS

### 3.1 Feasibility Study

- **Technical feasibility:** The entire application runs on native web standards (HTML5, CSS3, JavaScript, Web Storage API, SVG, Web Audio API). No frameworks, build tools, or server infrastructure are required. Feasible with well-established technology.
- **Economic feasibility:** Zero cost. There are no servers, subscriptions, API keys, or paid dependencies. The application runs from a single folder.
- **Operational feasibility:** The interface uses plain-language subtitles under every game term, a first-launch "How it works" guide, and friendly empty states, so a first-time user understands the system within seconds. No installation or account creation is needed.

### 3.2 Functional Requirements

1. The system shall allow users to create, edit, complete, undo, and delete missions, each with a name, subject, optional description, deadline date and time, priority (Low/Medium/High/Critical), and estimated duration.
2. The system shall validate all mission input and reject empty or invalid entries.
3. The system shall provide search, filtering (All/Pending/Completed/Overdue), and sorting (deadline/priority/duration) of missions.
4. The system shall award XP on completion (Low 50, Medium 75, High 100, Critical 150) plus an early-completion bonus (+50 for 24h+ early, +25 for 4h+ early, +10 otherwise), awarded at most once per mission.
5. The system shall advance the user's level at XP thresholds (300, 700, 1200, 1800, …) and notify on level-up.
6. The system shall unlock achievements automatically when their conditions are met.
7. The system shall maintain a daily streak that increments once per calendar day on which at least one mission is completed, and resets after a missed day.
8. The system shall compute a Panic Level (0–100) from pending missions, overdue missions, time remaining, and priority, classified into five status tiers.
9. The system shall compute a Survival Score (0–100) from completion ratio and overdue penalties.
10. The system shall select a roulette mission using weights derived from urgency and priority, excluding completed and invalid tasks.
11. The system shall generate an emergency plan ordering pending missions by overdue status, deadline proximity, priority, and quick-win duration, with total time and recommended breaks.
12. The system shall provide a customisable focus timer with start, pause, resume, and reset, recording completed sessions.
13. The system shall persist all data in LocalStorage and recover gracefully from corrupted data.
14. The system shall require confirmation before every destructive action (clear tasks, reset XP, reset achievements, full reset).

### 3.3 Non-Functional Requirements

- **Usability:** A new user understands the app in ~10 seconds; every gaming term carries a plain-language subtitle.
- **Performance:** Instant load; all interactions are local and synchronous.
- **Reliability:** Corrupted or missing saved data falls back to defaults instead of crashing.
- **Security:** All user-entered content is HTML-escaped before rendering to prevent injection.
- **Portability:** Runs in any modern browser, on desktop and mobile, online or offline.
- **Accessibility & comfort:** Responsive layout, collapsible sidebar, and support for `prefers-reduced-motion`.

### 3.4 Hardware & Software Requirements

| Category | Requirement |
|---|---|
| Processor | Any modern CPU (Intel i3 / equivalent or better) |
| RAM | 2 GB minimum |
| Storage | < 1 MB for the application itself |
| Operating System | Any OS with a modern browser (Windows / macOS / Linux / Android / iOS) |
| Browser | Chrome, Edge, Firefox, or Safari (current versions) |
| Development Tools | Visual Studio Code, Git, Vite (development server / build) |
| Languages & Technologies | HTML5, CSS3, JavaScript (ES6+) |
| Libraries | Lucide Icons (CDN, icon rendering only) |

---

## CHAPTER 4 — SYSTEM DESIGN

### 4.1 Architecture

The application follows a **single-page, client-side architecture** with three layers:

```
┌──────────────────────────────────────────────┐
│  Presentation Layer  (index.html + style.css)│
│  Sidebar · Dashboard · Mission Control ·     │
│  Focus Mode · Achievements · Statistics ·    │
│  Settings · Modals · Toasts                  │
├──────────────────────────────────────────────┤
│  Application Layer   (script.js)             │
│  State management · Task CRUD · Roulette ·   │
│  Planner · XP/Levels · Achievements ·        │
│  Streaks · Focus timer · Statistics          │
├──────────────────────────────────────────────┤
│  Persistence Layer   (Browser LocalStorage)  │
│  Single JSON document under the key          │
│  "deadline-roulette-v1"                      │
└──────────────────────────────────────────────┘
```

Navigation is section-based: the sidebar switches between page sections, and each page renders from live state on entry.

### 4.2 Data Model

All state is stored as one JSON document:

| Field | Type | Purpose |
|---|---|---|
| `tasks` | Array | Missions: `id, name, subject, desc, date, time, priority, estimate, done, createdAt, completedAt, xpAwarded` |
| `xp` | Number | Total experience points |
| `level` | Number | Current level |
| `achievements` | Array | IDs of unlocked badges |
| `focusSessions` | Array | `{ date, minutes, taskId }` per completed session |
| `streak` | Object | `current`, `longest`, `days[]` (ISO date strings) |
| `settings` | Object | Display name, sound on/off |
| `howtoSeen` | Boolean | Whether the first-launch guide was dismissed |
| `seeded` | Boolean | Whether sample missions were inserted |

The loader merges saved data over defaults, so older saves or corrupted files degrade safely instead of breaking the app.

### 4.3 Module Design

| Module | Responsibility |
|---|---|
| State & Persistence | Load/save/merge LocalStorage, corruption recovery |
| Tasks | CRUD, validation, rendering, search/filter/sort |
| Dashboard | Survival Score, XP, Panic Meter gauge, deadline list, notifications |
| Roulette | Weighted selection, spin animation, result & accept flow |
| Save My Night | Scoring heuristic, plan rendering, hand-off to Focus Mode |
| XP / Levels | Award rules, level thresholds, progress bars, level-up notifications |
| Achievements | Eight conditions evaluated from real data, progress display |
| Focus Mode | Timer engine (focus/break/pause), session logging |
| Streak | Calendar-day logic, current/longest calculation |
| Statistics | Aggregations, 7-day focus chart, 14-day activity strip, priority breakdown |
| Settings | Profile, sound, destructive resets with confirmation |
| UI Utilities | Toasts, modals, navigation, sound synthesis |

### 4.4 Core Algorithms

**Panic Level (0–100).** Each pending mission contributes a base pressure by time remaining (overdue 22, <6h 15, <24h 10, <72h 5, else 2), multiplied by a priority factor (Critical 1.7, High 1.35, Medium 1.0, Low 0.6), capped at 100. Tiers: 0–20 Chill Zone, 21–40 Slightly Worried, 41–70 Panic Rising, 71–90 Critical, 91–100 Academic Disaster.

**Roulette selection.** Each valid pending mission receives a weight from time remaining (overdue 100, <6h 60, <24h 35, <72h 18, else 8) multiplied by a priority factor (Critical 2.2, High 1.5, Medium 1.0, Low 0.7). A weighted random draw selects the mission — dramatic, but biased toward what actually matters.

**Save My Night scoring.** Each pending mission scores overdue +100, due within 24h +70, within 48h +40, else +15; plus priority points (Critical 40 … Low 5) and a quick-win bonus for short tasks. The top eight form the ordered plan with total work time and one recommended break per ~90 minutes.

**XP fairness.** Each mission carries an `xpAwarded` flag; XP is granted exactly once regardless of completion/undo toggling, which prevents farming the same task repeatedly.

**Streak logic.** Completion days are stored as ISO dates. The current streak is computed by walking backwards from today (or yesterday if today is incomplete); a missed day breaks the chain; the longest streak is retained independently.

---

## CHAPTER 5 — IMPLEMENTATION

**Structure.** The product consists of three files: `index.html` (structure: sidebar, six page sections, three modals, toast container), `style.css` (dark theme built on CSS custom properties: charcoal backgrounds, electric-purple and neon-orange accents, card system, gauge, animations, responsive breakpoints at 1100px/860px/560px), and `script.js` (≈1,250 lines of modular vanilla JavaScript).

**Key implementation details:**

- **Rendering safety:** All user-entered text passes through an HTML-escaping helper before insertion, eliminating cross-site scripting through task names or descriptions.
- **Roulette experience:** A 2.6-second animated sequence (rotating wheel, rotating status lines) precedes the reveal; the accepted mission is highlighted in Mission Control and can be handed directly to a focus session.
- **Focus engine:** A single timer state machine (idle → focus → break → idle) drives a large numeric countdown and an SVG progress ring; finished focus sessions are recorded to state and appear in the statistics charts.
- **Live numbers:** Dashboard values (survival score, XP, panic) animate to their targets, and a 60-second refresh interval keeps countdowns and the panic gauge accurate while the app is open.
- **Sound:** All effects are synthesised at runtime with the Web Audio API — no audio assets.
- **First-run experience:** Four realistic sample missions are seeded exactly once (tracked by the `seeded` flag), and a four-step "How it works" guide appears on first launch, reopenable from Settings.
- **Icons:** The Lucide icon set is loaded from a CDN; the application remains fully functional if the CDN is unreachable.

---

## CHAPTER 6 — TESTING

| # | Test Case | Result |
|---|---|---|
| 1 | Submit the mission form with empty fields → inline validation errors appear, nothing is saved | Pass |
| 2 | Create a mission with valid data → it appears in Mission Control, summary counts update, toast shows | Pass |
| 3 | Edit a mission → changes persist after refresh | Pass |
| 4 | Complete a mission → correct XP awarded, streak updated, achievements re-checked | Pass |
| 5 | Complete and undo repeatedly → XP awarded exactly once (no farming) | Pass |
| 6 | Delete a mission → confirmation shown, removal persists | Pass |
| 7 | Search / filter / sort combinations → correct filtered, ordered lists | Pass |
| 8 | Roulette with zero pending missions → helpful message, no spin | Pass |
| 9 | Roulette with overdue + near-due + low-priority mix → urgent tasks selected far more often (weighted draw verified over repeated runs) | Pass |
| 10 | Accept Mission → task highlighted in Mission Control, focus hand-off offered | Pass |
| 11 | Save My Night with no pending tasks → explanatory message | Pass |
| 12 | Save My Night with mixed deadlines → overdue and due-soon tasks ranked first | Pass |
| 13 | Focus timer full cycle → counts down, pauses, resumes, resets, logs session, break starts automatically | Pass |
| 14 | Level thresholds (0/300/700/1200/1800 XP) → verified against 10 boundary cases programmatically | Pass |
| 15 | Achievement unlock conditions (first, tenth, night-owl, perfect-day, etc.) → unlock automatically with toast | Pass |
| 16 | Streak across consecutive and missed days → increments once per day, resets correctly, longest preserved | Pass |
| 17 | Refresh the page → all data (tasks, XP, achievements, streak, settings, guide dismissal) survives | Pass |
| 18 | Corrupt the saved data → application falls back to defaults without crashing | Pass |
| 19 | All destructive settings actions → confirmation dialogs; full reset restores sample missions | Pass |
| 20 | Layout at mobile and desktop widths → sidebar becomes a drawer, grids reflow, subtitles remain readable | Pass |

---

## CHAPTER 7 — CONCLUSION & FUTURE SCOPE

### Conclusion

Deadline Roulette demonstrates that a productivity tool can be both genuinely useful and genuinely motivating. It answers the student's hardest question — "what do I work on right now?" — with an urgency-weighted roulette and an emergency planner, and it sustains daily use through XP, levels, streaks, and achievements. Because it is built on plain HTML, CSS, and JavaScript with LocalStorage, it is instantly portable, completely private, and works offline from a single folder. All eight functional modules were implemented, tested, and verified against real stored data.

### Future Scope

- **Cloud sync (optional):** Optional account-based synchronisation using Supabase, while keeping offline-first local storage.
- **Notifications:** Browser push reminders as deadlines approach.
- **Calendar integration:** Import assignments from Google Calendar or university LMS exports.
- **Pomodoro presets and analytics:** Weekly focus reports and subject-wise time breakdowns.
- **Dark/light themes:** Additional theme options beyond the current dark dashboard.
- **Progressive Web App:** Installable on phones with offline caching for app-like use.

---

## REFERENCES

1. MDN Web Docs — *Web Storage API (LocalStorage)*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
2. MDN Web Docs — *Web Audio API*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
3. Lucide Icons — *Open-source icon library*. https://lucide.dev
4. Vite — *Next Generation Frontend Tooling*. https://vitejs.dev
5. Cirillo, F. — *The Pomodoro Technique*. FC Garage.
6. Deterding, S., et al. — "From Game Design Elements to Gamefulness: Defining Gamification." *MindTrek '11*, ACM.
7. MDN Web Docs — *Scalable Vector Graphics (SVG)*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/SVG
8. W3C — *HTML Living Standard*. https://html.spec.whatwg.org

---

*End of Report — Akshay Sharma, 25BCON1465*
