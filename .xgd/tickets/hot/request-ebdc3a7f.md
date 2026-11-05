---
uid: request-ebdc3a7f
id: REQ-449
type: request
title: 'Judge pages against the design system: laws-of-craft layout checks (heading
  proximity, section vs block gaps, grid edges as a hold, matching rows, focal crops,
  off-system share) and a critic that reviews against the site''s design and re-runs
  after big revisions (DOC-67 part 3)'
created_by: EPIC-19
created_at: '2026-10-24T19:38:12.640527+00:00'
updated_at: '2026-10-24T23:30:49.305846+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 10
  blocked_by:
  - request-6b5389b6
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-3339e038
  commits:
  - working_sha: 41750c765471ff71431d4f51209a2bbd10de5679
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: c6029f3a519352d134eab501b0084530fbbb7333
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 588c2cfff074d54b0a196c5d222cced68a1c3151
    reconcile_sha: null
    main_sha: null
  - working_sha: 27899aae9c1d34b85a96c6b0eba7cae27831be35
    reconcile_sha: null
    main_sha: null
  version: 0.2.626
---

## Why

Implements **DOC-67** §7: pages are judged against the site's own design system,
by measurement where possible and by the critic otherwise. Builds on **REQ-447**
(the object and off-system reporting). It works best with **REQ-448** (a design the
principal wrote), but a migrated design is enough to start.

On Dina's site nothing measured what was wrong (spacing scale, section widths,
crops, column heights), and the critic was told those were "checked elsewhere"
(BUG-271).

## Status of this ticket

Everything below has landed. "Crops keep their subject" landed last, once REQ-448
gave pictures a focal point (recorded on the material by the describer).

## What changes

### 1. Laws of craft in the layout check (REQ-429 framework)

