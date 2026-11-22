/* ============================================================
   Deadline Roulette — script.js
   Vanilla JS · LocalStorage persistence · no backend
   ============================================================ */
"use strict";

/* ------------------------------------------------------------
   Constants & config
------------------------------------------------------------ */
const STORAGE_KEY = "deadline-roulette-v1";
const XP_REWARDS = { low: 50, medium: 75, high: 100, critical: 150 };
const PRIO_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const PRIO_LABEL = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
const PRIO_COLOR = {
  low: "#2fd470",
  medium: "#fbbf24",
  high: "#ff7a1a",
  critical: "#f43f5e",
};

const LEVELS = [0, 300, 700, 1200, 1800, 2600, 3600, 4800, 6200, 7800];
const MOTIVATIONS = [
  "Small wins today beat heroic all-nighters tomorrow.",
  "The roulette favors the prepared. Start somewhere.",
  "Deadlines are just bosses with visible health bars.",
  "You do not need motivation. You need a 25-minute timer.",
  "Every mission you clear makes the next one cheaper.",
  "Fear is a poor planner. Use the emergency plan instead.",
  "Overdue is not over. It is just worth more XP.",
];

const ACHIEVEMENTS = [
  { id: "first",  name: "First Mission",       icon: "flag",        desc: "Complete your first task.",                    target: 1,  stat: "completed" },
  { id: "triple", name: "Triple Threat",       icon: "swords",      desc: "Complete three tasks.",                        target: 3,  stat: "completed" },
  { id: "ten",    name: "Deadline Destroyer",  icon: "bomb",        desc: "Complete ten tasks.",                          target: 10, stat: "completed" },
  { id: "twenty", name: "Mission Master",      icon: "crown",       desc: "Complete twenty tasks.",                       target: 20, stat: "completed" },
  { id: "speed",  name: "Speedrunner",         icon: "zap",         desc: "Complete a task at least 24 hours before its deadline.", target: 1, stat: "speedruns" },
  { id: "crit",   name: "Critical Survivor",   icon: "skull",       desc: "Complete a critical-priority task.",           target: 1,  stat: "criticalDone" },
  { id: "owl",    name: "Night Owl",           icon: "moon",        desc: "Complete a task between 12 AM and 4 AM.",      target: 1,  stat: "nightOwl" },
  { id: "perfect",name: "Perfect Day",         icon: "calendar-check", desc: "Complete five tasks in one day.",           target: 5,  stat: "bestDay" },
];

/* ------------------------------------------------------------
   State
------------------------------------------------------------ */
let state = null;
let ui = {
  filter: "all",
  sort: "deadline",
  search: "",
  editingId: null,
  rouletteTaskId: null,
  highlightId: null,
};

const defaultState = () => ({
  tasks: [],
  xp: 0,
  level: 1,
  achievements: [],
  focusSessions: [],       // { date: 'YYYY-MM-DD', minutes, taskId }
  streak: { current: 0, longest: 0, lastDay: null, days: [] },
  settings: { sound: true, name: "Survivor" },
  howtoSeen: false,
  seeded: false,
});

/* ------------------------------------------------------------
   Persistence
------------------------------------------------------------ */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    // Merge so missing fields from older/corrupted saves fall back to defaults.
    return {
      ...base,
      ...parsed,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      focusSessions: Array.isArray(parsed.focusSessions) ? parsed.focusSessions : [],
      streak: { ...base.streak, ...(parsed.streak || {}) },
      settings: { ...base.settings, ...(parsed.settings || {}) },
      howtoSeen: parsed.howtoSeen === true,
    };
  } catch {
    console.warn("Saved data was corrupted — starting fresh.");
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    toast("danger", "Storage full", "Could not save your progress locally.");
  }
}

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function todayStr(d = new Date()) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function taskDeadline(t) {
  return new Date(`${t.date}T${t.time || "23:59"}`);
}

function isOverdue(t) {
  return !t.done && taskDeadline(t).getTime() < Date.now();
}

function pendingTasks() {
  return state.tasks.filter((t) => !t.done);
}

function hoursUntil(t) {
  return (taskDeadline(t).getTime() - Date.now()) / 3600000;
}

function countdownText(t) {
  if (t.done) return "Completed";
  const ms = taskDeadline(t).getTime() - Date.now();
  if (ms < 0) {
    const h = Math.floor(-ms / 3600000);
    const d = Math.floor(h / 24);
    return d > 0 ? `Overdue ${d}d ${h % 24}h` : `Overdue ${h}h ${Math.floor((-ms % 3600000) / 60000)}m`;
  }
  const mins = Math.floor(ms / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

function escapeHtml(str) {
  const el = document.createElement("div");
  el.textContent = String(str);
  return el.innerHTML;
}

function levelThreshold(level) {
  return LEVELS[Math.min(level - 1, LEVELS.length - 1)];
}
function nextLevelThreshold(level) {
  return level >= LEVELS.length
    ? levelThreshold(level) + 2000
    : LEVELS[level];
}

function levelFromXp(xp) {
  let lvl = 1;
  while (lvl < LEVELS.length && xp >= LEVELS[lvl]) lvl++;
  return lvl;
}

function beep(type = "info") {
  if (!state.settings.sound) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = {
      info: [520, 0.08],
      success: [660, 0.12],
      xp: [880, 0.14],
      danger: [180, 0.2],
      fanfare: [720, 0.3],
    }[type] || [440, 0.1];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type === "danger" ? "sawtooth" : "sine";
    osc.frequency.value = notes[0];
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + notes[1]);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + notes[1]);
    setTimeout(() => ctx.close(), (notes[1] + 0.1) * 1000);
  } catch { /* audio unavailable — stay silent */ }
}

