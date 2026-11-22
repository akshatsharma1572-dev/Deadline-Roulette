# Project memory

## Product intent & audience

- Gamified productivity app for college students to manage assignments, track deadlines, and survive academic pressure
- Core mechanics: complete "missions" (tasks) to earn XP, level up, maintain streaks, and keep a Panic Meter in check
- Tools include Deadline Roulette (picks a task when user can't decide), Save My Night (step-by-step plan), and Focus Mode (distraction-free study timer)
- First-time user comprehension is a priority — wording must be understandable in ~10 seconds

## Brand personality & voice

- Gaming-themed but friendly and plain-spoken
- Retains gamer terms: Mission, XP, Level, Streak, Achievements, Panic Meter, Survival Score
- Secondary explanatory subtitles always in plain language (e.g., "How on track you are, based on done vs. overdue work")
- Toasts, empty states, and page descriptions use simple, encouraging tone

## Visual design & UX direction

- Dark theme is the established baseline
- Subtitles: small, muted grey text, positioned under key labels without disrupting existing layout
- Mobile-safe: subtitles include a breakpoint so small screens don't break
- Lucide React icons via `@/` path alias (per global prompt conventions)
- Popups/modals used for onboarding; Settings houses secondary entry points (e.g., "How it works" reopen button)

## Decisions, constraints & rationale

- Do NOT rebuild, restructure, or change logic, XP rules, storage keys, or file structure — changes are wording/UI-label only
- "How it works" popup is one-time on first launch; dismissal stored in LocalStorage as a `howtoSeen` flag
- Existing save files must degrade safely when `howtoSeen` is absent (default behavior)
- Full-reset handler in Settings is sensitive — prior editing accidentally no-op'd it; verify reset logic stays intact after any edit
- Build must pass and all button references must resolve to real elements

## Open questions & assumptions

- Live UI click-through testing was not possible in the dev environment; roulette, focus timer, and onboarding popup should be manually verified in preview
- Assumed vanilla JS architecture persists despite vite-react framework availability (app logic lives in script files, not React components) — confirm if future restructuring is requested