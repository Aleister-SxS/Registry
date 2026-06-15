/* ============================================================
   TEAM REGISTRY — Shared App Logic (js/app.js)
   ============================================================ */

// ── Config ────────────────────────────────────────────────
// Set this to the date you last deployed to GitHub Pages
const DEPLOY_DATE = "June 2026";

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
function show(el)  { if (el) { el.classList.remove("hidden"); el.style.display = ""; } }
function hide(el)  { if (el) { el.classList.add("hidden");    el.style.display = "none"; } }
function toggle(el){ if (el) { if (el.style.display === "none" || el.classList.contains("hidden")) { show(el); } else { hide(el); } } }

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
let _processingTimer = null;
let _processingStart = 0;

// Global processing overlay — auto-creates if not present on the page
function showProcessing(title = "Processing…", sub = "Please wait and stay on this page.") {
  let ov = document.getElementById("global-processing-overlay");
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "global-processing-overlay";
    ov.style.cssText = "display:none;position:fixed;inset:0;background:rgba(11,13,18,0.9);z-index:9999;flex-direction:column;align-items:center;justify-content:center;gap:1rem;";
    ov.innerHTML = `<div style="width:48px;height:48px;border:3px solid rgba(120,160,255,0.2);border-top-color:#4f8ef7;border-radius:50%;animation:spin 0.7s linear infinite;"></div>
      <div id="gpo-title" style="font-size:1rem;font-weight:600;color:#e8edf5;"></div>
      <div id="gpo-sub" style="font-size:0.82rem;color:#8b98b5;"></div>`;
    document.body.appendChild(ov);
  }
  ov.querySelector("#gpo-title").textContent = title;
  ov.querySelector("#gpo-sub").textContent   = sub;
  ov.style.display = "flex";
  _processingStart = Date.now();
}

