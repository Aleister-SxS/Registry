// ══════════════════════════════════════════════════════════════════
// SxS Berserk Team Registry — Google Apps Script Backend
// ══════════════════════════════════════════════════════════════════

const SPREADSHEET_ID  = SpreadsheetApp.getActiveSpreadsheet().getId();
const ADMIN_PASSWORD  = "Blazer!?31!?";
const DEPLOY_VERSION  = "2.0";

// ── Sheet helpers ─────────────────────────────────────────────────
function getSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    members:          ensureSheet("Members",          ["id","name","gamertag","tier","class","power","level","bio","description","playstyle","discordId","discordName","timezone","languages","prefLanguage","lookingForTeam","isCaptain","lookingForCaptainRole","teamIds","captainKey","pvpBuild","avatarUrl","pvpFantomon","joinedAt","teamBuilds","suspended","email","notifPrefs","fcmToken","guildMember"]),
    teams:            ensureSheet("Teams",            ["id","name","description","composition","playstyle","minPower","minLevel","requiresDiscord","lookingForCaptain","prefLanguage","captainId","captainName","status","memberCount","formation","createdAt"]),
    requests:         ensureSheet("Requests",         ["id","type","teamId","teamName","fromId","toId","status","createdAt"]),
    settings:         ensureSheet("Settings",         ["key","value"]),
    messages:         ensureSheet("Messages",         ["id","teamId","memberId","memberName","avatarUrl","text","sentAt"]),
    broadcasts:       ensureSheet("Broadcasts",       ["id","message","active","sentAt"]),
    dms:              ensureSheet("DirectMessages",   ["id","fromId","fromName","toId","toName","text","sentAt","readAt"]),
    buildSuggestions: ensureSheet("BuildSuggestions", ["id","teamId","fromId","fromName","toId","slotType","slotIndex","skillId","reason","status","createdAt"]),
    announcements:    ensureSheet("TeamAnnouncements",["id","teamId","captainId","message","updatedAt"]),
  };
}

function ensureSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else {
    const existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    headers.forEach((h, i) => {
      if (!existing.includes(h)) {
        sheet.getRange(1, existing.length + 1).setValue(h);
        existing.push(h);
      }
    });
  }
  return sheet;
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      const v = row[i];
      // Google Sheets stores "TRUE"/"FALSE" as native booleans; convert back to uppercase strings
      if (typeof v === "boolean") {
        obj[h] = v ? "TRUE" : "FALSE";
      } else {
        obj[h] = v === undefined ? "" : String(v);
      }
    });
    return obj;
  });
}

function buildRow(sheet, obj) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers.map(h => obj[h] !== undefined ? obj[h] : "");
}

function updateRowById(sheet, id, obj) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf("id");
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      const newRow = headers.map((h, j) => obj[h] !== undefined ? obj[h] : data[i][j]);
      sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
      return true;
    }
  }
  return false;
}

function deleteRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf("id");
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function upsertSetting(settingsSheet, key, value) {
  const data = settingsSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      settingsSheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  settingsSheet.appendRow([key, value]);
}

function getSetting(settingsSheet, key, defaultVal) {
  const data = settingsSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1];
  }
  return defaultVal;
}

// ── Normalize a boolean-ish value coming from the frontend ────────
// Handles: true, false, "TRUE", "FALSE", "true", "false", 1, 0
function normBool(val) {
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number")  return val ? "TRUE" : "FALSE";
  if (typeof val === "string")  return val.trim().toUpperCase() === "TRUE" ? "TRUE" : "FALSE";
  return "FALSE";
}

function uid() {
  return Utilities.getUuid().replace(/-/g, "").substring(0, 16);
}

function now() {
  return new Date().toISOString();
}

// ── Response helpers ──────────────────────────────────────────────
function ok(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, ...data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function err(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Auth helpers ──────────────────────────────────────────────────
function authMember(sheets, gamertag, captainKey) {
  const members = sheetToObjects(sheets.members);
  const m = members.find(x => String(x.gamertag) === String(gamertag) && x.captainKey === captainKey);
  if (!m) throw new Error("Invalid Player ID or Secret Key.");
  if (String(m.suspended).toUpperCase() === "TRUE") throw new Error("Your account is suspended.");
  return m;
}

function authMemberById(sheets, memberId, captainKey) {
  const members = sheetToObjects(sheets.members);
  const m = members.find(x => x.id === memberId && x.captainKey === captainKey);
  if (!m) throw new Error("Invalid Player ID or Secret Key.");
  if (String(m.suspended).toUpperCase() === "TRUE") throw new Error("Your account is suspended.");
  return m;
}

// ── Firebase Cloud Messaging (Push Notifications) ────────────────
// Service account credentials stored in Script Properties.
// In Apps Script editor: Project Settings → Script Properties → Add:
//   FCM_CLIENT_EMAIL  = firebase-adminsdk-fbsvc@berserk-guild-13995.iam.gserviceaccount.com
//   FCM_PRIVATE_KEY   = (paste the full -----BEGIN PRIVATE KEY----- block)
//   FCM_PROJECT_ID    = berserk-guild-13995

function _getFcmAccessToken() {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get("FCM_ACCESS_TOKEN");
    if (cached) return cached;

    const props = PropertiesService.getScriptProperties();
    const clientEmail = props.getProperty("FCM_CLIENT_EMAIL");
    const privateKey  = props.getProperty("FCM_PRIVATE_KEY").replace(/\\n/g, "\n");

    const now  = Math.floor(Date.now() / 1000);
    const claim = {
      iss:   clientEmail,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud:   "https://oauth2.googleapis.com/token",
      iat:   now,
      exp:   now + 3600,
    };

    const header    = Utilities.base64EncodeWebSafe(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload   = Utilities.base64EncodeWebSafe(JSON.stringify(claim));
    const unsigned  = header + "." + payload;
    const signature = Utilities.base64EncodeWebSafe(
      Utilities.computeRsaSha256Signature(unsigned, privateKey)
    );
    const jwt = unsigned + "." + signature;

    const resp = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
      method: "post",
      contentType: "application/x-www-form-urlencoded",
      payload: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + jwt,
      muteHttpExceptions: true,
    });
    const token = JSON.parse(resp.getContentText()).access_token;
    if (token) cache.put("FCM_ACCESS_TOKEN", token, 3500); // cache just under 1 hour
    return token;
  } catch(e) {
    console.error("FCM token error:", e);
    return null;
  }
}

function _notifyPush(member, title, body, url) {
  try {
    if (!member.fcmToken) return;
    const token = _getFcmAccessToken();
    if (!token) return;
    const projectId = PropertiesService.getScriptProperties().getProperty("FCM_PROJECT_ID") || "berserk-guild-13995";
    UrlFetchApp.fetch("https://fcm.googleapis.com/v1/projects/" + projectId + "/messages:send", {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + token },
      payload: JSON.stringify({
        message: {
          token: member.fcmToken,
          notification: { title: "[SxS Berserk] " + title, body },
          webpush: {
            fcm_options: { link: url || "https://aleister-sxs.github.io/Registry/" },
          },
          data: { url: url || "https://aleister-sxs.github.io/Registry/", tag: "berserk-guild" },
        },
      }),
      muteHttpExceptions: true,
    });
  } catch(e) {}
}

