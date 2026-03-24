# Eden — Product & Brand Roadmap

---

## Brand Direction

### Core Idea
- **Eden** = home search for one person (taste, standards, intuition, "this feels right for me")
- **Eden Together** = home search for a relationship dynamic (compatibility, tradeoffs, chemistry, shared decision-making)

### Brand Promise
> Find a home that fits your life, not just your filters.

**Differentiator:** Most rental apps help users search. Eden helps users *decide.*

---

### Voice & Tone
- Observant, not salesy
- Emotionally literate, not cute
- Neighborhood-smart, not trend-chasing
- Premium, but not luxury-stiff

**Voice examples:**
- "Bright mornings, quieter evenings, and enough nearby to keep life easy."
- "Strong fit for your day-to-day. Less strong if entertaining at home matters."
- "This one leans Hannah, but the transit and light should win Alex over too."

---

### Visual Identity

**Aesthetic:** Dark-mode first, cinematic, warm, urban, editorial.
Influences: Airbnb restraint · The Strategist intelligence · Letterboxd mood scoring · premium real-estate photography without broker clichés

**Color System:**

| Role | Name | Hex |
|------|------|-----|
| Background (deep) | Obsidian | `#0D0F12` |
| Background (panel) | Soft Charcoal | `#151922` |
| Background (elevated) | Dark Panel | `#1B2130` |
| Text (primary) | Warm White | `#F5F1EA` |
| Text (muted) | Stone | `#B7B0A3` |
| Text (secondary) | Slate | `#8E93A1` |
| **Eden accent** | Moss | `#7FA36C` |
| Eden accent (deep) | Deep Sage | `#5E7A56` |
| **Together accent** | Mulberry | `#8B6F8F` |
| Together accent (deep) | Dusty Plum | `#6E566F` |
| Score: great (8–10) | Soft Green | `#7FA36C` |
| Score: good (6–7.9) | Muted Amber | `#B98A52` |
| Score: low (0–5.9) | Stone/Ash | `#666B75` |

**Typography:**
- Headline/brand moments: Instrument Serif or Cormorant Garamond (emotional intelligence, "home" softness)
- UI/body: Inter or Geist (navigable, modern)
- Serif for: hero headlines, pull quotes, listing narrative
- Sans for: nav, cards, scores, criteria labels, maps

**Logo:** `eden` lowercase wordmark — soft, quiet, assured. No hard tech geometry.

---

### Internal Product Language
| Term | Meaning |
|------|---------|
| Your bar | Minimum score threshold |
| Fit score | Overall listing score (0–10) |
| Why it fits | Short Claude summary |
| Criteria | Weighted user priorities |
| Together fit | Household blended score |
| Alex's view / Hannah's view | Per-member reasoning in Together mode |

---

## Homepage Concept

### Structure

1. **Hero**
   - Headline: "Stop searching. Let Eden find you."
   - Subtext: "Describe the kind of place you want in your own words — light, calm, walkable, dog-friendly, worth the rent. Eden scores every listing against your standards, so only the right homes make the cut."
   - CTAs: "Find my fit" (moss) · "Try Eden Together" (plum)
   - Visual: Dark-mode listing card stack (left) + criteria chips + score visualization (right), Solo/Together toggle

2. **How it works** (3 steps)
   - Tell Eden what matters (natural language, weighted criteria)
   - Eden scores every listing (light, walkability, neighborhood feel, pets, and more)
   - Only the right homes surface (threshold-based feed)

3. **Solo vs Together split section**
   - Left card (moss): Eden — for finding a place that feels right to *you*
   - Right card (plum): Eden Together — for finding a place that works for *both of you*
   - "Two ways to find home"

4. **Product proof** — 3 stacked examples with realistic Claude-style summaries:
   - Natural light: "South-facing windows and an open living area make this one strong for your mornings."
   - Walkability: "Good coffee, groceries, and dinner options within 10 minutes on foot."
   - Together mode: "This one leans Alex on layout and quiet. Hannah gets the neighborhood energy and restaurants."

5. **Feed preview** — polished listing card with score badge, one-line summary, price/neighborhood meta

6. **Listing detail preview** — show reasoning system: overall score, per-criteria bars, "Why it scored this way", "What to think twice about"

7. **Map + settings section** — dark map region selector + criteria sliders + threshold input

8. **Philosophy block** — "Eden is built for people who know what they want, but don't want to spend their lives scrolling for it." + stat-style beliefs (Less scrolling · Clearer tradeoffs · Better matches)

9. **Closing CTA** — "Your next home should feel obvious sooner." + "Find my fit" / "Start with Eden Together"

---

## Feature Roadmap

### ✅ Done
- [x] Google OAuth + Supabase auth
- [x] Weighted criteria system
- [x] Zillow scraper via RapidAPI
- [x] Claude scoring engine (individual)
- [x] Feed with score threshold filtering
- [x] Listing detail with narrative + criteria bars
- [x] Score images from Zillow
- [x] Map-based region selector (Mapbox)
- [x] Rent vs. buy toggle in settings
- [x] Household data model (households, household_members, household_invites)
- [x] Household UI (create, invite, leave, pending invites)
- [x] Household scoring engine (Claude per-member + blended narrative)
- [x] Household scoring wired into scraper main loop

### 🔜 Next Up
- [ ] **Household feed view** — blended score card with Together accent, household narrative visible
- [ ] **Listing detail: Together mode** — show per-member scores side by side + household narrative
- [ ] **Invite email via Resend** — send invite link to partner email automatically
- [ ] **History page** — track listings saved/viewed/dismissed over time
- [ ] **Property detail enrichment** — fetch descriptions via getPropertyDetails to improve scoring quality
- [ ] **Email digest** — daily/weekly summary of top matches via Resend
- [ ] **Homepage redesign** — implement brand direction above (dark, editorial, Solo/Together split)
- [ ] **Score badge colors** — update to brand palette (moss / amber / ash, not neon)

### 💡 Later
- [ ] Commute time scoring (Google Maps API)
- [ ] Neighborhood data enrichment (walk score, noise, safety)
- [ ] Mobile-first PWA
- [ ] Listing saved/dismissed actions + feedback loop to improve scoring
- [ ] Multiple saved searches per user
- [ ] Share a listing (link to Eden listing detail)
- [ ] Onboarding flow for new users (guided criteria setup)

---

## Component Style Notes

**Cards:** rounded-2xl · soft low-contrast border · diffuse shadow (not bright)
**Buttons:** primary filled moss · secondary ghost warm border · Together CTA subtle plum tint
**Badges:** pill-shaped · compact · low saturation · score prominent, label secondary
**Sliders:** tactile and elegant · soft fills, not gamer gradients
**Maps:** dark desaturated style · neighborhood overlays in muted fills

**What to avoid:**
- Generic proptech blue
- Heavy chatbot styling
- Too many gradients
- Overly playful illustrations
- "Revolutionizing the rental journey" copy
- Putting "Claude" on the brand surface (it's the engine, not the brand)