function hideProcessing(successMsg, successType = "success") {
  const elapsed = Date.now() - _processingStart;
  const minHold = 2000; // 2 second minimum
  const delay   = Math.max(0, minHold - elapsed);
  clearTimeout(_processingTimer);
  _processingTimer = setTimeout(() => {
    const ov = document.getElementById("global-processing-overlay");
    if (ov) ov.style.display = "none";
    if (successMsg) toast(successMsg, successType, 3500);
  }, delay);
}
function toast(msg, type = "success", duration = 3500) {
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
  // Redirect unauthenticated users away from protected pages
  const alwaysPublic = ['register.html', 'admin.html', 'team.html', ''];
  if (!session && !alwaysPublic.includes(activePage)) {
    window.location.replace('register.html');
    return;
  }
  const pages = [
    { href: "index.html",       label: "Team Registry",    requiresAuth: true },
    { href: "players.html",     label: "Guild Members",    requiresAuth: true },
    { href: "status.html",      label: "Your Invites",     requiresAuth: true },
    { href: "your-team.html",   label: "Your Teams",       requiresAuth: true },
  ];

  const links = pages.filter(p => !p.requiresAuth || session).map(p => {
    const active = p.href === activePage ? " active" : "";
    return `<a href="${p.href}" class="nav-link${active}">${p.label}</a>`;
  }).join("");

  const rightHtml = session
    ? `<div class="nav-dropdown-wrap" id="nav-user-wrap">
        <button class="session-tag" onclick="toggleNavDropdown()" title="Account menu"
          style="display:flex;align-items:center;gap:7px;padding:4px 10px 4px 5px;">
          ${session.avatarUrl
            ? `<img src="${esc(session.avatarUrl)}" style="width:26px;height:26px;border-radius:50%;object-fit:cover;border:1px solid var(--blue-mid);" />`
            : `<div style="width:26px;height:26px;border-radius:50%;background:var(--blue-dim);border:1px solid var(--blue-mid);display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:700;color:var(--blue-bright);">${esc((session.name||session.gamertag||"?")[0].toUpperCase())}</div>`
          }
          <span>${esc(session.name || session.gamertag)}</span> ▾
        </button>
        <div class="nav-dropdown" id="nav-dropdown">
          <a href="profile.html?id=${session.id}" class="nav-dropdown-item">👤 View Profile</a>
          <div class="nav-dropdown-item nav-dropdown-danger" onclick="navLogout()">🚪 Log Out</div>
        </div>
      </div>`
    : "";

  // Mobile hamburger menu items
  const mobileLinks = pages.filter(p => !p.requiresAuth || session).map(p => {
    const active = p.href === activePage ? " active" : "";
    return `<a href="${p.href}" class="mobile-nav-link${active}">${p.label}</a>`;
  }).join("");

  const mobileUserSection = session
    ? `<div class="mobile-nav-user">
        ${session.avatarUrl
          ? `<img src="${esc(session.avatarUrl)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--blue-mid);" />`
          : `<div class="avatar avatar-md">${esc((session.name||session.gamertag||"?")[0].toUpperCase())}</div>`
        }
        <div>
          <div style="font-weight:700;font-size:0.9rem;">${esc(session.name||session.gamertag)}</div>
          <div style="font-size:0.72rem;color:var(--text2);">Logged in</div>
        </div>
      </div>
      <a href="profile.html?id=${session.id}" class="mobile-nav-link">👤 View Profile</a>
      <div class="mobile-nav-link mobile-nav-danger" onclick="navLogout()">🚪 Log Out</div>`
    : `<a href="register.html" class="mobile-nav-link">Log In / Register</a>`;

  const navHtml = `
    <nav id="site-nav">
      <a href="${session ? 'index.html' : 'register.html'}" class="nav-logo">
        <div class="dot"></div><span>BERSERK GUILD</span>
      </a>
      <div class="nav-links" id="nav-links-desktop">${links}</div>
      <div class="nav-right">
        ${rightHtml}
        <button class="hamburger-btn" id="hamburger-btn" onclick="toggleHamburger()" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
    <!-- Mobile drawer -->
    <div class="mobile-nav-overlay" id="mobile-nav-overlay" onclick="closeHamburger()"></div>
    <div class="mobile-nav-drawer" id="mobile-nav-drawer">
      <div class="mobile-nav-header">
        <div class="nav-logo" style="margin-bottom:0;">
          <div class="dot"></div><span>BERSERK GUILD</span>
        </div>
        <button onclick="closeHamburger()" style="background:none;border:none;color:var(--text2);font-size:1.2rem;cursor:pointer;">✕</button>
      </div>
      ${mobileUserSection}
      <div class="mobile-nav-divider"></div>
      ${mobileLinks}
    </div>
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

  const footerHtml = `
    <footer id="site-footer" style="margin-top:auto;background:var(--bg2);border-top:1px solid var(--border);
      padding:0.875rem 2rem;font-size:0.72rem;color:var(--text3);
      font-family:var(--mono);letter-spacing:0.03em;line-height:1.6;
      display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
      <span>Last updated <strong style="color:var(--text2);">${DEPLOY_DATE}</strong> &nbsp;·&nbsp;
      Please report any issues to <strong style="color:var(--text2);">Aleister</strong> on Discord or in-game.</span>
      <a href="admin.html" style="color:var(--text3);font-size:0.65rem;opacity:0.5;transition:opacity 0.15s;"
        onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.5'">Admin</a>
    </footer>`;

  // Guard: only inject nav/footer once — prevents duplication on repeated buildNav calls
  if (!document.getElementById("site-nav")) {
    document.body.insertAdjacentHTML("afterbegin", navHtml);
  }
  if (!document.getElementById("site-footer")) {
    document.body.insertAdjacentHTML("beforeend", footerHtml);
  }
  // Make body flex-column so footer sticks to bottom
  document.body.style.display = "flex";
  document.body.style.flexDirection = "column";
  document.body.style.minHeight = "100vh";
  const mainEl = document.querySelector("main");
  if (mainEl) mainEl.style.flex = "1";
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

function toggleNavDropdown() {
  const dd = document.getElementById("nav-dropdown");
  if (dd) dd.classList.toggle("open");
}

function toggleHamburger() {
  document.getElementById("mobile-nav-drawer").classList.toggle("open");
  document.getElementById("mobile-nav-overlay").classList.toggle("open");
}

function closeHamburger() {
  document.getElementById("mobile-nav-drawer")?.classList.remove("open");
  document.getElementById("mobile-nav-overlay")?.classList.remove("open");
}

function navLogout() {
  confirm_("Log Out", "Are you sure you want to log out?", () => {
    clearSession();
    location.href = "register.html";
  }, false);
}

// Close dropdown when clicking outside
document.addEventListener("click", e => {
  const wrap = document.getElementById("nav-user-wrap");
  if (wrap && !wrap.contains(e.target)) {
    const dd = document.getElementById("nav-dropdown");
    if (dd) dd.classList.remove("open");
  }
});

// ── Avatar presets ────────────────────────────────────────
// Fantomon portrait images from EOG.GG
const AVATAR_PRESETS = [
  { id: "aegiswing",   label: "Aegiswing",   url: "https://eog.gg/assets/sxs/fantomons/aegiswing.webp" },
  { id: "nyxarchon",   label: "Nyxarchon",   url: "https://eog.gg/assets/sxs/fantomons/nyxarchon.webp" },
  { id: "mandragora",  label: "Mandragora",  url: "https://eog.gg/assets/sxs/fantomons/mandragora.webp" },
  { id: "herbote",     label: "Herbote",     url: "https://eog.gg/assets/sxs/fantomons/herbote.webp" },
  { id: "boaro",       label: "Boaro",       url: "https://eog.gg/assets/sxs/fantomons/boaro.webp" },
  { id: "armopi",      label: "Armopi",      url: "https://eog.gg/assets/sxs/fantomons/armopi.webp" },
  { id: "falko",       label: "Falko",       url: "https://eog.gg/assets/sxs/fantomons/falko.webp" },
  { id: "zeioletus",   label: "Zeioletus",   url: "https://eog.gg/assets/sxs/fantomons/zeioletus.webp" },
  { id: "kels",        label: "Kels",        url: "https://eog.gg/assets/sxs/fantomons/kels.webp" },
];

// Render an avatar — image if set, initials fallback
function renderAvatar(member, sizeClass) {
  if (member && member.avatarUrl) {
    return `<img src="${esc(member.avatarUrl)}" alt="${esc(member.name||'')}"
      style="border-radius:50%;object-fit:cover;border:2px solid var(--blue-mid);"
      class="${sizeClass}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
      <div class="avatar ${sizeClass}" style="display:none;">${initials(member.name)}</div>`;
  }
  return `<div class="avatar ${sizeClass}">${initials(member ? member.name : "?")}</div>`;
}

// Build the avatar picker modal HTML — call once, append to body
function buildAvatarPicker(onSelect) {
  const existing = document.getElementById("avatar-picker-modal");
  if (existing) existing.remove();

  const html = `
    <div class="modal-overlay" id="avatar-picker-modal">
      <div class="modal" style="max-width:520px;">
        <div class="modal-title" style="margin-bottom:1rem;">Choose Your Avatar</div>
        
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:1.25rem;">
          ${AVATAR_PRESETS.map(p => `
            <div onclick="window._avatarPickerSelect('${p.id}')"
              id="ap-opt-${p.id}"
              style="cursor:pointer;border-radius:10px;border:2px solid var(--border);
                background:var(--surface);padding:10px;text-align:center;transition:border-color 0.15s;">
              <img src="${p.url}" alt="${p.label}"
                style="width:72px;height:72px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 6px;"
                onerror="this.src='';this.style.background='var(--surface2)'" />
              <div style="font-size:0.72rem;color:var(--text2);">${p.label}</div>
            </div>
          `).join("")}
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="closeAvatarPicker()">Cancel</button>
          <button class="btn btn-primary" id="ap-confirm-btn" disabled onclick="confirmAvatarPick()">Select</button>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", html);
  window._avatarPickerCurrent = null;
  window._avatarPickerCallback = onSelect;

  window._avatarPickerSelect = (id) => {
    // Clear previous selection
    AVATAR_PRESETS.forEach(p => {
      const opt = document.getElementById("ap-opt-" + p.id);
      if (opt) opt.style.borderColor = "var(--border)";
    });
    const sel = document.getElementById("ap-opt-" + id);
    if (sel) sel.style.borderColor = "var(--blue)";
    window._avatarPickerCurrent = id;
    document.getElementById("ap-confirm-btn").disabled = false;
  };
}