function saveFcmToken(sheets, body) {
  const { memberId, captainKey, fcmToken } = body;
  const member = authMemberById(sheets, memberId, captainKey);
  updateRowById(sheets.members, member.id, { fcmToken });
  return ok({ saved: true });
}

// ── Email notification helpers ────────────────────────────────────
// Silently fails so email issues never break the main action.
function _notifyEmail(member, subject, body) {
  try {
    if (!member.email) return;
    GmailApp.sendEmail(member.email, "[SxS Berserk] " + subject, body + "\n\n---\nManage notification preferences: https://aleister-sxs.github.io/Registry/notifications.html", {
      from: "berserkguildmail@gmail.com",
      name: "Berserk Guild",
    });
  } catch(e) {}
}

function _getNotifPref(member, key) {
  try {
    const prefs = JSON.parse(member.notifPrefs || "{}");
    return prefs[key] !== false; // default on if unset
  } catch(e) { return true; }
}

// ── HTTP Handlers ─────────────────────────────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action || "";
    const sheets = getSheets();

    if (action === "getAll") {
      const allMembersRaw = sheetToObjects(sheets.members).filter(m => String(m.suspended).toUpperCase() !== "TRUE");
      const teams      = sheetToObjects(sheets.teams);
      const requests   = sheetToObjects(sheets.requests);
      const settingsRaw = sheetToObjects(sheets.settings);
      const settings   = {};
      settingsRaw.forEach(s => { settings[s.key] = s.value; });
      // Return own member's email/notifPrefs separately before stripping
      const reqMemberId = e.parameter.memberId;
      let ownMember = null;
      if (reqMemberId) {
        const raw = allMembersRaw.find(m => m.id === reqMemberId);
        if (raw) ownMember = { email: raw.email || "", notifPrefs: raw.notifPrefs || "{}" };
      }
      // Strip sensitive fields from public list
      const members = allMembersRaw;
      members.forEach(m => { delete m.captainKey; delete m.email; delete m.notifPrefs; delete m.fcmToken; });
      members.forEach(m => {
        m.teamIds = m.teamIds ? m.teamIds.split(",").filter(Boolean) : [];
      });
      teams.forEach(t => {
        t.composition = t.composition ? t.composition.split(",").filter(Boolean) : [];
      });
      // Include unread DM count and pending build suggestions for the requesting member
      let unreadDMs = 0;
      let pendingSuggestions = [];
      let teamAnnouncements = [];
      if (reqMemberId) {
        const allDMs = sheetToObjects(sheets.dms);
        unreadDMs = allDMs.filter(d => d.toId === reqMemberId && !d.readAt).length;
        const allSuggs = sheetToObjects(sheets.buildSuggestions);
        pendingSuggestions = allSuggs.filter(s => s.toId === reqMemberId && s.status === "pending");
        const allAnns = sheetToObjects(sheets.announcements);
        // Return the latest announcement per team
        const annMap = {};
        allAnns.forEach(a => { annMap[a.teamId] = a; });
        teamAnnouncements = Object.values(annMap);
      }
      return ok({ members, teams, requests, settings, unreadDMs, pendingSuggestions, teamAnnouncements, ownMember });
    }

    if (action === "adminGetBroadcasts") {
      if (e.parameter.adminPassword !== ADMIN_PASSWORD) return err("Invalid admin password.");
      const broadcasts = sheetToObjects(sheets.broadcasts);
      return ok({ broadcasts });
    }

    if (action === "getActiveBroadcast") {
      const broadcasts = sheetToObjects(sheets.broadcasts);
      const active = broadcasts.filter(b => String(b.active).toUpperCase() === "TRUE");
      return ok({ broadcast: active.length ? active[active.length - 1] : null });
    }

    if (action === "getMessages") {
      const { teamId, adminPassword, limit } = e.parameter;
      if (!teamId) return err("teamId required.");
      const isAdmin = adminPassword === ADMIN_PASSWORD;
      if (!isAdmin) {
        const teams = sheetToObjects(sheets.teams);
        if (!teams.find(t => t.id === teamId)) return err("Team not found.");
      }
      const messages = sheetToObjects(sheets.messages)
        .filter(m => m.teamId === teamId)
        .slice(-(isAdmin ? 200 : 100));
      return ok({ messages });
    }

    return err("Unknown GET action: " + action);
  } catch(ex) {
    return err(ex.message);
  }
}

function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action || "";
    const sheets = getSheets();

    switch (action) {
      case "registerMember":     return registerMember(sheets, body);
      case "login":              return login(sheets, body);
      case "loginMember":        return login(sheets, body);
      case "updateProfile":      return updateProfile(sheets, body);
      case "createTeam":         return createTeam(sheets, body);
      case "joinRequest":        return joinRequest(sheets, body);
      case "cancelRequest":      return cancelRequest(sheets, body);
      case "sendInvite":         return sendInvite(sheets, body);
      case "respondRequest":     return respondRequest(sheets, body);
      case "respondInvite":      return respondInvite(sheets, body);
      case "leaveTeam":          return leaveTeam(sheets, body);
      case "updateTeamLFC":      return updateTeamLFC(sheets, body);
      case "captainEditTeam":    return captainEditTeam(sheets, body);
      case "sendMessage":        return sendMessage(sheets, body);
      case "deleteMessage":      return deleteMessage(sheets, body);
      case "adminLogin":         return adminLogin(body);
      case "adminGetAll":        return adminGetAll(sheets, body);
      case "adminDeleteMember":  return adminDeleteMember(sheets, body);
      case "adminUpdateTeam":    return adminUpdateTeam(sheets, body);
      case "adminDeleteTeam":    return adminDeleteTeam(sheets, body);
      case "adminForceTeamStatus": return adminForceTeamStatus(sheets, body);
      case "adminSuspendMember": return adminSuspendMember(sheets, body);
      case "adminSetGuildMember": return adminSetGuildMember(sheets, body);
      case "adminResetKey":      return adminResetKey(sheets, body);
      case "adminSetBroadcast":  return adminSetBroadcast(sheets, body);
      case "adminUpdateBroadcast": return adminUpdateBroadcast(sheets, body);
      case "adminDeleteBroadcast": return adminDeleteBroadcast(sheets, body);
      case "adminDeleteMessage": return adminDeleteMessage(sheets, body);
      case "adminClearChat":     return adminClearChat(sheets, body);
      // FIX: frontend calls "adminDeleteDuplicates" — support both names
      case "adminDeleteDuplicates":
      case "adminDeleteDuplicateTeams": return adminDeleteDuplicateTeams(sheets, body);
      case "adminLookupKey":     return adminLookupKey(sheets, body);
      case "updateSettings":     return updateSettings(sheets, body);
      case "transferCaptaincy":  return transferCaptaincy(sheets, body);
      case "kickMember":         return kickMember(sheets, body);
      case "sendDM":             return sendDM(sheets, body);
      case "getDMs":             return getDMs(sheets, body);
      case "markDMRead":         return markDMRead(sheets, body);
      case "deleteDM":           return deleteDM(sheets, body);
      case "adminGetDMs":        return adminGetDMs(sheets, body);
      case "getInbox":              return getInbox(sheets, body);
      case "suggestBuild":          return suggestBuild(sheets, body);
      case "respondBuildSuggestion": return respondBuildSuggestion(sheets, body);
      case "setTeamAnnouncement":   return setTeamAnnouncement(sheets, body);
      case "updateNotifPrefs":      return updateNotifPrefs(sheets, body);
      case "saveFcmToken":          return saveFcmToken(sheets, body);
      default: return err("Unknown action: " + action);
    }
  } catch(ex) {
    return err(ex.message);
  }
}

