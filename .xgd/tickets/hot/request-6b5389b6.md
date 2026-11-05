---
uid: request-6b5389b6
id: REQ-447
type: request
title: 'L1: site.design — the site''s design system as a typed, binding object (type
  roles, space, layout, colour roles, components, imagery, brand), applied by the
  renderer, off-system values reported (DOC-67 part 1)'
created_by: EPIC-19
created_at: '2026-10-24T19:37:38.831935+00:00'
updated_at: '2026-10-24T22:10:18.084965+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 18
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-f080f4e8
  commits:
  - working_sha: 3521cab9b59baab68ad49f8ce8f1b3e0ae658eb6
    reconcile_sha: null
    main_sha: null
  - working_sha: 8e88ca568956bccfb37efbbecd4ab957bad956c7
    reconcile_sha: null
    main_sha: null
  - working_sha: 3e7fe2c28bb19ac1879904b675e91403deac8930
    reconcile_sha: null
    main_sha: null
  - working_sha: 02ae68b0016c3d1bb704069b871a731d5c2fc695
    reconcile_sha: null
    main_sha: null
  - working_sha: 9a249f96e627e4e3de24df10f577b87a45a62a97
    reconcile_sha: null
    main_sha: null
  - working_sha: 4c042f90a1ccfb91e8c76cd00fc42043c579f391
    reconcile_sha: null
    main_sha: null
  version: 0.2.622
---

## Why

Implements **DOC-67** §3, §4 and §8, the L1 half: the site design system as a
first-class, typed, binding L1 object. It is the substrate the other two tickets
build on (REQ-448: who writes it; REQ-449: judging pages against it).

Dina's Diner showed why (DOC-67 §1): `textStyles` (two styles), a generic `theme`
nobody referenced, an implicit 28px rhythm unit, sections with no content width,
spacing silently dropped inside boxes, and every node free to type its own values.

## What changes

### 1. `site.design` in `packages/site-schema`

One `.strict()` object, versioned with the site definition:
- **`type`**: roles `display`, `h1`, `h2`, `h3`, `lead`, `body`, `small`,
  `caption`, `label`. Each has family (a site font), weight, size and line height
  (per-width keyframes), letter spacing, and space above and below.
- **`space`**: a named scale `2xs` … `2xl` in px (per width), the **rhythm unit in
  px** (explicit, never inferred from body line height), `sectionGap` and
  `blockGap`.
- **`layout`**: `contentWidth`, `wideWidth`, gutters (per width), and a grid
  (columns and gap per width).
- **`colour`**: roles (`background`, `surface`, `text`, `muted`, `accent`,
  `action`, `onAction`, …) pointing to `palette` entries.
- **`components`**: `button.primary`, `button.secondary`, `card`, `quote`,
  `badge`. Each has fill role, text role, padding, radius, border and shadow.
- **`imagery`**: named aspect ratios (`hero`, `inline`, `portrait`, …) and a
  corner radius. Crops follow each image's focal point.
- **`brand`**: the logo's visible height per width and the name treatment.

The envelope validator enforces typed values only (hex or palette refs, bounded
numbers, closed enums, unknown keys rejected), per the security policy, plus
structure:
- type sizes rise with role rank;
- `sectionGap` > `blockGap`;
- paired colour roles meet contrast;
- `contentWidth` is within bounds at every width.

### 2. Nodes name the system; the renderer applies it

