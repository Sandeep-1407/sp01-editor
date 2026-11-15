/* SP01 Pro – editor UI: preview, playback, timeline, tool panels, gestures, export dialog */
'use strict';
const S = { t: 0, playing: false, pps: 60, sel: null, dirty: true, panel: null, pick: false, boxes: [], animTab: 'in' };
const stage = $('#stage');
let R = null;
try { R = createRenderer(stage); } catch (e) { $('#empty').innerHTML = '<div>WebGL error: ' + esc(e.message) + '</div>'; }

/* ---------------- lookup helpers ---------------- */
const LISTS = { clip: () => P.clips, overlay: () => P.overlays, text: () => P.texts, audio: () => P.audios, fx: () => P.fx };
const findItem = (sel) => sel && LISTS[sel.kind]?.().find((x) => x.id === sel.id);
const selItem = () => findItem(S.sel);
function select(kind, id) { S.sel = kind ? { kind, id } : null; S.pick = false; closePanel(); buildBar(); renderTL(); S.dirty = true; }
function clipAtPlayhead() { const L = layout(); return (L.find((r) => S.t >= r.start && S.t < r.end) || L[L.length - 1])?.c; }
function ensureClipSel() {
  if (S.sel && (S.sel.kind === 'clip' || S.sel.kind === 'overlay')) return selItem();
  const c = clipAtPlayhead(); if (!c) { toast(t('selectClip')); return null; }
  S.sel = { kind: 'clip', id: c.id }; buildBar(); renderTL(); return c;
}

/* ---------------- preview sources ---------------- */
const PV = new Map();
function pvEl(item, m) {
  let v = PV.get(item.id);
  if (!v) {
    v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = m.url;
    const mark = () => { S.dirty = true; }; v.addEventListener('seeked', mark); v.addEventListener('loadeddata', mark);
    PV.set(item.id, v);
  }
  return v;
}
function provider(item, st) {
  const m = MEDIA.get(item.mediaId); if (!m) return null;
  if (m.kind === 'image') return { el: m.img, w: m.w, h: m.h };
  const v = pvEl(item, m); v._used = true;
  const target = clamp(st, 0, Math.max(0, m.dur - .03));
  if (S.playing && !item.reverse) {
    const rate = clamp(item.speed, .0625, 16); if (v.playbackRate !== rate) v.playbackRate = rate;
    const drift = Math.abs(v.currentTime - target);
    if (v.paused) { if (drift > .05) v.currentTime = target; v.play().catch(() => {}); }
    else if (drift > .3) v.currentTime = target;
  } else {
    if (!v.paused) v.pause();
    if (Math.abs(v.currentTime - target) > 1 / 60 && !v.seeking) v.currentTime = target;
  }
  return v.readyState >= 2 ? { el: v, w: v.videoWidth, h: v.videoHeight } : null;
}
function dropItem(id) { const v = PV.get(id); if (v) { v.pause(); v.removeAttribute('src'); v.load(); PV.delete(id); } R?.drop('c' + id); R?.drop('o' + id); R?.drop('t' + id); }

/* ---------------- stage size ---------------- */
function fitStage() {
  const box = $('#pv').getBoundingClientRect(); const a = P.w / P.h;
  let cw = box.width - 16, ch = cw / a; if (ch > box.height - 16) { ch = box.height - 16; cw = ch * a; }
  cw = Math.max(40, cw); ch = Math.max(40, ch);
  stage.style.width = cw + 'px'; stage.style.height = ch + 'px';
  const dpr = Math.min(2, devicePixelRatio || 1); let pw = cw * dpr, ph = ch * dpr; const cap = 960 / Math.max(pw, ph); if (cap < 1) { pw *= cap; ph *= cap; }
  R?.resize(Math.round(pw / 2) * 2, Math.round(ph / 2) * 2); S.dirty = true;
}
new ResizeObserver(fitStage).observe($('#pv'));

/* ---------------- playback ---------------- */
let aNodes = [], aStart = 0, tStart = 0, master = null;
function play() {
  const T = totalDur(); if (T <= 0) return;
  const ctx = actx(); ctx.resume();
  if (!master) { master = ctx.createGain(); master.connect(ctx.destination); }
  if (S.t >= T - .05) S.t = 0;
  tStart = S.t; aStart = ctx.currentTime + .06; aNodes = scheduleAudio(ctx, master, tStart, aStart);
  S.playing = true; $('#playBtn').textContent = '❚❚';
}
function pause() {
  S.playing = false; for (const n of aNodes) { try { n.stop(); } catch {} } aNodes = [];
  for (const v of PV.values()) v.pause(); $('#playBtn').textContent = '▶'; S.dirty = true;
}
function restartAudio() { if (S.playing) { pause(); play(); } }
$('#playBtn').onclick = () => (S.playing ? pause() : play());

function loop() {
  if (S.playing) {
    S.t = tStart + Math.max(0, actx().currentTime - aStart);
    const T = totalDur(); if (S.t >= T) { S.t = T; pause(); }
    syncScroll(); S.dirty = true;
  }
  if (S.dirty && R) {
    S.dirty = false;
    for (const v of PV.values()) v._used = false;
    const T = totalDur();
    S.boxes = R.render(Math.min(S.t, Math.max(0, T - 1e-3)), provider);
    for (const v of PV.values()) if (!v._used && !v.paused) v.pause();
    drawSel();
    $('#tNow').textContent = fmtT(S.t); $('#tTot').textContent = fmtT(T);
  }
  requestAnimationFrame(loop);
}

/* ---------------- selection box on preview ---------------- */
function drawSel() {
  const sb = $('#selBox'); const b = S.sel && S.boxes.find((x) => x.id === S.sel.id && x.kind !== 'clip');
  if (!b) { sb.classList.add('hidden'); return; }
  const cw = stage.clientWidth, ch = stage.clientHeight;
  sb.classList.remove('hidden');
  Object.assign(sb.style, { width: b.w * cw + 'px', height: b.h * ch + 'px', left: b.cx * cw - b.w * cw / 2 + 'px', top: b.cy * ch - b.h * ch / 2 + 'px', transform: `rotate(${b.rot}rad)` });
}

