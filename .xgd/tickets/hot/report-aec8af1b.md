---
uid: report-aec8af1b
id: REPORT-2097
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=ac)'
created_by: xgd
created_at: '2026-08-16T09:06:20.544948+00:00'
updated_at: '2026-08-16T09:06:20.544948+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: ac
  violations: 3
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: ac

**Result**: FAIL
**Violations**: 3
**Warnings**: 2
**Needs review**: 0

Four of this capability's five stories are clean at this level. Every finding below
sits on **STORY-76** (`story-82eb6908`), the gradient story, except two warnings.

**What changed since the previous ac cycle** (`report-15f4892f` / 2026-08-09T02:09,
FAIL 4v/3w): **AC-637 has been deprecated** (`fields.lifecycle: deprecated`,
`fields.uat_coverage: deprecated`), which resolves that report's findings 1 and 2 —
both were on AC-637's title and Criterion. That is the first repair to land on this
capability's AC surface in four cycles, and it is the correct one: `resolveSurfaceGradient`
has **zero production callers** (re-verified below).

**What has not changed**: no other AC has been edited. All 48 ACs carry
`last_field_updated: uat_coverage` with `updated_at` 2026-08-09T02:54–02:55 — a field
write, not a content edit. All five story bodies carry the same stamp. None of the four
files cited below has changed since the previous cycle either (`validate.ts` and
`text-style.ts` last touched 2026-07-31 `b20671ee6`; `extract.ts` and `values-diff.ts`
2026-07-25 `3d35dec43`). Every finding was therefore re-verified at its cited
`file:line` against the current tree rather than inherited.

**Finding 3 is new** and is the direct consequence of AC-637's deprecation: the
deprecation landed on the AC but not on the story bullet it answered, so STORY-76 now
declares a live authoring half whose sole AC is deprecated.

## Cumulative Intent Considered

