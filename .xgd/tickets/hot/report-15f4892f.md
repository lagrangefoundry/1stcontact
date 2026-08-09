---
uid: report-15f4892f
id: REPORT-1722
type: report
title: 'Capability-Intent Alignment: 1c_capture_diff_fidelity (level=ac)'
created_by: xgd
created_at: '2026-08-09T02:09:06.226512+00:00'
updated_at: '2026-08-09T02:09:06.226512+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: ac
  violations: 4
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c_capture_diff_fidelity
# Level: ac

**Result**: FAIL
**Violations**: 4
**Warnings**: 3
**Needs review**: 0

Scope: the 48 ACs hanging off the five stories of `capability-aa030c83` (CAP-63) —
STORY-75 (14), STORY-76 (5), STORY-77 (8), STORY-78 (9), STORY-79 (12). All five
stories are `feature`/`upgrade`, so all are in the Capability Matrix and all are
expected to carry ACs; none is task-like.

Per the level cascade, **story bodies are the working reference**. Intent was
consulted only where a story body is itself stale or ambiguous — which happened in
two places: STORY-76's gradient-stop colour model (findings 2, 3, 6) and STORY-79's
"commands that never render" list (finding 7).

**Nothing has been repaired since the previous ac-level cycle** (`report-cb7ea283` /
REPORT-1644, 2026-08-07T22:51Z). Findings 1–4 there are findings 1–4 here, each
re-verified this cycle at a named file:line rather than inherited. The
`updated_at` on all 48 ACs sits in a single 2026-08-07T23:11–23:12Z window — the
`uat_coverage` stamping pass that produced REPORT-1649/REPORT-1653 — not a content
repair: AC-637's title and AC-638's Criterion are byte-identical to what
REPORT-1644 quoted.

**All four violations land on STORY-76** (`story-82eb6908`, gradients): three are
AC-637 and AC-638 carrying a retired colour model and a deleted module name, the
fourth is item 2's *Captured* leg still having no AC. **STORY-75, STORY-77,
STORY-78 and STORY-79 are clean on coverage** — every Description item of each has
an AC, with no orphan AC and no duplicate.

## Cumulative Intent Considered

