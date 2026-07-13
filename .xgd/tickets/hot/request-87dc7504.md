---
uid: request-87dc7504
id: REQ-56
type: request
title: 'Component-owned typography: theme label scale + capture reads it + per-instance
  escape hatch'
created_by: xgd
created_at: '2026-07-12T23:42:10.801971+00:00'
updated_at: '2026-07-13T18:05:07.984722+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 1798632d810910bf49f9a33429c4020e4eeddf2c
    reconcile_sha: null
    main_sha: null
  - working_sha: 8f27664f65c1427a1779b2d57f0c2057ad0377ab
    reconcile_sha: null
    main_sha: null
  - working_sha: a0376a210a98d1b44e9a8a572c83be956d1bb42a
    reconcile_sha: null
    main_sha: null
  - working_sha: 259c6b6c398710fc5c6a39b36c6ad0c9c467753f
    reconcile_sha: null
    main_sha: null
  - working_sha: 13b5a5123bffe3a1978d9e9f94a64b9ecc54f8b8
    reconcile_sha: null
    main_sha: null
  version: 0.0.105
  bundled_in: bundle-d9c2e655
---

## Goal

Give component-owned typography (badge labels, checklist markers/items, button
labels — sub-elements that today have their type hard-coded in module CSS) a
**theme-driven baseline** so systemic gaps are fixed once, plus a per-instance
style **escape hatch** for genuine one-offs. Make the **capture read** this
typography as theme-level so the values-diff attributes a systemic gap to the
theme, not to N identical per-element failures.

Motivated by [[REQ-52]]: on gigabytealchemy the badge (14/20 vs our 12/13) and
checklist (leading 24 vs our 28) deltas are **systemic** — every instance is off
by the same amount. That is a design-system/theme mismatch, not a per-instance
one. Under exact-match diffing ([[REQ-53]]) these all fire, so without this they
present as a wall of red.

## Design — attribution ladder (lowest-specificity lever first)

Per [[DOC-21]] and the "named/theme layer + literal escape hatch" pattern
([[DOC-22]]):

1. **Theme tokens (systemic fix):** badge / checklist / button-label typography
   derives from a theme **label / small-text scale** (size, weight, leading), not
   hard-coded module CSS. Fixing the theme corrects every instance. This is the
   right lever for the gigabytealchemy case.
2. **Module dial:** for a legitimate variant (e.g. `badgeSize` on services-grid).
3. **Per-instance `…Style` hook (escape hatch, last resort):** e.g.
   `badge.labelStyle`, `checklist.itemStyle`. Once [[REQ-54]] lands, a badge label
   is a tiny styled-run unit, so the hook carries the same `TextRun` override
   fields — no new concept.

## Capture must read it as theme-level

- The capture already extracts a `theme` block ([[DOC-13]]). Extend it to carry the
  **label / small-text scale** (the systemic typography of these sub-elements).
- The values-diff attributes a systemic sub-element gap to the **theme** (one
  finding via systemic-aggregation), not to every badge/checklist element
  individually. This is what makes exact-match ([[REQ-53]]) survivable here.

## Acceptance criteria (UATs)

- `test_UAT_*_badge_type_from_theme` — changing the theme label scale changes every
  badge's rendered size/leading; no per-instance authoring needed.
- `test_UAT_*_checklist_leading_from_theme` — checklist item leading follows the
  theme small-text scale.
- `test_UAT_*_per_instance_style_override` — a `badge.labelStyle` (or equivalent)
  overrides the theme baseline for a single instance.
- `test_UAT_*_capture_reads_label_scale` — capturing a page whose badges/checklist
  use one small-text scale yields a theme label scale, and the values-diff reports a
  systemic theme delta (one finding), not N per-element deltas, when ours differs.
- `test_UAT_*_gigabytealchemy_badges_close_via_theme` — setting the theme label
  scale to the reference closes the REQ-52 badge + checklist deltas systemically.

## Notes

- No new modules — this generalizes existing modules via the theme layer + dials +
  optional per-instance hooks (per "generalize before adding modules").
- Depends on [[REQ-53]] (exact-match makes systemic gaps visible) and composes with
  [[REQ-54]] (per-instance hooks reuse the run-override fields).



## Design decision (settled 2026-07-13) — subscales in render vocabulary

