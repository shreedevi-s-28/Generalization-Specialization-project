/* ===== EER model, layout, rendering, mapping ===== */
const TYPES = ['INT', 'BIGINT', 'VARCHAR(20)', 'VARCHAR(50)', 'VARCHAR(100)', 'VARCHAR(200)', 'TEXT', 'DECIMAL(10,2)', 'DECIMAL(3,2)', 'FLOAT', 'DATE', 'DATETIME', 'BOOLEAN'];
let SHOW_INH = false;
const snake = s => String(s).trim().replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase() || 'col';
const tname = s => snake(s).split('_').map(cap).join('_');
const newModel = (name = 'Untitled model') => ({ id: uid('m'), name, entities: [], rels: [], isas: [] });
const attr = (name, type = 'VARCHAR(100)', flags = '') => { const f = String(flags).split('|'); return { id: uid('a'), name, type: type || 'VARCHAR(100)', pk: f.includes('pk'), fk: f.includes('fk'), nn: f.includes('nn') || f.includes('pk'), ref: '' }; };
const ent = (m, id) => m.entities.find(e => e.id === id);
function addEntity(m, name, attrs = [], x = 0, y = 0) { const e = { id: uid('e'), name, x, y, weak: false, attrs }; m.entities.push(e); return e; }

function mk(name, spec) {
  const m = newModel(name), by = {};
  for (const [en, as] of Object.entries(spec.E)) { const e = addEntity(m, en, as.map(s => { const [n, t, f] = s.split(':'); return attr(n, t, f || ''); })); by[en] = e; if ((spec.W || []).includes(en)) e.weak = true; }
  (spec.ISA || []).forEach(i => m.isas.push({ id: uid('i'), superId: by[i.sup].id, subIds: i.subs.map(s => by[s].id), disjoint: i.d !== false, total: !!i.t }));
  (spec.R || []).forEach(r => m.rels.push({ id: uid('r'), name: r.n, ends: [{ entity: by[r.a[0]].id, card: r.a[1], part: r.a[2] === 't' ? 'total' : 'partial' }, { entity: by[r.b[0]].id, card: r.b[1], part: r.b[2] === 't' ? 'total' : 'partial' }], attrs: (r.at || []).map(s => { const [n, t] = s.split(':'); return { name: n, type: t || 'VARCHAR(100)' }; }), identifying: !!r.id, x: 0, y: 0 }));
  layout(m); return m;
}

/* hierarchy helpers */
const isaOfSub = (m, id) => m.isas.find(i => i.subIds.includes(id));
function ancestors(m, e) { const out = []; let cur = e, g = 0; while (g++ < 12) { const i = isaOfSub(m, cur.id); if (!i) break; cur = ent(m, i.superId); if (!cur || out.includes(cur)) break; out.push(cur); } return out; }
const inheritedAttrs = (m, e) => ancestors(m, e).flatMap(a => a.attrs.map(x => ({ ...x, from: a.name })));

/* geometry */
function entW(e) { const nm = Math.max(0, ...e.attrs.map(a => a.name.length + (a.fk ? 5 : 0))), tp = Math.max(0, ...e.attrs.map(a => a.type.length)); return Math.max(178, e.name.length * 11 + 40, 34 + nm * 8.2 + tp * 7.2); }
function entH(m, e) { const n = e.attrs.length + (SHOW_INH && m ? inheritedAttrs(m, e).length : 0); return 30 + Math.max(1, n) * 20 + 12; }
const cxy = (m, e) => ({ x: e.x + entW(e) / 2, y: e.y + entH(m, e) / 2 });
function rectEdge(m, e, tx, ty) { const w = entW(e), h = entH(m, e), c = cxy(m, e), dx = tx - c.x, dy = ty - c.y; if (!dx && !dy) return c; const s = Math.min(dx ? (w / 2) / Math.abs(dx) : 1e9, dy ? (h / 2) / Math.abs(dy) : 1e9); return { x: c.x + dx * s, y: c.y + dy * s }; }
const relHW = r => Math.max(54, (r.name || '').length * 4.6 + 26), relHH = 32;
function diaEdge(r, tx, ty) { const dx = tx - r.x, dy = ty - r.y; if (!dx && !dy) return { x: r.x, y: r.y }; const t = 1 / (Math.abs(dx) / relHW(r) + Math.abs(dy) / relHH); return { x: r.x + dx * t, y: r.y + dy * t }; }
const toward = (x1, y1, x2, y2, d) => { const L = Math.hypot(x2 - x1, y2 - y1) || 1; return { x: x1 + (x2 - x1) / L * d, y: y1 + (y2 - y1) / L * d }; };
function isaXY(m, i) { if (i.x == null || i.y == null) { const s = ent(m, i.superId); if (s) { const c = cxy(m, s); i.x = c.x; i.y = s.y + entH(m, s) + 52; } else { i.x = 0; i.y = 0; } } return i; }