/* ------------------------------------------------------------
   Toasts
------------------------------------------------------------ */
const TOAST_ICONS = {
  success: "check-circle-2",
  info: "info",
  warn: "alert-triangle",
  danger: "octagon-alert",
  xp: "sparkles",
};

function toast(kind, title, body = "") {
  const el = document.createElement("div");
  el.className = `toast toast--${kind}`;
  el.innerHTML = `<i data-lucide="${TOAST_ICONS[kind] || "info"}"></i><div><strong>${escapeHtml(title)}</strong>${body ? `<span>${escapeHtml(body)}</span>` : ""}</div>`;
  $("#toasts").appendChild(el);
  window.lucide && lucide.createIcons();
  setTimeout(() => {
    el.classList.add("out");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }, 4200);
}

/* ------------------------------------------------------------
   Modals
------------------------------------------------------------ */
function openModal(id) {
  const m = document.getElementById(id);
  m.hidden = false;
  requestAnimationFrame(() => m.classList.add("open"));
}
function closeModal(id) {
  const m = document.getElementById(id);
  m.classList.remove("open");
  setTimeout(() => { m.hidden = true; }, 250);
}
document.addEventListener("click", (e) => {
  const closer = e.target.closest("[data-close]");
  if (closer) closeModal(closer.dataset.close);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") $$(".modal.open").forEach((m) => closeModal(m.id));
});
$$(".modal").forEach((m) =>
  m.addEventListener("click", (e) => { if (e.target === m) closeModal(m.id); })
);

/* ------------------------------------------------------------
   Navigation
------------------------------------------------------------ */
function navigate(page) {
  $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.page === page));
  $$(".page").forEach((p) => p.classList.toggle("active", p.id === `page-${page}`));
  document.body.classList.remove("mobile-nav-open");
  if (page === "stats") renderStats();
  if (page === "missions") renderTasks();
  if (page === "focus") renderFocusSetup();
  window.lucide && lucide.createIcons();
}

$$(".nav-item").forEach((b) => b.addEventListener("click", () => navigate(b.dataset.page)));
document.addEventListener("click", (e) => {
  const go = e.target.closest("[data-go]");
  if (go) navigate(go.dataset.go);
});

$("#sidebarCollapse").addEventListener("click", () => {
  document.body.classList.toggle("sidebar-collapsed");
});
$("#mobileMenu").addEventListener("click", () => document.body.classList.toggle("mobile-nav-open"));
$("#scrim").addEventListener("click", () => document.body.classList.remove("mobile-nav-open"));

/* ------------------------------------------------------------
   Tasks: CRUD
------------------------------------------------------------ */
function openTaskModal(task = null) {
  ui.editingId = task ? task.id : null;
  $("#taskModalTitle").textContent = task ? "Edit Mission" : "Add Mission";
  $("#taskSubmit").textContent = task ? "Save changes" : "Create mission";
  $("#errName").classList.remove("show");
  $("#errSubject").classList.remove("show");
  $("#errDate").classList.remove("show");
  $("#errEstimate").classList.remove("show");
  if (task) {
    $("#fName").value = task.name;
    $("#fSubject").value = task.subject;
    $("#fDate").value = task.date;
    $("#fTime").value = task.time;
    $("#fPriority").value = task.priority;
    $("#fEstimate").value = task.estimate;
    $("#fDesc").value = task.desc || "";
  } else {
    $("#taskForm").reset();
    $("#fTime").value = "23:59";
    $("#fEstimate").value = 30;
    const soon = new Date(Date.now() + 86400000);
    $("#fDate").value = todayStr(soon);
  }
  openModal("taskModal");
  setTimeout(() => $("#fName").focus(), 120);
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add("show");
}

function handleTaskSubmit(e) {
  e.preventDefault();
  ["errName", "errSubject", "errDate", "errEstimate"].forEach((id) => {
    document.getElementById(id).classList.remove("show");
  });
  const name = $("#fName").value.trim();
  const subject = $("#fSubject").value.trim();
  const date = $("#fDate").value;
  const time = $("#fTime").value;
  const estimate = parseInt($("#fEstimate").value, 10);
  let ok = true;

  if (!name) { showFieldError("errName", "Give the mission a name."); ok = false; }
  if (!subject) { showFieldError("errSubject", "Which subject is this for?"); ok = false; }
  if (!date) { showFieldError("errDate", "Pick a deadline date."); ok = false; }
  if (!Number.isFinite(estimate) || estimate < 5 || estimate > 600) {
    showFieldError("errEstimate", "Estimate must be 5–600 minutes.");
    ok = false;
  }
  if (!time) { $("#fTime").focus(); ok = false; }
  if (!ok) return;

  if (ui.editingId) {
    const t = state.tasks.find((t) => t.id === ui.editingId);
    if (t) {
      Object.assign(t, {
        name, subject, date, time, estimate,
        priority: $("#fPriority").value,
        desc: $("#fDesc").value.trim(),
      });
      toast("success", "Mission updated", t.name);
    }
  } else {
    state.tasks.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `t${Date.now()}${Math.random().toString(16).slice(2)}`,
      name, subject, date, time,
      priority: $("#fPriority").value,
      estimate,
      desc: $("#fDesc").value.trim(),
      done: false,
      createdAt: new Date().toISOString(),
      xpAwarded: false,
    });
    toast("success", "Mission added", name);
  }
  saveState();
  closeModal("taskModal");
  renderAll();
}

function deleteTask(id) {
  const t = state.tasks.find((t) => t.id === id);
  if (!t) return;
  state.tasks = state.tasks.filter((x) => x.id !== id);
  saveState();
  renderAll();
  toast("danger", "Mission deleted", t.name);
}

