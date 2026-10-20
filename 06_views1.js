/* ===== Shell, widgets, Home, Visualizer ===== */
const NAV = [
  ['home', 'Dashboard', 'home'],
  ['profile', 'Profile', 'user'],
  ['progress', 'Learn / Progress', 'prog'],
  ['visualizer', 'EER Visualizer', 'viz'],
  ['workbench', 'Table / SQL Import', 'import'],
  ['examples', 'Examples', 'ex'],
  ['practice', 'Quiz', 'prac'],
  ['competitive', 'Competitive Questions', 'award'],
  ['leaderboard', 'Leaderboard', 'trophy'],
  ['contributors', 'Contributors', 'team'],
  ['help', 'Help', 'help'],
  ['admin', 'Content Manager', 'admin']
];
function renderNav() {
  $('#nav').innerHTML = NAV.filter(n => n[0] !== 'admin' || DB.settings.editor).map(n => `<a href="#/${n[0]}" data-nav="${n[0]}">${ico(n[2])}<span>${n[1]}</span></a>`).join('') + `<button data-act="search">${ico('search')}<span>Search</span> <span class="kbd" style="margin-left:auto">/</span></button><button data-act="settings">${ico('sun')}<span>Settings</span></button>`;
  $$('.nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === CUR.name));
}
function applyTheme() { document.documentElement.setAttribute('data-theme', DB.settings.theme === 'light' ? 'light' : 'dark'); }
ACT.menu = () => $('#side').classList.toggle('open');
ACT.settings = () => {
  openModal(`<h3>Settings</h3><div class="col"><label class="f">Your display name (used on the leaderboard)<input id="st-name" value="${esc(DB.settings.name)}" maxlength="30"></label>
  <label class="f">Theme<select id="st-theme"><option value="dark" ${DB.settings.theme !== 'light' ? 'selected' : ''}>Dark</option><option value="light" ${DB.settings.theme === 'light' ? 'selected' : ''}>Light</option></select></label>
  <label class="ck"><input type="checkbox" id="st-ed" ${DB.settings.editor ? 'checked' : ''}> Show content manager (editor mode)</label>
  <p class="small muted">Editor mode allows managing videos, competitive questions, learning topics and data backups. All data lives in this browser.</p></div>
  <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-act="closemodal">Cancel</button><button class="btn pri" data-act="savesettings">Save</button></div>`);
};
ACT.closemodal = () => closeModal();
ACT.savesettings = () => { DB.settings.name = ($('#st-name').value.trim() || 'Student').slice(0, 30); DB.settings.theme = $('#st-theme').value; DB.settings.editor = $('#st-ed').checked; DB.save('settings'); applyTheme(); renderNav(); closeModal(); toast('Settings saved', 'ok'); if (CUR.name === 'admin' && !DB.settings.editor) go('/home'); else rerender(); };

/* ---------- Widgets ---------- */
const CW = {};
function cwState(id) { return CW[id] = CW[id] || { d: true, t: false }; }
function vennSVG(d, t) {
  const c1 = d ? 95 : 122, c2 = d ? 205 : 178, r = d ? 46 : 50;
  const dot = (x, y, c) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${c}"/>`;
  return `<svg viewBox="0 0 300 165" role="img" aria-label="Venn view of ${d ? 'disjoint' : 'overlapping'} ${t ? 'total' : 'partial'} subclasses"><rect x="4" y="4" width="292" height="157" rx="12" style="fill:none;stroke:var(--node-stroke);stroke-width:1.5"/><text x="14" y="22" style="fill:var(--muted);font-size:11px">PERSON (all entities)</text>
  <circle cx="${c1}" cy="82" r="${r}" style="fill:rgba(123,127,255,.18);stroke:var(--accent);stroke-width:1.5"/><circle cx="${c2}" cy="82" r="${r}" style="fill:rgba(179,136,255,.18);stroke:var(--accent2);stroke-width:1.5"/>
  <text x="${c1 - (d ? 0 : 22)}" y="150" text-anchor="middle" style="fill:var(--accent);font-size:11px;font-weight:600">STUDENT</text><text x="${c2 + (d ? 0 : 22)}" y="150" text-anchor="middle" style="fill:var(--accent2);font-size:11px;font-weight:600">FACULTY</text>
  ${dot(c1 - 20, 72, 'var(--accent)')}${dot(c1 - 6, 98, 'var(--accent)')}${dot(c2 + 20, 72, 'var(--accent2)')}${dot(c2 + 6, 98, 'var(--accent2)')}
  ${d ? '' : dot(150, 82, 'var(--warn)') + '<text x="150" y="66" text-anchor="middle" style="fill:var(--warn);font-size:10px">both</text>'}
  ${t ? '' : dot(22, 40, 'var(--dim)') + dot(278, 132, 'var(--dim)') + '<text x="278" y="118" text-anchor="end" style="fill:var(--dim);font-size:10px">in no subclass</text>'}</svg>`;
}
function constraintWidget(id) {
  const s = cwState(id), m = mk('constraints', { E: { PERSON: ['Person_ID:INT:pk', 'Name'], STUDENT: ['CGPA:DECIMAL(3,2)'], FACULTY: ['Salary:DECIMAL(10,2)'] }, ISA: [{ sup: 'PERSON', subs: ['STUDENT', 'FACULTY'], d: s.d, t: s.t }] });
  const b = (k, on, l) => `<button class="btn sm ${on ? 'on' : ''}" data-act="cw" data-w="${id}" data-k="${k}" aria-pressed="${on}">${l}</button>`;
  const mapOpts = s.t && s.d ? 'A, B, C or D all work' : !s.t && s.d ? 'A, C (nullable type) or D — not B' : s.t && !s.d ? 'A, B (with duplication) or D — not C' : 'A or D — not B, not C';
  return `<div class="card cwrap" id="cw-${id}"><div class="row sb" style="margin-bottom:8px"><b>Try the constraints</b><span class="xs muted">Click the buttons</span></div>
  <div class="row" style="margin-bottom:8px">${b('d', s.d, 'Disjoint (d)')}${b('o', !s.d, 'Overlapping (o)')}<span class="sep" style="width:8px"></span>${b('t', s.t, 'Total (double line)')}${b('p', !s.t, 'Partial (single line)')}</div>
  <div class="grid g2" style="gap:10px">${staticSVG(m)}<div class="cw">${vennSVG(s.d, s.t)}</div></div>
  <p class="small" style="margin:10px 0 0"><b>${s.d ? 'Disjoint:' : 'Overlapping:'}</b> ${s.d ? 'a person is in at most one subclass.' : 'a person can be in both subclasses.'} <b>${s.t ? 'Total:' : 'Partial:'}</b> ${s.t ? 'every person is in a subclass.' : 'some persons are in neither.'}<br><span class="muted">Mapping options that fit: ${mapOpts}.</span></p></div>`;
}
ACT.cw = el => { const id = el.dataset.w, s = cwState(id), k = el.dataset.k; if (k === 'd') s.d = true; if (k === 'o') s.d = false; if (k === 't') s.t = true; if (k === 'p') s.t = false; const box = $('#cw-' + id); if (box) box.outerHTML = constraintWidget(id); };
const GW = {};
function genWidget(id) {
  const after = !!GW[id]; const m = modelOf(after ? 'person' : 'gen_before');
  return `<div class="card" id="gw-${id}"><div class="row sb" style="margin-bottom:8px"><b>${after ? 'After: superclass PERSON holds the common attributes' : 'Before: Name, Address and Phone repeat'}</b><button class="btn sm pri" data-act="gw" data-w="${id}">${after ? 'Undo: show separate entities' : 'Generalize (bottom-up)'}</button></div>${staticSVG(m)}<p class="small muted" style="margin:8px 0 0">${after ? 'Read right-to-left as specialization: PERSON is refined into STUDENT and FACULTY. Read left-to-right as generalization. The final diagram is the same.' : 'STUDENT and FACULTY store Name, Address and Phone twice. Generalization moves the shared attributes into one superclass.'}</p></div>`;
}
ACT.gw = el => { const id = el.dataset.w; GW[id] = !GW[id]; $('#gw-' + id).outerHTML = genWidget(id); };
const SW = { d: true, t: false, s: 'own' };
function stratWidget() {
  const m = modelOf('person'); m.isas[0].disjoint = SW.d; m.isas[0].total = SW.t; const r = toRelational(m, SW.s);
  const b = (k, on, l) => `<button class="btn sm ${on ? 'on' : ''}" data-act="sw" data-k="${k}">${l}</button>`;
  return `<div class="card" id="sw"><b>Mapping explorer</b><p class="small muted">Pick constraints and a mapping option. If an option does not suit the constraints, the tool falls back and tells you why.</p>
  <div class="row" style="margin-bottom:8px">${b('d', SW.d, 'Disjoint')}${b('o', !SW.d, 'Overlapping')}${b('t', SW.t, 'Total')}${b('p', !SW.t, 'Partial')}</div>
  <div class="row" style="margin-bottom:10px">${Object.entries(MAP_STRATS).map(([k, v]) => `<button class="btn sm ${SW.s === k ? 'on' : ''}" data-act="sw" data-k="s:${k}" title="${esc(v[1])}">${esc(v[0].split(' · ')[0])} · ${esc(v[0].split(' · ')[1].split(' ').slice(0, 3).join(' '))}</button>`).join('')}</div>
  <p class="small">${esc(MAP_STRATS[SW.s][1])}</p><div class="scroll-x">${schemaHTML(r.tables)}</div><pre class="code" style="margin-top:10px;max-height:300px">${hiSQL(toSQL(r.tables))}</pre>${r.notes.length ? `<ul class="tight small muted">${r.notes.slice(0, 6).map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}</div>`;
}
ACT.sw = el => { const k = el.dataset.k; if (k === 'd') SW.d = true; else if (k === 'o') SW.d = false; else if (k === 't') SW.t = true; else if (k === 'p') SW.t = false; else if (k.startsWith('s:')) SW.s = k.slice(2); $('#sw').outerHTML = stratWidget(); };

/* ---------- Dashboard (Home) ---------- */
VIEWS.home = () => {
  const nextT = TOPICS.find(t => DB.progress[t.id] !== 'dn') || TOPICS[0];
  const doneTopics = TOPICS.filter(t => DB.progress[t.id] === 'dn').length;
  
  // Real statistical computations
  const allAns = Object.values(DB.tagg).reduce((s, x) => s + x.n, 0);
  const correctAns = Object.values(DB.tagg).reduce((s, x) => s + x.ok, 0);
  const overallAcc = allAns ? Math.round(100 * correctAns / allAns) : 0;
  
  const cqList = DB.cq || [];
  const compAttempts = (DB.attempts || []).filter(a => a.kind === 'cq');
  const compScore = compAttempts.reduce((s, a) => s + (a.meta && a.meta.marksObtained != null ? a.meta.marksObtained : a.correct * 2), 0);
  
  const vids = DB.videos || [];
  const vidsDone = Object.values(DB.vdone || {}).filter(Boolean).length;
  
  // Overall progress weighted calculation
  const topicsPart = (doneTopics / (TOPICS.length || 1)) * 40;
  const practicePart = (allAns ? Math.min(1, allAns / 25) : 0) * 25;
  const compPart = (compAttempts.length ? Math.min(1, compAttempts.length / 5) : 0) * 20;
  const vidPart = (vids.length ? Math.min(1, vidsDone / vids.length) : 0) * 15;
  const overallPct = Math.min(100, Math.round(topicsPart + practicePart + compPart + vidPart));
  
  const studentName = DB.profile && DB.profile.name ? DB.profile.name : DB.settings.name || 'Student';
  const regNo = DB.profile && DB.profile.regNo ? DB.profile.regNo : '23BCE0001';

  const quickNav = [
    ['user', 'Profile', 'Student identity, register number, and learning records.', 'profile'],
    ['prog', 'Learn / Progress', `${doneTopics} of ${TOPICS.length} topics completed · video lectures & roadmap.`, 'progress'],
    ['viz', 'EER Visualizer', 'Interactive EER hierarchy canvas, live schema & SQL generator.', 'visualizer'],
    ['prac', 'Quiz', 'Practice question bank with instant hints and explanations.', 'practice'],
    ['award', 'Competitive Questions', 'Challenging GATE / University exam problems & timed tests.', 'competitive'],
    ['trophy', 'Leaderboard', 'Personal performance scorecard and attempt rankings.', 'leaderboard'],
    ['team', 'Contributors', 'Student developer team and faculty project mentor.', 'contributors']
  ];

  return `
  <section class="hero" style="padding-bottom:18px">
    <div>
      <span class="chip acc" style="margin-bottom:10px">EER Modeling Laboratory</span>
      <h1 style="margin-bottom:6px">Generalization &amp; Specialization Visualizer</h1>
      <p class="sub" style="margin-bottom:12px">Welcome, <b>${esc(studentName)}</b> <span class="xs muted">(${esc(regNo)})</span></p>
      <p class="muted" style="max-width:56ch">
        An interactive laboratory platform for Enhanced Entity-Relationship (EER) modeling. Explore superclass/subclass hierarchies, inheritance rules, disjoint/overlapping and total/partial constraints, and automated relational mappings.
      </p>
      <div class="row" style="margin-top:16px">
        <a class="btn pri" href="#/learn/${nextT.id}">${doneTopics ? 'Continue Learning' : 'Start Learning'}</a>
        <a class="btn" href="#/visualizer">Open Visualizer</a>
        <a class="btn" href="#/competitive">Competitive Questions</a>
        <a class="btn" href="#/profile">My Profile</a>
      </div>
      <p class="xs muted" style="margin-top:12px">${doneTopics} of ${TOPICS.length} topics completed · Next: <b>${esc(nextT.t)}</b></p>
    </div>
    ${constraintWidget('home')}
  </section>

  <!-- Summary Cards -->
  <div style="margin:20px 0 28px">
    <div class="page-h" style="margin-bottom:12px">
      <div>
        <h3 style="margin:0">Laboratory Performance Summary</h3>
        <span class="small muted">Live metrics computed from your local laboratory activity</span>
      </div>
    </div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px">
      <div class="card">
        <div class="row sb" style="margin-bottom:4px">
          <span class="small muted">Overall Progress</span>
          <span class="chip acc">${overallPct}%</span>
        </div>
        <div class="stat">${overallPct}%</div>
        <div class="bar" style="margin-top:8px"><i style="width:${overallPct}%"></i></div>
        <span class="xs muted" style="margin-top:4px;display:block">${doneTopics} topics · ${vidsDone} videos</span>
      </div>
      
      <div class="card">
        <div class="row sb" style="margin-bottom:4px">
          <span class="small muted">Questions Attempted</span>
          <span class="chip ok">${correctAns} Correct</span>
        </div>
        <div class="stat">${allAns}</div>
        <span class="xs muted" style="margin-top:4px;display:block">Practice &amp; mini quizzes answered</span>
      </div>

      <div class="card">
        <div class="row sb" style="margin-bottom:4px">
          <span class="small muted">Overall Accuracy</span>
          <span class="chip ${overallAcc >= 75 ? 'ok' : overallAcc >= 50 ? 'warn' : 'info'}">${allAns ? overallAcc + '%' : '–'}</span>
        </div>
        <div class="stat">${allAns ? overallAcc + '%' : '–'}</div>
        <span class="xs muted" style="margin-top:4px;display:block">${allAns ? `${correctAns} / ${allAns} successful` : 'No answers recorded yet'}</span>
      </div>

      <div class="card">
        <div class="row sb" style="margin-bottom:4px">
          <span class="small muted">Competitive Score</span>
          <span class="marks-chip">${compScore} Pts</span>
        </div>
        <div class="stat">${compScore}</div>
        <span class="xs muted" style="margin-top:4px;display:block">${compAttempts.length} competitive attempts</span>
      </div>

      <div class="card">
        <div class="row sb" style="margin-bottom:4px">
          <span class="small muted">Videos Completed</span>
          <span class="chip info">${vidsDone}/${vids.length || 6}</span>
        </div>
        <div class="stat">${vidsDone} / ${vids.length || 6}</div>
        <div class="bar" style="margin-top:8px"><i style="width:${pct(vidsDone, vids.length || 6)}%"></i></div>
        <span class="xs muted" style="margin-top:4px;display:block">Curated video lectures</span>
      </div>
    </div>
  </div>

  <!-- Quick Access Workbench Grid -->
  <div style="margin-top:24px">
    <div class="page-h" style="margin-bottom:12px">
      <div>
        <h3 style="margin:0">Quick Access Workbench</h3>
        <span class="small muted">Direct navigation to laboratory tools and learning modules</span>
      </div>
    </div>
    <div class="grid ga">
      ${quickNav.map(f => `
        <a class="card feat" href="#/${f[3]}" style="color:inherit;text-decoration:none">
          <div class="ico-b">${ico(f[0])}</div>
          <div>
            <h4 style="margin-bottom:3px">${f[1]}</h4>
            <span class="small muted">${f[2]}</span>
          </div>
        </a>
      `).join('')}
    </div>
  </div>

  <div class="note info" style="margin-top:24px">
    <b>Laboratory Data Integrity:</b> Your learning progress, attempts, quiz scores, and profile details are maintained securely in your local browser environment.
  </div>
  `;
};

/* ---------- Visualizer ---------- */
const V = { m: null, sel: null, multi: [], view: { x: 40, y: 20, k: 1 }, past: [], future: [], tab: 'explain', strat: LS.get('strat', 'own'), stage: -1, ref: null, exStage: null };
function vInit() {
  if (V.m) return; const saved = LS.get('model', null);
  if (saved && Array.isArray(saved.entities)) { V.m = saved; } else { V.m = modelOf('person'); V.fresh = true; }
}
const vSave = () => LS.set('model', V.m);
const vSnap = () => { V.past.push(JSON.stringify(V.m)); if (V.past.length > 60) V.past.shift(); V.future = []; };
function vEdit(fn, o = {}) { vSnap(); fn(); vChanged(o); }
function vChanged(o = {}) { vSave(); if (CUR.name !== 'visualizer') return; drawCanvas(); if (o.insp !== false) drawInsp(); drawPanel(); }
function vUndo() { if (!V.past.length) return toast('Nothing to undo', 'info'); V.future.push(JSON.stringify(V.m)); V.m = JSON.parse(V.past.pop()); V.sel = null; V.multi = []; vChanged(); }
function vRedo() { if (!V.future.length) return toast('Nothing to redo', 'info'); V.past.push(JSON.stringify(V.m)); V.m = JSON.parse(V.future.pop()); V.sel = null; V.multi = []; vChanged(); }
function drawCanvas() { const vp = $('#vp'); if (!vp) return; SHOW_INH = !!V.showInh; vp.setAttribute('transform', `translate(${V.view.x} ${V.view.y}) scale(${V.view.k})`); vp.innerHTML = `<rect x="-4000" y="-4000" width="8000" height="8000" fill="url(#gp)"/>` + svgInner(V.m, { sel: V.sel || {}, multi: V.multi }); }
function vFit() {
  const svg = $('#svg'); if (!svg) return; const r = svg.getBoundingClientRect(); if (!r.width) return; const b = bounds(V.m);
  const k = Math.min(r.width / b.w, r.height / b.h, 1.3); V.view = { k, x: (r.width - b.w * k) / 2 - b.x * k, y: (r.height - b.h * k) / 2 - b.y * k }; drawCanvas();
}
function vZoom(f, cx, cy) { const svg = $('#svg'); const r = svg.getBoundingClientRect(); cx = cx ?? r.width / 2; cy = cy ?? r.height / 2; const k0 = V.view.k, k = Math.max(.2, Math.min(2.5, k0 * f)); V.view.x = cx - (cx - V.view.x) * k / k0; V.view.y = cy - (cy - V.view.y) * k / k0; V.view.k = k; drawCanvas(); }

const explainCounts = () => { const m = V.m, r = toRelational(m, V.strat), att = m.entities.reduce((a, e) => a + e.attrs.length, 0); return { m, r, att, sql: toSQL(r.tables) }; };
const STAGES = [['Input', c => `${c.m.entities.length} entities in the model`, 'The model is your input: entities, attributes, relationships and ISA links you drew or imported.'], ['Analysis', () => `${validate(V.m).filter(x => x.lvl === 'warn' || x.lvl === 'bad').length} warning(s)`, 'The model is checked for missing keys, duplicate names, subclass keys and other problems (see the Checks tab).'], ['Entities', c => `${c.m.entities.length} found`, 'Each entity becomes a table (unless the chosen mapping merges or drops it).'], ['Attributes', c => `${c.att} defined`, 'Attributes become columns. Primary keys and foreign keys are marked.'], ['Relationships', c => `${c.m.rels.length} relationships · ${c.m.isas.length} ISA`, 'Relationships become foreign keys or link tables. ISA links become subclass keys or flag/type columns.'], ['Constraints', c => c.m.isas.map(i => (i.disjoint ? 'd' : 'o') + '/' + (i.total ? 'total' : 'partial')).join(', ') || 'none', 'Disjoint/overlapping and total/partial decide which mapping options are safe.'], ['EER diagram', () => 'drawn above', 'The diagram shows the structure with the ISA circle, d/o letter and line style.'], ['Schema & SQL', c => `${c.r.tables.length} tables`, 'The relational schema is derived by the selected mapping option, then written as SQL.']];
function panelHTML() {
  const tabs = [['explain', 'How it is processed'], ['schema', 'Relational schema'], ['sql', 'SQL'], ['checks', 'Checks']];
  const head = `<div class="tabs" role="tablist">${tabs.map(t => `<button role="tab" class="${V.tab === t[0] ? 'on' : ''}" data-act="vtab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>`;
  const c = explainCounts();
  if (V.tab === 'explain') return head + `<div class="row sb" style="margin-bottom:10px"><span class="small muted">Click a step, or run the walkthrough.</span><button class="btn sm pri" data-act="vwalk">Run walkthrough</button></div><div class="flow">${STAGES.map((s, i) => `<div class="st ${V.stage === i ? 'on' : ''}" data-act="vstage" data-i="${i}" role="button" tabindex="0"><b>${i + 1}. ${s[0]}</b><span>${esc(s[1](c))}</span></div>`).join('')}</div>${V.stage >= 0 ? `<div class="note ok"><b>${STAGES[V.stage][0]}.</b> ${esc(STAGES[V.stage][2])}</div>` : ''}`;
  if (V.tab === 'schema') return head + `<div class="row" style="margin-bottom:10px">${Object.entries(MAP_STRATS).map(([k, v]) => `<button class="btn sm ${V.strat === k ? 'on' : ''}" data-act="vstrat" data-s="${k}" title="${esc(v[1])}">${esc(v[0])}</button>`).join('')}</div><p class="small muted">${esc(MAP_STRATS[V.strat][1])}</p><div class="scroll-x">${c.r.tables.length ? schemaHTML(c.r.tables) : '<div class="empty">Add an entity to see the schema.</div>'}</div><p class="xs muted">Underlined = primary key · italic blue → foreign key target.</p>${c.r.notes.length ? `<h4>Why the tables look this way</h4><ul class="tight small">${c.r.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}`;
  if (V.tab === 'sql') return head + `<div class="row" style="margin-bottom:10px"><button class="btn sm" data-act="vcopysql">Copy SQL</button><button class="btn sm" data-act="vdlsql">Download .sql</button><button class="btn sm" data-act="vtoimport" title="Send this SQL to the SQL import tool to check the round trip">Send to SQL import</button><span class="xs muted">Mapping: ${esc(MAP_STRATS[V.strat][0])}</span></div>${c.r.tables.length ? `<pre class="code">${hiSQL(c.sql)}</pre>` : '<div class="empty">Add an entity to generate SQL.</div>'}`;
  const ck = validate(V.m); return head + ck.map(x => `<div class="note ${x.lvl === 'ok' ? 'ok' : x.lvl === 'info' ? '' : x.lvl}">${esc(x.msg)}</div>`).join('');
}
function drawPanel() { const p = $('#vpanel'); if (p) p.innerHTML = panelHTML(); }
ACT.vtab = el => { V.tab = el.dataset.t; drawPanel(); };
ACT.vstrat = el => { V.strat = el.dataset.s; LS.set('strat', V.strat); drawPanel(); };
ACT.vstage = el => { V.stage = +el.dataset.i; drawPanel(); };
ACT.vwalk = async () => { for (let i = 0; i < STAGES.length; i++) { if (CUR.name !== 'visualizer') return; V.stage = i; drawPanel(); await sleep(650); } };
ACT.vcopysql = () => copyText(explainCounts().sql);
ACT.vdlsql = () => saveFile(snake(V.m.name) + '.sql', explainCounts().sql);
ACT.vtoimport = () => { WB.tab = 'sql'; WB.sql = explainCounts().sql; WB.step = 1; WB.rev = null; go('/workbench'); toast('SQL copied into the import tool. Press Parse to test the round trip.', 'info'); };

function inspHTML() {
  const m = V.m, s = V.sel; const dl = `<datalist id="types">${TYPES.map(t => `<option value="${t}">`).join('')}</datalist>`;
  if (s && s.kind === 'ent') {
    const e = ent(m, s.id); if (!e) return '';
    const sp = isaOfSub(m, e.id), inh = inheritedAttrs(m, e);
    return dl + `<div class="row sb"><h3>Entity</h3>${sp ? `<span class="chip acc">subclass of ${esc(ent(m, sp.superId)?.name || '?')}</span>` : ''}</div>
    <label class="f">Name<input data-chg="e-name" value="${esc(e.name)}"></label>
    <label class="ck" style="margin:8px 0"><input type="checkbox" data-chg="e-weak" ${e.weak ? 'checked' : ''}> Weak entity (double border)</label>
    ${inh.length ? `<div class="note small"><b>Inherited:</b> ${inh.map(a => esc(a.name) + ' <span class="dim">(' + esc(a.from) + ')</span>').join(', ')}</div>` : ''}
    <h4 style="margin-top:10px">Attributes</h4>
    ${e.attrs.map(a => `<div data-a="${a.id}" style="margin-bottom:7px"><div class="attr-row"><input data-chg="a-name" value="${esc(a.name)}" aria-label="Attribute name"><input data-chg="a-type" list="types" value="${esc(a.type)}" aria-label="Type"><label>PK<input type="checkbox" data-chg="a-pk" ${a.pk ? 'checked' : ''}></label><label>FK<input type="checkbox" data-chg="a-fk" ${a.fk ? 'checked' : ''}></label><label>NN<input type="checkbox" data-chg="a-nn" ${a.nn ? 'checked' : ''}></label><button class="btn xs danger" data-act="a-del" aria-label="Delete attribute">✕</button></div>${a.fk ? `<select data-chg="a-ref" aria-label="References"><option value="">references… (choose entity)</option>${m.entities.filter(x => x.id !== e.id).map(x => `<option value="${x.id}" ${a.ref === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>` : ''}</div>`).join('') || '<p class="small muted">No attributes yet.</p>'}
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="a-add">+ Attribute</button><button class="btn sm" data-act="v-spec-sel">+ Subclass</button><button class="btn sm danger" data-act="e-del">Delete entity</button></div>`;
  }
  if (s && s.kind === 'rel') {
    const r = m.rels.find(x => x.id === s.id); if (!r) return '';
    const endH = (en, i) => `<div class="card tight" style="margin-bottom:8px"><b class="small">End ${i + 1}</b><div class="grid" style="gap:6px;margin-top:6px"><select data-chg="r-ent" data-i="${i}">${m.entities.map(x => `<option value="${x.id}" ${x.id === en.entity ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><div class="row"><select data-chg="r-card" data-i="${i}" style="width:auto"><option value="1" ${en.card === '1' ? 'selected' : ''}>1 (one)</option><option value="N" ${en.card !== '1' ? 'selected' : ''}>N (many)</option></select><select data-chg="r-part" data-i="${i}" style="width:auto"><option value="partial" ${en.part !== 'total' ? 'selected' : ''}>Partial</option><option value="total" ${en.part === 'total' ? 'selected' : ''}>Total</option></select></div></div></div>`;
    return dl + `<h3>Relationship</h3><label class="f">Name<input data-chg="r-name" value="${esc(r.name)}"></label>${r.ends.map(endH).join('')}<label class="ck"><input type="checkbox" data-chg="r-id" ${r.identifying ? 'checked' : ''}> Identifying (for a weak entity)</label>
    <h4 style="margin-top:10px">Relationship attributes</h4>${(r.attrs || []).map((a, i) => `<div class="attr-row" data-ri="${i}" style="grid-template-columns:1fr 1fr auto"><input data-chg="ra-name" value="${esc(a.name)}"><input data-chg="ra-type" list="types" value="${esc(a.type)}"><button class="btn xs danger" data-act="ra-del">✕</button></div>`).join('')}<div class="row" style="margin-top:8px"><button class="btn sm" data-act="ra-add">+ Attribute</button><button class="btn sm danger" data-act="r-del">Delete</button></div>`;
  }
  if (s && s.kind === 'isa') {
    const i = m.isas.find(x => x.id === s.id); if (!i) return ''; const sup = ent(m, i.superId);
    return `<h3>ISA (specialization)</h3><p class="small">Superclass: <b>${esc(sup?.name || '?')}</b></p>
    <label class="f">Disjointness<select data-chg="i-d"><option value="d" ${i.disjoint ? 'selected' : ''}>Disjoint (d): at most one subclass</option><option value="o" ${!i.disjoint ? 'selected' : ''}>Overlapping (o): several subclasses allowed</option></select></label>
    <label class="f" style="margin-top:8px">Completeness<select data-chg="i-t"><option value="p" ${!i.total ? 'selected' : ''}>Partial: some entities in no subclass</option><option value="t" ${i.total ? 'selected' : ''}>Total: every entity in a subclass</option></select></label>
    <h4 style="margin-top:10px">Subclasses</h4>${i.subIds.map(id => { const e = ent(m, id); return e ? `<div class="row sb" style="margin-bottom:4px"><a href="#" data-act="v-pick" data-id="${e.id}">${esc(e.name)}</a><button class="btn xs" data-act="i-rem" data-id="${e.id}">Remove</button></div>` : ''; }).join('')}
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="i-add">+ Subclass</button><button class="btn sm danger" data-act="i-del">Delete ISA</button></div><p class="xs muted" style="margin-top:8px">Removing an ISA does not delete the entities.</p>`;
  }
  const ck = validate(m);
  return `<h3>${esc(m.name)}</h3><p class="small muted">${m.entities.length} entities · ${m.rels.length} relationships · ${m.isas.length} ISA</p>${ck.slice(0, 3).map(x => `<div class="note ${x.lvl === 'ok' ? 'ok' : x.lvl === 'info' ? '' : x.lvl} small">${esc(x.msg)}</div>`).join('')}<p class="small muted">Click an entity, relationship or ISA circle to edit it. Drag to move, drag the background to pan, scroll to zoom. Shift-click entities to select several, then use <b>Generalize</b>.</p>${V.fresh ? '<div class="note small">An example model is loaded. Edit it, or press <b>New</b> to start empty.</div>' : ''}`;
}
function drawInsp() { const i = $('#insp'); if (i) i.innerHTML = inspHTML(); }
const selEnt = () => V.sel && V.sel.kind === 'ent' ? ent(V.m, V.sel.id) : null;
const attrOf = el => { const e = selEnt(); const id = el.closest('[data-a]')?.dataset.a; return e ? e.attrs.find(a => a.id === id) : null; };
ACT['a-add'] = () => { const e = selEnt(); if (!e) return; vEdit(() => e.attrs.push(attr('New_attribute'))); };
ACT['a-del'] = el => { const e = selEnt(), a = attrOf(el); if (e && a) vEdit(() => { e.attrs = e.attrs.filter(x => x !== a); }); };
INP['a-name'] = el => { const a = attrOf(el); if (a) vEdit(() => { a.name = el.value.trim() || a.name; }, { insp: false }); };
INP['a-type'] = el => { const a = attrOf(el); if (a) vEdit(() => { a.type = el.value.trim() || a.type; }, { insp: false }); };
INP['a-pk'] = el => { const a = attrOf(el); if (a) vEdit(() => { a.pk = el.checked; if (a.pk) a.nn = true; }); };
INP['a-fk'] = el => { const a = attrOf(el); if (a) vEdit(() => { a.fk = el.checked; if (!a.fk) a.ref = ''; }); };
INP['a-nn'] = el => { const a = attrOf(el); if (a) vEdit(() => { a.nn = el.checked; }, { insp: false }); };
INP['a-ref'] = el => { const a = attrOf(el); if (a) vEdit(() => { a.ref = el.value; }, { insp: false }); };
INP['e-name'] = el => { const e = selEnt(); const v = el.value.trim().toUpperCase(); if (!e || !v) return; vEdit(() => { e.name = v; }, { insp: false }); };
INP['e-weak'] = el => { const e = selEnt(); if (e) vEdit(() => { e.weak = el.checked; }, { insp: false }); };
ACT['e-del'] = async () => { const e = selEnt(); if (!e) return; if (await confirmBox(`Delete ${e.name} and its relationships? You can undo this.`, 'Delete')) { vEdit(() => { deleteEntity(V.m, e.id); V.sel = null; V.multi = []; }); } };
const relSel = () => V.sel && V.sel.kind === 'rel' ? V.m.rels.find(r => r.id === V.sel.id) : null;
INP['r-name'] = el => { const r = relSel(); if (r) vEdit(() => { r.name = el.value.trim().toUpperCase().replace(/\s+/g, '_') || r.name; }, { insp: false }); };
INP['r-ent'] = el => { const r = relSel(); if (!r) return; const i = +el.dataset.i; if (r.ends[1 - i].entity === el.value) { toast('A relationship needs two different entities in this tool.', 'warn'); drawInsp(); return; } vEdit(() => { r.ends[i].entity = el.value; const a = ent(V.m, r.ends[0].entity), b = ent(V.m, r.ends[1].entity); const ca = cxy(V.m, a), cb = cxy(V.m, b); r.x = (ca.x + cb.x) / 2; r.y = (ca.y + cb.y) / 2; }, { insp: false }); };
INP['r-card'] = el => { const r = relSel(); if (r) vEdit(() => { r.ends[+el.dataset.i].card = el.value; }, { insp: false }); };
INP['r-part'] = el => { const r = relSel(); if (r) vEdit(() => { r.ends[+el.dataset.i].part = el.value; }, { insp: false }); };
INP['r-id'] = el => { const r = relSel(); if (r) vEdit(() => { r.identifying = el.checked; }, { insp: false }); };
ACT['r-del'] = () => { const r = relSel(); if (r) vEdit(() => { V.m.rels = V.m.rels.filter(x => x !== r); V.sel = null; }); };
ACT['ra-add'] = () => { const r = relSel(); if (r) vEdit(() => { (r.attrs = r.attrs || []).push({ name: 'New_attribute', type: 'VARCHAR(100)' }); }); };
ACT['ra-del'] = el => { const r = relSel(); if (r) vEdit(() => { r.attrs.splice(+el.closest('[data-ri]').dataset.ri, 1); }); };
INP['ra-name'] = el => { const r = relSel(); if (r) vEdit(() => { r.attrs[+el.closest('[data-ri]').dataset.ri].name = el.value.trim() || 'Attribute'; }, { insp: false }); };
INP['ra-type'] = el => { const r = relSel(); if (r) vEdit(() => { r.attrs[+el.closest('[data-ri]').dataset.ri].type = el.value.trim() || 'VARCHAR(100)'; }, { insp: false }); };
const isaSel = () => V.sel && V.sel.kind === 'isa' ? V.m.isas.find(i => i.id === V.sel.id) : null;
INP['i-d'] = el => { const i = isaSel(); if (i) vEdit(() => { i.disjoint = el.value === 'd'; }, { insp: false }); };
INP['i-t'] = el => { const i = isaSel(); if (i) vEdit(() => { i.total = el.value === 't'; }, { insp: false }); };
ACT['i-del'] = () => { const i = isaSel(); if (i) vEdit(() => { V.m.isas = V.m.isas.filter(x => x !== i); V.sel = null; }); };
ACT['i-rem'] = el => { const i = isaSel(); if (i) vEdit(() => { i.subIds = i.subIds.filter(x => x !== el.dataset.id); if (!i.subIds.length) { V.m.isas = V.m.isas.filter(x => x !== i); V.sel = null; } }); };
ACT['i-add'] = async () => { const i = isaSel(); if (!i) return; const n = await promptBox('Add subclass', 'Subclass name'); if (!n) return; vEdit(() => { specialize(V.m, i.superId, [uniqueName(V.m, n.toUpperCase())]); }); };
ACT['v-pick'] = el => { V.sel = { kind: 'ent', id: el.dataset.id }; drawCanvas(); drawInsp(); };
ACT['v-spec-sel'] = () => { const e = selEnt(); if (e) openSpecWizard(e.id); };

/* wizards */
const entOpts = (sel, skip) => V.m.entities.map(e => `<option value="${e.id}" ${e.id === sel ? 'selected' : ''}>${esc(e.name)}</option>`).join('');
function openSpecWizard(pre) {
  if (!V.m.entities.length) return toast('Add an entity first.', 'warn');
  const sup = pre || (selEnt() && selEnt().id) || V.m.entities[0].id, ex = V.m.isas.find(i => i.superId === sup);
  openModal(`<h3>Specialize (top-down)</h3><p class="small muted">Create subclasses under a superclass. Add their specific attributes afterwards.</p><div class="col"><label class="f">Superclass<select id="sw-sup">${entOpts(sup)}</select></label><label class="f">Subclass names (comma separated)<input id="sw-names" placeholder="e.g. MANAGER, ENGINEER"></label>
  ${ex ? '<p class="small muted">This entity already has an ISA. New subclasses are added to it.</p>' : `<div class="grid g2"><label class="f">Disjointness<select id="sw-d"><option value="d">Disjoint (d)</option><option value="o">Overlapping (o)</option></select></label><label class="f">Completeness<select id="sw-t"><option value="p">Partial</option><option value="t">Total</option></select></label></div>`}</div>
  <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-act="closemodal">Cancel</button><button class="btn pri" data-act="spec-go">Create</button></div>`);
}
ACT['v-spec'] = () => openSpecWizard();
ACT['spec-go'] = () => {
  const names = $('#sw-names').value.split(',').map(s => s.trim()).filter(Boolean); if (!names.length) return toast('Enter at least one subclass name.', 'warn');
  const supId = $('#sw-sup').value; const uniq = []; names.forEach(n => uniq.push(uniqueName({ entities: V.m.entities.concat(uniq.map(x => ({ name: x }))) }, n.toUpperCase().replace(/\s+/g, '_'))));
  const had = V.m.isas.some(i => i.superId === supId); closeModal();
  vEdit(() => { specialize(V.m, supId, uniq); if (!had) { const i = V.m.isas.find(x => x.superId === supId); i.disjoint = $('#sw-d') ? $('#sw-d').value === 'd' : true; i.total = $('#sw-t') ? $('#sw-t').value === 't' : false; } V.sel = { kind: 'isa', id: V.m.isas.find(x => x.superId === supId).id }; }); setTimeout(vFit, 30);
};
function commonAttrs(ids) {
  const es = ids.map(id => ent(V.m, id)).filter(Boolean); if (es.length < 2) return [];
  const first = es[0].attrs.filter(a => !a.pk).map(a => a.name); return first.filter(n => es.every(e => e.attrs.some(a => !a.pk && a.name.toLowerCase() === n.toLowerCase())));
}
function genCommonHTML() {
  const ids = $$('.gw-ent:checked').map(x => x.value), com = commonAttrs(ids);
  if (ids.length < 2) return '<p class="small muted">Select at least two entities.</p>';
  return com.length ? com.map(n => `<label class="ck"><input type="checkbox" class="gw-attr" value="${esc(n)}" checked> ${esc(n)}</label>`).join('') : '<p class="small muted">No attributes with the same name were found. You can still generalize; the superclass will have only a key.</p>';
}
INP['gw-sel'] = () => { $('#gw-common').innerHTML = genCommonHTML(); };
ACT['v-gen'] = () => {
  if (V.m.entities.length < 2) return toast('You need at least two entities to generalize.', 'warn');
  const pre = V.multi.length >= 2 ? V.multi : (selEnt() ? [selEnt().id] : []);
  openModal(`<h3>Generalize (bottom-up)</h3><p class="small muted">Pick the entities to combine. Attributes they share can be moved up into a new superclass.</p>
  <div class="col"><div class="card tight" style="max-height:170px;overflow:auto">${V.m.entities.filter(e => !isaOfSub(V.m, e.id)).map(e => `<label class="ck"><input type="checkbox" class="gw-ent" data-chg="gw-sel" value="${e.id}" ${pre.includes(e.id) ? 'checked' : ''}> ${esc(e.name)}</label>`).join('') || '<span class="small muted">All entities are already subclasses.</span>'}</div>
  <div class="grid g2"><label class="f">Superclass name<input id="gw-name" placeholder="e.g. PERSON"></label><label class="f">Superclass key<input id="gw-key" placeholder="e.g. Person_ID"></label></div>
  <div><b class="small">Common attributes to move up</b><div id="gw-common" class="col" style="margin-top:6px">${(() => { const com = commonAttrs(pre); return pre.length < 2 ? '<p class="small muted">Select at least two entities.</p>' : com.length ? com.map(n => `<label class="ck"><input type="checkbox" class="gw-attr" value="${esc(n)}" checked> ${esc(n)}</label>`).join('') : '<p class="small muted">No attributes with the same name were found.</p>'; })()}</div></div>
  <label class="ck"><input type="checkbox" id="gw-drop" checked> Remove the subclasses' own keys (they inherit the superclass key)</label>
  <div class="grid g2"><label class="f">Disjointness<select id="gw-d"><option value="d">Disjoint (d)</option><option value="o">Overlapping (o)</option></select></label><label class="f">Completeness<select id="gw-t"><option value="p">Partial</option><option value="t">Total</option></select></label></div></div>
  <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-act="closemodal">Cancel</button><button class="btn pri" data-act="gen-go">Generalize</button></div>`);
};
ACT['gen-go'] = () => {
  const ids = $$('.gw-ent:checked').map(x => x.value), name = $('#gw-name').value.trim().toUpperCase().replace(/\s+/g, '_'), key = $('#gw-key').value.trim().replace(/\s+/g, '_') || (name ? cap(name.toLowerCase()) + '_ID' : '');
  if (ids.length < 2) return toast('Select at least two entities.', 'warn'); if (!name) return toast('Enter a superclass name.', 'warn');
  if (V.m.entities.some(e => e.name.toLowerCase() === name.toLowerCase())) return toast('An entity named ' + name + ' already exists. Choose another name.', 'warn');
  const lifted = $$('.gw-attr:checked').map(x => x.value), drop = $('#gw-drop').checked, d = $('#gw-d').value === 'd', t = $('#gw-t').value === 't'; closeModal();
  vEdit(() => { const sup = generalize(V.m, ids, name, lifted, key, drop); const i = V.m.isas[V.m.isas.length - 1]; i.disjoint = d; i.total = t; V.sel = { kind: 'ent', id: sup.id }; V.multi = []; }); setTimeout(vFit, 30); toast(`Created ${name} from ${ids.length} entities.`, 'ok');
};
ACT['v-addent'] = async () => { const n = await promptBox('Add entity', 'Entity name'); if (!n) return; const name = uniqueName(V.m, n.toUpperCase().replace(/\s+/g, '_')); const b = bounds(V.m); vEdit(() => { const e = addEntity(V.m, name, [attr(cap(name.toLowerCase()) + '_ID', 'INT', 'pk')], V.m.entities.length ? b.x + b.w + 40 : 40, 40); V.sel = { kind: 'ent', id: e.id }; }); setTimeout(vFit, 30); };
ACT['v-addrel'] = () => {
  if (V.m.entities.length < 2) return toast('Add at least two entities first.', 'warn'); const a = selEnt() ? selEnt().id : V.m.entities[0].id, b = (V.m.entities.find(e => e.id !== a) || {}).id;
  const side = (p, id) => `<div class="card tight"><b class="small">Entity ${p}</b><div class="grid" style="gap:6px;margin-top:6px"><select id="rw-e${p}">${entOpts(id)}</select><div class="row"><select id="rw-c${p}" style="width:auto"><option value="1">1 (one)</option><option value="N" ${p === 'B' ? 'selected' : ''}>N (many)</option></select><select id="rw-p${p}" style="width:auto"><option value="partial">Partial</option><option value="total">Total</option></select></div></div></div>`;
  openModal(`<h3>Add relationship</h3><div class="col"><label class="f">Name (verb)<input id="rw-name" placeholder="e.g. WORKS_FOR"></label><div class="grid g2">${side('A', a)}${side('B', b)}</div><label class="ck"><input type="checkbox" id="rw-id"> Identifying relationship (owner of a weak entity)</label></div><div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-act="closemodal">Cancel</button><button class="btn pri" data-act="rel-go">Add</button></div>`);
};
ACT['rel-go'] = () => {
  const ea = $('#rw-eA').value, eb = $('#rw-eB').value, name = $('#rw-name').value.trim().toUpperCase().replace(/\s+/g, '_'); if (ea === eb) return toast('Choose two different entities.', 'warn'); if (!name) return toast('Enter a relationship name.', 'warn');
  const A = ent(V.m, ea), B = ent(V.m, eb), ca = cxy(V.m, A), cb = cxy(V.m, B); closeModal();
  vEdit(() => { const r = { id: uid('r'), name, ends: [{ entity: ea, card: $('#rw-cA').value, part: $('#rw-pA').value }, { entity: eb, card: $('#rw-cB').value, part: $('#rw-pB').value }], attrs: [], identifying: $('#rw-id').checked, x: (ca.x + cb.x) / 2, y: (ca.y + cb.y) / 2 - 20 }; V.m.rels.push(r); if (r.identifying) { const w = r.ends.find(x => x.card !== '1') ; } V.sel = { kind: 'rel', id: r.id }; });
};
ACT['v-undo'] = vUndo; ACT['v-redo'] = vRedo; ACT['v-fit'] = vFit; ACT['v-zin'] = () => vZoom(1.2); ACT['v-zout'] = () => vZoom(1 / 1.2);
ACT['v-tidy'] = () => { vEdit(() => layout(V.m)); setTimeout(vFit, 20); };
INP['v-inh'] = el => { V.showInh = el.checked; drawCanvas(); };
INP['v-name'] = el => { V.m.name = el.value.trim() || 'Untitled model'; vSave(); };
ACT['v-new'] = async () => { if (V.m.entities.length && !(await confirmBox('Start a new empty model? The current one can be restored with Undo.', 'New model', false))) return; vEdit(() => { V.m = newModel('Untitled model'); V.sel = null; V.multi = []; }); V.fresh = false; rerender(); };
INP['v-example'] = el => { const k = el.value; if (!k) return; vSnap(); V.m = modelOf(k); V.sel = null; V.multi = []; V.fresh = false; vSave(); rerender(); toast('Example loaded. Use Undo to go back.', 'ok'); };
ACT['v-exsvg'] = () => saveFile(snake(V.m.name) + '.svg', exportSVG(V.m));
ACT['v-expng'] = () => {
  const svg = exportSVG(V.m), b = bounds(V.m), img = new Image(); img.onload = () => { try { const c = document.createElement('canvas'); c.width = b.w * 2; c.height = b.h * 2; const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height); c.toBlob(bl => { if (!bl) return toast('Could not create the PNG.', 'error'); saveFile(snake(V.m.name) + '.png', bl); }, 'image/png'); } catch (e) { toast('PNG export is blocked here. Use SVG export instead.', 'error'); } };
  img.onerror = () => toast('Could not render the diagram to PNG. Use SVG export instead.', 'error'); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};
ACT['v-exjson'] = () => saveFile(snake(V.m.name) + '.json', JSON.stringify(V.m, null, 2));
ACT['v-imjson'] = () => $('#v-file').click();
INP['v-file'] = el => {
  const f = el.files[0]; el.value = ''; if (!f) return; if (!/\.json$/i.test(f.name)) return toast('Please choose a .json file exported from this tool.', 'error');
  const r = new FileReader(); r.onerror = () => toast('Could not read the file.', 'error');
  r.onload = () => { try { const o = JSON.parse(r.result); if (!o || !Array.isArray(o.entities) || !Array.isArray(o.rels) || !Array.isArray(o.isas) || o.entities.some(e => !e.id || !e.name || !Array.isArray(e.attrs))) throw new Error('shape'); vSnap(); V.m = o; V.sel = null; V.multi = []; V.fresh = false; vSave(); rerender(); toast('Model imported: ' + o.entities.length + ' entities.', 'ok'); } catch (e) { toast('This file is not a valid model JSON.', 'error'); } };
  r.readAsText(f);
};
ACT['v-refclear'] = () => { V.ref = null; rerender(); };
function exportSVG(m) {
  const b = bounds(m), cs = getComputedStyle(document.documentElement); const vars = ['--ent', '--ent-head', '--node-stroke', '--text', '--dim', '--muted', '--accent', '--accent2', '--warn', '--f-body', '--f-head', '--f-mono'].map(v => `${v}:${cs.getPropertyValue(v).trim()}`).join(';');
  let rules = ''; try { $$('link,style').forEach(() => { }); for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) if (r.selectorText && /node-|\.edge|\.lbl|\.box|\.head/.test(r.selectorText)) rules += r.cssText + '\n'; } catch (e) { } } } catch (e) { }
  const old = SHOW_INH; SHOW_INH = !!V.showInh; const inner = svgInner(m); SHOW_INH = old;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x} ${b.y} ${b.w} ${b.h}" width="${b.w}" height="${b.h}"><style>svg{${vars}}text{font-family:var(--f-body),sans-serif}${rules}</style><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#ffffff"/>${inner.replace(/var\(--text\)/g, '#111')}</svg>`.replace(/\.node-ent text\{[^}]*\}/, '.node-ent text{fill:#111;font-size:13px}');
}

VIEWS.visualizer = () => {
  vInit(); SHOW_INH = !!V.showInh; const tb = (act, label, extra = '') => `<button class="btn sm" data-act="${act}" ${extra}>${label}</button>`;
  MOUNT = () => {
    drawCanvas(); vFit(); const svg = $('#svg'); if (!svg) return; let drag = null;
    const world = e => { const r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left - V.view.x) / V.view.k, y: (e.clientY - r.top - V.view.y) / V.view.k }; };
    svg.addEventListener('pointerdown', e => {
      const n = e.target.closest('[data-kind]'); svg.setPointerCapture(e.pointerId);
      if (n) { const kind = n.dataset.kind, id = n.dataset.id; if (kind === 'ent' && e.shiftKey) { V.multi = V.multi.includes(id) ? V.multi.filter(x => x !== id) : [...V.multi, id]; V.sel = { kind, id }; } else { V.sel = { kind, id }; if (!e.shiftKey) V.multi = []; } drawCanvas(); drawInsp(); const w = world(e); drag = { kind, id, sx: w.x, sy: w.y, moved: false }; }
      else { V.sel = null; V.multi = []; drawInsp(); drawCanvas(); drag = { pan: true, sx: e.clientX, sy: e.clientY, ox: V.view.x, oy: V.view.y }; svg.classList.add('panning'); }
    });
    svg.addEventListener('pointermove', e => {
      if (!drag) return;
      if (drag.pan) { V.view.x = drag.ox + e.clientX - drag.sx; V.view.y = drag.oy + e.clientY - drag.sy; $('#vp').setAttribute('transform', `translate(${V.view.x} ${V.view.y}) scale(${V.view.k})`); return; }
      const w = world(e), dx = w.x - drag.sx, dy = w.y - drag.sy; if (!drag.moved && Math.hypot(dx, dy) < 3) return; if (!drag.moved) { vSnap(); drag.moved = true; }
      drag.sx = w.x; drag.sy = w.y; const m = V.m;
      if (drag.kind === 'ent') { const ids = V.multi.includes(drag.id) ? V.multi : [drag.id]; ids.forEach(id => { const en = ent(m, id); if (en) { en.x += dx; en.y += dy; m.isas.filter(i => i.superId === id).forEach(i => { isaXY(m, i); i.x += dx; i.y += dy; }); } }); }
      else if (drag.kind === 'rel') { const r = m.rels.find(x => x.id === drag.id); r.x += dx; r.y += dy; } else { const i = m.isas.find(x => x.id === drag.id); i.x += dx; i.y += dy; }
      drawCanvas();
    });
    const end = () => { if (drag && drag.moved) { vSave(); } drag = null; svg.classList.remove('panning'); };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    svg.addEventListener('wheel', e => { e.preventDefault(); const r = svg.getBoundingClientRect(); vZoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  };
  return `<div class="page-h"><div><h2>Visualizer</h2><p>Build and edit an EER diagram. Generalize, specialize and set constraints, then read the relational schema and SQL below.</p></div>
  <div class="row"><label class="sr" for="v-ex">Load an example</label><select id="v-ex" data-chg="v-example" style="width:auto"><option value="">Load example…</option>${Object.entries(MODEL_SPECS).filter(([k]) => k !== 'gen_before').map(([k, v]) => `<option value="${k}">${esc(v[0])}</option>`).join('')}</select>${tb('v-new', 'New')}${tb('v-exsvg', 'SVG')}${tb('v-expng', 'PNG')}${tb('v-exjson', 'Save JSON')}${tb('v-imjson', 'Open JSON')}<input type="file" id="v-file" data-chg="v-file" accept=".json,application/json" hidden></div></div>
  ${V.ref ? `<div class="card tight" style="margin-bottom:10px"><div class="row sb"><b class="small">Reference image (${esc(V.ref.name)})</b><button class="btn xs" data-act="v-refclear">Remove</button></div>${V.ref.img ? `<img src="${V.ref.img}" alt="Reference diagram" style="max-width:100%;max-height:220px;margin-top:6px;border-radius:8px">` : '<p class="small muted">PDF preview is not available here. Use it as your own reference.</p>'}</div>` : ''}
  <div class="toolbar"><input data-inp="v-name" value="${esc(V.m.name)}" style="width:210px" aria-label="Model name"><span class="sep"></span>${tb('v-addent', '+ Entity')}${tb('v-spec', 'Specialize')}${tb('v-gen', 'Generalize')}${tb('v-addrel', '+ Relationship')}<span class="sep"></span>${tb('v-undo', 'Undo')}${tb('v-redo', 'Redo')}${tb('v-tidy', 'Auto layout')}<label class="ck small" style="margin-left:6px"><input type="checkbox" data-chg="v-inh" ${V.showInh ? 'checked' : ''}> Show inherited attributes</label></div>
  <div class="viz"><div class="canvas-wrap"><svg id="svg" role="application" aria-label="EER diagram canvas"><defs><pattern id="gp" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" class="gridline"/></pattern></defs><g id="vp"></g></svg><div class="zoomctl"><button class="btn xs" data-act="v-zin" aria-label="Zoom in">+</button><button class="btn xs" data-act="v-zout" aria-label="Zoom out">−</button><button class="btn xs" data-act="v-fit">Fit</button></div><div class="canvas-hint">Drag nodes · drag background to pan · scroll to zoom · Shift-click to multi-select</div></div><aside class="card insp" id="insp">${inspHTML()}</aside></div>
  <div class="card" style="margin-top:14px" id="vpanel">${panelHTML()}</div>`;
};
document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase(); const typing = ['input', 'textarea', 'select'].includes(tag);
  if (e.key === '/' && !typing && !$('#modal')) { e.preventDefault(); ACT.search(); return; }
  if (CUR.name !== 'visualizer' || typing || $('#modal')) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? vRedo() : vUndo(); }
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); vRedo(); }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && V.sel) { e.preventDefault(); if (V.sel.kind === 'ent') ACT['e-del'](); else if (V.sel.kind === 'rel') ACT['r-del'](); else ACT['i-del'](); }
});
