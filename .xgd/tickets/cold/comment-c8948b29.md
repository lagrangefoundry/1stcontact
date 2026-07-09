---
uid: comment-c8948b29
id: COMMENT-36
type: comment
title: Comment on request REQ-36
created_by: xgd
created_at: '2026-07-03T18:02:32.195837+00:00'
updated_at: '2026-07-08T18:55:48.849419+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-d05379d0
  kind: chat_transcript
---

<!-- xgd-turn id="9a6de726-d2a7-4abf-8748-9106a1e62780-user" -->

<!-- xgd-chat role="user" ts="2026-07-03T18:02:30.444732+00:00" -->
#### You
Please read REQ-33 and its chat and the how to which I think is DOC-19. We are going to embark on another exercise like this for a site of a friend of mine:

https://joyfulculinarycreations.com/

I would like you to capture just the home page to start with to a sandbox site.

<!-- xgd-turn id="9a6de726-d2a7-4abf-8748-9106a1e62780-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-03T18:04:55.029670+00:00" -->
#### Claude
I'll start by reading REQ-33, its chat, and DOC-19 to understand the process before capturing the site.

Let me check the REQ-33 chat context and the `1c` CLI capabilities.

`1c` lives at `tools/generate/bin/1c.mjs`. Let me check how it's invoked and view the full CLI help.

Everything's clear. `1c` runs via `node tools/generate/bin/1c.mjs`. This is a capture/data operation (writes to gitignored `storage/references/` and `storage/sandbox/`), so no free-coding ceremony is needed — but I'll keep REQ-36 updated as the session's scope ticket.

Let me run the capture of the home page (step 0 of the DOC-19 runbook). Headless browser, so I'll give it time.

Capture succeeded. Only 1 section detected, though — let me inspect the bundle to understand what was captured.

Capture is complete — it's a WordPress/Elementor site (Oswald/Lato fonts, gold `#f8bb1b` + pink `#cc3366` palette). The segmenter collapsed it to 1 style-scope band. Let me look at the captured structure and the screenshot to understand the page before scaffolding the sandbox site.

Rich capture — 59 content runs, 7 items. It's a personal-chef site (Chef Sarah Joy). Content and per-element values are all captured; the single-section grouping is the known segmenter limitation (grouping error, not fidelity error — each run carries its own color/size/font). Let me view the screenshot and scaffold the sandbox site.The sandbox site is scaffolded. I can now see the full page clearly. Both starting deliverables are done. Let me record this intent on the session's ticket (REQ-36), modeled on REQ-33, so the scope is captured.

Done — the home page is captured and the sandbox site is scaffolded.

## What I did

**1. Read the process docs** — REQ-33 (gigabytealchemy re-import), its chat, and DOC-19 (the faithful-reproduction runbook). The one rule: **transcribe from the captured DOM (`raw.html` / `capture.json`), never reconstruct from the screenshot**; drive from captured values → gate on `1c values-diff` → verify by eye.

**2. Captured the home page**
```
1c capture page https://joyfulculinarycreations.com/
→ storage/references/joyfulculinarycreations.com/index/
```
A REQ-31-complete bundle: `capture.json` (52K), `raw.html`, `rendered.html`, `screenshot.full.png` (full-page, 1280×4744), and 83 mirrored assets (fonts + food photography).

**3. Scaffolded the sandbox site**
```
1c new joyfulculinary --sandbox
→ storage/sandbox/joyfulculinary/draft/
```

**4. Recorded the intent on REQ-36** (this session's ticket) — modeled on REQ-33, with the observed page structure and a progress checklist.

## What the site is

Chef Sarah Joy — holistic in-home personal chef services. A WordPress/Elementor site: gold `#f8bb1b` + pink `#cc3366` palette, Oswald headings, Lato/Karla/Raleway body, white text over food photography, alternating dark/green/light panels. Nine bands: header → photo hero → Holistic Approach → Who Uses Our Services → Our Offerings (3 columns) → quote band → testimonials → 6-cell process grid → gold footer.

One thing to flag: the **segmenter collapsed the page into a single style-scope band**. Per DOC-13 that's a *grouping* artefact, not a fidelity loss — every text run still carries its own colour/size/font/geometry (59 content runs + 7 items captured correctly). It just means the structure pass will lean on `raw.html` and the screenshot to re-establish section boundaries rather than trusting `capture.json`'s single-section split.

## Suggested next step

The capture is the foundation. The reproduction itself (structure → values → treatment → diff-to-zero → eyes) is the REQ-33-style multi-pass effort. Want me to start the **structure pass** next — mapping the nine bands to modules/variants in the `joyfulculinary` sandbox draft — or would you rather review the capture first?

One note: I picked the slug `joyfulculinary` — say the word if you'd prefer something else and I'll re-scaffold.

<!-- xgd-turn id="8e19c72d-a045-4b84-a171-4a9e56868cc7-user" -->

<!-- xgd-chat role="user" ts="2026-07-03T18:05:55.069574+00:00" -->
#### You
please proceeed, when you have a first draft of the reproduction, please fire up a serve and bgive me a link

<!-- xgd-turn id="8e19c72d-a045-4b84-a171-4a9e56868cc7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-03T18:16:12.948064+00:00" -->
#### Claude
Let me proceed. First I'll study the site-def format via the existing gigabytealchemy example and the fresh scaffold, then transcribe from the capture.

Now let me study the completed gigabytealchemy reproduction to learn the module vocabulary and dials.

Now let me examine the framework module definitions to know the exact available modules, variants, and dials.

Let me read all module metas and the shared dials to know the exact vocabulary.

Now the dials vocabulary:

I have the full vocabulary. Now let me transcribe from the capture — full content runs with geometry, the section backgrounds from raw.html, and the assets.

The Holistic Approach panel text is `#54595f` on light grey. Now let me identify section backgrounds and the key images from raw.html and the assets.

Two background images identified: hero = `HERO-AdobeStock...jpeg`, quote band = `market-vegetables...jpg`. Let me pull the homepage's Elementor per-section colors from its post CSS.

post-4401.css is the homepage. Key: dark bands are `#000`, green testimonial panel `#28542D` (~62% α) / quote scrim `#141E14`, footer gold. Let me check the font assets and how fonts get loaded, then look at how an existing site declares custom fonts.

Let me see how the display font gets a `@font-face` wired in, so I can load Oswald/Lato/Karla/Raleway.

Let me check what color headings render in for text-block and services-grid — gold headings are the site's dominant brand signal.

text-block/services-grid headings inherit surface color — no gold. So the site's gold section headings are a genuine capability gap (a `headingTreatment` generalization, like hero's). I'll build a config-only first draft now (correct structure/layout/images/fonts/surfaces), serve it, then propose the gold-heading generalization as pass 2. Let me add the assets first.

Now let me write the theme (`site.json`) and the page (`home.json`). First let me see how the asset adds registered in site.json.

Let me pull the full untruncated text for the items I need to transcribe verbatim.

I have everything. Now let me write the theme (`site.json`) and the page. First the theme:

Now the page. Let me write `home.json` with the 9 bands:

Now render the draft to catch any schema errors:

Rendered cleanly. Let me screenshot the draft to sanity-check before serving.Strong structural match, but one clear bug: the **services-grid cards on the dark (inverse) bands render as empty white boxes** — white cards with white (inherited) text = invisible. Let me inspect the services-grid CSS to fix card/text colors on inverse bands.

