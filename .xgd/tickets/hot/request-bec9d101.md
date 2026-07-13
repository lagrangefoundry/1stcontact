---
uid: request-bec9d101
id: REQ-52
type: request
title: 'gigabytealchemy.ai: re-import with object-grouped fidelity tooling'
created_by: xgd
created_at: '2026-07-11T00:41:50.707205+00:00'
updated_at: '2026-07-13T22:06:43.687388+00:00'
completed_at: '2026-07-13T22:06:43.687388+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: cf0ab084be0794586677a46b87bc906b1f358969
    reconcile_sha: null
    main_sha: null
  - working_sha: 3cd464e762d0a1ff41d1fd6e6ee21ef1b5b55bf4
    reconcile_sha: null
    main_sha: null
  - working_sha: 4b0282b44e0dc93a69a54130b3eef7b3e403f95e
    reconcile_sha: null
    main_sha: null
  version: 0.0.96
  bundled_in: bundle-d9c2e655
---

## Goal

Re-run the gigabytealchemy.ai reproduction **from scratch** with the fidelity
tooling that has landed since the original REQ-20 import, and measure whether a
faithful reproduction is now reached **more straightforwardly** — fewer eyeball
passes, fewer misdiagnoses, more of the work driven mechanically off the diff.

This is a fresh worked example of the reproduction loop in [[DOC-21]], driven by
the transcription methodology in [[DOC-19]]. The original import (REQ-20) predates
the object-grouped tooling and was closed at perceptual mean ~16.0 with a long
tail of hand-found deltas; the question here is how much of that tail the new
tools collapse.

## New tooling to exercise (the "new tools")

- **Object-grouped inspection / comparison** ([[REQ-51]]) — `1c values-diff` now
  reports **by object** (text run, image, control, divider), each with the exact
  params (`fontFamily · fontSizePx · fontWeight · color · letterSpacingPx ·
  lineHeightPx · box`) ref-vs-ours side by side, plus an `⚠ UNPAIRED` section.
  The `expected` column is a paste-able transcription target.
- **Spec speaks the diff's field names/units, literals allowed** ([[REQ-50]]) — a
  delta row drops straight into the object's spec field.
- **Severity-ranked structural diff** ([[REQ-47]]) — presence/structure/position
  ranked above tone; pixel area is never the importance signal.
- **Perceptual gate** ([[REQ-38]]) `1c diff` — region triptychs + band profile for
  the art-directed / geometry residual the value-diff can't encode.
- **Hero front-door dials** ([[REQ-49]]) — `contentWidth`, `contentOffsetTop`,
  `subheadWeight`, finer `subheadLeading`, horizontal inset — for exact hero
  reproduction.

## Method (per DOC-19 §"object-by-object" 2026-07-10 update)

1. **Re-capture** `1c capture page https://gigabytealchemy.ai/` (the on-disk
   bundle must be current with the latest projection schema — re-capture, don't
   trust a stale one).
2. **Object-by-object transcription** — read the object-grouped inspection; for
   each object create the corresponding spec object, pasting the `expected`
   column. Intrinsic axes (text, color, fontFamily, fontSizePx, fontWeight,
   letterSpacingPx) must go ✓ on iteration 1 — a ✗ there is a transcription
   error, not a fidelity gap.
3. **Gate on the overlay** — `1c diff`, read the per-region `-diff` overlays at
   full resolution; drive the mean down worst-region-first. Hero is the front
   door — reproduce it exactly; tolerate sub-visual band-stack drift.
4. **Attribution ladder** (DOC-21 §5) for each residual gap: acceptable-residual
   → config-fix → reuse dial → dial → variant → shared primitive → new module
   (last resort). Generalize before adding.

## Two edit regimes (DOC-21)

- **Site authoring (config/theme)** — reproducing this site. Exempt from
  free-coding ceremony (site data, not framework code). This is expected to be
  the bulk of the work.
- **Framework changes** — any capability gap the reproduction forces. Full
  free-coding ceremony (scope described in THIS ticket, `test_UAT_FC_<this-id>_*`,
  `[FREE-CODED]`, version bump, sha added to `fields.commits`). Capability-matrix
  artifacts are derived later by reconciliation — this loop does not author them.

## Starting state

- Prior site def was moved to `storage/sandbox/gigabytealchemy` and the
  `storage/sites/gigabytealchemy` tree is currently deleted in the working tree
  (see git status). Treat this as a clean re-build, not an edit of the old def —
  the whole point is to see how straightforward a from-scratch pass is now.