/* ---------------- preview gestures: move / pinch / rotate / eyedropper ---------------- */
const ptrs = new Map(); let gest = null;
function hit(nx, ny) {
  const [W, H] = R.size;
  for (let i = S.boxes.length - 1; i >= 0; i--) {
    const b = S.boxes[i]; const dx = (nx - b.cx) * W, dy = (ny - b.cy) * H; const c = Math.cos(-b.rot), s = Math.sin(-b.rot);
    const lx = dx * c - dy * s, ly = dx * s + dy * c;
    if (Math.abs(lx) <= b.w * W / 2 && Math.abs(ly) <= b.h * H / 2) return { b, u: lx / (b.w * W) + .5, v: ly / (b.h * H) + .5 };
  }
  return null;
}
const norm = (e) => { const r = stage.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
stage.addEventListener('pointerdown', (e) => {
  stage.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, norm(e));
  if (S.pick) { pickColor(...norm(e)); return; }
  if (ptrs.size === 1) {
    const [nx, ny] = norm(e); const h = hit(nx, ny);
    if (h && h.b.kind !== 'clip') { if (!S.sel || S.sel.id !== h.b.id) select(h.b.kind, h.b.id); const it = selItem(); gest = { mode: 'move', sx: nx, sy: ny, ox: it.x, oy: it.y }; }
    else if (h && h.b.kind === 'clip') { if (!S.sel || S.sel.id !== h.b.id) select('clip', h.b.id); gest = null; }
    else { if (S.sel && S.sel.kind !== 'audio' && S.sel.kind !== 'fx') select(null); gest = null; }
  } else if (ptrs.size === 2) {
    const it = selItem(); if (!it || !('scale' in it)) return;
    const [a, b] = [...ptrs.values()]; const [W, H] = R.size;
    gest = { mode: 'pinch', d0: Math.hypot((a[0] - b[0]) * W, (a[1] - b[1]) * H), a0: Math.atan2((b[1] - a[1]) * H, (b[0] - a[0]) * W), s0: it.scale, r0: it.rot };
  }
});
stage.addEventListener('pointermove', (e) => {
  if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, norm(e));
  const it = selItem(); if (!gest || !it) return;
  if (gest.mode === 'move' && ptrs.size === 1) { const [nx, ny] = norm(e); it.x = clamp(gest.ox + nx - gest.sx, -.2, 1.2); it.y = clamp(gest.oy + ny - gest.sy, -.2, 1.2); S.dirty = true; }
  else if (gest.mode === 'pinch' && ptrs.size === 2) {
    const [a, b] = [...ptrs.values()]; const [W, H] = R.size;
    const d = Math.hypot((a[0] - b[0]) * W, (a[1] - b[1]) * H), ang = Math.atan2((b[1] - a[1]) * H, (b[0] - a[0]) * W);
    it.scale = clamp(gest.s0 * d / Math.max(1, gest.d0), .05, 8); let r = gest.r0 + ang - gest.a0;
    const snap = Math.round(r / (Math.PI / 2)) * Math.PI / 2; if (Math.abs(r - snap) < .06) r = snap; it.rot = r; S.dirty = true;
  }
});
const endPtr = (e) => { if (!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId); if (gest && !ptrs.size) { gest = null; commit(); } else if (ptrs.size === 1 && gest?.mode === 'pinch') gest = null; };
stage.addEventListener('pointerup', endPtr); stage.addEventListener('pointercancel', endPtr);
stage.addEventListener('wheel', (e) => { const it = selItem(); if (!it || !('scale' in it)) return; e.preventDefault(); it.scale = clamp(it.scale * (e.deltaY < 0 ? 1.06 : .94), .05, 8); S.dirty = true; clearTimeout(stage._w); stage._w = setTimeout(commit, 300); }, { passive: false });

function pickColor(nx, ny) {
  const o = selItem(); if (!o || S.sel.kind !== 'overlay') return;
  const b = S.boxes.find((x) => x.id === o.id); if (!b) return;
  const [W, H] = R.size; const dx = (nx - b.cx) * W, dy = (ny - b.cy) * H; const c = Math.cos(-b.rot), s = Math.sin(-b.rot);
  const u = (dx * c - dy * s) / (b.w * W) + .5, v = (dx * s + dy * c) / (b.h * H) + .5; if (u < 0 || u > 1 || v < 0 || v > 1) return;
  const m = MEDIA.get(o.mediaId); const el = m.kind === 'image' ? m.img : PV.get(o.id); if (!el) return;
  const sw = m.kind === 'image' ? m.w : el.videoWidth, sh = m.kind === 'image' ? m.h : el.videoHeight;
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(el, Math.floor(u * sw), Math.floor(v * sh), 1, 1, 0, 0, 1, 1); const [r, gg, bb] = g.getImageData(0, 0, 1, 1).data;
  o.keyColor = '#' + [r, gg, bb].map((x) => x.toString(16).padStart(2, '0')).join(''); o.chroma = true;
  S.pick = false; $('#pickHint').classList.add('hidden'); commit(); S.dirty = true; panelChroma();
}

/* ---------------- timeline ---------------- */
const tls = $('#tlScroll'), inner = $('#tlInner');
let scrollByCode = false;
const padL = () => tls.clientWidth / 2;
function syncScroll() { scrollByCode = true; tls.scrollLeft = S.t * S.pps; requestAnimationFrame(() => { scrollByCode = false; }); }
tls.addEventListener('scroll', () => {
  if (scrollByCode || drag) return;
  if (S.playing) pause();
  S.t = clamp(tls.scrollLeft / S.pps, 0, totalDur()); S.dirty = true;
});
function setZoom(pps) { S.pps = clamp(pps, 6, 500); renderTL(); syncScroll(); }
$('#zoomIn').onclick = () => setZoom(S.pps * 1.5); $('#zoomOut').onclick = () => setZoom(S.pps / 1.5);
let pinchTL = null;
tls.addEventListener('touchstart', (e) => { if (e.touches.length === 2) pinchTL = { d: Math.abs(e.touches[0].clientX - e.touches[1].clientX), p: S.pps }; }, { passive: true });
tls.addEventListener('touchmove', (e) => { if (pinchTL && e.touches.length === 2) { e.preventDefault(); const d = Math.abs(e.touches[0].clientX - e.touches[1].clientX); S.pps = clamp(pinchTL.p * d / Math.max(10, pinchTL.d), 6, 500); renderTL(); syncScroll(); } }, { passive: false });
tls.addEventListener('touchend', () => { pinchTL = null; });

