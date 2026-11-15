/* SP01 Pro – WebGL compositor: filters, lighting, chroma key, text, animations, transitions, effects */
'use strict';
const VS = `attribute vec2 a; uniform mat3 m; varying vec2 v;
void main(){ v=vec2(a.x,1.0-a.y); vec3 p=m*vec3(a,1.0); gl_Position=vec4(p.xy,0.0,1.0); }`;
const FS_LAYER = `precision mediump float; varying vec2 v; uniform sampler2D tx; uniform vec2 texel; uniform float op,blur,time;
uniform float br,ct,sat,ex,temp,tint,hi,sh,vig,sharp,fade,grain,hue,sepia,mono; uniform vec3 tone,toneH;
uniform float chroma,sim,smth,spill; uniform vec3 key; uniform float dark;
float luma(vec3 c){return dot(c,vec3(.299,.587,.114));}
float rnd(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
vec3 hueRot(vec3 c,float a){ const vec3 k=vec3(.57735); float ca=cos(a); return c*ca+cross(k,c)*sin(a)+k*dot(k,c)*(1.0-ca); }
vec2 cbcr(vec3 c){ return vec2(dot(c,vec3(-.169,-.331,.5)),dot(c,vec3(.5,-.419,-.081))); }
void main(){
  vec4 s=texture2D(tx,v);
  if(blur>0.0){ vec4 acc=vec4(0.0); float r=blur*24.0;
    for(int i=-2;i<=2;i++) for(int j=-2;j<=2;j++) acc+=texture2D(tx,v+vec2(float(i),float(j))*texel*r);
    s=acc/25.0; }
  if(sharp>0.0){ vec3 n=(texture2D(tx,v+vec2(texel.x,0)).rgb+texture2D(tx,v-vec2(texel.x,0)).rgb+texture2D(tx,v+vec2(0,texel.y)).rgb+texture2D(tx,v-vec2(0,texel.y)).rgb)*.25; s.rgb+=(s.rgb-n)*sharp*2.0; }
  vec3 c=s.rgb; float a=s.a;
  if(chroma>0.0){ float d=distance(cbcr(c),cbcr(key)); float m=smoothstep(sim*.35,sim*.35+smth*.25+.002,d); a*=m;
    float L0=luma(c); c=mix(c,vec3(L0),spill*(1.0-smoothstep(sim*.35,sim*.35+.25,d))); }
  c*=pow(2.0,ex); c+=br*.35; c=(c-.5)*(1.0+ct)+.5;
  float L=luma(c); c+=sh*.4*(1.0-smoothstep(0.0,.55,L)); c+=hi*.4*smoothstep(.45,1.0,L);
  L=luma(c); c=mix(vec3(L),c,1.0+sat);
  c.r+=temp*.11; c.b-=temp*.11; c.g-=tint*.08;
  if(hue!=0.0) c=hueRot(c,hue*6.2832);
  if(sepia>0.0){ vec3 sp=vec3(dot(c,vec3(.393,.769,.189)),dot(c,vec3(.349,.686,.168)),dot(c,vec3(.272,.534,.131))); c=mix(c,sp,sepia); }
  if(mono>0.0) c=mix(c,vec3(luma(c)),mono);
  L=luma(c); c+=tone*(1.0-L)+toneH*L;
  c=mix(c,c*.82+.13,fade);
  if(vig>0.0){ float dd=distance(v,vec2(.5)); c*=1.0-vig*smoothstep(.25,.8,dd); }
  if(grain>0.0) c+=(rnd(v*913.0+time)-.5)*grain*.22;
  c*=1.0-dark;
  c=clamp(c,0.0,1.0);
  gl_FragColor=vec4(c*a*op,a*op);
}`;
const FS_POST = `precision mediump float; varying vec2 v; uniform sampler2D tx; uniform vec2 res; uniform float time;
uniform float shake,zoom,glitch,rgb,blur,vhs,leak,flash,old,mirror,pixel,edge,tintW;
float rnd(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float luma(vec3 c){return dot(c,vec3(.299,.587,.114));}
void main(){
  vec2 uv=v;
  if(zoom>0.0){ uv-=.5; uv/=1.0+zoom*.12*(.5+.5*sin(time*9.0)); uv+=.5; }
  if(shake>0.0){ float tt=floor(time*24.0); uv+=shake*.025*vec2(rnd(vec2(tt,1.0))-.5,rnd(vec2(tt,2.0))-.5); uv=(uv-.5)/(1.0+shake*.03)+.5; }
  if(mirror>0.0 && uv.x>.5) uv.x=1.0-uv.x;
  if(pixel>0.0){ float g=mix(res.x/2.0,res.x/60.0,pixel); vec2 cell=vec2(g,g*res.y/res.x); uv=(floor(uv*cell)+.5)/cell; }
  float gt=floor(time*14.0);
  if(glitch>0.0){ float band=floor(uv.y*18.0); float r=rnd(vec2(band,gt)); if(r>1.0-glitch*.45) uv.x+=(rnd(vec2(gt,band))-.5)*.18*glitch; }
  float off=rgb*.012+glitch*.012*step(.55,rnd(vec2(gt,7.0)))+vhs*.004;
  vec3 c= off>0.0 ? vec3(texture2D(tx,uv+vec2(off,0)).r,texture2D(tx,uv).g,texture2D(tx,uv-vec2(off,0)).b) : texture2D(tx,uv).rgb;
  if(blur>0.0){ vec3 acc=vec3(0.0); for(int i=-3;i<=3;i++) for(int j=-3;j<=3;j++) acc+=texture2D(tx,uv+vec2(float(i),float(j))*blur*.004).rgb; c=acc/49.0; }
  if(edge>0.0){ vec2 e=1.0/res; float gx=luma(texture2D(tx,uv+vec2(e.x,0)).rgb)-luma(texture2D(tx,uv-vec2(e.x,0)).rgb);
    float gy=luma(texture2D(tx,uv+vec2(0,e.y)).rgb)-luma(texture2D(tx,uv-vec2(0,e.y)).rgb); float g=clamp(length(vec2(gx,gy))*6.0,0.0,1.0);
    vec3 neon=.5+.5*cos(6.2832*(uv.y+time*.3+vec3(0.0,.33,.67))); c=mix(c,c*.25+neon*g,edge); }
  if(vhs>0.0){ c+=(rnd(uv*vec2(1.0,640.0)+time)-.5)*.12*vhs; c*=1.0-vhs*.18*step(.5,fract(uv.y*res.y*.25)); c=mix(c,c*vec3(1.06,.95,1.1),vhs); }
  if(old>0.0){ vec3 sp=vec3(dot(c,vec3(.393,.769,.189)),dot(c,vec3(.349,.686,.168)),dot(c,vec3(.272,.534,.131))); c=mix(c,sp,old);
    c+=(rnd(uv*800.0+time)-.5)*.18*old; c*=1.0-old*.12*rnd(vec2(gt,3.0)); float sx=rnd(vec2(gt,5.0)); c-=old*.35*smoothstep(.002,0.0,abs(uv.x-sx))*step(.6,rnd(vec2(gt,9.0)));
    c*=1.0-old*.5*smoothstep(.35,.85,distance(v,vec2(.5))); }
  if(leak>0.0){ vec2 p=vec2(.5+.55*sin(time*.6),.4+.35*cos(time*.45)); c+=vec3(1.0,.5,.18)*leak*.85*smoothstep(.75,0.0,distance(uv,p)); c+=vec3(1.0,.2,.45)*leak*.35*smoothstep(.6,0.0,distance(uv,1.0-p)); }
  if(flash>0.0) c=mix(c,vec3(1.0),flash*pow(max(0.0,sin(time*5.0)),10.0));
  c=mix(c,vec3(1.0),tintW);
  gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);
}`;

