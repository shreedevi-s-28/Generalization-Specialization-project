/* ===== Practice, quiz engine, AI quiz, competitive, progress, leaderboard, admin, help, search ===== */
const TYPES_P = { identify: 'Identify entities / attributes', genspec: 'Generalization & specialization', constraint: 'Constraints (d/o, total/partial)', mapping: 'Mapping options', table: 'Table mapping', sql: 'SQL mapping', diagram: 'Diagram interpretation' };
const PF = { type: '', topic: '', d: '' }; let PS = null;
const topicOpts = (sel, all = 'All topics') => `<option value="">${all}</option>` + GROUPS.map(g => `<optgroup label="${g}">${TOPICS.filter(t => t.g === g).map(t => `<option value="${t.id}" ${sel === t.id ? 'selected' : ''}>${esc(t.t)}</option>`).join('')}</optgroup>`).join('');
const filtered = () => PRACTICE.filter(p => (!PF.type || p.type === PF.type) && (!PF.topic || p.topic === PF.topic) && (!PF.d || p.d === PF.d));
const acc = (n, ok) => n ? Math.round(100 * ok / n) : null;

/* ---------- Practice ---------- */
VIEWS.practice = topic => {
  if (topic && topicById(topic) && PF.topic !== topic) { PF.topic = topic; }
  if (PS && !PS.done) return practiceQ();
  if (PS && PS.done) return practiceDone();
  const list = filtered(), stat = q => DB.pstats[q.id];
  return `<div class="page-h"><div><h2>Practice</h2><p>${PRACTICE.length} questions with hints and explanations. Each answer is saved to your progress.</p></div></div>
  <div class="card" style="margin-bottom:14px"><div class="grid g4"><label class="f">Type<select data-chg="pf-type"><option value="">All types</option>${Object.entries(TYPES_P).map(([k, v]) => `<option value="${k}" ${PF.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label class="f">Topic<select data-chg="pf-topic">${topicOpts(PF.topic)}</select></label><label class="f">Difficulty<select data-chg="pf-d"><option value="">All</option>${['easy', 'medium', 'hard'].map(d => `<option value="${d}" ${PF.d === d ? 'selected' : ''}>${cap(d)}</option>`).join('')}</select></label><div class="row" style="align-items:flex-end"><button class="btn pri" data-act="pr-start" ${list.length ? '' : 'disabled'}>Practice ${list.length}</button><button class="btn" data-act="pr-timed" ${list.length ? '' : 'disabled'}>Timed quiz</button></div></div></div>
  ${list.length ? `<div class="scroll-x"><table class="t"><thead><tr><th>Question</th><th>Type</th><th>Level</th><th>Your record</th></tr></thead><tbody>${list.map(q => { const s = stat(q); return `<tr><td>${esc(q.q.length > 110 ? q.q.slice(0, 108) + '…' : q.q)}</td><td class="small">${TYPES_P[q.type]}</td><td><span class="chip ${q.d === 'easy' ? 'ok' : q.d === 'hard' ? 'bad' : 'warn'}">${q.d}</span></td><td class="small">${s ? `${s.ok}/${s.n} correct` : '<span class="muted">not attempted</span>'}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty">No questions match these filters. Change a filter to see more.</div>'}`;
};
INP['pf-type'] = el => { PF.type = el.value; rerender(); }; INP['pf-topic'] = el => { PF.topic = el.value; rerender(); }; INP['pf-d'] = el => { PF.d = el.value; rerender(); };
ACT['pr-start'] = () => { const qs = filtered(); PS = { qs, i: 0, chosen: null, hint: false, sub: false, ok: 0, t0: Date.now(), log: [] }; rerender(); };
ACT['pr-timed'] = () => { const qs = filtered(); startQuiz({ kind: 'practice', title: 'Practice quiz' + (PF.topic ? ': ' + topicById(PF.topic).t : ''), qs: qs.map(p => ({ id: p.id, q: p.q, o: p.o, a: p.a, e: p.e, topic: p.topic, model: p.model, src: 'Practice bank' })), back: '/practice' }); };
function practiceQ() {
  const q = PS.qs[PS.i]; PS.qt = PS.qt || Date.now();
  return `<div class="page-h"><div><h2>Practice</h2><p>Question ${PS.i + 1} of ${PS.qs.length}</p></div><button class="btn sm" data-act="pr-stop">End session</button></div><div class="bar" style="margin-bottom:14px"><i style="width:${pct(PS.i, PS.qs.length)}%"></i></div>
  <div class="card" style="max-width:820px"><div class="row" style="margin-bottom:8px"><span class="chip">${TYPES_P[q.type]}</span><span class="chip ${q.d === 'easy' ? 'ok' : q.d === 'hard' ? 'bad' : 'warn'}">${q.d}</span><a class="chip" href="#/learn/${q.topic}">${esc(topicById(q.topic).t)}</a></div><h3>${esc(q.q)}</h3>${q.model ? staticSVG(modelOf(q.model)) : ''}
  ${q.o.map((o, i) => `<button class="opt ${PS.sub ? (i === q.a ? 'right' : PS.chosen === i ? 'wrong' : '') : PS.chosen === i ? 'sel' : ''}" data-act="pr-pick" data-i="${i}" ${PS.sub ? 'disabled' : ''}><b>${'ABCD'[i]}</b><span>${esc(o)}</span></button>`).join('')}
  ${PS.hint && !PS.sub ? `<div class="note">Hint: ${esc(q.h)}</div>` : ''}${PS.sub ? `<div class="note ${PS.chosen === q.a ? 'ok' : 'bad'}"><b>${PS.chosen === q.a ? 'Correct.' : 'Not quite.'}</b> ${esc(q.e)}</div>` : ''}
  <div class="row" style="margin-top:10px">${!PS.sub ? `<button class="btn" data-act="pr-hint">Show hint</button><button class="btn pri" data-act="pr-submit" ${PS.chosen == null ? 'disabled' : ''}>Submit answer</button>` : `<button class="btn pri" data-act="pr-next">${PS.i + 1 < PS.qs.length ? 'Next question' : 'Finish'}</button>`}</div></div>`;
}
ACT['pr-pick'] = el => { PS.chosen = +el.dataset.i; rerender(); }; ACT['pr-hint'] = () => { PS.hint = true; rerender(); };
ACT['pr-submit'] = () => { const q = PS.qs[PS.i], ok = PS.chosen === q.a; PS.sub = true; if (ok) PS.ok++; PS.log.push({ id: q.id, ok, topic: q.topic }); recordAnswer(q.id, q.topic, ok, (Date.now() - PS.qt) / 1000); rerender(); };
ACT['pr-next'] = () => { if (PS.i + 1 < PS.qs.length) { PS.i++; PS.chosen = null; PS.hint = false; PS.sub = false; PS.qt = null; } else PS.done = true; rerender(); };
ACT['pr-stop'] = () => { PS.done = true; rerender(); };
function practiceDone() {
  const n = PS.log.length, wrong = [...new Set(PS.log.filter(x => !x.ok).map(x => x.topic))];
  return `<div class="page-h"><div><h2>Session complete</h2></div></div><div class="card" style="max-width:640px"><div class="stat">${PS.ok}/${n}</div><p class="muted">${n ? pct(PS.ok, n) + '% correct' : 'No questions were answered.'}</p>${wrong.length ? `<p><b>Review these topics:</b></p><div class="row">${wrong.map(t => `<a class="btn sm" href="#/learn/${t}">${esc(topicById(t).t)}</a>`).join('')}</div>` : n ? '<div class="note ok">No mistakes this session.</div>' : ''}<div class="row" style="margin-top:14px"><button class="btn pri" data-act="pr-again">Back to practice</button><a class="btn" href="#/progress">See progress</a></div></div>`;
};
ACT['pr-again'] = () => { PS = null; rerender(); };

/* ---------- Quiz engine ---------- */
let QZ = null;
function startQuiz({ kind, title, qs, back, meta }) {
  if (!qs.length) return toast('There are no questions to start.', 'warn');
  QZ = { kind, title, qs, back: back || '/practice', meta: meta || {}, i: 0, ans: qs.map(() => null), qt: qs.map(() => 0), t0: Date.now(), qs0: Date.now(), done: false }; go('/quiz');
}
const qzTick = () => { const a = $('#qz-total'), b = $('#qz-q'); if (!QZ || !a) return; a.textContent = fmtT((Date.now() - QZ.t0) / 1000); b.textContent = fmtT(QZ.qt[QZ.i] + (Date.now() - QZ.qs0) / 1000); };
function qzLeave() { if (QZ) { QZ.qt[QZ.i] += (Date.now() - QZ.qs0) / 1000; QZ.qs0 = Date.now(); } }
VIEWS.quiz = () => {
  if (!QZ || QZ.done) return `<div class="empty">No quiz is currently running. <a href="#/practice">Go to Quiz</a> or <a href="#/competitive">attempt Competitive Questions</a>.</div>`;
  const q = QZ.qs[QZ.i], sel = QZ.ans[QZ.i], iv = setInterval(qzTick, 1000); CLEAN = () => clearInterval(iv);
  const badge = QZ.kind === 'cq' 
    ? `<span class="marks-chip">+${q.marks || 2} Marks</span> <span class="chip info">${esc(q.src || 'Competitive Problem')}</span>`
    : `<span class="chip">${esc(q.src || 'Practice bank')}</span>`;
  return `<div class="page-h"><div><h2>${esc(QZ.title)}</h2><p>Question ${QZ.i + 1} of ${QZ.qs.length}${q.marks ? ` · Value: ${q.marks} Marks` : ''}</p></div><div class="row"><span class="chip">Total <b id="qz-total">0:00</b></span><span class="chip">This question <b id="qz-q">0:00</b></span><button class="btn sm danger" data-act="qz-quit">Quit</button></div></div>
  <div class="bar" style="margin-bottom:14px"><i style="width:${pct(QZ.ans.filter(x => x != null).length, QZ.qs.length)}%"></i></div>
  <div class="card" style="max-width:820px"><div class="row" style="margin-bottom:8px">${badge}${q.topic && topicById(q.topic) ? `<span class="chip">${esc(topicById(q.topic).t)}</span>` : ''}</div><h3>${esc(q.q)}</h3>${q.model ? staticSVG(modelOf(q.model)) : ''}${q.o.map((o, i) => `<button class="opt ${sel === i ? 'sel' : ''}" data-act="qz-pick" data-i="${i}" aria-pressed="${sel === i}"><b>${'ABCD'[i]}</b><span>${esc(o)}</span></button>`).join('')}
  <div class="row sb" style="margin-top:12px"><div class="row"><button class="btn" data-act="qz-go" data-d="-1" ${QZ.i === 0 ? 'disabled' : ''}>Previous</button><button class="btn" data-act="qz-skip">Skip</button></div><div class="row">${QZ.i + 1 < QZ.qs.length ? `<button class="btn pri" data-act="qz-go" data-d="1">Next</button>` : ''}<button class="btn ${QZ.i + 1 < QZ.qs.length ? '' : 'pri'}" data-act="qz-submit">Submit quiz</button></div></div></div><div class="row" style="margin-top:12px;max-width:820px">${QZ.qs.map((_, i) => `<button class="btn xs ${i === QZ.i ? 'on' : ''}" data-act="qz-jump" data-i="${i}" title="${QZ.ans[i] == null ? 'Unanswered' : 'Answered'}" style="${QZ.ans[i] != null ? 'border-color:var(--ok)' : ''}">${i + 1}</button>`).join('')}</div>`;
};
ACT['qz-pick'] = el => { QZ.ans[QZ.i] = +el.dataset.i; const y = scrollY; rerender(); scrollTo(0, y); };
ACT['qz-go'] = el => { qzLeave(); QZ.i += +el.dataset.d; rerender(); }; ACT['qz-jump'] = el => { qzLeave(); QZ.i = +el.dataset.i; rerender(); };
ACT['qz-skip'] = () => { qzLeave(); QZ.ans[QZ.i] = null; if (QZ.i + 1 < QZ.qs.length) QZ.i++; rerender(); };
ACT['qz-quit'] = async () => { if (await confirmBox('Quit this quiz? Your answers will not be saved.', 'Quit')) { const b = QZ.back; QZ = null; go(b); } };
ACT['qz-submit'] = async () => {
  const un = QZ.ans.filter(x => x == null).length; if (un && !(await confirmBox(`${un} question(s) are unanswered and will count as skipped. Submit?`, 'Submit', false))) return;
  qzLeave(); const total = (Date.now() - QZ.t0) / 1000; let correct = 0, wrong = 0, skipped = 0;
  let totalMarks = 0, marksObtained = 0;
  QZ.qs.forEach((q, i) => {
    const m = q.marks || 2;
    totalMarks += m;
    const a = QZ.ans[i];
    if (a == null) {
      skipped++;
    } else {
      const ok = a === q.a;
      if (ok) { correct++; marksObtained += m; } else { wrong++; }
      recordAnswer(q.id || (QZ.kind + ':' + i), q.topic || 'eer-model', ok, QZ.qt[i]);
    }
  });
  const at = {
    id: uid('at'),
    ts: Date.now(),
    kind: QZ.kind,
    title: QZ.title,
    name: (DB.profile && DB.profile.name) || DB.settings.name || 'Student',
    total: QZ.qs.length,
    correct,
    wrong,
    skipped,
    time: Math.round(total),
    meta: { ...QZ.meta, totalMarks, marksObtained },
    back: QZ.back,
    qs: QZ.qs.map(q => ({ id: q.id || null, q: q.q, o: q.o, a: q.a, e: q.e || '', topic: q.topic || '', src: q.src || '', model: q.model || '', marks: q.marks || 2 })),
    ans: QZ.ans.slice(),
    qt: QZ.qt.map(x => Math.round(x))
  };
  DB.attempts.unshift(at);
  DB.attempts = DB.attempts.slice(0, 80);
  DB.save('attempts');
  QZ.done = true;
  go('/attempt/' + at.id);
};
window.addEventListener('beforeunload', e => { if (QZ && !QZ.done && QZ.ans.some(x => x != null)) { e.preventDefault(); e.returnValue = ''; } });

const RV = { filter: 'all', open: {} };
VIEWS.attempt = id => {
  const at = DB.attempts.find(a => a.id === id); if (!at) return `<div class="empty">This attempt was not found. <a href="#/progress">Back to progress</a></div>`;
  const times = at.qt.filter((t, i) => at.ans[i] != null), topics = {};
  at.qs.forEach((q, i) => { const k = q.topic || 'other'; const t = topics[k] = topics[k] || { n: 0, ok: 0 }; if (at.ans[i] != null) { t.n++; if (at.ans[i] === q.a) t.ok++; } });
  const weak = Object.entries(topics).filter(([k, v]) => k !== 'other' && v.n && v.ok / v.n < .6).map(([k]) => k), show = at.qs.map((q, i) => ({ q, i })).filter(x => RV.filter === 'all' || at.ans[x.i] !== x.q.a);
  const isCq = at.kind === 'cq';
  const marksStr = isCq && at.meta && at.meta.totalMarks ? `<span class="marks-chip" style="margin-left:6px">${at.meta.marksObtained}/${at.meta.totalMarks} Marks</span>` : '';

  return `<div class="page-h"><div><a class="small" href="#${at.back || '/practice'}">← Back</a><h2>${esc(at.title)}</h2><p>${new Date(at.ts).toLocaleString()} · ${isCq ? 'Competitive Examination Mode' : 'Practice Quiz'}</p></div><div class="row"><button class="btn pri" data-act="at-retry" data-id="${at.id}">Retry these questions</button></div></div>
  <div class="grid g4">
    <div class="card"><div class="stat">${at.correct}/${at.total}</div><span class="muted small">score · ${pct(at.correct, at.total)}% accuracy ${marksStr}</span></div>
    <div class="card"><div class="stat">${at.wrong} / ${at.skipped}</div><span class="muted small">incorrect / skipped</span></div>
    <div class="card"><div class="stat">${fmtT(at.time)}</div><span class="muted small">total time</span></div>
    <div class="card"><div class="stat">${times.length ? fmtT(times.reduce((a, b) => a + b, 0) / times.length) : '–'}</div><span class="muted small">avg per question · fastest ${times.length ? fmtT(Math.min(...times)) : '–'}</span></div>
  </div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h3>Topic performance</h3>${Object.keys(topics).length ? `<table class="t"><tbody>${Object.entries(topics).map(([k, v]) => `<tr><td>${k === 'other' ? 'Other' : `<a href="#/learn/${k}">${esc(topicById(k) ? topicById(k).t : k)}</a>`}</td><td>${v.ok}/${v.n}</td><td><div class="bar"><i style="width:${pct(v.ok, v.n)}%"></i></div></td></tr>`).join('')}</tbody></table>` : '<p class="muted">No answered questions.</p>'}</div>
    <div class="card"><h3>What to do next</h3>${weak.length ? `<p>Recommended for review: ${weak.map(k => `<b>${esc(topicById(k).t)}</b>`).join(', ')}.</p><div class="row">${weak.slice(0, 2).map(k => `<a class="btn sm" href="#/learn/${k}">Study ${esc(topicById(k).t)}</a><a class="btn sm" href="#/practice/${k}">Practice</a>`).join('')}</div>` : '<div class="note ok">Outstanding performance! No weak topics detected in this session.</div>'}</div>
  </div>
  <div class="row sb" style="margin:18px 0 8px"><h3 style="margin:0">Detailed Review</h3><div class="row"><button class="btn sm ${RV.filter === 'all' ? 'on' : ''}" data-act="rv-f" data-f="all">All Questions</button><button class="btn sm ${RV.filter === 'wrong' ? 'on' : ''}" data-act="rv-f" data-f="wrong">Mistakes Only</button></div></div>
  ${show.length ? show.map(({ q, i }) => {
    const a = at.ans[i], ok = a === q.a;
    return `<div class="card" style="margin-bottom:12px">
      <div class="row sb">
        <b>${i + 1}. ${esc(q.q)}</b>
        <div class="row">
          ${q.marks ? `<span class="marks-chip">${ok ? '+' + q.marks : '0'} / ${q.marks} M</span>` : ''}
          <span class="chip ${a == null ? '' : ok ? 'ok' : 'bad'}">${a == null ? 'skipped' : ok ? 'correct' : 'incorrect'} · ${fmtT(at.qt[i] || 0)}</span>
        </div>
      </div>
      ${q.model && MODEL_SPECS[q.model] ? staticSVG(modelOf(q.model)) : ''}
      <p class="small" style="margin:8px 0">Your answer: <b>${a == null ? 'none' : esc(q.o[a])}</b> · Correct answer: <b>${esc(q.o[q.a])}</b></p>
      <button class="btn xs" data-act="rv-sol" data-i="${i}">${RV.open[i] ? 'Hide explanation' : 'View explanation'}</button>
      ${RV.open[i] ? `<div class="note ok small" style="margin-top:8px"><b>Explanation:</b><br>${esc(q.e || 'Standard relational model and EER constraint reasoning applies.')}</div>` : ''}
    </div>`;
  }).join('') : '<div class="note ok">No mistakes to review in this filter. Perfect score!</div>'}`;
};
ACT['rv-f'] = el => { RV.filter = el.dataset.f; rerender(); };
ACT['rv-sol'] = el => { RV.open[el.dataset.i] = !RV.open[el.dataset.i]; const y = scrollY; rerender(); scrollTo(0, y); };
ACT['at-retry'] = el => { const at = DB.attempts.find(a => a.id === el.dataset.id); if (at) startQuiz({ kind: at.kind, title: at.title + ' (retry)', qs: at.qs, back: at.back, meta: at.meta }); };

/* ---------- Student Profile ---------- */
VIEWS.profile = () => {
  const p = DB.profile || {};
  const doneTopics = TOPICS.filter(t => DB.progress[t.id] === 'dn').length;
  const allAns = Object.values(DB.tagg).reduce((s, x) => s + x.n, 0);
  const correctAns = Object.values(DB.tagg).reduce((s, x) => s + x.ok, 0);
  const overallAcc = allAns ? Math.round(100 * correctAns / allAns) : 0;
  
  const cqList = DB.cq || [];
  const compAttempts = (DB.attempts || []).filter(a => a.kind === 'cq');
  const compScore = compAttempts.reduce((s, a) => s + (a.meta && a.meta.marksObtained != null ? a.meta.marksObtained : a.correct * 2), 0);
  const compAnsCount = compAttempts.reduce((s, a) => s + a.total, 0);
  const compCorrectCount = compAttempts.reduce((s, a) => s + a.correct, 0);
  const compAcc = compAnsCount ? Math.round(100 * compCorrectCount / compAnsCount) : 0;

  const vids = DB.videos || [];
  const vidsDone = Object.values(DB.vdone || {}).filter(Boolean).length;
  const vidPct = vids.length ? Math.round(100 * vidsDone / vids.length) : 0;

  // Weighted overall laboratory progress
  const topicsPart = (doneTopics / (TOPICS.length || 1)) * 40;
  const practicePart = (allAns ? Math.min(1, allAns / 25) : 0) * 25;
  const compPart = (compAttempts.length ? Math.min(1, compAttempts.length / 5) : 0) * 20;
  const vidPart = (vids.length ? Math.min(1, vidsDone / vids.length) : 0) * 15;
  const overallPct = Math.min(100, Math.round(topicsPart + practicePart + compPart + vidPart));

  const initials = (p.name || 'Student Name').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'ST';

  return `
  <div class="page-h">
    <div>
      <span class="chip acc" style="margin-bottom:6px">Student Academic Record</span>
      <h2>Student Profile</h2>
      <p>Laboratory identity, course enrollment, and comprehensive EER mastery analytics.</p>
    </div>
    <div class="row">
      <button class="btn pri" data-act="prof-edit">${ico('edit')} Edit Profile Details</button>
    </div>
  </div>

  <!-- Identification Card -->
  <div class="card" style="margin-bottom:20px">
    <div class="prof-header">
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
        <div class="avatar-frame">
          ${p.avatar 
            ? `<img src="${p.avatar}" alt="Student photo">` 
            : `<div class="fallback-avatar">${initials}</div>`
          }
        </div>
        <div class="row" style="gap:4px">
          <button class="btn xs pri" data-act="prof-upload">${ico('plus')} Upload Photo</button>
          ${p.avatar ? `<button class="btn xs danger" data-act="prof-rmphoto" title="Remove photo">✕</button>` : ''}
        </div>
        <input type="file" id="prof-file" data-chg="prof-file" accept="image/png,image/jpeg,image/jpg,image/webp" hidden>
      </div>

      <div class="grow">
        <div class="row sb" style="align-items:flex-start">
          <div>
            <h2 style="margin:0 0 4px">${esc(p.name || 'Student Name')}</h2>
            <span class="chip ok">Active Lab Student</span>
          </div>
          <span class="marks-chip" style="font-size:12px;padding:4px 12px">Register No: ${esc(p.regNo || '23BCE0001')}</span>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <b>Department</b>
            <span>${esc(p.dept || 'Computer Science and Engineering')}</span>
          </div>
          <div class="meta-item">
            <b>Year &amp; Semester</b>
            <span>${esc(p.yearSem || '3rd Year / 5th Sem')}</span>
          </div>
          <div class="meta-item">
            <b>Course / Laboratory</b>
            <span>${esc(p.course || 'Database Management Systems Lab (CS2051)')}</span>
          </div>
          <div class="meta-item">
            <b>Overall Mastery</b>
            <span>${overallPct}% Complete</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Academic Performance Breakdown -->
  <div class="page-h" style="margin-bottom:12px">
    <div>
      <h3 style="margin:0">Laboratory Performance &amp; Progress</h3>
      <span class="small muted">Evaluated from your verified questions, practice quizzes, and video modules</span>
    </div>
  </div>

  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin-bottom:24px">
    <div class="card">
      <div class="row sb" style="margin-bottom:4px"><span class="small muted">Overall Progress</span><span class="chip acc">${overallPct}%</span></div>
      <div class="stat">${overallPct}%</div>
      <div class="bar" style="margin-top:8px"><i style="width:${overallPct}%"></i></div>
      <span class="xs muted" style="margin-top:4px;display:block">Across all 30 laboratory topics</span>
    </div>

    <div class="card">
      <div class="row sb" style="margin-bottom:4px"><span class="small muted">Questions Attempted</span><span class="chip ok">${correctAns} Correct</span></div>
      <div class="stat">${allAns}</div>
      <span class="xs muted" style="margin-top:4px;display:block">${correctAns} correct answers (${overallAcc}% accuracy)</span>
    </div>

    <div class="card">
      <div class="row sb" style="margin-bottom:4px"><span class="small muted">Overall Accuracy</span><span class="chip ${overallAcc >= 75 ? 'ok' : 'warn'}">${allAns ? overallAcc + '%' : '–'}</span></div>
      <div class="stat">${allAns ? overallAcc + '%' : '–'}</div>
      <span class="xs muted" style="margin-top:4px;display:block">Total success rate across tests</span>
    </div>

    <div class="card">
      <div class="row sb" style="margin-bottom:4px"><span class="small muted">Competitive Score</span><span class="marks-chip">${compScore} Pts</span></div>
      <div class="stat">${compScore}</div>
      <span class="xs muted" style="margin-top:4px;display:block">${compAttempts.length} competitive attempts · ${compAcc}% acc</span>
    </div>

    <div class="card">
      <div class="row sb" style="margin-bottom:4px"><span class="small muted">Topics Completed</span><span class="chip ok">${doneTopics}/${TOPICS.length}</span></div>
      <div class="stat">${doneTopics} / ${TOPICS.length}</div>
      <div class="bar" style="margin-top:8px"><i style="width:${pct(doneTopics, TOPICS.length)}%"></i></div>
      <span class="xs muted" style="margin-top:4px;display:block">${TOPICS.length - doneTopics} topics remaining</span>
    </div>

    <div class="card">
      <div class="row sb" style="margin-bottom:4px"><span class="small muted">Video Learning</span><span class="chip info">${vidsDone}/${vids.length || 6}</span></div>
      <div class="stat">${vidsDone} / ${vids.length || 6}</div>
      <div class="bar" style="margin-top:8px"><i style="width:${vidPct}%"></i></div>
      <span class="xs muted" style="margin-top:4px;display:block">${vidPct}% video curriculum finished</span>
    </div>
  </div>

  <!-- Completed Topics & Module Status -->
  <div class="grid g2" style="margin-bottom:24px">
    <div class="card">
      <h3>Completed Topics (${doneTopics} of ${TOPICS.length})</h3>
      <p class="small muted">Topics marked completed in your learn path:</p>
      <div style="max-height:280px;overflow-y:auto;padding-right:4px">
        ${TOPICS.filter(t => DB.progress[t.id] === 'dn').length ? `
          <ul class="tight small">
            ${TOPICS.filter(t => DB.progress[t.id] === 'dn').map(t => `
              <li style="padding:4px 0">
                <span class="chip ok" style="padding:1px 6px;margin-right:6px">✓ Done</span>
                <a href="#/learn/${t.id}"><b>${esc(t.t)}</b></a>
                <span class="xs muted">(${esc(t.g)})</span>
              </li>
            `).join('')}
          </ul>
        ` : '<p class="small muted">No topics completed yet. Head to <a href="#/learn">Learn</a> to start studying.</p>'}
      </div>
    </div>

    <div class="card">
      <h3>Curated Video Learning Progress (${vidsDone} of ${vids.length || 6})</h3>
      <p class="small muted">Verified instructional lecture videos:</p>
      <div style="max-height:280px;overflow-y:auto;padding-right:4px">
        ${vids.length ? `
          <ul class="tight small">
            ${vids.map(v => {
              const isVd = !!(DB.vdone && DB.vdone[v.id]);
              return `
              <li style="padding:4px 0;display:flex;align-items:center;gap:6px">
                <span class="chip ${isVd ? 'ok' : 'warn'}" style="padding:1px 6px">${isVd ? '✓ Completed' : 'Pending'}</span>
                <span class="grow"><b>${esc(v.title)}</b> <span class="xs muted">(${esc(v.duration || 'Video')})</span></span>
                <button class="btn xs ${isVd ? 'on' : 'pri'}" data-act="vcomp" data-id="${v.id}">${isVd ? 'Undo' : 'Mark Done'}</button>
              </li>`;
            }).join('')}
          </ul>
        ` : '<p class="small muted">No videos configured.</p>'}
      </div>
      <div class="row" style="margin-top:12px">
        <a class="btn sm pri" href="#/progress">Open Video Lectures in Progress</a>
      </div>
    </div>
  </div>

  <!-- Recent Quiz & Competitive Attempts -->
  <div class="card">
    <div class="row sb" style="margin-bottom:10px">
      <h3 style="margin:0">Recent Laboratory Examination Records</h3>
      <a class="btn sm" href="#/leaderboard">View Leaderboard</a>
    </div>
    ${(DB.attempts || []).length ? `
      <div class="scroll-x">
        <table class="t">
          <thead>
            <tr>
              <th>Date</th>
              <th>Assessment / Quiz Title</th>
              <th>Category</th>
              <th>Score</th>
              <th>Accuracy</th>
              <th>Duration</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${DB.attempts.slice(0, 10).map(a => `
              <tr>
                <td class="small">${new Date(a.ts).toLocaleDateString()}</td>
                <td><b>${esc(a.title)}</b></td>
                <td><span class="chip ${a.kind === 'cq' ? 'info' : 'acc'}">${a.kind === 'cq' ? 'Competitive Set' : 'Practice Quiz'}</span></td>
                <td>${a.meta && a.meta.marksObtained != null ? `${a.meta.marksObtained} Marks (${a.correct}/${a.total})` : `${a.correct}/${a.total}`}</td>
                <td><span class="chip ${pct(a.correct, a.total) >= 70 ? 'ok' : 'warn'}">${pct(a.correct, a.total)}%</span></td>
                <td>${fmtT(a.time)}</td>
                <td><a class="btn xs" href="#/attempt/${a.id}">Review</a></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '<div class="empty">No quiz attempts recorded yet. Attempt a quiz or competitive set to build your laboratory record.</div>'}
  </div>
  `;
};

/* ---------- Contributors (dynamic: records + photos live in IndexedDB store "contrib", managed in Admin) ---------- */
const CT_KINDS = [['student', 'Student Contributors'], ['faculty', 'Faculty Mentors'], ['other', 'Other Contributors']];
const ctInitials = n => String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

/* Photo: a static asset path (c.img) wins, then an uploaded photo (c.photo). If the image fails, log it and show a subtle initials fallback. */
function ctPhotoHTML(c, cls = 'ct-photo') {
  const initials = esc(ctInitials(c.name));
  const name = esc(c.name || 'Contributor');
  const src = (typeof c.img === 'string' && c.img.trim()) || (typeof c.photo === 'string' ? c.photo.trim() : '');

  if (!src) {
    return `<div class="${cls}"><div class="ct-initials" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%">${initials}</div></div>`;
  }

  return `<div class="${cls}"><img src="${esc(src)}" alt="${name}" style="width:100%;height:100%;object-fit:cover" onerror="console.error('Contributor image failed to load:',this.getAttribute('src'));this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="ct-initials" style="display:none;align-items:center;justify-content:center;width:100%;height:100%">${initials}</div></div>`;
}

function ctCardHTML(c) {
  const kind = c.kind === 'faculty' ? 'faculty' : 'student';
  return `<div class="card ct2-card ct2-${kind}">${ctPhotoHTML(c, 'ct2-photo')}<div class="ct2-body"><h3>${esc(c.name)}</h3>${c.role ? `<p class="ct2-role">${esc(c.role)}</p>` : ''}${c.regNo ? `<span class="chip acc">Register No: ${esc(c.regNo)}</span>` : ''}${c.dept ? `<span class="xs muted">${esc(c.dept)}</span>` : ''}${c.desc ? `<p class="small muted ct2-desc">${esc(c.desc)}</p>` : ''}</div></div>`;
}

/* Styles for the redesigned Contributors view (injected once; scoped to ct2- classes so nothing else is affected). */
function ctInjectStyle() {
  if (document.getElementById('ct2-style')) return;
  const st = document.createElement('style'); st.id = 'ct2-style';
  st.textContent = `
.ct2-wrap{max-width:1040px;margin:0 auto}
.ct2-group{margin:0 0 34px}
.ct2-h{display:flex;align-items:center;gap:12px;margin:0 0 14px;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.ct2-h::after{content:"";flex:1;height:1px;background:var(--line2,rgba(128,128,128,.3))}
.ct2-students{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;align-items:stretch}
.ct2-card{display:flex;flex-direction:column;padding:14px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.12)}
.ct2-photo{width:100%;aspect-ratio:4/5;overflow:hidden;border-radius:8px;background:rgba(128,128,128,.12);flex:none}
.ct2-photo img{display:block;object-position:center 20%}
.ct2-photo .ct-initials{font-size:34px;font-weight:600;color:var(--muted);opacity:.7}
.ct2-body{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:14px 4px 4px}
.ct2-body h3{margin:0;font-size:18px;line-height:1.3}
.ct2-role{margin:0;font-size:14px;font-weight:600}
.ct2-desc{margin:2px 0 0}
.ct2-faculty{flex-direction:row;gap:22px;max-width:720px;margin:0 auto;padding:18px;border-left:4px solid var(--accent)}
.ct2-faculty .ct2-photo{width:200px}
.ct2-faculty .ct2-body{padding:6px 0;justify-content:center}
.ct2-faculty .ct2-body h3{font-size:21px}
.ct2-others{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px}
@media (max-width:900px){.ct2-students{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:560px){
  .ct2-students{grid-template-columns:1fr}
  .ct2-students .ct2-card{max-width:340px;width:100%;margin:0 auto}
  .ct2-faculty{flex-direction:column;align-items:center;text-align:center}
  .ct2-faculty .ct2-photo{width:100%;max-width:240px}
  .ct2-faculty .ct2-body{align-items:center}
}`;
  document.head.appendChild(st);
}

/* Same person = same register number OR same name (a name match counts even if the register numbers differ) */
function ctSame(a, b) {
  const reg = x => String(x.regNo || '').trim().toLowerCase();
  const nm = x => String(x.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (reg(a) && reg(b) && reg(a) === reg(b)) return true;
  return !!nm(a) && nm(a) === nm(b);
}
/* Pick one record per person, keeping the one with a photo (else the first). Does not touch storage. */
function ctDedupe(all) {
  const out = [];
  for (const c of all) {
    const i = out.findIndex(x => x.id === c.id || ctSame(x, c));
    if (i < 0) out.push(c);
    else if (!(out[i].photo || '').trim() && (c.photo || '').trim()) out[i] = c;
  }
  return out;
}
/* Same as ctDedupe, but also deletes the duplicate records from IndexedDB. Returns the records that remain. */
async function ctPurgeDuplicates() {
  const all = await IDB.all('contrib');
  const kept = ctDedupe(all);
  const keptIds = new Set(kept.map(c => c.id));
  for (const c of all) {
    if (!keptIds.has(c.id)) await IDB.del(c.id, 'contrib');
  }
  return kept;
}

VIEWS.contributors = () => {
  MOUNT = async () => {
    const root = $('#ct-root'); if (!root) return;
    let list;
    try {
      list = await IDB.all('contrib');
      // Project team defaults are part of the source code, so they are available
      // on every deployment/account even when this browser's IndexedDB is empty.
      const permanentTeam = [
        { id: 'eer-team-shree-devi-s', img: 'assets/contributors/student3.jpg', kind: 'student', name: 'Shree Devi S', role: 'JavaScript', regNo: '25BCE5780', dept: 'CSE Core', desc: 'Integration & Deployment', order: 1 },
        { id: 'eer-team-liya-ann-john', img: 'assets/contributors/student2.jpg', kind: 'student', name: 'Liya Ann John', role: 'DBMS Concepts & Schema Design', regNo: '25BCE5761', dept: 'CSE Core', desc: 'DBMS Concepts & Schema Design', order: 2 },
        { id: 'eer-team-shreyashi-k', img: 'assets/contributors/student1.jpg', kind: 'student', name: 'Shreyashi K', role: 'Frontend & Visualization', regNo: '25BCE5744', dept: 'CSE Core', desc: 'Frontend & Visualization', order: 3 },
        { id: 'eer-team-faculty-swaminathan-annadurai', img: 'assets/contributors/faculty.jpg', kind: 'faculty', name: 'Dr. Swaminathan Annadurai', role: 'Faculty Mentor', desc: 'Project Guidance, Technical Mentorship and Review', order: 4 }
      ];
      for (const member of permanentTeam) {
        const matches = list.filter(c => c.id === member.id || ctSame(c, member));

        if (matches.length === 0) {
          await IDB.put(member, 'contrib');
        } else {
          // Prefer a record that already has an uploaded photo
          const keep = matches.find(c => typeof c.photo === 'string' && c.photo.trim()) || matches[0];
          const merged = { ...member, ...keep, id: keep.id, photo: keep.photo || '' };
          await IDB.put(merged, 'contrib');

          // Remove duplicate records
          for (const duplicate of matches) {
            if (duplicate.id !== keep.id) await IDB.del(duplicate.id, 'contrib');
          }
        }
        list = await IDB.all('contrib');
      }
      list = await ctPurgeDuplicates();
    }
    catch (e) { root.innerHTML = `<div class="note warn">Contributor storage is not available in this browser (${esc(e.message || 'error')}), so contributors cannot be shown or saved here.</div>`; return; }
    if (!list.length) { root.innerHTML = `<div class="empty"><h3>No contributors have been added yet</h3><p>${DB.settings.editor ? 'Add the team in the content manager.' : 'Turn on editor mode in Settings, then open Admin → Contributors to add the team.'}</p>${DB.settings.editor ? '<a class="btn pri" href="#/admin/contributors">Add contributors</a>' : '<button class="btn pri" data-act="settings">Open Settings</button>'}</div>`; return; }
    ctInjectStyle();
    const ctGroup = (k, label, g) => g.length ? `<div class="ct2-group"><h3 class="ct2-h">${label}</h3><div class="${k === 'student' ? 'ct2-students' : k === 'faculty' ? 'ct2-facultywrap' : 'ct2-others'}">${g.map(ctCardHTML).join('')}</div></div>` : '';
    root.innerHTML = `<div class="ct2-wrap">${CT_KINDS.map(([k, label]) => ctGroup(k, label, list.filter(c => (c.kind || 'other') === k))).join('')}</div>` + (DB.settings.editor ? '<p style="text-align:center"><a class="btn sm" href="#/admin/contributors">Manage contributors</a></p>' : '');
  };
  return `<div class="page-h" style="text-align:center;justify-content:center;margin-bottom:28px"><div style="max-width:700px"><span class="chip acc" style="margin-bottom:8px">Academic Project Team</span><h1 style="margin:0 0 8px;font-size:32px">CONTRIBUTORS</h1><p style="margin:0 auto">The people behind the EER Lab – Generalization &amp; Specialization Visualizer project.</p></div></div><div id="ct-root"><span class="muted small">Loading…</span></div>`;
};
/* Read a photo, check it really is PNG/JPG/WebP, crop to a square and shrink so storage stays small. */
async function ctReadPhoto(file) {
  const t = await sniffImageType(file);
  if (!VISION_TYPES[t]) throw new Error('Choose a PNG, JPG or WebP photo.');
  if (file.size > 6e6) throw new Error('The photo is larger than 6 MB. Choose a smaller one.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('The photo could not be decoded. It may be corrupt.')); i.src = url; });
    const side = Math.min(img.naturalWidth, img.naturalHeight), out = Math.min(480, side), cv = document.createElement('canvas'); cv.width = cv.height = out;
    cv.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, out, out);
    return cv.toDataURL('image/jpeg', 0.88);
  } finally { URL.revokeObjectURL(url); }
}

/* ---------- Competitive Questions ---------- */
/* One renderer for the student page AND the admin preview.
   o.open = explanation expanded (student page); o.key = admin "answer key" mode (always shows answer + explanation). */
function cqCardHTML(q, o = {}) {
  const show = !!(o.open || o.key), diffClass = q.d === 'easy' ? 'ok' : q.d === 'hard' ? 'bad' : 'warn', tp = topicById(q.topic);
  const sol = q.sol || q.e || '';
  return `<div class="card" style="margin-bottom:14px;border-left:4px solid var(--accent)">
    <div class="row sb" style="margin-bottom:8px">
      <div class="row" style="gap:6px">
        <span class="marks-chip">+${esc(q.marks || 2)} Marks</span>
        <span class="chip ${diffClass}">${cap(q.d || 'medium')}</span>
        <span class="chip info">${esc(q.exam || 'GATE')} ${esc(q.year || '')}</span>
        <span class="chip">${esc(tp ? tp.t : (q.topic || 'No topic'))}</span>
        ${q.timeLimit ? `<span class="chip">⏱ ${esc(q.timeLimit)}s</span>` : ''}
      </div>
      <span class="xs muted">Question #${(o.idx || 0) + 1}</span>
    </div>
    <h4 style="margin:0 0 10px;font-size:15px;line-height:1.5">${esc(q.q) || '<span class="muted">(question statement is empty)</span>'}</h4>
    <div class="col" style="gap:6px;margin-bottom:12px">
      ${(q.o || []).map((opt, oi) => `
        <div class="opt" style="cursor:default;padding:8px 10px;${show && oi === q.a ? 'border-color:var(--ok);background:rgba(63,214,163,.12)' : ''}">
          <b>${'ABCD'[oi]}</b>
          <span>${esc(opt) || '<span class="muted">(empty option)</span>'}</span>
          ${show && oi === q.a ? `<span class="chip ok xs" style="margin-left:auto">Correct Answer${o.key ? ' (admin only)' : ''}</span>` : ''}
        </div>`).join('')}
    </div>
    <div class="row sb">
      ${o.key ? '<span></span>' : `<button class="btn xs" data-act="${o.solAct || 'cq-togglesol'}" data-id="${esc(q.id || '')}">${o.open ? 'Hide Explanation' : 'View Detailed Explanation'}</button>`}
      <span class="xs muted">Source: ${esc(q.source || 'Curated Database Exam')}</span>
    </div>
    ${show ? `<div class="note ok small" style="margin-top:10px"><b>Detailed Solution &amp; Conceptual Analysis:</b><br>${esc(sol) || '<span class="muted">(no explanation entered)</span>'}</div>` : ''}
  </div>`;
}
const CF = { topic: '', d: '', openSol: {} };
const cqFiltered = () => (DB.cq || []).filter(q => (!CF.topic || q.topic === CF.topic) && (!CF.d || q.d === CF.d));

VIEWS.competitive = () => {
  const list = cqFiltered();
  const allCq = DB.cq || [];
  const compAttempts = (DB.attempts || []).filter(a => a.kind === 'cq');
  const compScore = compAttempts.reduce((s, a) => s + (a.meta && a.meta.marksObtained != null ? a.meta.marksObtained : a.correct * 2), 0);
  const totalAttempted = compAttempts.reduce((s, a) => s + a.total, 0);
  const totalCorrect = compAttempts.reduce((s, a) => s + a.correct, 0);
  const accuracy = totalAttempted ? Math.round(100 * totalCorrect / totalAttempted) : 0;

  return `
  <div class="page-h">
    <div>
      <span class="chip acc" style="margin-bottom:6px">Challenging Examination Problems</span>
      <h2>Competitive Questions</h2>
      <p>Challenging problems covering Generalization, Specialization, Aggregation, Inheritance, Constraints, and Schema Mapping.</p>
    </div>
    ${DB.settings.editor ? '<a class="btn" href="#/admin/competitive">Manage Questions in Admin</a>' : ''}
  </div>

  <!-- Performance Summary Cards -->
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:18px">
    <div class="card">
      <div class="row sb"><span class="small muted">Verified Problems</span><span class="chip ok">${allCq.length} Questions</span></div>
      <div class="stat" style="font-size:26px;margin-top:4px">${allCq.length}</div>
      <span class="xs muted">Challenging curriculum bank</span>
    </div>
    <div class="card">
      <div class="row sb"><span class="small muted">Competitive Score</span><span class="marks-chip">${compScore} Pts</span></div>
      <div class="stat" style="font-size:26px;margin-top:4px">${compScore}</div>
      <span class="xs muted">${compAttempts.length} competitive attempts</span>
    </div>
    <div class="card">
      <div class="row sb"><span class="small muted">Questions Attempted</span><span class="chip info">${totalAttempted}</span></div>
      <div class="stat" style="font-size:26px;margin-top:4px">${totalAttempted}</div>
      <span class="xs muted">${totalCorrect} correct answers</span>
    </div>
    <div class="card">
      <div class="row sb"><span class="small muted">Competitive Accuracy</span><span class="chip ${accuracy >= 70 ? 'ok' : 'warn'}">${totalAttempted ? accuracy + '%' : '–'}</span></div>
      <div class="stat" style="font-size:26px;margin-top:4px">${totalAttempted ? accuracy + '%' : '–'}</div>
      <span class="xs muted">Examination accuracy rate</span>
    </div>
  </div>

  <!-- Filter & Start Bar -->
  <div class="card" style="margin-bottom:18px">
    <div class="grid g3">
      <label class="f">Filter by Difficulty
        <select data-chg="cf-d">
          <option value="">All Difficulties</option>
          <option value="easy" ${CF.d === 'easy' ? 'selected' : ''}>Easy (2 Marks)</option>
          <option value="medium" ${CF.d === 'medium' ? 'selected' : ''}>Medium (2 Marks)</option>
          <option value="hard" ${CF.d === 'hard' ? 'selected' : ''}>Hard (4 Marks)</option>
        </select>
      </label>
      <label class="f">Filter by EER Topic
        <select data-chg="cf-topic">
          ${topicOpts(CF.topic, 'All EER Topics')}
        </select>
      </label>
      <div class="row" style="align-items:flex-end">
        <button class="btn pri grow" data-act="cq-start" ${list.length ? '' : 'disabled'}>
          ${ico('play')} Start Competitive Exam (${list.length})
        </button>
      </div>
    </div>
  </div>

  <!-- Question List -->
  ${list.length ? `
    <div class="page-h" style="margin-bottom:10px">
      <div>
        <h3 style="margin:0">Available Questions (${list.length})</h3>
        <span class="small muted">Click on any question to examine options or reveal comprehensive step-by-step reasoning</span>
      </div>
    </div>
    ${list.map((q, idx) => cqCardHTML(q, { idx, open: !!CF.openSol[q.id] })).join('')}
  ` : `
    <div class="empty">
      <h3>No questions match the current filter</h3>
      <p>Try resetting the difficulty or topic filter to view all questions.</p>
      <button class="btn" data-act="cq-resetfilters">Reset Filters</button>
    </div>
  `}
  `;
};

INP['cf-d'] = el => { CF.d = el.value; rerender(); };
INP['cf-topic'] = el => { CF.topic = el.value; rerender(); };
ACT['cq-togglesol'] = el => {
  const id = el.dataset.id;
  CF.openSol[id] = !CF.openSol[id];
  const y = window.scrollY;
  rerender();
  window.scrollTo(0, y);
};
ACT['cq-resetfilters'] = () => {
  CF.d = '';
  CF.topic = '';
  rerender();
};
ACT['cq-start'] = () => {
  const qs = cqFiltered();
  startQuiz({
    kind: 'cq',
    title: 'Competitive Examination Set' + (CF.d ? ` (${cap(CF.d)})` : '') + (CF.topic ? `: ${topicById(CF.topic).t}` : ''),
    qs: qs.map(q => ({
      id: 'cq:' + q.id,
      q: q.q,
      o: q.o,
      a: q.a,
      e: q.sol || q.e || '',
      topic: q.topic,
      marks: q.marks || (q.d === 'hard' ? 4 : 2),
      src: `${q.exam || 'GATE'} · ${q.source || 'Competitive Examination'}`
    })),
    back: '/competitive'
  });
};

/* ---------- Progress / Learning Page ---------- */
function topicStats() {
  return Object.entries(DB.tagg).filter(([k]) => topicById(k)).map(([k, v]) => ({
    id: k,
    n: v.n,
    ok: v.ok,
    a: acc(v.n, v.ok),
    wrong: v.n - v.ok
  })).sort((x, y) => x.a - y.a);
}
const isWeak = s => s.n >= 3 && s.a < 60 && s.wrong >= 2;

VIEWS.progress = () => {
  const done = TOPICS.filter(t => DB.progress[t.id] === 'dn').length;
  const ts = topicStats(), weak = ts.filter(isWeak), A = DB.attempts;
  const tot = ts.reduce((a, s) => a + s.n, 0), ok = ts.reduce((a, s) => a + s.ok, 0);
  const tm = ts.reduce((a, s) => a + (DB.tagg[s.id].t || 0), 0);

  const cqList = DB.cq || [];
  const compAttempts = A.filter(a => a.kind === 'cq');
  const compScore = compAttempts.reduce((s, a) => s + (a.meta && a.meta.marksObtained != null ? a.meta.marksObtained : a.correct * 2), 0);
  const compTotalAns = compAttempts.reduce((s, a) => s + a.total, 0);
  const compCorrectAns = compAttempts.reduce((s, a) => s + a.correct, 0);
  const compPct = compTotalAns ? Math.round(100 * compCorrectAns / compTotalAns) : 0;

  const vids = DB.videos || [];
  const vidsDone = Object.values(DB.vdone || {}).filter(Boolean).length;
  const vidPct = vids.length ? Math.round(100 * vidsDone / vids.length) : 0;

  // Weighted overall progress
  const topicsPart = (done / (TOPICS.length || 1)) * 40;
  const practicePart = (tot ? Math.min(1, tot / 25) : 0) * 25;
  const compPart = (compAttempts.length ? Math.min(1, compAttempts.length / 5) : 0) * 20;
  const vidPart = (vids.length ? Math.min(1, vidsDone / vids.length) : 0) * 15;
  const overallPct = Math.min(100, Math.round(topicsPart + practicePart + compPart + vidPart));

  // Category progress breakdown
  const catProgress = GROUPS.map(g => {
    const groupTopics = TOPICS.filter(t => t.g === g);
    const grpDone = groupTopics.filter(t => DB.progress[t.id] === 'dn').length;
    const p = pct(grpDone, groupTopics.length);
    return { name: g, total: groupTopics.length, done: grpDone, pct: p };
  });

  const lastAttempts = A.slice(0, 10).reverse();
  const chart = lastAttempts.length ? `<svg viewBox="0 0 ${lastAttempts.length * 40 + 20} 130" style="width:100%;max-width:520px" role="img" aria-label="Accuracy of last quizzes">${lastAttempts.map((a, i) => { const h = pct(a.correct, a.total) * 0.9; return `<rect x="${i * 40 + 14}" y="${105 - h}" width="26" height="${h}" rx="4" style="fill:var(--accent)"/><text x="${i * 40 + 27}" y="${100 - h}" text-anchor="middle" style="fill:var(--muted);font-size:10px">${pct(a.correct, a.total)}</text>`; }).join('')}<line x1="8" y1="105" x2="${lastAttempts.length * 40 + 14}" y2="105" style="stroke:var(--line2)"/></svg>` : '<div class="empty">Take a quiz to visualize your trend.</div>';

  return `
  <div class="page-h">
    <div>
      <span class="chip acc" style="margin-bottom:6px">Student Academic Mastery</span>
      <h2>Learn &amp; Progress Dashboard</h2>
      <p>Comprehensive tracking across learning modules, competitive problem solving, and curated video lectures.</p>
    </div>
    <div class="row">
      <a class="btn pri" href="#/learn">Browse Learning Path</a>
      <a class="btn" href="#/competitive">Competitive Exam Sets</a>
    </div>
  </div>

  <!-- Metric Summary Cards -->
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin-bottom:24px">
    <div class="card">
      <div class="row sb" style="margin-bottom:4px"><span class="small muted">Overall Completion</span><span class="chip acc">${overallPct}%</span></div>
      <div class="stat">${overallPct}%</div>
      <div class="bar" style="margin-top:8px"><i style="width:${overallPct}%"></i></div>
      <span class="xs muted" style="margin-top:4px;display:block">Combined laboratory completion</span>
    </div>

    <div class="card">
      <div class="row sb" style="margin-bottom:4px"><span class="small muted">Topics Completed</span><span class="chip ok">${done}/${TOPICS.length}</span></div>
      <div class="stat">${done} / ${TOPICS.length}</div>
      <div class="bar" style="margin-top:8px"><i style="width:${pct(done, TOPICS.length)}%"></i></div>
      <span class="xs muted" style="margin-top:4px;display:block">${pct(done, TOPICS.length)}% curriculum completed</span>
    </div>

    <div class="card">
      <div class="row sb" style="margin-bottom:4px"><span class="small muted">Questions Attempted</span><span class="chip info">${tot}</span></div>
      <div class="stat">${tot}</div>
      <span class="xs muted" style="margin-top:4px;display:block">${ok} correct answers (${tot ? pct(ok, tot) + '%' : '–'} acc)</span>
    </div>

    <div class="card">
      <div class="row sb" style="margin-bottom:4px"><span class="small muted">Competitive Score</span><span class="marks-chip">${compScore} Pts</span></div>
      <div class="stat">${compScore}</div>
      <span class="xs muted" style="margin-top:4px;display:block">${compTotalAns} questions attempted (${compPct}% acc)</span>
    </div>

    <div class="card">
      <div class="row sb" style="margin-bottom:4px"><span class="small muted">Videos Completed</span><span class="chip ok">${vidsDone}/${vids.length || 6}</span></div>
      <div class="stat">${vidsDone} / ${vids.length || 6}</div>
      <div class="bar" style="margin-top:8px"><i style="width:${vidPct}%"></i></div>
      <span class="xs muted" style="margin-top:4px;display:block">${vidPct}% video lectures completed</span>
    </div>
  </div>

  <!-- Learning Module Progress Bars -->
  <div class="card" style="margin-bottom:26px">
    <div class="row sb" style="margin-bottom:12px">
      <div>
        <h3 style="margin:0">Curriculum Progress by Module</h3>
        <span class="small muted">Progress bars tracking each specific EER domain</span>
      </div>
    </div>

    <div class="grid g2" style="gap:14px">
      ${catProgress.map(c => `
        <div class="prog-card">
          <div class="row sb">
            <b>${esc(c.name)}</b>
            <span class="chip ${c.pct >= 80 ? 'ok' : c.pct > 0 ? 'info' : ''}">${c.done}/${c.total} (${c.pct}%)</span>
          </div>
          <div class="bar"><i style="width:${c.pct}%"></i></div>
        </div>
      `).join('')}

      <div class="prog-card">
        <div class="row sb">
          <b>Competitive Questions</b>
          <span class="chip ${compAttempts.length ? 'ok' : 'info'}">${compScore} Pts (${compTotalAns} attempted)</span>
        </div>
        <div class="bar"><i style="width:${Math.min(100, compAttempts.length * 20)}%"></i></div>
      </div>

      <div class="prog-card">
        <div class="row sb">
          <b>Curated Video Lectures</b>
          <span class="chip ${vidPct >= 80 ? 'ok' : 'info'}">${vidsDone}/${vids.length || 6} (${vidPct}%)</span>
        </div>
        <div class="bar"><i style="width:${vidPct}%"></i></div>
      </div>
    </div>
  </div>

  <!-- Curated Video Lectures Section with Embedded Player -->
  <div style="margin-bottom:28px">
    <div class="page-h" style="margin-bottom:12px">
      <div>
        <h3 style="margin:0">Curated Video Lectures</h3>
        <p class="small muted">Embedded lecture videos on EER modeling, constraints, and mappings. Watch and mark as completed to contribute to your overall progress.</p>
      </div>
      ${DB.settings.editor ? '<a class="btn sm" href="#/admin/videos">Manage Videos in Admin</a>' : ''}
    </div>

    ${vids.length ? `
      <div class="grid g2" style="gap:16px">
        ${vids.map(v => {
          const isVd = !!(DB.vdone && DB.vdone[v.id]);
          return `
          <div class="vid-card ${isVd ? 'done' : ''}">
            <div class="row sb" style="margin-bottom:8px">
              <span class="chip ${isVd ? 'ok' : 'info'}">${isVd ? ico('check') + ' Completed' : 'Instructional Lecture'}</span>
              <button class="btn xs ${isVd ? 'on' : 'pri'}" data-act="vcomp" data-id="${v.id}">
                ${isVd ? '✓ Completed (click to undo)' : 'Mark as Completed'}
              </button>
            </div>
            
            <h4 style="margin:4px 0 6px">${esc(v.title)}</h4>
            <div class="row" style="gap:6px;margin-bottom:8px">
              <span class="chip">${esc(topicById(v.topic) ? topicById(v.topic).t : v.topic)}</span>
              ${v.duration ? `<span class="chip">${esc(v.duration)}</span>` : ''}
              ${v.channel ? `<span class="xs muted">by ${esc(v.channel)}</span>` : ''}
            </div>

            ${ytEmbedHTML(v.url, v.title)}

            ${v.desc ? `<p class="small muted" style="margin:8px 0 6px">${esc(v.desc)}</p>` : ''}
          </div>`;
        }).join('')}
      </div>
    ` : '<div class="empty">No videos added yet.</div>'}
  </div>

  <!-- Weak Topics & Topic Accuracy -->
  <h3 style="margin-top:20px">Topic Revision &amp; Weak Areas</h3>
  ${weak.length ? `
    <div class="grid ga">${weak.map(s => `
      <div class="card" style="border-color:rgba(255,111,145,.5)">
        <b>${esc(topicById(s.id).t)}</b>
        <p class="small muted" style="margin:4px 0">${s.ok}/${s.n} correct (${s.a}%) · ${s.wrong} mistakes</p>
        <div class="row">
          <a class="btn xs" href="#/learn/${s.id}">Study Concept</a>
          <a class="btn xs" href="#/practice/${s.id}">Practice Questions</a>
        </div>
      </div>`).join('')}
    </div>
    <p class="xs muted">A topic is flagged when you have answered at least 3 questions, made at least 2 mistakes, and scored under 60%.</p>
  ` : `<div class="empty">${tot ? 'No weak topics right now. Excellent conceptual retention.' : 'No answers recorded yet. Try a mini quiz or Practice.'}</div>`}

  <div class="grid g2" style="margin-top:20px">
    <div class="card">
      <h3>Topic accuracy</h3>
      ${ts.length ? `
        <table class="t"><tbody>${ts.map(s => `
          <tr>
            <td><a href="#/learn/${s.id}">${esc(topicById(s.id).t)}</a></td>
            <td>${s.ok}/${s.n}</td>
            <td style="width:38%"><div class="bar"><i style="width:${s.a}%"></i></div></td>
            <td><span class="chip ${isWeak(s) ? 'bad' : s.a >= 80 && s.n >= 3 ? 'ok' : 'warn'}">${isWeak(s) ? 'weak' : s.a >= 80 && s.n >= 3 ? 'strong' : 'developing'}</span></td>
          </tr>`).join('')}</tbody></table>
      ` : '<p class="muted">No answers recorded yet.</p>'}
    </div>
    <div class="card">
      <h3>Recent Assessment Accuracy (%)</h3>
      ${chart}
    </div>
  </div>

  <!-- Assessment History -->
  <h3 style="margin-top:20px">Assessment History</h3>
  ${A.length ? `
    <div class="scroll-x">
      <table class="t">
        <thead>
          <tr>
            <th>Date</th>
            <th>Assessment Title</th>
            <th>Type</th>
            <th>Score</th>
            <th>Duration</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${A.map(a => `
            <tr>
              <td class="small">${new Date(a.ts).toLocaleDateString()}</td>
              <td><b>${esc(a.title)}</b></td>
              <td><span class="chip ${a.kind === 'cq' ? 'info' : 'acc'}">${a.kind === 'cq' ? 'Competitive Set' : 'Practice Quiz'}</span></td>
              <td>${a.meta && a.meta.marksObtained != null ? `${a.meta.marksObtained} Marks (${a.correct}/${a.total})` : `${a.correct}/${a.total}`}</td>
              <td>${fmtT(a.time)}</td>
              <td><a class="btn xs" href="#/attempt/${a.id}">Review</a></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  ` : '<div class="empty">No assessments taken yet.</div>'}
  `;
};

/* ---------- Overall Leaderboard ---------- */
const LB = { kind: '', period: '' };
VIEWS.leaderboard = () => {
  const now = Date.now(), per = { week: 7 * 864e5, month: 30 * 864e5 }[LB.period];
  const rows = (DB.attempts || []).filter(a => a.total >= 3 && (!LB.kind || a.kind === LB.kind) && (!per || now - a.ts < per)).map(a => ({
    ...a,
    acc: pct(a.correct, a.total),
    scoreDisplay: a.meta && a.meta.marksObtained != null ? a.meta.marksObtained : a.correct * 2
  })).sort((x, y) => y.scoreDisplay - x.scoreDisplay || y.acc - x.acc || x.time - y.time);

  const p = DB.profile || {};
  const studentName = p.name || DB.settings.name || 'Student';
  const regNo = p.regNo || '23BCE0001';

  // Personal performance aggregates
  const allAns = Object.values(DB.tagg).reduce((s, x) => s + x.n, 0);
  const correctAns = Object.values(DB.tagg).reduce((s, x) => s + x.ok, 0);
  const accuracy = allAns ? Math.round(100 * correctAns / allAns) : 0;
  
  const compAttempts = (DB.attempts || []).filter(a => a.kind === 'cq');
  const compScore = compAttempts.reduce((s, a) => s + (a.meta && a.meta.marksObtained != null ? a.meta.marksObtained : a.correct * 2), 0);
  const quizScores = (DB.attempts || []).map(a => a.meta && a.meta.marksObtained != null ? a.meta.marksObtained : a.correct * 2);
  const bestScore = quizScores.length ? Math.max(...quizScores) : 0;
  
  const doneTopics = TOPICS.filter(t => DB.progress[t.id] === 'dn').length;
  const vidsDone = Object.values(DB.vdone || {}).filter(Boolean).length;
  const overallPct = Math.min(100, Math.round((doneTopics / (TOPICS.length || 1)) * 40 + (allAns ? Math.min(1, allAns / 25) : 0) * 25 + (compAttempts.length ? Math.min(1, compAttempts.length / 5) : 0) * 20 + (vidsDone / 6) * 15));

  return `
  <div class="page-h">
    <div>
      <span class="chip acc" style="margin-bottom:6px">Performance Scorecard</span>
      <h2>Overall Leaderboard &amp; Rankings</h2>
      <p>Personal laboratory scorecard and verified quiz performance on this browser.</p>
    </div>
  </div>

  <!-- Mandatory Honest Ranking Notice -->
  <div class="note warn" style="margin-bottom:18px">
    <b>Global ranking requires shared student accounts and a shared backend.</b><br>
    Since this laboratory visualizer operates purely within your private browser environment, all performance metrics and attempt records displayed below are derived genuinely from your actual stored laboratory attempts, without simulated or hardcoded fake users.
  </div>

  <!-- Personal Performance Scorecard -->
  <div class="card" style="margin-bottom:22px;border-left:4px solid var(--accent)">
    <div class="row sb" style="margin-bottom:12px">
      <div>
        <h3 style="margin:0">${esc(studentName)}</h3>
        <span class="xs muted">Register No: ${esc(regNo)} · Single-user Offline Browser Session</span>
      </div>
      <span class="chip warn" style="font-weight:600">Rank: Not available (Local Session)</span>
    </div>

    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px">
      <div class="meta-item">
        <b>My Score</b>
        <span style="font-size:18px;color:var(--accent)">${compScore} Pts</span>
      </div>
      <div class="meta-item">
        <b>Best Score</b>
        <span style="font-size:18px;color:var(--ok)">${bestScore} Pts</span>
      </div>
      <div class="meta-item">
        <b>Questions Attempted</b>
        <span style="font-size:18px">${allAns}</span>
      </div>
      <div class="meta-item">
        <b>Accuracy</b>
        <span style="font-size:18px;color:var(--info)">${allAns ? accuracy + '%' : '–'}</span>
      </div>
      <div class="meta-item">
        <b>Overall Progress</b>
        <span style="font-size:18px">${overallPct}%</span>
      </div>
    </div>
  </div>

  <!-- Filter Controls -->
  <div class="row" style="margin:16px 0 12px">
    <label class="f" style="flex-direction:row;align-items:center;gap:6px">Assessment Category
      <select data-chg="lb-kind" style="width:auto">
        <option value="">All Categories</option>
        <option value="cq" ${LB.kind === 'cq' ? 'selected' : ''}>Competitive Questions</option>
        <option value="practice" ${LB.kind === 'practice' ? 'selected' : ''}>Practice Quiz</option>
      </select>
    </label>
    <label class="f" style="flex-direction:row;align-items:center;gap:6px">Period
      <select data-chg="lb-per" style="width:auto">
        <option value="">All Time</option>
        <option value="month" ${LB.period === 'month' ? 'selected' : ''}>Last 30 Days</option>
        <option value="week" ${LB.period === 'week' ? 'selected' : ''}>Last 7 Days</option>
      </select>
    </label>
  </div>

  <!-- Attempts Table -->
  ${rows.length ? `
    <div class="scroll-x">
      <table class="t">
        <thead>
          <tr>
            <th>Rank #</th>
            <th>Student</th>
            <th>Assessment / Test</th>
            <th>Category</th>
            <th>Score</th>
            <th>Accuracy</th>
            <th>Time</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows.slice(0, 25).map((a, i) => `
            <tr>
              <td><b>${i + 1}</b></td>
              <td>${esc(a.name || studentName)}</td>
              <td><a href="#/attempt/${a.id}"><b>${esc(a.title)}</b></a></td>
              <td><span class="chip ${a.kind === 'cq' ? 'info' : 'acc'}">${a.kind === 'cq' ? 'Competitive' : 'Practice'}</span></td>
              <td><b>${a.scoreDisplay} Pts</b> <span class="xs muted">(${a.correct}/${a.total})</span></td>
              <td><span class="chip ${a.acc >= 75 ? 'ok' : 'warn'}">${a.acc}%</span></td>
              <td>${fmtT(a.time)}</td>
              <td class="small muted">${new Date(a.ts).toLocaleDateString()}</td>
              <td><a class="btn xs" href="#/attempt/${a.id}">Review</a></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <p class="xs muted" style="margin-top:8px">Rankings sorted by highest score achieved, then accuracy, then fastest completion time (minimum 3 questions).</p>
  ` : `
    <div class="empty">
      No assessments meet the current criteria. Complete an assessment with at least 3 questions to record your score.
    </div>
  `}
  `;
};

INP['lb-kind'] = el => { LB.kind = el.value; rerender(); };
INP['lb-per'] = el => { LB.period = el.value; rerender(); };

/* ---------- Admin / Content Manager ---------- */
const AD = { vid: null, cq: null, ct: null, ctPhoto: undefined };

VIEWS.admin = sec => {
  if (!DB.settings.editor) return `<div class="empty"><h3>Content Manager is in view mode</h3><p>Turn on editor mode in Settings to manage videos, images, resources, and competitive questions. This is a local development toggle.</p><button class="btn pri" data-act="settings">Open Settings</button></div>`;
  sec = sec || 'videos';
  const secs = [
    ['videos', 'YouTube Videos'],
    ['competitive', 'Competitive Questions'],
    ['contributors', 'Contributors'],
    ['images', 'Diagram Images'],
    ['resources', 'Reference Resources'],
    ['data', 'Laboratory Data & Reset']
  ];
  const head = `
  <div class="page-h">
    <div>
      <span class="chip ok" style="margin-bottom:6px">Editor Mode Active</span>
      <h2>Laboratory Content Manager</h2>
      <p>Configure competitive questions, curated YouTube lectures, contributors, learning resources, and backups.</p>
    </div>
  </div>
  <div class="tabs">${secs.map(s => `<a href="#/admin/${s[0]}"><button class="${sec === s[0] ? 'on' : ''}" tabindex="-1">${s[1]}</button></a>`).join('')}</div>`;

  const tsel = (id, v) => `<select id="${id}">${topicOpts(v, 'Choose Topic')}</select>`;

  // Tab: Videos
  if (sec === 'videos') {
    const v = AD.vid || {};
    return head + `
    <div class="card" style="margin-bottom:18px">
      <h3>${v.id ? 'Edit' : 'Add New'} YouTube Video Lecture</h3>
      <div class="grid g2">
        <label class="f">Topic${tsel('av-topic', v.topic)}</label>
        <label class="f">Video Title<input id="av-title" value="${esc(v.title || '')}" placeholder="e.g. Disjoint and Overlapping Constraints"></label>
        <label class="f">YouTube URL<input id="av-url" value="${esc(v.url || '')}" placeholder="https://www.youtube.com/watch?v=..."></label>
        <label class="f">Channel / Instructor<input id="av-ch" value="${esc(v.channel || '')}" placeholder="e.g. NPTEL / Gate Smashers"></label>
        <label class="f">Duration (optional)<input id="av-dur" value="${esc(v.duration || '')}" placeholder="e.g. 14:20"></label>
        <label class="f">Description<input id="av-desc" value="${esc(v.desc || '')}" placeholder="Summary of what the video covers"></label>
      </div>
      <div class="row" style="margin-top:12px">
        <button class="btn pri" data-act="av-save">${v.id ? 'Save Changes' : 'Add Video Lecture'}</button>
        ${v.id ? '<button class="btn" data-act="av-cancel">Cancel Edit</button>' : ''}
      </div>
    </div>

    <h3>Configured Video Lectures (${DB.videos.length})</h3>
    ${DB.videos.length ? `
      <div class="grid g2" style="gap:12px">
        ${DB.videos.map(x => `
          <div class="card tight">
            <div class="row sb" style="margin-bottom:6px">
              <b>${esc(x.title)}</b>
              <div class="row">
                <button class="btn xs" data-act="av-edit" data-id="${x.id}">Edit</button>
                <button class="btn xs danger" data-act="vid-del" data-id="${x.id}">Delete</button>
              </div>
            </div>
            <div class="xs muted" style="margin-bottom:6px">
              ${esc(x.channel || '')} · ${esc(topicById(x.topic) ? topicById(x.topic).t : x.topic)} · ${esc(x.duration || '')}
            </div>
            ${ytEmbedHTML(x.url, x.title)}
          </div>
        `).join('')}
      </div>
    ` : '<div class="empty">No videos added yet.</div>'}`;
  }

  // Tab: Competitive Questions
  if (sec === 'competitive') {
    const c = AD.cq || { o: ['', '', '', ''], d: 'medium', marks: 2 };
    return head + `
    <div class="card" style="margin-bottom:18px">
      <h3>${c.id ? 'Edit' : 'Add New'} Competitive Question</h3>
      <div class="grid g4">
        <label class="f">Exam / Body
          <select id="ac-exam">
            <option ${c.exam === 'GATE CS' || c.exam === 'GATE' ? 'selected' : ''}>GATE CS</option>
            <option ${c.exam === 'UGC NET' ? 'selected' : ''}>UGC NET</option>
            <option ${c.exam === 'University Exam' ? 'selected' : ''}>University Exam</option>
          </select>
        </label>
        <label class="f">Year
          <input id="ac-year" type="number" min="1990" max="2100" value="${esc(c.year || 2024)}">
        </label>
        <label class="f">Topic
          ${tsel('ac-topic', c.topic)}
        </label>
        <label class="f">Difficulty
          <select id="ac-d">
            <option value="easy" ${c.d === 'easy' ? 'selected' : ''}>Easy</option>
            <option value="medium" ${c.d === 'medium' || !c.d ? 'selected' : ''}>Medium</option>
            <option value="hard" ${c.d === 'hard' ? 'selected' : ''}>Hard</option>
          </select>
        </label>
      </div>

      <div class="grid g2" style="margin-top:8px">
        <label class="f">Marks (Points)
          <input id="ac-marks" type="number" min="1" max="10" value="${esc(c.marks || 2)}">
        </label>
        <label class="f">Time Limit (Seconds, Optional)
          <input id="ac-tlimit" type="number" min="30" max="600" value="${esc(c.timeLimit || 90)}">
        </label>
      </div>

      <label class="f" style="margin-top:8px">Question Statement
        <textarea id="ac-q" rows="3" style="font-family:var(--f-body)">${esc(c.q || '')}</textarea>
      </label>

      <div class="grid g2" style="margin-top:8px">
        ${[0, 1, 2, 3].map(i => `
          <label class="f">Option ${'ABCD'[i]}
            <input id="ac-o${i}" value="${esc((c.o && c.o[i]) || '')}">
          </label>
        `).join('')}
      </div>

      <div class="grid g2" style="margin-top:8px">
        <label class="f">Correct Option
          <select id="ac-a">
            ${[0, 1, 2, 3].map(i => `
              <option value="${i}" ${c.a === i ? 'selected' : ''}>Option ${'ABCD'[i]}</option>
            `).join('')}
          </select>
        </label>
        <label class="f">Source / Citation
          <input id="ac-src" value="${esc(c.source || 'GATE CS / Conceptual EER')}">
        </label>
      </div>

      <label class="f" style="margin-top:8px">Solution / Detailed Explanation
        <textarea id="ac-sol" rows="2" style="font-family:var(--f-body)">${esc(c.sol || c.e || '')}</textarea>
      </label>

      <label class="ck" style="margin-top:8px">
        <input type="checkbox" id="ac-ver" ${c.id ? 'checked' : ''}> I verified this question and its answer against standard textbook/exam specifications.
      </label>

      <div class="row" style="margin-top:12px">
        <button class="btn pri" data-act="ac-save">${c.id ? 'Save Changes' : 'Add Competitive Question'}</button>
        <button class="btn" data-act="ac-preview-form">Preview</button>
        ${c.id ? '<button class="btn" data-act="ac-cancel">Cancel</button>' : ''}
      </div>
      <p class="xs muted" style="margin:6px 0 0">Preview shows what you typed above exactly as a student sees it, without saving.</p>
    </div>

    <div class="card" style="margin-bottom:18px">
      <h3>Import &amp; Export JSON</h3>
      <p class="small muted">Bulk manage questions in JSON format: [{"exam","year","topic","d","marks","q","o":[4],"a":0-3,"source","sol"}]</p>
      <textarea id="ac-json" rows="3" placeholder='[{"exam":"GATE CS","year":2024,"topic":"generalization","d":"medium","marks":2,...}]'></textarea>
      <div class="row" style="margin-top:8px">
        <button class="btn sm" data-act="ac-import">Import JSON</button>
        <button class="btn sm" data-act="ac-preview-json">Preview JSON (without importing)</button>
        <button class="btn sm" data-act="ac-export" ${DB.cq.length ? '' : 'disabled'}>Export All as JSON</button>
      </div>
    </div>

    <div class="row sb" style="margin-bottom:8px"><h3 style="margin:0">Configured Questions (${DB.cq.length})</h3><div class="row"><button class="btn sm pri" data-act="ac-new">+ Add Question</button>${DB.cq.length ? '<button class="btn sm" data-act="ac-preview-all">Preview all</button>' : ''}</div></div>
    ${DB.cq.length ? `
      <div class="scroll-x">
        <table class="t">
          <thead>
            <tr>
              <th>Exam &amp; Year</th>
              <th>Topic</th>
              <th>Diff</th>
              <th>Marks</th>
              <th>Question</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${DB.cq.map(q => `
              <tr>
                <td><b>${esc(q.exam || 'GATE')} ${esc(q.year || '')}</b></td>
                <td>${esc(topicById(q.topic) ? topicById(q.topic).t : q.topic)}</td>
                <td><span class="chip ${q.d === 'easy' ? 'ok' : q.d === 'hard' ? 'bad' : 'warn'}">${q.d}</span></td>
                <td><b>+${q.marks || 2}M</b></td>
                <td style="max-width:380px">${esc(String(q.q || '').slice(0, 100))}${String(q.q || '').length > 100 ? '…' : ''}</td>
                <td style="white-space:nowrap">
                  <button class="btn xs" data-act="ac-preview" data-id="${q.id}">Preview</button>
                  <button class="btn xs" data-act="ac-edit" data-id="${q.id}">Edit</button>
                  <button class="btn xs danger" data-act="ac-del" data-id="${q.id}">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '<div class="empty">No questions configured.</div>'}
    `;
  }

  // Tab: Contributors
  if (sec === 'contributors') {
    const c = AD.ct || { kind: 'student' }, photo = AD.ctPhoto !== undefined ? AD.ctPhoto : (c.photo || '');
    MOUNT = ctAdminList;
    return head + `
    <div class="card" style="margin-bottom:18px">
      <h3>${c.id ? 'Edit' : 'Add'} Contributor</h3>
      <div class="row" style="align-items:flex-start;gap:18px">
        <div style="text-align:center"><div id="ct-prev">${ctPhotoHTML({ name: c.name || '?', photo })}</div>
          <div class="row" style="justify-content:center;margin-top:8px"><button class="btn xs" data-act="ct-choose">Upload photo…</button><button class="btn xs" data-act="ct-rmphoto">Remove</button></div>
          <input type="file" id="ct-file" data-chg="ct-photo" accept="image/png,image/jpeg,image/webp" hidden>
          <p class="xs muted" style="max-width:150px">PNG, JPG or WebP. Cropped square and stored in this browser.</p></div>
        <div style="flex:1;min-width:260px"><div class="grid g2">
          <label class="f">Category<select id="ct-kind">${CT_KINDS.map(([k, l]) => `<option value="${k}" ${(c.kind || 'student') === k ? 'selected' : ''}>${l.replace(/s$/, '')}</option>`).join('')}</select></label>
          <label class="f">Name *<input id="ct-name" value="${esc(c.name || '')}" maxlength="80"></label>
          <label class="f">Role *<input id="ct-role" value="${esc(c.role || '')}" maxlength="80" placeholder="e.g. Project Contributor / Project Mentor"></label>
          <label class="f">Register number (optional)<input id="ct-reg" value="${esc(c.regNo || '')}" maxlength="30"></label>
          <label class="f">Department (optional)<input id="ct-dept" value="${esc(c.dept || '')}" maxlength="100"></label>
        </div>
        <label class="f" style="margin-top:8px">Contribution / description (optional)<textarea id="ct-desc" rows="2" maxlength="400" style="font-family:var(--f-body)">${esc(c.desc || '')}</textarea></label></div>
      </div>
      <div class="row" style="margin-top:12px"><button class="btn pri" data-act="ct-save">${c.id ? 'Save Changes' : 'Add Contributor'}</button>${c.id ? '<button class="btn" data-act="ct-cancel">Cancel</button>' : ''}</div>
    </div>
    <h3>Contributors</h3><div id="ct-admin-list"><span class="muted small">Loading…</span></div>
    <p class="xs muted">Contributors appear on the Contributors page grouped by category, in the order shown here.</p>`;
  }

  // Tab: Images
  if (sec === 'images') {
    return head + `
    <div class="card">
      <h3>Upload Learning Diagram Image</h3>
      <div class="row">
        <label class="f">Topic${tsel('ai-topic2', '')}</label>
        <button class="btn pri" data-act="ai-img" style="align-self:flex-end">Choose Image…</button>
        <input type="file" id="img-file" data-chg="img-file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
      </div>
      <p class="xs muted">PNG, JPG, WebP or GIF up to 4 MB. Saved in IndexedDB.</p>
    </div>
    <h3 style="margin-top:18px">Uploaded Diagram Images</h3>
    <div id="adm-gal" class="gal"><span class="muted small">Loading…</span></div>
    ${(MOUNT = async () => {
      const b = $('#adm-gal');
      try {
        const all = await IDB.all();
        b.innerHTML = all.length ? all.map(i => `
          <figure>
            <img src="${i.data}" alt="${esc(i.title)}">
            <figcaption>
              <b>${esc(i.title)}</b>
              <div class="xs muted">${esc(topicById(i.topic) ? topicById(i.topic).t : i.topic)}</div>
              <button class="btn xs danger" data-act="adm-imgdel" data-id="${i.id}" style="margin-top:4px">Delete</button>
            </figcaption>
          </figure>
        `).join('') : '<div class="empty" style="grid-column:1/-1">No diagram images uploaded yet.</div>';
      } catch (e) {
        b.innerHTML = `<div class="note warn" style="grid-column:1/-1">Image storage is unavailable here.</div>`;
      }
    }, '')}`;
  }

  // Tab: Resources
  if (sec === 'resources') {
    return head + `
    <div class="card">
      <h3>Add Learning Resource</h3>
      <div class="grid g2">
        <label class="f">Title<input id="ar-title"></label>
        <label class="f">Type
          <select id="ar-type">
            <option>Reference book</option>
            <option>Article</option>
            <option>Notes</option>
            <option>Website</option>
            <option>Other</option>
          </select>
        </label>
        <label class="f">Link (https://…)<input id="ar-url"></label>
        <label class="f">Topic${tsel('ar-topic', '')}</label>
      </div>
      <label class="f" style="margin-top:8px">Description<input id="ar-desc"></label>
      <button class="btn pri" data-act="ar-add" style="margin-top:10px">Add Resource</button>
    </div>
    <h3 style="margin-top:18px">Resources</h3>
    <table class="t"><tbody>
      ${[...SEED_RESOURCES, ...DB.resources].map(r => `
        <tr>
          <td><b>${esc(r.title)}</b><div class="xs muted">${esc(r.type)} · ${esc(r.desc || '')}</div></td>
          <td>${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Open ↗</a>` : ''}</td>
          <td>${r.seed ? '<span class="chip">Built-in</span>' : `<button class="btn xs danger" data-act="ar-del" data-id="${r.id}">Delete</button>`}</td>
        </tr>
      `).join('')}
    </tbody></table>`;
  }

  // Tab: Data & Reset
  const doneTopics = TOPICS.filter(t => DB.progress[t.id] === 'dn').length;
  const p = DB.profile || {};
  return head + `
  <div class="grid g2" style="margin-bottom:18px">
    <div class="card">
      <h3>Laboratory System Overview</h3>
      <table class="t">
        <tbody>
          <tr><th>Normal Topics</th><td>${TOPICS.length}</td></tr>
          <tr><th>Practice Questions</th><td>${PRACTICE.length}</td></tr>
          <tr><th>Competitive Questions</th><td>${DB.cq.length}</td></tr>
          <tr><th>Curated YouTube Videos</th><td>${DB.videos.length}</td></tr>
          <tr><th>Student Assessment Records</th><td>${DB.attempts.length}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>Active Student Record</h3>
      <table class="t">
        <tbody>
          <tr><th>Student Name</th><td><b>${esc(p.name || DB.settings.name)}</b></td></tr>
          <tr><th>Register Number</th><td>${esc(p.regNo || '23BCE0001')}</td></tr>
          <tr><th>Department</th><td>${esc(p.dept || 'Computer Science and Engineering')}</td></tr>
          <tr><th>Completed Topics</th><td>${doneTopics} / ${TOPICS.length}</td></tr>
          <tr><th>Videos Finished</th><td>${Object.values(DB.vdone || {}).filter(Boolean).length} / ${DB.videos.length}</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="grid g2">
    <div class="card">
      <h3>Backup &amp; Restore</h3>
      <p class="small muted">Exports student profile, progress, attempts, competitive questions, videos, contributors (with photos) and settings into a JSON backup file.</p>
      <div class="row">
        <button class="btn pri" data-act="bk-export">Export Full Backup</button>
        <button class="btn" data-act="bk-import">Import Backup File…</button>
        <input type="file" id="bk-file" data-chg="bk-file" accept=".json,application/json" hidden>
      </div>
    </div>

    <div class="card">
      <h3>Laboratory Reset Controls</h3>
      <p class="small muted">Reset progress metrics or reload built-in curriculum seed questions.</p>
      <div class="col" style="gap:8px">
        <button class="btn" data-act="adm-restoreseeds">Reload Default Questions &amp; Videos</button>
        <button class="btn danger" data-act="bk-reset">Reset Learning Progress &amp; Quiz History</button>
      </div>
    </div>
  </div>`;
};

/* Admin Actions */
/* Contributor admin actions */
async function ctAdminList() {
  const box = $('#ct-admin-list'); if (!box) return;
  try {
    const all = await ctPurgeDuplicates();
    box.innerHTML = all.length ? all.map(c => { const same = all.filter(x => (x.kind || 'other') === (c.kind || 'other')), pos = same.indexOf(c);
      return `<div class="ct-row">${ctPhotoHTML(c)}<div style="flex:1;min-width:0"><b>${esc(c.name)}</b> <span class="chip">${esc((CT_KINDS.find(k => k[0] === c.kind) || ['', 'Other'])[1].replace(/s$/, ''))}</span><div class="xs muted">${esc([c.role, c.regNo, c.dept].filter(Boolean).join(' · '))}</div></div><div class="row"><button class="btn xs" data-act="ct-move" data-id="${c.id}" data-d="-1" ${pos === 0 ? 'disabled' : ''} aria-label="Move up">↑</button><button class="btn xs" data-act="ct-move" data-id="${c.id}" data-d="1" ${pos === same.length - 1 ? 'disabled' : ''} aria-label="Move down">↓</button><button class="btn xs" data-act="ct-edit" data-id="${c.id}">Edit</button><button class="btn xs danger" data-act="ct-del" data-id="${c.id}">Delete</button></div></div>`; }).join('') : '<div class="empty">No contributors yet. Use the form above to add the first one.</div>';
  } catch (e) { box.innerHTML = `<div class="note warn">Contributor storage is not available in this browser (${esc(e.message || 'error')}).</div>`; }
}
ACT['ct-choose'] = () => $('#ct-file').click();
INP['ct-photo'] = async el => {
  const f = el.files[0]; el.value = ''; if (!f) return;
  try { AD.ctPhoto = await ctReadPhoto(f); const nm = $('#ct-name'); $('#ct-prev').innerHTML = ctPhotoHTML({ name: (nm && nm.value) || '?', photo: AD.ctPhoto }); }
  catch (e) { toast(e.message || 'The photo could not be used.', 'error'); }
};
ACT['ct-rmphoto'] = () => { AD.ctPhoto = ''; const nm = $('#ct-name'); $('#ct-prev').innerHTML = ctPhotoHTML({ name: (nm && nm.value) || '?', photo: '' }); };
ACT['ct-cancel'] = () => { AD.ct = null; AD.ctPhoto = undefined; rerender(); };
ACT['ct-edit'] = async el => { try { AD.ct = (await IDB.all('contrib')).find(c => c.id === el.dataset.id) || null; AD.ctPhoto = undefined; rerender(); window.scrollTo(0, 0); } catch (e) { toast('Could not load the contributor: ' + e.message, 'error'); } };
ACT['ct-save'] = async () => {
  const name = $('#ct-name').value.trim(), role = $('#ct-role').value.trim();
  if (!name) return toast('Enter the contributor\'s name.', 'warn');
  if (!role) return toast('Enter the contributor\'s role.', 'warn');
  try {
    const all = await IDB.all('contrib'), old = AD.ct;
    const rec = { id: old ? old.id : uid('ct'), kind: $('#ct-kind').value, name, role, regNo: $('#ct-reg').value.trim(), dept: $('#ct-dept').value.trim(), desc: $('#ct-desc').value.trim(), photo: AD.ctPhoto !== undefined ? AD.ctPhoto : (old ? old.photo || '' : ''), order: old ? old.order : (all.reduce((m, c) => Math.max(m, c.order ?? 0), 0) + 1) };
    await IDB.put(rec, 'contrib');
    toast(old ? 'Contributor updated.' : 'Contributor added.', 'ok'); AD.ct = null; AD.ctPhoto = undefined; rerender();
  } catch (e) { toast('Could not save the contributor: ' + (e.message || 'storage error') + (/quota/i.test(e.message || '') ? ' Try a smaller photo.' : ''), 'error', 7000); }
};
ACT['ct-del'] = async el => {
  if (!(await confirmBox('Delete this contributor and their photo?', 'Delete'))) return;
  try { await IDB.del(el.dataset.id, 'contrib'); if (AD.ct && AD.ct.id === el.dataset.id) AD.ct = null; rerender(); } catch (e) { toast('Could not delete: ' + e.message, 'error'); }
};
ACT['ct-move'] = async el => {
  try {
    const all = await IDB.all('contrib'), me = all.find(c => c.id === el.dataset.id); if (!me) return;
    const same = all.filter(c => (c.kind || 'other') === (me.kind || 'other')), j = same.indexOf(me) + +el.dataset.d, other = same[j]; if (!other) return;
    /* give every record a distinct order first (older records may not have one), then swap the two */
    all.forEach((c, i) => { c.order = i + 1; }); const t = me.order; me.order = other.order; other.order = t;
    await Promise.all(all.map(c => IDB.put(c, 'contrib'))); ctAdminList();
  } catch (e) { toast('Could not reorder: ' + e.message, 'error'); }
};

ACT['av-cancel'] = () => { AD.vid = null; rerender(); };
ACT['av-edit'] = el => { AD.vid = DB.videos.find(v => v.id === el.dataset.id); rerender(); };
ACT['av-save'] = async () => {
  const url = $('#av-url').value.trim(), vid = getYouTubeId(url), topic = $('#av-topic').value; let title = $('#av-title').value.trim(), channel = $('#av-ch').value.trim();
  if (!topic) return toast('Please select a topic.', 'warn');
  if (!vid) return toast('That is not a YouTube video link. Use youtube.com/watch?v=…, youtu.be/…, youtube.com/embed/… or youtube.com/shorts/….', 'error', 6000);
  const dup = DB.videos.find(v => getYouTubeId(v.url) === vid && v.id !== (AD.vid && AD.vid.id));
  if (dup) return toast('This video is already in the list ("' + dup.title + '").', 'warn');
  toast('Checking the video with YouTube…', 'info', 2000);
  const chk = await ytCheck(vid);
  if (chk.state === 'missing') return toast('YouTube says this video does not exist or is private. It was not added.', 'error', 7000);
  if (chk.state === 'blocked' && !(await confirmBox('The owner has disabled embedding for this video. It will show a thumbnail and a "Watch directly on YouTube" link instead of a player. Add it anyway?', 'Add anyway', false))) return;
  if (chk.state === 'ok') { title = title || chk.title; channel = channel || chk.author; }
  if (!title) return toast('Please enter a title (it could not be fetched automatically).', 'warn');
  const rec = { id: (AD.vid && AD.vid.id) || uid('v'), topic, title, url: ytWatchUrl(vid), channel, duration: $('#av-dur').value.trim(), desc: $('#av-desc').value.trim() };
  if (AD.vid) DB.videos = DB.videos.map(v => v.id === rec.id ? rec : v); else DB.videos.push(rec);
  DB.save('videos');
  toast(chk.state === 'ok' ? 'Video verified and saved.' : chk.state === 'unknown' ? 'Saved, but YouTube could not be reached to verify it (offline?).' : 'Video lecture saved.', chk.state === 'ok' ? 'ok' : 'warn');
  AD.vid = null; rerender();
};

ACT['ai-img'] = () => { const t = $('#ai-topic2').value; if (!t) return toast('Choose a topic first.', 'warn'); window.__imgTopic = t; $('#img-file').click(); };
ACT['adm-imgdel'] = async el => { if (!(await confirmBox('Delete this diagram image?', 'Delete'))) return; try { await IDB.del(el.dataset.id); rerender(); } catch (e) { toast('Could not delete: ' + e.message, 'error'); } };
ACT['ar-add'] = () => { const title = $('#ar-title').value.trim(), url = $('#ar-url').value.trim(); if (!title) return toast('Enter a title.', 'warn'); if (url && !/^https?:\/\/\S+$/.test(url)) return toast('The link must start with http:// or https://', 'error'); DB.resources.push({ id: uid('r'), title, type: $('#ar-type').value, url, topic: $('#ar-topic').value, desc: $('#ar-desc').value.trim() }); DB.save('resources'); toast('Resource added.', 'ok'); rerender(); };
ACT['ar-del'] = async el => { if (await confirmBox('Delete this resource?', 'Delete')) { DB.resources = DB.resources.filter(r => r.id !== el.dataset.id); DB.save('resources'); rerender(); } };

ACT['ac-cancel'] = () => { AD.cq = null; rerender(); };
ACT['ac-edit'] = el => { AD.cq = DB.cq.find(q => q.id === el.dataset.id); rerender(); };
ACT['ac-del'] = async el => { if (await confirmBox('Delete this competitive question?', 'Delete')) { DB.cq = DB.cq.filter(q => q.id !== el.dataset.id); DB.save('cq'); rerender(); } };

function cqCheck(x) {
  const e = [];
  const y = +x.year;
  if (!(y >= 1990 && y <= 2100)) e.push('year is invalid');
  if (!topicById(x.topic)) e.push('topic is invalid');
  if (!['easy', 'medium', 'hard'].includes(x.d)) e.push('difficulty must be easy, medium, or hard');
  if (!String(x.q || '').trim()) e.push('question statement is required');
  if (!Array.isArray(x.o) || x.o.length !== 4 || x.o.some(o => !String(o).trim())) e.push('four non-empty options are required');
  if (!(Number.isInteger(x.a) && x.a >= 0 && x.a < 4)) e.push('correct option must be 0-3');
  return e;
}

/* Read the Add/Edit form (also used by Preview, so unsaved text can be previewed). */
function acRead() {
  return {
    id: (AD.cq && AD.cq.id) || uid('cq'),
    exam: $('#ac-exam').value, year: +$('#ac-year').value, topic: $('#ac-topic').value, d: $('#ac-d').value,
    marks: Math.max(1, +$('#ac-marks').value || 2), timeLimit: Math.max(30, +$('#ac-tlimit').value || 90),
    q: $('#ac-q').value.trim(), o: [0, 1, 2, 3].map(i => $('#ac-o' + i).value.trim()), a: +$('#ac-a').value,
    source: $('#ac-src').value.trim() || 'Curated Competitive Question', sol: $('#ac-sol').value.trim(),
    added: (AD.cq && AD.cq.added) || Date.now()
  };
}
ACT['ac-save'] = () => {
  if (!$('#ac-ver').checked) return toast('Please check the verification confirmation box.', 'warn');
  const x = acRead(), e = cqCheck(x);
  if (e.length) return toast('Cannot save: ' + e[0], 'error');
  if (AD.cq) DB.cq = DB.cq.map(q => q.id === x.id ? x : q);
  else DB.cq.push(x);
  DB.save('cq');
  AD.cq = null;
  toast('Competitive question saved.', 'ok');
  rerender();
};
ACT['ac-new'] = () => { AD.cq = null; rerender(); window.scrollTo(0, 0); const f = $('#ac-q'); if (f) f.focus(); };

/* Admin preview: same cqCardHTML the student page uses. Modes: Answer key (answer + explanation shown) / Student view. */
const PV = { list: [], i: 0, mode: 'key', open: false, warns: [] };
function pvHTML() {
  const q = PV.list[PV.i], issues = cqCheck(q), n = PV.list.length;
  return `<div class="pv-banner"><div><span class="chip warn">Admin preview</span> <span class="small muted">${n > 1 ? `Question ${PV.i + 1} of ${n}` : 'Not shown to students in this form'}</span></div>
    <div class="row"><button class="btn xs ${PV.mode === 'key' ? 'on' : ''}" data-act="pv-mode" data-m="key">Answer key</button><button class="btn xs ${PV.mode === 'student' ? 'on' : ''}" data-act="pv-mode" data-m="student">Student view</button>${n > 1 ? `<button class="btn xs" data-act="pv-nav" data-d="-1" ${PV.i === 0 ? 'disabled' : ''}>← Prev</button><button class="btn xs" data-act="pv-nav" data-d="1" ${PV.i === n - 1 ? 'disabled' : ''}>Next →</button>` : ''}<button class="btn xs" data-act="closemodal">Close</button></div></div>
    ${PV.warns.length ? `<div class="note warn small"><b>Skipped from this preview:</b> ${PV.warns.map(esc).join('; ')}</div>` : ''}
    ${issues.length ? `<div class="note bad small"><b>This question cannot be saved yet:</b> ${issues.map(esc).join('; ')}.</div>` : ''}
    ${cqCardHTML(q, { idx: PV.i, key: PV.mode === 'key', open: PV.open, solAct: 'pv-sol' })}
    <p class="xs muted">${PV.mode === 'key' ? 'The green highlight and explanation are visible to admins only. Students see them only after pressing “View Detailed Explanation”.' : 'This is what a student sees: no answer is revealed until they open the explanation.'}</p>`;
}
function pvOpen(list, i = 0, warns = []) {
  if (!list.length) return toast('There is nothing to preview.', 'warn');
  Object.assign(PV, { list, i, mode: 'key', open: false, warns });
  openModal(`<div id="pv-body">${pvHTML()}</div>`, { wide: true });
}
const pvDraw = () => { const b = $('#pv-body'); if (b) b.innerHTML = pvHTML(); };
ACT['pv-mode'] = el => { PV.mode = el.dataset.m; PV.open = false; pvDraw(); };
ACT['pv-nav'] = el => { PV.i = Math.max(0, Math.min(PV.list.length - 1, PV.i + +el.dataset.d)); PV.open = false; pvDraw(); };
ACT['pv-sol'] = () => { PV.open = !PV.open; pvDraw(); };
ACT['ac-preview'] = el => { const q = DB.cq.find(x => x.id === el.dataset.id); if (!q) return toast('Question not found.', 'error'); pvOpen(clone(DB.cq), DB.cq.indexOf(q)); };
ACT['ac-preview-all'] = () => pvOpen(clone(DB.cq), 0);
ACT['ac-preview-form'] = () => pvOpen([acRead()], 0);
ACT['ac-preview-json'] = () => {
  let arr; try { arr = JSON.parse($('#ac-json').value); if (!Array.isArray(arr)) throw 0; } catch (e) { return toast('Paste a valid JSON array of questions first.', 'error'); }
  const ok = [], warns = [];
  arr.forEach((x, i) => { const e = cqCheck(x || {}); if (e.length) warns.push(`#${i + 1}: ${e[0]}`); else ok.push(cqNormalize(x, 'p' + i)); });
  if (!ok.length) return toast('None of the questions in the JSON are valid: ' + (warns[0] || 'empty array'), 'error', 7000);
  pvOpen(ok, 0, warns);
};
/* One normaliser for imported JSON: used by import and by Preview JSON so both treat the data identically. */
function cqNormalize(x, id) {
  return { id: id || uid('cq'), exam: x.exam || 'GATE CS', year: +x.year || 2024, topic: x.topic, d: x.d || 'medium', marks: +x.marks || 2, timeLimit: +x.timeLimit || 90, q: String(x.q).trim(), o: x.o.map(String), a: x.a, source: String(x.source || 'Imported'), sol: String(x.sol || x.e || ''), added: Date.now() };
}

ACT['ac-import'] = () => {
  let arr;
  try { arr = JSON.parse($('#ac-json').value); if (!Array.isArray(arr)) throw 0; }
  catch (e) { return toast('Invalid JSON array.', 'error'); }
  let added = 0; const bad = [];
  arr.forEach((x, i) => {
    const e = cqCheck(x || {});
    if (e.length) bad.push(`#${i + 1}: ${e[0]}`);
    else {
      DB.cq.push(cqNormalize(x));
      added++;
    }
  });
  DB.save('cq');
  toast(`Imported ${added} question(s).` + (bad.length ? ` Skipped ${bad.length}` : ''), bad.length ? 'warn' : 'ok');
  rerender();
};

ACT['ac-export'] = () => saveFile('competitive-questions.json', JSON.stringify(DB.cq, null, 2));

ACT['adm-restoreseeds'] = async () => {
  if (await confirmBox('Reload default built-in competitive questions and YouTube video lectures?', 'Reload', false)) {
    DB.cq = clone(SEED_CQ);
    DB.videos = clone(SEED_VIDEOS);
    DB.save('cq');
    DB.save('videos');
    toast('Default competitive questions and videos restored.', 'ok');
    rerender();
  }
};

ACT['bk-export'] = async () => { let contributors = []; try { contributors = await IDB.all('contrib'); } catch (e) { toast('Contributors could not be read and are not in this backup.', 'warn'); } return saveFile('eer-lab-backup.json', JSON.stringify({
  v: 2,
  profile: DB.profile,
  settings: DB.settings,
  progress: DB.progress,
  attempts: DB.attempts,
  pstats: DB.pstats,
  tagg: DB.tagg,
  videos: DB.videos,
  vdone: DB.vdone,
  resources: DB.resources,
  cq: DB.cq,
  extras: DB.extras,
  contributors
}, null, 2)); };

ACT['bk-import'] = () => $('#bk-file').click();
INP['bk-file'] = el => {
  const f = el.files[0]; el.value = ''; if (!f) return;
  const r = new FileReader();
  r.onload = async () => {
    try {
      const o = JSON.parse(r.result);
      if (!o || typeof o.progress !== 'object') throw 0;
      if (!(await confirmBox('Replace current data with this backup file?', 'Import', false))) return;
      ['profile', 'settings', 'progress', 'attempts', 'pstats', 'tagg', 'videos', 'vdone', 'resources', 'cq', 'extras'].forEach(k => {
        if (o[k] !== undefined) { DB[k] = o[k]; DB.save(k); }
      });
      if (Array.isArray(o.contributors)) { try { for (const c of await IDB.all('contrib')) await IDB.del(c.id, 'contrib'); for (const c of o.contributors) if (c && c.id && c.name) await IDB.put(c, 'contrib'); } catch (e) { toast('Contributors in the backup could not be restored: ' + e.message, 'warn'); } }
      toast('Backup imported successfully.', 'ok');
      rerender();
    } catch (e) { toast('Invalid backup file format.', 'error'); }
  };
  r.readAsText(f);
};

ACT['bk-reset'] = async () => {
  if (await confirmBox('Delete all learning progress, quiz history, and answer stats?', 'Reset')) {
    DB.progress = {}; DB.attempts = []; DB.pstats = {}; DB.tagg = {}; DB.vdone = {};
    ['progress', 'attempts', 'pstats', 'tagg', 'vdone'].forEach(k => DB.save(k));
    toast('Learning progress reset.', 'ok');
    rerender();
  }
};

/* ---------- Help ---------- */
VIEWS.help = () => {
  const faq = [
    ['How do I build an EER generalization?', 'Open the Visualizer, select multiple entities (or press Generalize). Enter a superclass name, select primary key, pick common attributes to factor out, and configure disjoint/overlapping and completeness constraints.'],
    ['How do I specialize an entity?', 'Select an entity on the canvas and press Specialize (or "+ Subclass"). Specify subclass names and add their specialized attributes.'],
    ['How do I read standard EER notation?', 'The circle represents the ISA relationship. "d" stands for disjoint, "o" stands for overlapping. A double line from the superclass signifies total specialization; a single line signifies partial.'],
    ['Which mapping option should I choose?', 'Option A (separate tables) is universally applicable. Option B requires total specialization. Option C requires disjoint subclasses. Option D with boolean flags is best suited for overlapping subclasses.'],
    ['Where is my data stored?', 'All progress, student profile information, assessment attempts, and custom content are stored securely within your browser using localStorage and IndexedDB. Nothing is sent anywhere unless you press “Read diagram with AI” (the image goes to this app’s own server, which asks the AI model) or add a YouTube video (YouTube is asked whether it exists).'],
    ['How do competitive questions work?', 'Competitive questions feature challenging problems with marks allocation and optional timers. Completing them contributes directly to your Competitive Score and Student Profile.']
  ];
  const lim = [
    'No server of our own: all data, attempt records, and profile details stay in your browser. The only network calls are YouTube (thumbnails/players) and, if you choose it, the diagram-reading call that this app’s server makes to the AI service.',
    'Competitive questions and curated video lectures are stored locally and fully editable in Content Manager.',
    'YouTube video lectures embed directly into the Progress and Learn pages using standard privacy-enhanced embeds.',
    'Composite foreign keys and complex lattice diagrams can be analyzed in the Table/SQL Import workbench.'
  ];
  return `
  <div class="page-h">
    <div>
      <span class="chip acc" style="margin-bottom:6px">User Guide &amp; Reference</span>
      <h2>Help &amp; Documentation</h2>
      <p>Operational instructions, notation standards, and laboratory documentation.</p>
    </div>
  </div>
  <div class="grid g2">
    <div>
      <h3>Frequently Asked Questions</h3>
      ${faq.map(f => `<details class="acc"><summary>${esc(f[0])}</summary><div>${esc(f[1])}</div></details>`).join('')}
    </div>
    <div>
      <h3>Laboratory Principles</h3>
      <ul class="tight">${lim.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
      <h3 style="margin-top:16px">Keyboard Shortcuts</h3>
      <p class="small"><span class="kbd">/</span> Search · <span class="kbd">Ctrl</span>+<span class="kbd">Z</span> Undo · <span class="kbd">Delete</span> Remove selected entity</p>
      <h3 style="margin-top:16px">Reference Resources</h3>
      ${[...SEED_RESOURCES, ...DB.resources].map(r => `
        <div class="card tight" style="margin-bottom:8px">
          <b>${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>` : esc(r.title)}</b>
          <div class="xs muted">${esc(r.type)}${r.desc ? ' · ' + esc(r.desc) : ''}</div>
        </div>
      `).join('')}
    </div>
  </div>`;
};

/* ---------- Search ---------- */
function searchIndex() {
  const ix = [];
  TOPICS.forEach(t => ix.push({ k: 'Topic', t: t.t, s: t.what, h: '/learn/' + t.id, x: (t.t + ' ' + t.what + ' ' + (t.terms || []).map(a => a[0]).join(' ')).toLowerCase() }));
  EXAMPLES.forEach(e => ix.push({ k: 'Example', t: e.title, s: e.problem, h: '/examples/' + e.id, x: (e.title + ' ' + e.problem + ' ' + e.tag).toLowerCase() }));
  PRACTICE.forEach(p => ix.push({ k: 'Quiz', t: p.q, s: TYPES_P[p.type] || 'Practice', h: '/practice/' + p.topic, x: (p.q + ' ' + p.o.join(' ')).toLowerCase() }));
  (DB.videos || []).forEach(v => ix.push({ k: 'Video', t: v.title, s: v.channel || '', h: '/progress', x: (v.title + ' ' + (v.desc || '')).toLowerCase() }));
  [...SEED_RESOURCES, ...DB.resources].forEach(r => ix.push({ k: 'Resource', t: r.title, s: r.desc || '', h: '/help', x: (r.title + ' ' + (r.desc || '')).toLowerCase() }));
  (DB.cq || []).forEach(q => ix.push({ k: 'Competitive', t: q.q.slice(0, 90), s: `${q.exam || 'GATE'} ${q.year || ''} (${q.d || 'medium'})`, h: '/competitive', x: q.q.toLowerCase() }));
  ix.push({ k: 'Page', t: 'Student Profile', s: 'Laboratory profile, identity, and performance', h: '/profile', x: 'student profile avatar record' });
  ix.push({ k: 'Page', t: 'Contributors', s: 'Student developers and faculty mentor', h: '/contributors', x: 'contributors team students faculty mentor' });
  return ix;
}

ACT.search = () => {
  openModal(`<div class="searchbox"><label class="sr" for="sq">Search</label><input id="sq" type="search" data-inp="sq" placeholder="Search topics, questions, competitive problems, videos…" autocomplete="off"></div><div id="sres" class="res" style="margin-top:10px;max-height:60vh;overflow:auto"><p class="small muted">Type to search. Try "generalization", "disjoint", or "competitive".</p></div>`);
  $('#sq').focus();
};

INP.sq = el => {
  const q = el.value.trim().toLowerCase(), box = $('#sres');
  if (!q) { box.innerHTML = '<p class="small muted">Type to search.</p>'; return; }
  const toks = q.split(/\s+/), res = searchIndex().map(i => ({ i, sc: toks.every(t => i.x.includes(t)) ? (i.t.toLowerCase().includes(q) ? 3 : 1) : 0 })).filter(r => r.sc).sort((a, b) => b.sc - a.sc).slice(0, 25);
  box.innerHTML = res.length ? res.map(({ i }) => `<a href="#${i.h}" data-act="closemodal"><span class="chip acc">${i.k}</span><span><b>${esc(i.t)}</b><br><span class="small muted">${esc((i.s || '').slice(0, 90))}</span></span></a>`).join('') : `<div class="empty">No results for "${esc(el.value)}".</div>`;
};

/* ---------- Boot ---------- */
function boot() {
  if (typeof initSeeds === 'function') initSeeds();
  applyTheme();
  renderNav();
  window.addEventListener('hashchange', route);
  route();
}
