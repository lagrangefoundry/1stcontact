---
uid: request-baeb116a
id: REQ-448
type: request
title: 'Design system authoring: the principal writes site.design before the first
  build (host seeds measured facts and validates), builders consume but cannot edit
  it, and Looks become design-system variants (DOC-67 part 2)'
created_by: EPIC-19
created_at: '2026-10-24T19:38:10.311701+00:00'
updated_at: '2026-10-24T23:10:53.820465+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 13
  blocked_by:
  - request-6b5389b6
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-a6f873cc
  commits:
  - working_sha: 5321493d52fd0f4d2169cf1d74b7d6ff0697e0b3
    reconcile_sha: null
    main_sha: null
  - working_sha: e6c0a3ec486ed428199d6d3f726f056a926950cc
    reconcile_sha: null
    main_sha: null
  - working_sha: eb6fb630f0eec4710d81b060667f14972133bf3b
    reconcile_sha: null
    main_sha: null
  version: 0.2.625
---

## Why

Implements **DOC-67** §5 and §6: who writes the design system, who may change it,
and how the client chooses it. Builds on **REQ-447** (the L1 object).

On Dina's site no one owned the design. A Haiku builder improvised every section
and also changed a site-wide value (body line height to 28px), which silently
rescaled every gap on the site.

## What changes

### 1. The principal writes it

- The consultant gets a plan-surface tool to read and write `site.design` (for
  example `read_design` / `set_design`), with the same refusal style as the
  other plan tools. It is the consultant's tool, not the builder's (see "consultant
  has no l1 writes when commissioning": it goes on the plan surface).
- **When:** once the visual direction is agreed (REQ-432), and before the first
  build. A first-pass `Delegate` on a site with no design is refused, with a
  reason that says to write the design first. The design is written from the
  brief, the agreed direction and the comparison sites the client chose.
- **The host seeds what it can measure** and offers it as a starting point:
  - the logo's visible ink height and aspect;
  - each photo's dimensions and **focal point** (recorded once by the material
    describer when a photo is added, so `aspect` crops have something to keep).
    The material's focal point is the photo's default; an L1 image node may
    still override it for one placement, and the renderer uses the node's value
    when set, otherwise the material's. This reverses the earlier "no focal point
    on the material" decision (`material.ts`, BUG-44 note in `schema.ts`): that
    was right while nothing read it, and REQ-447's `aspect` crops now do. Both
    comments are rewritten to say so;
  - a palette drawn from the logo and photos.

  The principal decides everything else.
