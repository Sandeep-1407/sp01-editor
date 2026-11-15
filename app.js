import { FFmpeg } from './ffmpeg.js';

/* ---------------- Language ---------------- */
const I18N = {
  en: {
    tagline: 'Video Editor · No Upload', install: 'Install',
    heroTitle: 'Edit videos,<br><span>without uploading</span>',
    heroSub: 'Your video never leaves your device. Fast, private, simple.',
    b1: '✂ Trim', b2: '🗑 Cut', b3: '🔇 Mute', b4: '📦 Compress', b5: '💬 WhatsApp', b6: '📱 Reel 9:16',
    pick: 'Choose a video', drop: 'Or drag & drop a video here (PC)',
    t1h: 'Mobile', t1: 'Gallery → open video → Share → SP01',
    t2h: 'PC', t2: 'Right-click the video → Open with → SP01 (after installing)',
    trim: 'Trim', cut: 'Cut', mute: 'Mute', compress: 'Compress', whatsapp: 'WhatsApp', reel: 'Reel 9:16',
    trimT: 'Keep this part', trimH: 'Move the gold handles. Only the gold part will be kept.',
    cutT: 'Remove this part', cutH: 'Move the handles over the part you want to delete. The rest is joined.',
    start: 'Start', end: 'End', len: 'Length', setStart: '⏮ Start = here', setEnd: 'End = here ⏭',
    exact: 'Exact cut (frame accurate)', exactS: 'Slower. Leave off for instant cut.',
    muteH: 'Removes all sound. Video quality stays the same. Instant.',
    compH: 'Make the file smaller. Takes time on phones, keep the screen on.',
    cBest: 'Best quality', cBestS: 'light compression', cBal: 'Balanced (recommended)', cBalS: 'good size + quality',
    cSmall: 'Smallest file', cSmallS: 'maximum compression',
    waH: 'Makes the video light (480p) so it sends fast and keeps good quality on WhatsApp.',
    reelH: 'Converts to vertical 9:16 for Reels, Shorts and Status.',
    rFit: 'Fit (full video, bars on sides)', rFitS: 'Nothing is cut', rFill: 'Fill (zoom to full screen)', rFillS: 'Edges get cropped',
    go: 'Apply', newVideo: '🎬 Other video', done: '✅ Done!', save: '⬇ Save', share: '📤 Share',
    more: '✏️ Edit this more', back: '↩ Back to original', foot: 'Your videos stay on your device',
    keepOn: 'Keep this screen open until it finishes.', cancel: 'Cancel',
    loadingEngine: 'Loading editor engine… (first time only, ~31 MB)', working: 'Working on your video…',
    readingFile: 'Reading video…', saved: 'Saved to Downloads', cancelled: 'Cancelled',
    errGeneric: 'Something went wrong. Try “Exact cut” or another tool.', errEngine: 'Editor engine could not load. Check internet once and try again.',
    errRange: 'End must be after start.', errWhole: 'You selected the whole video. Nothing to remove.',
    shareNA: 'Sharing is not supported here. Use Save.', bigFile: 'Large file. On phones this may fail or be slow.',
    noPreview: 'Preview not supported for this format, but editing works.', duration: 'Duration', res: 'Size', file: 'File',
    b7: '🔗 Merge', mergeBtn: 'Join videos', addJoin: '🔗 Join more', mergeT: 'Join videos',
    mergeH: 'Videos will be joined in this order. Use ⬆ ⬇ to change order.', mAdd: '➕ Add more videos', mGo: 'Join now',
    home: '🏠 Home', videos: 'videos', mNeed2: 'Add at least 2 videos.', joining: 'Joining videos…', checking: 'Checking videos…',
    mFast: 'Same type videos: joined instantly, no quality loss.', mSlow: 'Different sizes: converting to one size (slower).',
  },
  hi: {
    tagline: 'वीडियो एडिटर · बिना अपलोड', install: 'इंस्टॉल',
    heroTitle: 'वीडियो एडिट करें,<br><span>बिना अपलोड किए</span>',
    heroSub: 'आपकी वीडियो आपके फ़ोन/PC से बाहर नहीं जाती। तेज़, सुरक्षित, आसान।',
    b1: '✂ ट्रिम', b2: '🗑 कट', b3: '🔇 म्यूट', b4: '📦 छोटा करें', b5: '💬 WhatsApp', b6: '📱 Reel 9:16',
    pick: 'वीडियो चुनें', drop: 'या वीडियो यहाँ खींचकर छोड़ें (PC)',
    t1h: 'मोबाइल', t1: 'गैलरी → वीडियो खोलें → Share → SP01',
    t2h: 'PC', t2: 'वीडियो पर राइट-क्लिक → Open with → SP01 (इंस्टॉल के बाद)',
    trim: 'ट्रिम', cut: 'कट', mute: 'म्यूट', compress: 'छोटा करें', whatsapp: 'WhatsApp', reel: 'Reel 9:16',
    trimT: 'यह हिस्सा रखें', trimH: 'गोल्ड हैंडल खिसकाएँ। सिर्फ़ गोल्ड वाला हिस्सा बचेगा।',
    cutT: 'यह हिस्सा हटाएँ', cutH: 'जो हिस्सा हटाना है उस पर हैंडल रखें। बाकी जुड़ जाएगा।',
    start: 'शुरू', end: 'अंत', len: 'लंबाई', setStart: '⏮ यहाँ से शुरू', setEnd: 'यहाँ तक ⏭',
    exact: 'एकदम सटीक कट', exactS: 'थोड़ा धीमा। बंद रखें तो तुरंत कटेगा।',
    muteH: 'सारी आवाज़ हट जाएगी। क्वालिटी वही रहेगी। तुरंत।',
    compH: 'फ़ाइल छोटी करें। फ़ोन पर थोड़ा समय लगेगा, स्क्रीन ऑन रखें।',
    cBest: 'बेस्ट क्वालिटी', cBestS: 'थोड़ा छोटा', cBal: 'संतुलित (सुझाया गया)', cBalS: 'अच्छा साइज़ + क्वालिटी',
    cSmall: 'सबसे छोटी फ़ाइल', cSmallS: 'ज़्यादा से ज़्यादा छोटा',
    waH: 'वीडियो हल्की (480p) बनेगी ताकि WhatsApp पर जल्दी जाए और अच्छी दिखे।',
    reelH: 'Reels, Shorts और Status के लिए खड़ी 9:16 वीडियो बनाएँ।',
    rFit: 'फ़िट (पूरी वीडियो, साइड में पट्टी)', rFitS: 'कुछ नहीं कटेगा', rFill: 'फ़िल (पूरी स्क्रीन)', rFillS: 'किनारे कटेंगे',
    go: 'लागू करें', newVideo: '🎬 दूसरी वीडियो', done: '✅ हो गया!', save: '⬇ सेव', share: '📤 शेयर',
    more: '✏️ इसे और एडिट करें', back: '↩ ओरिजिनल पर वापस', foot: 'आपकी वीडियो आपके डिवाइस में ही रहती है',
    keepOn: 'काम पूरा होने तक यह स्क्रीन खुली रखें।', cancel: 'रद्द करें',
    loadingEngine: 'एडिटर इंजन लोड हो रहा है… (सिर्फ़ पहली बार, ~31 MB)', working: 'आपकी वीडियो पर काम चल रहा है…',
    readingFile: 'वीडियो पढ़ी जा रही है…', saved: 'Downloads में सेव हो गई', cancelled: 'रद्द किया गया',
    errGeneric: 'कुछ गड़बड़ हुई। “एकदम सटीक कट” या दूसरा टूल आज़माएँ।', errEngine: 'एडिटर इंजन लोड नहीं हुआ। एक बार इंटरनेट चेक करके दोबारा करें।',
    errRange: 'अंत, शुरू के बाद होना चाहिए।', errWhole: 'पूरी वीडियो चुनी है। हटाने को कुछ नहीं।',
    shareNA: 'यहाँ शेयर नहीं होता। सेव इस्तेमाल करें।', bigFile: 'बड़ी फ़ाइल है। फ़ोन पर धीमी या फ़ेल हो सकती है।',
    noPreview: 'इस फ़ॉर्मेट का प्रीव्यू नहीं दिखेगा, पर एडिट होगा।', duration: 'समय', res: 'साइज़', file: 'फ़ाइल',
    b7: '🔗 जोड़ें', mergeBtn: 'वीडियो जोड़ें (Merge)', addJoin: '🔗 और वीडियो जोड़ें', mergeT: 'वीडियो जोड़ें',
    mergeH: 'वीडियो इसी क्रम में जुड़ेंगी। क्रम बदलने के लिए ⬆ ⬇ दबाएँ।', mAdd: '➕ और वीडियो डालें', mGo: 'अभी जोड़ें',
    home: '🏠 होम', videos: 'वीडियो', mNeed2: 'कम से कम 2 वीडियो डालें।', joining: 'वीडियो जुड़ रही हैं…', checking: 'वीडियो जाँची जा रही हैं…',
    mFast: 'एक जैसी वीडियो: तुरंत जुड़ेंगी, क्वालिटी वही रहेगी।', mSlow: 'अलग-अलग साइज़: एक साइज़ में बदलकर जुड़ेंगी (धीमा)।',
  },
};
let lang = (() => { try { return localStorage.getItem('sp01-lang'); } catch { return null; } })()
  || 'hi';