At `ac` level the story body is the working reference; intent is consulted only where a
story body is itself inconsistent (finding 3) or where an AC asserts behaviour that live
production code contradicts (finding 1). The rows below are the subset of this
capability's ledger that is load-bearing for the findings — the full chronological ledger
is in this cycle's story-level report `report-667d82f8`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-59 (`bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-13 | Capture text-fill gradient stop positions | YES |
| REQ-61 (`bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-16 | `--size` on both diff commands; `responsive-diff` N-way analysis | YES |
| REQ-62 (`bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-16 | Panel/surface gradient: capture + render + diff | YES |
| REQ-84 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-20 | Framework pivot C: delete the semantic layout modules | YES (retires) |
| REQ-89 (`bundle-cceaba25`) | free_and_reconciled | 2026-07-23 | Silence 'Missing pages directory'; Astro container on demand | YES |
| REQ-96 (`bundle-ee56a66e`) | free_and_reconciled | 2026-07-26 | Behavior modules layout-agnostic; `config` never aesthetic | YES (retires) |
| **REQ-114** (`request-3cd338cd`) | **free_and_reconciled** | **2026-07-31** | **L1 palette colour model — retires the module-level palette-role alias; a module colour is a `#hex` literal** | **YES (retires)** |

REQ-114 is the pivotal row for finding 1. It was reconciled against the L1 colour
capability, not this one, which is why its consequences never propagated into this
capability's gradient ACs.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-75 (`story-d5de22a5`) — 14 ACs | REQ-58, REQ-63, REQ-91, BUG-10, BUG-15, BUG-27, REQ-96 | **aligned at this level.** All eleven Description items are covered, including the non-obvious sub-rules: the painted-marker precondition (AC-711), the three backdrop exclusions and the full-bleed definition (AC-816), the clamp and its off-canvas case (AC-815), and the accessible-name leg of the invariant exclusion (AC-818). No orphan AC, no duplicate |
| STORY-76 (`story-82eb6908`) — 5 ACs (1 deprecated) | REQ-59, REQ-62; **not** reconciled against REQ-84 / REQ-96 / REQ-114 | **3 violations** — findings 1, 2, 3 |
| STORY-77 (`story-16f2793c`) — 8 ACs | REQ-61 (size-aware half), REQ-58 (ladder as input) | aligned on all four In-scope bullets; one Technical Context claim unpinned (warning 4) |
| STORY-78 (`story-2c7069fe`) — 9 ACs | REQ-61 (cross-size half) | **aligned.** Each of the eight In-scope bullets maps to exactly one AC (table→AC-648, `--sizes`→AC-649, join-key/repeat alignment→AC-651, changed-vs-steady + presence flips→AC-650, `--classify`→AC-652, `--json`/`--ref`→AC-655, `--out`→AC-721, the two terminal-fails→AC-653/AC-654). No gap, no duplicate |
| STORY-79 (`story-e15a19ef`) — 12 ACs | REQ-58, REQ-78, REQ-89, REQ-44 | aligned; all five guarantees covered (g1→AC-656, g2→AC-657/658/659/738, g3→AC-720, g4→AC-739, g5→AC-1013…1017). One phrasing carry-over (warning 5) |
| AC-637 (`acceptance_criterion-377af866`) | REQ-62, superseded by REQ-84 / REQ-96 | **correctly deprecated this cycle** — resolves `report-15f4892f` findings 1 and 2 |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-638 `acceptance_criterion-a657c39c` (STORY-76) | ac-edit | **Fourth cycle unrepaired** (`report-728bd245`, `report-cb7ea283`, `report-15f4892f` finding 3; AC body byte-unchanged, `updated_at` 2026-08-09T02:55:12 with `last_field_updated: uat_coverage`). The Criterion advertises as **accepted** exactly the value the validator **rejects**: "each stop colour an absolute hex **or a palette-role alias** — producing no validation error". **REQ-114** (`request-3cd338cd`, free_and_reconciled, 2026-07-31) retired the module-level palette-role alias. Re-verified at HEAD: `validateGradient` routes every stop through `validateColor` (`packages/framework/src/modules/validate.ts:130-134`), and `validateColor` errors on anything failing `isColorLiteral` (`validate.ts:100-106`), its doc comment reading "REQ-114 removed the palette-role alias — colour is the L1 palette model's now (DOC-23 §5)". Corroborated by `tests/reconciliation-l1-one-colour-system.test.ts:161-167`, which asserts a role-valued colour field **fails** content validation naming the field. This AC is **not** made moot by AC-637's deprecation: the gradient content-field type is live production code — `validate.ts:195` dispatches `spec.type === 'gradient'`, `modules/types.ts:43` declares it — even though neither shipped module (`carousel/`, `contact-form/`) currently declares such a field | Narrow the accepted stop-colour form to a `#hex` literal only, and move the palette-role alias to the rejected side alongside the string/number cases already listed. Leave the direction clause untouched — `validate.ts:117-125` still accepts a degrees number or a direction alias exactly as the AC says |
| 2 | violation | coverage | STORY-76 `story-82eb6908` — Description item 2, the "**Captured**" sub-bullet | ac-add | **Fourth cycle unrepaired** (`report-728bd245`, `report-cb7ea283`, `report-15f4892f` finding 4). STORY-76's In-scope line declares "**capture** of stop positions and surface gradients", and item 2's first sub-bullet states a specific, non-obvious four-clause selection rule: "the nearest painting ancestor's surface gradient is recorded, **skipping a text-fill gradient** and **stopping at the first opaque solid**". **No AC covers it.** AC-636 covers only the *diff*, presupposing "a reference run sits on a panel/card whose surface is a gradient" without pinning how that surface was selected; AC-634/635 are the text-fill stop-position axis; AC-638 is the validation side; AC-637 is deprecated. Re-verified live at HEAD — `surfaceGradientOf`, `tools/generate/src/cli/capture/extract.ts:840-850`: tightest-first chain walk over `surfaceChainWithSelf`, `clip !== 'text'` skip, `c[3] >= 0.999 → return null` opaque stop, and `return null` when no gradient ancestor is found. This is the one place the capture can be silently wrong in a way the diff **cannot** detect: pick the wrong ancestor and both sides agree on a value that is not what paints, so the gate reports clean on a wrong render — the exact failure mode this capability exists to close | Author one AC for the surface-gradient capture selection rule, covering all four clauses: (a) for a run inside nested painting ancestors the recorded surface gradient is the **nearest** ancestor's; (b) an ancestor's `background-clip: text` gradient is **skipped** rather than recorded as the surface; (c) the walk **stops at the first opaque solid**, so a gradient hidden behind it records none; (d) a run with no gradient ancestor records none |
| 3 | violation | consistency | STORY-76 `story-82eb6908` — Description item 2 "**Authored**" sub-bullet, the In-scope line, and Technical Context bullet 2 | story-body-edit | **New this cycle**, created by the (correct) deprecation of AC-637. The story body still declares the gradient **authoring** half live in two places — In-scope: "the standalone gradient content-field value **and the shared resolver that authors it into a surface fill**"; item 2 Authored: the resolver produces "a panel/card `background-image: linear-gradient(...)` surface fill". Its sole AC, **AC-637** (`acceptance_criterion-377af866`), now carries `fields.lifecycle: deprecated`. The resolver leg of the story therefore has **zero active ACs**. The deprecation is the well-founded side: `resolveSurfaceGradient` (`packages/framework/src/modules/text-style.ts:223`) has **zero production callers** — re-verified at HEAD, the only references are the two re-exports (`packages/framework/src/index.ts:33`, `modules/index.ts:9`) and two test imports (`tests/req62-gradient-panel.test.ts:9`, `tests/reconciliation-l1-one-colour-system.test.ts:33`) — and CAP-63's own Scope records this surface as "the legacy *module content-field* gradient and its shared `resolveSurfaceGradient` resolver, which the REQ-84 / REQ-96 pivot superseded and which the L1 renderer never calls". Technical Context bullet 2 carries the same stale premise in its "literal-or-role" phrasing, retired by REQ-114 | Mark STORY-76's authoring half **superseded** in the body, matching CAP-63's Scope and AC-637's deprecation: the resolver is retained as legacy, has no production caller, and the L1 renderer never invokes it. Drop the "literal-or-role"/"absolute-or-overlay" phrasing from item 2 and Technical Context bullet 2 (REQ-114 moved the palette overlay into L1; a role resolves to a literal before any module resolver sees it). **Do NOT author a replacement AC for the resolver** — AC-637's deprecation is correct and this repair makes the story follow it. The *validation* half stays live and keeps AC-638 (see finding 1) |
| 4 | warning | coverage | STORY-77 `story-16f2793c` — Technical Context | ac-add | **Carried from `report-728bd245` / `report-cb7ea283` / `report-15f4892f` finding 5.** Technical Context claims "a single **deterministic** reference cell is chosen per width (prefer the primary engine at rest)". No AC pins it: AC-639 asserts the reference values come from the ladder at the selected width, but not that the choice *among candidate cells at that width* is deterministic or engine-preferring. Grounded in live code — `tools/generate/src/cli/capture/values-diff.ts:2709-2720` implements exactly that ordered preference ("prefer Chromium at rest (the capture's primary cell), then any engine at rest, then whatever"). A non-deterministic choice would make `--size` diffs flaky in a way every other AC reports clean. Warning rather than violation because the claim sits in Technical Context, not the story's In-scope Description | Either add an AC pinning per-width cell selection (same bundle + same width → same reference cell; the primary engine's at-rest cell preferred when several are present, with the documented fallback order), or drop the claim from Technical Context if the ladder in practice carries exactly one cell per width |
| 5 | warning | consistency | AC-738 `acceptance_criterion-c7e51d45` (STORY-79) + STORY-79 body, guarantee 2 | ac-edit + story-body-edit | **Carried from `report-15f4892f` finding 7; unrepaired.** STORY-79's guarantee 2 classifies `values-diff` and `capture` as "the commands that **never render** (`help`, `list`, `repro`, `l1-gate`, `capture`, `values-diff`)", and AC-738 restates the same six-verb list. `values-diff` does render: guarantee 2's own opening paragraph says so, and `tools/generate/src/cli/stdio.ts:4-5` states "The values-diff commands render the draft through an in-process Astro container, which boots Vite" (re-verified at HEAD). Its sibling **AC-1017** flatly contradicts the classification, listing `capture` and `values-diff` among "the browser-driving verbs" and naming the never-gated offline set as `render`, `serve`, `builder`, `repro`, `refold`, `l1-gate`, `responsive-diff`. AC-738's phrasing ("the commands that never render a site as well as those that do — …") survives on a charitable reading of the list as covering both groups, which is why this stays a warning; the story body's parenthetical does not | In STORY-79 guarantee 2, split the list: `help`, `list`, `repro`, `l1-gate` never render; `capture` and `values-diff` do drive a browser/render and are included because the suppression is unconditional, not because they are offline. Mirror the split into AC-738's sentence so it cannot be read against AC-1017 |
| 6 | info | — | AC-637 `acceptance_criterion-377af866` (STORY-76) | — | **Resolved this cycle.** `report-15f4892f` findings 1 and 2 (the "text-block … padded, rounded panel" title naming a module REQ-84 deleted, and the Criterion's palette-role stop resolution) were both on AC-637, which now carries `fields.lifecycle: deprecated` / `fields.uat_coverage: deprecated`. Recorded here so a future cycle does not re-file them against a deprecated element. The follow-through at the story level is finding 3 | none |
| 7 | info | — | STORY-75, STORY-78 | — | Checked in full this cycle and clean on all three properties — recorded so the editor does not churn them. STORY-75's 14 ACs cover all eleven Description items with no orphan and no duplicate; the near pair AC-632/AC-713 is two distinct legs of the border axis (base width+colour vs line style + text-run capture via the thickest painted side), not a duplicate. STORY-78's 9 ACs cover its eight In-scope bullets one-to-one | none |

## Notes for the Editor

**1. Findings 1, 2 and 3 are one pass over STORY-76.** All three sit on Description
item 2. Do finding 3 (story body) **before or with** finding 1 (AC-638), or the AC and
its story will disagree again — the body's "absolute-or-overlay" phrasing is the same
stale REQ-114 premise the AC carries. Finding 2 is independent and additive.

**2. `report-15f4892f`'s warning 6 is subsumed by finding 3.** That warning asked for
the "literal-or-role" phrasing to be corrected in STORY-76's body; finding 3's edit
removes it as part of marking the authoring half superseded. It is not re-filed
separately.

**3. The story-level coverage gaps are deliberately not re-filed here.** This cycle's
story-level report `report-667d82f8` (FAIL, 9 violations) names behaviour — REQ-73's
`gap` axis, BUG-22 split-control attribution, BUG-24 band-overlay across modern colour
syntax, BUG-25 per-text-node run geometry, BUG-16 offline re-extract, REQ-72 in-browser
gradient hexification, REQ-76 cause clustering, and the `--multi-viewport` diff mode —
that appears in **no story body**. AC-level coverage is measured against the story body,
so no AC can be expected for them yet. Each becomes an `ac-add` once the story bodies
are repaired; STORY-75's and STORY-76's AC surfaces will both need to grow.
**Re-run the ac level after the story-level fixes land.**

**4. The fix pass is now reaching this capability, but narrowly.** Three cycles
(2026-08-05, 08-07, 08-09) landed nothing on the AC surface; this cycle landed exactly
one change (AC-637's deprecation) and left its story bullet behind. Findings 1 and 2 are
now on their **fourth** identical filing. Before re-running this check, verify the edits
actually land — a fifth identical report is not new information.

**5. Cross-cutting: REQ-114 fallout remains under-propagated.** The
"absolute-or-overlay" / "literal-or-role" formulation (findings 1 and 3) is pre-REQ-114
and survived here because REQ-114 was reconciled against the L1 colour capability, not
this one — production code and its tests were updated, the matrix was not. Worth a grep
for `absolute-or-overlay`, `palette-role alias` and `literal-or-role` across other
capabilities' ACs before closing this out.

**6. No `code-issue` findings.** Every finding is the matrix mis-describing or
under-describing working code, never code failing to do what the matrix says.