// ── Member Actions ────────────────────────────────────────────────
function registerMember(sheets, body) {
  const { name, gamertag, tier, class: cls, power, level, bio, description,
          playstyle, discordId, discordName, timezone, languages, prefLanguage,
          lookingForTeam, lookingForCaptainRole, avatarUrl, email, guildMember } = body;

  if (!name || !gamertag) throw new Error("Name and Player ID are required.");
  if (String(gamertag).length !== 12) throw new Error("Player ID must be exactly 12 digits.");

  const members = sheetToObjects(sheets.members);
  if (members.find(m => String(m.gamertag) === String(gamertag))) {
    throw new Error("Player ID already registered.");
  }

  const id         = uid();
  const captainKey = uid() + uid();

  const member = {
    id, name, gamertag: String(gamertag),
    tier: tier || "", class: cls || "",
    power: power || "", level: level || "",
    bio: bio || "", description: description || "I'm a pretty cool person - ready to join in!",
    playstyle: playstyle || "",
    discordId: discordId || "", discordName: discordName || "",
    timezone: timezone || "", languages: languages || "", prefLanguage: prefLanguage || "",
    lookingForTeam: normBool(lookingForTeam),
    isCaptain: "FALSE", lookingForCaptainRole: normBool(lookingForCaptainRole),
    teamIds: "", captainKey,
    pvpBuild: "", avatarUrl: avatarUrl || "", pvpFantomon: "",
    joinedAt: now(), teamBuilds: "", suspended: "FALSE",
    email: email || "",
    notifPrefs: JSON.stringify({ invites: true, joinRequests: true, dms: true }),
    guildMember: normBool(guildMember !== undefined ? guildMember : true),
  };

  sheets.members.appendRow(buildRow(sheets.members, member));

  const settings = sheetToObjects(sheets.settings);
  if (!settings.find(s => s.key === "maxTeamSize"))      upsertSetting(sheets.settings, "maxTeamSize", "4");
  if (!settings.find(s => s.key === "maxMemberTeams"))   upsertSetting(sheets.settings, "maxMemberTeams", "3");
  if (!settings.find(s => s.key === "maxCaptainTeams"))  upsertSetting(sheets.settings, "maxCaptainTeams", "3");

  return ok({ member });
}

function login(sheets, body) {
  const { gamertag, captainKey } = body;
  if (!gamertag || !captainKey) throw new Error("Player ID and Secret Key required.");
  const m = authMember(sheets, gamertag, captainKey);
  return ok({ member: m });
}

function updateProfile(sheets, body) {
  const { memberId, captainKey, gamertag, ...updates } = body;

  const member = memberId
    ? authMemberById(sheets, memberId, captainKey)
    : authMember(sheets, gamertag, captainKey);

  const allowed = ["name","gamertag","tier","class","power","level","bio","description",
                   "playstyle","discordId","discordName","timezone","languages",
                   "prefLanguage","lookingForTeam","lookingForCaptainRole","avatarUrl","pvpFantomon",
                   "email","notifPrefs"];

  allowed.forEach(key => {
    if (updates[key] !== undefined) member[key] = updates[key];
  });

  if (updates.pvpBuild !== undefined) member.pvpBuild = updates.pvpBuild;
  if (updates.teamBuilds !== undefined) member.teamBuilds = updates.teamBuilds;

  updateRowById(sheets.members, member.id, member);
  return ok({ member });
}

// ── Notification Preferences ──────────────────────────────────────
function updateNotifPrefs(sheets, body) {
  const { memberId, captainKey, email, prefs } = body;
  const member = authMemberById(sheets, memberId, captainKey);
  if (email !== undefined) member.email = email.trim();
  if (prefs !== undefined) member.notifPrefs = JSON.stringify(prefs);
  updateRowById(sheets.members, member.id, member);
  return ok({});
}

// ── Team Actions ──────────────────────────────────────────────────
function createTeam(sheets, body) {
  const { gamertag, captainKey, memberId, name, description, composition,
          playstyle, minPower, minLevel, requiresDiscord, lookingForCaptain, prefLanguage } = body;

  const captain = memberId
    ? authMemberById(sheets, memberId, captainKey)
    : authMember(sheets, gamertag, captainKey);

  const settings = {};
  sheetToObjects(sheets.settings).forEach(s => { settings[s.key] = s.value; });
  const maxCaptainTeams = Number(settings.maxCaptainTeams) || 3;

  if (String(captain.guildMember).toUpperCase() !== "TRUE") {
    throw new Error("Only Berserk Guild members can create teams. Contact an admin to update your membership status.");
  }

  const myTeams = sheetToObjects(sheets.teams).filter(t => t.captainId === captain.id);
  if (myTeams.length >= maxCaptainTeams) throw new Error(`You can captain at most ${maxCaptainTeams} teams.`);

  const id = uid();
  const team = {
    id, name: name || "New Team",
    description: description || "",
    composition: Array.isArray(composition) ? composition.join(",") : (composition || ""),
    playstyle: playstyle || "",
    minPower: minPower || "", minLevel: minLevel || "",
    requiresDiscord: normBool(requiresDiscord),
    lookingForCaptain: normBool(lookingForCaptain),
    prefLanguage: prefLanguage || "",
    captainId: captain.id, captainName: captain.name,
    status: "open", memberCount: "1",
    formation: "", createdAt: now(),
  };

  sheets.teams.appendRow(buildRow(sheets.teams, team));

  captain.isCaptain = "TRUE";
  const existingTeamIds = captain.teamIds ? captain.teamIds.split(",").filter(Boolean) : [];
  existingTeamIds.push(id);
  captain.teamIds = existingTeamIds.join(",");
  updateRowById(sheets.members, captain.id, captain);

  return ok({ team });
}