function completeTask(id) {
  const t = state.tasks.find((t) => t.id === id);
  if (!t || t.done) return;
  t.done = true;
  t.completedAt = new Date().toISOString();

  // XP: base + early bonus, only ever awarded once per task.
  let gained = XP_REWARDS[t.priority] || 50;
  let bonus = 0;
  const early = hoursUntil(t);
  if (early > 0) {
    bonus = early > 24 ? 50 : early > 4 ? 25 : 10;
  }
  if (!t.xpAwarded) {
    t.xpAwarded = true;
    gained += bonus;
    awardXp(gained, t.name);
    if (bonus >= 50) toast("xp", "Speed bonus!", "+50 XP for beating the deadline by a day.");
  } else {
    gained = 0;
  }

  updateStreak();
  checkAchievements();
  saveState();
  renderAll();
  toast("success", "Mission cleared", t.name);
  beep("success");
}

function undoTask(id) {
  const t = state.tasks.find((t) => t.id === id);
  if (!t || !t.done) return;
  t.done = false;
  delete t.completedAt;
  // XP is kept — reverting does not let you farm completion XP back and forth,
  // because xpAwarded stays true and blocks re-award.
  saveState();
  renderAll();
  toast("info", "Mission reopened", t.name);
}

/* ------------------------------------------------------------
   Task rendering
------------------------------------------------------------ */
function filteredTasks() {
  let list = [...state.tasks];
  const q = ui.search.toLowerCase();
  if (ui.filter === "pending") list = list.filter((t) => !t.done);
  else if (ui.filter === "completed") list = list.filter((t) => t.done);
  else if (ui.filter === "overdue") list = list.filter(isOverdue);
  if (q) {
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.desc || "").toLowerCase().includes(q)
    );
  }
  list.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (ui.sort === "priority") return PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority] || taskDeadline(a) - taskDeadline(b);
    if (ui.sort === "estimate") return a.estimate - b.estimate;
    return taskDeadline(a) - taskDeadline(b);
  });
  return list;
}

function taskCard(t) {
  const overdue = isOverdue(t);
  const cd = countdownText(t);
  const cdClass = t.done ? "ok" : overdue ? "crit" : hoursUntil(t) < 4 ? "warn" : "";
  return `
  <article class="task-card ${t.done ? "is-done" : ""} ${ui.highlightId === t.id ? "highlight" : ""}" style="--prio-color:${PRIO_COLOR[t.priority]}" data-id="${t.id}">
    <div class="task-top">
      <div>
        <div class="task-name">${escapeHtml(t.name)}</div>
        <div class="task-subject">${escapeHtml(t.subject)}</div>
      </div>
      ${overdue ? '<span class="badge badge--overdue">Overdue</span>' : `<span class="badge badge--${t.priority}">${PRIO_LABEL[t.priority]}</span>`}
    </div>
    ${t.desc ? `<p class="task-desc">${escapeHtml(t.desc)}</p>` : ""}
    <div class="task-meta">
      <span><i data-lucide="calendar-clock"></i>${new Date(`${t.date}T${t.time}`).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
      <span><i data-lucide="hourglass"></i>${t.estimate} min</span>
    </div>
    <span class="dl-countdown ${cdClass}">${cd}</span>
    <div class="task-actions">
      ${t.done
        ? `<button class="btn btn--ghost btn--sm" data-undo="${t.id}"><i data-lucide="undo-2"></i> Undo</button>`
        : `<button class="btn btn--primary btn--sm" data-complete="${t.id}"><i data-lucide="check"></i> Complete</button>`}
      <button class="icon-btn icon-btn--sm" data-edit="${t.id}" aria-label="Edit mission"><i data-lucide="pencil"></i></button>
      <button class="icon-btn icon-btn--sm danger" data-delete="${t.id}" aria-label="Delete mission"><i data-lucide="trash-2"></i></button>
    </div>
  </article>`;
}

function renderTasks() {
  const list = filteredTasks();
  $("#taskGrid").innerHTML = list.map(taskCard).join("");
  $("#tasksEmpty").hidden = list.length > 0;
  $("#missionSummary").textContent =
    `${pendingTasks().length} pending · ${state.tasks.filter((t) => t.done).length} completed · ` +
    `${state.tasks.filter(isOverdue).length} overdue`;
  window.lucide && lucide.createIcons();
}

$("#taskGrid").addEventListener("click", (e) => {
  const complete = e.target.closest("[data-complete]");
  const undo = e.target.closest("[data-undo]");
  const edit = e.target.closest("[data-edit]");
  const del = e.target.closest("[data-delete]");
  if (complete) completeTask(complete.dataset.complete);
  else if (undo) undoTask(undo.dataset.undo);
  else if (edit) openTaskModal(state.tasks.find((t) => t.id === edit.dataset.edit));
  else if (del) {
    const t = state.tasks.find((t) => t.id === del.dataset.delete);
    if (t && confirm(`Delete "${t.name}"? This cannot be undone.`)) deleteTask(t.id);
  }
});

$("#taskForm").addEventListener("submit", handleTaskSubmit);
$("#addMissionBtn").addEventListener("click", () => openTaskModal());
$("#emptyAddBtn").addEventListener("click", () => openTaskModal());
$("#qaAdd").addEventListener("click", () => openTaskModal());

$("#taskSearch").addEventListener("input", (e) => {
  ui.search = e.target.value;
  renderTasks();
});
$("#statusFilters").addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  ui.filter = btn.dataset.filter;
  $$(".filter-btn").forEach((b) => b.classList.toggle("active", b === btn));
  renderTasks();
});
$("#sortSelect").addEventListener("change", (e) => {
  ui.sort = e.target.value;
  renderTasks();
});