const easeOut = (p) => 1 - Math.pow(1 - p, 3);
const backOut = (p) => { const s = 1.70158; p -= 1; return p * p * ((s + 1) * p + s) + 1; };

function animState(it, local, dur, isText) {
  const st = { dx: 0, dy: 0, sc: 1, rot: 0, op: 1, blur: 0, chars: 1 };
  const apply = (type, p, exit) => {
    const e = easeOut(p), r = 1 - e;
    switch (type) {
      case 'fade': st.op *= e; break;
      case 'slideL': st.dx += exit ? -r : r; break;
      case 'slideR': st.dx += exit ? r : -r; break;
      case 'slideU': st.dy += exit ? -r : r; break;
      case 'slideD': st.dy += exit ? r : -r; break;
      case 'zoomIn': st.sc *= lerp(.3, 1, e); st.op *= e; break;
      case 'zoomOut': st.sc *= lerp(1.7, 1, e); st.op *= e; break;
      case 'pop': st.sc *= Math.max(0, backOut(p)); break;
      case 'spin': st.rot += (exit ? 1 : -1) * r * Math.PI * 2; st.sc *= Math.max(.01, e); break;
      case 'blur': st.blur = Math.max(st.blur, r); st.op *= e; break;
      case 'typewriter': if (isText) st.chars = exit ? st.chars * p : Math.min(st.chars, p); else st.op *= e; break;
    }
  };
  if (it.animIn && it.animIn !== 'none') apply(it.animIn, clamp(local / Math.max(.05, it.animInDur), 0, 1), false);
  if (it.animOut && it.animOut !== 'none') apply(it.animOut, clamp((dur - local) / Math.max(.05, it.animOutDur), 0, 1), true);
  return st;
}