function layout(m) {
  const kids = {}, subSet = new Set();
  m.isas.forEach(i => i.subIds.forEach(s => { subSet.add(s); (kids[i.superId] = kids[i.superId] || []).push(s); }));
  const SLOT = 265, depth = {}, seen = new Set();
  const wd = (id, d = 0) => { const k = kids[id] || []; if (!k.length || d > 8) return 1; return Math.max(1, k.reduce((a, c) => a + wd(c, d + 1), 0)); };
  let left = 0;
  const place = (id, l, d) => { const e = ent(m, id); if (!e || seen.has(id)) return 0; seen.add(id); const w = wd(id); e.x = l + w * SLOT / 2 - entW(e) / 2; depth[id] = d; let cl = l; (kids[id] || []).forEach(c => { cl += place(c, cl, d + 1) * SLOT; }); return w; };
  m.entities.filter(e => !subSet.has(e.id)).forEach(e => { left += place(e.id, left, 0) * SLOT + 90; });
  m.entities.forEach(e => { if (!seen.has(e.id)) { e.x = left; depth[e.id] = 0; left += SLOT; } });
  const rows = {}; m.entities.forEach(e => { const d = depth[e.id] || 0; rows[d] = Math.max(rows[d] || 0, entH(m, e)); });
  const ys = {}; let y = 40; Object.keys(rows).map(Number).sort((a, b) => a - b).forEach(d => { ys[d] = y; y += rows[d] + 135; });
  m.entities.forEach(e => { e.y = ys[depth[e.id] || 0]; });
  m.isas.forEach(i => { i.x = i.y = null; isaXY(m, i); });
  m.rels.forEach(r => { const a = ent(m, r.ends[0].entity), b = ent(m, r.ends[1].entity); if (!a || !b) return; const ca = cxy(m, a), cb = cxy(m, b); r.x = (ca.x + cb.x) / 2; r.y = (ca.y + cb.y) / 2; if (Math.abs(a.y - b.y) < 5) { if (Math.abs(ca.x - cb.x) > 400) r.y -= 60; else r.y = Math.max(a.y + entH(m, a), b.y + entH(m, b)) + relHH + 40; } });
  relax(m);
  return m;
}
/* push relationship diamonds apart from each other and from entity boxes */
function relax(m) {
  for (let it = 0; it < 60; it++) {
    let moved = false;
    for (let i = 0; i < m.rels.length; i++) for (let j = i + 1; j < m.rels.length; j++) {
      const a = m.rels[i], b = m.rels[j], need = relHW(a) + relHW(b) + 26, dx = b.x - a.x, dy = b.y - a.y;
      if (Math.abs(dx) < need && Math.abs(dy) < relHH * 2 + 14) { const px = need - Math.abs(dx), py = relHH * 2 + 14 - Math.abs(dy); if (py <= px) { const s = dy >= 0 ? 1 : -1; a.y -= s * py / 2; b.y += s * py / 2; } else { const s = dx >= 0 ? 1 : -1; a.x -= s * px / 2; b.x += s * px / 2; } moved = true; }
    }
    m.rels.forEach(r => m.entities.forEach(e => {
      const w = entW(e), h = entH(m, e), hw = relHW(r) + 10, hh = relHH + 10, ex = e.x + w / 2, ey = e.y + h / 2, dx = r.x - ex, dy = r.y - ey, ox = hw + w / 2 - Math.abs(dx), oy = hh + h / 2 - Math.abs(dy);
      if (ox > 0 && oy > 0) { if (oy < ox) r.y += (dy >= 0 ? 1 : -1) * oy; else r.x += (dx >= 0 ? 1 : -1) * ox; moved = true; }
    }));
    if (!moved) break;
  }
}