function joinRequest(sheets, body) {
  const { gamertag, captainKey, teamId, memberId } = body;
  const member = memberId
    ? authMemberById(sheets, memberId, captainKey)
    : authMember(sheets, gamertag, captainKey);

  const teams = sheetToObjects(sheets.teams);
  const team  = teams.find(t => t.id === teamId);
  if (!team) throw new Error("Team not found.");
  if (team.status !== "open") throw new Error("This team is not accepting requests.");

  const settings = {};
  sheetToObjects(sheets.settings).forEach(s => { settings[s.key] = s.value; });
  const maxTeamSize = Number(settings.maxTeamSize) || 4;

  const members = sheetToObjects(sheets.members);
  const teamMembers = members.filter(m => (m.teamIds || "").split(",").filter(Boolean).includes(teamId));
  if (teamMembers.length >= maxTeamSize) throw new Error("Team is full.");

  const memberTeamIds = (member.teamIds || "").split(",").filter(Boolean);
  if (memberTeamIds.includes(teamId)) throw new Error("You are already in this team.");

  const reqs = sheetToObjects(sheets.requests);
  const dup  = reqs.find(r => r.type === "join" && r.teamId === teamId && r.fromId === member.id && r.status === "pending");
  if (dup) throw new Error("You already have a pending join request for this team. Please wait for the captain to respond.");

  const req = {
    id: uid(), type: "join", teamId, teamName: team.name,
    fromId: member.id, toId: team.captainId,
    status: "pending", createdAt: now(),
  };
  sheets.requests.appendRow(buildRow(sheets.requests, req));

  // Email + push notification to captain
  const captain = members.find(m => m.id === team.captainId);
  if (captain && _getNotifPref(captain, "joinRequests")) {
    const _joinSubj = "New join request for your team";
    const _joinBody = "Hi " + captain.name + ",\n\n" +
      member.name + " has requested to join your team \"" + team.name + "\".\n\n" +
      "Review the request: https://aleister-sxs.github.io/Registry/invites.html";
    _notifyEmail(captain, _joinSubj, _joinBody);
    _notifyPush(captain, _joinSubj, member.name + " wants to join \"" + team.name + "\".", "https://aleister-sxs.github.io/Registry/invites.html");
  }

  return ok({ request: req });
}

function cancelRequest(sheets, body) {
  const { memberId, captainKey, requestId } = body;
  const member = authMemberById(sheets, memberId, captainKey);
  const reqs   = sheetToObjects(sheets.requests);
  // Allow cancelling either a join request (fromId) or an invite sent by your team (captain)
  const req = reqs.find(r => r.id === requestId && (r.fromId === member.id || r.toId === member.id));
  if (!req) throw new Error("Request not found.");
  req.status = "cancelled";
  updateRowById(sheets.requests, requestId, req);
  return ok({});
}

function sendInvite(sheets, body) {
  const { gamertag, captainKey, memberId, toMemberId, teamId } = body;
  // Support both gamertag auth (legacy) and memberId auth (preferred)
  const captain = memberId
    ? authMemberById(sheets, memberId, captainKey)
    : authMember(sheets, gamertag, captainKey);
  const teams   = sheetToObjects(sheets.teams);

  // Use the specific teamId if provided, otherwise fall back to any team captained by this user
  let capTeam;
  if (teamId) {
    capTeam = teams.find(t => t.id === teamId && t.captainId === captain.id);
    if (!capTeam) throw new Error("Team not found or not yours.");
  } else {
    capTeam = teams.find(t => t.captainId === captain.id);
    if (!capTeam) throw new Error("You don't have a team to invite to.");
  }

  const members = sheetToObjects(sheets.members);
  const target  = members.find(m => m.id === toMemberId);
  if (!target) throw new Error("Member not found.");

  // Check team isn't over max size
  const settingsRaw = sheetToObjects(sheets.settings);
  const settingsMap = {};
  settingsRaw.forEach(s => { settingsMap[s.key] = s.value; });
  const maxSize = Number(settingsMap.maxTeamSize) || 4;
  const currentCount = members.filter(m => (m.teamIds||"").split(",").filter(Boolean).includes(capTeam.id)).length;
  if (currentCount >= maxSize) throw new Error("That team is already full.");

  const reqs = sheetToObjects(sheets.requests);
  const dup  = reqs.find(r => r.type === "invite" && r.teamId === capTeam.id && r.toId === toMemberId && r.status === "pending");
  if (dup) throw new Error("An invite is already pending for this member on this team.");

  const req = {
    id: uid(), type: "invite", teamId: capTeam.id, teamName: capTeam.name,
    fromId: captain.id, toId: toMemberId,
    status: "pending", createdAt: now(),
  };
  sheets.requests.appendRow(buildRow(sheets.requests, req));

  // Email + push notification to invite recipient
  if (_getNotifPref(target, "invites")) {
    const _invSubj = "You have a new team invite";
    const _invBody = "Hi " + target.name + ",\n\n" +
      captain.name + " has invited you to join the team \"" + capTeam.name + "\".\n\n" +
      "Log in to accept or decline: https://aleister-sxs.github.io/Registry/invites.html";
    _notifyEmail(target, _invSubj, _invBody);
    _notifyPush(target, _invSubj, captain.name + " invited you to join \"" + capTeam.name + "\".", "https://aleister-sxs.github.io/Registry/invites.html");
  }

  return ok({ request: req });
}

function respondRequest(sheets, body) {
  const { gamertag, captainKey, memberId, requestId, accept } = body;
  const captain = memberId
    ? authMemberById(sheets, memberId, captainKey)
    : authMember(sheets, gamertag, captainKey);

  const reqs = sheetToObjects(sheets.requests);
  const req  = reqs.find(r => r.id === requestId && r.toId === captain.id && r.type === "join");
  if (!req) throw new Error("Request not found.");

  req.status = accept ? "accepted" : "declined";
  updateRowById(sheets.requests, requestId, req);

  if (accept) {
    _addMemberToTeam(sheets, req.fromId, req.teamId);
  }

  // Email + push notification to the requester
  const members = sheetToObjects(sheets.members);
  const requester = members.find(m => m.id === req.fromId);
  if (requester && _getNotifPref(requester, "joinRequests")) {
    const _rSubj = accept ? "Your join request was accepted" : "Your join request was declined";
    const _rBody = "Hi " + requester.name + ",\n\n" +
      (accept
        ? "Great news! Your request to join \"" + req.teamName + "\" was accepted. Welcome aboard!"
        : "Your request to join \"" + req.teamName + "\" was declined by the captain.") +
      "\n\nView your teams: https://aleister-sxs.github.io/Registry/your-team.html";
    _notifyEmail(requester, _rSubj, _rBody);
    _notifyPush(requester, _rSubj,
      accept ? "Welcome to \"" + req.teamName + "\"!" : "Your request to join \"" + req.teamName + "\" was declined.",
      "https://aleister-sxs.github.io/Registry/your-team.html");
  }

  return ok({});
}

function respondInvite(sheets, body) {
  const { memberId, captainKey, requestId, decision } = body;
  const member = authMemberById(sheets, memberId, captainKey);

  const reqs = sheetToObjects(sheets.requests);
  const req  = reqs.find(r => r.id === requestId && r.toId === member.id && r.type === "invite");
  if (!req) throw new Error("Invite not found.");

  const accepted = decision === "accept" || decision === true || decision === "true";
  req.status = accepted ? "accepted" : "declined";
  updateRowById(sheets.requests, requestId, req);

  if (accepted) {
    _addMemberToTeam(sheets, member.id, req.teamId);
  }

  // Email + push notification to the captain who sent the invite
  const members = sheetToObjects(sheets.members);
  const invCaptain = members.find(m => m.id === req.fromId);
  if (invCaptain && _getNotifPref(invCaptain, "invites")) {
    const _iSubj = accepted ? "Your invite was accepted" : "Your invite was declined";
    const _iBody = "Hi " + invCaptain.name + ",\n\n" +
      member.name + " has " + (accepted ? "accepted" : "declined") +
      " your invite to join \"" + req.teamName + "\".\n\n" +
      "View your team: https://aleister-sxs.github.io/Registry/your-team.html";
    _notifyEmail(invCaptain, _iSubj, _iBody);
    _notifyPush(invCaptain, _iSubj,
      member.name + " has " + (accepted ? "accepted" : "declined") + " your invite to \"" + req.teamName + "\".",
      "https://aleister-sxs.github.io/Registry/your-team.html");
  }

  return ok({});
}

