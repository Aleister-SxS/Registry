/* ============================================================
   TEAM REGISTRY — Shared App Logic (js/app.js)
   ============================================================ */

// ── Config ────────────────────────────────────────────────
const API_URL = "https://script.google.com/macros/s/AKfycbwK6orjm0KV2Kw9oOesh26WEI1pTUkXtwBQVFhAZ56bfZ47tf3bIa1w9d_9QOKv6_kI/exec";

// ── Class data ────────────────────────────────────────────
const CLASS_TREE = {
  T1: { label: "T1", subclasses: ["Mage","Warrior"] },
  T2: { label: "T2", subclasses: ["Duelist","Knight","Sorcerer","Sage"] },
  T3: { label: "T3", subclasses: ["Berserker","Paladin","Archmage","Arcanist"] },
  T4: { label: "T4", subclasses: ["Conqueror","Guardian","Destroyer","Dominator"] },
  T5: { label: "T5", subclasses: ["Ravager","Templar","Magister","Prophet"] },
};

const CLASS_ICONS = {
  Mage:"🔮", Warrior:"⚔️", Duelist:"🗡️", Knight:"🛡️",
  Sorcerer:"✨", Sage:"📿", Berserker:"🪓", Paladin:"⚜️",
  Archmage:"🌀", Arcanist:"🔯", Conqueror:"👑", Guardian:"🏰",
  Destroyer:"💥", Dominator:"⚡", Ravager:"🔥", Templar:"✝️",
  Magister:"📖", Prophet:"🌟",
};

const TIMEZONES = [
  "UTC-12:00","UTC-11:00","UTC-10:00","UTC-09:00","UTC-08:00 (PST)",
  "UTC-07:00 (MST)","UTC-06:00 (CST)","UTC-05:00 (EST)","UTC-04:00",
  "UTC-03:00","UTC-02:00","UTC-01:00","UTC+00:00 (GMT)","UTC+01:00 (CET)",
  "UTC+02:00","UTC+03:00","UTC+04:00","UTC+05:00","UTC+05:30 (IST)",
  "UTC+06:00","UTC+07:00","UTC+08:00 (CST)","UTC+09:00 (JST)",
  "UTC+10:00 (AEST)","UTC+11:00","UTC+12:00",
];

const LANGUAGES = [
  "English","Spanish","Portuguese","French","German","Italian","Dutch",
  "Russian","Polish","Turkish","Arabic","Hindi","Bengali","Japanese",
  "Korean","Chinese (Simplified)","Chinese (Traditional)","Vietnamese",
  "Thai","Indonesian","Malay","Filipino","Swedish","Norwegian","Danish",
  "Finnish","Czech","Slovak","Romanian","Hungarian","Greek","Other",
];

// ── Session management ────────────────────────────────────
const SESSION_KEY = "tr_session";

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
  catch { return null; }
}

function setSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function isLoggedIn() {
  return !!getSession();
}

