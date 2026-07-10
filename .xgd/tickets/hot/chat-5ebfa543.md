---
uid: chat-5ebfa543
id: CHAT-7
type: chat
title: Systemic comparison
created_by: xgd
created_at: '2026-07-10T02:46:17.396044+00:00'
updated_at: '2026-07-10T17:20:14.087041+00:00'
completed_at: null
last_field_updated: body
status: open
fields: {}
---

## Design of record — unified spec/diff vocabulary (agreed 2026-07-09)

**Behavior:** the site spec and the parameter diff (`values-diff` / `ValueElement`)
speak ONE language for intrinsic typography + colour. Each text slot in a module's
content is a flat styled run using the diff's exact field names and units; every
style field accepts a literal in the diff's unit OR a theme alias (both resolve to
the same value). No backward compatibility — sites are regenerated in the new language.

**Unified fields (diff vocabulary):** `fontFamily` (literal "Oswald" | role alias),
`fontSizePx` (65 | scale step), `fontWeight` (500 | weight alias), `color`
(#ffffff | palette role), `letterSpacingPx` (0 | tracking step), `lineHeightPx`
(75 | line-height step). Box `x/y/w/h` and unbounded CSS (shadow/filter/gradient)
stay DIFF-ONLY diagnostics — not settable spec fields.

**Stays structural (enum dials):** surface, height, width, align, scrim, panel,
anchor, inset, divider, gap, contentColumn, headingCase (text-transform is not a
ValueElement field — kept as a treatment so the verbatim-text check stays clean).

**Deleted:** dials.ts family/size/weight/colour/tracking/line-height constants
(SIZE, SUBHEAD_SIZE, HEADING_SIZE, CTA_SIZE, HEADING_WEIGHT, SUBHEAD_WEIGHT,
BODY_WEIGHT, HEADING_FONT, SUBHEAD_FONT, CTA_FONT, LOGO_FONT, HEADING_TREATMENT,
HEADING_COLOR, SUBHEAD_COLOR, TREATMENT_ROLE-as-colour, LOGO_TREATMENT, TRACKING,
LINE_HEIGHT) + their per-axis CSS-class machinery in every .astro.

**Change set:** (1) site-schema TextRun/TextStyle schema; (2) framework types.ts
`styled-text` field kind; (3) NEW framework text-style.ts `resolveTextStyle(run,theme)
→ inline CSS`; (4) dials.ts deletions; (5) 6x meta.ts; (6) 6x index.astro; (7)
validate.ts literal-or-alias; (8) regenerate joyfulculinary + flagship sites;
(9) test_UAT_FC_CHAT-7_* UATs.

**Sequence:** foundation (resolver+type+validate) → hero end-to-end (shape proof)
→ sweep 5 modules → regenerate sites → values-diff confirms one language →
[FREE-CODED] + version bump. Related: [[REQ-36]] surfaced this; box-view diff is
the sibling change (values-diff reorganised box-centric, printing "expected" in
this exact shape).



## Tickets filed (2026-07-10)

Split into two paired requests:
- **[[REQ-50]]** — Unify spec vocabulary with the fidelity diff (diff-named
  fields, non-enum literal values). Foundation already landed on this branch:
  `packages/framework/src/modules/text-style.ts` (`resolveTextStyle`) +
  `tests/chat7-unified-vocabulary.test.ts` (6 UATs green). Remaining: dials
  deletion, 6× meta/astro conversion, validation, site regeneration.
- **[[REQ-51]]** — Object-grouped inspection + comparison output (per-object
  params incl. position).

The two are a matched pair: REQ-51's diff "expected" column prints in REQ-50's
styled-run shape, so a delta row is a paste-able edit. This closes the loop for
[[REQ-36]] (object-by-object faithful reproduction).


<!-- xgd-chat-end -->