/* ------------------------------------------------------------
   Dashboard
------------------------------------------------------------ */
function computePanic() {
  const pending = pendingTasks();
  let score = pending.reduce((sum, t) => {
    const hrs = hoursUntil(t);
    let s = 0;
    if (hrs < 0) s = 22;
    else if (hrs < 6) s = 15;
    else if (hrs < 24) s = 10;
    else if (hrs < 72) s = 5;
    else s = 2;
    s *= { low: 0.6, medium: 1, high: 1.35, critical: 1.7 }[t.priority] || 1;
    return sum + s;
  }, 0);
  return Math.min(100, Math.round(score));
}

function panicLevel(p) {
  if (p <= 20) return { label: "Chill Zone", level: 0 };
  if (p <= 40) return { label: "Slightly Worried", level: 1 };
  if (p <= 70) return { label: "Panic Rising", level: 2 };
  if (p <= 90) return { label: "Critical", level: 3 };
  return { label: "Academic Disaster", level: 4 };
}

function computeSurvival() {
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.done).length;
  const overdue = state.tasks.filter(isOverdue).length;
  if (total === 0) return 100;
  const base = (done / total) * 100;
  return Math.max(0, Math.min(100, Math.round(base - overdue * 8)));
}

function renderDashboard() {
  const pending = pendingTasks();
  const overdue = state.tasks.filter(isOverdue).length;

  // Header
  const hour = new Date().getHours();
  const partOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "night";
  $("#greeting").textContent = `Welcome back, ${state.settings.name || "Survivor"}!`;
  $("#topbarDate").textContent =
    new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) +
    ` — ${partOfDay} shift`;
  $("#motivMsg").textContent = MOTIVATIONS[new Date().getDate() % MOTIVATIONS.length];
  $("#avatar").textContent = (state.settings.name || "S").charAt(0).toUpperCase();

  // Survival score
  const survival = computeSurvival();
  animateNumber($("#survivalScore"), survival);
  $("#survivalBar").style.width = survival + "%";
  $("#survivalFoot").textContent =
    totalTasks() === 0
      ? "Awaiting intel — add missions to begin."
      : overdue > 0
        ? `${overdue} overdue ${overdue === 1 ? "mission" : "missions"} dragging you down.`
        : "Keep clearing missions to hold the line.";

  // Active missions
  animateNumber($("#activeMissions"), pending.length);
  $("#missionsFoot").textContent = pending.length
    ? `${overdue} overdue · ${pending.filter((t) => !isOverdue(t)).length} on schedule`
    : "No open missions. Suspiciously peaceful.";

  // XP
  animateNumber($("#xpTotal"), state.xp);
  const next = nextLevelThreshold(state.level);
  const cur = levelThreshold(state.level);
  $("#xpFoot").textContent = `Level ${state.level} · ${Math.max(0, next - state.xp)} XP to next level`;

  // Panic
  const panic = computePanic();
  const pl = panicLevel(panic);
  animateNumber($("#panicPct"), panic);
  animateNumber($("#gaugePct"), panic);
  $("#panicBar").style.width = panic + "%";
  const arc = 252 - (252 * panic) / 100;
  $("#gaugeArc").style.strokeDashoffset = arc;
  $("#gaugeArc").style.stroke = pl.level >= 3 ? "#f43f5e" : pl.level === 2 ? "#ff7a1a" : pl.level === 1 ? "#fbbf24" : "#2fd470";
  for (const el of [$("#panicStatus"), $("#panicStatusBig")]) {
    el.textContent = pl.label;
    el.dataset.level = pl.level;
  }
  $("#panicCopy").textContent =
    pl.level === 0 ? "Breathe easy — nothing on fire right now."
    : pl.level === 1 ? "A few deadlines are sniffing around. Handle them early."
    : pl.level === 2 ? "Multiple deadlines converging. Time to triage with Save My Night."
    : pl.level === 3 ? "Danger zone. Close the small stuff and focus on what's due first."
    : "Full meltdown. Spin the roulette, pick one mission, and start anywhere.";

  // Deadline list (next 5 pending)
  const nearest = pending
    .sort((a, b) => taskDeadline(a) - taskDeadline(b))
    .slice(0, 5);
  $("#deadlineList").innerHTML = nearest.length
    ? nearest
        .map((t) => {
          const overdue = isOverdue(t);
          const cdClass = overdue ? "crit" : hoursUntil(t) < 4 ? "warn" : "ok";
          return `<li class="deadline-item ${t.done ? "is-done" : ""}">
            <span class="dl-rail" style="background:${PRIO_COLOR[t.priority]}"></span>
            <div>
              <div class="dl-title">${escapeHtml(t.name)}</div>
              <div class="dl-meta"><span>${escapeHtml(t.subject)}</span><span>${PRIO_LABEL[t.priority]} · ${t.estimate} min</span></div>
            </div>
            <span class="dl-countdown ${cdClass}">${countdownText(t)}</span>
          </li>`;
        })
        .join("")
    : `<li class="deadline-item"><span class="dl-rail" style="background:var(--green)"></span><div><div class="dl-title">All clear</div><div class="dl-meta"><span>No pending missions — add one or enjoy the silence.</span></div></div></li>`;

  // Notifications
  $("#notifDot").hidden = overdue === 0;
}

function totalTasks() {
  return state.tasks.length;
}