function _addMemberToTeam(sheets, memberId, teamId) {
  const members = sheetToObjects(sheets.members);
  const m = members.find(x => x.id === memberId);
  if (!m) return;

  const teamIds = (m.teamIds || "").split(",").filter(Boolean);
  if (!teamIds.includes(teamId)) {
    teamIds.push(teamId);
    m.teamIds = teamIds.join(",");
    updateRowById(sheets.members, memberId, m);
  }

  // Cancel all pending requests and invites involving this member and this team
  const requests = sheetToObjects(sheets.requests);
  requests.filter(r =>
    r.status === "pending" &&
    r.teamId === teamId &&
    (r.fromId === memberId || r.toId === memberId)
  ).forEach(r => {
    r.status = "cancelled";
    updateRowById(sheets.requests, r.id, r);
  });

  const teams = sheetToObjects(sheets.teams);
  const team  = teams.find(t => t.id === teamId);
  if (team) {
    const settings = {};
    sheetToObjects(sheets.settings).forEach(s => { settings[s.key] = s.value; });
    const maxSize = Number(settings.maxTeamSize) || 4;
    const newMembers = members.filter(mb => {
      const ids = (mb.teamIds || "").split(",").filter(Boolean);
      return ids.includes(teamId) || mb.id === memberId;
    });
    team.memberCount = String(newMembers.length);
    if (newMembers.length >= maxSize) team.status = "full";
    updateRowById(sheets.teams, teamId, team);
  }
}

function leaveTeam(sheets, body) {
  const { memberId, captainKey, teamId } = body;
  const member = authMemberById(sheets, memberId, captainKey);

  // Remove teamId from member's team list
  const teamIds = (member.teamIds || "").split(",").filter(Boolean);
  member.teamIds = teamIds.filter(id => id !== teamId).join(",");

  // If member is no longer captaining any team, clear isCaptain flag
  const allTeams = sheetToObjects(sheets.teams);
  const stillCaptaining = allTeams.some(t => t.id !== teamId && t.captainId === member.id);
  if (!stillCaptaining) {
    member.isCaptain = "FALSE";
  }

  updateRowById(sheets.members, member.id, member);

  // Update team: decrement memberCount and reopen if was full
  const team = allTeams.find(t => t.id === teamId);
  if (team) {
    // Recalculate memberCount from actual membership (member row already updated above)
    const allMembers = sheetToObjects(sheets.members);
    const remaining = allMembers.filter(m =>
      m.id !== member.id &&
      (m.teamIds || "").split(",").filter(Boolean).includes(teamId)
    ).length;
    team.memberCount = String(remaining);
    if (team.status === "full") team.status = "open";
    updateRowById(sheets.teams, teamId, team);
  }

  return ok({});
}

function updateTeamLFC(sheets, body) {
  const { memberId, captainKey, teamId, lookingForCaptain } = body;
  const captain = authMemberById(sheets, memberId, captainKey);
  const teams   = sheetToObjects(sheets.teams);
  const team    = teams.find(t => t.id === teamId && t.captainId === captain.id);
  if (!team) throw new Error("Team not found or not your team.");
  // FIX: use normBool so "FALSE" string doesn't evaluate as truthy
  team.lookingForCaptain = normBool(lookingForCaptain);
  updateRowById(sheets.teams, teamId, team);
  return ok({ team });
}

function captainEditTeam(sheets, body) {
  const { memberId, captainKey, teamId, name, description, composition,
          playstyle, minPower, minLevel, requiresDiscord, prefLanguage,
          lookingForCaptain, formation } = body;

  const captain = authMemberById(sheets, memberId, captainKey);
  const teams   = sheetToObjects(sheets.teams);
  const team    = teams.find(t => t.id === teamId && t.captainId === captain.id);
  if (!team) throw new Error("Team not found or not your team.");

  if (name !== undefined)             team.name             = name;
  if (description !== undefined)      team.description      = description;
  if (composition !== undefined)      team.composition      = Array.isArray(composition) ? composition.join(",") : composition;
  if (playstyle !== undefined)        team.playstyle        = playstyle;
  if (minPower !== undefined)         team.minPower         = minPower;
  if (minLevel !== undefined)         team.minLevel         = minLevel;
  // FIX: use normBool so "FALSE" string doesn't evaluate as truthy
  if (requiresDiscord !== undefined)  team.requiresDiscord  = normBool(requiresDiscord);
  if (prefLanguage !== undefined)     team.prefLanguage     = prefLanguage;
  if (lookingForCaptain !== undefined) team.lookingForCaptain = normBool(lookingForCaptain);
  if (formation !== undefined)        team.formation        = JSON.stringify(formation);

  updateRowById(sheets.teams, teamId, team);
  return ok({ team });
}

// ── Chat Actions ──────────────────────────────────────────────────
function sendMessage(sheets, body) {
  const { memberId, captainKey, teamId, text } = body;
  const member = authMemberById(sheets, memberId, captainKey);
  if (!text || !text.trim()) throw new Error("Message cannot be empty.");

  const msg = {
    id: uid(), teamId,
    memberId: member.id, memberName: member.name,
    avatarUrl: member.avatarUrl || "",
    text: text.trim().substring(0, 500),
    sentAt: now(),
  };
  sheets.messages.appendRow(buildRow(sheets.messages, msg));
  return ok({ message: msg });
}

function deleteMessage(sheets, body) {
  const { memberId, captainKey, messageId } = body;
  const member   = authMemberById(sheets, memberId, captainKey);
  const messages = sheetToObjects(sheets.messages);
  // Allow captain to delete any message in their team's chat
  const teams    = sheetToObjects(sheets.teams);
  const msg      = messages.find(m => m.id === messageId);
  if (!msg) throw new Error("Message not found.");
  const isMine   = msg.memberId === member.id;
  const isCap    = teams.some(t => t.id === msg.teamId && t.captainId === member.id);
  if (!isMine && !isCap) throw new Error("Not authorised to delete this message.");
  deleteRowById(sheets.messages, messageId);
  return ok({});
}

// ── Admin Actions ─────────────────────────────────────────────────
function adminLogin(body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  return ok({});
}

function adminGetAll(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  const members  = sheetToObjects(sheets.members);
  const teams    = sheetToObjects(sheets.teams);
  const requests = sheetToObjects(sheets.requests);
  const settings = {};
  sheetToObjects(sheets.settings).forEach(s => { settings[s.key] = s.value; });
  return ok({ members, teams, requests, settings });
}

