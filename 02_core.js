'use strict';
/* ===== Core utilities ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p = 'id') => p + Math.random().toString(36).slice(2, 9);
const clone = o => JSON.parse(JSON.stringify(o));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmtT = s => { s = Math.round(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;

const LS = {
  get(k, d) { try { const v = localStorage.getItem('dbl.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('dbl.' + k, JSON.stringify(v)); return true; } catch (e) { toast('Could not save to browser storage (' + (e.name || 'error') + '). Your latest change is not persisted.', 'error'); return false; } }
};
const DB = {
  settings: LS.get('settings', { theme: 'dark', editor: false, name: 'Student' }),
  profile: LS.get('profile', {
    name: 'Student Name',
    regNo: '23BCE0001',
    dept: 'Computer Science and Engineering',
    yearSem: '3rd Year / 5th Sem',
    course: 'Database Management Systems Lab (CS2051)',
    avatar: ''
  }),
  progress: LS.get('progress', {}),      // topicId -> 'ip' | 'dn'
  attempts: LS.get('attempts', []),      // quiz attempts
  pstats: LS.get('pstats', {}),          // practice qid -> {n, ok, times:[], last}
  videos: LS.get('videos', []),
  vdone: LS.get('vdone', {}),            // videoId -> true (completed)
  resources: LS.get('resources', []),
  cq: LS.get('cq', []),                  // competitive questions
  extras: LS.get('extras', {}),          // topicId -> {notes}
  tagg: LS.get('tagg', {}),              // topicId -> {n, ok, t} aggregate of all answers
  save(k) { return LS.set(k, DB[k]); }
};

/* IndexedDB: 'img' = topic diagram images, 'contrib' = contributor records (with photos) */
const IDB = {
  db: null,
  open() {
    if (IDB.db) return Promise.resolve(IDB.db);
    return new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('IndexedDB is not available in this browser.'));
      let r; try { r = indexedDB.open('dbl-images', 2); } catch (e) { return rej(e); }
      r.onupgradeneeded = () => {
        const d = r.result;   /* v1 -> v2 keeps the existing 'img' store and its data untouched */
        if (!d.objectStoreNames.contains('img')) d.createObjectStore('img', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('contrib')) d.createObjectStore('contrib', { keyPath: 'id' });
      };
      r.onsuccess = () => { IDB.db = r.result; IDB.db.onversionchange = () => { IDB.db.close(); IDB.db = null; }; res(r.result); };
      r.onblocked = () => rej(new Error('Image storage is being upgraded but another EER Lab tab is still open. Close the other tabs and reload.'));
      r.onerror = () => rej(r.error || new Error('Could not open image storage.'));
    });
  },
  async tx(mode, fn, store = 'img') {
    const db = await IDB.open();
    return new Promise((res, rej) => {
      const t = db.transaction(store, mode); const st = t.objectStore(store); const rq = fn(st);
      t.oncomplete = () => res(rq && rq.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('Storage quota exceeded or write blocked.'));
    });
  },
  all(store = 'img') { return IDB.tx('readonly', s => s.getAll(), store).then(a => (a || []).sort((x, y) => (x.order ?? 0) - (y.order ?? 0))); },
  put(o, store = 'img') { return IDB.tx('readwrite', s => s.put(o), store); },
  del(id, store = 'img') { return IDB.tx('readwrite', s => s.delete(id), store); }
};

/* Icons */
const IC = {
  home: '<path d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  viz: '<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="19" r="2.5"/><path d="M7 7.5 11 17M17 7.5 13 17M7.5 6h9"/>',
  import: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 19h16"/>',
  learn: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  ex: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
  prac: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>',
  team: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 19c0-3.5 3.5-5 6.5-5s6.5 1.5 6.5 5"/><circle cx="17" cy="8" r="2.5"/><path d="M16 14.5c2.5.5 5 1.8 5 4.5"/>',
  video: '<rect x="2" y="4" width="15" height="16" rx="2"/><path d="m17 9 5-3v12l-5-3z"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>',
  prog: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>',
  admin: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', play: '<path d="M7 4l13 8-13 8z"/>',
  check: '<path d="m5 12 5 5 9-10"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
};
const ico = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;

