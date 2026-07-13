---
uid: request-94c792c0
id: REQ-55
type: request
title: 'contentWidth: align to Tailwind max-w scale + literal escape hatch'
created_by: xgd
created_at: '2026-07-12T23:42:07.165403+00:00'
updated_at: '2026-07-13T22:06:43.373287+00:00'
completed_at: '2026-07-13T22:06:43.373287+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 46db8574c31835575830ee7a0daca352a22de9b3
    reconcile_sha: null
    main_sha: null
  version: 0.0.98
  bundled_in: bundle-d9c2e655
---

## Goal

Make container/content widths **hittable exactly** by aligning the named
`contentWidth` scale to the de-facto standard (Tailwind `max-w`), and adding a
literal escape hatch for widths off the scale.

Motivated by [[REQ-52]]: the gigabytealchemy "Most apps" block is 896px wide
(Tailwind `max-w-4xl` / 56rem), but our `contentWidth` steps jump 768 → 1152 and
skip it, so no dial reproduces it. Under exact-match diffing ([[REQ-53]]) width
mismatches now fire, so this matters.

## Design — named layer + literal escape hatch

The same pattern as the styled-text markup ([[DOC-22]]): a coherent named layer
for the common case, a literal escape hatch for exactness.

1. **Align named steps to Tailwind's `max-w` scale** so real sites land on a named
   step. Target set (rem → px @ root 16):
   `sm 384 · md 448 · lg 512 · xl 576 · 2xl 672 · 3xl 768 · 4xl 896 · 5xl 1024 ·
   6xl 1152 · 7xl 1280`, plus `bleed` (100%). Replace the idiosyncratic
   `xnarrow/narrow/readable/default/wide` set (no legacy aliases — migrate
   existing site docs that use the old names).
2. **Literal value** — `contentWidth` also accepts a literal `px`/`rem` (e.g.
   `contentWidth: "56rem"` or `896`) for a width not on the scale.

Applies wherever `contentWidth` (and the equivalent container dials) are consumed:
`text-block`, `hero`, `services-grid`, etc. — via the shared container tokens.

## Acceptance criteria (UATs)

- `test_UAT_*_contentWidth_4xl_is_896` — a module with `contentWidth: "4xl"` renders
  a 896px max-width content column.
- `test_UAT_*_contentWidth_literal_px` — `contentWidth: 896` (or `"56rem"`) renders
  896px.
- `test_UAT_*_gigabytealchemy_most_apps_width` — the REQ-52 "Most apps" block, set to
  `4xl`, matches the reference 896px width exactly under exact-match.
- `test_UAT_*_old_width_names_migrated` — no site doc references the retired
  `xnarrow/narrow/readable/default/wide` names.

## Notes

- No legacy dual-set: replace the token names and migrate docs; git history archives
  the old set.
- Keep the named set the *default* authoring surface; the literal is the escape
  hatch, not the norm.


---

## Implementation (free-coded — commit 46db8574, v0.0.98)

**Mechanism change (single path, no legacy):** the class-based `content-width-<name>`
CSS was replaced by a resolver that emits an inline `--fc-content-width` /
`--fc-row-width` custom property + a `has-content-width` marker. This is the one
mechanism that also carries literals (a per-name class can't express `896`).

- `dials.ts` — `CONTAINER_STEPS` map (the Tailwind scale) + `resolveContainerWidth()`
  (named→`var(--container-<step>)`, `number`→`<n>px`, other string→literal length,
  `bleed`/absent→`null`). `CONTENT_WIDTH_DIAL` is now `[bleed, sm..7xl]`.
- `tokens/defaults.ts` — container keys → `sm md lg xl 2xl 3xl 4xl 5xl 6xl 7xl bleed`.
- `site-schema` — `containerTokensSchema` new keys (all optional but `bleed`); a
  **dial value may be `string | number`** so a measured px width validates directly.
- Modules `hero` / `text-block` / `services-grid` resolve the dial to the custom
  property; `row.ts` does the same for `rowWidth`. Fixed layout widths repointed
  off the retired tokens: `--container-default`→`--container-6xl` (header/footer/
  row/module bases); contact-form's 640px form → literal `40rem` (off-scale).
- Site docs migrated: gigabytealchemy home sets `4xl` on the 896px "Most apps"
  (`different-approach`) block, and `md`/`3xl` on the hero/quote; all container
  theme override blocks reduced to `{ "bleed": "100%" }` (defaults now cover the scale).

**Blast radius note:** the mechanism was asserted by REQ-36/45/49/52 + token UATs;
those were rewritten to the new mechanism (capability preserved, expression changed).
New UATs in `tests/req55-content-width.test.ts`. Full suite: 559 passing.

Note: `@1stcontact/site-schema` is consumed as built `dist` (gitignored) — a rebuild
(`tsc -p packages/site-schema/tsconfig.json`) is required for the schema change to
take effect in validation-path consumers.