Named checks, with thresholds in `layout-check.json`, each relative to the site's
design rather than to a fixed taste. The site's design and the page's stored L1
reach the checker at both places it runs (the host's look after a build, and the
builder's page map). The design is handed to the page by a separate script before
the check runs, so the check script itself stays one constant for every site.

- **Heading proximity:** a heading's gap to its own text is smaller than its gap
  to the block above, measured on the ink. This is the existing `heading` check
  (REQ-429 / BUG-238 / BUG-256), which already reports a heading whose space below
  is near or above its space above. Reused, not duplicated.
- **Section vs block gaps (`gaps`, kind `block_gap`):** on a site with a design,
  the smallest gap between two of a page's sections must exceed the largest gap
  between blocks inside any section (by more than `marginPx`), measured between
  what is drawn (the letters' ink, a picture's or a drawn box's edges). Sections
  drawn as bands (a fill, border or shadow) are set off by their own edge and are
  not measured as a gap. When the design names `sectionGap` / `blockGap`, the
  finding names those steps and their px. A page on a site with no design is not
  judged by this law.
- **On the grid (`edges`):** with a design that has a content measure, each
  section's content edges are within `tolerancePx` of its `contentWidth` or
  `wideWidth` measure (each no wider than the screen less a gutter on each side,
  centred), or bleed to the screen's edges. A drawn box is judged by its own
  edges, an undrawn one by its content's. Without a design, the old rule stays:
  edges that differ from the edges most sections share. `edges` is a fault like
  every other layout finding: it holds the hand-back (BUG-256's round limits apply).
- **Rows that should match (`rows`, kinds `row_tops`, `row_heights`):** items side
  by side in a row (each at least `minItemPx` tall and `minItemWidthPx` wide, not
  in a table or a nav) start within `topTolerancePx` of each other, with text
  measured by its line boxes. A picture beside a text panel (text in a drawn box)
  matches the panel's height within `heightTolerancePx` or `heightShare` of the
  taller, whichever is larger.
- **Crops keep their subject (`crop`, kind `cropped_subject`):** a picture
  cropped to its box (`object-fit: cover`, or `none`) is reported when its focal
  point falls outside the part shown, or within `edgeShare` of the frame on a side
  where more of the picture is hidden (so a better crop exists). The focal point of
  a placement is the image node's own `objectPosition` when it sets one (REQ-448: a
  node may override its material for one placement), otherwise the focal point the
  describer recorded on its material. The host reads the materials' focal points
  from the library, by the file name each took on this site, for every layout
  check it runs (the look after a build and the builders' page maps). A host with
  no library checks without them. The finding gives the objectPosition that frames
  the subject.
- **Off-system share (`off_system`):** a section with at least `minValues` styled
  values, more than `maxShare` of them typed in off the design (REQ-447's
  census), is reported, naming the axes. The other half of the census is new in
  `site-schema` (`l1OnSystemValues`: every role, space step, width, component,
  aspect and palette-referenced colour a node names). It is read from the stored
  page, not the browser, so it is reported at the first width only, not three times.

Each is reported where builders and the consultant see layout faults, and holds
the hand-back like the others.

### 2. The critic judges against the design

- The critic's informed review (its second turn, never the cold read) carries a
  "This site's design" section: type roles, space scale, the section/block gaps,
  measures, colour roles, components and picture shapes, with per-width lengths
  given at desktop. It also carries each pictured page's off-system count. A site
  with no design is told so. The style lens asks whether each page follows THIS
  site's design (a heading in no role, a section with spacing or a width of its
  own, a button that is none of the site's components, a page unlike the others),
  in addition to hierarchy and brand.
- The "checked elsewhere" line is the layout check registry, phrase for phrase
  (BUG-271's mechanism), so it now names the new checks too. **Supersedes part of
  BUG-271's UAT:** the rubric's "craft nothing measures for you" no longer lists
  spacing that follows one scale, sections sharing their widths and edges, or
  columns side by side whose heights match, because those are now measured. It
  keeps only a logo sized to read (crops are measured too, now).
- **It re-runs after significant revisions**, not only at the first draft. Each
  review records a snapshot: a fingerprint of the design and of each served page's
  top-level sections. A review falls due if:
  - the design differs from the last review's (trigger `design_changed`). Since
    REQ-448 builders cannot change the design, so this is checked when the
    consultant writes it (`set_design`) or the client chooses a design look; or
  - after a build (REQ-427's due point, via the host's builder-completed hook), a
    page (including one new since) has **more than half** of its sections added,
    removed or rewritten since then (trigger `revised`, `of` the page).

  It does not fall due when a review is already due, when no review has run yet,
  or while the last review is still in its hold (findings unanswered). Builds
  that answer findings are that review's fixes, and a fixed high-severity finding
  has its own re-check.

## Test plan

- `tests/test_UAT_FC_REQ-449_pages_judged_against_the_design.test.ts` (real
  Chromium through `checkLayoutAt`, with the design and stored L1 as the host
  passes them): every new check is a registry entry with thresholds in
  configuration; a heading farther from its text than from the block above is
  loose, and one tight to its text is not; a block gap larger than the section gap
  is reported naming the design's steps, a kept one is not, and a site with no
  design is not judged by it; a section narrower than `contentWidth` is off the
  grid while content-, wide- and bleed-width sections are not; a picture beside a
  taller text panel is reported and a matching one is not; misaligned row tops are
  reported; a mostly off-system section is reported once, at desktop, naming its
  axes; a crop that cuts off its material's focal point, or presses it against the
  frame's edge, is reported, and a node framing the placement on its own focal point
  overrides the material's.
- `tests/test_UAT_FC_REQ-449_the_critic_judges_against_the_design.workers.test.ts`
  (real route in workerd, real builder and critic sessions, model and browser
  doubled): an off-grid `edges` finding says the build is not done and holds the
  hand-back, and the page was handed the site's measures; a photo the describer
  gave a focal point, placed on the site, reaches the page check with that focal
  point by its file name on the site; the critic's informed
  review carries the design and per-page off-system counts, the cold read does
  not, and the rubric names the new checks; a small revision (1 of 4 sections)
  makes no review due, a large one (3 of 4) makes a `revised` review due and run;
  a design change (the consultant's `set_design`) makes a `design_changed` review due.
- BUG-271's rubric UAT updated for the supersession above.
- Re-ran REQ-429, REQ-415, REQ-418, REQ-422, REQ-447, BUG-238, BUG-256, BUG-267,
  REQ-427, REQ-438 (pins "no review falls due during a hold"), BUG-271 and the
  rest of the workers project. No new failures against clean xgd-working.