const t = (k) => I18N[lang][k] ?? I18N.en[k] ?? k;
const $ = (s) => document.querySelector(s);

function applyI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  $('#langBtn').textContent = lang === 'en' ? 'हिंदी' : 'English';
  updateRangeLabels();
  if (current) renderMeta();
  if (mItems.length) renderMerge();
}
$('#langBtn').onclick = () => {
  lang = lang === 'en' ? 'hi' : 'en';
  try { localStorage.setItem('sp01-lang', lang); } catch {}
  applyI18n();
};

/* ---------------- Helpers ---------------- */
function toast(msg, ms = 2600) {
  const el = $('#toast'); el.textContent = msg; el.classList.remove('hidden');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.add('hidden'), ms);
}
const fmtTime = (s) => {
  if (!isFinite(s)) return '–';
  const m = Math.floor(s / 60), r = s - m * 60;
  return `${m}:${r < 10 ? '0' : ''}${r.toFixed(1)}`;
};
const fmtSize = (b) => b >= 1e9 ? (b / 1e9).toFixed(2) + ' GB' : b >= 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB';
const extOf = (name) => { const m = /\.([a-z0-9]{2,5})$/i.exec(name || ''); return m ? m[1].toLowerCase() : 'mp4'; };
const baseOf = (name) => (name || 'video').replace(/\.[^.]+$/, '').replace(/[^\wऀ-ॿ\- ]+/g, '').trim() || 'video';
const MIME = { mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', mkv: 'video/x-matroska', webm: 'video/webm', '3gp': 'video/3gpp', avi: 'video/x-msvideo' };
const even = (n) => Math.max(2, Math.round(n / 2) * 2);
const show = (id) => ['home', 'editor', 'merge', 'result'].forEach((s) => $('#' + s).classList.toggle('hidden', s !== id));

/* ---------------- State ---------------- */
let original = null;     // first file the user opened
let current = null;      // file being edited now (may be a previous result)
let info = { duration: NaN, width: 0, height: 0 };
let tool = 'trim';
let srcURL = null, outURL = null, outBlob = null, outName = '';

/* ---------------- Engine (FFmpeg.wasm) ---------------- */
// Engine core (31 MB) comes from the jsDelivr CDN; the service worker keeps it for offline use
const CORE_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/';
let ff = null, ffReady = null, logs = [], expectedDur = 0;
function ensureEngine() {
  if (!ffReady) {
    ff = new FFmpeg();
    ff.on('log', ({ message }) => {
      logs.push(message); if (logs.length > 300) logs.shift();
      const m = /time=\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(message);
      if (m && expectedDur > 0) setProgress(((+m[1]) * 3600 + (+m[2]) * 60 + (+m[3])) / expectedDur);
    });
    ffReady = ff.load({
      coreURL: CORE_BASE + 'ffmpeg-core.js',
      wasmURL: CORE_BASE + 'ffmpeg-core.wasm',
    }).catch((e) => { ffReady = null; ff = null; throw e; });
  }
  return ffReady;
}
function killEngine() { try { ff && ff.terminate(); } catch {} ff = null; ffReady = null; }

/* ---------------- Open a video ---------------- */
async function openFile(file, keepOriginal = false) {
  if (!file) return;
  if (!keepOriginal) original = file;
  current = file;
  info = { duration: NaN, width: 0, height: 0 };
  if (srcURL) URL.revokeObjectURL(srcURL);
  srcURL = URL.createObjectURL(file);
  const v = $('#player');
  v.src = srcURL;
  $('#fname').textContent = file.name;
  renderMeta();
  show('editor');
  if (file.size > 1.5e9) toast(t('bigFile'), 4000);
  ensureEngine().catch(() => {});           // start downloading the engine in the background

  v.onloadedmetadata = () => {
    info.duration = v.duration; info.width = v.videoWidth; info.height = v.videoHeight;
    resetRange(); renderMeta();
  };
  v.onerror = async () => {                // e.g. AVI/MKV the browser cannot preview
    toast(t('noPreview'), 3500);
    try { await probeWithEngine(); resetRange(); renderMeta(); } catch {}
  };
}
function renderMeta() {
  const parts = [`${t('file')}: <b>${fmtSize(current.size)}</b>`];
  if (isFinite(info.duration)) parts.push(`${t('duration')}: <b>${fmtTime(info.duration)}</b>`);
  if (info.width) parts.push(`${t('res')}: <b>${info.width}×${info.height}</b>`);
  $('#meta').innerHTML = parts.map((p) => `<span>${p}</span>`).join('');
}
async function probeWithEngine() {
  await ensureEngine();
  const input = await mountInput();
  logs = [];
  await ff.exec(['-hide_banner', '-i', input]);  // returns error code (no output) but prints info
  await unmountInput();
  const all = logs.join('\n');
  const d = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(all);
  if (d) info.duration = (+d[1]) * 3600 + (+d[2]) * 60 + (+d[3]);
  const r = /Video:.*?(\d{2,5})x(\d{2,5})/.exec(all);
  if (r) { info.width = +r[1]; info.height = +r[2]; }
}

$('#pickBtn').onclick = () => $('#fileInput').click();
$('#fileInput').onchange = (e) => { openFile(e.target.files[0]); e.target.value = ''; };
const drop = $('#drop');
['dragenter', 'dragover'].forEach((ev) => document.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => document.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
document.addEventListener('drop', (e) => { const fs = [...(e.dataTransfer?.files || [])].filter((f) => /^video\//.test(f.type || 'video/')); openMany(fs); });

// PC: "Open with → SP01"
if ('launchQueue' in window) {
  window.launchQueue.setConsumer(async (p) => { if (p.files && p.files.length) openMany(await Promise.all(p.files.map((h) => h.getFile()))); });
}
// Android: "Share → SP01"
(async () => {
  if (!new URLSearchParams(location.search).has('shared')) return;
  history.replaceState(null, '', location.pathname);
  try {
    const c = await caches.open('quickcut-share');
    const cntKey = new URL('shared-count', location.href).href;
    const cr = await c.match(cntKey);
    const n = cr ? parseInt(await cr.text(), 10) || 0 : 0;
    const files = [];
    for (let i = 0; i < n; i++) {
      const key = new URL('shared-file-' + i, location.href).href;
      const res = await c.match(key);
      if (!res) continue;
      const name = decodeURIComponent(res.headers.get('X-File-Name') || `video${i + 1}.mp4`);
      const blob = await res.blob();
      files.push(new File([blob], name, { type: blob.type || 'video/mp4' }));
      await c.delete(key);
    }
    await c.delete(cntKey);
    openMany(files);
  } catch {}
})();

/* ---------------- Tools UI ---------------- */
document.querySelectorAll('.tool').forEach((el) => el.onclick = () => {
  document.querySelectorAll('.tool').forEach((x) => x.classList.toggle('active', x === el));
  tool = el.dataset.tool;
  $('#pRange').classList.toggle('hidden', !(tool === 'trim' || tool === 'cut'));
  $('#exactWrap').classList.toggle('hidden', tool !== 'trim');
  $('#pMute').classList.toggle('hidden', tool !== 'mute');
  $('#pCompress').classList.toggle('hidden', tool !== 'compress');
  $('#pWhatsapp').classList.toggle('hidden', tool !== 'whatsapp');
  $('#pReel').classList.toggle('hidden', tool !== 'reel');
  updateRangeLabels();
});

const rS = $('#rStart'), rE = $('#rEnd');
function resetRange() {
  const d = isFinite(info.duration) ? info.duration : 0;
  [rS, rE].forEach((r) => { r.max = d.toFixed(1); });
  rS.value = 0; rE.value = d.toFixed(1);
  updateRangeLabels();
}
function updateRangeLabels() {
  if (!rS) return;
  const d = +rE.max || 0, s = +rS.value, e = +rE.value;
  $('#tStart').textContent = fmtTime(s); $('#tEnd').textContent = fmtTime(e); $('#tLen').textContent = fmtTime(Math.max(0, e - s));
  const sel = $('#rangeSel');
  sel.style.left = d ? (s / d * 100) + '%' : '0'; sel.style.width = d ? ((e - s) / d * 100) + '%' : '0';
  sel.classList.toggle('remove', tool === 'cut');
  $('#rangeTitle').textContent = t(tool === 'cut' ? 'cutT' : 'trimT');
  $('#rangeHint').textContent = t(tool === 'cut' ? 'cutH' : 'trimH');
}
rS.oninput = () => { if (+rS.value > +rE.value - 0.1) rS.value = Math.max(0, +rE.value - 0.1); seek(+rS.value); updateRangeLabels(); };
rE.oninput = () => { if (+rE.value < +rS.value + 0.1) rE.value = Math.min(+rE.max, +rS.value + 0.1); seek(+rE.value); updateRangeLabels(); };
function seek(s) { const v = $('#player'); if (isFinite(v.duration)) { v.pause(); v.currentTime = s; } }
$('#setStart').onclick = () => { const c = $('#player').currentTime || 0; rS.value = Math.min(c, +rE.value - 0.1); updateRangeLabels(); };
$('#setEnd').onclick = () => { const c = $('#player').currentTime || 0; rE.value = Math.max(c, +rS.value + 0.1); updateRangeLabels(); };

/* ---------------- Progress overlay ---------------- */
let wakeLock = null;
function setProgress(p) {
  const ring = $('#ring');
  if (p == null) { ring.classList.add('spin'); $('#pct').textContent = '…'; return; }
  p = Math.max(0, Math.min(0.99, p));
  ring.classList.remove('spin'); ring.style.setProperty('--p', Math.round(p * 100)); $('#pct').textContent = Math.round(p * 100) + '%';
}
async function overlay(on, title) {
  $('#overlay').classList.toggle('hidden', !on);
  if (title) $('#ovTitle').textContent = title;
  if (on) { setProgress(null); try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {} }
  else { try { await wakeLock?.release(); } catch {} wakeLock = null; }
}
let cancelled = false;
$('#cancelBtn').onclick = () => { cancelled = true; killEngine(); overlay(false); toast(t('cancelled')); };

/* ---------------- FFmpeg file plumbing ---------------- */
let mounted = false;
async function mountInput() {
  const ext = extOf(current.name);
  try {
    try { await ff.createDir('/in'); } catch {}
    await ff.mount('WORKERFS', { files: [current] }, '/in');  // no copy into memory
    mounted = true;
    return '/in/' + current.name;
  } catch {
    mounted = false;
    $('#ovTitle').textContent = t('readingFile');
    await ff.writeFile('/input.' + ext, new Uint8Array(await current.arrayBuffer()));
    return '/input.' + ext;
  }
}
async function unmountInput() {
  if (!ff) return;
  if (mounted) { try { await ff.unmount('/in'); } catch {} mounted = false; }
  else { try { await ff.deleteFile('/input.' + extOf(current.name)); } catch {} }
}
async function run(args) {
  const code = await ff.exec(args);
  if (cancelled) throw new Error('cancelled');
  if (code !== 0) throw new Error(logs.slice(-15).join('\n'));
}

/* ---------------- Build the job for each tool ---------------- */
function scaleFor(maxShort) {
  let w = info.width, h = info.height;
  if (!w || !h) return null;
  const short = Math.min(w, h);
  if (short > maxShort) { const k = maxShort / short; w *= k; h *= k; }
  return `scale=${even(w)}:${even(h)}`;
}
const ENC = (crf) => ['-c:v', 'libx264', '-preset', 'superfast', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart'];

async function buildAndRun(input) {
  const ext = extOf(current.name), base = baseOf(current.name);
  const D = info.duration;
  const s = +rS.value, e = +rE.value;

  if (tool === 'trim') {
    if (!(e > s + 0.05)) throw new Error(t('errRange'));
    expectedDur = e - s;
    if ($('#exact').checked) {
      await run(['-ss', s.toFixed(2), '-to', e.toFixed(2), '-i', input, ...ENC(20), '-c:a', 'aac', '-b:a', '128k', '/out.mp4']);
      return { path: '/out.mp4', name: `${base}_trim.mp4`, ext: 'mp4' };
    }
    await run(['-ss', s.toFixed(2), '-to', e.toFixed(2), '-i', input, '-c', 'copy', '-avoid_negative_ts', 'make_zero', `/out.${ext}`]);
    return { path: `/out.${ext}`, name: `${base}_trim.${ext}`, ext };
  }

  if (tool === 'cut') {
    if (!(e > s + 0.05)) throw new Error(t('errRange'));
    const hasA = s > 0.15, hasB = isFinite(D) ? e < D - 0.15 : true;
    if (!hasA && !hasB) throw new Error(t('errWhole'));
    expectedDur = 0;
    const parts = [];
    if (hasA) { await run(['-i', input, '-to', s.toFixed(2), '-c', 'copy', '-avoid_negative_ts', 'make_zero', `/p1.${ext}`]); parts.push(`/p1.${ext}`); }
    if (hasB) { await run(['-ss', e.toFixed(2), '-i', input, '-c', 'copy', '-avoid_negative_ts', 'make_zero', `/p2.${ext}`]); parts.push(`/p2.${ext}`); }
    if (parts.length === 1) { await ff.rename(parts[0], `/out.${ext}`); }
    else {
      await ff.writeFile('/list.txt', parts.map((p) => `file '${p}'`).join('\n'));
      await run(['-f', 'concat', '-safe', '0', '-i', '/list.txt', '-c', 'copy', `/out.${ext}`]);
      for (const p of [...parts, '/list.txt']) { try { await ff.deleteFile(p); } catch {} }
    }
    return { path: `/out.${ext}`, name: `${base}_cut.${ext}`, ext };
  }

  if (tool === 'mute') {
    expectedDur = 0;
    await run(['-i', input, '-map', '0:v', '-c', 'copy', '-an', `/out.${ext}`]);
    return { path: `/out.${ext}`, name: `${base}_mute.${ext}`, ext };
  }

  expectedDur = isFinite(D) ? D : 0;
  if (tool === 'compress') {
    const lvl = document.querySelector('input[name=clevel]:checked').value;
    const cfg = { best: [720, 24, '128k'], bal: [720, 28, '96k'], small: [480, 31, '64k'] }[lvl];
    const sc = scaleFor(cfg[0]);
    await run(['-i', input, ...(sc ? ['-vf', sc] : []), ...ENC(cfg[1]), '-c:a', 'aac', '-b:a', cfg[2], '/out.mp4']);
    return { path: '/out.mp4', name: `${base}_small.mp4`, ext: 'mp4' };
  }
  if (tool === 'whatsapp') {
    const sc = scaleFor(480);
    await run(['-i', input, ...(sc ? ['-vf', sc] : []), ...ENC(29), '-r', '30', '-c:a', 'aac', '-b:a', '64k', '/out.mp4']);
    return { path: '/out.mp4', name: `${base}_whatsapp.mp4`, ext: 'mp4' };
  }
  if (tool === 'reel') {
    const mode = document.querySelector('input[name=rmode]:checked').value;
    const vf = mode === 'fill'
      ? 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1'
      : 'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1';
    await run(['-i', input, '-vf', vf, ...ENC(26), '-c:a', 'aac', '-b:a', '128k', '/out.mp4']);
    return { path: '/out.mp4', name: `${base}_reel.mp4`, ext: 'mp4' };
  }
  throw new Error('unknown tool');
}

/* ---------------- Apply ---------------- */
$('#goBtn').onclick = async () => {
  if (!current) return;
  cancelled = false; logs = [];
  await overlay(true, t('loadingEngine'));
  try {
    try { await ensureEngine(); } catch { throw new Error(t('errEngine')); }
    if (cancelled) return;
    $('#ovTitle').textContent = t('working');
    const input = await mountInput();
    let out;
    try { out = await buildAndRun(input); }
    finally { await unmountInput(); }
    const data = await ff.readFile(out.path);
    try { await ff.deleteFile(out.path); } catch {}
    outBlob = new Blob([data.buffer], { type: MIME[out.ext] || 'video/mp4' });
    outName = out.name;
    fromMerge = false;
    showResult();
  } catch (err) {
    if (cancelled) return;
    console.error(err);
    const msg = String(err && err.message || err);
    toast(msg.length < 120 ? msg : t('errGeneric'), 5000);
    if (/abort|memory|OOM/i.test(msg)) killEngine();
  } finally {
    if (!cancelled) overlay(false);
  }
};

/* ---------------- Result ---------------- */
let fromMerge = false;
function showResult(oldSize = current.size) {
  if (outURL) URL.revokeObjectURL(outURL);
  outURL = URL.createObjectURL(outBlob);
  $('#outPlayer').src = outURL;
  $('#sizeOld').textContent = fmtSize(oldSize);
  $('#sizeNew').textContent = fmtSize(outBlob.size);
  $('#shareBtn').classList.toggle('hidden', !navigator.canShare);
  show('result');
}
$('#saveBtn').onclick = () => {
  const a = document.createElement('a'); a.href = outURL; a.download = outName;
  document.body.appendChild(a); a.click(); a.remove(); toast(t('saved'));
};
$('#shareBtn').onclick = async () => {
  const f = new File([outBlob], outName, { type: outBlob.type });
  if (navigator.canShare && navigator.canShare({ files: [f] })) {
    try { await navigator.share({ files: [f], title: outName }); } catch {}
  } else toast(t('shareNA'));
};
$('#moreBtn').onclick = () => openFile(new File([outBlob], outName, { type: outBlob.type }), !fromMerge);
$('#backBtn').onclick = () => { if (fromMerge) show('merge'); else openFile(original, true); };
$('#newBtn').onclick = () => { $('#player').pause(); show('home'); };

/* ---------------- Merge ---------------- */
let mItems = [];   // { id, file, dur, w, h, thumb }
let mSeq = 0;
const esc = (x) => String(x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function openMany(files) {
  files = (files || []).filter(Boolean);
  if (files.length === 1) openFile(files[0]);
  else if (files.length > 1) { mItems = []; addToMerge(files); }
}
function readMeta(file) {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.muted = true; v.preload = 'metadata'; v.playsInline = true;
    const url = URL.createObjectURL(file);
    let done = false;
    const fin = (o) => { if (done) return; done = true; URL.revokeObjectURL(url); v.removeAttribute('src'); v.load(); resolve(o); };
    v.onloadedmetadata = () => {
      const o = { dur: v.duration, w: v.videoWidth, h: v.videoHeight, thumb: '' };
      v.onseeked = () => {
        try {
          const c = document.createElement('canvas'); c.width = 144; c.height = Math.round(144 * (o.h || 9) / (o.w || 16)) || 81;
          c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); o.thumb = c.toDataURL('image/jpeg', 0.6);
        } catch {}
        fin(o);
      };
      v.currentTime = Math.min(1, (v.duration || 0) / 2);
      setTimeout(() => fin(o), 4000);
    };
    v.onerror = () => fin({ dur: NaN, w: 0, h: 0, thumb: '' });
    setTimeout(() => fin({ dur: NaN, w: 0, h: 0, thumb: '' }), 15000);
    v.src = url;
  });
}
function addToMerge(files) {
  const added = files.map((file) => ({ id: ++mSeq, file, dur: NaN, w: 0, h: 0, thumb: '' }));
  mItems.push(...added);
  renderMerge(); show('merge');
  ensureEngine().catch(() => {});
  (async () => { for (const it of added) { Object.assign(it, await readMeta(it.file)); renderMerge(); } })();
}
function renderMerge() {
  const n = mItems.length;
  $('#mlist').innerHTML = mItems.map((it, i) => `
    <div class="mitem">
      <span class="num">${i + 1}</span>
      <div class="th" style="${it.thumb ? `background-image:url(${it.thumb})` : ''}">${it.thumb ? '' : '🎬'}</div>
      <div class="mi"><b>${esc(it.file.name)}</b>${fmtTime(it.dur)} · ${fmtSize(it.file.size)}${it.w ? ` · ${it.w}×${it.h}` : ''}</div>
      <div class="act">
        <button data-act="up" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="up">⬆</button>
        <button data-act="down" data-i="${i}" ${i === n - 1 ? 'disabled' : ''} aria-label="down">⬇</button>
        <button data-act="del" data-i="${i}" aria-label="remove">✕</button>
      </div>
    </div>`).join('');
  const totalDur = mItems.reduce((a, it) => a + (isFinite(it.dur) ? it.dur : 0), 0);
  const totalSize = mItems.reduce((a, it) => a + it.file.size, 0);
  $('#mtotal').innerHTML = n ? `<b>${n}</b> ${t('videos')} · <b>${fmtTime(totalDur)}</b> · <b>${fmtSize(totalSize)}</b>` : '';
  $('#mGo').disabled = n < 2;
}
$('#mlist').onclick = (e) => {
  const b = e.target.closest('button[data-act]'); if (!b) return;
  const i = +b.dataset.i, a = b.dataset.act;
  if (a === 'up' && i > 0) [mItems[i - 1], mItems[i]] = [mItems[i], mItems[i - 1]];
  if (a === 'down' && i < mItems.length - 1) [mItems[i + 1], mItems[i]] = [mItems[i], mItems[i + 1]];
  if (a === 'del') mItems.splice(i, 1);
  renderMerge();
};
$('#mergePick').onclick = () => { mItems = []; $('#mergeInput').click(); };
$('#mAdd').onclick = () => $('#mergeInput').click();
$('#mergeInput').onchange = (e) => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) addToMerge(fs); };
$('#addJoinBtn').onclick = () => { $('#player').pause(); mItems = []; addToMerge([current]); $('#mergeInput').click(); };
$('#mHome').onclick = () => show('home');

function parseProbe(text) {
  const o = { dur: NaN, vc: '', w: 0, h: 0, fps: 0, rot: 0, ac: '', rate: 0, ch: '' };
  const d = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(text); if (d) o.dur = (+d[1]) * 3600 + (+d[2]) * 60 + (+d[3]);
  const v = /Video:\s*(\w+)[^\n]*?\b(\d{2,5})x(\d{2,5})\b/.exec(text); if (v) { o.vc = v[1]; o.w = +v[2]; o.h = +v[3]; }
  const f = /Video:[^\n]*?(\d+(?:\.\d+)?)\s*fps/.exec(text); if (f) o.fps = Math.round(+f[1]);
  const r = /rotation of\s*(-?\d+(?:\.\d+)?)|rotate\s*:\s*(-?\d+)/.exec(text); if (r) o.rot = ((Math.round(+(r[1] ?? r[2])) % 360) + 360) % 360;
  const a = /Audio:\s*(\w+)[^\n]*?(\d+)\s*Hz,\s*([^,\n]+)/.exec(text); if (a) { o.ac = a[1]; o.rate = +a[2]; o.ch = a[3].trim(); }
  return o;
}

$('#mGo').onclick = async () => {
  if (mItems.length < 2) { toast(t('mNeed2')); return; }
  cancelled = false; logs = [];
  await overlay(true, t('loadingEngine'));
  let mountedM = false, written = [];
  try {
    try { await ensureEngine(); } catch { throw new Error(t('errEngine')); }
    if (cancelled) return;
    $('#ovTitle').textContent = t('checking');
    // unique names so two files called "video.mp4" don't clash
    const files = mItems.map((it, i) => new File([it.file], `v${i}.${extOf(it.file.name)}`, { type: it.file.type }));
    let paths;
    try {
      try { await ff.createDir('/m'); } catch {}
      await ff.mount('WORKERFS', { files }, '/m'); mountedM = true;
      paths = files.map((f) => '/m/' + f.name);
    } catch {
      paths = [];
      for (const f of files) { const pth = '/' + f.name; await ff.writeFile(pth, new Uint8Array(await f.arrayBuffer())); written.push(pth); paths.push(pth); }
    }
    const probes = [];
    for (const pth of paths) { logs = []; await ff.exec(['-hide_banner', '-i', pth]); probes.push(parseProbe(logs.join('\n'))); }
    if (cancelled) return;

    const ext0 = extOf(files[0].name);
    const sig = (p, f) => [extOf(f.name), p.vc, p.w, p.h, p.fps, p.rot, p.ac || 'none', p.rate, p.ch].join('|');
    const same = probes.every((p, i) => p.vc && sig(p, files[i]) === sig(probes[0], files[0]));
    const totalDur = probes.reduce((a, p) => a + (isFinite(p.dur) ? p.dur : 0), 0);
    const n = files.length;
    let outPath, ext;

    if (same) {
      toast(t('mFast'));
      $('#ovTitle').textContent = t('joining');
      expectedDur = 0; ext = ext0; outPath = `/out.${ext}`;
      await ff.writeFile('/mlist.txt', paths.map((pth) => `file '${pth}'`).join('\n'));
      const mov = ['mp4', 'm4v', 'mov', '3gp'].includes(ext) ? ['-movflags', '+faststart'] : [];
      await run(['-f', 'concat', '-safe', '0', '-i', '/mlist.txt', '-map', '0:v', '-map', '0:a?', '-c', 'copy', ...mov, outPath]);
      try { await ff.deleteFile('/mlist.txt'); } catch {}
    } else {
      toast(t('mSlow'), 3500);
      $('#ovTitle').textContent = t('joining');
      // final size from the FIRST video (as shown on screen), short side max 720
      let W = mItems[0].w, H = mItems[0].h;
      if (!W || !H) { W = probes[0].w || 1280; H = probes[0].h || 720; if (probes[0].rot === 90 || probes[0].rot === 270) [W, H] = [H, W]; }
      const short = Math.min(W, H); if (short > 720) { const k = 720 / short; W *= k; H *= k; }
      W = even(W); H = even(H);
      const fc = [];
      probes.forEach((p, i) => {
        fc.push(`[${i}:v:0]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=30,format=yuv420p[v${i}]`);
        fc.push(p.ac
          ? `[${i}:a:0]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`
          : `anullsrc=r=44100:cl=stereo,atrim=duration=${(isFinite(p.dur) ? p.dur : 1).toFixed(3)},aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`);
      });
      fc.push(probes.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${n}:v=1:a=1[v][a]`);
      expectedDur = totalDur; ext = 'mp4'; outPath = '/out.mp4';
      await run([...paths.flatMap((pth) => ['-i', pth]), '-filter_complex', fc.join(';'), '-map', '[v]', '-map', '[a]', ...ENC(26), '-c:a', 'aac', '-b:a', '128k', outPath]);
    }
    const data = await ff.readFile(outPath);
    try { await ff.deleteFile(outPath); } catch {}
    outBlob = new Blob([data.buffer], { type: MIME[ext] || 'video/mp4' });
    outName = `merged_${n}_videos.${ext}`;
    fromMerge = true;
    showResult(mItems.reduce((a, it) => a + it.file.size, 0));
  } catch (err) {
    if (cancelled) return;
    console.error(err);
    const msg = String(err && err.message || err);
    toast(msg.length < 120 ? msg : t('errGeneric'), 5000);
    if (/abort|memory|OOM/i.test(msg)) killEngine();
  } finally {
    if (ff && mountedM) { try { await ff.unmount('/m'); } catch {} }
    if (ff) for (const pth of written) { try { await ff.deleteFile(pth); } catch {} }
    if (!cancelled) overlay(false);
  }
};

/* ---------------- Install + offline ---------------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; $('#installBtn').classList.remove('hidden'); });
$('#installBtn').onclick = async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $('#installBtn').classList.add('hidden'); };
window.addEventListener('appinstalled', () => $('#installBtn').classList.add('hidden'));
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});

applyI18n();