function adminUpdateMember(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  const members = sheetToObjects(sheets.members);
  const m = members.find(x => x.id === body.memberId);
  if (!m) throw new Error("Member not found.");
  const allowed = ["name","tier","class","power","level","playstyle","timezone","languages","prefLanguage","isCaptain","lookingForTeam","suspended"];
  allowed.forEach(k => { if (body[k] !== undefined) m[k] = body[k]; });
  updateRowById(sheets.members, m.id, m);
  return ok({ member: m });
}

function adminDeleteMember(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  const { memberId } = body;
  const members = sheetToObjects(sheets.members);
  const m = members.find(x => x.id === memberId);
  if (!m) throw new Error("Member not found.");
  // Cancel all pending requests involving this member
  const requests = sheetToObjects(sheets.requests);
  requests.filter(r => (r.fromId === memberId || r.toId === memberId) && r.status === "pending")
    .forEach(r => { r.status = "cancelled"; updateRowById(sheets.requests, r.id, r); });
  // Delete the member row
  deleteRowById(sheets.members, memberId);
  return ok({});
}

function adminUpdateTeam(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  const teams = sheetToObjects(sheets.teams);
  const t = teams.find(x => x.id === body.teamId);
  if (!t) throw new Error("Team not found.");
  const allowed = ["name","description","status","playstyle","minPower","minLevel","prefLanguage","lookingForCaptain","requiresDiscord"];
  allowed.forEach(k => { if (body[k] !== undefined) t[k] = body[k]; });
  updateRowById(sheets.teams, t.id, t);
  return ok({ team: t });
}

function adminDeleteTeam(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  const teamId = body.teamId;
  // Cancel all pending requests for this team
  const requests = sheetToObjects(sheets.requests);
  requests.filter(r => r.teamId === teamId && r.status === "pending").forEach(r => {
    r.status = "cancelled";
    updateRowById(sheets.requests, r.id, r);
  });
  // Remove teamId from all member teamIds
  const members = sheetToObjects(sheets.members);
  members.forEach(m => {
    const ids = (m.teamIds || "").split(",").filter(Boolean);
    if (ids.includes(teamId)) {
      m.teamIds = ids.filter(id => id !== teamId).join(",");
      updateRowById(sheets.members, m.id, m);
    }
  });
  deleteRowById(sheets.teams, teamId);
  return ok({});
}

function adminForceTeamStatus(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  const teams = sheetToObjects(sheets.teams);
  const t = teams.find(x => x.id === body.teamId);
  if (!t) throw new Error("Team not found.");
  t.status = body.status;
  updateRowById(sheets.teams, t.id, t);
  return ok({ team: t });
}

function adminSuspendMember(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  const members = sheetToObjects(sheets.members);
  const m = members.find(x => x.id === body.memberId);
  if (!m) throw new Error("Member not found.");
  // FIX: frontend sends "suspended" field; accept either name
  const suspendVal = body.suspended !== undefined ? body.suspended : body.suspend;
  m.suspended = normBool(suspendVal);
  updateRowById(sheets.members, m.id, m);
  return ok({});
}

function adminSetGuildMember(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  const members = sheetToObjects(sheets.members);
  const m = members.find(x => x.id === body.memberId);
  if (!m) throw new Error("Member not found.");
  m.guildMember = normBool(body.guildMember);
  // If demoting to guest, clear captain role and isCaptain on their teams
  if (m.guildMember === "FALSE") {
    const teams = sheetToObjects(sheets.teams);
    const captainedTeams = teams.filter(t => t.captainId === m.id);
    if (captainedTeams.length) {
      throw new Error("Cannot set to Guest while this member is a captain. Transfer captaincy first.");
    }
    m.isCaptain = "FALSE";
    m.lookingForCaptainRole = "FALSE";
  }
  updateRowById(sheets.members, m.id, m);
  return ok({ guildMember: m.guildMember });
}

function adminResetKey(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  const members = sheetToObjects(sheets.members);
  const m = members.find(x => String(x.gamertag) === String(body.gamertag));
  if (!m) throw new Error("Member not found.");
  m.captainKey = uid() + uid();
  updateRowById(sheets.members, m.id, m);
  // FIX: return newKey and gamertag to match what the frontend reads
  return ok({ newKey: m.captainKey, gamertag: m.gamertag });
}

// FIX: new action — look up a member's key without resetting it
function adminLookupKey(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  const members = sheetToObjects(sheets.members);
  const m = members.find(x => String(x.gamertag) === String(body.gamertag));
  if (!m) throw new Error("Member not found.");
  return ok({ captainKey: m.captainKey, gamertag: m.gamertag });
}

// FIX: new action — update registry settings
function updateSettings(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  const { maxTeamSize, maxMemberTeams, maxCaptainTeams } = body;
  if (maxTeamSize   !== undefined) upsertSetting(sheets.settings, "maxTeamSize",    String(maxTeamSize));
  if (maxMemberTeams  !== undefined) upsertSetting(sheets.settings, "maxMemberTeams", String(maxMemberTeams));
  if (maxCaptainTeams !== undefined) upsertSetting(sheets.settings, "maxCaptainTeams",String(maxCaptainTeams));
  return ok({});
}

function adminDeleteMessage(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  deleteRowById(sheets.messages, body.messageId);
  return ok({});
}

function adminClearChat(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  const { teamId } = body;
  const messages = sheetToObjects(sheets.messages);
  messages.filter(m => m.teamId === teamId).forEach(m => deleteRowById(sheets.messages, m.id));
  return ok({});
}

function adminDeleteDuplicateTeams(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  const teams = sheetToObjects(sheets.teams);
  const seen  = {};
  const toDelete = [];
  teams.forEach(t => {
    const key = t.captainId + "|" + t.name;
    if (seen[key]) { toDelete.push(t.id); } else { seen[key] = true; }
  });
  toDelete.forEach(id => deleteRowById(sheets.teams, id));
  // FIX: return both count and deleted array to match what frontend reads (res.count and res.deleted)
  return ok({ count: toDelete.length, deleted: toDelete });
}

// ── Broadcast Actions ─────────────────────────────────────────────
function adminSetBroadcast(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  const broadcastId = uid();
  const broadcast = {
    id: broadcastId, message: body.message || "",
    active: normBool(body.active),
    sentAt: now(),
  };
  sheets.broadcasts.appendRow(buildRow(sheets.broadcasts, broadcast));
  return ok({ broadcastId });
}

function adminUpdateBroadcast(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  const broadcasts = sheetToObjects(sheets.broadcasts);
  const b = broadcasts.find(x => x.id === body.broadcastId);
  if (!b) throw new Error("Broadcast not found.");
  if (body.message !== undefined) b.message = body.message;
  if (body.active !== undefined)  b.active  = normBool(body.active);
  updateRowById(sheets.broadcasts, b.id, b);
  return ok({});
}

function adminDeleteBroadcast(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  deleteRowById(sheets.broadcasts, body.broadcastId);
  return ok({});
}

