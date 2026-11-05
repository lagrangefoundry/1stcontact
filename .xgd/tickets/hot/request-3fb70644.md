---
uid: request-3fb70644
id: REQ-456
type: request
title: 'Design system: a design must be complete to be accepted — gutters, per-width
  type sizes, lead/quote roles, button components, imagery and brand — seeded by the
  host, with off-system text sizes held'
created_by: EPIC-19
created_at: '2026-10-25T00:52:46.227560+00:00'
updated_at: '2026-10-25T16:54:41.862883+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 8
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-326251f7
  commits:
  - working_sha: 18b8111c8f1e53c06677144efce4036e7eb0c4b6
    reconcile_sha: null
    main_sha: null
  - working_sha: a42746c2e8cca51a8870cf5a3ab37ecfd97e5989
    reconcile_sha: null
    main_sha: null
  - working_sha: 99b11b5e14859606c0ccd7b2388d1048e5fab85f
    reconcile_sha: null
    main_sha: null
  - working_sha: 4770b465e5fa811623564197272e1e6a6b496936
    reconcile_sha: null
    main_sha: null
  version: 0.2.635
---

## Why

Follow-up to **REQ-447/448**. On First-Draft-Test Dina's Diner the consultant
wrote a `site.design` and the builder used it, so the design system works. But
the design was **incomplete**, and the validator accepted it:
- **`layout.gutter` omitted, defaulting to 0.** At 900px and 375px every section
  after the hero sits flush against the screen edge: headings, body, the menu
  table, the footer and the logo. The cold read: "It looks broken."
- **One fixed size per type role** (`h1 54/58, h2 36/42, body 18/29`) at every
  width. The only per-width size was a builder override on the hero `h1` that
  stops at 768px, so at **900px the headline is 54px in a 379px column: five
  lines**, with "stop" alone on a line.
- **No role for a pull-quote or lead paragraph.** The builder typed `26/36` on the
  coffee-bell paragraph. On desktop it reads much larger than the "Hal's counter"
  body text (operator: "the text fonts are inconsistent"), and the cold read
  agreed ("a side story shouting louder than the menu"). A tiny typed-in discount
  line sits under the menu.
- **No `components`** (buttons hand-built, colours typed in: `#FFFFFF`, teal,
  sand), **no `imagery`** (the hero photo kept its own 3:2 beside a taller panel),
  and **no `brand`** (logo: BUG-276).
- **34 values off-system.** The hero is 15 of 26, mostly forced by the missing
  roles and components.

## What changes

