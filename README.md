# SP01 – Video Editor (Prototype, Phase 1)

Video phone/PC ke andar hi edit hoti hai, kahin upload nahi hoti.
Tools: Trim, Cut, Mute, Compress, WhatsApp, Reel 9:16, Merge (videos jodna) · Hindi + English

## Live link
https://sandeep-1407.github.io/sp01-editor/

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
