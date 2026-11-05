---
uid: bug-7bff70ed
id: BUG-267
type: bug
title: 'First drafts: logos sized by their file not their visible artwork, the starter
  page''s 160px padding survives the build, and ''text on a dark panel'' covers the
  whole photo'
created_by: EPIC-19
created_at: '2026-10-24T02:58:17.018400+00:00'
updated_at: '2026-10-24T16:22:22.192626+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  story_points: 5
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-5c2cb4be
  commits:
  - working_sha: 5ae364259fb172d2618a7d1c2c6674c5c53a9bcc
    reconcile_sha: null
    main_sha: null
  - working_sha: 724120a71526ec2e5a44d795a92fb8c86e1cd02e
    reconcile_sha: null
    main_sha: null
  version: 0.2.615
---

## Symptom (Dina's Diner first draft, 2026-10-24)

The operator: "a remarkably disappointing first draft".
- **The logo is ridiculously small, again.** It was too small on an earlier site
  as well.
- **A weird gap** between the header and the first section.
- **An ugly panel** carrying the headline.

## Causes (all three general, not specific to this site)

### (a) The logo is sized by its file, not by what you see
- `header-logo` is `height fixed 56px` at every width, which is the builder
  priming's number exactly: "Start the logo at about 56px tall on desktop and 40px
  on a phone".
- The asset is a **square 1254×1254 PNG**, and the lettering fills only the middle
  ~60% of its height. The rest is transparent margin. So the **visible mark is
  about 33px tall**.
- The header has no text name to make up for it (the name is only the image's
  `alt`).
- The layout check's `brand.logoMinPx` (48 desktop, 36 phone) passed, because
  `layout-check.ts` (~364) measures the `<img>` box, not the painted artwork. The
  critic did not flag it either.

### (b) The starter page's padding survives the build
- `home.json`'s root still has `padding {top: 160, bottom: 160}` from
  `placeholderDocument()` (`tools/generate/src/cli/scaffold.ts` ~259), the grey
  "coming soon" page. The real sections render inside it, which gives the ~170px
  empty band.
- A fix pass misread it as a background colour problem, and the hero-only fix
  brief was scoped so it could not touch the page root.

### (c) "Put text on a solid or strongly darkened panel" became a slab
- The first brief said "if text sits on the hero photo, put it on a solid or
  strongly darkened panel". The builder laid `hero-overlay` over the **entire
  700px photo**, filled `text-dark` at `opacity: 0.85`. So 85% of the photo is
  near-black.
- Because `opacity` is set on the box, it also fades the box's children: the red
  "Get directions" button came out washed-out pink.

## Fix

1. **Logos are judged and sized by their visible artwork.**
   - When a logo or mark is placed, its transparent margins don't count. Either
     place a trimmed version (the Library keeps the original), or use the
     artwork's opaque bounds, which the describer can record once per image.
   - The layout check's `brand` rule measures the **visible** logo height, not the
     image box.
   - The priming's starting size is raised, and stated as the visible mark: big
     enough to be the header's dominant element. Settle the numbers in the child
     session against real headers; roughly 72–96px visible on desktop and 48–56px
     on a phone. The thresholds in `layout-check.json` rise to match.
   - The critic's rubric names "the logo and name read at a glance" under style.
2. **No starter scaffolding survives a build.** When a page gets its first real
   sections, the placeholder root's padding, alignment and centring are replaced
   by the page's real values. This is done in the code path that assembles pages,
   not by asking the builder. A check reports any served page whose root still
   carries the placeholder's padding. Fix Dina's home page as part of this.
3. **Text over a photo leaves the photo visible.**
   - The default is REQ-440's thin contrasting outline. Where a scrim is needed,
     it is local to the text (behind the headline block, or a gradient from the
     text's edge), not a cover over the whole photo. A full-cover scrim stays
     light enough that the photo is still the picture.
   - A scrim's darkness is its fill colour's alpha (a typed alpha on the fill, if
     L1 has none), never `opacity` on a box that holds buttons or text, because
     that fades them.
   - The priming line "put it on a solid or strongly darkened panel" is replaced.
   - A layout check reports an image whose visible area is mostly covered (for
     example more than half) by a near-opaque layer, and any button whose fill is
     faded by an ancestor's `opacity`.

## Test plan

`tests/test_UAT_FC_BUG-267_first_draft_header_and_hero.*`:

- A square logo with ~40% transparent margin, placed in a header: its visible
  height meets the new desktop and phone floors. The brand check measures visible
  ink: the same image at 56px box height is reported.
- A page built from the placeholder: its root has none of the placeholder's
  padding afterwards. The new check reports a page that still has it.
- A text block over a photo: with the defaults, at least ~60% of the photo's
  pixels are uncovered, and a child button's computed colour is its palette fill
  (not faded). The cover check reports a full-photo near-opaque overlay.
- Re-run the REQ-429 layout-check, REQ-440 outline (if landed), REQ-427 critic and
  scaffold UATs.

## What landed (2026-10-24)

### (a) Logos by their visible artwork
- **A picture placed on a site loses its transparent margins.** `promoteToSiteAsset`
  (`apps/control-app/src/material.ts`) runs the placed bytes through
  `trimTransparentEdges` (`tools/generate/src/cli/png.ts`): a PNG with alpha is
  cropped to its artwork (pixels at alpha ≥ 8). Nothing visible is removed. The
  Library keeps the file as uploaded. A PNG with no margin, a non-PNG, or one the
  codec cannot read (16-bit, interlaced, corrupt, over 16 MP) is placed as it came.
  So the box the builder sizes is the artwork.
- **The layout check measures the drawn artwork, not the image box.** The in-page
  `H.artwork(img)` reads the picture's own pixels (on a canvas, downscaled to
  256px) for its opaque bounds, and maps them through `object-fit` and
  `object-position`. A picture the page may not read falls back to its box. The
  `brand` check (`small_logo`) and the `business` check (logo vs. heading) both
  use it. When the box is larger than the artwork, the finding says so and gives
  the box needed: "has its logo only 34px tall as drawn (its picture box is 56px
  tall; the rest is transparent margin round the artwork) … a picture box of about
  …".