function transferCaptaincy(sheets, body) {
  const { memberId, captainKey, teamId, newCaptainId } = body;
  const captain = authMemberById(sheets, memberId, captainKey);
  const teams = sheetToObjects(sheets.teams);
  const team = teams.find(t => t.id === teamId && t.captainId === captain.id);
  if (!team) throw new Error("Team not found or you are not the captain.");
  const members = sheetToObjects(sheets.members);
  const newCap = members.find(m => m.id === newCaptainId);
  if (!newCap) throw new Error("New captain not found.");
  if (String(newCap.guildMember).toUpperCase() !== "TRUE") {
    throw new Error("Only Berserk Guild members can captain a team.");
  }
  team.captainId = newCaptainId;
  team.captainName = newCap.name;
  updateRowById(sheets.teams, teamId, team);
  const otherTeams = teams.filter(t => t.id !== teamId && t.captainId === captain.id);
  if (!otherTeams.length) {
    captain.isCaptain = "FALSE";
    updateRowById(sheets.members, captain.id, captain);
  }
  newCap.isCaptain = "TRUE";
  updateRowById(sheets.members, newCaptainId, newCap);
  return ok({ team });
}

function kickMember(sheets, body) {
  const { memberId, captainKey, teamId, targetId } = body;
  const captain = authMemberById(sheets, memberId, captainKey);
  const teams = sheetToObjects(sheets.teams);
  const team = teams.find(t => t.id === teamId && t.captainId === captain.id);
  if (!team) throw new Error("Team not found or you are not the captain.");
  if (targetId === captain.id) throw new Error("You cannot kick yourself. Use Leave Team instead.");
  const members = sheetToObjects(sheets.members);
  const target = members.find(m => m.id === targetId);
  if (!target) throw new Error("Member not found.");
  const ids = (target.teamIds || "").split(",").filter(Boolean);
  target.teamIds = ids.filter(id => id !== teamId).join(",");
  updateRowById(sheets.members, targetId, target);
  const newCount = members.filter(m => m.id !== targetId &&
    (m.teamIds || "").split(",").filter(Boolean).includes(teamId)).length;
  team.memberCount = String(newCount);
  if (team.status === "full") team.status = "open";
  updateRowById(sheets.teams, teamId, team);
  return ok({});
}

// ── Direct Message Actions ────────────────────────────────────────
function sendDM(sheets, body) {
  const { memberId, captainKey, toMemberId, text } = body;
  const sender = authMemberById(sheets, memberId, captainKey);
  if (!text || !text.trim()) throw new Error("Message cannot be empty.");
  if (text.trim().length > 500) throw new Error("Message cannot exceed 500 characters.");

  const members = sheetToObjects(sheets.members);
  const target  = members.find(m => m.id === toMemberId);
  if (!target) throw new Error("Member not found.");
  if (toMemberId === memberId) throw new Error("You cannot message yourself.");

  const dm = {
    id: uid(),
    fromId: sender.id, fromName: sender.name,
    toId: target.id,   toName: target.name,
    text: text.trim().substring(0, 500),
    sentAt: now(), readAt: "",
  };
  sheets.dms.appendRow(buildRow(sheets.dms, dm));

  // Email + push notification to DM recipient (email has 15-min cooldown per recipient)
  if (_getNotifPref(target, "dms")) {
    const _dmSubj = "New direct message from " + sender.name;
    const _dmBody = "Hi " + target.name + ",\n\n" +
      "You have a new direct message from " + sender.name + ".\n\n" +
      "Reply here: https://aleister-sxs.github.io/Registry/messages.html";
    const _cooldownKey = "dm_email_" + target.id;
    const _cache = CacheService.getScriptCache();
    if (!_cache.get(_cooldownKey)) {
      _notifyEmail(target, _dmSubj, _dmBody);
      _cache.put(_cooldownKey, "1", 900); // 900 seconds = 15 minutes
    }
    _notifyPush(target, _dmSubj, "You have a new direct message from " + sender.name + ".", "https://aleister-sxs.github.io/Registry/messages.html");
  }

  return ok({ dm });
}

function getDMs(sheets, body) {
  const { memberId, captainKey, withMemberId } = body;
  const member = authMemberById(sheets, memberId, captainKey);
  if (!withMemberId) throw new Error("withMemberId required.");

  const allDMs = sheetToObjects(sheets.dms);
  const thread = allDMs.filter(d =>
    (d.fromId === member.id && d.toId === withMemberId) ||
    (d.fromId === withMemberId && d.toId === member.id)
  ).sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));

  // Mark unread messages as read
  thread.filter(d => d.toId === member.id && !d.readAt).forEach(d => {
    d.readAt = now();
    updateRowById(sheets.dms, d.id, d);
  });

  return ok({ dms: thread });
}

function markDMRead(sheets, body) {
  const { memberId, captainKey, withMemberId } = body;
  const member = authMemberById(sheets, memberId, captainKey);
  const allDMs = sheetToObjects(sheets.dms);
  allDMs.filter(d => d.toId === member.id && d.fromId === withMemberId && !d.readAt)
    .forEach(d => { d.readAt = now(); updateRowById(sheets.dms, d.id, d); });
  return ok({});
}

function deleteDM(sheets, body) {
  const { memberId, captainKey, dmId } = body;
  const member = authMemberById(sheets, memberId, captainKey);
  const allDMs = sheetToObjects(sheets.dms);
  const dm = allDMs.find(d => d.id === dmId && d.fromId === member.id);
  if (!dm) throw new Error("Message not found or not yours.");
  deleteRowById(sheets.dms, dmId);
  return ok({});
}

function adminGetDMs(sheets, body) {
  if (body.adminPassword !== ADMIN_PASSWORD) throw new Error("Invalid admin password.");
  const { memberId } = body;
  const allDMs = sheetToObjects(sheets.dms);
  if (memberId) {
    // Return all DMs involving this member, grouped into threads
    const threads = {};
    allDMs.filter(d => d.fromId === memberId || d.toId === memberId)
      .sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt))
      .forEach(d => {
        const otherId   = d.fromId === memberId ? d.toId   : d.fromId;
        const otherName = d.fromId === memberId ? d.toName : d.fromName;
        if (!threads[otherId]) threads[otherId] = { otherId, otherName, messages: [] };
        threads[otherId].messages.push(d);
      });
    return ok({ threads: Object.values(threads) });
  }
  // Return summary: all members who have sent or received DMs
  const memberIds = new Set();
  allDMs.forEach(d => { memberIds.add(d.fromId); memberIds.add(d.toId); });
  const members = sheetToObjects(sheets.members);
  const summary = Array.from(memberIds).map(id => {
    const m = members.find(x => x.id === id);
    const count = allDMs.filter(d => d.fromId === id || d.toId === id).length;
    return { id, name: m?.name || "Unknown", gamertag: m?.gamertag || "", count };
  }).sort((a, b) => b.count - a.count);
  return ok({ summary });
}

function getInbox(sheets, body) {
  const { memberId, captainKey } = body;
  const member = authMemberById(sheets, memberId, captainKey);
  const allDMs = sheetToObjects(sheets.dms);

  // Find all unique conversation partners
  const partnerMap = {};
  allDMs.filter(d => d.fromId === memberId || d.toId === memberId)
    .sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt))
    .forEach(d => {
      const otherId   = d.fromId === memberId ? d.toId   : d.fromId;
      const otherName = d.fromId === memberId ? d.toName : d.fromName;
      if (!partnerMap[otherId]) {
        partnerMap[otherId] = { withId: otherId, withName: otherName, lastText: "", lastTime: "", unread: 0 };
      }
      partnerMap[otherId].lastText = d.text.substring(0, 60) + (d.text.length > 60 ? "…" : "");
      partnerMap[otherId].lastTime = d.sentAt;
      if (d.toId === memberId && !d.readAt) partnerMap[otherId].unread++;
    });

  // Sort by most recent message
  const convos = Object.values(partnerMap).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
  return ok({ convos });
}