/* Toast + modal */
function toast(msg, kind = 'info', ms = 4200) {
  let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = msg; box.appendChild(t);
  setTimeout(() => t.remove(), ms);
}
function openModal(html, { wide = false, onClose } = {}) {
  closeModal();
  const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal';
  bg.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  bg.addEventListener('mousedown', e => { if (e.target === bg) closeModal(); });
  bg._onClose = onClose; document.body.appendChild(bg);
  const f = $('input,select,textarea,button', bg.firstChild); if (f && !f.dataset.act) f.focus();
  return bg.firstChild;
}
function closeModal() { const m = $('#modal'); if (m) { if (m._onClose) m._onClose(); m.remove(); } }
function confirmBox(msg, okLabel = 'Confirm', danger = true) {
  return new Promise(res => {
    openModal(`<h3>Please confirm</h3><p>${esc(msg)}</p><div class="row" style="justify-content:flex-end"><button class="btn" id="cf-no">Cancel</button><button class="btn ${danger ? 'danger' : 'pri'}" id="cf-yes">${esc(okLabel)}</button></div>`, { onClose: () => res(false) });
    $('#cf-no').onclick = () => { res(false); closeModal(); };
    $('#cf-yes').onclick = () => { const m = $('#modal'); m._onClose = null; closeModal(); res(true); };
  });
}
function promptBox(title, label, value = '') {
  return new Promise(res => {
    openModal(`<h3>${esc(title)}</h3><label class="f">${esc(label)}<input id="pb-in" value="${esc(value)}"></label><div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" id="pb-no">Cancel</button><button class="btn pri" id="pb-yes">OK</button></div>`, { onClose: () => res(null) });
    const done = () => { const v = $('#pb-in').value.trim(); const m = $('#modal'); m._onClose = null; closeModal(); res(v || null); };
    $('#pb-no').onclick = () => closeModal(); $('#pb-yes').onclick = done; $('#pb-in').onkeydown = e => { if (e.key === 'Enter') done(); };
  });
}

/* Action delegation */
const ACT = {}, INP = {};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = ACT[el.dataset.act]; if (fn) { if (el.tagName === 'A' && !el.getAttribute('href')) e.preventDefault(); try { fn(el, e); } catch (err) { console.error(err); toast('Something went wrong: ' + err.message, 'error'); } }
});
document.addEventListener('change', e => { const el = e.target.closest('[data-chg]'); if (el && INP[el.dataset.chg]) try { INP[el.dataset.chg](el, e); } catch (err) { console.error(err); toast('Something went wrong: ' + err.message, 'error'); } });
document.addEventListener('input', e => { const el = e.target.closest('[data-inp]'); if (el && INP[el.dataset.inp]) try { INP[el.dataset.inp](el, e); } catch (err) { console.error(err); } });

/* Files */
async function saveFile(filename, data, mimeNote = '') {
  let dl = null; try { dl = window.claude && await claude.use('downloads'); } catch (e) { }
  const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/plain' });
  if (dl) {
    try { await dl.save({ filename, data: blob }); toast('Saved ' + filename, 'ok'); return true; }
    catch (e) {
      if (e && e.code === 'declined') { toast('Save cancelled.', 'info'); return false; }
      if (e && e.code === 'rejected_extension' && /\.sql$/.test(filename)) { try { await dl.save({ filename: filename + '.txt', data: blob }); toast('This viewer only allows certain file types, so it was saved as ' + filename + '.txt — rename it to .sql.', 'warn', 7000); return true; } catch (e2) { } }
      toast('Could not save the file here (' + ((e && e.code) || 'error') + '). Use Copy instead.', 'error'); return false;
    }
  }
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Download started: ' + filename, 'ok'); return true; }
  catch (e) { toast('Downloads are not available in this view. Use Copy instead.', 'error'); return false; }
}
async function copyText(t) { try { await navigator.clipboard.writeText(t); toast('Copied to clipboard', 'ok'); } catch (e) { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('Copied to clipboard', 'ok'); } catch (e2) { toast('Copy is blocked here. Select the text and copy it manually.', 'error'); } ta.remove(); } }

/* AI (sample capability) */
let _sample; async function getSample() { if (_sample !== undefined) return _sample; try { _sample = window.claude ? await claude.use('sample') : null; } catch (e) { _sample = null; } return _sample; }
function aiErr(e) {
  const c = e && e.code;
  if (c === 'not_granted') return 'AI generation was declined. Allow it when prompted to generate questions.';
  if (c === 'rate_limited') return 'Too many AI requests right now. Wait a moment and try again.';
  if (c === 'invalid_json') return 'The AI reply could not be read as questions. Try again with fewer questions.';
  if (c === 'cancelled') return 'Stopped.';
  return 'AI generation failed (' + (c || 'error') + '). ' + ((e && e.message) || '');
}

