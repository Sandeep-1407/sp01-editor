# SP01 – Video Editor (Prototype, Phase 1)

Video phone/PC ke andar hi edit hoti hai, kahin upload nahi hoti.
Tools: Trim, Cut, Mute, Compress, WhatsApp, Reel 9:16, Merge (videos jodna) · **✨ Pro Editor** · Hindi + English

## Live link
https://sandeep-1407.github.io/sp01-editor/

## ✨ Pro Editor (pro.html)
Home screen par **Pro Editor** button. VN / CapCut jaisa timeline editor:
- 🎨 **Filters** – 20 filters (Cinematic, Vintage, B&W, Golden, Teal & Orange…) + strength slider
- ☀️ **Lighting** – brightness, contrast, saturation, exposure, temperature, tint, highlights, shadows, vignette, sharpen, fade, grain, hue
- 🔤 **Text** – Hindi + English fonts, rang, outline, shadow, box, preview par khinch kar jagah badlein, do ungli se chhota/bada/ghumayein
- 💫 **Animation** – in/out: fade, slide, zoom, pop, spin, blur, typewriter · **Transitions** – fade, dip black, flash white, slide, zoom, wipe, spin, blur
- 🟩 **Chroma key** – green/blue screen hatana, 💧 rang chunna, similarity / smoothness / spill
- 🎵 **Audio** – gaana/voice jodna, trim, volume, fade in/out, 🎤 voice-over, 🥁 beat markers
- ✨ **Effects** – shake, zoom pulse, glitch, RGB split, blur, VHS, light leak, flash, old film, mirror, pixelate, neon edge
- ⏩ speed 0.25x–4x, 🔁 reverse, ❄️ freeze frame, split, duplicate, undo/redo, aspect ratio 9:16 / 16:9 / 1:1 / 4:5…, blur background
- 📤 **Export** 720p / 1080p / 2K, 24/30/60 fps (WebCodecs, phone ka hardware encoder). Chrome 100+ chahiye.

| File | Kaam |
|---|---|
| pro.html | Pro Editor screen |
| pro-core.js | Project, media, filters/animation list, undo |
| pro-gl.js | WebGL preview: filters, lighting, chroma key, text, transitions, effects |
| pro-export.js | Awaaz mix + MP4 export |
| pro-ui.js | Timeline, buttons, panels, gestures |

## Android app (APK)
https://github.com/Sandeep-1407/sp01-editor/releases/latest/download/SP01-Editor.apk
GitHub Actions (`.github/workflows/android.yml`) se apne aap banta hai (Capacitor 7 + `MediaSaverPlugin.java`). Export seedha Gallery → Movies/SP01 mein save hota hai.

## Files
| File | Kaam |
|---|---|
| index.html | Screen design (royal theme) |
| app.js | Saara logic: tools, merge, language, Share / Open with |
| sw.js | Offline chalana + Android "Share → SP01" |
| manifest.webmanifest | App ka naam, icon, Share aur Open with ki setting |
| *.png | App icon |
| ffmpeg.js, classes.js, worker.js, const.js, errors.js, types.js, utils.js | Video engine ka chhota hissa (bada 31 MB engine CDN se aata hai). Inko mat chhedna |

## Mobile (Android) par install
1. Chrome mein upar wala link kholein.
2. Upar ka **Install** button dabayein, ya ⋮ menu → **Add to Home screen / Install app**.
3. Test karein: Gallery mein video kholein, **Share** dabayein, list mein **SP01** chunein.
   (Share list mein SP01 install ke kuch second baad aata hai. Na dikhe to phone ek baar restart karein.)

## PC (Windows) par install
1. Chrome ya Edge mein link kholein. Address bar mein ⊕ Install icon dabayein.
2. Test karein: kisi video par right-click → **Open with → Choose another app → SP01**.

## Test checklist
- [ ] Trim (normal + "एकदम सटीक कट")
- [ ] Cut (beech ka hissa hatana)
- [ ] Mute
- [ ] Compress (teeno level) — phone par kitna time laga, note karein
- [ ] WhatsApp — file WhatsApp par bhej kar dekhein
- [ ] Reel 9:16 — Fit aur Fill dono
- [ ] Merge — ek jaisi videos (turant) aur alag-alag size wali videos
- [ ] Gallery se 2–3 videos ek saath Share → SP01 (merge list khulni chahiye)
- [ ] Share se khulna (mobile), Open with se khulna (PC)
- [ ] Internet band karke dobara kholna (offline)

## Abhi ki limits
- Normal Trim/Cut keyframe par katte hain, isliye cut 0.5–1 second idhar-udhar ho sakta hai. Ekdam sahi cut ke liye "एकदम सटीक कट" on karein.
- Compress, WhatsApp aur Reel mein video dobara banti hai, isliye phone par dheema hai.
- Phone par 1.5 GB se badi video fail ho sakti hai.
- Pehli baar khulne par engine (~31 MB) download hota hai, uske baad offline chalta hai.

---
Created by - Sandeep Kumar from Sandeep Jan Seva Kendra, Mob no. 8299430081
