/* SP01 Pro – sound mixing (preview + export) and MP4 export with WebCodecs */
'use strict';
const MUXER_URL = 'https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.2/build/mp4-muxer.js';

function reversedBuffer(m) {
  if (m.audioRev) return m.audioRev;
  const b = m.audio; const r = new AudioBuffer({ length: b.length, numberOfChannels: b.numberOfChannels, sampleRate: b.sampleRate });
  for (let c = 0; c < b.numberOfChannels; c++) { const s = b.getChannelData(c), d = r.getChannelData(c); for (let i = 0, n = s.length; i < n; i++) d[i] = s[n - 1 - i]; }
  return (m.audioRev = r);
}

/**
 * Schedule every sound of the project on `ctx` so that timeline time `t0` plays at ctx time `when0`.
 * Returns the created source nodes (to stop them later).
 */
function scheduleAudio(ctx, dest, t0, when0) {
  const nodes = [];
  const add = (m, tlStart, tlEnd, inS, outS, rate, vol, rev, fadeIn = 0, fadeOut = 0) => {
    if (!m || !m.audio || vol <= 0) return;
    const from = Math.max(t0, tlStart); if (from >= tlEnd) return;
    const buf = rev ? reversedBuffer(m) : m.audio;
    const off = (rev ? buf.duration - outS : inS) + (from - tlStart) * rate;
    if (off >= buf.duration) return;
    const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
    const g = ctx.createGain(); src.connect(g); g.connect(dest);
    const when = when0 + (from - t0), dur = tlEnd - from;
    g.gain.setValueAtTime(vol, when);
    if (fadeIn > 0 && from < tlStart + fadeIn) { const p = (from - tlStart) / fadeIn; g.gain.setValueAtTime(vol * p, when); g.gain.linearRampToValueAtTime(vol, when + (tlStart + fadeIn - from)); }
    if (fadeOut > 0) { const fs = Math.max(from, tlEnd - fadeOut); const p0 = clamp((tlEnd - fs) / fadeOut, 0, 1); g.gain.setValueAtTime(vol * p0, when + (fs - from)); g.gain.linearRampToValueAtTime(0, when + dur); }
    src.start(when, Math.max(0, off), dur * rate + .02);
    nodes.push(src);
  };
  for (const r of layout()) { const c = r.c; const m = MEDIA.get(c.mediaId); if (m?.kind === 'image') continue;
    add(m, r.start, r.end, c.in, c.out, c.speed, c.volume, c.reverse); }
  for (const o of P.overlays) { const m = MEDIA.get(o.mediaId); if (m?.kind === 'image') continue;
    add(m, o.start, o.start + clipDur(o), o.in, o.out, o.speed, o.volume, o.reverse); }
  for (const a of P.audios) add(MEDIA.get(a.mediaId), a.start, a.start + (a.out - a.in), a.in, a.out, 1, a.volume, false, a.fadeIn, a.fadeOut);
  return nodes;
}