Condensed from this cycle's story-level ledger (`report-a5db24c3` / REPORT-1721,
2026-08-09T02:02Z), narrowed to the intents that bear on AC-level findings, plus
REQ-114 which REPORT-1721 does not carry but which is load-bearing for findings 2
and 3.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 `bundle-ab9e0cb6` (REQ-58, REQ-59, REQ-61, REQ-62) | free_and_reconciled | 2026-07-13…17 | `intent_uid` of all five stories. REQ-59 text-fill stop positions (→ AC-634/635); REQ-62 panel gradient capture + render + diff (→ AC-636/637/638 + finding 4); REQ-61 `--size` + `responsive-diff`; REQ-58 ladder, boolean flag, `--json` hygiene | YES |
| BUNDLE-7 `bundle-31e474b9` (REQ-63, REQ-79, **REQ-84**) | free_and_reconciled | 2026-07-17…20 | REQ-63 typography/effect axes (→ AC-711…714). **REQ-84 deleted the semantic layout modules** — the ground for finding 1 | YES (retires) |
| BUNDLE-8 `bundle-cceaba25` (REQ-89, BUG-10) | free_and_reconciled | 2026-07-22/23 | REQ-89 quiet bootstrap + conditional Astro container (→ AC-738/739); BUG-10 painted-marker precondition (→ AC-711) | YES |
| **REQ-114** `request-3cd338cd` | **free_and_reconciled** | 2026-07-31 | **L1 palette colour model: literal base, palette overlay. Retired the palette-role alias from module colour fields — the ground for findings 2, 3, 6** | YES (retires) |
| BUNDLE-11 `bundle-ee56a66e` (BUG-27, **REQ-96**) | free_and_reconciled | 2026-07-25/26 | BUG-27 backdrop/lazy-media capture (→ AC-816). **REQ-96 forbids aesthetic values in a module `config`** — co-ground for finding 1 | YES (retires) |
| BUNDLE-16 `bundle-15c1f647` (REQ-44) | free_and_reconciled | 2026-07-03 (rec. 2026-08-07) | Per-command dependency preflight (→ AC-1013…AC-1017) | YES |
| REQ-72, REQ-73, REQ-76, BUG-16, BUG-22, BUG-24, BUG-25 | free_and_reconciled | 2026-07-18…25 | Reach **no story body**, therefore no AC can be expected. Filed at story level (REPORT-1721 findings 1–7); deliberately **not** re-filed here — see Notes | YES — see Notes |
| REQ-80, REQ-65, REQ-69 | abandoned | 2026-07-18/19 | Retired; correctly absent from every AC | NO |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| **STORY-75** `story-d5de22a5` — 14 ACs | REQ-58, REQ-63, REQ-91, BUG-10, BUG-15, BUG-27, REQ-96 | **aligned.** All eleven Description items covered, no orphan AC, no duplicate: item 1→AC-629 + AC-630; item 2→AC-631; item 3→AC-632 (width+colour) + AC-713 (line style + text-run thickest-painted side); item 4→AC-633; item 5→AC-711 (incl. the painted-marker precondition in full); item 6→AC-712 + AC-714 (`object-position`); item 7→AC-715; item 8→AC-815; item 9→AC-816 (all three exclusions + the both-edges definition of full-bleed); item 10→AC-817; item 11→AC-818 (incl. the accessible-name leg) |
| **STORY-76** `story-82eb6908` — 5 ACs | REQ-59, REQ-62; REQ-114, REQ-84/REQ-96 (retire) | **NOT aligned — 4 violations.** Item 1 cleanly covered by AC-634 + AC-635. Item 2's *Diffed* leg → AC-636 ✓; *Authored* leg → AC-637, whose **title** contradicts the story's own Out-of-scope and names a deleted module (finding 1) and whose **body** carries a colour model REQ-114 retired (finding 2); *Captured* leg → **no AC** (finding 4). AC-638 covers content-field validation but repeats the retired colour model on the accepted side (finding 3) |
| **STORY-77** `story-16f2793c` — 8 ACs | REQ-61, REQ-58 (ladder) | **aligned on the Description surface**, 1 warning on Technical Context. item 1→AC-639; item 2→AC-643; item 3's three fail-loud legs→AC-641 + AC-642 + AC-644; item 4→AC-647. AC-640 pins the no-`--size` legacy path; AC-645 pins vocabulary rejection. Deterministic per-width cell choice still unpinned (finding 5) |
| **STORY-78** `story-2c7069fe` — 9 ACs | REQ-61 | **aligned.** Every In-scope bullet has an AC: N-way table→AC-648 (carrying the join key); `--sizes`→AC-649; changed/steady + presence flips→AC-650 (incl. sub-pixel-jitter exclusion); occurrence alignment→AC-651; `--classify`→AC-652; `--json` + required `--ref`→AC-655; `--out`→AC-721; terminal-fails→AC-653 + AC-654 |
| **STORY-79** `story-e15a19ef` — 12 ACs | REQ-58, REQ-89, REQ-44, BUNDLE-7 plan item 9 | **aligned on coverage**, 1 warning on consistency. g1→AC-656 (both flag orders); g2→AC-657 + AC-658 + AC-659 (restore on the throwing path) + AC-738 (suppressed at source, either stream); g3→AC-720; g4→AC-739; g5→AC-1013 (resolution) + AC-1014 (drift as its own fault, both boundary shapes) + AC-1015 (both faults in one refusal) + AC-1016 (`ENVIRONMENT`, exit 6, `--json` envelope) + AC-1017 (per-verb gating, offline verbs never gated, set pinned whole). AC-738 inherits the story body's mis-classification of `values-diff` as non-rendering, which AC-1017 contradicts (finding 7) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-637 `acceptance_criterion-377af866` (STORY-76) — **title** | ac-edit | **Third cycle unrepaired** (REPORT-1327 finding 1, REPORT-1644 finding 1; AC body unchanged). Title reads "A **text-block** authored with a gradient panel renders a **padded, rounded** panel with that gradient surface" — contradicted three ways. (a) **Its story forbids it**: STORY-76 Out of scope reads "no module currently owns a padded/rounded/inset gradient-panel render" — the title asserts exactly that render. (b) **Its own body doesn't say it**: the Criterion describes only that an authored `gradient` value resolves to a `background-image: linear-gradient(...)` surface fill; the Verification calls `resolveSurfaceGradient` directly. No padding, no rounding, no module render. (c) **`text-block` no longer exists**: REQ-84 (BUNDLE-7, free_and_reconciled) deleted the semantic layout modules — verified this cycle: `packages/framework/src/modules/` holds only `carousel/` and `contact-form/` plus shared files, and the sole surviving mention is the tombstone comment at `packages/framework/src/modules/dials.ts:10` ("text-block panel, services-grid card chrome, …) are gone — layout is owned by" L1). The matrix advertises a gradient-panel render on a deleted module | Retitle to match the body and the story, e.g. **"An authored gradient value resolves via the shared resolver to a gradient surface fill; under-specified stops resolve to no fill"**. **Sequencing**: if STORY-76's authoring half is first marked superseded per REPORT-1721 finding 8, this AC becomes `ac-deprecate` instead — see Notes §2 |
| 2 | violation | consistency | AC-637 `acceptance_criterion-377af866` (STORY-76) — **Criterion + Verification** | ac-edit | The Criterion states "Each stop colour is resolved as either an absolute hex literal or a **palette-role alias (absolute-or-overlay)**", and the Verification prescribes asserting the resolver returns `background-image: linear-gradient(<direction>, <hex> 0%, **var(--color-<role>)** 100%)`. **REQ-114** `request-3cd338cd` (free_and_reconciled, 2026-07-31) retired the palette-role half — re-verified this cycle: `resolveColor` is `isColorLiteral(value) ? value : null` (`packages/framework/src/modules/text-style.ts:165-167`, whose doc comment reads "REQ-114 — a module colour is a `#hex` literal, full stop"), and `gradientImage` **drops the whole gradient** on any non-literal stop (`text-style.ts:198-201`: `if (!color) return ''`, documented at `:190-193` as "a partial sweep would paint a colour the author never chose"). The AC's prescribed assertion cannot pass against live code. Its own UAT already documents the deviation instead of following the AC — `tests/req62-gradient-panel.test.ts:81` asserts hex-only stops, and `tests/reconciliation-l1-one-colour-system.test.ts:180` asserts a role-valued stop returns `''`. A UAT diverging from its AC's Verification is the drift signal, not a fix | Replace "absolute hex literal or a palette-role alias (absolute-or-overlay)" with a `#hex` literal only, and add the REQ-114 consequence: a non-literal stop drops the whole gradient. Rewrite the Verification to assert the hex-only declaration plus the non-literal-drops-all case, matching `tests/req62-gradient-panel.test.ts:81-87` and `tests/reconciliation-l1-one-colour-system.test.ts:180-183` |
| 3 | violation | consistency | AC-638 `acceptance_criterion-a657c39c` (STORY-76) | ac-edit | Same retired colour model, on the *validation* side and in the opposite direction: the Criterion says the gradient content field "**accepts** a well-formed gradient object — … each stop colour an absolute hex **or a palette-role alias** — producing no validation error". Under REQ-114 a role-alias stop is **rejected** — re-verified this cycle: `validateGradient` routes every stop through `validateColor` (`packages/framework/src/modules/validate.ts:130-134`), which errors on anything that is not a `#hex` literal (`validate.ts:100-107`, whose own comment reads "REQ-114 removed the palette-role alias"). Corroborated by `tests/reconciliation-l1-one-colour-system.test.ts:162-167`, which asserts a role-valued colour field **fails** content validation naming the field. The AC advertises as accepted precisely the value the validator rejects | Narrow the accepted stop-colour form to a `#hex` literal, and move the role alias to the rejected side alongside the string/number cases already listed. Direction is unaffected — `validate.ts:117-125` still accepts a degrees number or a direction alias, exactly as the AC says |
| 4 | violation | coverage | STORY-76 `story-82eb6908` — item 2, "**Captured**" leg | ac-add | **Third cycle unrepaired** (REPORT-1327 finding 2, REPORT-1644 finding 4). STORY-76's In-scope line declares "**capture** of stop positions and surface gradients", and item 2's first sub-bullet states a specific, non-obvious selection rule: "the nearest painting ancestor's surface gradient is recorded, **skipping a text-fill gradient** and **stopping at the first opaque solid**". **No AC covers it.** AC-636 covers only the *diff* (it presupposes "a reference run sits on a panel/card whose surface is a gradient" without pinning how that surface was selected); AC-634/635 are the text-fill stop-position axis; AC-637/638 are the authoring side. The rule is live and each clause is discrete in code — `surfaceGradientOf` at `tools/generate/src/cli/capture/extract.ts:841-850`: tightest-first chain walk, `clip !== 'text'` skip, `c[3] >= 0.999 → return null` opaque stop, `return null` when no gradient ancestor. It is the one place the capture can be silently wrong in a way the diff cannot detect — pick the wrong ancestor and both sides agree on a value that is not what paints | Author an AC for the surface-gradient capture rule, with all four clauses: for a run inside nested painting ancestors the recorded surface gradient is the nearest painting ancestor's; a `background-clip: text` gradient on an ancestor is skipped rather than recorded as the surface; the walk stops at the first opaque solid so a gradient hidden behind it records none; a run with no gradient ancestor records none |
| 5 | warning | coverage | STORY-77 `story-16f2793c` (Technical Context) | ac-add | **Carried from REPORT-1327 finding 3 / REPORT-1644 finding 5.** Technical Context states "a single **deterministic** reference cell is chosen per width (prefer the primary engine at rest)". No AC pins it: AC-639 asserts the reference values come from the ladder at the selected width but not that the choice among candidate cells at that width is deterministic or engine-preferring. A non-deterministic choice makes `--size` diffs flaky in a way every other AC would report clean. Warning rather than violation — it sits in Technical Context, not the story's In-scope Description | Either add an AC pinning per-width cell selection (same bundle + same width → same reference cell; the primary engine's at-rest cell preferred when several are present), or drop the claim from Technical Context if the ladder in practice carries exactly one cell per width |
| 6 | warning | consistency | STORY-76 `story-82eb6908` (body, item 2 "Authored" bullet + Technical Context bullet 2) | story-body-edit | The root of findings 2 and 3 lives one level up. Item 2's Authored bullet reads "Each stop colour is an absolute hex literal or a **palette-role alias (absolute-or-overlay)**", and Technical Context bullet 2 reinforces it: "The gradient's stop colours resolve **literal-or-role** identically to the value system's colour dial, an instance of the 'absolute values are the base; a palette is a design overlay' mandate". Because AC and story agree here, this is not an AC-vs-story inconsistency — it is a stale claim both levels inherit from pre-REQ-114 intent. Filed at this level so the editor repairs body and ACs in one pass rather than "fixing" the ACs into disagreement with their story | Update both places to `#hex`-literal stops, noting REQ-114 moved the palette overlay into L1 (a role resolves to a literal before any module resolver sees it) and that a non-literal stop drops the whole gradient. Findings 2 and 3 then follow the body |
| 7 | warning | consistency | AC-738 `acceptance_criterion-c7e51d45` (STORY-79) + STORY-79 body, guarantee 2 | story-body-edit + ac-edit | **New this cycle.** STORY-79's guarantee 2 classifies `values-diff` and `capture` as "the commands that **never render** (`help`, `list`, `repro`, `l1-gate`, `capture`, `values-diff`)", and AC-738 restates the same six-verb list. `values-diff` does render: guarantee 2's own opening paragraph says so ("The in-process Astro/Vite render emits diagnostics"), and `tools/generate/src/cli/stdio.ts:4-5` states "The values-diff commands render the draft through an in-process Astro container, which boots Vite". Its sibling **AC-1017** flatly contradicts the classification, listing `values-diff` and `capture` among "the browser-driving verbs" and the never-gated offline set as `render`, `serve`, `builder`, `repro`, `refold`, `l1-gate`, `responsive-diff`. AC-738's phrasing ("commands that never render a site as well as those that do — …") is ambiguous enough to survive on a charitable reading, which is why this is a warning and not a violation; the story body's parenthetical is not | In STORY-79 guarantee 2, split the list: `help`, `list`, `repro`, `l1-gate` never render; `capture` and `values-diff` do drive a browser/render and are included because the suppression is unconditional, not because they are offline. Mirror the split into AC-738's sentence so it cannot be read against AC-1017 |