1. **A design must be complete to be accepted** (REQ-447's validator, enforced
   when REQ-448's `set_design` is called):
   - `layout.gutter` per width, with a minimum (for example at least 16px on phone
     and 24px on tablet; settle in this ticket);
   - type sizes **per width** for `display`, `h1`, `h2`, `h3` and `lead`, at
     least at phone, tablet and desktop. Interpolation between them is the
     renderer's. A size that would put a heading over its line limit in a
     half-width column at tablet is a validation finding;
   - roles for **`lead`** and **`quote`** (and `small` / `caption`), so a
     pull-quote or a note never needs typed-in sizes;
   - `components` for **`button.primary`** and **`button.secondary`** at least,
     and a colour role for every fill the design uses (no typed-in hex);
   - `imagery` aspects (`hero`, `inline` at least) and `brand` (BUG-276).
2. **The host seeds every required part** with a sensible starting point (the
   gutter, a per-width type scale derived from the chosen sizes, button components
   from the colour roles, aspects from the photos, brand from the logo). The
   consultant adjusts the seed rather than starting from nothing.
3. **`set_design`'s description** explains each required part in a line, within
   the priming budget, and a refusal names what is missing.
4. **Off-system text sizes hold.** Body text, quotes and notes with a typed-in
   font size where a role exists are reported. A page with more than a threshold
   of them holds the hand-back (with REQ-449's off-system share check), so "the
   coffee paragraph is bigger than the story" cannot pass silently.

## Test plan

`tests/test_UAT_FC_REQ-456_a_design_is_complete.*`:

- `set_design` with no gutter, single-size headings, no `lead`/`quote`, no button
  components or no brand is refused, naming each missing part. The seeded design
  is accepted as is.
- Real Chromium, with a complete design: at 375 and 900 every text block sits at
  least the gutter from the screen edge. At 900 the h1 fits within its line limit
  in a half-width column.
- A quote rendered with `role: quote` and the body with `role: body` resolve to
  the design's sizes. A typed-in 26px paragraph is reported off-system, and past
  the threshold it holds.
- Migrated sites (REQ-447) still render unchanged. Their missing parts are
  reported for the principal to complete.
- Re-run the REQ-447, REQ-448 and REQ-449 UATs.


## Settled in this ticket (implementation decisions)

- **Where completeness is enforced.** On the consultant's write only: `set_design`
  (the host's design write) checks the *merged* design for completeness before it
  is written. `validateSite` is unchanged, so migrated and builder/CLI-written sites
  keep validating and render unchanged; `get_design` / `read_design` report their
  `missing` parts for the principal to complete.
- **Gutter minimums.** `layout.gutter` is required, at least **16px at phone
  (375)** and **24px at tablet (900) and desktop (1280)**. A single number that
  meets every minimum is accepted.
- **Per-width type.** `display`, `h1`, `h2`, `h3` and `lead` each need a per-width
  size (`responsive.fontSizePx`) with keyframes at phone (≤480), tablet (481–1023)
  and desktop (≥1024). A role's size is substituted into every run that names it,
  and a run's keyframes must be widths its page is laid out at, so the seed
  keyframes sizes at **375 / 768 / 1024 / 1280** (all on the starter ladder); a
  design whose role keyframes are off a page's widths is refused by the site
  validator, as before.
- **Heading line limit.** A heading must fit a minimum number of characters per
  line in a half-width column at tablet (900): `display` 12, `h1` 16, `h2` 20,
  `h3` 24, estimating a character at 0.55em. The half column is
  `(min(contentWidth, 900 − 2·gutter) − gap) / 2`, `gap` being the grid gap (else
  the block gap, else 0). Dina's 54px h1 in a 379px column fails.
- **Roles.** A new type role **`quote`** joins the closed set (it stands apart from
  the size ladder, like `label`, but is never smaller than `body`). Required roles:
  `body`, `lead`, `quote`, `small`, `caption`, `h3`, `h2`, `h1`, `display`.
- **Components and colour.** `button.primary` needs `fill` and `text`;
  `button.secondary` needs `text` and a `fill` or a `border`. Colour roles
  `background`, `text`, `action` and `onAction` are required (with REQ-447's rule
  that every role a component names exists).
- **Imagery and brand.** `imagery.aspects.hero` and `.inline` are required; `brand`
  needs a `logo` (BUG-276's visible size in the header and footer) or a `name`.
  BUG-276's own rule still holds on top: on a site that shows a logo, a sound,
  complete design without `brand.logo` is refused, and that reason is named in
  the same refusal as any missing parts.
- **The seed.** `read_design`'s `seed.design` is the current design with every
  missing part filled in: a gutter track (16/24/32), per-width sizes derived from
  each role's chosen size (capped by the heading line limit, still rising with
  rank), `lead`/`quote`/`small`/`caption` derived from `body`, default colour roles
  (action from the measured colours where one reads), button components from the
  colour roles, `hero`/`inline` aspects snapped from the photos, and `brand` from
  the brand the host measured from the logo (BUG-276's `seed.brand`), or the name
  set in `h2` on a site without a logo. It passes both the system check and the
  completeness check, so `set_design` accepts it as is.
- **Typed-in text sizes.** Typed-in sizes stay *reported* by REQ-447's off-system
  census (`describe_page`, `get_design`, the critic). The *hold* is REQ-457's
  `type_scale` layout check, which landed alongside this ticket: any rendered text
  at a size none of the design's roles has at that width is a finding, and holds
  the hand-back like every layout fault — a threshold of zero. This ticket briefly
  had its own `typed_text` check (more than 1 typed run per page); it was removed
  so one rule has one check. With `lead`, `quote`, `small` and `caption` in every
  complete design, nothing needs a size of its own.
- **The refusal.** `set_design`'s refusal lists the design's system faults
  (REQ-447's reasons) first, then every missing part with its path, then
  BUG-276's brand reason where it applies, and points at `seed.design`. A design
  of the wrong shape is left to the site validator, which names its path.

## What landed

- `packages/site-schema/src/l1/design-names.ts` — the `quote` type role.
- `packages/site-schema/src/l1/design.ts` — `l1DesignMissing`, `l1HalfColumnPx`,
  `l1HeadingMaxPx`, the completeness constants, and `quote` ≥ `body` in
  `l1DesignIssues`.
- `tools/generate/src/cli/edit.ts` — `editDesignSet` (the consultant's write) and
  `missing` on `get_design`.
- `tools/generate/src/cli/design-seed.ts` — `seededDesign`; `read_design` returns
  it as `seed.design` (`host-core.ts`).
- `plan-surface.json` / `l1-surface.json` — `set_design` / `read_design`
  descriptions and the `design` shape's `missing` and `quote`.
- Existing UATs updated to write complete designs: REQ-448 and REQ-449 workers
  suites, and BUG-276's "seeded brand is written".

## Evidence

- `tests/test_UAT_FC_REQ-456_a_design_is_complete.test.ts` — Dina's design reported
  incomplete naming each part; the seed keeps what the design chose and is complete
  and sound; picture shapes and brand from the measured facts; Ariel's and Dina's
  migrated sites still render and report their missing parts; the typed 26px
  paragraph is off-system and the quote is not. Real Chromium: at 375 and 900 every
  text block sits at least 16 / 24px from the edge (fails on a zero gutter); at 900
  the h1 in a half-width column keeps its line limit (fails at Dina's 54px); quote
  and body render at the design's sizes; through `checkLayoutAt` on the rendered
  page, the typed 26px paragraph is held by `type_scale` while the quote and body
  are not (skipped where Playwright's own launch is unavailable, as REQ-449's are;
  verified in the agent sandbox with the degraded Chromium launcher).
- `tests/test_UAT_FC_REQ-456_a_design_is_complete.workers.test.ts` — through the
  real routes: an incomplete design is refused naming each part and nothing is
  written; the seeded design is accepted as is, the milestone is recorded, and a
  later one-group change is accepted.
- Re-run: REQ-447, REQ-448, REQ-449, REQ-457, BUG-276 (node + workers), BUG-129
  priming budget — passing. Pre-existing failures on clean xgd-working, unchanged:
  BUG-48 `every_stated_rule…`, REQ-122 `the_model_is_primed…`, REQ-416 priming.