function renderTL() {
  const T = totalDur(); const pl = padL(); const pps = S.pps;
  inner.style.width = pl * 2 + T * pps + 'px';
  const X = (tt) => pl + tt * pps;
  let h = '';
  // ruler
  const steps = [.25, .5, 1, 2, 5, 10, 15, 30, 60, 120]; const step = steps.find((s) => s * pps >= 64) || 300;
  h += '<div class="row ruler">'; for (let x = 0; x <= T + step; x += step) h += `<div class="tick" style="left:${X(x)}px">${fmtT(x).replace(/\.\d$/, '')}</div>`; h += '</div>';
  const sel = (id) => (S.sel?.id === id ? ' sel' : '');
  const handles = '<div class="h l" data-h="l"></div><div class="h r" data-h="r"></div>';
  // main
  const L = layout(); h += '<div class="row main">';
  if (!L.length) h += `<div class="rowlbl" style="left:${pl + 6}px;top:18px">🎬</div>`;
  L.forEach((r, i) => {
    const c = r.c; const m = MEDIA.get(c.mediaId); const w = Math.max(6, (r.end - r.start) * pps);
    const n = Math.max(1, Math.min(40, Math.round(w / 46))); let th = '';
    if (m?.thumbs?.length) for (let k = 0; k < n; k++) { const st = srcTime(c, (k + .5) / n * (r.end - r.start)); const idx = m.kind === 'image' ? 0 : clamp(Math.floor(st / m.dur * m.thumbs.length), 0, m.thumbs.length - 1); th += `<span style="background-image:url(${m.thumbs[idx]})"></span>`; }
    const tag = [c.speed !== 1 ? c.speed + 'x' : '', c.reverse ? '⟲' : '', c.filter !== 'none' ? '🎨' : '', c.volume === 0 ? '🔇' : ''].filter(Boolean).join(' ');
    h += `<div class="it${sel(c.id)}" data-k="clip" data-id="${c.id}" style="left:${X(r.start)}px;width:${w}px"><div class="thumbs">${th}</div><span class="lb">${fmtT(r.end - r.start)} ${tag}</span>${handles}</div>`;
    if (i < L.length - 1) h += `<button class="trBtn${c.trans !== 'none' ? ' on' : ''}" data-tr="${c.id}" style="left:${X(r.end - (L[i + 1].ov || 0) / 2)}px">${c.trans !== 'none' ? '⧓' : '|'}</button>`;
  });
  h += '</div>';
  // overlays, texts, fx, audio
  h += '<div class="row ovr">' + (P.overlays.length ? '' : `<div class="rowlbl" style="left:${pl + 6}px;top:6px">🖼️</div>`);
  for (const o of P.overlays) { const m = MEDIA.get(o.mediaId); h += `<div class="it${sel(o.id)}" data-k="overlay" data-id="${o.id}" style="left:${X(o.start)}px;width:${Math.max(6, clipDur(o) * pps)}px">${o.chroma ? '🟩 ' : '🖼️ '}${esc(m?.name || '')}${handles}</div>`; }
  h += '</div><div class="row txt">' + (P.texts.length ? '' : `<div class="rowlbl" style="left:${pl + 6}px;top:4px">🔤</div>`);
  for (const x of P.texts) h += `<div class="it${sel(x.id)}" data-k="text" data-id="${x.id}" style="left:${X(x.start)}px;width:${Math.max(6, x.dur * pps)}px">T ${esc(x.text.replace(/\n/g, ' '))}${handles}</div>`;
  h += '</div><div class="row fxr">' + (P.fx.length ? '' : `<div class="rowlbl" style="left:${pl + 6}px;top:2px">✨</div>`);
  for (const f of P.fx) h += `<div class="it${sel(f.id)}" data-k="fx" data-id="${f.id}" style="left:${X(f.start)}px;width:${Math.max(6, f.dur * pps)}px">${FX_ICON[f.type]} ${esc(nm(f.type))}${handles}</div>`;
  h += '</div><div class="row aud">' + (P.audios.length ? '' : `<div class="rowlbl" style="left:${pl + 6}px;top:8px">🎵</div>`);
  for (const a of P.audios) {
    const m = MEDIA.get(a.mediaId); const w = Math.max(6, (a.out - a.in) * pps);
    let beats = ''; for (const b of a.beats || []) if (b >= a.in && b <= a.out) beats += `<i class="beat" style="left:${(b - a.in) * pps}px"></i>`;
    h += `<div class="it${sel(a.id)}" data-k="audio" data-id="${a.id}" style="left:${X(a.start)}px;width:${w}px"><canvas data-wave="${a.id}"></canvas>${beats}<span class="lb">🎵 ${esc(m?.name || '')}</span>${handles}</div>`;
  }
  h += '</div>';
  inner.innerHTML = h;
  for (const cv of inner.querySelectorAll('canvas[data-wave]')) drawWave(cv, P.audios.find((a) => a.id === cv.dataset.wave));
  $('#empty').classList.toggle('hidden', !!(P.clips.length || P.overlays.length || P.texts.length || P.audios.length));
  $('#undoBtn').disabled = HIST.pos <= 0; $('#redoBtn').disabled = HIST.pos >= HIST.stack.length - 1;
}
function drawWave(cv, a) {
  const m = MEDIA.get(a?.mediaId); if (!m?.peaks) return;
  const w = cv.clientWidth || 100, h = cv.clientHeight || 30; cv.width = Math.min(4000, w); cv.height = h; const g = cv.getContext('2d'); g.fillStyle = 'rgba(160,210,255,.75)';
  const per = m.peaks.length / (m.audio.duration || 1); const span = a.out - a.in;
  for (let x = 0; x < cv.width; x++) { const st = a.in + x / cv.width * span; const p = m.peaks[Math.floor(st * per)] || 0; const bh = Math.max(1, p * h * a.volume * .95); g.fillRect(x, (h - bh) / 2 + 4, 1, bh - 4); }
}

/* timeline tap / trim / move */
let drag = null;
inner.addEventListener('pointerdown', (e) => {
  const tr = e.target.closest('[data-tr]'); if (tr) { select('clip', tr.dataset.tr); panelTrans(); return; }
  const itEl = e.target.closest('.it'); if (!itEl) { drag = { mode: 'tap', x: e.clientX }; return; }
  const kind = itEl.dataset.k, id = itEl.dataset.id; const handle = e.target.dataset.h;
  if (!S.sel || S.sel.id !== id) { drag = { mode: 'tap', x: e.clientX, sel: [kind, id] }; return; }
  const it = selItem(); if (!it) return;
  if (S.playing) pause();
  if (handle) { e.preventDefault(); itEl.setPointerCapture(e.pointerId); drag = { mode: 'trim', side: handle, x: e.clientX, o: JSON.parse(JSON.stringify(it)), it, kind }; }
  else if (kind !== 'clip') { itEl.setPointerCapture(e.pointerId); drag = { mode: 'move', x: e.clientX, o: it.start, it, moved: false }; }
  else drag = { mode: 'tap', x: e.clientX };
});
inner.addEventListener('pointermove', (e) => {
  if (!drag || drag.mode === 'tap') return;
  const dt = (e.clientX - drag.x) / S.pps; const it = drag.it; const m = MEDIA.get(it.mediaId);
  if (drag.mode === 'move') { if (Math.abs(e.clientX - drag.x) > 4) drag.moved = true; it.start = Math.max(0, drag.o + dt); }
  else {
    const o = drag.o; const kind = drag.kind;
    if (kind === 'text' || kind === 'fx') {
      if (drag.side === 'l') { const ns = clamp(o.start + dt, 0, o.start + o.dur - .2); it.start = ns; it.dur = o.dur - (ns - o.start); } else it.dur = Math.max(.2, o.dur + dt);
    } else if (kind === 'audio') {
      if (drag.side === 'l') { const d = clamp(dt, -o.in, o.out - o.in - .2); it.in = o.in + d; it.start = Math.max(0, o.start + d); } else it.out = clamp(o.out + dt, o.in + .2, m.dur);
    } else {
      const sp = o.speed; const maxOut = m.kind === 'image' ? 3600 : m.dur;
      if (drag.side === 'l') { const d = clamp(dt * sp, -o.in, o.out - o.in - .1); it.in = o.in + d; if (kind === 'overlay') it.start = Math.max(0, o.start + d / sp); }
      else it.out = clamp(o.out + dt * sp, o.in + .1, maxOut);
    }
  }
  S.dirty = true; renderTL();
});
inner.addEventListener('pointerup', (e) => {
  const d = drag; drag = null; if (!d) return;
  if (d.mode === 'tap') { if (Math.abs(e.clientX - d.x) < 6) { if (d.sel) select(d.sel[0], d.sel[1]); else if (S.sel) select(null); } return; }
  commit(); restartAudio();
});
inner.addEventListener('pointercancel', () => { drag = null; renderTL(); });