## Notes for the Editor

**1. Fix findings 1–4 and 6 together, in one pass over STORY-76.** All five are the
same story's item 2. Findings 1, 2 and 6 are two edits to one AC plus its story
bullet and its Technical Context bullet; do them as a unit or the AC and its story
will disagree again.

**2. Sequencing against the open story-level finding.** This cycle's story-level
report (`report-a5db24c3` / REPORT-1721, FAIL, 8 violations) carries **finding 8**:
STORY-76 still presents its gradient *authoring* half as live, while CAP-63's body
(rewritten 2026-08-08 by overlap cluster 4) records that REQ-84 / REQ-96 superseded
it — `resolveSurfaceGradient` (`packages/framework/src/modules/text-style.ts:223`)
has **zero production callers**, verified again this cycle: the only importers are
`tests/req62-gradient-panel.test.ts:9` and
`tests/reconciliation-l1-one-colour-system.test.ts:33`, and the two exports at
`packages/framework/src/index.ts:33` / `modules/index.ts:9`. That finding is
unrepaired, so at this level the story body remains the working reference and
AC-637 is an `ac-edit`. **If the story-level repair lands first**, AC-637 becomes
`ac-deprecate` (superseded legacy authoring path) and finding 1's retitle is moot —
but findings 2 and 3 still need doing either way, because AC-638's validator
behaviour is live production code (`validate.ts:130-134`) regardless of whether any
shipped module declares a `gradient` field. None currently does: `gradient` exists
as a content-field type (`modules/types.ts:43`, `validate.ts:195`) but neither
`carousel` nor `contact-form` declares one.