- New typed references on nodes: text `role`, spacing `space`, section/container
  `width: content|wide|bleed`, `component`, and image `aspect`. The image's focal
  point drives `object-position` (and an inlined drawing's equivalent, BUG-259).
- **Defaults when a site has a design:**
  - a top-level section takes `contentWidth`, the gutters and `sectionGap`;
  - blocks inside a section are spaced by `blockGap`, or by the text role's own
    space;
  - a text node with no role takes `body`;
  - an image with no aspect takes `inline`.
- **No silent drops:** spacing on a box's children is honoured, the same as in a
  stack. A spacing field the renderer cannot apply is a validation error, never
  ignored.
- The renderer stays the only emitter (security policy layer 2). Every value
  comes from typed tokens.

### 3. Off-system values are reported

- A node that types in its own value where the design has a token (font size,
  family, spacing, width, colour, radius) is **off-system**. It still renders, and
  no taste is forbidden (DOC-67 §2, operator question 1: report, don't refuse).
- `describe_page` lists the off-system values per section. This ticket provides
  the count. REQ-449 uses it in the checks and the critic.

### 4. Migration (nothing renders differently on the day)

- A site without `site.design` gets one derived from what it has:
  - `textStyles` → type roles;
  - `palette` → colour roles;
  - the rhythm unit made explicit at today's effective value;
  - `theme` dropped where unused;
  - `contentWidth` set so that today's section widths are unchanged.

  Existing inline values stay valid and are reported as off-system.
- `textStyles` and `theme` are replaced by `site.design` (not kept beside it). The
  readers and writers of `textStyles` (including `get_text_styles`) move to the
  new object.
- The header and footer parts (REQ-422) use the same design (DOC-67 question 3).

## Test plan

`tests/test_UAT_FC_REQ-447_site_design_system.*`:

- The schema accepts a full design. It rejects a type scale that is not rising,
  `sectionGap` ≤ `blockGap`, a failing colour pair, an unknown key, and a non-hex
  colour.
- Renderer (real Chromium):
  - a page with a design and no per-node values renders sections at
    `contentWidth` with `sectionGap` between them, and a `role: h2` text at the h2
    size and spacing;
  - children of a box get their spacing (no 0px collapse);
  - an image with `aspect: inline` and a focal point renders at 3:2 with the focal
    point in frame.
- Off-system: a node with an inline font size where a role exists is listed by
  `describe_page`. One using `role` is not.
- Migration: Ariel's and Dina's stored sites render pixel-identical (or within
  1px) before and after migration, and every inline value is reported off-system.
- Security: the REQ-82 injection and robustness UATs pass with design tokens in
  play.
- Re-run the l1 render, rhythm (REQ-420) and round-trip UATs.

## Answers to the implementing session's questions (EPIC-19, 2026-10-24)

The build approach is **accepted**:
- resolve the design at the boundary with one `resolveL1Design` pass, as
  `textStyles` and `palette` are today, keeping the renderer the only emitter;
- count off-system values on the unresolved document;
- reuse `axes.objectPosition` as the focal point, not a second field;
- name `sectionGap` and `blockGap` within the space scale and compare their px at
  every width.

One note for REQ-448: when a Library image is placed, its node's default
`objectPosition` should come from the focal point the describer recorded.

**Q1 Migration vs defaults: accepted in principle, with one change.** Nothing
renders differently on migration day, and defaults apply to new nodes. But
reproduce today's sizing with the **existing** sizing values where one exists
(for example an explicit `hug` width for a section that shrink-wraps today)
before adding a new enum. Add `width: "natural"` only if no existing value
reproduces today's render. One way to say a thing, not two. Whatever the
migration writes is reported as off-system.

**Q2 Spacing on box children: accepted.** The migration removes the spacing
values that were being silently dropped, so day one is pixel-identical. Box
children are spaced like a stack from then on. Those values were never visible,
and on Dina's site they were exactly the harmful 84–112px requests, so nothing
of value is lost.

**Q3 `theme`: accepted.**
- `theme` becomes optional, with the CSS generator falling back to its existing
  defaults for legacy module pages. It is dropped only from sites with no legacy
  modules, and `theme.fonts` moves into the design's font list.
- `textStyles`, `textDefault` and `rhythm` are removed outright and replaced by
  `design.type` and `design.space.rhythmPx`.
- Also update every **priming and tool description** that names the removed
  fields (for example builder priming's "set spacing in the text style", and
  `get_text_styles`), so no model is told to write a field that no longer exists.
  Wording stays within the priming budget. REQ-448 rewrites the authoring
  guidance properly.

**Q4 Fixtures: accepted.** Copy Ariel's and Dina's site JSON into
`tests/fixtures/req447-*`, but keep the fixtures small. Use stand-in images with
the **same dimensions** (or the committed `example-businesses/` photos where they
already exist) rather than copying megabytes of photos. The comparison is
before/after on the same assets, so the pixels of the photos do not matter.
Strip anything the render does not need.

**Q5 Size: accepted.** One ticket, one branch, about 18 points. Land it as a few
coherent commits (schema and resolver, migration, renderer changes, `describe_page`
and tool moves, fixtures), and keep the ticket body's "What landed" current as you
go.

Go.

## What landed (2026-10-24)

### Schema and resolver (`packages/site-schema`)

- `site.design` (`l1/design.ts`, closed vocabularies in `l1/design-names.ts`):
  `type` (roles `caption`, `small`, `label`, `body`, `lead`, `h3`, `h2`, `h1`,
  `display`, each the old text-style shape: family, size, weight, line height,
  letter spacing, per-width tracks, `spaceAbove`/`spaceBelow` in rhythm units),
  `space` (`scale` `2xs`…`2xl` in px or per-width tracks, `rhythmPx`,
  `sectionGap`, `blockGap` as step names), `layout` (`contentWidth`,
  `wideWidth`, `gutter`, `grid`), `colour` (roles → hex or palette ref),
  `components` (`button.primary`, `button.secondary`, `card`, `quote`, `badge`:
  fill/text colour roles, type role, padding steps, radius, border, shadow),
  `imagery` (named `aspects` w:h, radius), `brand` (logo height, name role and
  colour), `fonts` (moved from `theme.fonts`). Every object `.strict()`, every
  group optional so a design can be written one group at a time.
- `l1DesignIssues` refuses a design that is not a system: type sizes must rise
  with role rank (strictly between headings), `sectionGap` > `blockGap` at every
  width, colour pairs (`text`/`background`, `text`/`surface`,
  `muted`/`background`, `onAction`/`action`) meet 4.5:1, `contentWidth` is
  240–2400px at every width (`wideWidth` ≥ it), and every step or role a
  relationship or component names exists. A design font's family must be a font
  name (no CSS punctuation), its weight numeric, and its `src` must pass the
  image URL allowlist: the old `theme.fonts` emitted both raw into
  `@font-face`.
- Node references: text/control `role`, container/box `type.role` (replaces
  `type.style`; `axes.textStyle` is gone), container `space` (a gap step),
  box/container `width: content|wide|bleed`, text/box/container `component`,
  image `aspect`. A name the design does not define is refused like a dangling
  palette colour (`declaredDesignToken`).
- `resolveL1Design` resolves the SUBSTITUTIONS at the boundary, as the palette
  and text styles were: type roles (the old text-style precedence, `body` the
  default), components (expanded into literal axes and padding tracks; a
  group's text colour and role handed to the runs inside), imagery (an image
  with no aspect takes `inline`, an aspect crops `cover` around
  `axes.objectPosition` — the focal point — and takes the design's radius), and
  the defaults (root → `sectionGap`, top-level sections → `width: content`, a
  gap-spaced section → `blockGap`). Each default only when its token exists.
- Per-width LENGTHS are not literals: the renderer declares each used step,
  measure and the gutter on `:root` (per width, from the track) and a node
  naming one is emitted against `var(--l1-…, <widest px>)` — REQ-420's rhythm
  unit model. The renderer is still the only emitter.
- The rhythm unit is explicit: `design.space.rhythmPx`, else 24px. It is never
  inferred from the body line height.
- No silent drops: a box spaces its in-flow children by the space they declare
  (their own or their role's) exactly as a stack does — a box whose children
  declare none is unchanged. A `spaceAbove`/`spaceBelow` that would not be
  applied (beside an even gap, on a geometry-placed node) is refused
  (`spaceIsApplied`), as are `gapPx` + `space` (`oneGap`) and `width` beside
  `sizing.width` or geometry (`oneWidth`). Under a design with a `blockGap`, a
  non-text block in a rhythm stack is spaced by it (CSS `max()` against the
  units).
- `l1OffSystemValues`: every value a node types in where the design has a token
  (type axes where there are roles, hex colours where there are colour roles,
  px gap/padding/space where there is a scale or rhythm, a typed width where
  there is a measure, a radius where there is one). Read on the unresolved
  document.
- `theme` is optional; `textStyles`, `textDefault` and `rhythm` are removed from
  `siteSchema`.

### Renderer (`packages/framework`, `tools/generate/src/render`, `l1/probes.ts`)

- `renderL1Document`/`renderL1Fragment`/`renderL1Email` take `design` in place
  of `textStyles`/`textDefault`; the site renderer passes it to pages AND to the
  header/footer parts, so the parts use the same design.
- `space` → `gap`, `width` → `min(measure, 100% − 2 × gutter)` centred, `aspect`
  → `aspect-ratio` (width 100% unless sized), box children → rhythm leads.
- The theme CSS emits `--font-family-<role>` per role and the legacy
  `--font-family-heading` alias (from `h2`, `h1`, `h3`, `display`, else `body`)
  for legacy module pages; `design.fonts` become `@font-face` rules.
- The analytic evaluator takes `design` and models box leads, step gaps and
  design measures the way the renderer emits them.

### Migration (`tools/generate/src/store/legacy-design.ts`)

- On load (`assembleSite`) and on the edit commands' reads, a site without a
  design (or still carrying `textStyles`/`textDefault`/`rhythm`) is carried to
  one: the default style → `body`, styles named for a role (and
  `heading-1..3`, `heading` → `h2`) → that role, every other style inlined into
  the runs and containers that named it; the rhythm unit made explicit at its
  effective value; palette entries named for a colour role → that role (minus
  any role in a failing pair); `contentWidth` = the pages' column or 1200px;
  `theme.fonts` → `design.fonts`; `theme` dropped unless a legacy module page
  remains. A site that already has a design only loses the retired keys.
- Pages are pinned so nothing renders differently: top-level sections that
  would take the measure get the existing sizing value they effectively have
  (`fluid` under a stretching parent, `hug` under a centred/start/end stack or a
  row — no new enum); spacing the renderer used to drop is removed; a box's text
  children are pinned to `spaceAbove/Below: 0` where a role carries space. All
  of it is the node's own value, so it is counted off-system.
- The first write to a legacy site persists the migration whole (`site.json`
  and every page in one write) before the change, so the store never holds a
  design beside pages that still name text styles.
- New sites (`1c new`, reproductions) start with `design: { type: { body:
  system face } }` and no `theme`.

### Tools and the assistant surface

- `get_text_styles` and `set/add/remove/rename_text_style` are replaced by
  `get_design` (the design, its issues, how often each name is used, each
  page's off-system count). The design is written with `set_config` under
  `design` (or a group within it). The `ManageTextStyles` grant is gone;
  REQ-448 decides who writes the design.
- `describe_page` gains `offSystem`: per top-level section, the count, the count
  by kind, and the first eight by address and kind (no field names or values —
  the map carries no styling, REQ-129; `get_l1` shows the value).
- `1c design get`; `1c type get/set/add/rm/rename` removed; `1c type assign`
  names roles (`h1`–`h3` by heading level, `body` for the most used group when
  every run sets its axes) and drops values a run restates from `body`; other
  groups stay literal.
- Priming and tool descriptions that named text styles or `rhythm.unitPx` now
  name the design role and `design.space.rhythmPx`, within the priming budget.
- The structural-rule doc comments are written so the KB reference projects
  them (it rejects a first sentence holding a ticket id or over 240 chars); this
  also fixed the projection of `zoomGroupChromeAgrees`.

### Tests

`tests/test_UAT_FC_REQ-447_site_design_system.test.ts` (8 UATs, real Chromium
for the renderer and migration cases):

- `…the_schema_accepts_a_full_design_and_refuses_what_is_not_a_system` — a full
  design via `1c config set … design`; refusals for non-rising type,
  `sectionGap` ≤ `blockGap`, a failing colour pair, an unknown key, a non-hex
  colour, an out-of-bounds `contentWidth`.
- `…sections_take_the_measure_and_section_gap_and_a_role_takes_its_size_and_space`
  — sections at `contentWidth` (gutters at phone width), `sectionGap` between
  them, `h2` size and space, `body` default, a `button.primary` component's
  paint/padding/radius, and the header part drawn from the same design.
- `…children_of_a_box_get_their_spacing`.
- `…an_inline_image_renders_at_3_2_with_its_focal_point_in_frame`.
- `…describe_page_lists_a_typed_in_size_and_not_a_role` (and it still renders).
- `…ariels_/dinas_stored_site_renders_within_1px_and_every_inline_value_is_off_system`
  — fixtures in `tests/fixtures/req447-sites/` (real stored JSON, same-size
  stand-in photos), compared against `layout-before.json` measured from the
  pre-REQ-447 code by `tests/support/req447-layout.ts`.
- `…injection_through_the_design_is_refused_or_inert`.

Existing UATs whose contract moved to the design were updated, not deleted:
REQ-350 (type set once, theme typography lift), REQ-420 (rhythm), REQ-126 /
AC1073 / REQ-295 (write set and grants), REQ-418 (table type), REQ-130
(settings writes), REQ-4/24/36/114/AC936 (theme CSS), AC873 (scaffold), REQ-119
(invalid draft), BUG-48 (rule coverage), REQ-330 (message text). The
`req396-charlies` fixture was migrated by the migration itself (section width
pins only).

Pre-existing failures left alone (red on the main checkout without this
change): the `logDir`→`junctions` family, builder pane/session UI suites,
REQ-180, BUG-219/REQ-175/REQ-143/REQ-148 (starter-frame clearing), BUG-252,
BUG-162, BUG-245, and BUG-48's eight unprovoked REQ-335 rules.