function loadScript(src) {
  return new Promise((res, rej) => { if ([...document.scripts].some((s) => s.src === src)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load ' + src)); document.head.appendChild(s); });
}

const canExport = () => typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';

/** export the project → { blob, name } */
async function exportVideo(opt, onProgress, cancelled) {
  if (!canExport()) throw new Error(t('noCodecs'));
  await loadScript(MUXER_URL);
  const fps = opt.fps || 30; const long = opt.long || 1920;
  const sc = long / Math.max(P.w, P.h); const W = Math.round(P.w * sc / 2) * 2, H = Math.round(P.h * sc / 2) * 2;
  const dur = totalDur(); const nFrames = Math.max(1, Math.ceil(dur * fps));
  const bitrate = Math.round(W * H * fps * ({ low: .05, med: .09, high: .15 }[opt.quality || 'med']));

  // ---- video encoder config
  const candidates = ['avc1.640033', 'avc1.640028', 'avc1.4d0033', 'avc1.42E033', 'avc1.42E01F'];
  let vcfg = null;
  for (const codec of candidates) {
    for (const hw of ['prefer-hardware', 'no-preference']) {
      const c = { codec, width: W, height: H, bitrate, framerate: fps, hardwareAcceleration: hw, avc: { format: 'avc' }, latencyMode: 'quality' };
      try { if ((await VideoEncoder.isConfigSupported(c)).supported) { vcfg = c; break; } } catch {}
    }
    if (vcfg) break;
  }
  if (!vcfg) throw new Error(t('noCodecs'));

  // ---- sound
  onProgress(0, t('preparingAudio'));
  await Promise.all([...MEDIA.values()].map((m) => m.audioReady).filter(Boolean));
  const SR = 48000; let mix = null;
  const hasSound = [...MEDIA.values()].some((m) => m.audio);
  if (hasSound) {
    const off = new OfflineAudioContext(2, Math.ceil(dur * SR) + SR / 10, SR);
    scheduleAudio(off, off.destination, 0, 0);
    mix = await off.startRendering();
  }
  let acfg = null, aCodec = null;
  if (mix && typeof AudioEncoder !== 'undefined') {
    for (const [codec, mc] of [['mp4a.40.2', 'aac'], ['opus', 'opus']]) {
      const c = { codec, sampleRate: SR, numberOfChannels: 2, bitrate: 192000 };
      try { if ((await AudioEncoder.isConfigSupported(c)).supported) { acfg = c; aCodec = mc; break; } } catch {}
    }
  }

  const target = new Mp4Muxer.ArrayBufferTarget();
  const muxer = new Mp4Muxer.Muxer({ target, fastStart: 'in-memory', firstTimestampBehavior: 'offset',
    video: { codec: 'avc', width: W, height: H, frameRate: fps }, ...(acfg ? { audio: { codec: aCodec, numberOfChannels: 2, sampleRate: SR } } : {}) });
  let encErr = null;
  const venc = new VideoEncoder({ output: (ch, meta) => muxer.addVideoChunk(ch, meta), error: (e) => { encErr = e; } });
  venc.configure(vcfg);

  // ---- audio encode (all at once, it is fast)
  if (acfg) {
    const aenc = new AudioEncoder({ output: (ch, meta) => muxer.addAudioChunk(ch, meta), error: (e) => { encErr = e; } });
    aenc.configure(acfg);
    const L = mix.getChannelData(0), R = mix.getChannelData(1); const block = 4800;
    for (let i = 0; i < mix.length; i += block) {
      const n = Math.min(block, mix.length - i); const data = new Float32Array(n * 2); data.set(L.subarray(i, i + n), 0); data.set(R.subarray(i, i + n), n);
      const ad = new AudioData({ format: 'f32-planar', sampleRate: SR, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(i / SR * 1e6), data });
      aenc.encode(ad); ad.close();
    }
    await aenc.flush(); aenc.close();
  }

  // ---- frames
  const cv = document.createElement('canvas'); const R2 = createRenderer(cv); R2.resize(W, H);
  const els = new Map();
  const getEl = (item, m) => {
    let v = els.get(item.id);
    if (!v) { v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = m.url; els.set(item.id, v); }
    return v;
  };
  const ready = (v) => new Promise((res) => { if (v.readyState >= 2) return res(); v.addEventListener('loadeddata', res, { once: true }); setTimeout(res, 8000); });
  const seekTo = (v, tm) => new Promise((res) => {
    if (Math.abs(v.currentTime - tm) < .5 / fps && v.readyState >= 2) return res();
    const done = () => { v.removeEventListener('seeked', done); res(); };
    v.addEventListener('seeked', done); v.currentTime = tm; setTimeout(done, 4000);
  });
  const frameCache = new Map(); const prof = { seek: 0, render: 0, enc: 0 }; let tq = 0;
  try {
    for (let i = 0; i < nFrames; i++) {
      if (cancelled()) throw new Error('cancel');
      if (encErr) throw encErr;
      const tt = i / fps;
      // seek every visible video to its source time first
      const need = [];
      for (const r of layout()) if (tt >= r.start && tt < r.end) need.push([r.c, srcTime(r.c, tt - r.start)]);
      for (const o of P.overlays) if (tt >= o.start && tt < o.start + clipDur(o)) need.push([o, srcTime(o, tt - o.start)]);
      frameCache.clear();
      for (const [it, st] of need) {
        const m = MEDIA.get(it.mediaId); if (!m) continue;
        if (m.kind === 'image') { frameCache.set(it.id, { el: m.img, w: m.w, h: m.h }); continue; }
        const v = getEl(it, m); await ready(v); tq = performance.now(); await seekTo(v, Math.min(st, Math.max(0, m.dur - .02))); prof.seek += performance.now() - tq;
        frameCache.set(it.id, { el: v, w: v.videoWidth, h: v.videoHeight });
      }
      tq = performance.now(); R2.render(tt, (it) => frameCache.get(it.id) || null); prof.render += performance.now() - tq; tq = performance.now();
      const vf = new VideoFrame(cv, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
      venc.encode(vf, { keyFrame: i % (fps * 2) === 0 }); vf.close();
      while (venc.encodeQueueSize > 4) await new Promise((r) => setTimeout(r, 5));
      prof.enc += performance.now() - tq;
      if (i % 3 === 0) onProgress(i / nFrames, `${t('exporting')} ${Math.round(i / nFrames * 100)}%`);
    }
    await venc.flush();
  } finally {
    try { venc.close(); } catch {}
    for (const v of els.values()) { v.removeAttribute('src'); v.load(); }
    try { R2.gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch {}
  }
  muxer.finalize(); window.__expProf = prof;
  onProgress(1, '100%');
  const d = new Date(); const p2 = (n) => String(n).padStart(2, '0');
  return { blob: new Blob([target.buffer], { type: 'video/mp4' }), name: `SP01_${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}_${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}.mp4`, W, H };
}
