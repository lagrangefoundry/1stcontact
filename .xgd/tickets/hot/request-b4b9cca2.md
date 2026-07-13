---
uid: request-b4b9cca2
id: REQ-50
type: request
title: Unify spec vocabulary with the fidelity diff (diff-named fields, non-enum literal
  values)
created_by: xgd
created_at: '2026-07-10T17:19:30.832280+00:00'
updated_at: '2026-07-10T18:51:19.232047+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: fbeb5200fdcca078b44876b0b88ea67ec4b00d5b
    reconcile_sha: null
    main_sha: null
  version: 0.0.92
---

## Goal

Make the **site spec** and the **fidelity diff** (`values-diff` / `ValueElement`)
speak ONE language for intrinsic typography + colour. The identifiers and units a
spec field uses MUST match exactly what page inspection/comparison reports, and
values MUST NOT be restricted to constant enum sets — a captured value can be
written verbatim.

No backward compatibility — sites are regenerated in the new language (CLAUDE.md
"No Legacy Modes"). Surfaced by [[REQ-36]]; design of record recorded on CHAT-7.

## Requirement

1. **Identifiers match the diff.** Each text slot in a module's content is a flat
   *styled run* using the diff's exact field names: `fontFamily`, `fontSizePx`,
   `fontWeight`, `color`, `letterSpacingPx`, `lineHeightPx`, `paddingLeftPx`. No
   internal names (`headingWeight`, `size`, `headingFont`) and no unit divergence
   (spec was rem, diff is px → spec speaks px).