function animateNumber(el, target) {
  const start = parseInt(el.textContent, 10) || 0;
  if (start === target) { el.textContent = target; return; }
  const dur = 600;
  const t0 = performance.now();
  function step(t) {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ------------------------------------------------------------
   Roulette
------------------------------------------------------------ */
function pickRouletteTask() {
  const pending = pendingTasks().filter((t) => t.name && t.subject && t.date);
  if (!pending.length) return null;
  const weights = pending.map((t) => {
    const hrs = hoursUntil(t);
    let w = 1;
    if (hrs < 0) w = 100;
    else if (hrs < 6) w = 60;
    else if (hrs < 24) w = 35;
    else if (hrs < 72) w = 18;
    else w = 8;
    w *= { low: 0.7, medium: 1, high: 1.5, critical: 2.2 }[t.priority] || 1;
    return { t, w };
  });
  const total = weights.reduce((s, x) => s + x.w, 0);
  let roll = Math.random() * total;
  for (const x of weights) {
    roll -= x.w;
    if (roll <= 0) return x.t;
  }
  return weights[weights.length - 1].t;
}

const ROULETTE_LINES = [
  "Spinning the wheel of academic fate…",
  "Consulting the deadline spirits…",
  "Weighing urgency against chaos…",
  "Cross-referencing your doom ledger…",
  "Locking onto the loudest deadline…",
];

$("#qaRoulette").addEventListener("click", () => runRoulette());

function runRoulette() {
  const chosen = pickRouletteTask();
  if (!chosen) {
    toast("warn", "Roulette offline", "Add at least one pending mission first.");
    return;
  }
  openModal("rouletteModal");
  const wheel = $("#rouletteWheel");
  const copy = $("#rouletteCopy");
  const credits = $("#rouletteCredits");
  wheel.classList.remove("done");
  wheel.classList.add("spinning");
  credits.hidden = true;

  let i = 0;
  copy.textContent = ROULETTE_LINES[0];
  const lineTimer = setInterval(() => {
    i = (i + 1) % ROULETTE_LINES.length;
    copy.textContent = ROULETTE_LINES[i];
  }, 700);
  beep("info");

  setTimeout(() => {
    clearInterval(lineTimer);
    wheel.classList.remove("spinning");
    wheel.classList.add("done");
    copy.textContent = "The wheel has spoken.";
    renderRouletteResult(chosen);
    credits.hidden = false;
    beep("fanfare");
    window.lucide && lucide.createIcons();
  }, 2600);
}

function renderRouletteResult(t) {
  ui.rouletteTaskId = t.id;
  $("#rouletteResult").innerHTML = `
    <h3>${escapeHtml(t.name)}</h3>
    <div class="dl-meta" style="margin:6px 0 10px">
      <span>${escapeHtml(t.subject)}</span>
      <span>${PRIO_LABEL[t.priority]} priority</span>
      <span>${t.estimate} min est.</span>
    </div>
    <div class="dl-meta">
      <span><i data-lucide="calendar-clock"></i>${new Date(`${t.date}T${t.time}`).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
      <span class="dl-countdown ${isOverdue(t) ? "crit" : hoursUntil(t) < 4 ? "warn" : "ok"}">${countdownText(t)}</span>
    </div>`;
}

$("#acceptMission").addEventListener("click", () => {
  const id = ui.rouletteTaskId;
  closeModal("rouletteModal");
  if (!id) return;
  ui.highlightId = id;
  navigate("missions");
  renderTasks();
  setTimeout(() => { ui.highlightId = null; }, 5000);
  const t = state.tasks.find((t) => t.id === id);
  toast("info", "Mission accepted", t ? t.name : "");
  setTimeout(() => {
    if (confirm(`Start a focus session for "${t ? t.name : ""}" now?`)) {
      const sel = $("#focusTaskSelect");
      if (sel) sel.value = id;
      navigate("focus");
      startFocus();
    }
  }, 450);
});

/* ------------------------------------------------------------
   Save My Night
------------------------------------------------------------ */
$("#qaSaveNight").addEventListener("click", () => {
  const pending = pendingTasks();
  if (!pending.length) {
    toast("warn", "Nothing to rescue", "Add missions first — then Save My Night can plan them.");
    return;
  }

  // Score: overdue first, then urgency, then importance, then short wins.
  const scored = pending
    .map((t) => {
      const hrs = hoursUntil(t);
      let s = 0;
      if (hrs < 0) s += 100;
      else if (hrs < 24) s += 70;
      else if (hrs < 48) s += 40;
      else s += 15;
      s += { low: 5, medium: 15, high: 25, critical: 40 }[t.priority] || 0;
      s += Math.max(0, 20 - t.estimate / 15); // short tasks are quick wins
      return { t, s };
    })
    .sort((a, b) => b.s - a.s)
    .map((x) => x.t)
    .slice(0, 8);

  const totalMin = scored.reduce((s, t) => s + t.estimate, 0);
  const breaks = Math.max(0, Math.floor(totalMin / 90));

  $("#planBody").innerHTML = `
    ${scored
      .map(
        (t, i) => `<div class="plan-item">
          <span class="plan-num">${i + 1}</span>
          <div><strong>${escapeHtml(t.name)}</strong>
          <span class="plan-meta">${escapeHtml(t.subject)} · Priority: ${PRIO_LABEL[t.priority]}${isOverdue(t) ? " · OVERDUE" : ""}</span></div>
          <span class="badge badge--${t.priority}">${t.estimate} min</span>
        </div>`
      )
      .join("")}
    <div class="plan-summary">
      <div><strong>${Math.floor(totalMin / 60)}h ${totalMin % 60}m</strong><span>total work time</span></div>
      <div><strong>${breaks}</strong><span>recommended breaks</span></div>
      <div><strong>${scored.length}</strong><span>missions queued</span></div>
    </div>`;

  ui.planQueue = scored.map((t) => t.id);
  openModal("planModal");
  toast("success", "Emergency plan created", `${scored.length} missions, ${Math.floor(totalMin / 60)}h ${totalMin % 60}m total.`);
  beep("fanfare");
});

$("#startPlan").addEventListener("click", () => {
  closeModal("planModal");
  const first = state.tasks.find((t) => t.id === ui.planQueue?.[0]);
  if (first) {
    const sel = $("#focusTaskSelect");
    if (sel) sel.value = first.id;
    navigate("focus");
    startFocus();
  }
});

/* ------------------------------------------------------------
   XP / Level
------------------------------------------------------------ */
function awardXp(amount, source) {
  state.xp += amount;
  const newLevel = levelFromXp(state.xp);
  if (newLevel > state.level) {
    state.level = newLevel;
    toast("xp", `Level up! You reached Level ${newLevel}`, "New rank unlocked. Keep surviving.");
    beep("fanfare");
  }
  renderSidebar();
}

function renderSidebar() {
  $("#sidebarLevel").textContent = `LV ${state.level}`;
  const next = nextLevelThreshold(state.level);
  const cur = levelThreshold(state.level);
  const pct = Math.min(100, Math.round(((state.xp - cur) / Math.max(1, next - cur)) * 100));
  $("#sidebarXp").textContent = `${state.xp} / ${next} XP`;
  $("#sidebarXpBar").style.width = pct + "%";
  $("#sidebarStreak").textContent = `${state.streak.current} day streak`;
  const unlocked = state.achievements.length;
  $("#achBadge").hidden = unlocked === 0;
  $("#achBadge").textContent = unlocked;
}

/* ------------------------------------------------------------
   Achievements
------------------------------------------------------------ */
function achievementStats() {
  const done = state.tasks.filter((t) => t.done);
  const byDay = {};
  for (const t of done) {
    const d = t.completedAt ? todayStr(new Date(t.completedAt)) : null;
    if (d) byDay[d] = (byDay[d] || 0) + 1;
  }
  return {
    completed: done.length,
    speedruns: done.filter((t) => t.completedAt && hoursUntil(t) > 24).length,
    criticalDone: done.filter((t) => t.priority === "critical").length,
    nightOwl: done.filter((t) => {
      if (!t.completedAt) return false;
      const h = new Date(t.completedAt).getHours();
      return h >= 0 && h < 4;
    }).length,
    bestDay: Math.max(0, ...Object.values(byDay), 0),
  };
}

function checkAchievements() {
  const stats = achievementStats();
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements.includes(a.id) && stats[a.stat] >= a.target) {
      state.achievements.push(a.id);
      toast("success", `Achievement unlocked: ${a.name}`, a.desc);
      beep("fanfare");
    }
  }
  renderSidebar();
}