/* ---------------- bottom toolbar ---------------- */
function btn(icon, label, fn) { return { icon, label, fn }; }
function buildBar() {
  const it = selItem(); const k = S.sel?.kind; let list;
  if (!it) {
    list = [btn('🎬', t('addVideo'), () => pickFiles('#inMedia', addMedia)), btn('🔤', t('text'), addText), btn('🎵', t('audio'), () => pickFiles('#inAudio', addAudio)),
      btn('🎤', t('record'), toggleRec), btn('🖼️', t('overlay'), () => pickFiles('#inOverlay', addOverlay)), btn('✨', t('effects'), () => panelFx(true)),
      btn('🎨', t('filters'), () => ensureClipSel() && panelFilters()), btn('☀️', t('adjust'), () => ensureClipSel() && panelAdjust()),
      btn('📐', t('ratio'), panelRatio), btn('✂️', t('split'), splitAt)];
  } else if (k === 'clip' || k === 'overlay') {
    list = [btn('✂️', t('split'), splitAt), btn('⏩', t('speed'), panelSpeed), btn('🔊', t('volume'), panelVolume), btn('🎨', t('filters'), panelFilters), btn('☀️', t('adjust'), panelAdjust), btn('💫', t('anim'), panelAnim)];
    if (k === 'clip') list.push(btn('🔀', t('trans'), panelTrans), btn('⤢', it.fit === 'fill' ? t('fit') : t('fill'), () => { it.fit = it.fit === 'fill' ? 'fit' : 'fill'; commit(); buildBar(); }), btn('◀', '', () => moveClip(-1)), btn('▶', '', () => moveClip(1)));
    else list.push(btn('🟩', t('chroma'), panelChroma));
    list.push(btn('🔁', t('reverse'), () => { it.reverse = !it.reverse; commit(); toast(it.reverse ? t('reverseNote') : '✓'); }), btn('❄️', t('freeze'), freezeFrame), btn('⧉', t('dup'), dupItem), btn('🗑️', t('del'), delItem));
  } else if (k === 'text') list = [btn('✏️', t('edit'), panelText), btn('💫', t('anim'), panelAnim), btn('✂️', t('split'), splitAt), btn('⧉', t('dup'), dupItem), btn('🗑️', t('del'), delItem)];
  else if (k === 'audio') list = [btn('✂️', t('split'), splitAt), btn('🔊', t('volume'), panelVolume), btn('🥁', t('beats'), markBeats), btn('⧉', t('dup'), dupItem), btn('🗑️', t('del'), delItem)];
  else if (k === 'fx') list = [btn('✨', t('effects'), () => panelFx(false)), btn('✂️', t('split'), splitAt), btn('⧉', t('dup'), dupItem), btn('🗑️', t('del'), delItem)];
  const bar = $('#bar'); bar.innerHTML = '';
  if (it) { const b = document.createElement('button'); b.innerHTML = '<i>✕</i>' + esc(t('done')); b.onclick = () => select(null); bar.append(b); const s = document.createElement('span'); s.className = 'sep'; bar.append(s); }
  for (const x of list) { const b = document.createElement('button'); b.innerHTML = `<i>${x.icon}</i>${esc(x.label)}`; b.onclick = x.fn; bar.append(b); }
}

/* ---------------- adding things ---------------- */
function pickFiles(sel, cb) { const inp = $(sel); inp.value = ''; inp.onchange = () => { const fs = [...inp.files]; inp.value = ''; if (fs.length) cb(fs); }; inp.click(); }
function busy(on, txt) { $('#busy').classList.toggle('hidden', !on); if (txt) $('#busyTxt').textContent = txt; }
async function importMany(files) {
  const out = [];
  for (const f of files) { busy(true, t('decoding') + ' ' + f.name); try { out.push(await importFile(f)); } catch { toast('✗ ' + f.name); } }
  busy(false); return out;
}
function thumbsFor(m) { if (m.kind === 'audio' || m.thumbs.length || m._th) return; m._th = grabThumbs(m, m.kind === 'image' ? 1 : clamp(Math.ceil(m.dur / 1.5), 4, 40)).then((th) => { m.thumbs = th; renderTL(); }); }
async function addMedia(files) {
  const ms = await importMany(files);
  for (const m of ms) { if (m.kind === 'audio') { P.audios.push(newAudio(m, 0)); continue; } P.clips.push(newClip(m)); thumbsFor(m); }
  if (P.clips.length && ms.length && P.clips.length === ms.filter((m) => m.kind !== 'audio').length) autoRatio(MEDIA.get(P.clips[0].mediaId));
  commit();
}
function autoRatio(m) { if (!m?.w) return; const a = m.w / m.h; const best = Object.entries(RATIOS).sort((x, y) => Math.abs(x[1][0] / x[1][1] - a) - Math.abs(y[1][0] / y[1][1] - a))[0][0]; setRatio(best, true); }
async function addOverlay(files) { const [m] = await importMany(files); if (!m || m.kind === 'audio') return; const o = newOverlay(m, S.t); P.overlays.push(o); thumbsFor(m); commit(); select('overlay', o.id); }
async function addAudio(files) { const [m] = await importMany(files); if (!m) return; const a = newAudio(m, S.t); P.audios.push(a); commit(); select('audio', a.id); }
function addText() { const x = newText(S.t); P.texts.push(x); commit(); select('text', x.id); panelText(); setTimeout(() => { const ta = $('#pBody textarea'); ta?.focus(); ta?.select(); }, 60); }
window.onMediaAudio = () => { renderTL(); restartAudio(); };

/* voice-over */
let rec = null;
async function toggleRec() {
  if (rec) { rec.stop(); return; }
  let stream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { toast(t('micDenied')); return; }
  const chunks = []; const startT = S.t; const mr = new MediaRecorder(stream); rec = mr;
  mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  mr.onstop = async () => {
    stream.getTracks().forEach((x) => x.stop()); rec = null; $('#recDot').classList.add('hidden'); pause();
    const f = new File(chunks, `voice_${Date.now()}.webm`, { type: mr.mimeType || 'audio/webm' });
    try { const m = await importFile(f); await m.audioReady; if (m.audio) m.dur = m.audio.duration; const a = newAudio(m, startT); a.out = m.dur; P.audios.push(a); commit(); select('audio', a.id); } catch { toast('✗'); }
  };
  mr.start(); $('#recDot').textContent = '● ' + t('recStart'); $('#recDot').classList.remove('hidden'); $('#recDot').onclick = () => mr.stop();
  if (P.clips.length) play();
}