/* Router */
const VIEWS = {}; let CUR = { name: '', args: [] }, MOUNT = null, CLEAN = null;
function go(path) { if (location.hash === '#' + path) route(); else location.hash = '#' + path; }
function route() {
  const h = (location.hash || '#/home').replace(/^#\/?/, ''); const [name, ...args] = h.split('/').map(decodeURIComponent);
  const view = VIEWS[name] ? name : 'home'; CUR = { name: view, args };
  if (CLEAN) { try { CLEAN(); } catch (e) { } CLEAN = null; }
  MOUNT = null; const out = $('#view');
  try { out.innerHTML = VIEWS[view](...args); } catch (err) { console.error(err); out.innerHTML = `<div class="card"><h3>This page could not be displayed</h3><p class="muted">${esc(err.message)}</p><a class="btn" href="#/home">Back to Home</a></div>`; }
  $$('.nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === view));
  $('#side').classList.remove('open'); window.scrollTo(0, 0);
  if (MOUNT) try { MOUNT(); } catch (err) { console.error(err); toast('Page error: ' + err.message, 'error'); }
}
function rerender() { const y = window.scrollY; const out = $('#view'); if (CLEAN) { try { CLEAN(); } catch (e) { } CLEAN = null; } MOUNT = null; out.innerHTML = VIEWS[CUR.name](...CUR.args); if (MOUNT) MOUNT(); window.scrollTo(0, y); }

/* YouTube helpers */
function getYouTubeId(url) {
  if (!url) return null;
  let s = String(url).trim(); if (!s) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s;
  let u; try { u = new URL(s); } catch (e) { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  const host = u.hostname.toLowerCase().replace(/^(www|m|music)\./, '');
  const ok = id => /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null;
  if (host === 'youtu.be') return ok(u.pathname.split('/')[1]);
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const p = u.pathname.split('/').filter(Boolean);
    if (p[0] === 'watch') return ok(u.searchParams.get('v'));
    if (['embed', 'shorts', 'live', 'v'].includes(p[0])) return ok(p[1]);
  }
  return null;
}
const ytWatchUrl = id => 'https://www.youtube.com/watch?v=' + id;
/* Ask YouTube's public oEmbed endpoint whether a video exists and may be embedded.
   Returns {state:'ok'|'blocked'|'missing'|'unknown', title, author}. 'unknown' = could not reach YouTube (offline / CORS). */
async function ytCheck(id) {
  try {
    const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(ytWatchUrl(id)));
    if (r.status === 404) return { state: 'missing' };
    if (r.status === 401 || r.status === 403) return { state: 'blocked' };
    if (!r.ok) return { state: 'unknown' };
    const j = await r.json(); return { state: 'ok', title: j.title || '', author: j.author_name || '' };
  } catch (e) { return { state: 'unknown' }; }
}
function ytEmbedHTML(url, title = 'Video lecture') {
  const vid = getYouTubeId(url);
  if (!vid) {
    const safe = /^https?:\/\/\S+$/i.test(String(url || '').trim());
    return `<div class="note warn small"><b>This is not a recognised YouTube video link.</b> Supported: youtube.com/watch?v=…, youtu.be/…, youtube.com/embed/…, youtube.com/shorts/…${safe ? ` <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open the link directly ↗</a>` : ''}</div>`;
  }
  const short = /\/shorts\//.test(String(url));
  return `<div class="yt-box${short ? ' short' : ''}" data-vid="${vid}">
    <div class="vid-embed-wrap yt-stage"><button type="button" class="yt-facade" data-act="yt-play" data-vid="${vid}" data-title="${esc(title)}" aria-label="Play video: ${esc(title)}"><img class="yt-thumb" src="https://i.ytimg.com/vi/${vid}/hqdefault.jpg" alt="" loading="lazy" referrerpolicy="no-referrer"><span class="yt-play" aria-hidden="true">▶</span></button></div>
    <div class="yt-msg xs"></div>
    <div class="xs" style="margin-top:2px"><a href="${ytWatchUrl(vid)}" target="_blank" rel="noopener noreferrer">Watch directly on YouTube ↗</a></div>
  </div>`;
}
ACT['yt-play'] = async el => {
  const box = el.closest('.yt-box'), vid = el.dataset.vid, title = el.dataset.title || 'Video lecture', msg = box.querySelector('.yt-msg');
  const direct = `<a href="${ytWatchUrl(vid)}" target="_blank" rel="noopener noreferrer">Watch it on YouTube ↗</a>`;
  if (location.protocol === 'file:') {
    msg.innerHTML = `<div class="note warn small">YouTube refuses to play embedded videos on pages opened straight from a file (file://). Serve the app over http (see README: <span class="mono">python -m http.server</span>) to play it here. ${direct}</div>`;
    window.open(ytWatchUrl(vid), '_blank', 'noopener'); return;
  }
  msg.innerHTML = '<span class="muted">Checking video…</span>';
  const c = await ytCheck(vid);
  if (c.state === 'missing') { msg.innerHTML = `<div class="note bad small">YouTube reports that this video no longer exists or is private. ${direct}</div>`; return; }
  if (c.state === 'blocked') { msg.innerHTML = `<div class="note warn small">The owner has disabled embedding for this video, so it cannot play inside this page. ${direct}</div>`; return; }
  msg.innerHTML = '';
  const stage = box.querySelector('.yt-stage'), f = document.createElement('iframe');
  f.src = `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0&playsinline=1`; f.title = title + ' (YouTube video)'; f.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'); f.setAttribute('allowfullscreen', ''); f.referrerPolicy = 'strict-origin-when-cross-origin';
  stage.replaceChildren(f);
  msg.innerHTML = `<span class="muted">If the player shows an error, ${direct}</span>`;
};
document.addEventListener('error', e => { const t = e.target; if (t && t.classList && t.classList.contains('yt-thumb')) t.closest('.yt-facade').classList.add('noimg'); }, true);

/* Profile Actions */
ACT['prof-edit'] = () => {
  const p = DB.profile;
  openModal(`<h3>Edit Student Profile</h3>
  <div class="col" style="gap:10px">
    <label class="f">Full Name<input id="pe-name" value="${esc(p.name)}" maxlength="60"></label>
    <label class="f">Register / Roll Number<input id="pe-reg" value="${esc(p.regNo)}" maxlength="30" placeholder="e.g. 23BCE0001"></label>
    <label class="f">Department<input id="pe-dept" value="${esc(p.dept)}" maxlength="60" placeholder="e.g. Computer Science and Engineering"></label>
    <label class="f">Year &amp; Semester<input id="pe-sem" value="${esc(p.yearSem)}" maxlength="30" placeholder="e.g. 3rd Year / 5th Sem"></label>
    <label class="f">Course / Laboratory Name<input id="pe-course" value="${esc(p.course)}" maxlength="80" placeholder="e.g. DBMS Lab (CS2051)"></label>
  </div>
  <div class="row" style="justify-content:flex-end;margin-top:14px">
    <button class="btn" data-act="closemodal">Cancel</button>
    <button class="btn pri" data-act="prof-save">Save Profile</button>
  </div>`);
};
ACT['prof-save'] = () => {
  const name = ($('#pe-name').value.trim() || 'Student Name').slice(0, 60);
  DB.profile.name = name;
  DB.profile.regNo = ($('#pe-reg').value.trim() || '23BCE0001').slice(0, 30);
  DB.profile.dept = ($('#pe-dept').value.trim() || 'Computer Science and Engineering').slice(0, 60);
  DB.profile.yearSem = ($('#pe-sem').value.trim() || '3rd Year / 5th Sem').slice(0, 30);
  DB.profile.course = ($('#pe-course').value.trim() || 'Database Management Systems Lab (CS2051)').slice(0, 80);
  DB.settings.name = name;
  DB.save('profile');
  DB.save('settings');
  closeModal();
  toast('Profile updated successfully.', 'ok');
  rerender();
};
ACT['prof-upload'] = () => {
  const f = $('#prof-file');
  if (f) f.click();
};
INP['prof-file'] = el => {
  const file = el.files && el.files[0];
  el.value = '';
  if (!file) return;
  if (!/^image\/(png|jpeg|jpg|webp)$/i.test(file.type)) return toast('Please select a PNG, JPG, or WebP image.', 'error');
  if (file.size > 2.5e6) return toast('Image size is too large (max 2.5 MB).', 'warn');
  const reader = new FileReader();
  reader.onerror = () => toast('Error reading image file.', 'error');
  reader.onload = () => {
    DB.profile.avatar = String(reader.result);
    DB.save('profile');
    toast('Profile photo updated!', 'ok');
    rerender();
  };
  reader.readAsDataURL(file);
};
ACT['prof-rmphoto'] = async () => {
  if (await confirmBox('Remove profile photo and revert to default avatar?', 'Remove', false)) {
    DB.profile.avatar = '';
    DB.save('profile');
    toast('Profile photo removed.', 'ok');
    rerender();
  }
};
ACT.vcomp = el => {
  const id = el.dataset.id;
  DB.vdone = DB.vdone || {};
  DB.vdone[id] = !DB.vdone[id];
  DB.save('vdone');
  toast(DB.vdone[id] ? 'Video marked as completed!' : 'Video marked as incomplete.', 'ok');
  rerender();
};