function bounds(m) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const add = (a, b, c, d) => { x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, c); y1 = Math.max(y1, d); };
  m.entities.forEach(e => add(e.x, e.y, e.x + entW(e), e.y + entH(m, e))); m.rels.forEach(r => add(r.x - relHW(r), r.y - relHH, r.x + relHW(r), r.y + relHH)); m.isas.forEach(i => { isaXY(m, i); add(i.x - 40, i.y - 18, i.x + 40, i.y + 18); });
  if (x0 > x1) return { x: 0, y: 0, w: 400, h: 300 }; return { x: x0 - 30, y: y0 - 30, w: x1 - x0 + 60, h: y1 - y0 + 60 };
}

/* SVG rendering */
function dline(x1, y1, x2, y2, dbl, cls = '') {
  if (!dbl) return `<line class="edge ${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const L = Math.hypot(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1) / L * 2.4, ny = (x2 - x1) / L * 2.4;
  return `<line class="edge ${cls}" x1="${x1 + nx}" y1="${y1 + ny}" x2="${x2 + nx}" y2="${y2 + ny}"/><line class="edge ${cls}" x1="${x1 - nx}" y1="${y1 - ny}" x2="${x2 - nx}" y2="${y2 - ny}"/>`;
}
function entSVG(m, e, cls) {
  const w = entW(e), h = entH(m, e), inh = SHOW_INH ? inheritedAttrs(m, e) : [];
  let s = `<g class="node-ent ${cls}" data-kind="ent" data-id="${e.id}" transform="translate(${e.x},${e.y})"><rect class="box" width="${w}" height="${h}" rx="7"/>`;
  if (e.weak) s += `<rect class="box" x="4" y="4" width="${w - 8}" height="${h - 8}" rx="5" style="fill:none;stroke-width:1"/>`;
  s += `<rect class="head" x="1" y="1" width="${w - 2}" height="29" rx="6"/><text class="nm" x="${w / 2}" y="21" text-anchor="middle">${esc(e.name)}</text>`;
  let y = 48;
  inh.forEach(a => { s += `<text class="inh" x="12" y="${y}">${esc(a.name)}</text><text class="ty" x="${w - 10}" y="${y}" text-anchor="end">inherited from ${esc(a.from)}</text>`; y += 20; });
  if (!e.attrs.length && !inh.length) s += `<text class="inh" x="12" y="48">(no attributes yet)</text>`;
  e.attrs.forEach(a => { const st = a.pk ? (e.weak ? 'text-decoration:underline dashed' : 'text-decoration:underline') : ''; s += `<text x="12" y="${y}" style="${st}">${esc(a.name)}${a.fk ? ' (FK)' : ''}</text><text class="ty" x="${w - 10}" y="${y}" text-anchor="end">${esc(a.type)}</text>`; y += 20; });
  return s + '</g>';
}
function svgInner(m, o = {}) {
  const sel = o.sel || {}, multi = o.multi || [];
  let edges = '', nodes = '';
  m.rels.forEach(r => {
    r.ends.forEach(en => {
      const e = ent(m, en.entity); if (!e) return; const c = cxy(m, e), p = rectEdge(m, e, r.x, r.y), q = diaEdge(r, c.x, c.y);
      edges += dline(q.x, q.y, p.x, p.y, en.part === 'total');
      const a = toward(p.x, p.y, q.x, q.y, 16), L = Math.hypot(q.x - p.x, q.y - p.y) || 1, nx = -(q.y - p.y) / L * 12, ny = (q.x - p.x) / L * 12;
      edges += `<text class="lbl" x="${a.x + nx}" y="${a.y + ny + 4}">${esc(en.card === 'M' ? 'N' : en.card)}</text>`;
    });
    const hw = relHW(r), hh = relHH, cls = sel.kind === 'rel' && sel.id === r.id ? 'sel' : '';
    nodes += `<g class="node-rel ${cls}" data-kind="rel" data-id="${r.id}"><polygon points="${r.x},${r.y - hh} ${r.x + hw},${r.y} ${r.x},${r.y + hh} ${r.x - hw},${r.y}"/>${r.identifying ? `<polygon points="${r.x},${r.y - hh + 5} ${r.x + hw - 9},${r.y} ${r.x},${r.y + hh - 5} ${r.x - hw + 9},${r.y}" style="fill:none"/>` : ''}<text x="${r.x}" y="${r.y + 4}">${esc(r.name || 'relates')}</text>${r.attrs && r.attrs.length ? `<text x="${r.x}" y="${r.y + hh + 15}" style="font-weight:400;fill:var(--dim);font-size:11px">${esc(r.attrs.map(a => a.name).join(', '))}</text>` : ''}</g>`;
  });
  m.isas.forEach(i => {
    const sup = ent(m, i.superId); if (!sup) return; isaXY(m, i);
    const cls = sel.kind === 'isa' && sel.id === i.id ? 'sel' : '';
    const sb = rectEdge(m, sup, i.x, i.y), ce = toward(i.x, i.y, sb.x, sb.y, 15);
    edges += dline(sb.x, sb.y, ce.x, ce.y, i.total, 'isa');
    i.subIds.forEach(sid => {
      const s = ent(m, sid); if (!s) return; const p = rectEdge(m, s, i.x, i.y), c0 = toward(i.x, i.y, p.x, p.y, 15);
      edges += `<line class="edge isa" x1="${c0.x}" y1="${c0.y}" x2="${p.x}" y2="${p.y}"/>`;
      const P = toward(p.x, p.y, i.x, i.y, 17), L = Math.hypot(i.x - p.x, i.y - p.y) || 1, ux = (p.x - i.x) / L, uy = (p.y - i.y) / L, nx = -uy * 8, ny = ux * 8, bx = ux * 8, by = uy * 8;
      const cross = nx * by - ny * bx;
      edges += `<path class="edge isa" d="M${P.x + nx} ${P.y + ny} A8 8 0 0 ${cross > 0 ? 1 : 0} ${P.x - nx} ${P.y - ny}"/>`;
    });
    nodes += `<g class="node-isa ${cls}" data-kind="isa" data-id="${i.id}"><circle cx="${i.x}" cy="${i.y}" r="15"/><text x="${i.x}" y="${i.y + 5}">${i.disjoint ? 'd' : 'o'}</text><text x="${i.x + 22}" y="${i.y + 4}" style="text-anchor:start;font-size:11px;font-weight:500;fill:var(--muted);font-family:var(--f-body)">${i.total ? 'total' : 'partial'}</text></g>`;
  });
  m.entities.forEach(e => { nodes += entSVG(m, e, (sel.kind === 'ent' && sel.id === e.id ? 'sel ' : '') + (multi.includes(e.id) ? 'multi' : '')); });
  return edges + nodes;
}
function staticSVG(m, cls = 'cw') {
  const b = bounds(m); return `<div class="${cls}"><svg viewBox="${b.x} ${b.y} ${b.w} ${b.h}" role="img" aria-label="EER diagram: ${esc(m.name)}" style="max-height:${Math.min(420, b.h * 1.2)}px;width:100%">${svgInner(m)}</svg></div>`;
}

/* editing operations */
function generalize(m, ids, superName, lifted, keyName, dropKeys) {
  const subs = ids.map(id => ent(m, id)).filter(Boolean); const low = lifted.map(x => x.toLowerCase());
  const pkAttr = subs.map(s => s.attrs.find(a => a.pk)).find(Boolean);
  const sup = addEntity(m, superName.trim().toUpperCase(), [attr(keyName.trim(), pkAttr ? pkAttr.type : 'INT', 'pk')]);
  lifted.forEach(n => { if (n.toLowerCase() === keyName.trim().toLowerCase()) return; const src = subs.map(s => s.attrs.find(a => a.name.toLowerCase() === n.toLowerCase())).find(Boolean); if (src) sup.attrs.push(attr(src.name, src.type, src.nn ? 'nn' : '')); });
  subs.forEach(s => { s.attrs = s.attrs.filter(a => !low.includes(a.name.toLowerCase()) && !(dropKeys && a.pk)); });
  const isa = { id: uid('i'), superId: sup.id, subIds: ids.slice(), disjoint: true, total: false, x: null, y: null };
  m.isas.push(isa);
  const cx = subs.reduce((a, s) => a + s.x + entW(s) / 2, 0) / subs.length; sup.x = cx - entW(sup) / 2; sup.y = Math.min(...subs.map(s => s.y)) - entH(m, sup) - 130; isaXY(m, isa);
  return sup;
}
function specialize(m, supId, names) {
  const sup = ent(m, supId); let isa = m.isas.find(i => i.superId === supId);
  if (!isa) { isa = { id: uid('i'), superId: supId, subIds: [], disjoint: true, total: false, x: null, y: null }; m.isas.push(isa); }
  const created = names.map(n => { const e = addEntity(m, n.trim().toUpperCase(), []); isa.subIds.push(e.id); return e; });
  const all = isa.subIds.map(id => ent(m, id)); const SL = 265, c = cxy(m, sup), y = sup.y + entH(m, sup) + 135, l = c.x - (all.length * SL) / 2;
  all.forEach((s, k) => { s.x = l + k * SL + (SL - entW(s)) / 2; s.y = y; }); isa.x = isa.y = null; isaXY(m, isa);
  return created;
}
function deleteEntity(m, id) {
  m.entities = m.entities.filter(e => e.id !== id); m.rels = m.rels.filter(r => !r.ends.some(x => x.entity === id));
  m.isas.forEach(i => { i.subIds = i.subIds.filter(s => s !== id); }); m.isas = m.isas.filter(i => i.superId !== id && i.subIds.length > 0);
  m.entities.forEach(e => e.attrs.forEach(a => { if (a.ref === id) { a.ref = ''; } }));
}
function uniqueName(m, base) { let n = base, k = 2; while (m.entities.some(e => e.name.toLowerCase() === n.toLowerCase())) n = base + '_' + k++; return n; }

/* validation */
function validate(m) {
  const out = [];
  if (!m.entities.length) return [{ lvl: 'warn', msg: 'The model is empty. Add an entity or open an example.' }];
  const names = {}; m.entities.forEach(e => { const k = e.name.toLowerCase(); names[k] = (names[k] || 0) + 1; });
  Object.entries(names).forEach(([k, v]) => v > 1 && out.push({ lvl: 'bad', msg: `Duplicate entity name "${k.toUpperCase()}". Table names must be unique.` }));
  m.entities.forEach(e => {
    const sp = isaOfSub(m, e.id);
    if (!e.name.trim()) out.push({ lvl: 'bad', msg: 'An entity has no name.' });
    if (!sp && !e.attrs.some(a => a.pk) && !e.weak) out.push({ lvl: 'warn', msg: `${e.name} has no primary key. Mark one attribute as PK.` });
    if (sp && e.attrs.some(a => a.pk)) out.push({ lvl: 'warn', msg: `${e.name} is a subclass but defines its own primary key. Subclasses normally inherit the key of the superclass.` });
    if (sp) { const inh = inheritedAttrs(m, e).map(a => a.name.toLowerCase()); e.attrs.filter(a => inh.includes(a.name.toLowerCase())).forEach(a => out.push({ lvl: 'warn', msg: `${e.name}.${a.name} duplicates an inherited attribute. Remove it from the subclass.` })); }
    const an = {}; e.attrs.forEach(a => { const k = a.name.toLowerCase(); if (an[k]) out.push({ lvl: 'bad', msg: `${e.name} has two attributes named "${a.name}".` }); an[k] = 1; if (!a.name.trim()) out.push({ lvl: 'bad', msg: `${e.name} has an unnamed attribute.` }); });
    if (e.weak && !m.rels.some(r => r.identifying && r.ends.some(x => x.entity === e.id))) out.push({ lvl: 'warn', msg: `${e.name} is a weak entity but has no identifying relationship.` });
  });
  m.isas.forEach(i => { const s = ent(m, i.superId); if (i.subIds.length === 1) out.push({ lvl: 'info', msg: `${s ? s.name : '?'} has only one subclass. That is allowed, but check whether a specialization is really needed.` }); });
  if (!out.length) out.push({ lvl: 'ok', msg: 'No problems found. The model is ready to convert.' });
  return out;
}

/* ===== Relational mapping ===== */
function toRelational(m, strat = 'own') {
  const notes = [], tables = [], tOf = {};
  const superOf = id => { const i = isaOfSub(m, id); return i ? { isa: i, sup: ent(m, i.superId) } : null; };
  const mode = new Map(), merged = {}, dropped = new Set();
  m.isas.forEach(i => {
    const sup = ent(m, i.superId); if (!sup) return; let md = 'own';
    if (strat === 'subs') { if (i.total) md = 'subs'; else notes.push(`${sup.name}: the specialization is partial, so a subclass-only mapping would lose superclass entities that belong to no subclass. Using separate tables (Option A) for this specialization.`); }
    else if (strat === 'single') { if (i.disjoint) md = 'single'; else { md = 'flags'; notes.push(`${sup.name}: the subclasses overlap, so a single "type" column cannot describe an entity that belongs to several subclasses. Using one boolean flag per subclass (Option D) instead.`); } }
    else if (strat === 'flags') md = 'flags';
    mode.set(i.id, md); if (md === 'subs') { dropped.add(i.superId); if (!i.disjoint) notes.push(`${sup.name}: subclasses overlap, so an entity in two subclasses is stored twice (redundancy).`); } if (md === 'single' || md === 'flags') i.subIds.forEach(s => { merged[s] = i.superId; });
  });
  const home = id => { let g = 0; while (merged[id] && g++ < 12) id = merged[id]; return id; };
  const colOf = a => ({ name: a.name, sql: snake(a.name), type: a.type, pk: false, nn: !!a.nn, fk: null, uq: false });
  const ownerOf = e => { const r = m.rels.find(x => x.identifying && x.ends.some(y => y.entity === e.id)); if (!r) return null; const o = r.ends.find(y => y.entity !== e.id); return o ? ent(m, o.entity) : null; };
  function pkOf(e, seen = new Set()) {
    if (seen.has(e.id)) return []; seen.add(e.id); const sp = superOf(e.id);
    if (sp && sp.sup) return pkOf(sp.sup, seen);
    const own = e.attrs.filter(a => a.pk).map(a => ({ ...colOf(a), nn: true }));
    if (e.weak) { const ow = ownerOf(e); if (ow) return [...pkOf(ow, new Set()).map(c => ({ ...c, ownerFk: ow.id })), ...own]; }
    return own;
  }
  function ownCols(e, nullable) {
    const sp = superOf(e.id);
    return e.attrs.filter(a => !a.pk || sp).map(a => {
      const c = colOf(a); if (a.pk && sp) { c.uq = true; c.nn = true; }
      if (nullable) c.nn = false;
      if (a.fk) { if (a.ref && ent(m, a.ref)) c.fk = { ent: a.ref, grp: uid('g'), ref: null }; else notes.push(`${e.name}.${a.name} is marked FK but references no entity, so it is emitted as a plain column.`); }
      return c;
    });
  }
  const inh = e => { const sp = superOf(e.id); if (!sp || !sp.sup || mode.get(sp.isa.id) !== 'subs') return []; return [...inh(sp.sup), ...ownCols(sp.sup)]; };
  m.entities.forEach(e => {
    if (dropped.has(e.id) || merged[e.id]) return;
    const t = { name: tname(e.name), ent: e.id, cols: [] }; tOf[e.id] = t; tables.push(t);
    const sp = superOf(e.id), pk = pkOf(e); const md = sp ? mode.get(sp.isa.id) : null;
    if (sp && sp.sup && md === 'own') { const g = uid('g'); pk.forEach(c => t.cols.push({ ...c, pk: true, nn: true, fk: { ent: sp.sup.id, grp: g, ref: c.sql }, cascade: true })); notes.push(`${e.name}: its primary key ${pk.map(c => c.name).join(', ') || '(none)'} is also a foreign key to ${sp.sup.name}, so each ${e.name} row extends exactly one ${sp.sup.name} row.`); }
    else if (e.weak) { const ow = ownerOf(e); const g = uid('g'); pk.forEach(c => t.cols.push(c.ownerFk ? { ...c, pk: true, nn: true, fk: { ent: c.ownerFk, grp: g, ref: c.sql } } : { ...c, pk: true, nn: true })); if (ow) notes.push(`${e.name} is a weak entity: its primary key combines the owner key from ${ow.name} with its partial key.`); }
    else pk.forEach(c => t.cols.push({ ...c, pk: true, nn: true }));
    if (!pk.length && !e.weak) notes.push(`${e.name} has no primary key, so its table has none either.`);
    t.cols.push(...inh(e)); t.cols.push(...ownCols(e));
    m.isas.filter(i => home(i.superId) === e.id && ['single', 'flags'].includes(mode.get(i.id))).forEach(i => {
      const sup = ent(m, i.superId), md2 = mode.get(i.id);
      if (md2 === 'single') { t.cols.push({ name: sup.name + '_Type', sql: snake(sup.name) + '_type', type: 'VARCHAR(30)', pk: false, nn: i.total, fk: null, uq: false, disc: true }); notes.push(`${sup.name}: one "${sup.name}_Type" column records which subclass (${i.subIds.map(s => ent(m, s).name).join(', ')}) a row belongs to. Subclass-specific columns are NULL for other types.`); }
      i.subIds.forEach(sid => { const s = ent(m, sid); if (md2 === 'flags') t.cols.push({ name: 'Is_' + s.name, sql: 'is_' + snake(s.name), type: 'BOOLEAN', pk: false, nn: true, fk: null, uq: false, disc: true }); ownCols(s, true).forEach(c => { if (t.cols.some(x => x.sql === c.sql)) { c.sql = snake(s.name) + '_' + c.sql; c.name = s.name + '_' + c.name; } t.cols.push(c); }); });
      if (md2 === 'flags') notes.push(`${sup.name}: one boolean flag per subclass allows an entity to belong to several subclasses at once.`);
    });
  });
  const tbl = e => tOf[home(e.id)];
  const many = c => c === 'N' || c === 'M';
  function addFK(tFrom, eTo, endFrom, r, unique, eFrom) {
    const pk = pkOf(eTo); if (!pk.length) { notes.push(`${r.name}: ${eTo.name} has no primary key, so nothing can reference it.`); return; }
    const g = uid('g');
    pk.forEach(c => { let sql = c.sql; if (tFrom.cols.some(x => x.sql === sql)) sql = snake(r.name || eTo.name) + '_' + c.sql; tFrom.cols.push({ name: sql === c.sql ? c.name : sql, sql, type: c.type, pk: false, nn: endFrom.part === 'total' && tFrom.ent === eFrom.id, fk: { ent: eTo.id, grp: g, ref: c.sql }, uq: !!unique }); });
    (r.attrs || []).forEach(a => tFrom.cols.push({ name: a.name, sql: snake(a.name), type: a.type, pk: false, nn: false, fk: null, uq: false }));
    notes.push(`${r.name}: foreign key added to ${tFrom.name} referencing ${eTo.name}${unique ? ' (UNIQUE, because the relationship is 1:1)' : ''}${endFrom.part === 'total' && tFrom.ent === eFrom.id ? '; NOT NULL because participation is total' : ''}.`);
  }
  m.rels.forEach(r => {
    if (r.identifying) return; const [a, b] = r.ends, A = ent(m, a.entity), B = ent(m, b.entity); if (!A || !B) return;
    const tA = tbl(A), tB = tbl(B); if (!tA || !tB) { notes.push(`${r.name}: it involves a superclass whose table does not exist in this strategy, so the relationship cannot be enforced with a foreign key.`); return; }
    if (many(a.card) && many(b.card)) {
      const j = { name: tname(r.name || (A.name + '_' + B.name)), cols: [], junction: true }; const g1 = uid('g'), g2 = uid('g'), pa = pkOf(A), pb = pkOf(B);
      pa.forEach(c => j.cols.push({ ...c, pk: true, nn: true, fk: { ent: A.id, grp: g1, ref: c.sql } }));
      pb.forEach(c => { let sql = c.sql; if (j.cols.some(x => x.sql === sql)) { sql = snake(B.name) + '_' + c.sql; j.cols.forEach(x => { if (x.sql === c.sql && x.fk && x.fk.ent === A.id && !x.renamed) { x.sql = snake(A.name) + '_' + x.sql; x.name = x.sql; x.renamed = 1; } }); } j.cols.push({ ...c, name: sql, sql, pk: true, nn: true, fk: { ent: B.id, grp: g2, ref: c.sql } }); });
      (r.attrs || []).forEach(x => j.cols.push({ name: x.name, sql: snake(x.name), type: x.type, pk: false, nn: false, fk: null, uq: false }));
      tables.push(j); notes.push(`${r.name}: an M:N relationship becomes its own table whose primary key combines the keys of ${A.name} and ${B.name}.`);
    } else if (many(a.card) && !many(b.card)) addFK(tA, B, a, r, false, A);
    else if (!many(a.card) && many(b.card)) addFK(tB, A, b, r, false, B);
    else { if (b.part === 'total' && a.part !== 'total') addFK(tB, A, b, r, true, B); else addFK(tA, B, a, r, true, A); }
  });
  /* resolve foreign keys to table/column names */
  tables.forEach(t => t.cols.forEach(c => {
    if (!c.fk) return; const ref = tOf[home(c.fk.ent)];
    if (!ref) { notes.push(`${t.name}.${c.name}: the referenced table does not exist in this strategy; the foreign key was dropped.`); c.fk = null; return; }
    const rc = c.fk.ref ? (ref.cols.find(x => x.sql === c.fk.ref && x.pk) || ref.cols.find(x => x.sql === c.fk.ref)) : ref.cols.find(x => x.pk); c.fk = rc ? { table: ref.name, col: rc.sql, grp: c.fk.grp } : null;
  }));
  return { tables, notes };
}
function topo(tables) {
  const done = new Set(), out = [], rest = tables.slice(); let g = 0;
  while (rest.length && g++ < 200) { const i = rest.findIndex(t => t.cols.every(c => !c.fk || c.fk.table === t.name || done.has(c.fk.table))); const t = rest.splice(i < 0 ? 0 : i, 1)[0]; out.push(t); done.add(t.name); }
  return out;
}
function toSQL(tables) {
  let out = '';
  topo(tables).forEach(t => {
    const pks = t.cols.filter(c => c.pk), lines = [];
    t.cols.forEach(c => { let l = `${c.sql} ${c.type}`; if (pks.length === 1 && c.pk) l += ' PRIMARY KEY'; else if (c.nn && !c.pk) l += ' NOT NULL'; if (c.uq && !c.pk) l += ' UNIQUE'; lines.push(l); });
    if (pks.length > 1) lines.push(`PRIMARY KEY (${pks.map(c => c.sql).join(', ')})`);
    const groups = {}; t.cols.filter(c => c.fk && c.fk.table).forEach(c => { (groups[c.fk.grp] = groups[c.fk.grp] || []).push(c); });
    Object.values(groups).forEach(g => lines.push(`FOREIGN KEY (${g.map(c => c.sql).join(', ')}) REFERENCES ${g[0].fk.table}(${g.map(c => c.fk.col).join(', ')})${g[0].cascade ? ' ON DELETE CASCADE' : ''}`));
    out += `CREATE TABLE ${t.name} (\n    ${lines.join(',\n    ') || 'id INT'}\n);\n\n`;
  });
  return out.trim() + '\n';
}
function schemaHTML(tables) {
  return topo(tables).map(t => `<div class="schema"><b>${esc(t.name.toUpperCase())}</b>( ${t.cols.map(c => c.pk ? `<span class="pk">${esc(c.name)}</span>${c.fk ? `<span class="fk">→${esc(c.fk.table)}</span>` : ''}` : c.fk ? `<span class="fk">${esc(c.name)}→${esc(c.fk.table)}</span>` : esc(c.name)).join(', ')} )</div>`).join('');
}
function hiSQL(sql) {
  return esc(sql).replace(/(--.*$)/gm, '\u0001$1\u0002').replace(/\b(CREATE|TABLE|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|UNIQUE|ON|DELETE|CASCADE|DEFAULT|CHECK|CONSTRAINT|ALTER|ADD|IF|EXISTS)\b/gi, '<span class="kw">$1</span>').replace(/\b(INT|INTEGER|BIGINT|VARCHAR|TEXT|DECIMAL|NUMERIC|FLOAT|DOUBLE|DATE|DATETIME|TIMESTAMP|BOOLEAN|CHAR)\b/gi, '<span class="ty">$1</span>').replace(/\u0001/g, '<span class="cm">').replace(/\u0002/g, '</span>');
}
const MAP_STRATS = { own: ['A · Separate table for every class', 'Superclass table plus one table per subclass. Each subclass key is also a foreign key to the superclass. Works for every constraint combination.'], subs: ['B · Subclass tables only', 'No superclass table; each subclass table repeats the inherited columns. Suits a total specialization; overlapping data is duplicated.'], single: ['C · One table with a type column', 'A single table holds all classes with one type column. Suits disjoint subclasses; subclass columns are NULL for other types.'], flags: ['D · One table with boolean flags', 'A single table with one boolean flag per subclass. Suits overlapping subclasses (and works for disjoint ones).'] };