/* ---------------- edit actions ---------------- */
function nearBeat(tt) {
  let best = null;
  for (const a of P.audios) for (const b of a.beats || []) { const tl = a.start + b - a.in; if (Math.abs(tl - tt) < .12 && (!best || Math.abs(tl - tt) < Math.abs(best - tt))) best = tl; }
  return best ?? tt;
}
function splitAt() {
  const T = nearBeat(S.t); let k = S.sel?.kind; let it = selItem();
  if (!it) { const c = clipAtPlayhead(); if (!c) return; it = c; k = 'clip'; }
  const cp = (o) => Object.assign(JSON.parse(JSON.stringify(o)), { id: uid() });
  if (k === 'clip') {
    const L = layout(); const r = L.find((x) => x.c.id === it.id); if (!r || T <= r.start + .05 || T >= r.end - .05) return;
    const local = T - r.start; const cut = it.reverse ? it.out - local * it.speed : it.in + local * it.speed; const b = cp(it);
    if (it.reverse) { b.out = cut; it.in = cut; } else { it.out = cut; b.in = cut; }
    b.animIn = 'none'; it.animOut = 'none'; b.trans = it.trans; b.transDur = it.transDur; it.trans = 'none';
    P.clips.splice(P.clips.indexOf(it) + 1, 0, b);
  } else if (k === 'overlay') {
    const local = T - it.start; if (local <= .05 || local >= clipDur(it) - .05) return; const cut = it.reverse ? it.out - local * it.speed : it.in + local * it.speed; const b = cp(it);
    if (it.reverse) { b.out = cut; it.in = cut; } else { it.out = cut; b.in = cut; } b.start = T; P.overlays.push(b);
  } else if (k === 'text' || k === 'fx') {
    const local = T - it.start; if (local <= .05 || local >= it.dur - .05) return; const b = cp(it); b.start = T; b.dur = it.dur - local; it.dur = local; LISTS[k]().push(b);
  } else if (k === 'audio') {
    const local = T - it.start; if (local <= .05 || local >= it.out - it.in - .05) return; const b = cp(it); const cut = it.in + local; it.out = cut; b.in = cut; b.start = T; P.audios.push(b);
  }
  commit(); restartAudio();
}
function dupItem() {
  const it = selItem(); if (!it) return; const k = S.sel.kind; const b = Object.assign(JSON.parse(JSON.stringify(it)), { id: uid() });
  if (k === 'clip') P.clips.splice(P.clips.indexOf(it) + 1, 0, b);
  else { const d = k === 'text' || k === 'fx' ? it.dur : k === 'audio' ? it.out - it.in : clipDur(it); b.start = it.start + d; LISTS[k]().push(b); }
  commit(); select(k, b.id);
}
function delItem() { const it = selItem(); if (!it) return; const arr = LISTS[S.sel.kind](); arr.splice(arr.indexOf(it), 1); dropItem(it.id); S.sel = null; commit(); select(null); restartAudio(); }
function moveClip(dir) { const it = selItem(); const i = P.clips.indexOf(it); const j = i + dir; if (i < 0 || j < 0 || j >= P.clips.length) return; [P.clips[i], P.clips[j]] = [P.clips[j], P.clips[i]]; commit(); }
async function freezeFrame() {
  const it = selItem(); if (!it) return; const m = MEDIA.get(it.mediaId); if (m.kind === 'image') return;
  const v = PV.get(it.id); if (!v || v.readyState < 2) return;
  const cv = document.createElement('canvas'); cv.width = v.videoWidth; cv.height = v.videoHeight; cv.getContext('2d').drawImage(v, 0, 0);
  const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', .92)); const fm = await importFile(new File([blob], `freeze_${Date.now()}.jpg`, { type: 'image/jpeg' })); thumbsFor(fm);
  if (S.sel.kind === 'clip') {
    splitAt(); const idx = P.clips.findIndex((c) => c.id === it.id);
    const f = newClip(fm, { out: 2, filter: it.filter, filterAmt: it.filterAmt, adj: { ...it.adj }, fit: it.fit }); P.clips.splice(idx + 1, 0, f);
  } else { const o = newOverlay(fm, S.t); Object.assign(o, { x: it.x, y: it.y, scale: it.scale, rot: it.rot, out: 2, chroma: it.chroma, keyColor: it.keyColor }); P.overlays.push(o); }
  commit(); toast(t('freezeDone'));
}
function markBeats() {
  const a = selItem(); const m = MEDIA.get(a?.mediaId); if (!m?.audio) { toast(t('noBeats')); return; }
  a.beats = a.beats?.length ? [] : detectBeats(m.audio); commit(); toast(a.beats.length ? `🥁 ${a.beats.length} ${t('beatsFound')}` : '✓');
}
function setRatio(r, silent) { P.ratio = r; if (r === 'orig') { const m = MEDIA.get(P.clips[0]?.mediaId); if (m?.w) { const s = 1920 / Math.max(m.w, m.h); P.w = Math.round(m.w * s / 2) * 2; P.h = Math.round(m.h * s / 2) * 2; } } else [P.w, P.h] = RATIOS[r]; fitStage(); if (!silent) commit(); }

/* ---------------- panels ---------------- */
function openPanel(title, html, mount) {
  S.panel = title; $('#pTitle').textContent = title; $('#pBody').innerHTML = html; $('#panel').classList.remove('hidden'); $('#bar').classList.add('hidden');
  mount?.($('#pBody')); requestAnimationFrame(fitStage);
}
function closePanel() { if (!S.panel) return; S.panel = null; S.pick = false; $('#pickHint').classList.add('hidden'); $('#panel').classList.add('hidden'); $('#bar').classList.remove('hidden'); requestAnimationFrame(fitStage); }
$('#pDone').onclick = () => { closePanel(); buildBar(); };
const slider = (key, label, min, max, step, val, fmt = (v) => v) => `<label class="sl"><span>${esc(label)}</span><input type="range" data-s="${key}" min="${min}" max="${max}" step="${step}" value="${val}"><output>${fmt(val)}</output></label>`;
function bindSliders(root, onInput, fmts = {}) {
  root.querySelectorAll('input[type=range][data-s]').forEach((r) => {
    r.oninput = () => { onInput(r.dataset.s, +r.value); r.nextElementSibling.textContent = (fmts[r.dataset.s] || ((v) => v))(+r.value); S.dirty = true; };
    r.onchange = () => { commit(); restartAudio(); renderTL(); };
  });
}
const pct = (v) => Math.round(v * 100);