function renderAchievements() {
  const stats = achievementStats();
  $("#achSummary").textContent = `${state.achievements.length} of ${ACHIEVEMENTS.length} unlocked`;
  $("#achGrid").innerHTML = ACHIEVEMENTS.map((a) => {
    const unlocked = state.achievements.includes(a.id);
    const prog = Math.min(stats[a.stat], a.target);
    return `<article class="ach-card ${unlocked ? "unlocked" : "locked"}">
      <div class="ach-badge"><i data-lucide="${a.icon}"></i></div>
      <div style="flex:1">
        <div class="ach-name">${a.name}</div>
        <div class="ach-desc">${a.desc}</div>
        <div class="ach-status">${unlocked ? "Unlocked" : `${prog} / ${a.target}`}</div>
        ${!unlocked ? `<div class="bar bar--xp ach-progress-bar"><div class="bar__fill" style="width:${(prog / a.target) * 100}%"></div></div>` : ""}
      </div>
    </article>`;
  }).join("");
  window.lucide && lucide.createIcons();
}

/* ------------------------------------------------------------
   Focus Mode
------------------------------------------------------------ */
const focus = {
  phase: "idle", // idle | focus | break | paused
  mode: "focus",
  remaining: 25 * 60,
  total: 25 * 60,
  timerId: null,
  taskId: null,
};