// ── API calls ─────────────────────────────────────────────
async function apiGet(params = {}) {
  if (API_URL === "YOUR_APPS_SCRIPT_WEB_APP_URL_HERE") {
    throw new Error("API not configured. Please set your Apps Script URL in js/app.js");
  }
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${API_URL}?${qs}`, { redirect: "follow" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  if (!d.ok) throw new Error(d.error || "Request failed");
  return d;
}

async function apiPost(body) {
  if (API_URL === "YOUR_APPS_SCRIPT_WEB_APP_URL_HERE") {
    throw new Error("API not configured. Please set your Apps Script URL in js/app.js");
  }
  const r = await fetch(API_URL, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain" }, // Apps Script requires text/plain to avoid CORS preflight
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  if (!d.ok) throw new Error(d.error || "Request failed");
  return d;
}

// ── Power rating parser ───────────────────────────────────
// Accepts "180k", "1.5m", "1800", etc. Returns integer.
function parsePower(str) {
  if (!str && str !== 0) return "";
  const s = String(str).trim().toLowerCase();
  if (s === "") return "";
  const num = parseFloat(s);
  if (isNaN(num)) return "";
  if (s.endsWith("m")) return Math.round(num * 1_000_000);
  if (s.endsWith("k")) return Math.round(num * 1_000);
  return Math.round(num);
}

function formatPower(n) {
  if (!n && n !== 0) return "—";
  const num = Number(n);
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/,"") + "M";
  if (num >= 1_000)     return (num / 1_000).toFixed(1).replace(/\.0$/,"") + "k";
  return String(num);
}

// ── Composition helpers ───────────────────────────────────
function compClass(role) {
  return { Tank:"comp-tank", Support:"comp-support", DPS:"comp-dps" }[role] || "";
}

function renderComposition(comp) {
  if (!comp || !comp.length) return "";
  const arr = Array.isArray(comp) ? comp : String(comp).split(",").filter(Boolean);
  return arr.map(r => `<span class="comp-pill ${compClass(r)}">${esc(r)}</span>`).join("");
}

// ── Avatar initials ───────────────────────────────────────
function initials(name) {
  return (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().substring(0,2);
}

// ── Escape HTML ───────────────────────────────────────────
function esc(s) {
  return String(s ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ── Show/hide element ─────────────────────────────────────
function show(el)  { if (el) el.classList.remove("hidden"); }
function hide(el)  { if (el) el.classList.add("hidden"); }
function toggle(el){ if (el) el.classList.toggle("hidden"); }

function el(id)    { return document.getElementById(id); }

// ── Alert helpers ─────────────────────────────────────────
function showAlert(id, msg, type = "error") {
  const el_ = typeof id === "string" ? el(id) : id;
  if (!el_) return;
  el_.textContent = msg;
  el_.className = `alert alert-${type}`;
  el_.classList.remove("hidden");
}
function clearAlert(id) {
  const el_ = typeof id === "string" ? el(id) : id;
  if (el_) { el_.textContent = ""; el_.classList.add("hidden"); }
}

// ── Toast ─────────────────────────────────────────────────
let toastTimer = null;
function toast(msg, type = "success", duration = 3000) {
  let t = el("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.style.cssText = `
      position:fixed;bottom:1.5rem;right:1.5rem;z-index:500;
      padding:10px 18px;border-radius:8px;font-size:0.84rem;
      max-width:340px;line-height:1.4;pointer-events:none;
      transition:opacity 0.2s;
    `;
    document.body.appendChild(t);
  }
  const styles = {
    success: "background:#1e3a2a;border:1px solid #5ecf8a;color:#5ecf8a;",
    error:   "background:#2a1212;border:1px solid #e05555;color:#ff7070;",
    info:    "background:#121a2a;border:1px solid #6db0e8;color:#6db0e8;",
    amber:   "background:#2a2012;border:1px solid #e8b86d;color:#e8b86d;",
  };
  t.style.cssText += styles[type] || styles.success;
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.opacity = "0"; }, duration);
}

// ── Confirm modal ─────────────────────────────────────────
let confirmCallback = null;

function confirm_(title, body, cb, danger = true) {
  const overlay = el("confirm-modal");
  if (!overlay) { if (window.confirm(`${title}\n${body}`)) cb(); return; }
  el("confirm-title").textContent = title;
  el("confirm-body").textContent  = body;
  const btn = el("confirm-ok");
  btn.className = `btn ${danger ? "btn-danger" : "btn-primary"}`;
  btn.textContent = danger ? "Confirm" : "OK";
  confirmCallback = cb;
  overlay.classList.add("open");
}

function closeConfirmModal() {
  const overlay = el("confirm-modal");
  if (overlay) overlay.classList.remove("open");
  confirmCallback = null;
}

// ── Nav builder ───────────────────────────────────────────
function buildNav(activePage, opts = {}) {
  const session = getSession();
  const pages = [
    { href: "index.html",       label: "Current Teams" },
    { href: "players.html",     label: "Players" },
    { href: "status.html",      label: "Team Status",    requiresAuth: true },
    { href: "your-team.html",   label: "Your Team",      requiresAuth: true },
    { href: "register.html",    label: "Register / Log In" },
  ];

  const links = pages.filter(p => !p.requiresAuth || session).map(p => {
    const active = p.href === activePage ? " active" : "";
    return `<a href="${p.href}" class="nav-link${active}">${p.label}</a>`;
  }).join("");

  const rightHtml = session
    ? `<a href="profile.html?id=${session.id}" class="session-tag" title="View profile">
         ${esc(session.gamertag || session.name)}
       </a>`
    : opts.hideRegisterBtn
      ? ""
      : `<a href="register.html" class="btn btn-primary btn-sm">Register</a>`;

  const navHtml = `
    <nav>
      <a href="index.html" class="nav-logo">
        <div class="dot"></div><span>TEAM REGISTRY</span>
      </a>
      <div class="nav-links">${links}</div>
      <div class="nav-right">${rightHtml}</div>
    </nav>
    <div class="modal-overlay" id="confirm-modal">
      <div class="modal">
        <div class="modal-title" id="confirm-title">Confirm</div>
        <div class="modal-body"  id="confirm-body"></div>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="closeConfirmModal()">Cancel</button>
          <button class="btn btn-danger" id="confirm-ok"
            onclick="if(confirmCallback){confirmCallback();closeConfirmModal();}">Confirm</button>
        </div>
      </div>
    </div>
  `;

  const navEl = document.querySelector("body");
  navEl.insertAdjacentHTML("afterbegin", navHtml);
}

// ── Cascading class selector ──────────────────────────────
function buildClassSelector(tierSelId, subSelId) {
  const tierSel = el(tierSelId);
  const subSel  = el(subSelId);
  if (!tierSel || !subSel) return;

  // populate tier
  tierSel.innerHTML = `<option value="">— Select Tier —</option>` +
    Object.keys(CLASS_TREE).map(t => `<option value="${t}">${t}</option>`).join("");

  tierSel.addEventListener("change", () => {
    const tier = tierSel.value;
    if (!tier) {
      subSel.innerHTML = `<option value="">— Select Class —</option>`;
      subSel.disabled = true;
      return;
    }
    const subs = CLASS_TREE[tier].subclasses;
    subSel.innerHTML = `<option value="">— Select Class —</option>` +
      subs.map(s => `<option value="${s}">${s}</option>`).join("");
    subSel.disabled = false;
  });

  // reset sub if user blurs without picking
  tierSel.addEventListener("blur", () => {
    if (!tierSel.value) {
      subSel.innerHTML = `<option value="">— Select Class —</option>`;
      subSel.disabled = true;
    }
  });

  subSel.disabled = true;
}

// ── Composition selector ──────────────────────────────────
function buildCompSelector(containerId, maxSlots = 4) {
  const container = el(containerId);
  if (!container) return;
  let selected = []; // array of role strings, can repeat

  const roles = ["Tank","Support","DPS"];
  const classMap = { Tank:"sel-tank", Support:"sel-support", DPS:"sel-dps" };

  function render() {
    const countEl = el(containerId + "-count");
    if (countEl) countEl.textContent = `${selected.length} / ${maxSlots} selected`;
  }

  container.innerHTML = roles.map(r =>
    `<button type="button" class="comp-btn" data-role="${r}"
       onclick="window._compToggle_${containerId}('${r}')">${r}</button>`
  ).join("");

  window[`_compToggle_${containerId}`] = function(role) {
    const idx = selected.lastIndexOf(role);
    if (idx >= 0 && selected.filter(r=>r===role).length > 0) {
      // remove one instance
      selected.splice(idx,1);
    } else if (selected.length < maxSlots) {
      selected.push(role);
    }
    // update button visual
    roles.forEach(r => {
      const btn = container.querySelector(`[data-role="${r}"]`);
      if (!btn) return;
      const count = selected.filter(x=>x===r).length;
      btn.className = `comp-btn ${count > 0 ? classMap[r] : ""}`;
      btn.textContent = count > 1 ? `${r} ×${count}` : r;
    });
    render();
  };

  return {
    get: () => [...selected],
    set: (arr) => {
      selected = arr ? [...arr] : [];
      // replay toggles
      selected.forEach(r => {
        const btn = container.querySelector(`[data-role="${r}"]`);
        if (btn) {
          const count = selected.filter(x=>x===r).length;
          btn.className = `comp-btn ${classMap[r]}`;
          btn.textContent = count > 1 ? `${r} ×${count}` : r;
        }
      });
      render();
    },
  };
}

// ── Populate select with array ────────────────────────────
function populateSelect(selId, options, placeholder = "— Select —") {
  const s = el(selId);
  if (!s) return;
  s.innerHTML = `<option value="">${placeholder}</option>` +
    options.map(o => typeof o === "string"
      ? `<option value="${esc(o)}">${esc(o)}</option>`
      : `<option value="${esc(o.value)}">${esc(o.label)}</option>`
    ).join("");
}

// ── Page ready helper ─────────────────────────────────────
function onReady(fn) {
  if (document.readyState !== "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
}