function panelFilters() {
  const it = selItem(); if (!it) return;
  const sw = { none: '#555', vivid: 'linear-gradient(135deg,#ff3d6e,#ffd23d,#3dff8b)', cinematic: 'linear-gradient(135deg,#0e5a6b,#e0954a)', warm: 'linear-gradient(135deg,#ff9a3d,#ffd36e)', cool: 'linear-gradient(135deg,#3d8bff,#9fe7ff)', vintage: 'linear-gradient(135deg,#a07a4c,#e5cfa1)', bw: 'linear-gradient(135deg,#111,#eee)', noir: 'linear-gradient(135deg,#000,#777)', film: 'linear-gradient(135deg,#6d6a52,#d9c8a0)', golden: 'linear-gradient(135deg,#c78b16,#ffe08c)', teal: 'linear-gradient(135deg,#0c7c86,#ff8a3d)', pink: 'linear-gradient(135deg,#ff7eb6,#ffd1e8)', fade: 'linear-gradient(135deg,#8c8aa0,#d9d6e6)', drama: 'linear-gradient(135deg,#1b1b2e,#b0a08c)', bright: 'linear-gradient(135deg,#fff3c4,#ffffff)', moody: 'linear-gradient(135deg,#1d2433,#5b6b7d)', retro: 'linear-gradient(135deg,#d7653a,#f3c96b)', food: 'linear-gradient(135deg,#e2401f,#ffb03d)', nature: 'linear-gradient(135deg,#1f8f3a,#a8e063)', neon: 'linear-gradient(135deg,#ff00d4,#00e5ff)', sepia: 'linear-gradient(135deg,#704214,#d8b88a)' };
  const thumb = MEDIA.get(it.mediaId)?.thumbs?.[0];
  const chips = FILTER_NAMES.map((f) => `<button class="fchip${it.filter === f ? ' on' : ''}" data-f="${f}"><span class="sw" style="background:${sw[f]}"></span>${esc(nm(f, 'filter'))}</button>`).join('');
  openPanel(t('filters'), `<div class="chips">${chips}</div>${slider('amt', t('amount'), 0, 1, .01, it.filterAmt, pct)}<button class="chip" id="fAll">${esc(t('apply_all'))}</button>`, (b) => {
    b.querySelectorAll('[data-f]').forEach((x) => x.onclick = () => { it.filter = x.dataset.f; b.querySelectorAll('[data-f]').forEach((y) => y.classList.toggle('on', y === x)); S.dirty = true; commit(); });
    bindSliders(b, (k, v) => { it.filterAmt = v; }, { amt: pct });
    $('#fAll').onclick = () => { for (const c of P.clips) { c.filter = it.filter; c.filterAmt = it.filterAmt; } commit(); toast('✓'); };
  });
  void thumb;
}
function panelAdjust() {
  const it = selItem(); if (!it) return; let key = S.adjKey || 'brightness';
  const draw = () => openPanel(t('adjust'), `<div class="chips">${ADJ_KEYS.map((k) => `<button class="chip${k === key ? ' on' : ''}" data-a="${k}">${esc(t(k))}${it.adj[k] ? ' •' : ''}</button>`).join('')}</div>
    ${slider('v', t(key), -100, 100, 1, Math.round(it.adj[key] * 100))}<div class="tog"><button class="chip" id="aReset">${esc(t('reset'))}</button><button class="chip" id="aAll">${esc(t('apply_all'))}</button></div>`, (b) => {
    b.querySelectorAll('[data-a]').forEach((x) => x.onclick = () => { key = S.adjKey = x.dataset.a; draw(); });
    bindSliders(b, (k, v) => { it.adj[key] = v / 100; });
    $('#aReset').onclick = () => { it.adj = ADJ0(); commit(); draw(); S.dirty = true; };
    $('#aAll').onclick = () => { for (const c of P.clips) c.adj = { ...it.adj }; commit(); toast('✓'); };
  });
  draw();
}
function panelAnim() {
  const it = selItem(); if (!it) return; const isText = S.sel.kind === 'text';
  const draw = () => {
    const tab = S.animTab; const k = tab === 'in' ? 'animIn' : 'animOut', kd = tab === 'in' ? 'animInDur' : 'animOutDur';
    const list = ANIMS.filter((a) => isText || a !== 'typewriter');
    openPanel(t('anim'), `<div class="seg"><button class="chip${tab === 'in' ? ' on' : ''}" data-tab="in">${esc(t('in'))}</button><button class="chip${tab === 'out' ? ' on' : ''}" data-tab="out">${esc(t('out'))}</button></div>
      <div class="chips">${list.map((a) => `<button class="chip${it[k] === a ? ' on' : ''}" data-an="${a}">${esc(nm(a))}</button>`).join('')}</div>${slider('d', t('duration'), .2, 3, .1, it[kd], (v) => v.toFixed(1) + 's')}`, (b) => {
      b.querySelectorAll('[data-tab]').forEach((x) => x.onclick = () => { S.animTab = x.dataset.tab; draw(); });
      b.querySelectorAll('[data-an]').forEach((x) => x.onclick = () => { it[k] = x.dataset.an; commit(); draw(); previewAnim(it, tab); });
      bindSliders(b, (_, v) => { it[kd] = v; }, { d: (v) => v.toFixed(1) + 's' });
    });
  };
  draw();
}
function previewAnim(it, tab) {
  let st = 0, d = 0;
  if (S.sel.kind === 'clip') { const r = layout().find((x) => x.c.id === it.id); st = r.start; d = r.end - r.start; }
  else { st = it.start; d = it.dur ?? clipDur(it); }
  S.t = tab === 'in' ? st : Math.max(st, st + d - (it.animOutDur || .5) - .05); syncScroll(); S.dirty = true; play();
  setTimeout(() => { if (S.playing) pause(); }, ((tab === 'in' ? it.animInDur : it.animOutDur) + .4) * 1000);
}
function panelTrans() {
  const it = selItem(); if (!it || S.sel.kind !== 'clip') return;
  const draw = () => openPanel(t('trans'), `<div class="chips">${TRANS.map((a) => `<button class="chip${it.trans === a ? ' on' : ''}" data-tr2="${a}">${esc(nm(a))}</button>`).join('')}</div>
    ${slider('d', t('duration'), .2, 2, .1, it.transDur, (v) => v.toFixed(1) + 's')}<button class="chip" id="tAll">${esc(t('apply_all'))}</button>`, (b) => {
    b.querySelectorAll('[data-tr2]').forEach((x) => x.onclick = () => {
      it.trans = x.dataset.tr2; commit(); draw();
      const r = layout().find((y) => y.c.id === it.id); if (r && it.trans !== 'none') { S.t = Math.max(0, r.end - it.transDur - .6); syncScroll(); play(); setTimeout(() => S.playing && pause(), (it.transDur + 1.2) * 1000); }
    });
    bindSliders(b, (_, v) => { it.transDur = v; }, { d: (v) => v.toFixed(1) + 's' });
    $('#tAll').onclick = () => { P.clips.slice(0, -1).forEach((c) => { c.trans = it.trans; c.transDur = it.transDur; }); commit(); toast('✓'); };
  });
  draw();
}
const SPEEDS = [.25, .5, .75, 1, 1.25, 1.5, 2, 3, 4];
function panelSpeed() {
  const it = selItem(); if (!it) return; const i0 = SPEEDS.indexOf(it.speed);
  openPanel(t('speed'), slider('sp', t('speed'), 0, SPEEDS.length - 1, 1, i0 < 0 ? 3 : i0, (v) => SPEEDS[v] + 'x') + `<div class="chips">${SPEEDS.map((s) => `<button class="chip${it.speed === s ? ' on' : ''}" data-sp="${s}">${s}x</button>`).join('')}</div>`, (b) => {
    bindSliders(b, (_, v) => { it.speed = SPEEDS[v]; renderTL(); }, { sp: (v) => SPEEDS[v] + 'x' });
    b.querySelectorAll('[data-sp]').forEach((x) => x.onclick = () => { it.speed = +x.dataset.sp; commit(); panelSpeed(); restartAudio(); });
  });
}
function panelVolume() {
  const it = selItem(); if (!it) return; const isA = S.sel.kind === 'audio';
  openPanel(t('volume'), slider('v', isA ? t('volume') : t('origVol'), 0, 2, .01, it.volume, pct) + (isA ? slider('fi', t('fadeIn'), 0, 5, .1, it.fadeIn, (v) => v.toFixed(1) + 's') + slider('fo', t('fadeOut'), 0, 5, .1, it.fadeOut, (v) => v.toFixed(1) + 's') : '')
    + `<div class="tog"><button class="chip" id="vMute">🔇 ${esc(t('mute'))}</button></div>`, (b) => {
    bindSliders(b, (k, v) => { if (k === 'v') it.volume = v; if (k === 'fi') it.fadeIn = v; if (k === 'fo') it.fadeOut = v; }, { v: pct, fi: (v) => v.toFixed(1) + 's', fo: (v) => v.toFixed(1) + 's' });
    $('#vMute').onclick = () => { it.volume = 0; commit(); restartAudio(); panelVolume(); };
  });
}
function panelChroma() {
  const o = selItem(); if (!o || S.sel.kind !== 'overlay') return;
  openPanel(t('chroma'), `<div class="tog"><button class="chip${o.chroma ? ' on' : ''}" id="ckOn">🟩 ${esc(t('keyOn'))}</button>
    <button class="sw2" style="background:#00ff00" data-kc="#00ff00" title="${esc(t('green'))}"></button><button class="sw2" style="background:#0047ff" data-kc="#0047ff" title="${esc(t('blue'))}"></button>
    <input type="color" id="ckCol" value="${o.keyColor}"><button class="chip" id="ckPick">💧 ${esc(t('pick'))}</button></div>
    ${slider('sim', t('similarity'), 0, 1, .01, o.similarity, pct)}${slider('sm', t('smooth'), 0, 1, .01, o.smooth, pct)}${slider('sp', t('spill'), 0, 1, .01, o.spill, pct)}${slider('op', t('opacity'), 0, 1, .01, o.opacity, pct)}`, (b) => {
    $('#ckOn').onclick = () => { o.chroma = !o.chroma; commit(); S.dirty = true; panelChroma(); };
    b.querySelectorAll('[data-kc]').forEach((x) => x.onclick = () => { o.keyColor = x.dataset.kc; o.chroma = true; commit(); S.dirty = true; panelChroma(); });
    $('#ckCol').oninput = (e) => { o.keyColor = e.target.value; o.chroma = true; S.dirty = true; }; $('#ckCol').onchange = () => commit();
    $('#ckPick').onclick = () => { S.pick = true; $('#pickHint').textContent = '💧 ' + t('pick'); $('#pickHint').classList.remove('hidden'); };
    bindSliders(b, (k, v) => { ({ sim: () => o.similarity = v, sm: () => o.smooth = v, sp: () => o.spill = v, op: () => o.opacity = v })[k](); }, { sim: pct, sm: pct, sp: pct, op: pct });
  });
}
const SWATCH = ['#ffffff', '#000000', '#ffe08c', '#e8be5c', '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7be', '#0a84ff', '#5e5ce6', '#bf5af2', '#ff2d92', '#8e8e93'];
function panelText() {
  const x = selItem(); if (!x || S.sel.kind !== 'text') return;
  const tab = S.textTab || 'style';
  openPanel(t('text'), `<textarea id="txIn">${esc(x.text)}</textarea>
    <div class="seg" style="margin-top:8px">${['style', 'font', 'color'].map((k) => `<button class="chip${tab === k ? ' on' : ''}" data-tt="${k}">${esc(t(k === 'style' ? 'style' : k))}</button>`).join('')}</div>
    <div id="txTab"></div>`, (b) => {
    $('#txIn').oninput = (e) => { x.text = e.target.value || ' '; S.dirty = true; clearTimeout(b._c); b._c = setTimeout(() => { commit(); }, 500); };
    b.querySelectorAll('[data-tt]').forEach((y) => y.onclick = () => { S.textTab = y.dataset.tt; panelText(); });
    const tb = $('#txTab');
    if (tab === 'font') {
      tb.innerHTML = `<div class="chips" style="flex-wrap:wrap">${FONTS.map(([f]) => `<button class="chip${x.font === f ? ' on' : ''}" data-font="${esc(f)}" style="font-family:'${f}'">${esc(f.replace(' Devanagari Hindi', ''))} अ</button>`).join('')}</div>`;
      tb.querySelectorAll('[data-font]').forEach((y) => y.onclick = async () => { x.font = y.dataset.font; try { await document.fonts.load(`40px "${x.font}"`); } catch {} commit(); S.dirty = true; panelText(); });
    } else if (tab === 'color') {
      const sw = (key) => `<div class="tog">${SWATCH.map((c) => `<button class="sw2${x[key] === c ? ' on' : ''}" style="background:${c}" data-c="${key}|${c}"></button>`).join('')}<input type="color" data-ci="${key}" value="${x[key]}"></div>`;
      tb.innerHTML = `<div class="note">${esc(t('color'))}</div>${sw('color')}<div class="note">${esc(t('outline'))}</div>${sw('stroke')}<div class="note">${esc(t('box'))}</div>${sw('boxColor')}`;
      tb.querySelectorAll('[data-c]').forEach((y) => y.onclick = () => { const [k, c] = y.dataset.c.split('|'); x[k] = c; if (k === 'stroke' && !x.strokeW) x.strokeW = .5; if (k === 'boxColor') x.box = true; commit(); S.dirty = true; panelText(); });
      tb.querySelectorAll('[data-ci]').forEach((y) => { y.oninput = () => { x[y.dataset.ci] = y.value; S.dirty = true; }; y.onchange = () => commit(); });
    } else {
      tb.innerHTML = `<div class="tog"><button class="chip${x.bold ? ' on' : ''}" data-tg="bold">B ${esc(t('bold'))}</button><button class="chip${x.shadow ? ' on' : ''}" data-tg="shadow">${esc(t('shadow'))}</button>
        <button class="chip${x.box ? ' on' : ''}" data-tg="box">▣ ${esc(t('box'))}</button>${['left', 'center', 'right'].map((a) => `<button class="chip${x.align === a ? ' on' : ''}" data-al="${a}">${{ left: '⇤', center: '↔', right: '⇥' }[a]}</button>`).join('')}</div>
        ${slider('size', t('size'), .02, .2, .005, x.size, (v) => Math.round(v * 1000))}${slider('sw', t('outline'), 0, 2, .05, x.strokeW, (v) => v.toFixed(2))}${slider('ba', t('box'), 0, 1, .01, x.boxAlpha, pct)}${slider('op', t('opacity'), 0, 1, .01, x.opacity, pct)}
        <div class="note">${esc(t('tipDrag'))}</div>`;
      tb.querySelectorAll('[data-tg]').forEach((y) => y.onclick = () => { x[y.dataset.tg] = !x[y.dataset.tg]; commit(); S.dirty = true; panelText(); });
      tb.querySelectorAll('[data-al]').forEach((y) => y.onclick = () => { x.align = y.dataset.al; commit(); S.dirty = true; panelText(); });
      bindSliders(tb, (k, v) => { ({ size: () => x.size = v, sw: () => x.strokeW = v, ba: () => x.boxAlpha = v, op: () => x.opacity = v })[k](); }, { size: (v) => Math.round(v * 1000), sw: (v) => v.toFixed(2), ba: pct, op: pct });
    }
  });
}
function panelFx(adding) {
  const f = adding ? null : selItem();
  openPanel(t('effects'), `<div class="chips" style="flex-wrap:wrap">${FX.map((k) => `<button class="chip${f?.type === k ? ' on' : ''}" data-fx="${k}">${FX_ICON[k]} ${esc(nm(k))}</button>`).join('')}</div>`
    + (f ? slider('a', t('intensity'), .05, 1, .01, f.amt, pct) + slider('d', t('duration'), .2, 20, .1, f.dur, (v) => v.toFixed(1) + 's') : ''), (b) => {
    b.querySelectorAll('[data-fx]').forEach((x) => x.onclick = () => {
      if (f) { f.type = x.dataset.fx; commit(); panelFx(false); }
      else { const n = newFx(x.dataset.fx, S.t); P.fx.push(n); commit(); S.sel = { kind: 'fx', id: n.id }; buildBar(); renderTL(); panelFx(false); }
      S.dirty = true;
    });
    if (f) bindSliders(b, (k, v) => { if (k === 'a') f.amt = v; else { f.dur = v; renderTL(); } }, { a: pct, d: (v) => v.toFixed(1) + 's' });
  });
}
function panelRatio() {
  const ratios = ['orig', ...Object.keys(RATIOS)];
  openPanel(t('ratio'), `<div class="chips">${ratios.map((r) => `<button class="chip${P.ratio === r ? ' on' : ''}" data-r="${r}">${r === 'orig' ? '⬚ Original' : r}</button>`).join('')}</div>
    <div class="note">${esc(t('canvas'))}</div><div class="tog"><button class="chip${P.bg === 'blur' ? ' on' : ''}" id="bgBlur">${esc(t('blurBg'))}</button>
    ${['#000000', '#ffffff', '#1a1046', '#e8be5c', '#ff2d92', '#0a84ff', '#34c759'].map((c) => `<button class="sw2${P.bg !== 'blur' && P.bgColor === c ? ' on' : ''}" style="background:${c}" data-bg="${c}"></button>`).join('')}
    <input type="color" id="bgCol" value="${P.bgColor}"></div>`, (b) => {
    b.querySelectorAll('[data-r]').forEach((x) => x.onclick = () => { setRatio(x.dataset.r); panelRatio(); });
    $('#bgBlur').onclick = () => { P.bg = 'blur'; commit(); S.dirty = true; panelRatio(); };
    b.querySelectorAll('[data-bg]').forEach((x) => x.onclick = () => { P.bg = 'color'; P.bgColor = x.dataset.bg; commit(); S.dirty = true; panelRatio(); });
    $('#bgCol').oninput = (e) => { P.bg = 'color'; P.bgColor = e.target.value; S.dirty = true; }; $('#bgCol').onchange = () => commit();
  });
}

