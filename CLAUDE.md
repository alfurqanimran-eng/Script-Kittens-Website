# SCRIPT KITTENS — Claude Project Memory

## WHO IS THE USER
- Name: **Furqan** (goes by "bro")
- Role: Owner/Lead Developer of Script Kittens
- Style: Casual, fast, direct. Talks like a friend. Says "bro" a lot.
- Skill level: Knows web dev basics, relies on Claude for advanced code
- Host: **Hostinger Business Plan** (supports Node.js, PostgreSQL)

## WHAT IS SCRIPT KITTENS
- Elite gaming tools / cheats / scripts brand
- URL: **script-kittens.com**
- Discord: discord.gg/AqkdsPMU7M
- Vibe: Dark, underground, military-grade, premium hacker aesthetic
- Tagline: "Zero bans. Zero traces. Just pure unfair advantage."
- 1,700+ active users, 50,000+ accounts

## BRAND DESIGN RULES
- Background: #050505 (pure black)
- Accent: #dc2626 (red)
- Text: #ffffff white + #ECDFCC cream/gold secondary
- Fonts: Cinzel (headings), Space Grotesk / Inter (body)
- Effects: GSAP animations, 3D card tilts, glowing orbs, particles
- NO bright colors. Everything dark, sharp, elite.

## CURRENT TECH STACK
### Frontend (existing files)
- `index.html` — Main homepage (1381 lines)
- `cheats.html` — Free cheats page
- `checkout.html` — Purchase/checkout page
- `profile.html` — User profile/dashboard
- `styles.css` — Main CSS (15,000+ lines)
- `script.js` — Main JS (3,500+ lines, uses GSAP heavily)
- `cheats.js`, `checkout.js`, `profile.js` — Page-specific JS
- `config.js` — API base URL config (currently points to Replit)
- `login-premium.css` — Login page styles

### Backend (old - Replit)
- Was hosted on Replit: `https://website-api--aloneghauri7861.replit.app`
- Needs to be migrated to Hostinger Node.js

### Static Assets (`/static/` folder)
- Logo, favicon, game SVGs (Fortnite, Valorant, Roblox, etc.)
- Team photos: 1shot.png, hassaan.png, RK.png, yuta.png, zen.png,
  hassan.png, saeed.png, ahmer.png, reflex.png, kitten.png, masoom.png

## TEAM (shown on About section)
- **1Shot** — Founder & Visionary
- **Raagu (Hassaan)** — Owner & Director
- **RK** — Operations Manager
- **Kitten** — Mascot & Morale
- **Yuta** — Python Architect
- **Zen** — C# Lead Developer
- **Hassan** — C++ Engineer
- **Saeed** — Backend Engineer
- **Ahmer** — Lead Editor
- **Reflex** — VFX Editor

## PRODUCTS (4 cards in showcase carousel)
1. **Premium Kitty Panel** (External) — $9.99/mo or $14.99 perm — Aimbot, ESP, Streamer Mode
2. **Internal Tool** — $1.00+ — Silent Aim, Teleport, Speed Hack
3. **Code Collection** — $4.99 one-time — Scripts pack
4. **API Services** — $1.00/endpoint — RESTful API for devs

## PRICING (API Section)
- Free: $0 — 5 daily calls
- Monthly: $5/mo — Unlimited calls
- Weekly: $2/week — Unlimited calls

## FREE CHEATS SECTION
- 150+ Scripts, 12K+ Downloads, 3.2K Contributors, 4.9★ Rating
- "Code Vault" — Python, Lua, JS, C++
- "Projects Hub" — C#, Python, React, Node

## WHAT HAS BEEN BUILT / FIXED
- [x] Full homepage with all sections
- [x] Free cheats page (cheats.html)
- [x] Checkout page with payment UI
- [x] Profile/dashboard page
- [x] GSAP product card carousel with slide animations
- [x] Mobile responsive (breakpoints: 1000, 900, 768, 600, 480, 390px)
- [x] Fixed: Product card animation broken on mobile (GSAP vs CSS conflict)
- [x] Fixed: Section header images too small on 390px
- [x] Fixed: Ticker logos too small on mobile
- [x] SEO meta tags, sitemap, robots.txt, structured data

## WHAT STILL NEEDS TO BE BUILT (Roadmap)
- [ ] Full Node.js + Express backend (on Hostinger)
- [ ] Auth system — JWT login/register/logout
- [ ] Orders system — create → pay → fulfill
- [ ] Stripe payment integration (Furqan needs to set up Stripe account)
- [ ] Email delivery — Nodemailer (keys, download links, Discord invites)
- [ ] Product delivery types: License Keys + Download Files + Discord Roles
- [ ] Admin panel/routes
- [ ] New Free Cheats page (Google Stitch design being generated)
- [ ] login.html page (proper UI)
- [ ] orders.html page (order history)

## KEY BUGS / KNOWN ISSUES
- GSAP warnings for missing elements (.hero-3d-section, .cc-card, etc.) — harmless, old code refs
- Favicon 404 (favicon.gif/favicon.png missing from root)
- API_BASE_URL still points to dead Replit URL in config.js

## CSS ARCHITECTURE NOTES
- Mobile breakpoints in order (bottom of styles.css):
  - ≤768px (tablet)
  - ≤600px (phone)
  - ≤480px (small phone)
  - ≤390px (very small phone)
- Product showcase: desktop uses `position: absolute` + GSAP opacity/x
- Product showcase: mobile uses `display: none/flex` toggle (CSS)
- GSAP must use `clearProps` on mobile to avoid stale inline styles

## HOW TO WORK ON THIS PROJECT
1. Files are at: `C:/Users/alfur/Desktop/Webiste/`
2. For local preview: `python -m http.server 8766` in that folder
3. Backend config: edit `config.js` → change `API_BASE_URL`
4. Always use GSAP for animations (already loaded via CDN in index.html)
5. Always match the dark red/black brand when adding new UI