2. **Values not restricted to enums.** Every style field accepts EITHER a literal
   in the diff's unit (`fontWeight: 500`, `fontSizePx: 65`, `color: "#ffffff"`,
   `fontFamily: "Oswald"`) OR a theme alias — a named token step (`"medium"`,
   `"5xl"`, `"primary"`). Both resolve to the same painted value. Literals unblock
   reproduction (paste the diff's number); aliases serve design/coherence.
   Relaxes DOC-7 §3.2 rule 1 (finite enumerations) for these axes: tokens are
   demoted from mandatory enums to optional aliases; validation accepts
   literal-or-known-alias and rejects unknown aliases.

## Scope of change

- **site-schema** — content already accepts nested styled-run records; add a
  named `TextRun`/`TextStyle` shape for clarity + typing.
- **framework `types.ts`** — new `styled-text` content-field kind.
- **framework `text-style.ts`** (foundation, DONE on CHAT-7 branch) —
  `resolveTextStyle(run) → inline CSS`; literals verbatim, aliases → `var(--…)`.
- **`dials.ts`** — delete family/size/weight/colour/tracking/line-height dials
  (SIZE, SUBHEAD_SIZE, HEADING_SIZE, CTA_SIZE, HEADING_WEIGHT, SUBHEAD_WEIGHT,
  BODY_WEIGHT, HEADING_FONT, SUBHEAD_FONT, CTA_FONT, LOGO_FONT, HEADING_TREATMENT
  as colour, HEADING_COLOR, SUBHEAD_COLOR, TREATMENT_ROLE-as-colour,
  LOGO_TREATMENT, TRACKING, LINE_HEIGHT) + per-axis CSS-class machinery.
- **6× `meta.ts` / 6× `index.astro`** — drop those dials; text slots become
  styled runs; emit resolved inline `style=`.
- **`validate.ts`** — literal-or-alias validation.
- **Regenerate** joyfulculinary + flagship sites in the new language.

## Stays structural (enum dials, unchanged)

surface, height, width, align, scrim, panel, anchor, inset, divider, gap,
contentColumn, headingCase (text-transform is not a ValueElement field — kept a
treatment so the verbatim-text check stays clean). Box `x/y/w/h` and unbounded
CSS (shadow/filter/gradient) stay DIFF-ONLY diagnostics, not settable fields.

## Agreed design forks (operator, 2026-07-10)

- Literal `fontSizePx` is FIXED px (loses the responsive `clamp()` the `size`
  dial gave); aliases (scale steps) stay rem. Reproduction wants exact px.
- Hero subhead lead/body split collapses to one run style; text-block owns prose.

## Free-coding

Framework code changes take full ceremony (code + `test_UAT_FC_*` + `[FREE-CODED]`
+ version bump). Site-def/config/theme edits exempt. Depends-on/pairs-with the
box-grouped inspection change (sibling ticket): the diff's "expected" column must
print in this exact styled-run shape so a delta is a paste-able edit.

## Resolved forks (operator, 2026-07-10) — grounded in the render-inspection report

The governing principle: the styled-run vocabulary MUST mirror `ValueElement` /
`ContentRun` (`tools/generate/src/cli/capture/values-diff.ts` + `.../capture/types.ts`)
field-for-field and unit-for-unit. The report is the ground truth the spec speaks.

1. **Gradient text is KEPT, expressed to match the report.** The report carries a
   text-fill gradient as `gradient: TextGradient = { angleDeg: number|null, stops: string[] }`.
   So `TextRun` gains a `gradient` field of that exact shape — same literal-or-alias
   rule as `color`: `angleDeg` is literal degrees (report unit) OR a direction alias
   (`to-right` → the `to-*` keyword set); each stop is a `#rrggbb` literal (report unit)
   OR a palette-role alias (`accent` → `var(--color-accent)`), optionally `{color,position}`.
   `resolveTextStyle` emits the `background-clip: text` sweep. `gradient.ts` folds into
   `text-style.ts`; the `headingTreatment`/`headingGradient`/`logoTreatment` dials +
   `GradientTreatment` content field are DELETED (subsumed by `color` + `gradient` on the run).

2. **Hero subhead collapses to styled run(s), NOT markdown.** No backward compat — the
   `subhead: markdown` field is removed; multi-paragraph prose is authored as a
   `text-block`. (Confirms the pre-existing agreed fork.)

3. **`styled-text` content shape is FLAT** — text + style siblings on one object, exactly
   `ValueElement`'s layout (`{ text, fontFamily, fontSizePx, fontWeight, color,
   letterSpacingPx, lineHeightPx, paddingLeftPx, gradient }`), never `{ text, style:{…} }`.

## Site-regeneration scope (operator, 2026-07-10)

This ticket regenerates in the new language: **1stcontact, harbor-cafe, sandbox/joyfulculinary**.
The fidelity-gated reproduction sites — **faelan, gigabytealchemy** (sites/ and sandbox/) —
are DEFERRED to separate per-site tickets (each gated on its own values-diff / 1c diff).
Consequence to accept: with the old dials deleted, the deferred repro site-defs will not
validate/render until their tickets land — a known temporary-broken state, not a regression.

## Scope clarification (operator, 2026-07-10) + applied conventions

REQ-50 is the **tooling** change (framework vocabulary). In-scope site work is
limited to making the **two example sites — 1stcontact + harbor-cafe** — work in
the new toolset (validate/build/render; no fidelity gate). ALL fidelity-repro
conversions (faelan, gigabytealchemy, joyfulculinary sandbox) are handled
separately by the operator and are OUT of scope here.

Applied conventions (no operator objection needed — engineering defaults to keep
the vocabulary coherent):
- **Prose stays markdown.** A markdown `body` can't be one run; its block-level
  typography is carried by a style-only styled run (`bodyStyle`: a `styled-text`
  with no `text`) applied to the prose container. `listMarker` stays a treatment dial.
- **Wordmark vs image logo split.** `wordmark` (styled-text run; gold/gradient →
  its `color`/`gradient`) + `logo` (asset-ref image). `logoSize` sizes the image only.
- **List-of-links typography** (nav entries, footer links) → one shared style-only
  run per group (`navStyle`, `linkStyle`) applied to every link.

## Delivered (2026-07-10) — commit fbeb5200, v0.0.92

Framework tooling complete; quality gate SUCCESS (523 tests, 96.18% stmt coverage).

- **Foundation**: `text-style.ts` — `TextRun` + `resolveTextStyle` (literal-or-alias per
  axis), report-shaped `gradient` field folding in the deleted `gradient.ts`; alias sets +
  palette-role helpers.
- **Contract**: `styled-text` content-field kind (`types.ts`); per-axis literal-or-known-alias
  validation (`validate.ts`); typed `TextRun`/`TextRunGradient` in site-schema.
- **Dials**: deleted every typography/colour dial; kept only structural dials.
- **Modules**: hero/header/text-block/services-grid/contact-form → styled runs, emit
  `resolveTextStyle` inline, version v1→v2. footer unchanged (v1). Prose (markdown body)
  stays markdown + a style-only `bodyStyle` run; wordmark split from image logo; list-link
  typography via a shared `navStyle`/`linkStyle` run.
- **Example sites**: 1stcontact + harbor-cafe regenerated in the new vocabulary; `scaffold.ts`
  (cmdNew) + conformance `payloads.ts` updated for `styled-text`.
- **Test suite**: full prior-REQ suite migrated to the new vocabulary (removed-mechanism
  assertions rewritten to assert resolved inline style, or deleted; fixtures bumped to v2 +
  run shape).

Deferred to separate operator tickets: fidelity-repro site conversions (faelan,
gigabytealchemy, joyfulculinary sandbox) — these will regenerate in the new language, each
gated on its own values-diff / 1c diff.