- Reference bundle: `storage/references/gigabytealchemy.ai/index/` (re-capture
  first per method step 1).

## Acceptance

- Object-grouped `values-diff` clean on intrinsic axes for every paired object
  (any residual ✗ is emergent `box` geometry or an explained/accepted delta).
- `⚠ UNPAIRED` empty (no missing/extra objects), or each entry explained.
- `1c diff` mean driven to at least parity with the original import (~16.0),
  hero band reproduced exactly per REQ-49 dials.
- **Process finding recorded** (the real deliverable): how many passes / how much
  eyeballing vs. mechanical transcription this took relative to REQ-20 — numbers,
  not adjectives — appended here and distilled into DOC-19/DOC-21 as warranted.

## Related

[[DOC-19]] (runbook), [[DOC-21]] (growth-loop process), [[REQ-20]] (original
import), [[REQ-47]]/[[REQ-48]]/[[REQ-50]]/[[REQ-51]] (fidelity tooling),
[[REQ-38]] (perceptual gate), [[REQ-49]] (hero dials).


## Dial-only pass (2026-07-11) — outcome + framework gaps found

Config-only pass on `storage/sites/gigabytealchemy/draft/pages/home.json`
(site data, free-coding-exempt). Goal: fix every diff error that has a dial;
stop at the framework wall. Verified each change with `1c diff`.

**Landed (dial win):** hero `contentOffsetTop: sm` — pushes the fold content
down toward the reference anchor. Perceptual mean **17.59 → 17.40**; hero region
**63.5 → 54.3**; height stays exact (4376). Confirmed `contentWidth: xnarrow` is
correct for the hero subhead (narrow/readable both regressed); `contentColumn:
left` helped the hero region locally (53.0) but raised overall mean — kept
`center`.

**Errors that turned out NOT to be dial-addressable (framework gaps):**
1. **text-block prose left-pin + width** (A Different Approach r8≈50, The Alchemy
   r9/r11) — the *dominant* residual. `contentWidth` is gated `:not(.panel-none)`
   and our prose is `panel:none`, so width is locked to the `variant-prose` base
   `narrow` (640px); `.text-block__inner` has `margin-inline:auto` so any
   sub-full-width column is *centered*. Proven inert: `default`/`wide` renders
   were byte-identical to `xnarrow`. Ref is left-pinned at the 80px gutter, ~900px
   wide. **Fix:** port hero's `contentColumn`/`contentInset` (left-pin) to
   text-block, and make `contentWidth` apply to panel-none blocks. Generalize
   hero's capability onto text-block — do not add a module.
2. **services-grid card padding** (What We're Building r1/r2≈42, Our Mission
   r4≈43) — card body runs too wide + badges clip. `padding` is hardcoded
   `var(--space-6)`; only `card-surface-bare` alters it (to 0). **Fix:** add a
   `cardPad` dial.
3. **hero fold anchor granularity** — `contentOffsetTop` steps are coarse
   (none/sm/md = 0/64/128px); the true offset is ~40px, between none and sm. sm
   is the closest available. **Fix (optional):** finer offset steps.
4. **overlay header wordmark vertical** (r7≈80) — sits high; `spacingTop` is
   inert on `variant:overlay` (proven). **Fix:** overlay vertical-offset dial.