function openAvatarPicker(onSelect) {
  buildAvatarPicker(onSelect);
  document.getElementById("avatar-picker-modal").classList.add("open");
}

function closeAvatarPicker() {
  const m = document.getElementById("avatar-picker-modal");
  if (m) m.remove();
}

function confirmAvatarPick() {
  const id = window._avatarPickerCurrent;
  if (!id) return;
  const preset = AVATAR_PRESETS.find(p => p.id === id);
  if (preset && window._avatarPickerCallback) {
    window._avatarPickerCallback(preset.url);
  }
  closeAvatarPicker();
}

// ── Translation via MyMemory (free, no key needed) ───────
async function translateText(text, targetLang) {
  const targetCode = getLangCode(targetLang);
  // MyMemory: use xx|targetCode where xx is a catch-all wildcard
  // Best approach: try es|en, de|en etc won't work without knowing source.
  // Instead use the undocumented langpair=|targetCode (empty source = auto-detect server side)
  // Fall back: translate to target regardless — if already in target, the text won't change
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=%7C${targetCode}&de=translation@berserkguild.com`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Translation service unavailable. Try again shortly.");
  const d = await r.json();
  if (!d.responseData) throw new Error("Translation failed — please try again.");
  if (d.responseStatus === 429) throw new Error("Translation limit reached for today. Try again tomorrow.");
  const result = d.responseData.translatedText;
  // If result exactly matches input (case-insensitive), it's already in the target language
  if (result.trim().toLowerCase() === text.trim().toLowerCase()) return null;
  return result;
}

function getLangCode(langName) {
  const map = {
    "English":"en","Spanish":"es","Portuguese":"pt","French":"fr","German":"de",
    "Italian":"it","Dutch":"nl","Russian":"ru","Polish":"pl","Turkish":"tr",
    "Arabic":"ar","Hindi":"hi","Bengali":"bn","Japanese":"ja","Korean":"ko",
    "Chinese (Simplified)":"zh-CN","Chinese (Traditional)":"zh-TW",
    "Vietnamese":"vi","Thai":"th","Indonesian":"id","Malay":"ms",
    "Filipino":"tl","Swedish":"sv","Norwegian":"no","Danish":"da",
    "Finnish":"fi","Czech":"cs","Slovak":"sk","Romanian":"ro",
    "Hungarian":"hu","Greek":"el","Other":"en",
  };
  return map[langName] || "en";
}