Confirmed with operator: **subscales, not one shared small-text scale.** The
badge (14/20) and checklist (leading 24) reference values differ, so a single
bundle can't reproduce both — each component-owned sub-element gets its own named
subscale.

**Vocabulary = the render values, verbatim (zero translation).** The capture
reads exactly six axes per element (`capture/extract.ts:54-64`, `457-483`):
`color`, `fontFamily`, `fontSizePx`, `fontWeight`, `lineHeightPx`,
`letterSpacingPx`. These are already *identical* to the `TextRun` style axes
([[REQ-54]], `text-style.ts:126-162`) — whose doc comment states the fields are
"the exact `ValueElement` names/units, so a diff row's `expected` value drops
straight into the matching field." So render → token → per-instance override →
diff all speak the same px vocabulary; nothing is converted.

Therefore: **a subscale IS a named, TextRun-shaped px bundle.** A per-instance
`labelStyle`/`itemStyle` is the same TextRun overriding that subscale's baseline.
This is the one mismatch to resolve vs. the existing `typography.scale` (which is
CSS-unit strings like `'0.75rem'`); subscales are px to match the render + TextRun.
Fields accept `number | string`, so a subscale may be authored as literal px
(mirrors render) or a theme alias.

```
render element  ──aggregate──▶  typography.subScales.badge = {fontSizePx, fontWeight, lineHeightPx, …}
                                         │ consumed by module CSS vars
                                         ▼
                               badge.labelStyle  (TextRun override, same fields)
                                         ▼
                    values-diff compares like-for-like px → systemic gap attributed to the subscale
```

## Phasing (one ticket, separate [FREE-CODED] commits)

Split for reviewability; all under REQ-56. Each phase carries its own UAT(s).

1. **Schema + tokens** — add `typography.subScales: { badge, checklist, … }`
   (each a TextRun-shaped px bundle) to `site-schema`; emit CSS vars from
   `tokens/css.ts`; fill `tokens/defaults.ts`.
   → `test_UAT_FC_REQ-56_badge_type_from_theme` (partial).
2. **Module repoint** — badge (`services-grid/index.astro:284-286`) + checklist
   (315, 320) consume the subscale vars instead of the general scale tokens.
   → completes `badge_type_from_theme`, `checklist_leading_from_theme`.
3. **Per-instance hook** — `badge.labelStyle` / `checklist.itemStyle` on the
   services-grid content schema, reusing the REQ-54 `TextRun` override fields.
   → `test_UAT_FC_REQ-56_per_instance_style_override`.
4. **Capture** — `capture/theme.ts` aggregates the badge/checklist elements'
   render values into `subScales`.
   → `test_UAT_FC_REQ-56_capture_reads_label_scale` (extraction half).
5. **values-diff attribution** — a systemic subscale gap surfaces as one
   theme-level finding under exact-match ([[REQ-53]]); existing systemic
   aggregation (`values-diff.ts:1612+`, LOW/MEDIUM only) is extended to cover
   exact-match font drift on these sub-elements.
   → completes `capture_reads_label_scale`, `gigabytealchemy_badges_close_via_theme`.



## Phase 5 decision (settled 2026-07-13) — subscale-attributed rollup with opt-out (option C)

Confirmed with operator: **option C.** A systemic subscale gap surfaces as **one
theme-level finding**, and the per-element badge/checklist rows it explains are
**rolled up (suppressed) by default**, with an **opt-out** (`--verbose` / a diff
option) that restores them for debugging.

- This overrides the REQ-48 systemic-aggregation convention (`values-diff.ts`
  "an added headline, not a rollup — per-element rows stay") **only** for
  subscale-explained deltas: it is what makes exact-match ([[REQ-53]]) survivable
  here, where every badge/checklist element otherwise fires.
- Data flow (traced): `expected = flattenCapture(reference)` already carries
  `theme.subScales` (phase 4); `actual = flattenSignals(draft)` computes its
  subscales with the same phase-4 cohort logic (one source of truth, exported
  from `capture/theme.ts`). `diffManifests` compares the two manifests' subscales
  and emits one `subscale`-scoped delta per differing named subscale.
- Rollup predicate: a per-element delta is suppressed when its element is in the
  badge/checklist cohort (checklist → a11y `listitem`; badge → pill heuristic)
  **and** its kind is one of the subscale axes that differs. Everything else is
  untouched. The opt-out restores the suppressed rows.