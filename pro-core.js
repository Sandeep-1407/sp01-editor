/* SP01 Pro – project model, media import, audio, timeline math, undo, i18n */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, p) => a + (b - a) * p;
const fmtT = (s) => { s = Math.max(0, s || 0); const m = Math.floor(s / 60); return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}.${Math.floor((s % 1) * 10)}`; };
const NATIVE = !!window.Capacitor?.isNativePlatform?.();
let lang = (() => { try { return localStorage.getItem('sp01-lang') || 'hi'; } catch { return 'hi'; } })();

const I18N = {
  en: {
    title: 'SP01 Pro Editor', back: 'Back', export: 'Export', addVideo: 'Video', addPhoto: 'Photo', text: 'Text', audio: 'Audio', overlay: 'Overlay',
    filters: 'Filters', adjust: 'Adjust', effects: 'Effects', ratio: 'Ratio', canvas: 'Background', split: 'Split', del: 'Delete', speed: 'Speed',
    volume: 'Volume', anim: 'Animation', trans: 'Transition', chroma: 'Chroma key', reverse: 'Reverse', freeze: 'Freeze', dup: 'Duplicate',
    edit: 'Edit', font: 'Font', style: 'Style', fade: 'Fade', record: 'Voice', beats: 'Beats', undo: 'Undo', redo: 'Redo', done: 'Done',
    none: 'None', amount: 'Strength', reset: 'Reset', apply_all: 'Apply to all clips', in: 'In', out: 'Out', duration: 'Duration',
    empty: 'Tap “+ Video” to start. Add videos and photos from your phone – nothing is uploaded.', addFirst: '+ Add video / photo',
    brightness: 'Brightness', contrast: 'Contrast', saturation: 'Saturation', exposure: 'Exposure', temperature: 'Temperature', tint: 'Tint',
    highlights: 'Highlights', shadows: 'Shadows', vignette: 'Vignette', sharpen: 'Sharpen', fadeA: 'Fade', grain: 'Grain', hue: 'Hue',
    color: 'Color', outline: 'Outline', shadow: 'Shadow', box: 'Box', size: 'Size', bold: 'Bold', align: 'Align', opacity: 'Opacity',
    similarity: 'Similarity', smooth: 'Smoothness', spill: 'Spill', pick: 'Pick color', green: 'Green', blue: 'Blue', keyOn: 'Remove color',
    origVol: 'Clip sound', mute: 'Mute', fadeIn: 'Fade in', fadeOut: 'Fade out', intensity: 'Intensity',
    exportTitle: 'Export video', resolution: 'Resolution', fps: 'Frame rate', quality: 'Quality', start: 'Start export', exporting: 'Exporting…',
    saved: 'Video ready', save: 'Save', share: 'Share', cancel: 'Cancel', preparingAudio: 'Reading sound…', decoding: 'Preparing…',
    noCodecs: 'This browser cannot export. Please update Chrome (version 100+) or use the Android app.', recStart: 'Recording… tap again to stop',
    micDenied: 'Microphone permission denied', typeHere: 'Type your text', beatsFound: 'beats marked', noBeats: 'Select an audio first',
    blurBg: 'Blur', fit: 'Fit', fill: 'Fill', leave: 'Leave editor? Unsaved work will be lost.', tooBig: 'Large file: sound is read with the engine, please wait…',
    low: 'Small', med: 'Normal', high: 'High', tipDrag: 'Drag on preview to move, pinch to resize', freezeDone: 'Freeze frame added',
    reverseNote: 'Reverse preview may be slow; export is smooth.', selectClip: 'Select a clip first', saving: 'Saving to Gallery…', savedGallery: 'Saved to Gallery (Movies/SP01)',
  },
  hi: {
    title: 'SP01 प्रो एडिटर', back: 'वापस', export: 'एक्सपोर्ट', addVideo: 'वीडियो', addPhoto: 'फ़ोटो', text: 'टेक्स्ट', audio: 'ऑडियो', overlay: 'ओवरले',
    filters: 'फ़िल्टर', adjust: 'लाइटिंग', effects: 'इफ़ेक्ट', ratio: 'साइज़', canvas: 'बैकग्राउंड', split: 'काटें', del: 'हटाएँ', speed: 'स्पीड',
    volume: 'आवाज़', anim: 'एनिमेशन', trans: 'ट्रांज़िशन', chroma: 'क्रोमा की', reverse: 'उल्टा', freeze: 'फ़्रीज़', dup: 'कॉपी',
    edit: 'बदलें', font: 'फ़ॉन्ट', style: 'स्टाइल', fade: 'फ़ेड', record: 'वॉइस', beats: 'बीट', undo: 'पीछे', redo: 'आगे', done: 'हो गया',
    none: 'कुछ नहीं', amount: 'ताक़त', reset: 'रीसेट', apply_all: 'सभी क्लिप पर लगाएँ', in: 'शुरू में', out: 'अंत में', duration: 'समय',
    empty: '“+ वीडियो” दबाकर शुरू करें। फ़ोन से वीडियो/फ़ोटो जोड़ें – कुछ भी अपलोड नहीं होता।', addFirst: '+ वीडियो / फ़ोटो जोड़ें',
    brightness: 'चमक', contrast: 'कंट्रास्ट', saturation: 'रंग गहराई', exposure: 'एक्सपोज़र', temperature: 'गर्म/ठंडा', tint: 'टिंट',
    highlights: 'हाइलाइट', shadows: 'शैडो', vignette: 'विनेट', sharpen: 'शार्प', fadeA: 'फ़ेड', grain: 'ग्रेन', hue: 'ह्यू',
    color: 'रंग', outline: 'आउटलाइन', shadow: 'शैडो', box: 'बॉक्स', size: 'साइज़', bold: 'बोल्ड', align: 'संरेखण', opacity: 'पारदर्शिता',
    similarity: 'मिलान', smooth: 'नरमी', spill: 'किनारा साफ़', pick: 'रंग चुनें', green: 'हरा', blue: 'नीला', keyOn: 'रंग हटाएँ',
    origVol: 'क्लिप की आवाज़', mute: 'म्यूट', fadeIn: 'धीरे शुरू', fadeOut: 'धीरे बंद', intensity: 'ताक़त',
    exportTitle: 'वीडियो एक्सपोर्ट', resolution: 'क्वालिटी', fps: 'फ़्रेम रेट', quality: 'साइज़', start: 'एक्सपोर्ट शुरू', exporting: 'एक्सपोर्ट हो रहा है…',
    saved: 'वीडियो तैयार', save: 'सेव', share: 'शेयर', cancel: 'रद्द', preparingAudio: 'आवाज़ पढ़ी जा रही है…', decoding: 'तैयारी…',
    noCodecs: 'यह ब्राउज़र एक्सपोर्ट नहीं कर सकता। Chrome अपडेट करें (100+) या Android ऐप इस्तेमाल करें।', recStart: 'रिकॉर्डिंग… रोकने के लिए फिर दबाएँ',
    micDenied: 'माइक की अनुमति नहीं मिली', typeHere: 'अपना टेक्स्ट लिखें', beatsFound: 'बीट मार्क हुईं', noBeats: 'पहले कोई ऑडियो चुनें',
    blurBg: 'ब्लर', fit: 'पूरा', fill: 'भरा', leave: 'एडिटर छोड़ें? बिना एक्सपोर्ट का काम मिट जाएगा।', tooBig: 'बड़ी फ़ाइल: आवाज़ इंजन से पढ़ी जा रही है, रुकें…',
    low: 'छोटा', med: 'सामान्य', high: 'हाई', tipDrag: 'प्रीव्यू पर खींचकर हटाएँ, दो उँगली से छोटा/बड़ा करें', freezeDone: 'फ़्रीज़ फ़्रेम जुड़ गया',
    reverseNote: 'उल्टा प्रीव्यू धीमा हो सकता है; एक्सपोर्ट सही बनेगा।', selectClip: 'पहले कोई क्लिप चुनें', saving: 'गैलरी में सेव हो रहा है…', savedGallery: 'गैलरी में सेव हो गया (Movies/SP01)',
  },
};
const t = (k) => I18N[lang]?.[k] ?? I18N.en[k] ?? k;

function toast(msg, ms = 2600) { const el = $('#toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('on'), ms); }

/* ------------------------------------------------------------------ presets */
const ADJ_KEYS = ['brightness', 'contrast', 'saturation', 'exposure', 'temperature', 'tint', 'highlights', 'shadows', 'vignette', 'sharpen', 'fadeA', 'grain', 'hue'];
const ADJ0 = () => Object.fromEntries(ADJ_KEYS.map((k) => [k, 0]));
// Each filter = adjustment values (-1..1) + optional sepia / mono / tone colours
const FILTERS = {
  none: {},
  vivid: { saturation: .35, contrast: .15, exposure: .05 },
  cinematic: { contrast: .2, saturation: -.15, temperature: -.15, shadows: -.1, vignette: .35, tone: [0.0, 0.08, 0.12], toneH: [0.1, 0.06, -0.04] },
  warm: { temperature: .45, saturation: .1, highlights: .05 },
  cool: { temperature: -.45, tint: .05, saturation: .05 },
  vintage: { sepia: .45, fadeA: .3, contrast: -.1, vignette: .35, grain: .25 },
  bw: { mono: 1, contrast: .2 },
  noir: { mono: 1, contrast: .55, shadows: -.2, vignette: .45, grain: .2 },
  film: { fadeA: .2, saturation: -.1, grain: .35, temperature: .1, tone: [0.04, 0.02, 0.06] },
  golden: { temperature: .35, tint: -.05, exposure: .08, saturation: .2, toneH: [0.12, 0.06, -0.06] },
  teal: { tone: [-0.02, 0.06, 0.1], toneH: [0.12, 0.05, -0.08], contrast: .15, saturation: .1 },
  pink: { tint: .3, temperature: .1, fadeA: .12, saturation: .1 },
  fade: { fadeA: .45, contrast: -.15, saturation: -.2 },
  drama: { contrast: .45, saturation: -.25, shadows: -.25, highlights: -.15, vignette: .3 },
  bright: { exposure: .25, shadows: .2, saturation: .1 },
  moody: { exposure: -.12, saturation: -.3, contrast: .2, temperature: -.1, vignette: .4 },
  retro: { sepia: .25, saturation: .2, fadeA: .2, hue: .03, grain: .3 },
  food: { saturation: .3, temperature: .2, contrast: .1, sharpen: .4 },
  nature: { saturation: .3, tint: -.12, contrast: .1 },
  neon: { saturation: .7, contrast: .3, hue: -.06, tint: .2 },
  sepia: { sepia: 1, contrast: .05 },
};
const FILTER_NAMES = Object.keys(FILTERS);
const ANIMS = ['none', 'fade', 'slideL', 'slideR', 'slideU', 'slideD', 'zoomIn', 'zoomOut', 'pop', 'spin', 'blur', 'typewriter'];
const TRANS = ['none', 'fade', 'black', 'white', 'slideL', 'slideR', 'slideU', 'zoom', 'wipe', 'spin', 'blur'];
const FX = ['shake', 'zoomPulse', 'glitch', 'rgb', 'blur', 'vhs', 'lightLeak', 'flash', 'oldFilm', 'mirror', 'pixel', 'neonEdge'];
const FX_ICON = { shake: '📳', zoomPulse: '💓', glitch: '⚡', rgb: '🌈', blur: '🌫️', vhs: '📼', lightLeak: '🌅', flash: '⚪', oldFilm: '🎞️', mirror: '🪞', pixel: '🟪', neonEdge: '💡' };
const NAMES = {
  en: { none: 'None', vivid: 'Vivid', cinematic: 'Cinematic', warm: 'Warm', cool: 'Cool', vintage: 'Vintage', bw: 'B&W', noir: 'Noir', film: 'Film', golden: 'Golden', teal: 'Teal & Orange', pink: 'Pink', fade: 'Faded', drama: 'Drama', bright: 'Bright', moody: 'Moody', retro: 'Retro', food: 'Food', nature: 'Nature', neon: 'Neon', sepia: 'Sepia',
    fadeIn2: 'Fade', slideL: 'Slide ←', slideR: 'Slide →', slideU: 'Slide ↑', slideD: 'Slide ↓', zoomIn: 'Zoom in', zoomOut: 'Zoom out', pop: 'Pop', spin: 'Spin', blur: 'Blur', typewriter: 'Typewriter',
    black: 'Dip black', white: 'Flash white', zoom: 'Zoom', wipe: 'Wipe', shake: 'Shake', zoomPulse: 'Zoom pulse', glitch: 'Glitch', rgb: 'RGB split', vhs: 'VHS', lightLeak: 'Light leak', flash: 'Flash', oldFilm: 'Old film', mirror: 'Mirror', pixel: 'Pixelate', neonEdge: 'Neon edge' },
  hi: { none: 'कुछ नहीं', vivid: 'चटक', cinematic: 'सिनेमा', warm: 'गर्म', cool: 'ठंडा', vintage: 'पुराना', bw: 'ब्लैक-व्हाइट', noir: 'नोयर', film: 'फ़िल्म', golden: 'सुनहरा', teal: 'टील-ऑरेंज', pink: 'गुलाबी', fade: 'फीका', drama: 'ड्रामा', bright: 'उजला', moody: 'मूडी', retro: 'रेट्रो', food: 'खाना', nature: 'प्रकृति', neon: 'नियॉन', sepia: 'सेपिया',
    fadeIn2: 'फ़ेड', slideL: 'स्लाइड ←', slideR: 'स्लाइड →', slideU: 'स्लाइड ↑', slideD: 'स्लाइड ↓', zoomIn: 'ज़ूम इन', zoomOut: 'ज़ूम आउट', pop: 'पॉप', spin: 'घुमाव', blur: 'ब्लर', typewriter: 'टाइपराइटर',
    black: 'काला', white: 'सफ़ेद फ़्लैश', zoom: 'ज़ूम', wipe: 'वाइप', shake: 'हिलना', zoomPulse: 'ज़ूम धड़कन', glitch: 'ग्लिच', rgb: 'RGB', vhs: 'VHS', lightLeak: 'लाइट लीक', flash: 'फ़्लैश', oldFilm: 'पुरानी फ़िल्म', mirror: 'शीशा', pixel: 'पिक्सल', neonEdge: 'नियॉन किनारा' },
};
const nm = (k, kind) => (kind !== 'filter' && k === 'fade' ? NAMES[lang].fadeIn2 : null) || NAMES[lang]?.[k] || NAMES.en[k] || k;
const FONTS = [
  ['Poppins', 'Poppins:wght@400;700'], ['Montserrat', 'Montserrat:wght@400;800'], ['Bebas Neue', 'Bebas+Neue'], ['Anton', 'Anton'],
  ['Pacifico', 'Pacifico'], ['Lobster', 'Lobster'], ['Dancing Script', 'Dancing+Script:wght@700'], ['Permanent Marker', 'Permanent+Marker'],
  ['Hind', 'Hind:wght@400;700'], ['Baloo 2', 'Baloo+2:wght@500;800'], ['Kalam', 'Kalam:wght@400;700'], ['Rozha One', 'Rozha+One'],
  ['Yatra One', 'Yatra+One'], ['Tiro Devanagari Hindi', 'Tiro+Devanagari+Hindi'], ['Teko', 'Teko:wght@500;700'], ['Noto Sans Devanagari', 'Noto+Sans+Devanagari:wght@400;800'],
];
(() => { // load fonts (needs internet; falls back to system fonts)
  const l = document.createElement('link'); l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?' + FONTS.map((f) => 'family=' + f[1]).join('&') + '&display=swap';
  document.head.appendChild(l);
})();

/* ------------------------------------------------------------------ project */
const RATIOS = { '9:16': [1080, 1920], '16:9': [1920, 1080], '1:1': [1080, 1080], '4:5': [1080, 1350], '3:4': [1080, 1440], '21:9': [1920, 822] };
const P = {
  ratio: '9:16', w: 1080, h: 1920, bg: 'blur', bgColor: '#000000',
  clips: [], overlays: [], texts: [], audios: [], fx: [],
};
const MEDIA = new Map(); // id -> { id, file, url, kind, dur, w, h, audio: AudioBuffer|null, thumbs: [], peaks }

function newClip(m, extra = {}) {
  return Object.assign({ id: uid(), mediaId: m.id, in: 0, out: m.kind === 'image' ? 3 : m.dur, speed: 1, volume: 1, reverse: false,
    fit: 'fit', filter: 'none', filterAmt: 1, adj: ADJ0(), animIn: 'none', animOut: 'none', animInDur: .5, animOutDur: .5,
    trans: 'none', transDur: .5 }, extra);
}
function newOverlay(m, start) {
  return Object.assign(newClip(m), { start, x: .5, y: .5, scale: .5, rot: 0, opacity: 1, chroma: false, keyColor: '#00ff00', similarity: .35, smooth: .1, spill: .5 });
}
function newText(start) {
  return { id: uid(), text: t('typeHere'), start, dur: 3, x: .5, y: .5, scale: 1, rot: 0, size: .07, font: 'Poppins', color: '#ffffff', bold: true,
    stroke: '#000000', strokeW: 0, shadow: true, box: false, boxColor: '#000000', boxAlpha: .55, align: 'center', opacity: 1,
    animIn: 'fade', animOut: 'fade', animInDur: .5, animOutDur: .5 };
}
function newAudio(m, start) { return { id: uid(), mediaId: m.id, start, in: 0, out: m.dur, volume: 1, fadeIn: 0, fadeOut: 0, beats: [] }; }
function newFx(type, start) { return { id: uid(), type, start, dur: 2, amt: .7 }; }

const clipDur = (c) => Math.max(.05, (c.out - c.in) / (c.speed || 1));
/** layout of the main track: start time of each clip (transitions overlap neighbours) */
function layout() {
  let tt = 0;
  return P.clips.map((c, i) => {
    const d = clipDur(c);
    const prev = P.clips[i - 1];
    const ov = prev && prev.trans !== 'none' ? Math.min(prev.transDur, clipDur(prev) / 2, d / 2) : 0;
    tt -= ov;
    const r = { c, start: tt, end: tt + d, ov };
    tt += d;
    return r;
  });
}
function totalDur() {
  const L = layout();
  let e = L.length ? L[L.length - 1].end : 0;
  for (const o of P.overlays) e = Math.max(e, o.start + clipDur(o));
  for (const x of P.texts) e = Math.max(e, x.start + x.dur);
  for (const f of P.fx) e = Math.max(e, f.start + f.dur);
  if (!L.length) for (const a of P.audios) e = Math.max(e, a.start + (a.out - a.in));
  return e;
}
/** source time inside media for clip-like item at timeline time `tl` */
function srcTime(c, local) { const d = c.out - c.in; const s = clamp(local * c.speed, 0, d - 0.001); return c.reverse ? c.out - s - 0.001 : c.in + s; }

/* ------------------------------------------------------------------ undo */
const HIST = { stack: [], pos: -1, lock: false };
function snapshot() { return JSON.stringify(P); }
function commit() {
  if (HIST.lock) return;
  const s = snapshot();
  if (HIST.stack[HIST.pos] === s) return;
  HIST.stack = HIST.stack.slice(0, HIST.pos + 1); HIST.stack.push(s); if (HIST.stack.length > 60) HIST.stack.shift();
  HIST.pos = HIST.stack.length - 1;
  window.onProjectChange?.();
}
function restore(s) { HIST.lock = true; Object.assign(P, JSON.parse(s)); HIST.lock = false; window.onProjectChange?.(true); }
function undo() { if (HIST.pos > 0) restore(HIST.stack[--HIST.pos]); }
function redo() { if (HIST.pos < HIST.stack.length - 1) restore(HIST.stack[++HIST.pos]); }

/* ------------------------------------------------------------------ media import */
function probeVideo(url) {
  return new Promise((res) => {
    const v = document.createElement('video'); v.preload = 'metadata'; v.muted = true; v.playsInline = true;
    let done = false; const fin = (o) => { if (done) return; done = true; res(o); };
    v.onloadedmetadata = () => fin({ dur: isFinite(v.duration) ? v.duration : 0, w: v.videoWidth, h: v.videoHeight });
    v.onerror = () => fin(null); setTimeout(() => fin(null), 15000); v.src = url;
  });
}
function probeImage(url) {
  return new Promise((res) => { const i = new Image(); i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight, img: i }); i.onerror = () => res(null); i.src = url; });
}
async function importFile(file) {
  const kind = /^image\//.test(file.type) || /\.(jpe?g|png|webp|gif|bmp|heic)$/i.test(file.name) ? 'image' : /^audio\//.test(file.type) || /\.(mp3|m4a|aac|wav|ogg|opus|flac|wma|amr)$/i.test(file.name) ? 'audio' : 'video';
  const url = URL.createObjectURL(file);
  const m = { id: uid(), file, url, kind, name: file.name, dur: 3, w: 0, h: 0, audio: null, thumbs: [], peaks: null };
  if (kind === 'image') { const r = await probeImage(url); if (!r) throw new Error('image'); Object.assign(m, { w: r.w, h: r.h, img: r.img, dur: 3600 }); }
  else if (kind === 'video') { const r = await probeVideo(url); if (!r || !r.w) throw new Error('video'); Object.assign(m, r); }
  else { const r = await probeVideo(url); m.dur = r?.dur || 0; }
  MEDIA.set(m.id, m);
  if (kind !== 'image') m.audioReady = loadAudio(m).catch(() => null);
  return m;
}

let _actx;
const actx = () => _actx || (_actx = new (window.AudioContext || window.webkitAudioContext)());
/** decode the sound of a media file into an AudioBuffer (big videos: extract with FFmpeg first) */
async function loadAudio(m) {
  if (m.audio !== null) return m.audio;
  const big = m.file.size > 160e6;
  let buf = null;
  if (!big) {
    try { buf = await actx().decodeAudioData(await m.file.arrayBuffer()); } catch { buf = null; }
  }
  if (!buf && big && m.kind === 'video' && window.extractAudioFF) {
    try { const data = await window.extractAudioFF(m.file); if (data) buf = await actx().decodeAudioData(data.buffer); } catch { buf = null; }
  }
  m.audio = buf || false;
  if (buf) m.peaks = computePeaks(buf);
  window.onMediaAudio?.(m);
  return m.audio;
}
function computePeaks(buf, perSec = 50) {
  const ch = buf.getChannelData(0); const n = Math.max(1, Math.floor(buf.duration * perSec)); const step = Math.floor(ch.length / n) || 1; const out = new Float32Array(n);
  for (let i = 0; i < n; i++) { let mx = 0; const s = i * step; for (let j = 0; j < step; j += 4) { const v = Math.abs(ch[s + j] || 0); if (v > mx) mx = v; } out[i] = mx; }
  return out;
}
/** simple onset/beat detection on an AudioBuffer → times (s) */
function detectBeats(buf) {
  const sr = buf.sampleRate, ch = buf.getChannelData(0), win = Math.floor(sr * 0.023), n = Math.floor(ch.length / win);
  const e = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < win; j++) { const v = ch[i * win + j]; s += v * v; } e[i] = s / win; }
  const beats = []; const hist = 43; let last = -1;
  for (let i = hist; i < n; i++) {
    let avg = 0; for (let j = i - hist; j < i; j++) avg += e[j]; avg /= hist;
    let vr = 0; for (let j = i - hist; j < i; j++) vr += (e[j] - avg) ** 2; vr /= hist;
    const C = -0.0025714 * vr + 1.5142857;
    const tt = i * win / sr;
    if (e[i] > Math.max(C, 1.35) * avg && e[i] > 1e-5 && tt - last > 0.28) { beats.push(+tt.toFixed(3)); last = tt; }
  }
  return beats;
}

/* video frame for thumbnails */
function grabThumbs(m, count, h = 56) {
  return new Promise((res) => {
    if (m.kind === 'image') { const c = document.createElement('canvas'); const w = Math.round(h * m.w / m.h); c.width = w; c.height = h; c.getContext('2d').drawImage(m.img, 0, 0, w, h); return res([c.toDataURL('image/jpeg', .6)]); }
    const v = document.createElement('video'); v.muted = true; v.preload = 'auto'; v.playsInline = true; v.src = m.url;
    const out = []; let i = 0; const w = Math.round(h * (m.w || 16) / (m.h || 9)); const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const step = () => { if (i >= count) { v.removeAttribute('src'); v.load(); return res(out); } v.currentTime = Math.min(m.dur - .05, (i + .5) * m.dur / count); };
    v.onseeked = () => { try { g.drawImage(v, 0, 0, w, h); out.push(c.toDataURL('image/jpeg', .55)); } catch { out.push(''); } i++; step(); };
    v.onloadeddata = step; v.onerror = () => res(out); setTimeout(() => res(out), 20000);
  });
}