5. **card fill warmth** — `--color-surface` (#ece4d6) ≈ page bg; ref stacked
   cards read near-white but three-col cards read warm-tan, so a single global
   token can't match both. Needs per-card fill (dial) or a treatment, not a
   global theme edit.

Current mean **17.40**; further progress requires the framework changes above
(chiefly #1 text-block left-pin and #2 services-grid cardPad).


### Correction (2026-07-11, same pass)

The claim above that "`contentWidth: xnarrow` is correct for the hero subhead" was
**wrong** — a mean-driven error. Cropping hero-vs-ref by eye shows the ref subhead
wraps wide (3 lines: "…to elevate—not just engage. Tools that help you" / "access
your wisdom…yourself and" / "others."), which **`readable` (768) matches exactly**;
`xnarrow` (448) wraps to 4 narrow lines and is visibly off. The mean *preferred*
xnarrow (17.40 vs readable 17.53) only because widening the text moves it over
different pixels of the busy hero background — the aggregate-mean-over-photos
blindspot. **Final hero: `contentWidth: readable` + `contentOffsetTop: sm`**, chosen
on the overlay, not the mean.

Still-visible hero gaps requiring framework work: the overlay wordmark sits too
high (no vertical-offset dial; `spacingTop` inert on `variant:overlay`). Lesson
logged: for repro, trust the per-region overlay/eye over the aggregate mean,
especially over art-directed backgrounds.


## Framework change (2026-07-12) — full positional control of hero-segment objects

**Scope (free-coding, this ticket).** Generalize the `layer` primitive's
free-positioning coordinate model onto the *named* objects of the hero segment,
so the operator can place each object (the overlaid header **wordmark** plus the
hero's **eyebrow / heading / subhead / cta**) at an explicit coordinate within
the shared band — closing gap #4 (overlay wordmark vertical, `spacingTop` inert)
and giving true art-direction of the front door. No new module: an optional
`position` (the existing `positionSchema`: `x`/`y` as band percentages, `z`/`w`/
`rotate`) is honoured on each hero styled run and the header wordmark run.

**Behaviour.**
- A styled run with no `position` renders in normal flow exactly as before
  (zero regression for every existing site/slot).
- A hero run *with* a `position` is lifted into a `.hero__stack` (absolute,
  `inset:0`, mirrors `.fc-layer__stack`) and placed by framework-computed
  `--fc-*` custom properties (reuses `positionVars` from `layer.ts`) — never
  instance CSS (DOC-7 §6.2 line held).
- The overlay header chrome becomes full-band (`inset:0`) and
  `pointer-events:none` (interactive descendants re-enable), so a positioned
  wordmark shares the hero's coordinate space; the header bar still renders at
  the top for every existing overlay site (no visual change).

**Files:** `packages/site-schema/src/schema.ts` (position on `textRunSchema`),
`packages/framework/src/modules/text-style.ts` (`TextRun.position`),
`packages/framework/src/modules/layer.ts` (export `positionVars`),
`packages/framework/src/modules/hero/index.astro`,
`packages/framework/src/modules/header/index.astro`,
`packages/framework/src/modules/overlay.ts`.

**UAT:** `test_UAT_FC_REQ-52_*` — positioned hero run emits `--fc-*` and absolute
placement; un-positioned run unchanged; positioned wordmark placed in full-band
chrome. Then the gigabytealchemy hero is re-authored to place wordmark/eyebrow/
heading/subhead and driven down on the `1c diff` overlay.


## Framework change landed (2026-07-12) — outcome

Commit `cf0ab08` (v0.0.94, `[FREE-CODED]`). Full test suite green (538/538);
7 new UATs in `tests/req52-hero-positioning.test.ts`.

**Capability delivered.** Any styled run (overlay wordmark + hero eyebrow/
heading/subhead/cta) may carry an optional `position` (the existing
`positionSchema` — `x`/`y`/`w` band-%, `z`/`rotate`). The framework compiles it
to `--fc-*` via the reused `positionVars`; no `position` → normal flow (no
regression). Positioned hero slots lift into an absolute `.hero__stack`
(`inset:0`, mirrors `.fc-layer__stack`); a positioned wordmark lifts out of the
flow row, and the overlay chrome is now full-band + pointer-transparent so the
wordmark shares the hero's coordinate space. **No new module** — closes gap #4
(overlay wordmark vertical) and supersedes gap #3 (coarse `contentOffsetTop`)
for the hero with exact placement. A subtle bug found + fixed: the resolved run
style has no trailing `;`, which fused the first `--fc-*` onto the last
declaration (the UAT now asserts the separator).

**Hero reproduction (site authoring, exempt).** Placed wordmark `{x:6.9,y:10}`,
eyebrow `{x:6.25,y:41}`, heading `{x:6.25,y:48.5}`, subhead `{x:6.25,y:56.25,
w:60}` (band 1280×800). Driven on the `1c diff` overlay worst-region-first:
- wordmark region 79.7 mean → dropped out of the top-12 entirely (matches ref);
- eyebrow region cleared; heading+subhead region 66.2 → 47.9 (residual is
  glyph-level font-over-photo jitter, not position — per the overlay).
- **Perceptual mean 17.53 → 16.67**; hero front door reproduced exactly.

Process note: the whole text block was a *uniform* ~15px downward drift
(`contentOffsetTop: sm` = 64px overshooting the true ~44px) — visible only as a
clean vertical ghost on the region overlay, invisible in the aggregate mean.
Confirms the runbook rule: gate on the per-region overlay, not the mean, over
art-directed photo backgrounds.


## Framework + tooling change (2026-07-12, session 2) — two fixes

Driven by the "A Different Approach" / "The Alchemy" full-width residual (gap #1
above). Two distinct defects, both under this ticket.

### Fix 1 — text-block prose default matches services-grid geometry (framework)

**Problem.** A panel-none `variant:prose` block hard-capped its inner column at
`--container-narrow` (640px) and `margin-inline:auto` *centered* it → the weirdly
narrow, off-centre text panel. Because the inner column was capped narrow, the
`contentWidth` child-cap dial (`.content-width-* .text-block__inner > *`) was
inert on panel-none blocks (default/wide rendered byte-identical to narrow — the
inertness recorded in gap #1).

**Fix.** `variant-prose` inner column base `--container-narrow -> --container-default`
(text-block/index.astro L101). Now a default prose block reproduces the
services-grid geometry ("What We're Building" / Harbor Café): full container
width, `margin-inline:auto` (= left-pinned at the 80px gutter at desktop). The
child-cap `contentWidth` dial is no longer inert — an author may still opt into
`xnarrow/narrow/readable/wide` (left-flowing within the container band). Single
line; no legacy mode.

### Fix 2 — values-diff can no longer hide a reference with no box geometry (tooling)

**Problem (the deeper one).** The gigabytealchemy reference bundle is STALE —
`capturedAt 2026-07-03`, captured *before* REQ-47 added per-element geometry
(`extract.ts:450 box: absBox(el)`). Every text run therefore has NO `box`. The
value-diff rendered the box row `— -> (x,y…) OK`: when the reference lacks a box,
no position/size delta is generated, so `buildObjectCard` marked it matched. The
tool **could not distinguish "positions match" from "reference has no position
data"** — both showed OK. That blind spot let the entire hero/dial pass run
against a stale bundle unnoticed, and is why the ADA width defect never appeared
in the value-diff (only the pixel overlay caught it).

**Fix.** `buildObjectCard` (values-diff.ts) now flags the `box` param as a
mismatch when geometry is present on exactly one side (ref-missing xor
repro-missing). `formatReport` (fidelity.ts) prints a loud `WARN STALE REFERENCE`
summary counting reference objects with no box — actionable ("re-capture the
bundle; position/width is NOT being verified for them").

### Follow-up (data, needs network) — re-capture the bundle

Fix 2 makes the staleness visible but does not repair it. The gigabytealchemy.ai
reference must be re-captured (`1c capture page`) so text-run geometry is
populated and position/width is actually verified. Requires network to the live
site — flagged, not done in this session.

**UAT:** `test_UAT_FC_REQ-52_*` — (a) panel-none prose inner column is
container-default not container-narrow; (b) contentWidth child-cap dial is live
on a panel-none block; (c) diffManifests flags box when the reference object has
no geometry but the repro does.


## Session-2 outcome (2026-07-12) — landed

Commit `3cd464e` (v0.0.95, `[FREE-CODED]`). Full suite 542/542 (+4 UATs).

**Fix 1 (framework) — done, verified on overlay.** `variant-prose` inner column
base `container-narrow -> container-default` (single line, text-block L105). A
panel-none prose block now reproduces services-grid geometry. The ADA body
overlay confirms it: was a ~560px 4-line centred column; now full container
width (~1104px), 2 lines, left-pinned at the gutter — a pixel match to the
reference text flow. The `contentWidth` child-cap dial is no longer inert on
panel-none blocks (UAT-covered).

**Fix 2 (tooling) — done, live.** `buildObjectCard` flags box on one-sided
geometry; `formatReport` prints `⚠ STALE REFERENCE`. On the current bundle it now
reports `54 reference object(s) carry no box geometry` — the blind spot is closed.

**Site (exempt).** Dropped the now-live stale `contentWidth:xnarrow` from the
`different-approach` and `the-alchemy` prose blocks. `mission-callout` left at
xnarrow (not user-scoped).

**Root cause of the whole thread.** The reference bundle is STALE (`capturedAt
2026-07-03`, pre-REQ-47), so it carries NO text-run geometry. Every hero/dial
pass this ticket ran against it, and the value-diff silently passed the missing
boxes — which is why the ADA width defect never appeared mechanically.

**Blocked next step (needs network) — re-capture.** With ADA/Alchemy corrected to
full-width, page height is **4361 vs reference 4376 — 15px short**. The
wrong-width narrow ADA had been coincidentally padding those 15px; correcting it
exposes a genuine ~15px shortfall elsewhere, and a 15px vertical shift smears
every text band below (perceptual mean 16.6 -> 29.5 — an alignment artifact, not a
per-block regression; per-region overlay shows ADA itself is now correct).
Pinpointing the shortfall requires real per-object geometry, i.e. re-capturing
`1c capture page https://gigabytealchemy.ai/`. Deliberately NOT chased blind
against the stale bundle (the runbook anti-pattern). Re-capture is the gating
next action for the reproduction.


## Section-spacing pass + lineHeight finding (2026-07-12, session 2 cont.)

### Section shrinkage (config, exempt) — fixed

The width fix collapsed the panel-none prose sections: they sized to their
now-shorter 2-line text and lost the reference's section whitespace. Reference
section boxes (which ARE captured — only text runs lack geometry) gave the
targets: ADA 487px, The Alchemy 549px, around ~220–300px of content.

Set `spacingTop=xl` (96px) / `spacingBottom=2xl` (128px) on `different-approach`
and `the-alchemy` (commit `27d0627`). Calibrated on the pixel overlay: 2xl/2xl
matched the total height but ghosted the heading ~40px low (top-heavy); xl/2xl
brought the heading to within ~8px of the reference.

**Result:** perceptual mean **29.5 → 17.6** (≈ the 16.7 baseline; better than the
dial-pass's 17.4). ADA and The Alchemy **dropped out of the top-12 diff regions**
— they were the #1 residual. The residual now concentrates in the services-grid
`What We're Building` cards and the footer.

Process note: the "sections were exactly the right height before" was a
coincidence — the *wrong* narrow width wrapped the body into 4 lines, and those
extra ~2 lines stood in for the absent section padding. Fixing the width exposed
the real missing vertical rhythm. Token granularity (32px steps) can't express
the reference's exact top/bottom asymmetry (~88 top / ~177 bottom); nailing it
needs finer control or the re-capture's text-run boxes.

### lineHeight 20→13 drift — it IS a framework default (services-grid)

Confirmed the user's hunch. The drifting elements are all services-grid, not the
prose sections:
- **Badges** ("In development", "Coming soon"): `services-grid__badge` uses
  `font-size-xs` (12px) + `line-height-tight` → renders 12/13; reference is
  **14/20**. Framework token choice (services-grid/index.astro:282-284).
- **Checklist items** (✓ rows): `line-height-relaxed` renders **28** where the
  reference is **24** — ours too loose (line 313).

Small (±2px font, ±4–7px leading) and mixed-direction, but this is now the
top-ranked residual (the WWB services-grid region). Open question before a
framework change: bake new defaults into `services-grid` (affects every site) vs
add a badge font-size / leading dial (site-specific). Not changed yet —
needs the config-vs-capability call. Framework change → full free-coding ceremony.


## Update 2026-07-12 — colour capture bug fixed (oklch)

Re-capture (per Method step 1) surfaced two things: geometry is now captured
(per-run boxes 0/55 → 55/55), but **colour was still wrong** — 44/55 runs
`colorInferred` with a `#000000` fallback.

**Root cause (code bug, not a transcription gap):** the capture colour resolver
(`extract.ts` `rgbToHex`) parsed only `rgb()/rgba()`. gigabytealchemy.ai is a
**Tailwind v4 site emitting `oklch()`** (85 usages), so every computed text/border
colour failed to parse → inferred `#000000`. The values-diff then suppressed
colour (inferred = low-confidence), hiding a real body-colour gap.

**Fix** (commit `4b0282b`, [FREE-CODED]): resolve colours format-agnostically by
painting onto a 1×1 canvas and reading the pixel (handles oklch/lab/lch/color());
preserve `transparent → inferred`; fall back to the rgb() regex under jsdom.
UATs `test_UAT_FC_REQ-52_*` drive real Chromium against an oklch fixture.

**Result:** `colorInferred` 44 → 0; `"Most apps"` body resolves to `#314158`
(dark slate, not black); values-diff 107 → 151 deltas with 43 colour deltas now
visible. Our home.json still authors `#000000` for that body → now a drivable delta.

**Residual gaps found (mostly NOT document-authorable — future code/dial work):**
- Body/heading colour: doc `#000000` vs real `#314158` etc — now drivable (transcription).
- Text-box width: `"Most apps"` 1120 vs 896 (= `max-w-4xl`/56rem) — no `contentWidth` step hits 896; needs a new width step.
- Badge / checklist / italic-tagline typography (font-size, leading): CSS-locked, no per-run style hook.
- Contact-form structure: label-outside vs placeholder-inside; field arrangement below vs beside.