// ── Build Suggestion Actions ──────────────────────────────────────

// Submit a build suggestion from one team member to another.
// Either a captain or a regular member can suggest; both send the same request.
// Body: { memberId, captainKey, teamId, toId, slotType, slotIndex, skillId, reason }
function suggestBuild(sheets, body) {
  const { memberId, captainKey, teamId, toId, slotType, slotIndex, skillId, reason } = body;
  const from = authMemberById(sheets, memberId, captainKey);

  if (!teamId || !toId || !slotType || slotIndex === undefined || !skillId) {
    throw new Error("teamId, toId, slotType, slotIndex, and skillId are required.");
  }
  if (!["technique","charm"].includes(slotType)) throw new Error("slotType must be 'technique' or 'charm'.");
  const idx = Number(slotIndex);
  if (isNaN(idx) || idx < 0 || idx > 3) throw new Error("slotIndex must be 0–3.");
  if (from.id === toId) throw new Error("You cannot suggest a build to yourself.");

  // Verify both members are in this team
  const members = sheetToObjects(sheets.members);
  const target  = members.find(m => m.id === toId);
  if (!target) throw new Error("Target member not found.");
  const teamIds = (target.teamIds || "").split(",").filter(Boolean);
  if (!teamIds.includes(teamId)) throw new Error("Target member is not in this team.");
  const fromTeamIds = (from.teamIds || "").split(",").filter(Boolean);
  if (!fromTeamIds.includes(teamId)) throw new Error("You are not in this team.");

  // Prevent duplicate pending suggestions for the same slot from the same person
  const existing = sheetToObjects(sheets.buildSuggestions);
  const dup = existing.find(s =>
    s.fromId === from.id && s.toId === toId &&
    s.teamId === teamId && s.slotType === slotType &&
    String(s.slotIndex) === String(idx) && s.status === "pending"
  );
  if (dup) throw new Error("You already have a pending suggestion for this slot.");

  const sugg = {
    id: uid(), teamId,
    fromId: from.id, fromName: from.name,
    toId, slotType, slotIndex: String(idx),
    skillId, reason: (reason || "").substring(0, 200),
    status: "pending", createdAt: now(),
  };
  sheets.buildSuggestions.appendRow(buildRow(sheets.buildSuggestions, sugg));
  return ok({ suggestion: sugg });
}

// Accept or dismiss a build suggestion.
// If accepted, updates the target member's teamBuilds for the given team.
// Body: { memberId, captainKey, suggestionId, decision } — decision: "accept" | "dismiss"
function respondBuildSuggestion(sheets, body) {
  const { memberId, captainKey, suggestionId, decision } = body;
  const member = authMemberById(sheets, memberId, captainKey);

  const suggs = sheetToObjects(sheets.buildSuggestions);
  const sugg  = suggs.find(s => s.id === suggestionId && s.toId === member.id);
  if (!sugg) throw new Error("Suggestion not found.");
  if (sugg.status !== "pending") throw new Error("Suggestion already resolved.");

  const accepted = decision === "accept";
  sugg.status = accepted ? "accepted" : "dismissed";
  updateRowById(sheets.buildSuggestions, suggestionId, sugg);

  if (accepted) {
    // Load member's teamBuilds, update the specified slot, save back
    const members = sheetToObjects(sheets.members);
    const m = members.find(x => x.id === member.id);
    if (!m) throw new Error("Member not found.");
    let teamBuilds = {};
    try { teamBuilds = m.teamBuilds ? JSON.parse(m.teamBuilds) : {}; } catch(e) { teamBuilds = {}; }
    if (!teamBuilds[sugg.teamId]) {
      teamBuilds[sugg.teamId] = { techniques: [], charms: [], fantomon: null };
    }
    const build = teamBuilds[sugg.teamId];
    const arr = sugg.slotType === "technique"
      ? (Array.isArray(build.techniques) ? [...build.techniques] : [])
      : (Array.isArray(build.charms)     ? [...build.charms]     : []);
    // Pad to 4 elements
    while (arr.length < 4) arr.push(null);
    arr[Number(sugg.slotIndex)] = sugg.skillId;
    if (sugg.slotType === "technique") build.techniques = arr;
    else build.charms = arr;
    m.teamBuilds = JSON.stringify(teamBuilds);
    updateRowById(sheets.members, m.id, m);
  }

  return ok({ status: sugg.status });
}

// Captain sets or updates the team announcement (one pinned message per team).
// Body: { memberId, captainKey, teamId, message }
function setTeamAnnouncement(sheets, body) {
  const { memberId, captainKey, teamId, message } = body;
  const captain = authMemberById(sheets, memberId, captainKey);

  const teams = sheetToObjects(sheets.teams);
  const team  = teams.find(t => t.id === teamId && t.captainId === captain.id);
  if (!team) throw new Error("Team not found or you are not the captain.");

  const anns = sheetToObjects(sheets.announcements);
  const existing = anns.find(a => a.teamId === teamId);
  const text = (message || "").substring(0, 300);

  if (existing) {
    existing.message   = text;
    existing.updatedAt = now();
    updateRowById(sheets.announcements, existing.id, existing);
    return ok({ announcement: existing });
  }

  const ann = { id: uid(), teamId, captainId: captain.id, message: text, updatedAt: now() };
  sheets.announcements.appendRow(buildRow(sheets.announcements, ann));
  return ok({ announcement: ann });
}

// ── Scheduled maintenance ─────────────────────────────────────────
// Deletes resolved (non-pending) requests older than CLEANUP_DAYS.
// Run setupCleanupTrigger() once from the Apps Script editor to install
// the daily time-based trigger — you only need to do this once.
const CLEANUP_DAYS = 30;

function cleanupOldRequests() {
  const sheets  = getSheets();
  const cutoff  = new Date(Date.now() - CLEANUP_DAYS * 24 * 60 * 60 * 1000);
  const requests = sheetToObjects(sheets.requests);
  let deleted = 0;
  requests.forEach(r => {
    if (r.status === "pending") return; // never delete pending requests
    const ts = new Date(r.createdAt);
    if (!isNaN(ts) && ts < cutoff) {
      deleteRowById(sheets.requests, r.id);
      deleted++;
    }
  });
  Logger.log("cleanupOldRequests: deleted " + deleted + " old resolved requests.");
  return deleted;
}

// Run this function ONCE from the Apps Script editor (Run > setupCleanupTrigger)
// to install the daily trigger. Re-running it will replace the existing trigger
// rather than create a duplicate.
function setupCleanupTrigger() {
  // Remove any existing triggers for cleanupOldRequests to avoid duplicates.
  // Run this ONCE from the Apps Script editor to install the daily trigger.
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === "cleanupOldRequests")
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("cleanupOldRequests")
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();
  Logger.log("cleanupOldRequests trigger installed.");
}