**3. Findings 1 and 4 are on their third cycle unrepaired.** Filed 2026-08-05
(REPORT-1327) and 2026-08-07 (REPORT-1644). The `updated_at` bump on all 48 ACs at
2026-08-07T23:11–23:12Z is the `uat_coverage` stamping pass, not a content edit —
AC-637's title and AC-638's Criterion are byte-identical to what REPORT-1644 quoted.
**Whatever fix pass has been running against this capability is not reaching
STORY-76's ACs at all.** Verify the edits actually land before re-running this
check; a sixth identical report is not new information.

**4. The story-level coverage gaps are deliberately not re-filed here.**
REPORT-1721 findings 1–7 (REQ-73 `gap` axis, BUG-22 split-control attribution,
BUG-24 band-overlay across modern colour syntax, BUG-25 per-text-node run geometry,
BUG-16 offline re-extract mirrored references, REQ-72 in-browser gradient
hexification, REQ-76 cause clustering) name behaviour that appears in **no story
body** — latest story `updated_at` is STORY-79 at 2026-08-07T03:22Z, ~23h before
that report. AC-level coverage is measured against the story body, so no AC can be
expected for them yet. Each becomes an `ac-add` once the story bodies are repaired;
the AC surface of STORY-75 and STORY-76 in particular will need to grow. **Re-run
the ac level after the story-level fixes land.**

**5. Cross-cutting pattern: REQ-114 fallout is under-propagated.** The
"absolute-or-overlay" / "literal-or-role" phrasing (findings 2, 3, 6) is a
pre-REQ-114 formulation that survived in this capability's gradient tree because
REQ-114 was reconciled against the L1 colour capability, not this one. Production
code and its tests were updated; the matrix was not. Worth a grep for
`absolute-or-overlay`, `palette-role alias` and `literal-or-role` across other
capabilities' ACs before closing this out.

**6. No `code-issue` findings.** Every finding is the matrix mis-describing or
under-describing working code, never code failing to do what the matrix says.

**7. What is genuinely clean, so the editor does not churn it.** STORY-75's 14 ACs
cover all eleven Description items with no orphan and no duplicate; STORY-78's 9
cover every In-scope bullet; STORY-79's coverage is complete including the five
REQ-44 preflight ACs. Exclusivity was checked within each story and no two ACs
describe the same criterion — the near pairs (AC-632/AC-713 box border,
AC-657/AC-658 stdout hygiene, AC-1013/AC-1015 preflight faults) are each a distinct
axis or a distinct failure combination, not duplicates.
