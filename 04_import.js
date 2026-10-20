/* ===== Import: tables, CSV, SQL, analysis ===== */
const nrm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const GENERIC = new Set(['id', 'no', 'code', 'key', 'name', 'number']);
const isIdName = s => /(^id$|_id$|[a-z]id$|^code$|_code$|_no$|^no$|number$|^key$|^roll)/i.test(String(s).trim());
const newTable = (name, cols, rows) => ({ id: uid('t'), name, cols, rows: rows || [], pk: null, fks: [], types: {}, nn: {}, uq: {}, source: 'manual' });

function splitDelim(line, d) {
  if (d === '|') return line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(s => s.trim());
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) { const ch = line[i]; if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; } else if (ch === '"') q = true; else if (ch === d) { out.push(cur.trim()); cur = ''; } else cur += ch; }
  out.push(cur.trim()); return out;
}
function detectDelim(lines) { const s = lines.join('\n'); if (s.includes('|')) return '|'; if (s.includes('\t')) return '\t'; if (s.includes(';') && !s.includes(',')) return ';'; return ','; }
function guessName(cols) { const c = cols.find(x => /_?id$/i.test(x) && x.replace(/_?id$/i, '').length > 1); return c ? c.replace(/_?id$/i, '').toUpperCase() : 'TABLE_1'; }
function parsePasted(text, firstHeader = true) {
  const errors = [], tables = []; const blocks = text.replace(/\r/g, '').split(/\n\s*\n/).map(b => b.split('\n').map(l => l.trim()).filter(Boolean)).filter(b => b.length);
  blocks.forEach((lines, bi) => {
    let name = null; const hasD = l => /[|\t,;]/.test(l);
    if (lines.length > 1 && !hasD(lines[0])) { const m = /^[#\[\s]*([A-Za-z_][\w ]*?)[\]:\s]*$/.exec(lines[0]); if (m) { name = m[1].trim(); lines = lines.slice(1); } }
    lines = lines.filter(l => !/^[\s|:\-+]+$/.test(l) || !/-/.test(l)); lines = lines.filter(l => !/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(l));
    if (!lines.length) return;
    const d = detectDelim(lines); let rows = lines.map(l => splitDelim(l, d));
    if (rows.length === 1 && firstHeader) { errors.push(`Block ${bi + 1}: found a header row but no data rows. The table was created with headers only.`); }
    const head = firstHeader ? rows[0] : rows[0].map((_, i) => 'Column_' + (i + 1)); const body = firstHeader ? rows.slice(1) : rows;
    const w = head.length; const cols = head.map((h, i) => h || 'Column_' + (i + 1));
    const seen = {}; cols.forEach((c, i) => { const k = c.toLowerCase(); if (seen[k]) cols[i] = c + '_' + (seen[k]++ + 1); else seen[k] = 1; });
    const t = newTable(name || (blocks.length === 1 ? guessName(cols) : 'TABLE_' + (tables.length + 1)), cols, body.map(r => { const x = r.slice(0, w); while (x.length < w) x.push(''); return x; }));
    if (body.some(r => r.length !== w)) errors.push(`${t.name}: some rows had a different number of columns than the header. They were padded or trimmed to ${w} columns.`);
    tables.push(t);
  });
  if (!tables.length) errors.push('No table found. Paste a header row followed by data rows, separated by |, tabs or commas.');
  return { tables, errors };
}

/* SQL parser */
function splitOn(s, ch) {
  const out = []; let cur = '', d = 0, q = null;
  for (const c of s) { if (q) { cur += c; if (c === q) q = null; continue; } if (c === "'" || c === '"' || c === '`') { q = c; cur += c; continue; } if (c === '(') d++; if (c === ')') d--; if (c === ch && d <= 0) { out.push(cur); cur = ''; continue; } cur += c; }
  if (cur.trim()) out.push(cur); return out.map(x => x.trim()).filter(Boolean);
}
const unq = s => s.trim().replace(/^[`"\[]|[`"\]]$/g, '');
const idList = s => s.split(',').map(unq);
function parseSQL(src) {
  const errors = [], skipped = [], tables = [], alters = [];
  const s = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
  splitOn(s, ';').forEach(st => {
    let m = /^CREATE\s+(?:TEMP(?:ORARY)?\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"\[]?[\w.]+[`"\]]?)\s*\(/i.exec(st);
    if (m) {
      const name = unq(m[1]).split('.').pop(), start = m[0].length; let d = 1, i = start;
      for (; i < st.length && d > 0; i++) { if (st[i] === '(') d++; else if (st[i] === ')') d--; }
      if (d !== 0) { errors.push(`Table ${name}: the parentheses do not match.`); return; }
      const t = newTable(name, [], []); t.source = 'sql';
      splitOn(st.slice(start, i - 1), ',').forEach(part => {
        let mm;
        if ((mm = /^(?:CONSTRAINT\s+\S+\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i.exec(part))) { t.pk = idList(mm[1]); return; }
        if ((mm = /^(?:CONSTRAINT\s+\S+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([`"\[]?[\w.]+[`"\]]?)\s*(?:\(([^)]+)\))?/i.exec(part))) { t.fks.push({ cols: idList(mm[1]), refName: unq(mm[2]).split('.').pop(), refCols: mm[3] ? idList(mm[3]) : null }); return; }
        if (/^(?:CONSTRAINT\s+\S+\s+)?(UNIQUE|CHECK|INDEX|KEY|FULLTEXT)\b/i.test(part)) { skipped.push(`${name}: ignored "${part.slice(0, 32)}"`); return; }
        if ((mm = /^([`"\[]?\w+[`"\]]?)\s+([A-Za-z]+(?:\s*\([^)]*\))?)([\s\S]*)$/.exec(part))) {
          const c = unq(mm[1]); t.cols.push(c); t.types[c] = mm[2].replace(/\s+/g, '').toUpperCase(); const rest = mm[3];
          if (/PRIMARY\s+KEY/i.test(rest)) { t.pk = t.pk || []; t.pk.push(c); } if (/NOT\s+NULL|PRIMARY\s+KEY/i.test(rest)) t.nn[c] = true; if (/\bUNIQUE\b/i.test(rest)) t.uq[c] = true;
          const r = /REFERENCES\s+([`"\[]?[\w.]+[`"\]]?)\s*(?:\(([^)]+)\))?/i.exec(rest); if (r) t.fks.push({ cols: [c], refName: unq(r[1]).split('.').pop(), refCols: r[2] ? idList(r[2]) : null });
        } else skipped.push(`${name}: could not read "${part.slice(0, 32)}"`);
      });
      if (!t.cols.length) { errors.push(`Table ${name} has no readable columns.`); return; }
      tables.push(t); return;
    }
    m = /^ALTER\s+TABLE\s+([`"\[]?[\w.]+[`"\]]?)\s+ADD\s+(?:CONSTRAINT\s+\S+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([`"\[]?[\w.]+[`"\]]?)\s*(?:\(([^)]+)\))?/i.exec(st);
    if (m) { alters.push({ table: unq(m[1]).split('.').pop(), fk: { cols: idList(m[2]), refName: unq(m[3]).split('.').pop(), refCols: m[4] ? idList(m[4]) : null } }); return; }
    skipped.push('Skipped unsupported statement: ' + st.replace(/\s+/g, ' ').slice(0, 44));
  });
  alters.forEach(a => { const t = tables.find(x => x.name.toLowerCase() === a.table.toLowerCase()); if (t) t.fks.push(a.fk); else skipped.push(`ALTER TABLE ${a.table}: table not found in the pasted SQL.`); });
  tables.forEach(t => t.fks.forEach(f => { const r = tables.find(x => x.name.toLowerCase() === f.refName.toLowerCase()); if (r) { f.refTid = r.id; if (!f.refCols) f.refCols = r.pk ? r.pk.slice() : [r.cols[0]]; } else skipped.push(`${t.name} references ${f.refName}, which is not in the pasted SQL. That reference is ignored.`); }));
  if (!tables.length && !errors.length) errors.push('No CREATE TABLE statements were found. Paste standard SQL such as CREATE TABLE Person (person_id INT PRIMARY KEY, ...);');
  return { tables, errors, skipped };
}

/* Analysis */
function inferType(t, c) {
  if (t.types && t.types[c]) return t.types[c];
  const i = t.cols.indexOf(c), v = t.rows.map(r => (r[i] || '').trim()).filter(Boolean);
  if (/phone|mobile|zip|pin|contact/i.test(c)) return 'VARCHAR(20)';
  if (!v.length) return /(_id|^id)$/i.test(c) ? 'INT' : 'VARCHAR(100)';
  if (v.every(x => /^-?\d+$/.test(x)) && !v.some(x => x.length > 1 && x[0] === '0')) return v.some(x => x.length > 9) ? 'BIGINT' : 'INT';
  if (v.every(x => /^-?\d+(\.\d+)?$/.test(x))) return v.every(x => Math.abs(+x) < 10 && (x.split('.')[1] || '').length <= 2) && /gpa|cgpa/i.test(c) ? 'DECIMAL(3,2)' : 'DECIMAL(10,2)';
  if (v.every(x => /^\d{4}-\d{2}-\d{2}$/.test(x))) return 'DATE';
  if (v.every(x => /^(true|false)$/i.test(x))) return 'BOOLEAN';
  const L = Math.max(...v.map(x => x.length)); return /gender|code|type|status/i.test(c) && L <= 20 ? 'VARCHAR(20)' : L > 200 ? 'TEXT' : L > 100 ? 'VARCHAR(200)' : 'VARCHAR(100)';
}
const colVals = (t, c) => { const i = t.cols.indexOf(c); return t.rows.map(r => (r[i] || '').trim()); };
const isUnique = (t, cs) => { if (!t.rows.length) return false; const s = new Set(); for (const r of t.rows) { const k = cs.map(c => (r[t.cols.indexOf(c)] || '').trim().toLowerCase()); if (k.some(x => x === '')) return false; const j = k.join('\u0001'); if (s.has(j)) return false; s.add(j); } return true; };

function inferPK(t) {
  if (t.pk && t.pk.length) return { cols: t.pk, conf: 'declared', note: `Declared in the SQL as PRIMARY KEY (${t.pk.join(', ')}).` };
  const n = t.rows.length, single = t.cols.filter(c => isUnique(t, [c])), idc = single.filter(isIdName);
  if (!n) { const c = t.cols.find(isIdName); return c ? { cols: [c], conf: 'possible', note: `There are no rows to test, so ${c} is suggested from its name only. Please confirm.` } : { cols: [], conf: 'none', note: 'Not enough information to determine a primary key: the table has no rows and no column looks like an identifier.' }; }
  const pick = idc[0] || single[0];
  if (pick) { const strong = n >= 3 && isIdName(pick); return { cols: [pick], conf: strong ? 'likely' : 'possible', note: `${pick} appears to uniquely identify each row (${n} of ${n} values are distinct).` + (n < 3 ? ' Only ' + n + ' row(s) were tested, so this is weak evidence.' : '') + (isIdName(pick) ? '' : ' The column name does not look like an identifier, so please check it.') }; }
  if (n >= 3) for (let i = 0; i < t.cols.length; i++) for (let j = i + 1; j < t.cols.length; j++) if (isUnique(t, [t.cols[i], t.cols[j]])) return { cols: [t.cols[i], t.cols[j]], conf: 'possible', note: `No single column is unique, but ${t.cols[i]} together with ${t.cols[j]} is. This could be a composite key.` };
  return { cols: [], conf: 'none', note: 'Not enough information to determine a primary key: no column (or pair of columns) is unique across the rows.' };
}

const SUPER_HINTS = [[/manager|engineer|developer|tester|clerk|salesman|worker/i, 'Employee'], [/student|faculty|teacher|professor|staff|employee|doctor|patient|customer|person|user|member|lecturer/i, 'Person'], [/car|bike|truck|bus|vehicle|scooter|van/i, 'Vehicle'], [/saving|current|checking|loan|account/i, 'Account'], [/circle|square|rectangle|shape|triangle/i, 'Shape']];
function suggestSuper(names) { for (const [re, out] of SUPER_HINTS) if (names.every(n => re.test(n))) return out; for (const [re, out] of SUPER_HINTS) if (names.some(n => re.test(n))) return out; return 'Superclass_1'; }

function analyze(tables) {
  const rev = { entities: [], rels: [], mns: [], isas: [], hints: [], notes: [] };
  const byId = Object.fromEntries(tables.map(t => [t.id, t])); const pkInfo = {};
  tables.forEach(t => { pkInfo[t.id] = inferPK(t); });
  const fkList = {};   // tid -> [{cols, refTid, refCols, src, conf, reason}]
  tables.forEach(t => {
    const list = [];
    if (t.source === 'sql') t.fks.forEach(f => { if (f.refTid) list.push({ cols: f.cols, refTid: f.refTid, refCols: f.refCols, src: 'sql', conf: 'likely', reason: `Declared in the SQL: FOREIGN KEY (${f.cols.join(', ')}) REFERENCES ${byId[f.refTid].name}.` }); });
    else tables.forEach(B => {
      if (B.id === t.id) return; const bp = pkInfo[B.id].cols; if (bp.length !== 1) return; const p = bp[0];
      t.cols.forEach(c => {
        const byName = nrm(c) === nrm(p) && !GENERIC.has(nrm(c)), byTable = ['id', 'code', 'no', 'number'].some(sfx => nrm(c) === nrm(B.name) + sfx) && nrm(c) !== nrm(p);
        if (!byName && !byTable) return;
        let reason = byName ? `Column ${c} has the same name as the key ${p} of ${B.name}.` : `Column ${c} looks like a reference to ${B.name}.`, conf = 'possible';
        if (t.rows.length && B.rows.length) { const bv = new Set(colVals(B, p).map(x => x.toLowerCase())), av = colVals(t, c).filter(Boolean); if (av.length && av.every(x => bv.has(x.toLowerCase()))) { conf = 'likely'; reason += ` All ${av.length} value(s) also appear in ${B.name}.${p}.`; } else if (av.length) reason += ` Some values do not appear in ${B.name}.${p}, so check the data.`; }
        list.push({ cols: [c], refTid: B.id, refCols: [p], src: 'inferred', conf, reason });
      });
    });
    fkList[t.id] = list;
  });
  const isSubOf = {};  // structural ISA: tid -> {sup, conf, reason}
  tables.forEach(t => { const pk = pkInfo[t.id].cols; if (!pk.length) return; (fkList[t.id] || []).forEach(f => { if (f.refTid !== t.id && f.cols.length === pk.length && f.cols.every(c => pk.includes(c))) { if (!isSubOf[t.id]) isSubOf[t.id] = { sup: f.refTid, conf: f.src === 'sql' ? 'likely' : f.conf, reason: f.src === 'sql' ? `${t.name}'s primary key (${pk.join(', ')}) is also a foreign key to ${byId[f.refTid].name}. That is the usual way a subclass table is built.` : `${t.name}'s key ${pk.join(', ')} matches the key of ${byId[f.refTid].name}. ${f.reason}` }; } }); });
  /* junctions */
  const junction = {};
  tables.forEach(t => { const fl = (fkList[t.id] || []).filter(f => !isSubOf[t.id] || isSubOf[t.id].sup !== f.refTid); const pk = pkInfo[t.id].cols; const fcols = new Set(fl.flatMap(f => f.cols)); const nonfk = t.cols.filter(c => !fcols.has(c));
    if (fl.length >= 2 && new Set(fl.map(f => f.refTid)).size >= 2 && ((pk.length >= 2 && pk.every(c => fcols.has(c))) || (t.source !== 'sql' && nonfk.length <= 2 && !pk.some(c => !fcols.has(c))))) junction[t.id] = fl.slice(0, 2); });
  /* entities */
  tables.forEach(t => { const pk = pkInfo[t.id]; rev.entities.push({ tid: t.id, name: t.name, rows: t.rows.length, pkConf: pk.conf, pkNote: pk.note, attrs: t.cols.map(c => ({ name: c, type: inferType(t, c), pk: pk.cols.includes(c), nn: !!t.nn[c] || pk.cols.includes(c), include: true })) }); });
  /* relationships */
  tables.forEach(t => (fkList[t.id] || []).forEach(f => {
    if (isSubOf[t.id] && isSubOf[t.id].sup === f.refTid && f.cols.every(c => pkInfo[t.id].cols.includes(c))) return;
    const B = byId[f.refTid], pk = pkInfo[t.id].cols, unique = f.cols.every(c => pk.length === 1 && pk[0] === c) || (f.cols.length === 1 && (t.uq[f.cols[0]] || (t.source !== 'sql' && isUnique(t, f.cols) && t.rows.length >= 3)));
    const total = f.cols.every(c => t.nn[c] || (t.rows.length && colVals(t, c).every(Boolean)));
    rev.rels.push({ id: uid('rl'), fkTid: t.id, cols: f.cols, refCols: f.refCols, a: t.id, b: f.refTid, ca: unique ? '1' : 'N', cb: '1', pa: total ? 'total' : 'partial', pb: 'partial', name: unique ? 'Has' : 'Belongs_To', status: 'detected', conf: f.conf, reason: f.reason + (t.rows.length ? '' : ' Participation is a guess because there is no row data.'), viaJunction: !!junction[t.id] });
  }));
  Object.entries(junction).forEach(([tid, fl]) => { const t = byId[tid], fcols = new Set(fl.flatMap(f => f.cols)); rev.mns.push({ id: uid('mn'), tid, a: fl[0].refTid, b: fl[1].refTid, name: t.name, attrs: t.cols.filter(c => !fcols.has(c) && !pkInfo[tid].cols.includes(c)).map(c => ({ name: c, type: inferType(t, c) })), status: 'detected', reason: `${t.name} holds foreign keys to both ${byId[fl[0].refTid].name} and ${byId[fl[1].refTid].name}, and its key is made of them. That is how an M:N relationship is stored.` }); });
  /* structural ISA groups */
  const groups = {}; Object.entries(isSubOf).forEach(([tid, v]) => { (groups[v.sup] = groups[v.sup] || []).push({ tid, ...v }); });
  const claimed = new Set();
  Object.entries(groups).forEach(([sup, subs]) => { subs.forEach(s => claimed.add(s.tid)); claimed.add(sup); rev.isas.push({ id: uid('is'), kind: 'structural', superName: byId[sup].name, superTid: sup, subs: subs.map(s => s.tid), common: [], keyName: '', dropKeys: true, disjoint: true, total: false, status: 'detected', conf: subs.every(s => s.conf === 'likely') ? 'likely' : 'possible', reason: subs[0].reason + (subs.length > 1 ? ` The same pattern appears in ${subs.length} tables.` : ''), assumed: true }); });
  /* common-attribute ISA candidates */
  const keyish = t => new Set([...pkInfo[t.id].cols, ...(fkList[t.id] || []).flatMap(f => f.cols)]);
  const nonKey = t => t.cols.filter(c => !keyish(t).has(c));
  const cand = tables.filter(t => !claimed.has(t.id) && !junction[t.id]); const pairs = [];
  for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) { const a = nonKey(cand[i]), bn = new Set(nonKey(cand[j]).map(nrm)); const com = a.filter(c => bn.has(nrm(c))); if (com.length >= 2) pairs.push({ i: cand[i], j: cand[j], com }); }
  pairs.sort((x, y) => y.com.length - x.com.length); const used = new Set();
  pairs.forEach(p => {
    if (used.has(p.i.id) || used.has(p.j.id)) return; let cl = [p.i, p.j], com = p.com.map(nrm);
    cand.forEach(t => { if (cl.includes(t) || used.has(t.id)) return; const tn = new Set(nonKey(t).map(nrm)); const nc = com.filter(x => tn.has(x)); if (nc.length >= 2) { cl.push(t); com = nc; } });
    cl.forEach(t => used.add(t.id)); const names = cl.map(t => t.name), sup = suggestSuper(names);
    const shared = cl[0].cols.filter(c => keyish(cl[0]).has(c) && !pkInfo[cl[0].id].cols.includes(c) && cl.every(t => t.cols.some(x => nrm(x) === nrm(c))));
    rev.isas.push({ id: uid('is'), kind: 'common', superName: sup.toUpperCase(), superTid: null, subs: cl.map(t => t.id), common: [...com.map(x => ({ name: cl[0].cols.find(c => nrm(c) === x), checked: true })), ...shared.map(c => ({ name: c, checked: false, fk: true }))], keyName: sup + '_ID', dropKeys: true, disjoint: true, total: false, status: 'detected', conf: 'possible', reason: `${names.join(', ')} share ${com.length} attribute(s) (${cl[0].cols.filter(c => com.includes(nrm(c))).join(', ')}). Shared attributes can mean a common superclass, but they can also be a coincidence. Please review.`, assumed: true });
  });
  /* hints */
  tables.forEach(t => t.cols.forEach(c => { if (keyish(t).has(c) || !/dept|department|course|branch|category|company|project|team|city/i.test(c) || tables.some(x => nrm(x.name) === nrm(c))) return; const v = colVals(t, c).filter(Boolean); if (v.length >= 2 && new Set(v.map(x => x.toLowerCase())).size < v.length) rev.hints.push(`Column "${c}" in ${t.name} has repeated values (${[...new Set(v)].slice(0, 3).join(', ')}). If ${c} has details of its own, model it as a separate entity and add a relationship. Add a second table for it to try that.`); }));
  if (tables.length === 1) rev.notes.push('Only one table was provided, so relationships and superclass structures cannot be inferred. Add more tables to detect them.');
  return rev;
}

function buildModel(rev, tables, title) {
  const m = newModel(title || 'Imported model'), warnings = [], byT = {}, tById = Object.fromEntries(tables.map(t => [t.id, t]));
  const okMn = rev.mns.filter(x => x.status === 'confirmed'), junction = new Set(okMn.map(x => x.tid));
  const okRel = rev.rels.filter(r => r.status === 'confirmed' && !junction.has(r.fkTid)), okIsa = rev.isas.filter(x => x.status === 'confirmed');
  const dropCols = {}; okRel.forEach(r => { (dropCols[r.fkTid] = dropCols[r.fkTid] || new Set()); r.cols.forEach(c => dropCols[r.fkTid].add(c)); });
  rev.entities.forEach(re => { if (junction.has(re.tid) || re.include === false) return; const attrs = re.attrs.filter(a => a.include && !(dropCols[re.tid] && dropCols[re.tid].has(a.name) && !a.pk)).map(a => attr(a.name, a.type, (a.pk ? 'pk|' : '') + (a.nn ? 'nn' : ''))); byT[re.tid] = addEntity(m, re.name.toUpperCase(), attrs); });
  const subDone = new Set();
  okIsa.forEach(g => {
    const subs = g.subs.filter(t => byT[t] && !subDone.has(t)); if (subs.length < g.subs.length) warnings.push(`Some tables in the ${g.superName} group already belong to another confirmed group and were skipped.`); if (!subs.length) return;
    let sup;
    if (g.kind === 'structural') { sup = byT[g.superTid]; if (!sup) return; subs.forEach(t => { const e = byT[t]; e.attrs = e.attrs.filter(a => !(g.dropKeys && a.pk)); }); m.isas.push({ id: uid('i'), superId: sup.id, subIds: subs.map(t => byT[t].id), disjoint: g.disjoint, total: g.total, x: null, y: null }); }
    else { const lifted = g.common.filter(c => c.checked).map(c => c.name); sup = generalize(m, subs.map(t => byT[t].id), g.superName || 'SUPERCLASS', lifted, g.keyName || 'ID', g.dropKeys); const isa = m.isas[m.isas.length - 1]; isa.disjoint = g.disjoint; isa.total = g.total; }
    subs.forEach(t => subDone.add(t));
  });
  okRel.forEach(r => { const A = byT[r.a], B = byT[r.b]; if (!A || !B) { warnings.push(`Relationship ${r.name} was skipped because one of its tables is missing.`); return; } m.rels.push({ id: uid('r'), name: r.name, ends: [{ entity: A.id, card: r.ca, part: r.pa }, { entity: B.id, card: r.cb, part: r.pb }], attrs: [], identifying: false, x: 0, y: 0 }); });
  okMn.forEach(x => { const A = byT[x.a], B = byT[x.b]; if (!A || !B) return; m.rels.push({ id: uid('r'), name: x.name, ends: [{ entity: A.id, card: 'N', part: 'partial' }, { entity: B.id, card: 'N', part: 'partial' }], attrs: x.attrs.map(a => ({ ...a })), identifying: false, x: 0, y: 0 }); });
  layout(m); return { model: m, warnings };
}

/* samples */
const SAMPLES = {
  single: 'Student_ID | Name | Address | Phone | Department\n101 | Arun | Chennai | 9876 | CSE\n102 | Priya | Chennai | 9877 | CSE',
  multi: '# STUDENT\nStudent_ID | Name | Address | Phone | CGPA | Department_ID\n101 | Arun | Chennai | 9876 | 8.5 | D1\n102 | Priya | Madurai | 9877 | 9.1 | D1\n103 | Kavin | Salem | 9878 | 7.9 | D2\n\n# FACULTY\nFaculty_ID | Name | Address | Phone | Salary | Department_ID\nF1 | Dr. Rao | Chennai | 9001 | 90000 | D1\nF2 | Dr. Meena | Trichy | 9002 | 95000 | D2\nF3 | Dr. Iqbal | Chennai | 9003 | 88000 | D1\n\n# DEPARTMENT\nDepartment_ID | Department_Name\nD1 | Computer Science\nD2 | Electronics',
  sql1: 'CREATE TABLE Person (\n    person_id INT PRIMARY KEY,\n    name VARCHAR(100),\n    address VARCHAR(200),\n    phone VARCHAR(20)\n);\n\nCREATE TABLE Student (\n    person_id INT PRIMARY KEY,\n    cgpa DECIMAL(3,2),\n    FOREIGN KEY (person_id) REFERENCES Person(person_id)\n);\n\nCREATE TABLE Faculty (\n    person_id INT PRIMARY KEY,\n    salary DECIMAL(10,2),\n    FOREIGN KEY (person_id) REFERENCES Person(person_id)\n);',
  sql2: 'CREATE TABLE Department (\n    dept_id INT PRIMARY KEY,\n    dept_name VARCHAR(100)\n);\n\nCREATE TABLE Course (\n    course_id INT PRIMARY KEY,\n    title VARCHAR(100)\n);\n\nCREATE TABLE Student (\n    student_id INT PRIMARY KEY,\n    name VARCHAR(100) NOT NULL,\n    dept_id INT NOT NULL,\n    FOREIGN KEY (dept_id) REFERENCES Department(dept_id)\n);\n\nCREATE TABLE Enrolls (\n    student_id INT,\n    course_id INT,\n    grade VARCHAR(2),\n    PRIMARY KEY (student_id, course_id),\n    FOREIGN KEY (student_id) REFERENCES Student(student_id),\n    FOREIGN KEY (course_id) REFERENCES Course(course_id)\n);'
};