function fmtTime(s) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function renderFocusSetup() {
  const sel = $("#focusTaskSelect");
  const prev = sel.value;
  sel.innerHTML =
    `<option value="">No mission (free focus)</option>` +
    pendingTasks()
      .map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`)
      .join("");
  if (prev && state.tasks.some((t) => t.id === prev && !t.done)) sel.value = prev;

  const today = todayStr();
  const todaySessions = state.focusSessions.filter((s) => s.date === today);
  const totalMin = state.focusSessions.reduce((s, x) => s + x.minutes, 0);
  $("#statSessions").textContent = todaySessions.length;
  $("#statFocusTotal").textContent = totalMin >= 60 ? `${Math.floor(totalMin / 60)}h ${totalMin % 60}m` : `${totalMin}m`;
}

function setFocusUI() {
  $("#timerDisplay").textContent = fmtTime(focus.remaining);
  const pct = focus.total ? 1 - focus.remaining / focus.total : 0;
  $("#ringFill").style.strokeDashoffset = 339.3 * (1 - pct);
  $("#ringFill").dataset.phase = focus.mode === "break" ? "break" : "focus";
  $("#ringPulse").classList.toggle("on", focus.phase === "focus" || focus.phase === "break");

  const phase = $("#focusPhase");
  if (focus.phase === "idle") { phase.textContent = "Ready"; delete phase.dataset.phase; }
  else if (focus.phase === "paused") { phase.textContent = "Paused"; delete phase.dataset.phase; }
  else if (focus.mode === "break") { phase.textContent = "Break"; phase.dataset.phase = "break"; }
  else { phase.textContent = "Focus"; phase.dataset.phase = "running"; }

  $("#focusPause").disabled = focus.phase === "idle";
  $("#focusPause").innerHTML =
    focus.phase === "paused"
      ? '<i data-lucide="play"></i> Resume'
      : '<i data-lucide="pause"></i> Pause';

  const t = state.tasks.find((x) => x.id === focus.taskId);
  $("#focusTask").innerHTML = focus.mode === "break"
    ? "Break time. Stand up, look out a window, hydrate."
    : t
      ? `Focusing on: <strong>${escapeHtml(t.name)}</strong> · ${escapeHtml(t.subject)}`
      : "Free focus session — no mission attached.";

  window.lucide && lucide.createIcons();
}

function startFocus() {
  if (focus.phase === "idle") {
    const mins = Math.min(120, Math.max(1, parseInt($("#focusMinutes").value, 10) || 25));
    focus.taskId = $("#focusTaskSelect").value || null;
    focus.mode = "focus";
    focus.total = focus.remaining = mins * 60;
  }
  focus.phase = focus.mode === "break" ? "break" : "focus";
  clearInterval(focus.timerId);
  focus.timerId = setInterval(tickFocus, 1000);
  setFocusUI();
}

function pauseFocus() {
  if (focus.phase === "paused") return startFocus();
  clearInterval(focus.timerId);
  focus.phase = "paused";
  setFocusUI();
}

function resetFocus() {
  clearInterval(focus.timerId);
  focus.phase = "idle";
  focus.mode = "focus";
  focus.total = focus.remaining = Math.max(1, parseInt($("#focusMinutes").value, 10) || 25) * 60;
  setFocusUI();
}

function tickFocus() {
  focus.remaining--;
  if (focus.remaining > 0) return setFocusUI();
  clearInterval(focus.timerId);

  if (focus.mode === "focus") {
    const mins = Math.round(focus.total / 60);
    state.focusSessions.push({ date: todayStr(), minutes: mins, taskId: focus.taskId });
    const t = state.tasks.find((x) => x.id === focus.taskId);
    toast("success", "Focus session complete", `${mins} minutes recorded${t ? ` — ${t.name}` : ""}.`);
    beep("fanfare");
    saveState();
    const breakMin = Math.min(60, Math.max(1, parseInt($("#breakMinutes").value, 10) || 5));
    focus.mode = "break";
    focus.total = focus.remaining = breakMin * 60;
    focus.phase = "break";
    setFocusUI();
    renderFocusSetup();
  } else {
    toast("info", "Break over", "Back to the mission board, survivor.");
    beep("info");
    resetFocus();
  }
}

$("#focusStart").addEventListener("click", startFocus);
$("#focusPause").addEventListener("click", pauseFocus);
$("#focusReset").addEventListener("click", resetFocus);
$("#swapToBreak").addEventListener("click", () => {
  clearInterval(focus.timerId);
  focus.mode = "break";
  focus.phase = "break";
  focus.total = focus.remaining = Math.min(60, Math.max(1, parseInt($("#breakMinutes").value, 10) || 5)) * 60;
  setFocusUI();
});

/* ------------------------------------------------------------
   Statistics
------------------------------------------------------------ */
function renderStats() {
  const done = state.tasks.filter((t) => t.done).length;
  const pending = pendingTasks().length;
  const overdue = state.tasks.filter(isOverdue).length;
  const total = state.tasks.length;
  $("#stCompleted").textContent = done;
  $("#stPending").textContent = pending;
  $("#stOverdue").textContent = overdue;
  $("#stRate").textContent = total ? Math.round((done / total) * 100) : 0;

  const totalMin = state.focusSessions.reduce((s, x) => s + x.minutes, 0);
  $("#stFocusTotal2").textContent = `${totalMin} min total`;

  // 7-day focus chart
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ key: todayStr(d), label: d.toLocaleDateString([], { weekday: "short" }).slice(0, 2), min: 0 });
  }
  for (const s of state.focusSessions) {
    const day = days.find((d) => d.key === s.date);
    if (day) day.min += s.minutes;
  }
  const max = Math.max(...days.map((d) => d.min), 30);
  $("#focusChart").innerHTML = days
    .map((d) => {
      const h = Math.max(4, Math.round((d.min / max) * 150));
      return `<div class="chart-col">
        <span class="chart-val">${d.min || ""}</span>
        <div class="chart-bar ${d.min ? "" : "empty"}" style="height:${d.min ? h : 4}px"></div>
        <span class="chart-day">${d.label}</span>
      </div>`;
    })
    .join("");

  // Streak
  $("#stStreak").textContent = state.streak.current;
  $("#stBest").textContent = state.streak.longest;

  // 14-day heat strip
  const heat = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayStr(d);
    heat.push(`<div class="heat-cell ${state.streak.days.includes(key) ? "hit" : ""}" title="${key}">${d.getDate()}</div>`);
  }
  $("#heatStrip").innerHTML = heat.join("");

  // Priority breakdown (all tasks)
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const t of state.tasks) counts[t.priority] = (counts[t.priority] || 0) + 1;
  const maxP = Math.max(...Object.values(counts), 1);
  $("#prioBreakdown").innerHTML = Object.keys(counts)
    .map((p) => `<div class="prio-row">
      <span class="badge badge--${p}">${PRIO_LABEL[p]}</span>
      <div class="bar"><div class="bar__fill" style="width:${(counts[p] / maxP) * 100}%;background:${PRIO_COLOR[p]}"></div></div>
      <strong>${counts[p]}</strong>
    </div>`)
    .join("");
}

/* ------------------------------------------------------------
   Streak
------------------------------------------------------------ */
function updateStreak() {
  const today = todayStr();
  if (state.streak.days.includes(today)) {
    state.streak.current = computeCurrentStreak();
    state.streak.longest = Math.max(state.streak.longest, state.streak.current);
    return;
  }
  state.streak.days.push(today);
  const yesterday = todayStr(new Date(Date.now() - 86400000));
  state.streak.current = state.streak.days.includes(yesterday) ? state.streak.current + 1 : 1;
  state.streak.longest = Math.max(state.streak.longest, state.streak.current);
  state.streak.days = state.streak.days.slice(-60);
  toast("xp", "Streak extended", `${state.streak.current} day${state.streak.current > 1 ? "s" : ""} in a row.`);
}

function computeCurrentStreak() {
  let streak = 0;
  const d = new Date();
  // Today may not be done yet; count from yesterday backwards.
  if (!state.streak.days.includes(todayStr(d))) d.setDate(d.getDate() - 1);
  while (state.streak.days.includes(todayStr(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/* ------------------------------------------------------------
   Settings
------------------------------------------------------------ */
$("#saveName").addEventListener("click", () => {
  const name = $("#nameInput").value.trim() || "Survivor";
  state.settings.name = name.slice(0, 24);
  saveState();
  renderDashboard();
  toast("success", "Name saved", `Welcome, ${state.settings.name}.`);
});

$("#soundToggle").addEventListener("change", (e) => {
  state.settings.sound = e.target.checked;
  saveState();
});

function confirmDanger(msg) {
  return window.confirm(msg);
}

$("#clearTasks").addEventListener("click", () => {
  if (!confirmDanger("Delete ALL tasks? Completed history goes with them.")) return;
  state.tasks = [];
  saveState();
  renderAll();
  toast("danger", "All tasks cleared", "A blank slate. Use it wisely.");
});

$("#resetXp").addEventListener("click", () => {
  if (!confirmDanger("Reset XP and level to zero?")) return;
  state.xp = 0;
  state.level = 1;
  saveState();
  renderSidebar();
  renderDashboard();
  toast("danger", "XP reset", "Back to Level 1.");
});

$("#resetAch").addEventListener("click", () => {
  if (!confirmDanger("Reset all achievements?")) return;
  state.achievements = [];
  saveState();
  renderAchievements();
  renderSidebar();
  toast("danger", "Achievements reset", "The badge board is empty again.");
});

$("#resetAll").addEventListener("click", () => {
  if (!confirmDanger("Reset the ENTIRE application? All tasks, XP, achievements, streaks and settings will be wiped.")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
  seedSampleData();
  saveState();
  renderAll();
  renderDashboard();
  toast("danger", "Application reset", "Sample missions restored. Fresh start.");
});

/* Notifications dropdown */
$("#notifBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  const panel = $("#notifPanel");
  const overdue = state.tasks.filter(isOverdue);
  const due24 = pendingTasks().filter((t) => {
    const h = hoursUntil(t);
    return h >= 0 && h < 24;
  });
  const items = [
    ...overdue.map((t) => `<li><strong>Overdue:</strong> ${escapeHtml(t.name)} — ${countdownText(t)}</li>`),
    ...due24.map((t) => `<li><strong>Due soon:</strong> ${escapeHtml(t.name)} — ${countdownText(t)}</li>`),
  ];
  $("#notifList").innerHTML = items.length
    ? items.join("")
    : "<li>No alerts. The board is quiet.</li>";
  panel.hidden = !panel.hidden;
});
document.addEventListener("click", (e) => {
  if (!e.target.closest("#notifPanel") && !e.target.closest("#notifBtn")) {
    $("#notifPanel").hidden = true;
  }
});

/* ------------------------------------------------------------
   How-it-works popup (first launch only, reopenable in Settings)
------------------------------------------------------------ */
function showHowto() { openModal("howtoModal"); }

function dismissHowto() {
  state.howtoSeen = true;
  saveState();
  closeModal("howtoModal");
}

$("#howtoGotIt").addEventListener("click", dismissHowto);
$("#openHowto").addEventListener("click", showHowto);

/* ------------------------------------------------------------
   Sample data
------------------------------------------------------------ */
function inHours(h, m = 0) {
  const d = new Date(Date.now() + h * 3600000 + m * 60000);
  return { date: todayStr(d), time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` };
}