function filterParams(it, time) {
  const f = FILTERS[it.filter] || {}; const a = it.filter && it.filter !== 'none' ? (it.filterAmt ?? 1) : 0;
  const o = {};
  for (const k of ADJ_KEYS) o[k] = (it.adj?.[k] || 0) + (f[k] || 0) * a;
  o.sepia = (f.sepia || 0) * a; o.mono = (f.mono || 0) * a;
  o.tone = (f.tone || [0, 0, 0]).map((x) => x * a); o.toneH = (f.toneH || [0, 0, 0]).map((x) => x * a);
  o.time = time % 100;
  return o;
}

function createRenderer(canvas) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false, alpha: false });
  if (!gl) throw new Error('WebGL not available');
  const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = (fs) => { const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); } return { p, u, a: gl.getAttribLocation(p, 'a') }; };
  const L = prog(FS_LAYER), PO = prog(FS_POST);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const texs = new Map();
  const newTex = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
  const fbo = (w, h) => { const t = newTex(); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); const f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null); return { f, t, w, h }; };
  let W = 0, H = 0, scene = null, bgF = null;
  function resize(w, h) {
    if (w === W && h === H) return; W = canvas.width = w; H = canvas.height = h;
    if (scene) { gl.deleteTexture(scene.t); gl.deleteFramebuffer(scene.f); gl.deleteTexture(bgF.t); gl.deleteFramebuffer(bgF.f); }
    scene = fbo(W, H); const s = 96 / Math.max(W, H); bgF = fbo(Math.max(8, Math.round(W * s)), Math.max(8, Math.round(H * s)));
  }
  function upload(key, src) {
    let t = texs.get(key); if (!t) { t = newTex(); texs.set(key, t); }
    gl.bindTexture(gl.TEXTURE_2D, t);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); } catch { return null; }
    return t;
  }
  function drop(key) { const t = texs.get(key); if (t) { gl.deleteTexture(t); texs.delete(key); } }
  /** matrix mapping unit quad → clip space, item centred at (cx,cy) px with size w×h px, rotated */
  function mat(cx, cy, w, h, rot, tw, th) {
    const c = Math.cos(rot), s = Math.sin(rot);
    // p = C + R*((a-.5)*size) ; clip = (p/t)*2-1 with y flipped
    const ax = c * w, bx = -s * h, ay = s * w, by = c * h;
    const ox = cx - (ax + bx) / 2, oy = cy - (ay + by) / 2;
    const sx = 2 / tw, sy = -2 / th;
    return new Float32Array([ax * sx, ay * sy, 0, bx * sx, by * sy, 0, ox * sx - 1, oy * sy + 1, 1]);
  }
  function useLayer(tex, m, P2, op, tw, th, texW, texH) {
    gl.useProgram(L.p); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(L.a); gl.vertexAttribPointer(L.a, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); const u = L.u;
    gl.uniformMatrix3fv(u.m, false, m); gl.uniform1i(u.tx, 0); gl.uniform2f(u.texel, 1 / (texW || 512), 1 / (texH || 512));
    const p = P2 || {};
    gl.uniform1f(u.op, op); gl.uniform1f(u.blur, p.blurL || 0); gl.uniform1f(u.time, p.time || 0);
    gl.uniform1f(u.br, p.brightness || 0); gl.uniform1f(u.ct, p.contrast || 0); gl.uniform1f(u.sat, p.saturation || 0); gl.uniform1f(u.ex, p.exposure || 0);
    gl.uniform1f(u.temp, p.temperature || 0); gl.uniform1f(u.tint, p.tint || 0); gl.uniform1f(u.hi, p.highlights || 0); gl.uniform1f(u.sh, p.shadows || 0);
    gl.uniform1f(u.vig, Math.max(0, p.vignette || 0)); gl.uniform1f(u.sharp, Math.max(0, p.sharpen || 0)); gl.uniform1f(u.fade, Math.max(0, p.fadeA || 0));
    gl.uniform1f(u.grain, Math.max(0, p.grain || 0)); gl.uniform1f(u.hue, p.hue || 0); gl.uniform1f(u.sepia, p.sepia || 0); gl.uniform1f(u.mono, p.mono || 0);
    gl.uniform3fv(u.tone, p.tone || [0, 0, 0]); gl.uniform3fv(u.toneH, p.toneH || [0, 0, 0]); gl.uniform1f(u.dark, p.dark || 0);
    gl.uniform1f(u.chroma, p.chroma ? 1 : 0); gl.uniform3fv(u.key, p.key || [0, 1, 0]); gl.uniform1f(u.sim, p.sim ?? .35); gl.uniform1f(u.smth, p.smooth ?? .1); gl.uniform1f(u.spill, p.spill ?? .5);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  const hex3 = (h) => { const n = parseInt((h || '#00ff00').slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

  /* text → canvas (cached) */
  const tcache = new Map();
  function textCanvas(tx, frac, renderH) {
    const chars = [...tx.text];
    const n = frac >= 1 ? chars.length : Math.floor(chars.length * frac);
    const key = JSON.stringify([tx.text, tx.size, tx.font, tx.color, tx.bold, tx.stroke, tx.strokeW, tx.shadow, tx.box, tx.boxColor, tx.boxAlpha, tx.align, n, renderH]);
    const hit = tcache.get(tx.id); if (hit && hit.key === key) return hit;
    const str = chars.slice(0, n).join('');
    const px = Math.max(8, tx.size * renderH); const font = `${tx.bold ? '700 ' : ''}${px}px "${tx.font}", "Noto Sans Devanagari", sans-serif`;
    const c = hit?.c || document.createElement('canvas'); const g = c.getContext('2d'); g.font = font;
    const lines = (n ? str : ' ').split('\n'); const lh = px * 1.22; const pad = px * (tx.box ? .45 : .25) + (tx.strokeW || 0) * px * .12 + (tx.shadow ? px * .12 : 0);
    const fullW = Math.max(...[...tx.text.split('\n')].map((l) => g.measureText(l || ' ').width));
    const cw = Math.ceil(fullW + pad * 2), ch = Math.ceil(tx.text.split('\n').length * lh + pad * 2);
    c.width = Math.max(4, cw); c.height = Math.max(4, ch);
    g.font = font; g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (tx.box && n) { g.fillStyle = tx.boxColor; g.globalAlpha = tx.boxAlpha; const r = px * .3; g.beginPath(); g.roundRect ? g.roundRect(0, 0, c.width, c.height, r) : g.rect(0, 0, c.width, c.height); g.fill(); g.globalAlpha = 1; }
    lines.forEach((l, i) => {
      const w = g.measureText(l).width; const x = tx.align === 'left' ? pad : tx.align === 'right' ? c.width - pad - w : (c.width - w) / 2; const y = pad + lh * (i + .5);
      if (tx.shadow) { g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = px * .18; g.shadowOffsetY = px * .05; }
      if (tx.strokeW > 0) { g.strokeStyle = tx.stroke; g.lineWidth = tx.strokeW * px * .12; g.strokeText(l, x, y); g.shadowColor = 'transparent'; }
      g.fillStyle = tx.color; g.fillText(l, x, y); g.shadowColor = 'transparent';
    });
    const o = { key, c, w: c.width, h: c.height, fresh: true }; tcache.set(tx.id, o); return o;
  }

  /**
   * Draw the frame at timeline time `t`.
   * provider(item, srcTime) → { el, w, h } (video element already at srcTime, or image) or null
   */
  function render(t, provider, opts = {}) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.f); gl.viewport(0, 0, W, H);
    const bgc = hex3(P.bgColor); gl.clearColor(bgc[0], bgc[1], bgc[2], 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const boxes = [];
    const L2 = layout();
    let whiteFlash = 0;
    const active = L2.filter((r) => t >= r.start && t < r.end + (r === L2[L2.length - 1] ? .001 : 0));
    active.forEach((r, idx) => {
      const c = r.c; const local = t - r.start; const d = r.end - r.start;
      const src = provider(c, srcTime(c, local)); if (!src || !src.w) return;
      const tex = upload('c' + c.id, src.el); if (!tex) return;
      let st = animState(c, local, d, false); let tr = { dx: 0, dy: 0, sc: 1, rot: 0, op: 1, blur: 0, wipe: 1, dark: 0 };
      // transition with the neighbour
      const nextR = L2[L2.indexOf(r) + 1];
      if (nextR && t >= nextR.start && c.trans !== 'none') { // c is outgoing
        const p = clamp((t - nextR.start) / Math.max(.01, nextR.ov), 0, 1); tr = transOut(c.trans, p);
        if (c.trans === 'white') whiteFlash = Math.max(whiteFlash, 1 - Math.abs(p * 2 - 1));
      }
      const prevR = L2[L2.indexOf(r) - 1];
      if (prevR && prevR.c.trans !== 'none' && local < r.ov) { const p = clamp(local / Math.max(.01, r.ov), 0, 1); tr = transIn(prevR.c.trans, p); }
      const fitS = c.fit === 'fill' ? Math.max(W / src.w, H / src.h) : Math.min(W / src.w, H / src.h);
      // blurred background (only for the first visible clip, fit mode)
      if (idx === 0 && c.fit !== 'fill' && P.bg === 'blur') {
        gl.bindFramebuffer(gl.FRAMEBUFFER, bgF.f); gl.viewport(0, 0, bgF.w, bgF.h); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
        const bs = Math.max(bgF.w / src.w, bgF.h / src.h);
        useLayer(tex, mat(bgF.w / 2, bgF.h / 2, src.w * bs, src.h * bs, 0, bgF.w, bgF.h), { blurL: .15 }, 1, bgF.w, bgF.h, src.w, src.h);
        gl.bindFramebuffer(gl.FRAMEBUFFER, scene.f); gl.viewport(0, 0, W, H);
        useLayer(bgF.t, mat(W / 2, H / 2, W, H, 0, W, H), { blurL: .06, dark: .25 }, tr.op * st.op, W, H, bgF.w, bgF.h);
      }
      const fp = filterParams(c, t); fp.blurL = Math.max(st.blur, tr.blur) * .25; fp.dark = tr.dark;
      const sw = src.w * fitS * st.sc * tr.sc, sh = src.h * fitS * st.sc * tr.sc;
      const cx = W / 2 + (st.dx + tr.dx) * W, cy = H / 2 + (st.dy + tr.dy) * H;
      if (tr.wipe < 1) { gl.enable(gl.SCISSOR_TEST); gl.scissor(0, 0, Math.round(W * tr.wipe), H); }
      useLayer(tex, mat(cx, cy, sw, sh, st.rot + tr.rot, W, H), fp, st.op * tr.op, W, H, src.w, src.h);
      gl.disable(gl.SCISSOR_TEST);
      boxes.push({ id: c.id, kind: 'clip', cx: cx / W, cy: cy / H, w: sw / W, h: sh / H, rot: st.rot });
    });
    // overlays (picture-in-picture, green screen)
    for (const o of P.overlays) {
      const d = clipDur(o); if (t < o.start || t >= o.start + d) continue;
      const local = t - o.start; const src = provider(o, srcTime(o, local)); if (!src || !src.w) continue;
      const tex = upload('o' + o.id, src.el); if (!tex) continue;
      const st = animState(o, local, d, false); const fp = filterParams(o, t);
      Object.assign(fp, { chroma: o.chroma, key: hex3(o.keyColor), sim: o.similarity, smooth: o.smooth, spill: o.spill, blurL: st.blur * .25 });
      const w = W * o.scale * st.sc, h = w * src.h / src.w; const cx = (o.x + st.dx) * W, cy = (o.y + st.dy) * H;
      useLayer(tex, mat(cx, cy, w, h, o.rot + st.rot, W, H), fp, o.opacity * st.op, W, H, src.w, src.h);
      boxes.push({ id: o.id, kind: 'overlay', cx: cx / W, cy: cy / H, w: w / W, h: h / H, rot: o.rot + st.rot });
    }
    // texts
    for (const x of P.texts) {
      if (t < x.start || t >= x.start + x.dur) continue;
      const local = t - x.start; const st = animState(x, local, x.dur, true);
      const tc = textCanvas(x, st.chars, H); const tex = tc.fresh || !texs.has('t' + x.id) ? upload('t' + x.id, tc.c) : texs.get('t' + x.id); tc.fresh = false;
      const w = tc.w * x.scale * st.sc, h = tc.h * x.scale * st.sc; const cx = (x.x + st.dx) * W, cy = (x.y + st.dy) * H;
      useLayer(tex, mat(cx, cy, w, h, x.rot + st.rot, W, H), { blurL: st.blur * .25 }, x.opacity * st.op, W, H, tc.w, tc.h);
      boxes.push({ id: x.id, kind: 'text', cx: cx / W, cy: cy / H, w: w / W, h: h / H, rot: x.rot + st.rot });
    }
    // post effects
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.useProgram(PO.p); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(PO.a); gl.vertexAttribPointer(PO.a, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, scene.t);
    const u = PO.u; gl.uniformMatrix3fv(u.m, false, mat(W / 2, H / 2, W, H, 0, W, H)); gl.uniform1i(u.tx, 0); gl.uniform2f(u.res, W, H); gl.uniform1f(u.time, t);
    const fx = { shake: 0, zoomPulse: 0, glitch: 0, rgb: 0, blur: 0, vhs: 0, lightLeak: 0, flash: 0, oldFilm: 0, mirror: 0, pixel: 0, neonEdge: 0 };
    for (const f of P.fx) { if (t < f.start || t >= f.start + f.dur) continue; const env = Math.min(1, (t - f.start) / .15, (f.start + f.dur - t) / .15); fx[f.type] = Math.max(fx[f.type], f.amt * env); }
    gl.uniform1f(u.shake, fx.shake); gl.uniform1f(u.zoom, fx.zoomPulse); gl.uniform1f(u.glitch, fx.glitch); gl.uniform1f(u.rgb, fx.rgb); gl.uniform1f(u.blur, fx.blur);
    gl.uniform1f(u.vhs, fx.vhs); gl.uniform1f(u.leak, fx.lightLeak); gl.uniform1f(u.flash, fx.flash); gl.uniform1f(u.old, fx.oldFilm); gl.uniform1f(u.mirror, fx.mirror > 0 ? 1 : 0);
    gl.uniform1f(u.pixel, fx.pixel); gl.uniform1f(u.edge, fx.neonEdge); gl.uniform1f(u.tintW, whiteFlash);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return boxes;
  }
  function transOut(type, p) {
    const o = { dx: 0, dy: 0, sc: 1, rot: 0, op: 1, blur: 0, wipe: 1, dark: 0 };
    switch (type) {
      case 'black': o.dark = Math.min(1, p * 2); break;
      case 'white': break;
      case 'slideL': o.dx = -p; break; case 'slideR': o.dx = p; break; case 'slideU': o.dy = -p; break;
      case 'zoom': o.sc = 1 + p * .5; o.op = 1 - p; break;
      case 'spin': o.rot = p * Math.PI; o.op = 1 - p; o.sc = 1 - p * .5; break;
      case 'blur': o.blur = p; break;
    }
    return o;
  }
  function transIn(type, p) {
    const o = { dx: 0, dy: 0, sc: 1, rot: 0, op: 1, blur: 0, wipe: 1, dark: 0 };
    switch (type) {
      case 'fade': o.op = p; break;
      case 'black': o.op = clamp(p * 2 - 1, 0, 1); o.dark = 1 - o.op; break;
      case 'white': o.op = clamp(p * 2 - 1, 0, 1); break;
      case 'slideL': o.dx = 1 - p; break; case 'slideR': o.dx = -(1 - p); break; case 'slideU': o.dy = 1 - p; break;
      case 'zoom': o.sc = lerp(.6, 1, p); o.op = p; break;
      case 'wipe': o.wipe = p; break;
      case 'spin': o.rot = -(1 - p) * Math.PI; o.op = p; o.sc = Math.max(.01, p); break;
      case 'blur': o.blur = 1 - p; o.op = p; break;
    }
    return o;
  }
  return { gl, resize, render, drop, get size() { return [W, H]; }, textCanvas };
}