- **The numbers.** The floors (`brand.logoMinPx`) rise from 48/36 to **64 desktop /
  44 phone**. The builder priming now says to make the logo the header's dominant
  element, starting at **about 80px tall on desktop and 52px on a phone, measured
  on the logo you can see rather than its picture box**.
- **The critic.** Its style lens reads "brand presence (the logo and name read at a
  glance)".

### (b) No starter scaffolding survives a build
- `clearStarterFrame` (`tools/generate/src/cli/scaffold.ts`) runs on every
  whole-page write, in `planPageWrite` (`tools/generate/src/store/sections.ts`),
  the planner every store adapter writes through. Once the page's root holds
  anything other than the starter's line, each of the starter root's values that
  is still exactly the starter's (`PLACEHOLDER_ROOT`: padding 160/24/160/24,
  `align: center`, `distribution: center`) is removed. That leaves the page's own
  defaults. A value someone has since changed is kept. Section-scoped writes cannot
  add a first section, so every first build passes through it.
- A new layout check, `starter_frame` (`starter_padding`), reports a page whose
  root still has the starter's padding round real content. The padding and the
  starter's words come from `scaffold.ts`, not a copy in `layout-check.json`. The
  untouched starter page itself is not reported.

### (c) Text over a photo leaves the photo visible
- **The builder priming's text-over-picture paragraph is extended.** The outline
  stays the default. Where text needs more than an outline, darken only behind it:
  a scrim the size of the text block, or a gradient from the text's edge, never a
  layer over the whole picture. A scrim's darkness is its fill colour's `alpha` (a
  palette colour with an `alpha`), never `opacity` on its box, because opacity fades
  the buttons and text inside. L1 already had a typed alpha (`{ref, alpha}` and
  `#rrggbbaa`), so no schema change was needed.
- **Two new layout checks.**
  - `cover` (`covered_picture`): a picture of at least 40,000 px², sampled on an
    8×8 grid. It is reported when more than half its points lie under layers that
    together hide at least 60% of it (a fill, or a gradient's average stop, each at
    its opacity).
  - `faded` (`faded_control`): a button inside boxes whose opacities multiply to
    under 0.95.
- **"Put it on a solid or strongly darkened panel" was never in the repo's
  priming.** The consultant wrote it in its own brief. What replaces it is the
  builder-priming rule above, which the checks enforce.

### Design decisions
- **Trim at placement, not opaque bounds recorded by the describer.**
  Placement is one choke point (`place_on_site`, the Library's "Use on site", the
  chat drop), and it already writes a render rather than the original. Trimming
  there makes the builder's number mean the visible size directly. The describer
  route would have left every builder to do arithmetic. The check still measures
  pixels, so SVGs, other formats and logos placed before this fix are judged by
  what is drawn.
- **Supersedes BUG-238's starting sizes.** The BUG-238 UATs that pinned "about 56px
  / 40px" and a 56px "correct" logo now pin 80px / 52px. The 28px-logo and
  per-width-threshold UATs are unchanged.

### Not done here: Dina's live home page
The fix lands on Dina's home page on its next whole-page write (any section
added, removed or moved, or a page-style change). The new `starter_padding`
finding names it the next time the host checks the page. The live data was not
edited directly from this session. The logo already on Dina's site predates
trimming: re-placing it from the Library trims it, and the check now reports it
by its visible height.

## Test plan (as landed)
- `tests/test_UAT_FC_BUG-267_first_draft_header_and_hero.test.ts` (real
  Chromium):
  - A square logo with 40% transparent margin at a 56px box is reported, by its
    visible height, at every width.
  - The trimmed logo is its artwork (240×180). At the primed desktop size it clears
    every floor. At the primed phone size it clears the phone floor only. The
    untrimmed file in the same box is reported.
  - Adding the first real section through `editL1Set` over a site store clears
    every `PLACEHOLDER_ROOT` key.
  - A built page still carrying the padding is reported. The starter page itself,
    and a clean page, are not.
  - A local, fill-alpha scrim with an outlined headline: no cover or faded finding,
    at least 60% of the photo uncovered, and the button paints its own red at
    opacity 1.
  - Dina's slab (whole photo, `#111827` at opacity 0.85, holding the button) is
    reported as 100% covered and as a faded button.
  - The builder priming (both variants) and the critic priming carry the new
    rules.
- `tests/test_UAT_FC_BUG-267_a_placed_logo_is_its_artwork.workers.test.ts`:
  placement through `promoteToSiteAsset` trims the margins. The Library's
  attachment keeps the original's sha256. A margin-less PNG is placed
  byte-identical.
- Re-run and green: BUG-238 (updated), REQ-429, REQ-415 (node and workers),
  REQ-422 ×2, REQ-440, REQ-427 critic, BUG-215, the scaffold suites, REQ-396
  section storage, REQ-295, REQ-418, REQ-228, and the promotion suites (BUG-44,
  BUG-47, BUG-126, BUG-84, REQ-246, REQ-163). REQ-208's "never learns which
  vendor" fails identically on clean xgd-working (pre-existing).