function seedSampleData() {
  if (state.seeded) return;
  state.seeded = true;
  const mk = (name, subject, priority, when, estimate, desc = "") => ({
    id: crypto.randomUUID ? crypto.randomUUID() : `s${Math.random().toString(16).slice(2)}`,
    name, subject, priority, estimate, desc,
    ...when,
    done: false,
    createdAt: new Date().toISOString(),
    xpAwarded: false,
  });
  state.tasks.push(
    mk("Computer Networks Assignment", "Computer Networks", "critical", inHours(5), 60, "Subnetting problems 1–8 plus the routing write-up."),
    mk("Operating Systems Revision", "Operating Systems", "high", inHours(20), 45, "Scheduling algorithms and deadlocks — past paper questions."),
    mk("DSA Practice", "Data Structures", "medium", inHours(48), 30, "Two tree traversal problems and one heap question."),
    mk("Mathematics Revision", "Mathematics", "low", inHours(96), 40, "Integration by parts — worksheet 4.")
  );
}

/* ------------------------------------------------------------
   Init
------------------------------------------------------------ */
function renderAll() {
  renderDashboard();
  renderTasks();
  renderAchievements();
  renderSidebar();
  renderFocusSetup();
  if ($("#page-stats").classList.contains("active")) renderStats();
  window.lucide && lucide.createIcons();
}

function init() {
  state = loadState();
  seedSampleData();
  saveState();

  $("#nameInput").value = state.settings.name;
  $("#soundToggle").checked = state.settings.sound;

  // Subject suggestions from existing tasks
  $("#subjectList").innerHTML = [...new Set(state.tasks.map((t) => t.subject))]
    .map((s) => `<option value="${escapeHtml(s)}"></option>`)
    .join("");

  renderAll();
  if (!state.howtoSeen) showHowto();

  // Keep countdowns and panic level honest as time passes.
  setInterval(() => {
    renderDashboard();
    if (!$("#page-missions").classList.contains("active")) return;
    if (ui.search || ui.filter !== "all") return;
    renderTasks();
  }, 60000);
}

document.addEventListener("DOMContentLoaded", init);