- **The host validates** every write (REQ-447's validator) and refuses with the
  reason, like any L1.
- The consultant's priming says what the design system is for, that it is
  bespoke per site and never a template, and how to choose scales (proportion,
  measure, air) within the priming budget.

### 2. Builders consume it and cannot change it

- Builders read the design (it is in their brief or readable) and build with named
  references (`role`, `space`, `width`, `component`, `aspect`). Their priming says
  so, and that a typed-in value is off-system.
- **A builder cannot write `site.design`** (or the old `textStyles` and `theme`
  paths). The write is refused naming the design as the principal's.
- A builder that finds the system lacking (a missing role or component) says so in
  its report. The principal decides whether to add it.

### 3. Looks are design-system variants

- **The Looks UX stays exactly as it is** (REQ-391 / REQ-402 / BUG-250: the
  Looks tab, the carousel and band, `show_client` → `looks`, `choose_look` with
  the client's words recorded as a decision, "Before …" kept so the choice can
  be undone). What changes is what a look *is* underneath.
- A Look **is** a variant of `site.design` and nothing else: a look carries a
  design, not a copy of a page's sections. The client compares their own pages
  rendered with each variant. The chosen one becomes the site's design, so every
  page changes at once. "Before …" is the design as it was. The client never
  sees design terms: they see the look's name and their pages.
- Because a look cannot change words, pictures or layout, `choose_look`'s
  `CONTENT_CHANGED` refusal no longer applies to design looks.
- At "Colours & fonts", the principal offers two or three variants.
- Later changes ("more air", "headings feel shouty") are edits to the design by
  the principal, seen on every page at once.
- Existing look sets keep working. Whatever a look changed today (palette, fonts)
  maps onto the corresponding parts of the design.

### 4. The operator can inspect it

- The design system is visible to the operator (not the client) in the Debug tab
  (DOC-67 question 4).

## Test plan

Three files, using the scripted-model host harness for the conversation:

- `tests/test_UAT_FC_REQ-448_principal_writes_the_design.workers.test.ts` (real
  routes in workerd: `/api/ai/prompt`, `/api/material`, `/api/pages`,
  `/api/design`, the preview):
  - a first-pass `Delegate` on a site without a design is refused with the
    write-the-design reason; after `set_design` it is accepted and a builder runs,
    and the plan records `milestones.design_at`;
  - `set_design` with an invalid design is refused `DESIGN_INVALID` with REQ-447's
    reason, and nothing is written;
  - a newly described photo stores its focal point (and its size), and the
    description stays clean; the seed `read_design` offers carries the logo's
    ink height and aspect, the photo's focal point and colours from the logo;
  - `offer_looks` makes design looks the unchanged Looks tab reads (rows for
    `home`, no page of their own, the page's widths), the preview shows the
    client's own page in the look's design; choosing a look replaces the site's
    design and every page re-renders with it, the choice is recorded, and
    choosing "Before …" restores the previous design;
  - the operator's design read (`GET /api/design`) answers the current design.
- `tests/test_UAT_FC_REQ-448_builders_cannot_write_the_design.test.ts`: a
  builder's `set_config` to `design` (by key, sub-key or top-level setting),
  `textStyles` or `theme` is refused `NOT_YOURS` naming the design as the
  consultant's, nothing is written, and other settings still are.
- `tests/test_UAT_FC_REQ-448_the_debug_tab_shows_the_design.test.ts` (the real
  builder in jsdom): the Debug tab shows the current design and its issues for the
  site in scope.
- Re-run: REQ-391 looks (node suite rewritten for design looks; carousel, band,
  looks mode, choosing and the content guard unchanged and green), REQ-432
  direction, builder scope (REQ-397/410), REQ-447, REQ-420/350/130 (now writing
  the design through the operator's `1c config set`), BUG-129 priming budget.

## What landed (2026-10-24)

### Plan surface (the consultant's)

- `read_design` (group `ReadPlan`): the design, its issues, name uses, off-system
  counts, and `seed` — what the host measured (`tools/generate/src/cli/design-seed.ts`):
  the logo (the first picture in the site header) with its size and visible ink
  size and aspect (`opaqueBox`, now shared with BUG-267's trim), each Library image
  with its size and focal point, and up to six colours drawn from the logo and PNG
  photos (4-bit buckets, most used first). JPEG photos give size and focal point
  but no colours (no decoder in-process).
- `set_design` (group `PlanWork`): writes groups of the design through
  `editConfigSet(…, 'design', …)` (merge, then REQ-447's validator); a failure is
  refused `DESIGN_INVALID` with the reason. The first write stamps
  `plan.milestones.design_at` (inside the existing `milestones` key, so `PLAN_KEYS`
  is unchanged).
- `offer_looks` (group `PlanWork`): `looks: [{label, description?, design}]`,
  optional `page` (default `home`) and `set`. Answers the set and the
  `#looks=<set>` link.
- New plan errors `NO_DESIGN`, `DESIGN_INVALID`; `choose_look`'s text covers both
  kinds of look. `talker.json`: `read_design` allowed, `set_design`/`offer_looks`
  withheld.

### The first build waits for the design

- `Delegate` is refused `design_first` ("The site has no design yet … Write the
  design first with set_design …") while the plan has neither
  `milestones.first_pass_at` nor `milestones.design_at` (`designUnwritten`,
  wired through `WorkerLimits.designUnwritten` in `account-core.ts`). A site that
  already had a first pass is not held to it.

### Builders cannot change the design

- The assistant surface's `set_config` refuses `design`, `theme`, `textStyles`,
  `textDefault` and `rhythm` (as the key's root or as a top-level setting) with a
  new code `NOT_YOURS` (exit 8): the design is the consultant's; build with its
  names and report what is missing. The operator's `1c config set` still writes it.
- `get_design` / `set_config` descriptions and the builder priming say so: name
  `role`, `space`, `width`, `component`, `aspect`; a typed-in value is off-system;
  report a missing role or component.

### Looks are design variants (same Looks UX)

- `pageAlternativeSchema` gains `design`. A design look is a page with no document
  (refused if it carries `l1` or modules) whose `alternative.design` is the whole
  design it offers (current design + the look's groups, merged). Its design is
  validated as a system like `site.design`.
- `editAlternativesMake` now makes only design looks (the page-copy look maker and
  the builder's `make_alternatives` tool are retired; looks are the principal's).
- The renderer draws a design look as the page it is `of`, as that page now
  stands, with the look's design and its theme rules inline.
- `editPageList` gives a design look its page's widths and omits the design from
  the row; the builder (Looks tab, carousel, band, `show_client`) is unchanged.
- Choosing a design look replaces `site.design` (one write with the set), keeps
  the old design as an archived "Before …" design look, and has no content guard
  (nothing on a page moves). Older page-copy looks still choose as before.

### Focal points and sizes at the Library's door

- The image describer's prompt asks for a last line `Focal point: X% Y%`;
  `focalPointOf` reads and strips it. `ingest` records `focal_point` and
  `dimensions` (`imageDimensions`: PNG, JPEG, GIF, WebP headers) on the material;
  both are declared in `MATERIAL_FIELDS` and carried on `MaterialRow` and the
  catalogue item.
- Placement copies the focal point to the node: the image editor's Save sets
  `objectPositionXPct/YPct` from a newly picked picture's focal point;
  `place_on_site` returns `focal_point` and tells the model to set it as
  `objectPosition`. The doctrine comment in `material.ts` is rewritten (the node
  still owns framing; the material's value is the default it copies).

### Operator view

- `GET /api/design?site=` (the `get_design` answer) and a read-only "This site's
  design system" section in the Debug tab (the design as JSON plus its issues),
  re-read when the tab is shown. The tab itself is ungated in this version, like
  the rest of it (EPIC-22).

### Priming

- Consultant: one section, "The site's design, and looks of it", replaces "Show
  looks as a set" and the heading-spacing paragraph — what the system is for,
  bespoke never a template, proportion/measure/air, write it after the direction
  and before the first build from `read_design`'s seed, builders cannot change
  it, later changes are edits, looks via `offer_looks`/`choose_look`.
  Measured 99,420 characters against BUG-129's 100,000.
- `delegation-files` no longer lists text styles in `site.json`.

### Test support

- `tests/support/d1-site-factory.ts` `designWritten(tenant, site)` marks a seeded
  site's design as written; every workers suite that delegates on a fresh site
  calls it, so they test the build, not the gate.