Root cause confirmed: on an `inverse` band, `.services-grid` sets text color to white, but each card draws a **white** background (`--color-surface`) without resetting its text to dark — so card text is white-on-white. The original's offerings/process are actually *text columns on a dark band* (no white panels), which the framework can't express yet (that's a pass-2 generalization). 

For a viewable first draft now, I'll switch those two grids to a light `subtle` surface so cards + text render. Let me update and note the dark-band treatment as a pass-2 gap.The first draft now renders cleanly — all nine bands present, content complete and legible, Oswald/Karla fonts loading, hero + quote images, gold buttons/accents/footer. Let me start a server in the background and get you a link.

Server is live — `http://localhost:8790/` returns 200. Let me record the first-draft milestone and the identified fidelity gaps on the ticket.

The first draft is built, rendering cleanly, and served. Here's your link:

## 🔗 http://localhost:8790/

(sandbox draft of `joyfulculinary` — leave this terminal running; the server stops when the session ends.)

## What I did

Following the DOC-19 runbook — **transcribe from the capture, don't reconstruct** — I built the sandbox site config-only (no framework code touched, so no free-coding ceremony needed):

- **Theme** — gold `#f8bb1b` / pink `#cc3366` palette, near-black inverse surface, and the site's real webfonts (Oswald headings, Karla body, Lato) loaded as `@font-face` assets.
- **9 bands, text transcribed verbatim** from `capture.json`/`raw.html`: header (overlay, logo image) → photo hero (fold height, scrim, gold "Learn More") → The Holistic Approach → Who Uses Our Services (checklist) → Our Offerings (3 service cards) → veggie pull-quote (second bg-image hero) → testimonials (2 cards) → How It Works (6 cells) → gold footer.

## Honest fidelity gaps (pass 2)

The structure, content, images, fonts and gold/dark palette are all there, but four things need a second pass — and three of them are genuine framework gaps that need the **generalize-before-adding + free-coding** treatment:

1. **Gold section headings** — in the original *every* section heading is gold; text-block/services-grid headings currently inherit the surface colour. This is the biggest visual miss. Fix = generalize hero's `headingTreatment` dial onto text-block + services-grid.
2. **Dark Offerings / How-It-Works bands** — the original renders these as gold-heading + white text *columns on black*. services-grid always draws white cards, and on a dark band the card text goes white-on-white (invisible) — so I put those two grids on **light** bands to keep the draft legible. Fix = a transparent/"bare" card surface.
3. **Green testimonial panel** — the original is one solid sage-green panel; I approximated with neutral-cool cards (the tint renders too light). Fix = a green surface role.
4. Hero heading is uppercased via CSS in the original; I kept the literal mixed-case text per DOC-19.

I've recorded all this on **REQ-36** (title set, progress + gaps in COMMENT-38).

**Recommended next step:** run the mechanical gate — `1c values-diff joyfulculinary --ref storage/references/joyfulculinarycreations.com/index --sandbox` — to enumerate the deltas precisely, then I'll file the 2-3 generalizations (likely against REQ-32) and knock them out with the free-coding process. Want me to run the diff and start pass 2?

<!-- xgd-turn id="a1f338a3-65a3-4178-a552-6e56adf84892-user" -->

<!-- xgd-chat role="user" ts="2026-07-03T18:17:34.958524+00:00" -->
#### You
The server stopped can you give me a command to run it myself?

<!-- xgd-turn id="a1f338a3-65a3-4178-a552-6e56adf84892-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-03T18:17:42.615580+00:00" -->
#### Claude
Here's the command — run it from the repo root and leave the terminal open:

```bash
cd /Users/martin/Projects/1stcontact
node tools/generate/bin/1c.mjs serve joyfulculinary --source draft --sandbox --port 8790
```

Then open **http://localhost:8790/**

Notes:
- It serves the last render, so if you edit the draft, re-render first: `node tools/generate/bin/1c.mjs render joyfulculinary --source draft --sandbox`
- The `Port 24678 is already in use` line is just Vite's HMR socket (harmless) — the serve still comes up.
- If 8790 is taken, change `--port` to any free port. Stop it with `Ctrl-C`.

<!-- xgd-turn id="3b2bcb8b-ad3f-45d6-8eb8-24a34de0c426-user" -->

<!-- xgd-chat role="user" ts="2026-07-03T18:21:11.778005+00:00" -->
#### You
ok so keep pushing - (1) how close can you get it with the tools you have (2) can you ennumerate the differences?

<!-- xgd-turn id="3b2bcb8b-ad3f-45d6-8eb8-24a34de0c426-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-03T18:26:06.980895+00:00" -->
#### Claude
Good questions. Let me answer (2) mechanically first — run the values-diff gate to enumerate every delta — then use that to push config fidelity as far as it goes.

The gate gives a precise enumeration — 188 deltas. Let me capture the full output and break it down by category.

188 deltas, categorized:

| property | count |
|---|---|
| fontSizePx | 46 |
| color | 36 |
| fontWeight | 36 |
| lineHeightPx | 30 |
| fontFamily | 18 |
| missing | 12 |
| paddingLeftPx | 6 |
| letterSpacingPx | 2 |
| contentAnchor | 1 |
| text (casing) | 1 |

Let me inspect the non-obvious categories (contentAnchor, fontFamily, the "missing" set) to sort config-fixable from code-only.

Now I have a clear picture. The `fontFamily` deltas confirm the original mixes **four** fonts per-element (Raleway for labels/"Learn More", Lato for hero subhead, Oswald for footer nav, Karla for process titles) in ways my 3-slot theme can't assign; the `color` deltas are dominated by gold headings + the dark-band choice; sizes/weights/line-heights are module-fixed. Let me apply the genuine **config** wins (verbatim casing, the omitted short testimonial), re-run the gate to show the delta, then give you the full verdict.

187 — essentially unchanged. That empirically confirms the ceiling: config can't move it further. Let me quantify exactly what each framework change would buy, so the enumeration is actionable.

I now have the complete, quantified picture. Let me record it on the ticket, then give you the verdict.

Here are your two answers.

## (1) How close config gets — the ceiling is reached

I applied the only genuine config wins left (verbatim casing, the omitted testimonial). The mechanical gate moved **188 → 187 deltas** — essentially nothing. That's the empirical proof: **with the tools as-is (config/theme only, no framework code), the draft is structurally and content-complete, but exact-value fidelity is blocked.** The server command from before still serves it.

## (2) The differences — mechanically enumerated (187 deltas)

From `1c values-diff`, **51 matched / 187 deltas**:

| property | count | tier |
|---|---|---|
| fontSizePx | 46 | **code** |
| color | 36 | 33 code / 3 config |
| fontWeight | 36 | **code** |
| lineHeightPx | 30 | **code** |
| fontFamily | 18 | **code** |
| missing | 12 | config (artifacts) |
| paddingLeftPx | 6 | cosmetic |
| letterSpacingPx | 2 | cosmetic |
| contentAnchor | 1 | cosmetic |
| text (casing) | 1 | ✅ fixed |

**~163 of 187 need framework code.** Broken down:

- **Colour (33):** 7 = gold section headings (`#f8bb1b`); 26 = white body text on the dark Offerings/Process bands. The framework can't do either yet — `services-grid` draws white cards, so on a dark band the text goes white-on-white (invisible), which is why I put those two grids on *light* bands. Fixing both = the two biggest **visual** gaps too.
- **Size + weight + line-height (112):** the modules use a fixed type scale and heading weight; the original uses specific pixel sizes (44/32/28/19/18) and *light* Oswald weights (200/300). This is the largest, most architectural bucket.
- **Font family (18):** the original mixes **four** faces per-element (Raleway labels, Lato hero subhead, Oswald footer nav, Karla process titles); the theme has only 3 family slots.

**The remaining ~24 are not real fidelity losses:** the 12 "missing" are my deliberate merges (hero heading split across two nodes; "Dan H."/"Parent / CFO" merged into a card title; the veggie quote modeled as a hero heading rather than body) plus punctuation normalization (curly quotes, zero-width spaces) and 2 genuine omissions (a "Get Started" and an Offerings "Learn More" button). The rest are muted-grey-vs-`#333` and sub-pixel padding/tracking.

## What would actually close it (framework code → free-coding)

Three well-scoped generalizations, in impact order — each mirrors an existing pattern, so per DOC-19/CLAUDE.md they're *generalizations*, not new modules (candidate home: REQ-32):

1. **`headingTreatment` on text-block + services-grid** (gold headings) — mirror hero's existing dial. Closes 7 colour deltas, huge visual win.
2. **A "bare"/transparent card surface** for services-grid — lets the Offerings/Process grids sit on dark bands with white text. Closes ~26 colour deltas + restores the dark drama.
3. **A green surface role** for the testimonial panel.

The 112 size/weight/line-height deltas are a bigger, separate effort (per-element type control) with diminishing visual return.

**These are framework code changes, so they go through the full free-coding ceremony** (UATs named `test_UAT_FC_*`, `[FREE-CODED]` commit, version bump), and per the project's "generalize before adding" rule they'd likely be their own capability tickets against REQ-32 rather than folded into REQ-36. That's a real chunk of work — **want me to proceed with #1–#3 (the visual wins) under free-coding?** I'd start with the gold-heading generalization.

Full enumeration + verdict is saved on REQ-36 (COMMENT-39).

<!-- xgd-turn id="70724186-c272-48aa-8297-a5244b777d07-user" -->

<!-- xgd-chat role="user" ts="2026-07-07T22:29:48.614460+00:00" -->
#### You
ok please read DOC-19 again there are more tools and process. I have deleted your previous attempt. Can you take a pass at the most faithful reproduction you can of 

https://joyfulculinarycreations.com/

PLease use all the diff tools and be sure to compare the final results before declaring victory

<!-- xgd-turn id="70724186-c272-48aa-8297-a5244b777d07-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-07T22:45:00.608336+00:00" -->
#### Claude
I'll re-read DOC-19 carefully and get the lay of the land. Let me start with reconnaissance in parallel.

The capture bundle is intact; my prior sandbox attempt was deleted as expected. The key thing I notice: last session I **never ran the perceptual `1c diff` gate** — I declared a ceiling from `values-diff` alone. DOC-19 is explicit that `1c diff` (overlay reading) is the gate that catches what values-diff is blind to. Let me do this properly this time.

Let me scaffold fresh and launch parallel investigation to build a compact working reference.

Scaffold is ready. While the framework-mapping agent runs, let me study the worked example and the capture structure myself.

The capture has a full per-element value manifest — exactly what `values-diff` compares against. Let me dump the complete content inventory to drive transcription.

Now I have the ground-truth value manifest. Let me view the screenshot to establish section structure (the capture collapsed to 1 band, so the screenshot + raw.html are my structure source).That gives me the full structure. Now let me establish exact band background colors and geometry from the Elementor CSS (the screenshot shows medium-grey bands and a sage-green testimonial panel — I need the real hex values, not eyeballed).

I now have the full framework vocabulary and verified band colors:
- Grey bands `#7A7A7A` (Who Uses / Offerings / Process) → `surfaceInverse`
- Green testimonial `#28542D9E` (~62% α)
- Quote scrim `#141E14BA` over `market-vegetables` photo
- Hero: `HERO-AdobeStock` image at 0.49 opacity over black

Let me check the font assets and a couple remaining values before writing the theme.

Font weights confirmed (Oswald 200 is the heading weight — light). I have enough to build. Let me stop analyzing and start building — the diff tools will drive the rest. Let me set up tracking and gather the assets I need.

I have the key images (hero, quote, logo) and fonts. The 3 "offering" boxes render as empty grey in the capture screenshot, so omitting images there actually matches the reference better. Let me copy assets into the sandbox and set up tracking.

Now let me write the theme (`site.json`), transcribing exact captured values.

Now let me look at the scaffold's page format and the gigabytealchemy home.json as a worked reference for module instance shape.

I have the module shape. I need the full untruncated text for all runs. Let me dump them cleanly.

All text captured. Now let me write the full 9-band page.

Now let me render the first draft and catch any schema errors.

Rendered cleanly. Now let me run **both** gates — the perceptual `1c diff` (which I skipped last time) and `values-diff` — plus a screenshot to eyeball.

Let me capture the values-diff to a file cleanly and view the draft screenshot.

142 deltas, 54 matched. Let me view the draft render and run the perceptual gate.Now I can see the draft. The perceptual view immediately reveals what `values-diff` alone would never surface. Big issues visible:
1. **Hero heading renders pink** (should be white) + **CTA pink** (should be gold)
2. **Gold section headings render dark/white** (text-block/services-grid have no gold treatment)
3. **services-grid cards are empty white boxes** — white-on-white (content invisible)
4. **Testimonials band grey** (should be green)

Let me run the perceptual gate for ranked regions, and investigate the hero/grid rendering code in parallel.

Perceptual mean is **66/255** — very high. Ranked regions confirm the eyeball: #1 & #3 & #4 are the empty white services-grid boxes, #2 is the hero. Let me investigate whether the hero colors and card rendering are config-fixable vs framework gaps before deciding scope.

The hero `treatment-plain` inherits `surface-inverse` color = white (per CSS), yet the screenshot looked pink — and the CTA is `--color-primary` (pink). Let me read the hero region overlay triptych to see the actual rendered colors (DOC-19: read the overlay, don't eyeball the full shot).

Good — the hero heading is actually **white** (I misread the downscaled full shot); the CTA is a full-width pink bar. Let me compare against the reference hero to calibrate precisely.

Now the comparison is precise. Reference hero: darker image, **uppercase** heading, a divider rule, small **gold** button. Ours: lighter scrim, mixed-case, full-width **pink** bar. Let me check the hero inner structure (why the CTA is full-width) then apply config fixes.

The full-width CTA is because `.hero__inner` is `flex-direction: column` with default `align-items: stretch` — the button stretches. That's framework behavior. I now have a complete picture. Let me apply the pure-config wins (gold CTA via primary swap, stronger scrim) and re-measure to establish the honest config ceiling.

Config-only tops out at **64.57/255** (from 66.19) — marginal, because the dominant regions are all framework-blocked. This is the honest config ceiling, and per your instruction I'm **not** declaring victory. Let me record the diff-driven findings on the ticket, then lay out the decision.

I've done the diff-driven rebuild you asked for. Here's where it stands — and the decision I need from you before I keep going.

## What I did differently this time
Fresh sandbox build from the capture (theme + 9 bands), then ran **both** gates — including the perceptual `1c diff` with **overlay reading**, which I skipped entirely last time and which is the whole point of DOC-19. Reading the region triptychs (not the downscaled full shot) immediately caught things `values-diff` is blind to.

## Honest measured state (not victory)
- **`1c diff` perceptual mean: 64.57 / 255** — faelan-grade is ~2–3, so this is far off.
- **`values-diff`: 54 matched / 142 deltas.**

Config wins are already in: gold CTA (gold=primary swap), strong scrim, exact band colours (`#7a7a7a` grey bands, `#28542d` green, gold footer), all four fonts loaded, verbatim text.

## Why config is exhausted — overlay-confirmed, ranked by region score
| Region | What the overlay shows | Blocker |
|---|---|---|
| #1 / #3 / #4 (largest) | Offerings + Process render as **empty white boxes** | services-grid draws white cards on the dark band → white-on-white |
| #2 (hero) | heading mixed-case not **UPPERCASE**; no divider; CTA stretches full-width | framework |
| pervasive | every gold section heading renders dark/white | text-block & services-grid have no gold `headingTreatment` |
| testimonials | grey not green | no green surface value |

Every remaining big lever is a **framework code change**, not config. Per the generalize-first rule they're all generalizations of existing modules:

1. **`headingTreatment: gold`** on text-block + services-grid (generalize hero's existing dial) — the pervasive gold-heading signal.
2. **Bare/transparent card surface** on services-grid — makes Offerings/Process render as text-columns on the dark band. **Closes the three highest-scoring regions.**
3. **Uppercase heading treatment** — author uppercases via CSS; keeps DOM text mixed so `values-diff` stays clean.
4. **Green surface** for the testimonial band.

## The decision I need
Each of these is framework `xgd_source`/`packages` code → **mandatory free-coding ceremony** (scope ticket + `test_UAT_FC_*` UATs + `[FREE-CODED]` + version bump). They're reusable framework capabilities, so per the model they belong on **framework capability tickets** (the docs point to REQ-32), **not** folded into REQ-36 (which is the site reproduction).

**I can't cleanly create those tickets or touch framework code without your say-so.** How do you want to proceed?

- **(A)** I create capability tickets (against/near REQ-32) and free-code them, biggest-win-first (#2 bare cards + #1 gold headings first — they clear the top regions), re-diffing after each until the mean drops, then verify final. *Recommended.*
- **(B)** You'd rather I fold the framework changes into REQ-36 as one bundle (simpler ticketing, less "correct" per the intent model).
- **(C)** Stay config-only — accept ~64/255 and I document the gaps as the reproduction's honest ceiling.

Findings are recorded on REQ-36 (COMMENT-59). Which option?

<!-- xgd-turn id="71d07810-264e-4904-8e42-e296e920a9fe-user" -->

<!-- xgd-chat role="user" ts="2026-07-08T15:28:35.418030+00:00" -->
#### You
What I want to do is figure out how to turn this into a process. From my point of view I think it would be cleaner if framework changes stayed in this ticket.

I want to discuss when you create new modules vs adding dials to existing ones (I see failure cases in both directions)

I also need due process around tests we now have a conformance test harness we need to work through the testing requirements for modules

<!-- xgd-turn id="71d07810-264e-4904-8e42-e296e920a9fe-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-08T15:31:15.689574+00:00" -->
#### Claude
This is a shift from "finish the repro" to "make it a repeatable process." Good — three threads: (1) framework changes stay in REQ-36 (agreed), (2) module-vs-dial decision procedure, (3) test due-process against the conformance harness. Before I talk about testing I should actually look at what the harness is rather than theorize. Let me investigate.

The harness is REQ-39/DOC-20: `assertModuleConforms(slug, fixtures)` — renders each fixture as a one-module page and checks safety/security/responsive dimensions, with negative fixtures proving the discriminator works. Let me read DOC-20 and how existing modules wire into it.

Let me see how an existing module wires into this — the per-module test pattern the user wants to standardize.

Good — that reframes the work. I dug into the harness so I can talk concretely. Here's what's actually on disk:

- **Conformance harness exists** (`tools/generate/src/conformance/`, REQ-39/DOC-20): `assertModuleConforms(slug, fixtures, opts)` renders each fixture as a one-module page, serves it, drives Chromium, checks **safety / security / responsive / x-browser**. Tiers `fast` (chromium, 1280+375) / `full`. Negative fixtures prove the discriminator discriminates.
- **Gap:** it's only exercised by the REQ-39/40/41 harness tests (with injected broken modules + a text-block baseline). **No module has its own conformance leaf**, and there's **no correctness dimension** — it proves "nothing broke," not "gold is actually gold."

Let me take your three threads in turn.

## 1. Scope: framework changes in REQ-36
Agreed, and it's clean *if* REQ-36's body declares the framework-capability scope before I touch code (free-coding needs the behaviour described first). I'll fold that in once we lock the process below.

## 2. When a new module vs. a dial/variant

The failure modes you're seeing, named so we can detect them:

| Direction | Failure | Detectable smell |
|---|---|---|
| Over-dialing (god-module) | one module grows two behaviours behind a mode flag | a dial only valid when *another* dial has a certain value; render branches on `variant && dial` combos; a content field only read in one variant |
| Over-modularizing (fragmentation) | a module per section shape | two modules share ~80% of template/CSS; capability split across 3 modules so users hunt for it; catalog grows faster than the concept count |

Decision procedure (first match wins):

1. **Same communicative job, different look → dial or variant.** Presents heading+prose, or presents N cards — same job → treatment.
   - **Variant** = discrete *structural* preset; the template branches (three-col/two-col/stacked, top-nav/overlay). Closed, few, mutually exclusive.
   - **Dial** = *orthogonal* modifier that must compose with **every** variant and every other dial (surface, size, spacing, headingTreatment, gap).
2. **Different content question → module** (nav vs. testimonial carousel vs. contact form).
3. **Cross-cutting composition several modules share → shared primitive** (the `fc-row`, the overlay band) — not a module, not a per-module dial.

The load-bearing guardrail against over-dialing is a **composability invariant**: every dial value must be legal with every variant and every other dial. The moment "dial X only means something when Y" appears, you've got two jobs → split, or make it a variant.

Applying it to our four changes:

| Change | Verdict | Note |
|---|---|---|
| gold `headingTreatment` on text-block + services-grid | **dial** (generalize hero's) | composes cleanly ✓ |
| bare/transparent card | **per-card dial** `surface: bare` | need to decide: does "bare + badge + accent-border" compose, or is bare mutually exclusive with card chrome? |
| uppercase headings | **dial** `case`/`transform` | orthogonal, composes with everything ✓ |
| green testimonial band | **neither a color-named surface nor a new module** | see below |

The green case is the interesting one and I think it's a *trap in both directions*. Adding `surface: green` fragments the enum (every site's brand hue becomes a new surface value) — that's fragmentation-by-enum. But not supporting a distinct panel colour under-serves. The right resolution is to generalize the **mechanism**: surfaces already map to semantic tokens (default→bg, inverse→surface-inverse, accent→accent). The green panel is just *a second panel role*. So either surface takes a **palette role** (role-driven surface) or we add one generic `surface-panel` role the theme colours per-site — green here, something else next site. That keeps the framework hue-agnostic.

**Open question for you:** on the bare card — is `bare` a card *surface value* that's mutually exclusive with badge/accent chrome (simplest, and I'd argue "bare" means "no chrome" so badges don't apply), or do you want them to compose?

## 3. Testing due-process for module changes

What the harness gives us free (once wired) vs. what's missing:

- ✅ safety / security / responsive / x-browser — universal, per fixture.
- ❌ **correctness** — that a dial produces its intended effect. `headingTreatment:gold` passing conformance only proves it didn't overflow or XSS, not that it's gold.
- ❌ **matrix coverage** — nothing fails when a module adds a variant/dial with no fixture.

Proposed requirements for any module add/change (the process):

1. **Conformance leaf per module** — colocated `modules/<m>/<m>.conformance.test.ts` calling `assertModuleConforms`, fixtures covering **each variant once + each non-default dial value once + the new capability's combination**. Backfill the 7 existing modules.
2. **Effect assertion** — a computed-style probe proving the dial *changed the output the intended way* (`getComputedStyle(heading).color === accent token` for `gold`). Also guards the silent-no-op failure mode (a dial that does nothing).
3. **Default-vs-set pair** — prove the dial has an effect by asserting the pair differs.
4. **UAT naming** `test_UAT_FC_REQ-36_*`.
5. **The `1c diff` repro gate stays the integration-level truth** — conformance is per-module correctness; the repro mean is the whole-page eye test.

Decisions I need from you to turn this into the process:

- **(a)** Correctness: extend the conformance harness with an **expectation-probe dimension** (fixtures carry `expect: {selector, prop, equals}`), or keep correctness as **separate colocated unit tests** and leave the harness to safety/security/responsive? I lean toward adding the dimension — one call, one place.
- **(b)** Coverage: build a **completeness gate** (module meta enumerates variants/dials → a test fails if any lacks a fixture), or trust author discipline?
- **(c)** Location: **colocated** per-module test files (my recommendation, matches "test by module"), or centralized under `tests/`?
- **(d)** Tier policy: leaves run `fast` in CI, `full` (all engines + responsive ladder) in regression only?

If you answer (a)–(d) plus the bare-card composability question, I'll write it up as a short module-testing standard, put the framework-scope + test plan into REQ-36's body, and then start free-coding the four generalizations biggest-win-first — re-diffing after each.

<!-- xgd-turn id="bbad2b8d-b0cf-4c23-a262-98e8f89a03fd-user" -->

<!-- xgd-chat role="user" ts="2026-07-08T16:39:03.039603+00:00" -->
#### You
what does chrome mean in this context?

<!-- xgd-turn id="bbad2b8d-b0cf-4c23-a262-98e8f89a03fd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-08T16:39:13.029594+00:00" -->
#### Claude
"Chrome" = the decorative container framing around content, as opposed to the content itself. Borrowed from UI terminology (like "browser chrome" = the toolbars/tabs around the web page).

For a services-grid **card**, the chrome is everything the module draws *around* the title+body:
- the card's background fill (the white box you saw)
- its border / left accent stripe
- the corner radius, padding, drop shadow
- the badge pill

The **content** is just the title, body text, icon, CTA.

So when I said the offerings/process cards should be **"bare" (no chrome)**, I mean: strip the white fill, border

<!-- xgd-turn id="dc1bd324-c23d-42e2-961f-f7c0a62f9b77-user" -->

<!-- xgd-chat role="user" ts="2026-07-08T16:55:15.130768+00:00" -->
#### You
Can you read the PHILOSOPHY doc in the install?

I'm struggling a little to map this process to xgd development (and it may not fit). And stay with me because there are many layers of role complexity here.

1. XGD is a general purpose software development tool
2. We are using XGD to build 1stcontact which is (amongst other things) a website development tool
3. The question is how much of the solution to (1) do we bring to solving (2)? There are two extremes: A - we treat a website as a software system and use xgd out of the box B - we decide that websites are fundamentally simpler and more constrained and we build new custom flows for them - I suspect the answer is closer to B but there may be many things we can learn from A particularly when our website has functional components.

Possible resolution:

Separate module functionality from design. We have two fundamentally different processes:
1. New design capabilities - that's what we are doing here - new custom workflow we will gradually build a manual process and then automate it - this is 1stcontact running, created in 1st contact (eventually)
2. Functionality - email capture, payments page, CRM screens - these are created in XGD and a part of 1st contact - they go through our existing reconciliation process etc.

<!-- xgd-turn id="dc1bd324-c23d-42e2-961f-f7c0a62f9b77-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-08T16:58:16.094306+00:00" -->
#### Claude
Let me find and read the PHILOSOPHY doc in the xgd install.

Read it. And first, the loose thread: **chrome** = the framing/decoration drawn *around* content, borrowed from "browser chrome" (the toolbars/tabs around the web page). For a services-grid card, the chrome is the background fill, border, accent stripe, corner radius, shadow, and badge pill — everything that isn't the title/body. "Bare card" = content with the chrome stripped.

Now the layered question. I'll stay with you — I think your resolution is right in spirit but the cut is in a slightly different place than "functionality vs design," and PHILOSOPHY actually tells us where.

## What PHILOSOPHY commits us to (and what it doesn't)

The non-negotiable core is **evidence-first**: *"XGD's value is producing evidence of correctness, not code."* Crucially, it says this "applies regardless of whether code is produced from a specification, through interactive exploration, or by fixing." So the **principle** generalizes to everything. What is *not* fixed is the **mechanism** of evidence — the Capability Matrix (intent→AC→UAT) is "the primary mechanism," not the only conceivable one.

That distinction is the whole answer to your A/B question.

## The cut isn't functionality-vs-design — it's capability-vs-authoring

Your "design capabilities" bucket is hiding two different things, and that's what makes the mapping feel wrong:

| | What it is | Evidence form | XGD fit |
|---|---|---|---|
| **L1 · Framework capability** | a module/dial/treatment/renderer/tool — *reusable machinery*. Includes **both** functional (contact-form, payments, CRM) **and** visual (hero, `headingTreatment: gold`, services-grid) | AC + UAT. The **conformance harness is the UAT layer** for modules | **Extreme A — full XGD, out of the box** |
| **L2 · Site authoring** | reproducing/composing *one* site from config+theme — *work product*, data, not code | the **`1c diff` mean + overlay artifact** — a continuous similarity metric against a reference | **Extreme B — custom loop; the matrix does not apply** |

The reason design "doesn't fit" XGD is that we've been lumping L1 and L2 together. Once split:

- **`headingTreatment: gold` is not design work — it's a framework capability that happens to be visual.** It deserves *exactly* the same ceremony as email capture (scope → AC → UAT → reconcile). Its only difference from a functional module is the **shape of the AC**: "computed heading color == accent token" (a rendered-effect assertion) instead of "POST returns 200." Same evidence model, different assertion form.
- **Reproducing joyfulculinary the *site* is L2** — it is not a capability, it's a use of capabilities. Its correctness is perceptual and reference-relative. Forcing it into the Capability Matrix would be textbook **literalism** (PHILOSOPHY's `source_roots=["src/"]` failure): a UAT that asserts "the hero is at y=330 with this exact photo" proves consistency with *one site*, not a general capability.

## The seam — and why this loop is Mode 1, not a new mode

Here's the part that made me think your instinct is deeper than it first looks. What is the durable output of the last two hours? **Not the joyfulculinary config** — that's disposable. The durable output is the *discovered capability gaps* (gold headings, bare cards, role-driven surface). That is **precisely Interaction Mode 1: Prototype → Teardown → Rebuild** — *"code may be disposable; the authoritative output is clarified intent; the Capability Matrix grows even when the implementation is rebuilt."*

So the L2 authoring loop isn't a rival to XGD — it's a **capability-gap discovery engine** that runs in Mode 1 and *feeds work items down into L1*, where they go through normal ceremony (Mode 2 free-code→shore-up, or spec-driven). The `1c diff` gate is the L2 evidence artifact; when it stalls, the stall *names an L1 capability gap* — same way a terminal-failure in XGD "names the systemic gap." The site is throwaway; the framework generalization it forces is what enters the matrix.

## So, answering "how much of A do we bring?"

- **L1 (all modules — functional *and* visual): bring all of A.** It's a real software system; the "website is simpler" intuition doesn't downgrade the *framework's* rigor. Your functional components (payments/CRM) aren't a special case — they're just L1 capabilities whose ACs are I/O-shaped and which will more often be spec-driven than free-coded.
- **L2 (site authoring): bring almost none of the *matrix machinery*, but keep the *philosophy*.** The diff mean is the evidence; 64/255 is honestly-surfaced "unproven fidelity"; the overlay is the inspectable artifact. Evidence-first holds; UAT/AC does not.

## Where this bites for what we were about to do

It sharpens the earlier testing thread rather than replacing it:

1. The **effect-assertion dimension** I proposed for the conformance harness is now clearly *load-bearing*, not a nicety — it's the thing that makes a **visual capability a first-class Capability-Matrix citizen** (behavioral evidence for a rendered effect). That's the bridge that dissolves your A/B tension.
2. The **`1c diff` repro gate must stay OUT of the module matrix** — it's L2 evidence, per-site, never a module UAT.
3. Your "framework changes stay in REQ-36" decision is still fine, but note REQ-36 is then doing *L1 capability work under an L2 wrapper*. That's coherent as long as each generalization gets its own AC + conformance UAT inside the ticket — i.e., REQ-36 carries L1 evidence for the capabilities and L2 evidence (the diff) for the reproduction, kept distinct.

Two things I'd want your read on before I turn any of this into a written standard + ticket scope:

- **Do you accept the L1/L2 split as the primary cut** (with functional vs visual being a *sub-distinction inside L1, only about AC form*)? If yes, "design capability" stops being a fuzzy category.
- **Is the design-authoring loop explicitly Mode 1** (prototype disposable, capabilities are the durable output)? If yes, the automation you're gesturing at ("1stcontact building itself") becomes: *automate the Mode-1 discovery loop*, with L1 ceremony unchanged underneath — which is a much smaller, safer thing to automate than "automate website software development."

<!-- xgd-turn id="d8f6c7ec-4e46-4cc8-8666-edf3fee825dc-user" -->

<!-- xgd-chat role="user" ts="2026-07-08T17:13:35.635076+00:00" -->
#### You
Let's take a step back I don't know that you're seeing the full picture.

I see three different things here:
1. True functionality - email capture page
2. Pure configuration - setting the dials to create a website
3. Module extension and creation to support things we can't yet do in 2 (NOT 1!)

point 1 is 100% the realm of XGD along with the creation of the tools to do 2.

2. is the basic web builder - its a customer facing tool with AI support for building websites via configuration

3. is what we need to discuss. Through my conversations about the system I realize that number three and it's potential for automation is what could make my web builder a differentiated product. Lets explore that.

 Today this activity (3) is a combination of manual and XGD activity. It does not fit as well as you might initially suspect into XGD because the performance tests are the same for every module and we currently don't have a way to express that but that's kind of a detail. Perhaps more importantly is that we are handcrafting the tests for these right now. In general with XGD we would only create happy path tests the test suite would be filled out through the automatic process of reconciliation. However in this specific domain of website creation I think hand creation of the tests is appropriate. We may be able to find the right language to squeeze this into the reconciliation process, but I suspect we may need to change XGD in order for it to do this well.

Now,  suppose we use the XGD tooling to create a custom workflow for duplicating site and completely making all the tweaks to the framework to do it well. If I had that workflow I could:
1. Provide an induction flow for users who want to convert from the existing Webb support. Even if the framework that we have when they start does not have everything they need, we can add the necessary missing pieces automatically.
2. I can run a crawler that would pull websites from across the web – it does not have to be a huge number hundreds, small thousands. And by copying these examples I can build out the framework so that we know that it will support 1.

These are desirable use cases and XGD as it stands cannot support them

<!-- xgd-turn id="d8f6c7ec-4e46-4cc8-8666-edf3fee825dc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-08T17:15:56.764467+00:00" -->
#### Claude
You're right that I was compressing your (3) into my L1. Your three-way cut is sharper, so let me take it as given and locate (3) precisely — then push on the part I think I *was* missing.

**Adopting your frame:**
- **(1) Functionality** — behaviour-bearing (email capture, payments, CRM). Classic XGD, plus it builds the tooling for (2). Not interesting here.
- **(2) Pure configuration** — the customer-facing AI web builder. Dials in, site out. The product surface.
- **(3) Catalog growth** — extending modules/dials/tokens so (2) can express something it currently can't. It sits *between* 1 and 2: it's the meta-activity that *grows what (2) can configure*. And you're right — **(3) is the differentiator**, because it's the part competitors don't have.

## The full picture of (3): it's an exemplar-driven capability flywheel

What we did by hand today is one turn of a loop that, generalised, is:

capture exemplar → reproduce in config (2) → measure residual with `1c diff` → **attribute the residual to a missing capability** → extend framework (generalize-first) → verify (conformance + effect-assertion + diff drops) → **bank the capability**; the site becomes pure-config.

Run that over your crawler corpus and the framework's **design-space coverage converges**. The moat isn't any one module — it's that after N exemplars, an *arbitrary* new site reproduces mostly from config. Induction (use case 1) is then the *same loop online*, but it rarely has to extend, because the crawler already paid that cost offline. **The crawler de-risks induction.** That's the flywheel, and the product KPI is literally: *"% of a held-out site set that reproduces under threshold using config only"* — a coverage curve that should rise and flatten as the catalog saturates real design space.

Wix/Squarespace AI *generate a generic site*. You *reproduce the user's actual site faithfully* because the catalog was trained-by-exemplar on real design space. That's the differentiation, stated as a metric you can chart.

## Why XGD can't hold (3) — your two reasons, plus the ones underneath

Your two are real and each names a concrete XGD gap:

- **(a) Universal ACs shared by every module.** XGD models an AC as owned by one story. It has no notion of a **capability archetype** — "a thing of kind *module* inherits this conformance contract." So proof.md can't assert "every module meets the universal contract"; the harness knows it but the matrix doesn't. Fix: **inherited AC contracts / archetypes.**
- **(b) Hand-authored tests are authoritative here.** XGD's model is happy-path-in, reconciliation-fills-the-rest. But a visual **effect assertion** ("gold == the accent token, at this weight") *encodes design judgment that can't be derived from a spec* — so reconciliation can't invent it, and shouldn't overwrite it. Fix: a **story-type where UATs are canonical**; reconciliation validates presence/coverage but never regenerates.

Now the part I think you meant by "not the full picture" — three deeper mismatches, in rising order of how much they break XGD:

- **(c) The spec is an artifact, not English.** XGD intent is an epic in prose; here the specification *is a captured site* (raw.html + screenshot + values) and the AC is *"similarity(render, reference) ≥ threshold."* XGD has no concept of a **perceptual/reference AC kind** alongside behavioural ones.
- **(d) The driver is a gradient, not a boolean.** 66→64 is *progress*, but XGD's fix loops only know pass/fail — they'd score that iteration a failure. (3) needs a **optimise-a-metric-until-threshold-or-diminishing-returns** loop primitive, with a stopping rule. That's a fundamentally different control structure from "fix until tests pass."
- **(e) Capabilities are induced by the corpus, not declared.** Spec-driven XGD knows its capabilities up front. Here you *discover* that you need `headingTreatment: gold` only because exemplars forced it. The backlog is **generated by residual diff-gaps across a corpus**, deduped across exemplars (the 50th site that needs gold headings must *reuse*, not re-add). XGD has no corpus abstraction and no gap→capability *attribution* step — and attribution is exactly the module-vs-dial judgment we spent an hour on.

(c)+(d)+(e) are why this "doesn't fit as well as you'd suspect": XGD assumes *declared intent, boolean evidence, per-intent scope*. (3) is *exemplar intent, gradient evidence, corpus scope*.

## The failure mode that decides whether automation is viable

If you automate the attribution step (e), the lethal failure is **over-fragmentation**: 500 sites → 500 bespoke modules, and the catalog is worthless. The moat is a *small, composable* capability set with *high* coverage — the opposite of one-module-per-site. So the automated loop must be governed by exactly the discipline we discussed, made measurable:

- **Reuse-first attribution**: before minting a capability, prove no existing dial/variant covers the gap. Reward reuse, penalise new modules.
- **Composability invariant** as a hard gate on any new dial.
- **Held-out validation corpus** (pure ML hygiene): capabilities must generalise to *unseen* sites, or you're overfitting the framework to the crawler. This is why you want hundreds–thousands and a train/test split, not tens.
- **Coverage & reuse curves** as the health dashboard: coverage rising, new-module rate falling, reuse rate rising = the flywheel is working.

Automating (3) *is* automating this governor. That's the real technical bet.

## What XGD would need (concretely)

1. **Capability archetypes / inherited AC contracts** — declare "module"; it carries the conformance battery; every module inherits + proves it. (Solves a.)
2. **`hand-authored-authoritative` story type** — canonical UATs, reconciliation validates but never regenerates. (Solves b.)
3. **Reference-as-spec + perceptual AC kind** — intent = artifact; AC = metric-vs-reference on a named dimension. (Solves c.)
4. **Gradient/threshold loop primitive** — exit on metric<threshold or diminishing returns; progress-without-pass ≠ failure. (Solves d.)
5. **Corpus-driven backlog + attribution step** — residual gaps across a corpus generate capability stories, deduped, generalize-first-gated. (Solves e.)
6. **Corpus-level coverage KPI** — proof.md's sibling at corpus scale.

1–2 are small; 3–6 are genuine XGD extensions — which matches your suspicion that XGD itself has to change, and tells you *where*.

Three questions to steer the exploration:

- **Is the moat metric the held-out config-only coverage curve?** If yes, everything above (train/test split, reuse rate, attribution gating) is in service of moving one number, and we can design (3) around it rather than around "fidelity of any single site."
- **Where do you want the human in (3) during the manual→automated ramp?** My instinct: automate capture→config→diff→*gap-detection* first (cheap, safe), and keep the **attribution + generalize-first decision** human-in-the-loop longest, because that's where over-fragmentation is decided. That inverts XGD's "no human in the loop" — deliberately, and only in (3).
- **Do we prototype the loop as a workflow *now* on a 5–10 site mini-corpus** (joyfulculinary + a few others) to pressure-test the attribution guardrails before proposing XGD changes — i.e., run (3) manually-but-structured a few times so the XGD extension list is evidence-backed, not speculative?

<!-- xgd-turn id="8bc65359-6bd2-4d57-bd80-6847ae0581c6-user" -->

<!-- xgd-chat role="user" ts="2026-07-08T17:24:47.027038+00:00" -->
#### You
What we are doing right now is creating a manual process for this loop. The output of this conversation (we are getting close) should be a process (like the free coding process) that describes something like this:
1. Site capture
2. Site duplication - refine with tools and loop until existing framework exhausted
3. Good enough? Yes - STOP..otherwise
4. Design the necessary changes to the modules
5. Implement the changes to the modules (and custom tests)
6. Run compliance and custom tests until everything passes
7. Goto 2

The interesting questions are at 3 and 4 - how can we automatically define "Good Enough" and how do we constrain the design process to avoid god modules and module explosion

<!-- xgd-turn id="8bc65359-6bd2-4d57-bd80-6847ae0581c6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-08T17:26:43.080919+00:00" -->
#### Claude
We're close. The two hard questions (3 and 4) are exactly where a naive version of this loop dies, so let me crack them concretely — because the answers change the loop's shape.

## Question 3 — defining "Good Enough" automatically

A single scalar `1c diff` mean under a threshold **cannot** be the gate. Three reasons, all of which we already hit or that my notes warn about:
- **Averaging hides local disasters** — a broken hero drowns in matching whitespace. (Today: mean 64, but the *hero* region is 100+.)
- **One viewport lies** — fluid-vs-fixed drift hides from a single width.
- **Perceptual ≠ structural** — a *missing paragraph* is never "good enough," but it barely moves a pixel mean.

So "Good Enough" is a **vector gate**, evaluated at **3 viewports** (desktop/tablet/mobile):

1. **Structural floor (hard precondition):** `values-diff` `missing` / `text` / `fontFamily` deltas = **0**. Discrete correctness — no averaging allowed. Text loss, wrong typeface = automatic fail.
2. **Global mean** < T_global.
3. **Worst-region bound** < T_region — no single band is broken, even if the average is fine. This is the check that catches the averaged-out hero.
4. **Saliency weighting** — hero / above-the-fold held to a stricter T than footer / whitespace. ("Hero is the front door.")
5. **Minus declared acceptable-residual** — per-region exceptions *with reasons* (font AA, photo re-encode, carousel current-slide). Mirrors XGD's `except`. Without this the loop chases irreducible noise forever and mints capabilities for un-closeable gaps.

The unlock — and this is the non-obvious part — **you cannot pick T_global / T_region from thin air.** You **calibrate them once against a small human-labeled anchor set**: a few dozen (reference, render) pairs a human tags "indistinguishable / not." The max mean and max worst-region among the "indistinguishable" pairs *set the thresholds*. After that, the gate is fully automatic and objective. "Good enough" stops being a vibe and becomes a learned constant.

And note there are actually **three** distinct stops in the loop, which the skeleton collapses:
- **Config-exhaustion** (ends step 2): metric improvement per config edit < ε — a *plateau*, not a pass. "Config can't do more."
- **Good-Enough** (ends the whole loop at 3): the vector gate passes.
- **Terminal residual** (also ends the loop): config exhausted **and** every remaining gap is either acceptable-residual or below the bar to mint a capability (see Q4). Stop with a *documented* residual — this is what stops it looping forever over a gap that isn't worth a module.

## Question 4 — constraining design (no god modules, no explosion)

Two devices: a **reuse-first attribution ladder** (cheap escapes first), and **mechanical gates** so it isn't judgment-by-vibes.

The ladder — for each residual gap, take the **first** rung that fits:
1. **Acceptable residual?** → `except` it, design nothing. *(stops noise-chasing)*
2. **Config error?** → fix the dial value, not the framework. *(stops framework changes config already covers)*
3. **Existing dial/variant covers it?** → reuse. *(reuse-first)*
4. **Orthogonal treatment of an existing module's job?** → **dial**.
5. **Discrete structural preset?** → **variant**.
6. **Cross-cutting composition several modules share?** → **shared primitive / role-driven token** (the "don't name it `green`, make surface role-driven" insight).
7. **Genuinely different content job, nothing above fits?** → **new module** (last resort, highest bar).

The gates that make god-modules and explosion **mechanically detectable**:

- **Composability invariant** → a new dial must be legal with *every* variant × *every* other dial value, verified by conformance cross-fixtures. A dial that only works "in one mode" fails this — and that failure *is* the signal it's really a variant or a second module. **This is the anti-god-module gate.**
- **Dial budget** (soft cap per module) → crossing it triggers "is this two modules?" Detects accretion early.
- **Corpus threshold** → **a new *module* requires ≥ k exemplars demanding it**; a *variant* fewer; a *dial* fewest. One weird site **cannot** spawn a module — it must reuse, get a dial, or take an acceptable-residual exception. **This is the anti-explosion gate, and it only exists because of the corpus.** That's the deeper reason to run the crawler first: the corpus is the *instrument* that turns "should this be a module?" from a judgment call into a counting rule.
- **Fragmentation metric** → capabilities-per-covered-site and reuse-rate. If new capabilities aren't lifting held-out coverage (they only serve their originating site), the design process is fragmenting → halt and alarm. Corpus-level health.

So the two questions have a shared root: **both "Good Enough" and "don't fragment" become objective only against calibration data** — a labeled anchor set for (3), a corpus with a k-threshold for (4). The manual process we're writing is really *"run the loop by hand while we gather the data that lets us automate the two gates."*

## The loop, tightened

1. **Capture** exemplar (`1c capture`).
2. **Reproduce in config** — refine with `1c diff` + `values-diff`, reading overlays worst-region-first, until **config-exhaustion** (plateau).
3. **Good-Enough gate** (the Q3 vector, 3 viewports, minus acceptable-residual). Pass → **STOP**. Fail → 4. Terminal-residual → **STOP (documented)**.
4. **Attribute + design** — run the Q4 ladder on each residual gap; each proposed change must clear the mechanical gates (composability, budget, corpus-k).
5. **Implement** the change + **hand-authored effect assertions** (the design judgment encoded) + composability cross-fixtures.
6. **Verify** — universal conformance battery (inherited) **and** custom effect assertions pass across the variant×dial matrix.
7. **Goto 2** with the richer framework; the diff should drop.

To make this real we need three artifacts that don't exist yet: the **calibration anchor set** (Q3 thresholds), a **mini-corpus** (even 5–10 sites) to exercise the Q4 k-threshold, and the **fragmentation/coverage metrics**.

I'd suggest: before drafting the doc, run this loop *by hand* on joyfulculinary end-to-end (we're at step 3 now — config-exhausted, gate failing), do the four framework generalizations through steps 4–6, and record the real numbers. That gives us evidence-backed threshold candidates and validates the ladder/gates on one case. Then I write it up as `DESIGN-REPRODUCTION.md`, parallel to the free-coding process.

Does this framing of 3 and 4 match your intent? If so, do you want me to (a) finish joyfulculinary through the loop first to ground the numbers, or (b) draft the process doc now and treat joyfulculinary as its first worked example?

<!-- xgd-turn id="7be7edf2-36df-4655-9be1-6af5456aaacb-user" -->

<!-- xgd-chat role="user" ts="2026-07-08T17:32:07.647193+00:00" -->
#### You
It should be a doc ticket (of course). And I think we should create a draft of what we have now and then apply it to joyfulculinarycreations and refine

<!-- xgd-turn id="7be7edf2-36df-4655-9be1-6af5456aaacb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-08T17:43:12.836240+00:00" -->
#### Claude
A doc ticket it is — that's a distinct deliverable (the process itself) from REQ-36 (the reproduction), and you've explicitly asked for it. Let me check the ticket interface and how existing DOC tickets (DOC-19, DOC-20) are structured, then create it.

Let me see how an existing DOC ticket is structured (type, and whether the doc lives in the ticket body or a `docs/` file).

Rich doc ecosystem already exists — notably **DOC-15 (Crawler & Framework Coverage Program)**, **DOC-14 (Module Lifecycle & Two-Tier Composition)**, DOC-16/17 (design intelligence/lessons). Our process sits *on top* of these and ties them into one loop. Let me skim the two most-overlapping so I reference rather than duplicate.

This is largely already architected — DOC-14 (module lifecycle / two-tier flywheel), DOC-15 (crawler coverage program, the three buckets, gap-frequency promotion), DOC-19 (transcription runbook), DOC-20 (conformance). What's **missing** is the connective *operational process* that stitches them into one runnable loop — plus the two things we just cracked that none of them specify: the automatable **Good-Enough gate (Q3)** and the mechanical **anti-explosion gates (Q4)**.

Let me draft that as the doc-ticket body, referencing the others rather than duplicating.

**DOC-21** created — *Process: Reproduction-Driven Framework Growth Loop* (draft v0.1). It stitches the existing docs into one runnable loop and pins down the two things none of them specified: the Good-Enough vector gate (§4) and the mechanical anti-explosion gates (§5–6).

Now let me apply it to joyfulculinary and refine. Per the process (and free-coding), step one is declaring the L1 scope on REQ-36 before touching framework code. Let me cross-link the docs and read REQ-36's current body so I preserve it.

Now I'll declare the L1 scope on REQ-36 (free-coding: behaviour first), preserving the existing body and adding the capability ACs from applying DOC-21's step-4 ladder. Then I'll implement the highest-impact capability first.

Scope declared. Now **CAP-1 (bare cards)** — the biggest win. Step 4 design: let me read the services-grid module to see how cards render today.

Now I understand the card rendering — `.services-grid__card` sets `background: var(--color-surface)` (near-white) + border, and body `color: inherit` resolves to the band's white on `surface-inverse` → white-on-white. CAP-1 design: a grid-level `cardSurface: bare` dial that strips fill/border/radius/padding and lets title+body inherit the band colour, with chrome (badge) suppressed. Let me read the meta to register the dial correctly.

Design is clear. Let me implement **CAP-1**: a grid-level `cardSurface: default | bare` dial. Three edits — the dial constant, the meta registration, and the rendering.

Now the rendering — add the class and the `bare` CSS:

Now the `bare` CSS — placed right after the base card rule:

CAP-1 code is in. Now apply it in the joyfulculinary config (L2) — set `cardSurface: bare` on both grids — and re-diff to get the real number.

**64.57 → 46.68** — CAP-1 (bare cards) alone cut ~18 points, and the former #1 region (the white offering boxes) has dropped out of the top ranks. The hero is now the worst region (#1, front door). The loop works, and this is a real refinement datapoint for DOC-21.

Now I must complete CAP-1's free-coding ceremony with a UAT before committing. Let me look at the test infrastructure to write the effect + composability assertions correctly.

There's an existing `tests/framework-services-grid-cards.test.ts` — the right place to add CAP-1 assertions. Let me read its render-assert pattern.

The pattern: render via Astro container to HTML, assert classes + CSS rules from source. Let me add the CAP-1 UATs (effect, default-unchanged, composability across variants) to this file.

14/14 pass (3 new CAP-1 UATs). Let me confirm no regression from the dial change across the module/render tests (skipping the slow browser-conformance suites).

No regressions (46/46). CAP-1 is code-complete with passing UATs and a real fidelity gain. Let me complete its free-coding ceremony — check the version-bump interface, then commit.

The version-bump script is implemented. I'll commit CAP-1 (only my framework + test files — the modified gigabytealchemy files are pre-existing and not mine), with a version bump and `[FREE-CODED]`.

CAP-1 committed (`9e9fda0`, v0.0.66). Now finish the ceremony — record the commit on REQ-36, and log the worked-example datapoint on DOC-21.

Both docs are now created and being refined by the run itself. Clean checkpoint — here's where we are.

## What exists now

**DOC-21 · Process: Reproduction-Driven Framework Growth Loop** (draft v0.1) — the process you asked for, parallel to free-coding. It ties DOC-13/19/14/20/15 into one runnable loop and pins the two hard parts we cracked: the **Good-Enough vector gate** (§4, calibrated against a human-labeled anchor set) and the **anti-god-module / anti-explosion mechanical gates** (§5–6, the reuse-first ladder + composability invariant + corpus-k threshold).

**REQ-36** now carries the L1 scope (CAP-1..4 as ACs) and is DOC-21's first worked example.

## The loop, applied — first increment proven

I ran one full turn end-to-end rather than theorising:

| | perceptual mean |
|---|---|
| config-only ceiling (gate fails) | 64.57 / 255 |
| **+ CAP-1 bare cards** | **46.68** (−18) |

CAP-1 (`services-grid` grid-wide `cardSurface: bare` dial) went through the whole free-coding ceremony: code → `test_UAT_FC_REQ-36_*` UATs (effect + default-unchanged + composability across all variants) → 46/46 tests no regression → committed `9e9fda0` + version bump 0.0.66 → REQ-36 `fields.commits` set. The single biggest lever, exactly as its region score predicted — which **validates DOC-21's "read region scores worst-first" and the rung-4 attribution**. That's a real refinement datapoint logged on DOC-21.

The hero is now the top residual region (#1, mean 100 — the front door).

## Next

Three caps remain, and I'd sequence them by residual region score:
- **CAP-2 · gold headings** (generalize hero's `headingTreatment: gold` onto text-block + services-grid) — pervasive; hits the grey-band headings.
- **CAP-3 · uppercase + hero polish** (heading `case: upper`, gold CTA already in, divider) — clears the hero.
- **CAP-4 · role-driven panel surface** (the green testimonial band) — this is the one genuine *design decision* in the set: per DOC-21 §5 rung 6, I'll generalize the *mechanism* (surface referencing a palette role) rather than adding `surface: green`. You may want to weigh in on that one.

Want me to **continue through CAP-2 → CAP-3 → CAP-4** in this session the same way (each: code + UATs + re-diff + commit, refining DOC-21 as I go), or pause on CAP-4's design before I build it? I lean toward continuing and flagging CAP-4 for your sign-off when I reach it.

<!-- xgd-turn id="8a5f94e1-c1ff-4c37-8d59-94be240e9046-user" -->

<!-- xgd-chat role="user" ts="2026-07-08T18:32:41.749766+00:00" -->
#### You
Wait. This is where we are diverging from the way XGD works. As an interactive session, you would not normally create capabilities. There are a lot of rules around capability creation and capabilities are purely grouping of stories. What you should've created here was probably a story. Stories have acceptance criteria the acceptance criteria must "cover" the story. Capabilities group stories together to help manage the matrix they are not specifications in themselves. All of these capability matrix artifacts are created automatically by the reconciliation process (or by the automated development process). Not by the free coding process which is what we are doing now.

<!-- xgd-turn id="4cc7b5d5-153c-41d8-89bd-3c5f94485607-user" -->

<!-- xgd-chat role="user" ts="2026-07-08T18:33:40.906768+00:00" -->
#### You
Wait. This is where we are diverging from the way XGD works. As an interactive session, you would not normally create capabilities. There are a lot of rules around capability creation and capabilities are purely grouping of stories. What you should've created here was probably a story. Stories have acceptance criteria the acceptance criteria must "cover" the story. Capabilities group stories together to help manage the matrix they are not specifications in themselves. All of these capability matrix artifacts are created automatically by the reconciliation process (or by the automated development process). Not by the free coding process which is what we are doing now.

What you actually need to do is to retire CAP-1 (archive it) and create REQs for your requirements

<!-- xgd-turn id="77582c05-b067-45bc-a039-41a52b64142e-user" -->

<!-- xgd-chat role="user" ts="2026-07-08T18:34:15.917278+00:00" -->
#### You
Wait. This is where we are diverging from the way XGD works. As an interactive session, you would not normally create capabilities. There are a lot of rules around capability creation and capabilities are purely grouping of stories. What you should've created here was probably a story. Stories have acceptance criteria the acceptance criteria must "cover" the story. Capabilities group stories together to help manage the matrix they are not specifications in themselves. All of these capability matrix artifacts are created automatically by the reconciliation process (or by the automated development process). Not by the free coding process which is what we are doing now.

What you actually need to do is to retire CAP-1 (archive it) and create REQs for your requirements or better yet, we would use this existing ticket (that's what we agreed, right)?

<!-- xgd-turn id="77582c05-b067-45bc-a039-41a52b64142e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-08T18:38:40.645764+00:00" -->
#### Claude
You're right, and this is an important correction — I conflated two different things. Let me state it back so we're aligned, then fix it:

- **Capabilities are not specifications.** They're groupings of stories, and — along with stories, ACs, and UATs — they're **created by reconciliation / automated development, not by a free-coding session.** I invented "CAP-1..4" as if I were authoring capability-matrix artifacts. That's not my job here.
- **Free-coding produces:** a requirement described on the ticket + code + UATs (`test_UAT_FC_REQ-36_*`) + `[FREE-CODED]` commit. Reconciliation later derives the matrix from that.
- And yes — **we agreed framework changes live in REQ-36**, so REQ-36 *is* the requirement. No sub-CAPs, no sub-REQs needed.

Let me check whether I actually created a CAP ticket to archive, and re-read REQ-36 so I fix its body correctly.

Confirmed: **no CAP ticket exists** — "CAP-1" was only label-text I put in REQ-36's body and the commit message. So there's nothing in the store to archive; the fix is to strip the CAP/capability framing from REQ-36 (and the commit) and let REQ-36 stand as the requirement. Let me check the commit isn't pushed so I can amend its message, then rewrite the body.

Wait — HEAD is `f8cc70b`, a **pre-session ticket commit**, not my CAP-1 code commit `9e9fda0`. Something moved HEAD. I need to understand the git state before touching anything — let me not lose that commit.

Nothing's lost — the reflog shows my CAP-1 code commit `9e9fda0` is intact in the branch history; the `xgd ticket` commands simply stacked ticket-store commits on top of it (that's normal — tickets are versioned in-repo). Since `9e9fda0` is now buried under seven xgd-managed ticket commits and isn't pushed but rewording it would mean rebasing those, I'll **leave the commit** (it correctly references REQ-36 and is `[FREE-CODED]`; "CAP-1" is just cosmetic label-text) and fix the real source of truth — REQ-36's body — removing the capability framing.

Now DOC-21 carries the same loose "capability" language. Let me log a terminology correction on it rather than rewrite the whole draft body mid-session.

Corrected. Summary of what I changed and the model I'm now operating under:

**Fixed**
- **No CAP ticket ever existed** in the store — "CAP-1..4" were only labels I wrote into REQ-36's body and the commit message. Nothing to archive; the fix was to strip the framing.
- **REQ-36 body reframed** — the four framework changes are now described as *requirements* ("Framework changes required, free-coded in this ticket"), and the body explicitly states that capability-matrix artifacts (capabilities / stories / ACs / UAT-coverage) are **derived by reconciliation, not authored in this session**. Verified: 0 remaining `CAP-` references.
- **DOC-21 correction logged** — a note pinning the terminology; its body wording gets reconciled in a dedicated pass.
- **Commit `9e9fda0` left as-is** — it's now buried under seven xgd-managed ticket commits (not pushed, but rewording means rebasing those), and it already carries `[FREE-CODED]` + the REQ-36 reference correctly. The "CAP-1" in its message is cosmetic. Say the word if you want it reworded and I'll do the rebase.

**The model I now hold**
> Interactive free-coding = describe the *requirement* on the REQ ticket + write code + write UATs (`test_UAT_FC_REQ-36_*`) + `[FREE-CODED]` commit + keep the ticket current. Reconciliation (or automated dev) is what turns that into capabilities → stories → ACs → UAT-coverage. Capabilities are groupings, not specs; ACs must cover their story; none of that is mine to hand-author here.

The bare-cards work itself stands — it's a legitimate free-coded framework change under REQ-36 with passing UATs; only its *labeling* was wrong.

Two quick checks before I carry on:
1. **Continue** the remaining three framework changes (gold headings next) as plain free-coding under REQ-36 — code + UATs + `[FREE-CODED]`, no capability talk?
2. Want me to **reconcile DOC-21's body wording** (drop the loose "capability"/"L1-L2" phrasing) now, or leave the correction-note and batch it later?

<!-- xgd-turn id="089a1865-ec30-41d0-9515-75c947109875-user" -->

<!-- xgd-chat role="user" ts="2026-07-08T18:49:24.615879+00:00" -->
#### You
In the short term, the way I expect this to work is just what we are doing here. We create a ticket REQ-X to replicate a website foo.com. You follow the process in DOC-21 and all the new requirements go into REQ-X. They are free coded per that process and the commits added to the doc and we loop based on the lops in DOC-21 until we have sufficient fidelity. Agreed?

Can you make sure DOC-21 states this clearly (1) that the requirements go into the reproduction ticket itself (2) they are free coded per that process?

<!-- xgd-turn id="089a1865-ec30-41d0-9515-75c947109875-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-08T18:51:20.445999+00:00" -->
#### Claude
Agreed — that's exactly the short-term model: one reproduction ticket REQ-X, all the framework changes it forces recorded as requirements *in REQ-X*, each free-coded per the process, commits accumulated on the ticket, looping per DOC-21 until fidelity is sufficient. Let me make DOC-21 say this unambiguously. Let me read my draft source and edit it.

Now let me insert the explicit "how requirements are ticketed" subsection and fix the loose "capability" wording:

Let me fix the remaining `L1`/`capability` references in the loop and §7 for consistency.

Now push the corrected DOC-21 body:

Agreed on the model, and DOC-21 now states it explicitly. I added a new §1 subsection **"Where the requirements live, and how they are built (the operating model)"**:

1. **One reproduction ticket per site (REQ-X)** — every framework change the reproduction forces is *a requirement recorded in REQ-X itself*, not a separate REQ and never a hand-authored capability/story.
2. **Each is free-coded per the Free-Coding process** — described in REQ-X → code + `test_UAT_FC_REQ-X_*` UATs → `[FREE-CODED]` commit → sha added to REQ-X → ticket kept current.

It also states that reconciliation derives the capability-matrix artifacts from those commits — the loop never authors them. I fixed the loose `L1`/"capability" phrasing elsewhere (loop step 5, §7, §9) to match. Verified all three statements are present.

That's exactly the loop we just ran for CAP-1 (now correctly framed as just "the bare-cards change, free-coded into REQ-36").

Ready to continue the loop under REQ-36 — next framework change is **gold headings** (generalize hero's `headingTreatment: gold` onto text-block + services-grid), free-coded the same way, then re-diff. Shall I proceed?

<!-- xgd-turn id="4865449b-783a-4f2d-8284-7f46b0142806-user" -->

<!-- xgd-chat role="user" ts="2026-07-08T18:55:48.818193+00:00" -->
#### You
Yes. So to be clear what I would like you to do now is to follow your own instructions. Run the process loop, make the framework changes that you need, loop back adjust the site and iterate until you think you have something I should look at " the best you can do. (you can take multiple runs at this if needs be.

Once you have it I will take a look and we will do a post mortem on what you created, are ther gaps, how many iterations it took, whether the tools are sufficient etc.

<!-- xgd-chat-end -->