/* ===== Workbench, Learn, Examples ===== */
const WB = { tab: 'table', step: 1, tables: LS.get('wbtables', []), paste: '', firstHeader: true, sql: '', sqlRes: null, rev: null, errors: [], busy: null, title: 'Imported model', img: null, imgFile: null, imgBusy: false, imgMsg: '', imgErr: null, aiCtl: null, cap: null, capBusy: false, recog: null, aiTables: null };
const wbSave = () => LS.set('wbtables', WB.tables);
const revFind = (k, id) => WB.rev && WB.rev[k].find(x => x.id === id);
const tById = id => (WB.sqlTables && WB.tab === 'sql' ? WB.sqlTables : WB.tables).find(t => t.id === id) || WB.tables.find(t => t.id === id) || (WB.sqlTables || []).find(t => t.id === id) || (WB.aiTables || []).find(t => t.id === id);
const confChip = c => ({ declared: '<span class="chip ok">declared in SQL</span>', likely: '<span class="chip info">likely</span>', possible: '<span class="chip warn">possible</span>', none: '<span class="chip bad">not enough information</span>' }[c] || '');

function sheetHTML(t, ti) {
  const R = t.rows.slice(0, 100);
  return `<div class="card" style="margin-bottom:12px"><div class="row sb" style="margin-bottom:8px"><label class="f" style="flex-direction:row;align-items:center;gap:8px">Table name<input data-chg="wb-tname" data-t="${ti}" value="${esc(t.name)}" style="width:190px"></label><div class="row"><button class="btn xs" data-act="wb-addrow" data-t="${ti}">+ Row</button><button class="btn xs" data-act="wb-addcol" data-t="${ti}">+ Column</button><button class="btn xs danger" data-act="wb-deltable" data-t="${ti}">Delete table</button></div></div>
  <div class="scroll-x"><table class="t sheet"><thead><tr>${t.cols.map((c, ci) => `<th><input data-chg="wb-col" data-t="${ti}" data-c="${ci}" value="${esc(c)}" aria-label="Column name"><button class="btn xs ghost" data-act="wb-delcol" data-t="${ti}" data-c="${ci}" title="Delete column" aria-label="Delete column">✕</button></th>`).join('')}<th></th></tr></thead><tbody>${R.map((r, ri) => `<tr>${r.map((v, ci) => `<td><input data-chg="wb-cell" data-t="${ti}" data-r="${ri}" data-c="${ci}" value="${esc(v)}" aria-label="Cell"></td>`).join('')}<td><button class="btn xs ghost" data-act="wb-delrow" data-t="${ti}" data-r="${ri}" aria-label="Delete row">✕</button></td></tr>`).join('')}</tbody></table></div>${t.rows.length > 100 ? `<p class="xs muted">Showing the first 100 of ${t.rows.length} rows. All rows are used for analysis.</p>` : ''}</div>`;
}
function recogPanelHTML() {
  const rc = WB.recog; if (!rc) return '';
  const r = rc.result, unc = r.uncertain || [];
  return `<div class="card" style="margin-bottom:12px"><div class="row sb"><h3 style="margin:0">Recognition result</h3><span class="chip info">${esc(rc.provider)}</span></div>
  <div class="rc-grid" style="margin-top:10px"><div>${rc.url ? `<img class="rc-img" src="${rc.url}" alt="The diagram you uploaded">` : ''}<p class="xs muted" style="margin:4px 0 0">${esc(rc.file)}${rc.dims ? ` · ${rc.dims.w}×${rc.dims.h}px` : ''}</p></div>
  <div><p class="small" style="margin:0 0 6px"><b>${r.entities.length}</b> entities · <b>${r.relationships.length}</b> relationships · <b>${r.isas.length}</b> generalization/specialization group(s)</p>
  ${unc.length ? `<div class="note warn small"><b>The AI marked these as uncertain or not visible:</b><ul class="tight">${unc.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '<p class="small muted">The AI did not flag anything as uncertain. Still compare every item with the image.</p>'}
  <p class="xs muted" style="margin:6px 0 0">Information that is not drawn in the image (for example a missing cardinality or a missing d/o letter) is left as a visible default below. It was not invented by the AI.</p></div></div></div>`;
}
function reviewHTML() {
  const rv = WB.rev; if (!rv) return '';
  const items = [...rv.rels, ...rv.mns, ...rv.isas], conf = items.filter(x => x.status === 'confirmed').length, un = items.filter(x => x.status === 'detected').length;
  const tn = id => { const t = tById(id); return t ? t.name : '?'; };
  const btns = (k, x) => `<div class="row" style="margin-top:8px"><button class="btn sm ${x.status === 'confirmed' ? 'on' : 'pri'}" data-act="wb-status" data-k="${k}" data-id="${x.id}" data-s="${x.status === 'confirmed' ? 'detected' : 'confirmed'}">${x.status === 'confirmed' ? '✓ Confirmed (click to undo)' : 'Confirm'}</button><button class="btn sm ${x.status === 'rejected' ? 'on' : ''}" data-act="wb-status" data-k="${k}" data-id="${x.id}" data-s="${x.status === 'rejected' ? 'detected' : 'rejected'}">${x.status === 'rejected' ? 'Rejected (click to undo)' : 'Reject'}</button></div>`;
  const stChip = x => x.status === 'confirmed' ? '<span class="chip ok">confirmed</span>' : x.status === 'rejected' ? '<span class="chip bad">rejected</span>' : '<span class="chip warn">detected · needs review</span>';
  const img = rv.source === 'image';
  return `${img ? recogPanelHTML() : ''}<div class="note warn"><b>Review before generating.</b> ${img ? 'Everything below was read from your image by an AI model and may contain mistakes. Nothing has been added to the Visualizer yet. Compare each item with the original, edit it, then confirm or reject it. Only confirmed items are used.' : 'Everything below was detected by simple rules, not known for certain. Confirm, edit or reject each item. Only confirmed items are used.'}</div>
  <div class="row sb" style="margin:10px 0"><span class="small muted">${conf} confirmed · ${un} not reviewed · ${items.length - conf - un} rejected</span><div class="row"><button class="btn sm" data-act="wb-confirmall">Confirm all detected</button>${img ? '' : '<button class="btn sm" data-act="wb-reanalyze">Re-run analysis</button>'}</div></div>
  <h3>Entities and keys</h3>${rv.entities.map(e => `<div class="rev-item"><div class="row sb"><label class="f" style="flex-direction:row;align-items:center;gap:8px">Entity<input data-chg="wb-ename" data-id="${e.tid}" value="${esc(e.name)}" style="width:180px"></label><span class="row">${img ? `<label class="ck small"><input type="checkbox" data-chg="wb-einc" data-id="${e.tid}" ${e.include !== false ? 'checked' : ''}> Include entity</label>${e.unc ? '<span class="chip unc">unclear in image</span>' : ''}` : ''}${confChip(e.pkConf)}${img ? '' : `<span class="chip">${e.rows} row(s)</span>`}</span></div><p class="small muted" style="margin:6px 0">${esc(e.pkNote)}</p><div class="scroll-x"><table class="t"><thead><tr><th>Use</th><th>Attribute</th><th>Type</th><th>PK</th></tr></thead><tbody>${e.attrs.map((a, i) => `<tr><td><input type="checkbox" data-chg="wb-ainc" data-id="${e.tid}" data-i="${i}" ${a.include ? 'checked' : ''}></td><td>${esc(a.name)}${a.unc ? ' <span class="chip unc">unclear</span>' : ''}</td><td><input data-chg="wb-atype" data-id="${e.tid}" data-i="${i}" list="types" value="${esc(a.type)}" style="width:130px"></td><td><input type="checkbox" data-chg="wb-apk" data-id="${e.tid}" data-i="${i}" ${a.pk ? 'checked' : ''}></td></tr>`).join('')}</tbody></table></div></div>`).join('')}
  <datalist id="types">${TYPES.map(t => `<option value="${t}">`).join('')}</datalist>
  <h3 style="margin-top:18px">Relationships ${img ? '(read from the image)' : '(from foreign keys)'}</h3>${rv.rels.length ? rv.rels.map(r => `<div class="rev-item ${r.status}"><div class="row sb"><b>${esc(tn(r.a))} → ${esc(tn(r.b))}</b><span class="row">${stChip(r)}${r.unc ? '<span class="chip unc">unclear in image</span>' : ''}${img ? '' : confChip(r.conf)}</span></div><div class="grid g4" style="margin:8px 0;gap:8px"><label class="f">Name<input data-chg="wb-rname" data-id="${r.id}" value="${esc(r.name)}"></label><label class="f">${esc(tn(r.a))} side<select data-chg="wb-rca" data-id="${r.id}"><option value="1" ${r.ca === '1' ? 'selected' : ''}>1</option><option value="N" ${r.ca !== '1' ? 'selected' : ''}>N</option></select></label><label class="f">${esc(tn(r.b))} side<select data-chg="wb-rcb" data-id="${r.id}"><option value="1" ${r.cb === '1' ? 'selected' : ''}>1</option><option value="N" ${r.cb !== '1' ? 'selected' : ''}>N</option></select></label><label class="f">${esc(tn(r.a))} participation<select data-chg="wb-rpa" data-id="${r.id}"><option value="partial" ${r.pa !== 'total' ? 'selected' : ''}>Partial</option><option value="total" ${r.pa === 'total' ? 'selected' : ''}>Total</option></select></label></div>${r.note ? `<p class="small" style="margin:0 0 4px;color:var(--warn)">${esc(r.note)}</p>` : ''}<p class="small muted" style="margin:0">${esc(r.reason)}${r.viaJunction ? ' <b>This table looks like a junction table; see the M:N suggestion below.</b>' : ''}</p>${btns('rels', r)}</div>`).join('') : '<p class="small muted">No relationships detected.</p>'}
  ${rv.mns.length ? `<h3 style="margin-top:18px">Junction tables (possible M:N relationships)</h3>${rv.mns.map(x => `<div class="rev-item ${x.status}"><div class="row sb"><b>${esc(tn(x.a))} ⇄ ${esc(tn(x.b))} via ${esc(tn(x.tid))}</b>${stChip(x)}</div><label class="f" style="margin:8px 0">Relationship name<input data-chg="wb-mname" data-id="${x.id}" value="${esc(x.name)}"></label><p class="small muted" style="margin:0">${esc(x.reason)}${x.attrs.length ? ' Extra columns become relationship attributes: ' + esc(x.attrs.map(a => a.name).join(', ')) + '.' : ''}</p>${btns('mns', x)}</div>`).join('')}` : ''}
  <h3 style="margin-top:18px">Generalization / specialization</h3>${rv.isas.length ? rv.isas.map(g => `<div class="rev-item ${g.status}"><div class="row sb"><b>${g.kind === 'structural' ? 'Subclass tables of ' + esc(g.superName) : 'Possible common superclass'}</b><span class="row">${stChip(g)}${g.unc ? '<span class="chip unc">unclear in image</span>' : ''}${img ? '' : confChip(g.conf)}</span></div>
    <p class="small muted" style="margin:6px 0">${esc(g.reason)}</p><p class="small" style="margin:4px 0">Subclasses: <b>${g.subs.map(id => esc(tn(id))).join(', ')}</b></p>
    ${g.kind === 'common' ? `<div class="grid g2" style="gap:8px"><label class="f">Superclass name<input data-chg="wb-gsup" data-id="${g.id}" value="${esc(g.superName)}"></label><label class="f">Superclass key<input data-chg="wb-gkey" data-id="${g.id}" value="${esc(g.keyName)}"></label></div><div style="margin:8px 0"><b class="small">Attributes to move up:</b><div class="row" style="gap:12px">${g.common.map((c, i) => `<label class="ck small"><input type="checkbox" data-chg="wb-gcom" data-id="${g.id}" data-i="${i}" ${c.checked ? 'checked' : ''}> ${esc(c.name)}${c.fk ? ' <span class="dim">(shared foreign key)</span>' : ''}</label>`).join('')}</div></div>` : ''}
    <label class="ck small"><input type="checkbox" data-chg="wb-gdrop" data-id="${g.id}" ${g.dropKeys ? 'checked' : ''}> Subclasses inherit the key (drop their own key columns)</label>
    <div class="grid g2" style="gap:8px;margin-top:8px"><label class="f">Disjointness ${img ? (g.assumedD ? '(NOT shown in image: default, please set)' : '(read from image)') : '(assumed)'}<select data-chg="wb-gd" data-id="${g.id}"><option value="d" ${g.disjoint ? 'selected' : ''}>Disjoint (d)</option><option value="o" ${!g.disjoint ? 'selected' : ''}>Overlapping (o)</option></select></label><label class="f">Completeness ${img ? (g.assumedT ? '(NOT shown in image: default, please set)' : '(read from image)') : '(assumed)'}<select data-chg="wb-gt" data-id="${g.id}"><option value="p" ${!g.total ? 'selected' : ''}>Partial</option><option value="t" ${g.total ? 'selected' : ''}>Total</option></select></label></div>
    ${img ? '' : '<p class="xs muted" style="margin:6px 0 0">Tables and SQL cannot prove these two settings, so the defaults are assumptions. Set them from what you know about the data.</p>'}${btns('isas', g)}</div>`).join('') : '<p class="small muted">No generalization patterns detected.</p>'}
  ${rv.hints.map(h => `<div class="note small"><b>Suggestion:</b> ${esc(h)}</div>`).join('')}${rv.notes.map(h => `<div class="note small">${esc(h)}</div>`).join('')}
  <div class="card tight" style="margin-top:14px"><div class="row sb"><label class="f" style="flex-direction:row;align-items:center;gap:8px">Model name<input data-chg="wb-title" value="${esc(WB.title)}" style="width:220px"></label><button class="btn pri" data-act="wb-gen">Confirm &amp; Generate ER/EER</button></div>${img ? `<label class="ck small" style="margin-top:10px"><input type="checkbox" data-chg="wb-verify" ${WB.recog && WB.recog.verified ? 'checked' : ''}> I compared this result with my original image and corrected any mistakes.</label>` : ''}</div>`;
}
function wbBody() {
  if (WB.busy) return `<div class="card"><h3><span class="spin"></span> Analyzing…</h3><ul class="tight">${WB.busy.map((m, i) => `<li class="${i === WB.busy.length - 1 ? '' : 'muted'}">${esc(m)}</li>`).join('')}</ul></div>`;
  if (WB.step === 3 && WB.rev) return `<div class="row" style="margin-bottom:10px"><button class="btn sm" data-act="wb-back">← Back to input</button></div>` + reviewHTML();
  const errs = WB.errors.length ? `<div class="note warn">${WB.errors.map(e => `<div>${esc(e)}</div>`).join('')}</div>` : '';
  if (WB.tab === 'table') return `<div class="card" style="margin-bottom:12px"><h3>Paste or upload tables</h3><p class="small muted">Header row first, then data. Separate columns with <span class="mono">|</span>, tabs or commas. Separate several tables with a blank line and give each a name line such as <span class="mono"># STUDENT</span>.</p>
    <textarea id="wb-paste" rows="7" data-inp="wb-paste" placeholder="Student_ID | Name | Address&#10;101 | Arun | Chennai">${esc(WB.paste)}</textarea>
    <div class="row" style="margin-top:8px"><label class="ck small"><input type="checkbox" data-chg="wb-hdr" ${WB.firstHeader ? 'checked' : ''}> First row is the header</label><button class="btn sm pri" data-act="wb-parse">Parse pasted text</button><button class="btn sm" data-act="wb-sample" data-s="single">Sample: one table</button><button class="btn sm" data-act="wb-sample" data-s="multi">Sample: three tables</button><button class="btn sm" data-act="wb-csv">Upload CSV…</button><input type="file" id="wb-csvfile" data-chg="wb-csvfile" accept=".csv,.tsv,.txt,text/csv,text/plain" hidden></div></div>${errs}
    <div class="row sb" style="margin:6px 0 10px"><h3 style="margin:0">Tables (${WB.tables.length})</h3><div class="row"><button class="btn sm" data-act="wb-addtable">+ Empty table</button><button class="btn sm danger" data-act="wb-clear">Clear all</button></div></div>
    ${WB.tables.length ? WB.tables.map(sheetHTML).join('') + `<div class="row" style="justify-content:flex-end"><button class="btn pri" data-act="wb-analyze">Analyze tables</button></div>` : '<div class="empty">No tables yet. Paste some text, upload a CSV, or add an empty table to type into.</div>'}`;
  if (WB.tab === 'sql') { const r = WB.sqlRes; return `<div class="card"><h3>Paste SQL</h3><p class="small muted">CREATE TABLE statements with PRIMARY KEY and FOREIGN KEY work best. ALTER TABLE … ADD FOREIGN KEY is read too. Other statements are skipped and listed.</p><textarea id="wb-sql" rows="12" data-inp="wb-sqlin" spellcheck="false" placeholder="CREATE TABLE Person (...);">${esc(WB.sql)}</textarea><div class="row" style="margin-top:8px"><button class="btn sm pri" data-act="wb-sqlparse">Parse SQL</button><button class="btn sm" data-act="wb-sqlsample" data-s="sql1">Sample: Person / Student / Faculty</button><button class="btn sm" data-act="wb-sqlsample" data-s="sql2">Sample: Department / Course / Enrolls</button></div></div>
    ${r ? `${r.errors.length ? `<div class="note bad">${r.errors.map(e => `<div>${esc(e)}</div>`).join('')}</div>` : ''}${r.skipped.length ? `<div class="note warn"><b>Skipped:</b> ${r.skipped.map(e => `<div>${esc(e)}</div>`).join('')}</div>` : ''}${r.tables.length ? `<div class="card" style="margin-top:12px"><h3>Parsed ${r.tables.length} table(s)</h3><div class="scroll-x"><table class="t"><thead><tr><th>Table</th><th>Columns</th><th>Primary key</th><th>Foreign keys</th></tr></thead><tbody>${r.tables.map(t => `<tr><td><b>${esc(t.name)}</b></td><td>${esc(t.cols.join(', '))}</td><td>${esc((t.pk || []).join(', ') || 'none declared')}</td><td>${esc(t.fks.map(f => f.cols.join(',') + ' → ' + f.refName).join('; ') || 'none')}</td></tr>`).join('')}</tbody></table></div><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn pri" data-act="wb-sqlanalyze">Analyze structure</button></div></div>` : ''}` : ''}`; }
  return wbImageTab();
}
function wbCapHTML() {
  const c = WB.cap;
  const st = !c ? '<span class="chip">checking…</span>' : c.ok ? '<span class="chip ok">available</span>' : '<span class="chip bad">not available</span>';
  return `<div class="rev-item"><div class="row sb"><b class="small">Recognition capability</b>${st}</div>
  <p class="small muted" style="margin:6px 0 0">${!c ? 'Checking the EER Lab server…' : c.ok ? 'Reading uses: ' + esc(c.label) + '. The image is uploaded to the server, which sends it to the AI model.' : esc(c.why) + ' Uploading and previewing still work.'}</p></div>`;
}
function wbImageTab() {
  if (!WB.cap && !WB.capBusy) { WB.capBusy = true; visionCapability().then(c => { WB.cap = c; WB.capBusy = false; wbDraw(); }); }
  const e = WB.imgErr, canRead = WB.cap && WB.cap.ok && WB.img && WB.img.url;
  return `<div class="card"><h3>ER diagram image</h3><p class="small muted">Upload a PNG, JPG or WebP picture of an ER/EER diagram. It is shown here immediately and can always be used as a reference next to the Visualizer. If recognition is available, an AI model reads it and you review the result before anything is generated.</p>
    ${wbCapHTML()}
    <div class="row" style="margin-top:10px"><input type="file" id="wb-imgfile" data-chg="wb-img" accept="image/png,image/jpeg,image/webp,application/pdf,.png,.jpg,.jpeg,.webp,.pdf"></div>
    ${e ? `<div class="note bad" role="alert"><b>${esc(e.title)}.</b> ${esc(e.msg)}</div>` : ''}${WB.imgMsg ? `<div class="note ${WB.imgBusy ? '' : 'warn'}" role="status">${WB.imgBusy ? '<span class="spin"></span> ' : ''}${esc(WB.imgMsg)}</div>` : ''}
    ${WB.img ? `<div style="margin-top:12px"><b class="small">${esc(WB.img.name)}</b> <span class="xs muted">(${Math.round(WB.img.size / 1024)} KB)</span>${WB.img.url ? `<img src="${WB.img.url}" alt="Uploaded diagram" style="display:block;max-width:100%;max-height:340px;margin-top:8px;border-radius:8px;border:1px solid var(--line)">` : '<p class="small muted">PDF preview is not available here.</p>'}<div class="row" style="margin-top:10px"><button class="btn pri" data-act="wb-imgai" ${canRead && !WB.imgBusy ? '' : 'disabled'} ${WB.img.url && !canRead && WB.cap && !WB.cap.ok ? 'title="Recognition is not available. See the capability box above."' : ''}>${WB.imgBusy ? 'Reading…' : 'Read diagram with AI'}</button>${WB.imgBusy ? '<button class="btn danger" data-act="wb-imgstop">Stop</button>' : ''}<button class="btn" data-act="wb-imgblank">Open Visualizer with this reference</button><button class="btn" data-act="wb-imgtemplate">Start from a template</button></div></div>` : ''}</div>`;
}
VIEWS.workbench = () => {
  MOUNT = null; const steps = ['Input', 'Analysis', 'Review', 'Generate'], cur = WB.busy ? 2 : WB.step === 3 ? 3 : 1;
  return `<div class="page-h"><div><h2>Table / SQL Import</h2><p>Turn tables, CSV, SQL or an image into an EER diagram. Detected structures are suggestions: you review and confirm them before anything is generated.</p></div></div>
  <div class="steps-bar">${steps.map((s, i) => `<span class="${i + 1 === cur ? 'on' : i + 1 < cur ? 'done' : ''}">${i + 1}. ${s}</span>`).join('')}</div>
  ${WB.step === 3 || WB.busy ? '' : `<div class="tabs">${[['table', 'Tables / CSV'], ['sql', 'SQL'], ['image', 'ER diagram image']].map(t => `<button class="${WB.tab === t[0] ? 'on' : ''}" data-act="wb-tab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>`}<div id="wb-body">${wbBody()}</div>`;
};
const wbDraw = () => { if (CUR.name === 'workbench') rerender(); };
ACT['wb-tab'] = el => { WB.tab = el.dataset.t; wbDraw(); };
ACT['wb-back'] = () => { WB.step = 1; wbDraw(); };
INP['wb-paste'] = el => { WB.paste = el.value; }; INP['wb-sqlin'] = el => { WB.sql = el.value; }; INP['wb-hdr'] = el => { WB.firstHeader = el.checked; };
ACT['wb-sample'] = el => { WB.paste = SAMPLES[el.dataset.s]; const r = parsePasted(WB.paste, true); WB.tables = r.tables; WB.errors = r.errors; wbSave(); wbDraw(); };
ACT['wb-parse'] = async () => {
  WB.paste = $('#wb-paste').value; if (!WB.paste.trim()) return toast('Paste some table text first.', 'warn');
  if (WB.tables.some(t => t.rows.length) && !(await confirmBox('Replace the current tables with the parsed text?', 'Replace', false))) return;
  const r = parsePasted(WB.paste, WB.firstHeader); WB.tables = r.tables; WB.errors = r.errors; wbSave(); wbDraw(); if (r.tables.length) toast(`Parsed ${r.tables.length} table(s).`, 'ok');
};
ACT['wb-csv'] = () => $('#wb-csvfile').click();
INP['wb-csvfile'] = el => {
  const f = el.files[0]; el.value = ''; if (!f) return;
  if (!/\.(csv|tsv|txt)$/i.test(f.name)) { WB.errors = ['Unable to analyze this file format. Upload a .csv, .tsv or .txt file.']; return wbDraw(); }
  if (f.size > 2e6) { WB.errors = ['This file is larger than 2 MB. Use a smaller sample of the data.']; return wbDraw(); }
  const rd = new FileReader(); rd.onerror = () => { WB.errors = ['The file could not be read.']; wbDraw(); };
  rd.onload = () => { const r = parsePasted(String(rd.result), true); if (r.tables.length === 1) r.tables[0].name = f.name.replace(/\.[^.]+$/, '').toUpperCase().replace(/[^A-Z0-9_]+/g, '_'); WB.tables = WB.tables.concat(r.tables); WB.errors = r.errors; wbSave(); wbDraw(); if (r.tables.length) toast('Loaded ' + f.name, 'ok'); };
  rd.readAsText(f);
};
ACT['wb-addtable'] = () => { WB.tables.push(newTable('TABLE_' + (WB.tables.length + 1), ['ID', 'Name'], [['1', ''], ['2', '']])); wbSave(); wbDraw(); };
ACT['wb-clear'] = async () => { if (await confirmBox('Remove all tables from the workspace?', 'Clear')) { WB.tables = []; WB.errors = []; wbSave(); wbDraw(); } };
ACT['wb-deltable'] = async el => { if (await confirmBox('Delete this table?', 'Delete')) { WB.tables.splice(+el.dataset.t, 1); wbSave(); wbDraw(); } };
ACT['wb-addrow'] = el => { const t = WB.tables[+el.dataset.t]; t.rows.push(t.cols.map(() => '')); wbSave(); wbDraw(); };
ACT['wb-addcol'] = el => { const t = WB.tables[+el.dataset.t]; t.cols.push('Column_' + (t.cols.length + 1)); t.rows.forEach(r => r.push('')); wbSave(); wbDraw(); };
ACT['wb-delrow'] = el => { WB.tables[+el.dataset.t].rows.splice(+el.dataset.r, 1); wbSave(); wbDraw(); };
ACT['wb-delcol'] = el => { const t = WB.tables[+el.dataset.t]; if (t.cols.length <= 1) return toast('A table needs at least one column.', 'warn'); const c = +el.dataset.c; t.cols.splice(c, 1); t.rows.forEach(r => r.splice(c, 1)); wbSave(); wbDraw(); };
INP['wb-tname'] = el => { WB.tables[+el.dataset.t].name = el.value.trim() || 'TABLE'; wbSave(); };
INP['wb-col'] = el => { const t = WB.tables[+el.dataset.t], c = +el.dataset.c, v = el.value.trim(); if (!v) { el.value = t.cols[c]; return; } if (t.cols.some((x, i) => i !== c && x.toLowerCase() === v.toLowerCase())) { toast('Column names in one table must be different.', 'warn'); el.value = t.cols[c]; return; } t.cols[c] = v; wbSave(); };
INP['wb-cell'] = el => { WB.tables[+el.dataset.t].rows[+el.dataset.r][+el.dataset.c] = el.value; wbSave(); };
async function runAnalysis(tables) {
  const msgs = ['Reading ' + tables.length + ' table(s)…', 'Inferring column types and keys…', 'Looking for relationships…', 'Looking for generalization patterns…']; WB.busy = [];
  for (const m of msgs) { WB.busy.push(m); wbDraw(); await sleep(320); }
  WB.rev = analyze(tables); WB.busy = null; WB.step = 3; wbDraw();
}
ACT['wb-analyze'] = () => {
  if (!WB.tables.length) return toast('Add at least one table.', 'warn'); const bad = WB.tables.find(t => !t.cols.length);
  const names = WB.tables.map(t => t.name.toLowerCase()); if (new Set(names).size !== names.length) return toast('Two tables have the same name. Rename one.', 'warn');
  WB.sqlTables = null; WB.tab = 'table'; runAnalysis(WB.tables);
};
ACT['wb-reanalyze'] = () => runAnalysis(WB.sqlTables && WB.tab === 'sql' ? WB.sqlTables : WB.tables);
ACT['wb-sqlsample'] = el => { WB.sql = SAMPLES[el.dataset.s]; WB.sqlRes = parseSQL(WB.sql); WB.sqlTables = WB.sqlRes.tables; wbDraw(); };
ACT['wb-sqlparse'] = () => { WB.sql = $('#wb-sql').value; if (!WB.sql.trim()) return toast('Paste some SQL first.', 'warn'); WB.sqlRes = parseSQL(WB.sql); WB.sqlTables = WB.sqlRes.tables; wbDraw(); };
ACT['wb-sqlanalyze'] = () => { if (!WB.sqlTables || !WB.sqlTables.length) return; WB.tab = 'sql'; runAnalysis(WB.sqlTables); };
const rvEnt = id => WB.rev.entities.find(e => e.tid === id);
INP['wb-ename'] = el => { const e = rvEnt(el.dataset.id); e.name = el.value.trim() || e.name; const t = tById(el.dataset.id); if (t) t.name = e.name; };
INP['wb-ainc'] = el => { rvEnt(el.dataset.id).attrs[+el.dataset.i].include = el.checked; };
INP['wb-atype'] = el => { rvEnt(el.dataset.id).attrs[+el.dataset.i].type = el.value.trim() || 'VARCHAR(100)'; };
INP['wb-apk'] = el => { const a = rvEnt(el.dataset.id).attrs[+el.dataset.i]; a.pk = el.checked; if (a.pk) a.nn = true; };
INP['wb-rname'] = el => { revFind('rels', el.dataset.id).name = el.value.trim().replace(/\s+/g, '_') || 'Relates'; };
INP['wb-rca'] = el => { revFind('rels', el.dataset.id).ca = el.value; }; INP['wb-rcb'] = el => { revFind('rels', el.dataset.id).cb = el.value; }; INP['wb-rpa'] = el => { revFind('rels', el.dataset.id).pa = el.value; };
INP['wb-mname'] = el => { revFind('mns', el.dataset.id).name = el.value.trim().replace(/\s+/g, '_') || 'Relates'; };
INP['wb-gsup'] = el => { revFind('isas', el.dataset.id).superName = el.value.trim().toUpperCase().replace(/\s+/g, '_') || 'SUPERCLASS'; };
INP['wb-gkey'] = el => { revFind('isas', el.dataset.id).keyName = el.value.trim().replace(/\s+/g, '_') || 'ID'; };
INP['wb-gcom'] = el => { revFind('isas', el.dataset.id).common[+el.dataset.i].checked = el.checked; };
INP['wb-gdrop'] = el => { revFind('isas', el.dataset.id).dropKeys = el.checked; };
INP['wb-gd'] = el => { revFind('isas', el.dataset.id).disjoint = el.value === 'd'; }; INP['wb-gt'] = el => { revFind('isas', el.dataset.id).total = el.value === 't'; };
INP['wb-title'] = el => { WB.title = el.value.trim() || 'Imported model'; };
ACT['wb-status'] = el => { const x = revFind(el.dataset.k, el.dataset.id); x.status = el.dataset.s; wbDraw(); };
ACT['wb-confirmall'] = () => { [...WB.rev.rels, ...WB.rev.mns, ...WB.rev.isas].forEach(x => { if (x.status === 'detected') x.status = 'confirmed'; }); wbDraw(); };
ACT['wb-gen'] = async () => {
  const rv = WB.rev, items = [...rv.rels, ...rv.mns, ...rv.isas], un = items.filter(x => x.status === 'detected').length;
  if (rv.source === 'image' && !(WB.recog && WB.recog.verified)) return toast('Tick the box confirming you compared the result with your original image first.', 'warn', 6000);
  if (un && !(await confirmBox(`${un} detected item(s) have not been confirmed and will be left out. Generate anyway?`, 'Generate', false))) return;
  vInit(); if (V.m.entities.length && !V.fresh && !(await confirmBox('Replace the model in the Visualizer? You can restore the old one with Undo.', 'Replace', false))) return;
  const tables = WB.tab === 'sql' && WB.sqlTables ? WB.sqlTables : WB.tables, { model, warnings } = buildModel(rv, tables.concat(WB.aiTables || []).filter((t, i, a) => a.findIndex(x => x.id === t.id) === i), WB.title);
  if (!model.entities.length) return toast('Nothing to generate: every entity was excluded.', 'warn');
  vSnap(); V.m = model; V.sel = null; V.multi = []; V.fresh = false; vSave(); WB.step = 1; go('/visualizer');
  toast(`Generated ${model.entities.length} entities, ${model.rels.length} relationships and ${model.isas.length} ISA link(s). Use Undo to go back.`, 'ok', 6000); warnings.forEach(w => toast(w, 'warn', 7000));
};
/* image tab */
INP['wb-img'] = async el => {
  const f = el.files[0]; if (!f) return;
  WB.imgMsg = ''; WB.imgErr = null; WB.img = null; WB.imgFile = null; WB.recog = null;
  const v = await validateDiagramFile(f);
  if (!v.ok) { WB.imgErr = { title: 'This file cannot be used', msg: v.msg }; return wbDraw(); }
  WB.imgFile = f;
  if (v.pdf) { WB.img = { name: f.name, size: f.size, url: null }; WB.imgMsg = 'PDFs cannot be previewed or read automatically. Export the diagram as PNG, JPG or WebP to use "Read diagram with AI".'; return wbDraw(); }
  const rd = new FileReader();
  rd.onerror = () => { WB.imgFile = null; WB.imgErr = { title: 'The image could not be read', msg: 'The browser could not load this file. Try selecting it again.' }; wbDraw(); };
  rd.onload = () => { WB.img = { name: f.name, size: f.size, url: String(rd.result) }; wbDraw(); };
  rd.readAsDataURL(f);
};
const setRef = () => { V.ref = { name: WB.img.name, img: WB.img.url }; };
ACT['wb-imgblank'] = () => { vInit(); vSnap(); V.m = newModel('From reference image'); V.fresh = false; setRef(); vSave(); go('/visualizer'); };
ACT['wb-imgtemplate'] = () => { vInit(); vSnap(); V.m = modelOf('person'); V.fresh = false; setRef(); vSave(); go('/visualizer'); };
ACT['wb-imgstop'] = () => { if (WB.aiCtl) WB.aiCtl.abort(); };
INP['wb-einc'] = el => { rvEnt(el.dataset.id).include = el.checked; };
INP['wb-verify'] = el => { if (WB.recog) WB.recog.verified = el.checked; };

/* Convert a validated recognition result into the workbench review structure. Nothing touches the Visualizer model here. */
function recogToReview(res, provider) {
  const tabs = res.entities.map(e => {
    const seen = new Set(), attrs = e.attributes.filter(a => { const k = a.name.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
    const t = newTable(e.name, attrs.map(a => a.name), []); if (!t.cols.length) t.cols = ['ID'];
    t.source = 'image'; t.fks = []; t.pk = attrs.filter(a => a.key).map(a => a.name); if (!t.pk.length) t.pk = null; t._fks = e.foreignKeys || []; t._unc = e.uncertain; t._attrUnc = new Set(attrs.filter(a => a.uncertain).map(a => a.name)); return t;
  });
  const byName = n => tabs.find(t => t.name.toLowerCase() === String(n || '').toLowerCase());
  const rev = { source: 'image', entities: [], rels: [], mns: [], isas: [], hints: [], notes: ['Read from your image by ' + provider + '. It may contain mistakes. Compare with the original before confirming.'] };
  tabs.forEach(t => rev.entities.push({ tid: t.id, name: t.name, rows: 0, include: true, unc: !!t._unc, pkConf: t.pk ? 'likely' : 'none', pkNote: (t.pk ? 'Key attribute(s) marked in the image: ' + t.pk.join(', ') + '.' : 'No key attribute was marked in the image.') + (t._fks.length ? ' Foreign key(s) marked in the image: ' + t._fks.map(f => f.attribute + ' → ' + f.references).join(', ') + '.' : ''), attrs: t.cols.map(c => ({ name: c, type: 'VARCHAR(100)', pk: !!(t.pk && t.pk.includes(c)), nn: !!(t.pk && t.pk.includes(c)), include: true, unc: t._attrUnc.has(c) })) }));
  res.relationships.forEach(r => {
    const A = byName(r.a), B = byName(r.b), miss = [];
    if (r.cardA == null || r.cardB == null) miss.push('cardinality');
    if (r.totalA == null || r.totalB == null) miss.push('participation (total/partial)');
    rev.rels.push({ id: uid('rl'), fkTid: A.id, cols: [], refCols: [], a: A.id, b: B.id, ca: r.cardA === '1' ? '1' : 'N', cb: r.cardB === '1' ? '1' : 'N', pa: r.totalA ? 'total' : 'partial', pb: r.totalB ? 'total' : 'partial', name: (r.name || 'Relates').replace(/\s+/g, '_'), status: 'detected', unc: r.uncertain, note: miss.length ? 'Not shown in the image: ' + miss.join(' and ') + '. A default is filled in. Please set it yourself.' : '', reason: 'Read from the image.' });
  });
  res.isas.forEach(g => {
    const S = byName(g.superclass), subs = g.subclasses.map(byName).filter(Boolean);
    rev.isas.push({ id: uid('is'), kind: 'structural', superName: S.name, superTid: S.id, subs: subs.map(x => x.id), common: [], keyName: '', dropKeys: true, disjoint: g.disjoint == null ? true : g.disjoint, total: g.total == null ? false : g.total, assumedD: g.disjoint == null, assumedT: g.total == null, status: 'detected', unc: g.uncertain, reason: 'Read from the image: ' + S.name + ' is specialized into ' + subs.map(x => x.name).join(', ') + '.' });
  });
  (res.uncertain || []).forEach(x => rev.notes.push('Unclear in image: ' + x));
  return { tabs, rev };
}
ACT['wb-imgai'] = async () => {
  if (WB.imgBusy || !WB.imgFile) return;
  WB.imgErr = null; WB.imgBusy = true; WB.imgMsg = 'Sending the image to the AI and reading the diagram. This can take up to a minute.'; WB.aiCtl = new AbortController(); wbDraw();
  try {
    const { result, provider, img } = await recognizeDiagram(WB.imgFile, WB.aiCtl.signal);
    const { tabs, rev } = recogToReview(result, provider);
    WB.recog = { result, provider, file: WB.img.name, url: WB.img.url, dims: img, verified: false };
    WB.aiTables = tabs; WB.rev = rev; WB.step = 3; WB.imgMsg = '';
  } catch (e) {
    const code = e instanceof RecogError ? e.code : 'api';
    if (code === 'cancelled') WB.imgMsg = 'Stopped. Nothing was recognised or changed.';
    else { WB.imgMsg = ''; WB.imgErr = { code, title: RECOG_ERR_TITLE[code] || 'Recognition failed', msg: e.message || 'Unknown error.' }; if (code === 'unavailable') WB.cap = null; }
    if (!(e instanceof RecogError)) console.error(e);
  }
  WB.imgBusy = false; WB.aiCtl = null; wbDraw();
};

/* ===================== LEARN ===================== */
const MQ = {}, TS = {};
const TRY_FOR = { generalization: 'uni', specialization: 'emp', 'super-sub': 'cus', isa: 'veh', 'attr-inherit': 'uni', 'rel-inherit': 'emp', disjoint: 'veh', overlapping: 'hos', total: 'bank', partial: 'uni', 'gen-vs-spec': 'emp', 'eer-examples': 'hos', 'exam-problems': 'bank', 'map-gen-spec': 'veh' };
const stCls = id => DB.progress[id] === 'dn' ? 'dn' : DB.progress[id] === 'ip' ? 'ip' : '';
const stTxt = id => DB.progress[id] === 'dn' ? 'Completed' : DB.progress[id] === 'ip' ? 'In progress' : 'Not started';
function recordAnswer(qid, topic, ok, sec) {
  const g = DB.tagg[topic] = DB.tagg[topic] || { n: 0, ok: 0, t: 0 }; g.n++; if (ok) g.ok++; if (sec != null) g.t += Math.round(sec); DB.save('tagg');
  if (/^(ai|cq):/.test(qid)) return;
  const p = DB.pstats[qid] = DB.pstats[qid] || { n: 0, ok: 0, topic, times: [] }; p.n++; if (ok) p.ok++; p.topic = topic; p.last = Date.now(); if (sec != null) { p.times.push(Math.round(sec)); p.times = p.times.slice(-10); } DB.save('pstats');
}
function tocHTML(cur) { return `<nav class="toc" aria-label="Topics">${GROUPS.map(g => `<h4>${g}</h4>` + TOPICS.filter(t => t.g === g).map(t => `<a href="#/learn/${t.id}" class="${t.id === cur ? 'on' : ''}"><span class="st ${stCls(t.id)}"></span>${esc(t.t)}</a>`).join('')).join('')}</nav>`; }
VIEWS.learn = id => {
  if (!id || !topicById(id)) {
    const done = TOPICS.filter(t => DB.progress[t.id] === 'dn').length, next = TOPICS.find(t => DB.progress[t.id] !== 'dn') || TOPICS[0];
    return `<div class="page-h"><div><h2>Learn path</h2><p>From ER basics to EER mapping in ${TOPICS.length} topics. Each topic has a definition, an analogy, a worked example, exam notes and a mini quiz.</p></div><a class="btn pri" href="#/learn/${next.id}">${done ? 'Continue: ' : 'Start: '}${esc(next.t)}</a></div>
    <div class="card" style="margin-bottom:16px"><div class="row sb"><b>${done} of ${TOPICS.length} completed</b><span class="small muted">${pct(done, TOPICS.length)}%</span></div><div class="bar" style="margin-top:8px"><i style="width:${pct(done, TOPICS.length)}%"></i></div></div>
    ${GROUPS.map(g => `<h3 style="margin-top:18px">${g}</h3><div class="grid ga">${TOPICS.filter(t => t.g === g).map((t, i) => `<a class="card" href="#/learn/${t.id}" style="color:inherit;text-decoration:none"><div class="row sb"><span class="chip ${stCls(t.id) === 'dn' ? 'ok' : stCls(t.id) === 'ip' ? 'warn' : ''}">${stTxt(t.id)}</span></div><h4 style="margin:8px 0 4px">${esc(t.t)}</h4><span class="small muted">${esc(t.what.length > 110 ? t.what.slice(0, 108) + '…' : t.what)}</span></a>`).join('')}</div>`).join('')}`;
  }
  const t = topicById(id); if (!DB.progress[id]) { DB.progress[id] = 'ip'; DB.save('progress'); }
  MOUNT = () => { loadGallery(id); };
  const idx = TOPICS.indexOf(t), sec = (k, title, body) => body ? `<section class="sec" id="s-${k}"><h3>${title}</h3>${body}</section>` : '';
  const list = a => `<ul class="tight">${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const vids = DB.videos.filter(v => v.topic === id), ex = t.exam || {}, extra = DB.extras[id] || {};
  const pipe = t.pipe ? (() => { const m = modelOf(t.pipe), r = toRelational(m, 'own'), exm = EXAMPLES.find(e => e.model === t.pipe); return `${exm ? `<div class="note"><b>Problem.</b> ${esc(exm.problem)}</div><p class="small"><b>Analysis.</b></p>${list(exm.analysis)}` : ''}${staticSVG(m)}<div class="scroll-x" style="margin:10px 0">${schemaHTML(r.tables)}</div><details class="acc"><summary>Show the generated SQL</summary><div><pre class="code">${hiSQL(toSQL(r.tables))}</pre></div></details><div class="row" style="margin-top:8px"><button class="btn sm" data-act="open-model" data-m="${t.pipe}">Open this model in the Visualizer</button></div>`; })() : '';
  const widget = t.widget === 'cw' ? constraintWidget('l-' + id) : t.widget === 'gen' ? genWidget('l-' + id) : t.widget === 'strat' ? stratWidget() : '';
  const vizH = t.viz && !t.widget && !t.pipe ? staticSVG(modelOf(t.viz)) : (t.viz && t.pipe ? '' : '');
  const examH = (ex.defs || ex.freq || ex.traps || ex.short) ? ['defs|Key definitions', 'freq|Frequently asked', 'traps|Common traps', 'pat|MCQ patterns', 'short|Short-answer questions', 'long|Long-answer questions', 'gate|GATE-style concept points', 'net|UGC NET-style concept points', 'univ|University-exam style'].filter(x => ex[x.split('|')[0]]).map(x => `<details class="acc"><summary>${x.split('|')[1]}</summary><div>${list(ex[x.split('|')[0]])}</div></details>`).join('') + '<p class="xs muted">These are study notes written for this app. They are not previous-year questions.</p>' : '';
  return `<div class="learn">${tocHTML(id)}<article><div class="row sb"><div><span class="chip">${esc(t.g)}</span> <span class="chip ${stCls(id) === 'dn' ? 'ok' : 'warn'}">${stTxt(id)}</span></div><span class="small muted">Topic ${idx + 1} of ${TOPICS.length}</span></div><h2 style="margin-top:8px">${esc(t.t)}</h2>
  ${sec('what', 'What is it?', `<p>${esc(t.what)}</p>`)}${sec('beg', 'Beginner explanation', `<div class="note ok">${esc(t.beg)}</div>`)}${sec('why', 'Why do we need it?', `<p>${esc(t.why)}</p>`)}${sec('how', 'How it works', t.how ? `<ol class="steps">${t.how.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : '')}
  ${sec('terms', 'Terminology', t.terms ? `<div class="scroll-x"><table class="t"><tbody>${t.terms.map(x => `<tr><th style="width:32%">${esc(x[0])}</th><td>${esc(x[1])}</td></tr>`).join('')}</tbody></table></div>` : '')}
  ${sec('visual', 'Visual explanation', widget || vizH)}${sec('real', 'Real-world example', t.real ? `<p>${esc(t.real)}</p>` : '')}${sec('ex', 'Step-by-step example: ' + esc(t.ex ? t.ex.t : ''), t.ex ? `<ol class="steps">${t.ex.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : '')}
  ${sec('pipe', 'Problem → analysis → diagram → schema → SQL', pipe)}${sec('mist', 'Common mistakes', t.mist ? list(t.mist) : '')}${sec('exam', 'Exam focus', examH)}
  ${sec('vid', 'Curated Video Lecture', vids.length ? `<div class="col" style="gap:14px">${vids.map(v => {
    const done = !!(DB.vdone && DB.vdone[v.id]);
    return `<div class="vid-card ${done ? 'done' : ''}">
      <div class="row sb" style="margin-bottom:6px">
        <span class="chip ${done ? 'ok' : 'info'}">${done ? ico('check') + ' Completed' : 'Curated Lecture'}</span>
        <div class="row">
          <button class="btn xs ${done ? 'on' : 'pri'}" data-act="vcomp" data-id="${v.id}">${done ? '✓ Completed' : 'Mark Completed'}</button>
          ${DB.settings.editor ? `<button class="btn xs danger" data-act="vid-del" data-id="${v.id}">Remove</button>` : ''}
        </div>
      </div>
      <h4 style="margin:4px 0 4px">${esc(v.title)}</h4>
      <div class="xs muted" style="margin-bottom:6px">${esc(v.channel || '')}${v.duration ? ' · ' + esc(v.duration) : ''}</div>
      ${ytEmbedHTML(v.url, v.title)}
      ${v.desc ? `<p class="small muted" style="margin:6px 0">${esc(v.desc)}</p>` : ''}
    </div>`;
  }).join('')}</div>` : `<div class="empty">No curated video available for this topic yet.${DB.settings.editor ? '<br><a href="#/admin/videos">Add a verified YouTube link</a>' : ''}</div>`)}
  ${sec('img', 'Our Learning Images', `<div id="gal-${id}" class="gal"><span class="muted small">Loading images…</span></div>${DB.settings.editor ? `<div class="row" style="margin-top:8px"><button class="btn sm" data-act="img-add" data-t="${id}">Upload image</button><input type="file" id="img-file" data-chg="img-file" accept="image/png,image/jpeg,image/webp,image/gif" hidden></div>` : ''}`)}
  ${sec('notes', 'Team notes', extra.notes ? `<div class="card tight" style="white-space:pre-wrap">${esc(extra.notes)}</div>${DB.settings.editor ? `<button class="btn xs" data-act="notes-edit" data-t="${id}" style="margin-top:6px">Edit notes</button>` : ''}` : (DB.settings.editor ? `<button class="btn sm" data-act="notes-edit" data-t="${id}">Add notes for this topic</button>` : ''))}
  ${sec('quiz', 'Mini quiz', t.quiz ? mqHTML(id) : '')}${TRY_FOR[id] ? sec('try', 'Try yourself', tryHTML(TRY_FOR[id])) : ''}
  ${sec('sum', 'Summary', `<div class="card tight"><b>${esc(t.sum)}</b></div>`)}
  <div class="row" style="margin:6px 0 18px"><button class="btn ${DB.progress[id] === 'dn' ? 'on' : 'pri'}" data-act="mark" data-t="${id}">${DB.progress[id] === 'dn' ? '✓ Completed (click to undo)' : 'Mark as completed'}</button><a class="btn" href="#/visualizer">Try in Visualizer</a><a class="btn" href="#/practice/${id}">Practice this topic</a><a class="btn" href="#/competitive">Competitive Questions</a>${t.link ? `<a class="btn pri" href="#/${t.link}">Open ${esc(t.t)}</a>` : ''}</div>
  <div class="row sb">${idx > 0 ? `<a class="btn" href="#/learn/${TOPICS[idx - 1].id}">← ${esc(TOPICS[idx - 1].t)}</a>` : '<span></span>'}${t.next ? `<a class="btn pri" href="#/learn/${t.next}">Next: ${esc(topicById(t.next).t)} →</a>` : '<span></span>'}</div></article></div>`;
};
ACT.mark = el => { const id = el.dataset.t; DB.progress[id] = DB.progress[id] === 'dn' ? 'ip' : 'dn'; DB.save('progress'); rerender(); };
ACT['open-model'] = el => { vInit(); vSnap(); V.m = modelOf(el.dataset.m); V.sel = null; V.multi = []; V.fresh = false; vSave(); go('/visualizer'); };
function mqHTML(id) {
  const t = topicById(id), st = MQ[id] = MQ[id] || { a: [] }, answered = st.a.filter(x => x != null).length, score = t.quiz.reduce((s, q, i) => s + (st.a[i] === q.a ? 1 : 0), 0);
  return t.quiz.map((q, qi) => `<div class="card tight" style="margin-bottom:10px"><b>${qi + 1}. ${esc(q.q)}</b>${q.o.map((o, oi) => { const has = st.a[qi] != null, cls = !has ? '' : oi === q.a ? 'right' : st.a[qi] === oi ? 'wrong' : ''; return `<button class="opt ${cls}" data-act="mq" data-t="${id}" data-q="${qi}" data-o="${oi}" ${has ? 'disabled' : ''}><b>${'ABCD'[oi]}</b><span>${esc(o)}</span></button>`; }).join('')}${st.a[qi] != null ? `<div class="note ${st.a[qi] === q.a ? 'ok' : 'bad'} small">${st.a[qi] === q.a ? 'Correct. ' : 'Not quite. '}${esc(q.e)}</div>` : ''}</div>`).join('') + (answered === t.quiz.length ? `<div class="note ${score === t.quiz.length ? 'ok' : ''}"><b>Score: ${score}/${t.quiz.length}.</b> ${score === t.quiz.length ? 'Great work.' : 'Review the explanations above, then try the topic again.'} <button class="btn xs" data-act="mq-reset" data-t="${id}">Retry quiz</button></div>` : '');
}
ACT.mq = el => { const id = el.dataset.t, qi = +el.dataset.q, oi = +el.dataset.o, st = MQ[id] = MQ[id] || { a: [] }; if (st.a[qi] != null) return; st.a[qi] = oi; const q = topicById(id).quiz[qi]; recordAnswer('mq:' + id + ':' + qi, id, oi === q.a, null); const y = window.scrollY; rerender(); window.scrollTo(0, y); };
ACT['mq-reset'] = el => { MQ[el.dataset.t] = { a: [] }; rerender(); };
function tryHTML(tid) {
  const s = TRY.find(x => x.id === tid), st = TS[tid] || {}; const all = [...new Set([...s.supOpts])], r = (name, val, label, chk) => `<label class="ck small"><input type="radio" name="${name}" value="${val}" ${chk ? 'checked' : ''} ${st.done ? 'disabled' : ''}> ${label}</label>`;
  return `<div class="card" id="try-${tid}"><p><b>${esc(s.title)}.</b> ${esc(s.text)}</p><div class="grid g2"><div><b class="small">1. Superclass</b><div class="col" style="margin:6px 0">${all.map(o => r('sup-' + tid, o, o, st.sup === o)).join('')}</div></div><div><b class="small">2. Subclasses (choose all that apply)</b><div class="col" style="margin:6px 0">${s.subOpts.map(o => `<label class="ck small"><input type="checkbox" class="sub-${tid}" value="${o}" ${(st.subs || []).includes(o) ? 'checked' : ''} ${st.done ? 'disabled' : ''}> ${o}</label>`).join('')}</div></div><div><b class="small">3. Disjoint or overlapping?</b><div class="col" style="margin:6px 0">${r('d-' + tid, 'd', 'Disjoint (d)', st.d === 'd')}${r('d-' + tid, 'o', 'Overlapping (o)', st.d === 'o')}</div></div><div><b class="small">4. Total or partial?</b><div class="col" style="margin:6px 0">${r('t-' + tid, 't', 'Total', st.t === 't')}${r('t-' + tid, 'p', 'Partial', st.t === 'p')}</div></div></div>
  ${st.done ? `<div class="note ${st.score === 4 ? 'ok' : 'warn'}"><b>${st.score}/4 correct.</b> ${st.fb.map(esc).join(' ')}<br>${esc(s.why)}</div><button class="btn sm" data-act="try-reset" data-id="${tid}">Try again</button>` : `<button class="btn pri sm" data-act="try-check" data-id="${tid}">Check my answer</button>`}</div>`;
}
ACT['try-check'] = el => {
  const tid = el.dataset.id, s = TRY.find(x => x.id === tid), v = n => (document.querySelector(`input[name="${n}-${tid}"]:checked`) || {}).value, subs = $$(`.sub-${tid}:checked`).map(x => x.value);
  const st = { sup: v('sup'), subs, d: v('d'), t: v('t'), done: true, fb: [] }; if (!st.sup || !st.d || !st.t || !subs.length) return toast('Answer all four parts first.', 'warn');
  const okSup = st.sup === s.sup, okSub = subs.length === s.subs.length && s.subs.every(x => subs.includes(x)), okD = (st.d === 'd') === s.d, okT = (st.t === 't') === s.t;
  st.score = [okSup, okSub, okD, okT].filter(Boolean).length; st.fb = [okSup ? 'Superclass ✓.' : `Superclass: ${s.sup}.`, okSub ? 'Subclasses ✓.' : `Subclasses: ${s.subs.join(', ')}.`, okD ? 'Disjointness ✓.' : `Should be ${s.d ? 'disjoint' : 'overlapping'}.`, okT ? 'Completeness ✓.' : `Should be ${s.t ? 'total' : 'partial'}.`];
  TS[tid] = st; [['sup', okSup], ['sub', okSub], ['d', okD], ['t', okT]].forEach(([k, ok]) => recordAnswer('try:' + tid + ':' + k, CUR.args[0] || 'eer-model', ok, null)); const y = window.scrollY; rerender(); window.scrollTo(0, y);
};
ACT['try-reset'] = el => { delete TS[el.dataset.id]; const y = window.scrollY; rerender(); window.scrollTo(0, y); };
/* gallery */
async function loadGallery(tid) {
  const box = $('#gal-' + tid); if (!box) return;
  try { const all = (await IDB.all()).filter(i => i.topic === tid); box.innerHTML = all.length ? all.map(i => `<figure><img src="${i.data}" alt="${esc(i.title)}" data-act="img-zoom" data-id="${i.id}" tabindex="0"><figcaption><b>${esc(i.title)}</b><div class="xs muted">${esc(i.caption || '')}</div>${DB.settings.editor ? `<button class="btn xs danger" data-act="img-del" data-id="${i.id}" style="margin-top:4px">Delete</button>` : ''}</figcaption></figure>`).join('') : '<div class="empty" style="grid-column:1/-1">No images added for this topic yet.</div>'; }
  catch (e) { box.innerHTML = `<div class="note warn" style="grid-column:1/-1">Image storage is not available in this browser (${esc(e.message || 'error')}). Images cannot be shown or saved.</div>`; }
}
ACT['img-zoom'] = async el => { try { const i = (await IDB.all()).find(x => x.id === el.dataset.id); if (i) openModal(`<div class="row sb"><b>${esc(i.title)}</b><button class="btn xs" data-act="closemodal">Close</button></div><div style="overflow:auto;max-height:75vh;margin-top:10px"><img id="zimg" src="${i.data}" alt="${esc(i.title)}" style="max-width:100%;cursor:zoom-in" data-act="img-z2"></div><p class="xs muted">Click the image to toggle full size.</p>`, { wide: true }); } catch (e) { toast('Could not open the image.', 'error'); } };
ACT['img-z2'] = el => { el.style.maxWidth = el.style.maxWidth === 'none' ? '100%' : 'none'; };
ACT['img-add'] = el => { window.__imgTopic = el.dataset.t; $('#img-file').click(); };
INP['img-file'] = el => {
  const f = el.files[0]; el.value = ''; if (!f) return;
  if (!/^image\/(png|jpeg|webp|gif)$/.test(f.type)) return toast('Unable to use this file. Choose a PNG, JPG, WebP or GIF image.', 'error'); if (f.size > 4e6) return toast('This image is larger than 4 MB. Choose a smaller one.', 'error');
  const rd = new FileReader(); rd.onerror = () => toast('The image could not be read.', 'error');
  rd.onload = async () => { const title = await promptBox('Image title', 'Title', f.name.replace(/\.[^.]+$/, '')); if (!title) return; const caption = (await promptBox('Caption (optional)', 'Caption', '')) || ''; try { await IDB.put({ id: uid('img'), topic: window.__imgTopic, title, caption, data: String(rd.result), order: Date.now() }); toast('Image saved in this browser.', 'ok'); if (CUR.name === 'admin') rerender(); else loadGallery(window.__imgTopic); } catch (e) { toast('Could not save the image: ' + (e.message || 'storage error'), 'error'); } };
  rd.readAsDataURL(f);
};
ACT['img-del'] = async el => { if (!(await confirmBox('Delete this image?', 'Delete'))) return; try { await IDB.del(el.dataset.id); loadGallery(CUR.args[0]); } catch (e) { toast('Could not delete: ' + e.message, 'error'); } };
ACT['vid-del'] = async el => { if (!(await confirmBox('Remove this video?', 'Remove'))) return; DB.videos = DB.videos.filter(v => v.id !== el.dataset.id); DB.save('videos'); rerender(); };
ACT['notes-edit'] = el => { const id = el.dataset.t; openModal(`<h3>Team notes</h3><textarea id="nt" rows="9" style="font-family:var(--f-body)">${esc((DB.extras[id] || {}).notes || '')}</textarea><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" data-act="closemodal">Cancel</button><button class="btn pri" data-act="notes-save" data-t="${id}">Save</button></div>`); };
ACT['notes-save'] = el => { const v = $('#nt').value.trim(); DB.extras[el.dataset.t] = { notes: v }; if (!v) delete DB.extras[el.dataset.t]; DB.save('extras'); closeModal(); rerender(); };

/* ===================== EXAMPLES ===================== */
VIEWS.examples = id => {
  const ex = EXAMPLES.find(e => e.id === id);
  if (!ex) return `<div class="page-h"><div><h2>Examples</h2><p>Eight worked models. Each has a problem, analysis, diagram, constraints, explanation, relational schema and SQL.</p></div></div><div class="grid ga">${EXAMPLES.map(e => `<a class="card" href="#/examples/${e.id}" style="color:inherit;text-decoration:none"><span class="chip acc">${esc(e.tag)}</span><h4 style="margin:8px 0 6px">${esc(e.title)}</h4>${staticSVG(modelOf(e.model)).replace('<div class="cw">', '<div class="cw" style="pointer-events:none">')}<p class="small muted" style="margin:8px 0 0">${esc(e.cons)}</p></a>`).join('')}</div>`;
  const i = EXAMPLES.indexOf(ex), m = modelOf(ex.model), strat = EXS[ex.id] || 'own', r = toRelational(m, strat);
  return `<div class="page-h"><div><a href="#/examples" class="small">← All examples</a><h2>${esc(ex.title)}</h2></div><div class="row"><button class="btn pri" data-act="open-model" data-m="${ex.model}">Open in Visualizer</button><a class="btn" href="#/practice">Practice</a></div></div>
  <div class="grid g2"><div class="card"><h3>Problem</h3><p>${esc(ex.problem)}</p><h3>Analysis</h3><ol class="steps">${ex.analysis.map(a => `<li>${esc(a)}</li>`).join('')}</ol><p><span class="chip acc">${esc(ex.cons)}</span></p><h3>Explanation</h3><p>${esc(ex.explain)}</p></div><div class="card"><h3>EER diagram</h3>${staticSVG(m)}</div></div>
  <div class="card" style="margin-top:14px"><div class="row sb"><h3 style="margin:0">Relational schema and SQL</h3><label class="row small">Mapping <select data-chg="ex-strat" data-id="${ex.id}" style="width:auto">${Object.entries(MAP_STRATS).map(([k, v]) => `<option value="${k}" ${k === strat ? 'selected' : ''}>${esc(v[0])}</option>`).join('')}</select></label></div><div class="scroll-x" style="margin:10px 0">${schemaHTML(r.tables)}</div><pre class="code">${hiSQL(toSQL(r.tables))}</pre>${r.notes.length ? `<ul class="tight small muted">${r.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}</div>
  <div class="row sb" style="margin-top:14px">${i > 0 ? `<a class="btn" href="#/examples/${EXAMPLES[i - 1].id}">← ${esc(EXAMPLES[i - 1].title)}</a>` : '<span></span>'}${i < EXAMPLES.length - 1 ? `<a class="btn" href="#/examples/${EXAMPLES[i + 1].id}">${esc(EXAMPLES[i + 1].title)} →</a>` : '<span></span>'}</div>`;
};
const EXS = {}; INP['ex-strat'] = el => { EXS[el.dataset.id] = el.value; rerender(); };