/* ---------------- export dialog ---------------- */
let expCancel = false, lastExport = null;
function openExport() {
  if (!totalDur()) { toast(t('empty')); return; }
  pause();
  const box = $('#mBox'); const o = { long: 1920, fps: 30, quality: 'med' };
  const row = (k, opts) => `<div class="tog">${opts.map(([v, l]) => `<button class="chip${o[k] === v ? ' on' : ''}" data-o="${k}|${v}">${esc(l)}</button>`).join('')}</div>`;
  const draw = () => {
    box.innerHTML = `<h3>${esc(t('exportTitle'))}</h3><div class="note">${esc(t('resolution'))}</div>${row('long', [[1280, '720p'], [1920, '1080p'], [2560, '2K']])}
      <div class="note">${esc(t('fps'))}</div>${row('fps', [[24, '24'], [30, '30'], [60, '60']])}<div class="note">${esc(t('quality'))}</div>${row('quality', [['low', t('low')], ['med', t('med')], ['high', t('high')]])}
      <div class="note">⏱ ${fmtT(totalDur())} · ${P.ratio}</div>
      <button class="big gold" id="xGo">${esc(t('start'))}</button><button class="big ghost" id="xCancel">${esc(t('cancel'))}</button>`;
    box.querySelectorAll('[data-o]').forEach((x) => x.onclick = () => { const [k, v] = x.dataset.o.split('|'); o[k] = isNaN(+v) ? v : +v; draw(); });
    $('#xCancel').onclick = () => $('#modal').classList.add('hidden');
    $('#xGo').onclick = () => runExport(o);
  };
  draw(); $('#modal').classList.remove('hidden');
}
async function runExport(o) {
  const box = $('#mBox'); expCancel = false;
  box.innerHTML = `<h3>${esc(t('exporting'))}</h3><div class="spin"></div><div class="prog"><i id="xBar"></i></div><div class="note" id="xTxt"></div><button class="big ghost" id="xStop">${esc(t('cancel'))}</button>`;
  $('#xStop').onclick = () => { expCancel = true; };
  const t0 = performance.now();
  try {
    const res = await exportVideo(o, (p, txt) => { $('#xBar').style.width = Math.round(p * 100) + '%'; $('#xTxt').textContent = txt; }, () => expCancel);
    lastExport = res; const url = URL.createObjectURL(res.blob);
    box.innerHTML = `<h3>✅ ${esc(t('saved'))}</h3><video src="${url}" controls playsinline></video><div class="note">${res.W}×${res.H} · ${(res.blob.size / 1e6).toFixed(1)} MB · ${((performance.now() - t0) / 1000).toFixed(0)}s</div>
      <button class="big gold" id="xSave">⬇ ${esc(t('save'))}</button><button class="big ghost" id="xShare">↗ ${esc(t('share'))}</button><button class="big ghost" id="xClose">${esc(t('done'))}</button>`;
    $('#xSave').onclick = () => saveExport(res); $('#xShare').onclick = () => shareExport(res); $('#xClose').onclick = () => $('#modal').classList.add('hidden');
  } catch (e) {
    if (String(e?.message) === 'cancel') { $('#modal').classList.add('hidden'); return; }
    box.innerHTML = `<h3>⚠</h3><div class="note">${esc(e?.message || e)}</div><button class="big ghost" id="xClose">OK</button>`; $('#xClose').onclick = () => $('#modal').classList.add('hidden');
  }
}
async function blobToCacheFile(blob, name) {
  const FS = window.Capacitor.Plugins.Filesystem; const CH = 3 * 1024 * 1024;
  const b64 = (b) => new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.readAsDataURL(b); });
  await FS.writeFile({ path: name, data: await b64(blob.slice(0, CH)), directory: 'CACHE' });
  for (let i = CH; i < blob.size; i += CH) await FS.appendFile({ path: name, data: await b64(blob.slice(i, i + CH)), directory: 'CACHE' });
  return (await FS.getUri({ path: name, directory: 'CACHE' })).uri;
}
async function saveExport(res) {
  if (NATIVE) {
    try { busy(true, t('saving')); const uri = await blobToCacheFile(res.blob, res.name); await window.Capacitor.Plugins.MediaSaver.saveVideo({ path: uri, name: res.name }); toast(t('savedGallery'), 3500); }
    catch (e) { toast('✗ ' + (e?.message || e)); } finally { busy(false); }
    return;
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(res.blob); a.download = res.name; document.body.append(a); a.click(); a.remove();
}
async function shareExport(res) {
  try {
    if (NATIVE) { busy(true, t('saving')); const uri = await blobToCacheFile(res.blob, res.name); busy(false); await window.Capacitor.Plugins.Share.share({ title: res.name, files: [uri] }); return; }
    const f = new File([res.blob], res.name, { type: 'video/mp4' });
    if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f], title: res.name }); else saveExport(res);
  } catch { busy(false); }
}
$('#expBtn').onclick = openExport;

/* ---------------- sound from big videos via FFmpeg (no full read into memory) ---------------- */
window.extractAudioFF = async (file) => {
  toast(t('tooBig'), 4000);
  const { FFmpeg } = await import('./ffmpeg.js');
  const ff = new FFmpeg(); const base = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/';
  await ff.load({ coreURL: base + 'ffmpeg-core.js', wasmURL: base + 'ffmpeg-core.wasm' });
  try {
    try { await ff.createDir('/in'); } catch {}
    await ff.mount('WORKERFS', { files: [file] }, '/in');
    const code = await ff.exec(['-i', '/in/' + file.name, '-vn', '-ac', '2', '-ar', '44100', '-c:a', 'aac', '-b:a', '128k', '/a.m4a']);
    if (code !== 0) return null;
    return await ff.readFile('/a.m4a');
  } finally { try { ff.terminate(); } catch {} }
};

/* ---------------- misc wiring ---------------- */
window.onProjectChange = (fromHistory) => {
  if (S.sel && !selItem()) S.sel = null;
  renderTL(); if (fromHistory) { buildBar(); closePanel(); } S.dirty = true; restartAudio();
};
$('#undoBtn').onclick = undo; $('#redoBtn').onclick = redo;
$('#emptyAdd').onclick = () => pickFiles('#inMedia', addMedia);
$('#backBtn').onclick = () => { if (!P.clips.length || confirm(t('leave'))) location.href = './'; };
window.addEventListener('beforeunload', (e) => { if (P.clips.length) { e.preventDefault(); e.returnValue = ''; } });
document.addEventListener('keydown', (e) => {
  if (e.target.matches('textarea,input')) return;
  if (e.code === 'Space') { e.preventDefault(); S.playing ? pause() : play(); }
  else if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (e.key === 'Delete' || e.key === 'Backspace') delItem();
  else if (e.key === 's') splitAt();
});
function applyLang() {
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $('#langBtn').textContent = lang === 'hi' ? 'English' : 'हिंदी';
  buildBar(); if (S.panel) closePanel();
}
$('#langBtn').onclick = () => { lang = lang === 'hi' ? 'en' : 'hi'; try { localStorage.setItem('sp01-lang', lang); } catch {} applyLang(); renderTL(); };
// files shared/opened into the main app can be passed here via sessionStorage-less handoff: ?from=share is handled by index.html
applyLang(); commit(); fitStage(); renderTL(); requestAnimationFrame(loop);
window.__pro = { P, S, MEDIA, addMedia, addText, addOverlay, addAudio, splitAt, select, layout, totalDur, exportVideo, play, pause, get boxes() { return S.boxes; } };
