---
uid: report-cb7ea283
id: REPORT-1644
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=ac)'
created_by: xgd
created_at: '2026-08-07T22:51:53.932182+00:00'
updated_at: '2026-08-07T22:51:53.932182+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: ac
  violations: 4
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: ac

**Result**: FAIL
**Violations**: 4
**Warnings**: 2
**Needs review**: 0

Scope: the 48 distinct ACs hanging off the five stories of `capability-aa030c83`
(CAP-63) — STORY-75 (14), STORY-76 (5), STORY-77 (8), STORY-78 (9), STORY-79 (12).
All five stories are `feature`/`upgrade`, so all are in the Capability Matrix and
all are expected to carry ACs; none is task-like.

Per the level cascade, **story bodies are the working reference**. Intent was
consulted only where a story body was itself stale or ambiguous — which happened
in exactly one place, STORY-76's gradient-stop colour model (findings 2, 3, 6).

**All four violations land on STORY-76** (`story-82eb6908`, gradients). Three are
the same AC (AC-637) drifting in two independent directions, plus its sibling
AC-638 carrying half the same drift; the fourth is item 2's *Captured* leg still
having no AC. **STORY-75, STORY-77, STORY-78 and STORY-79 are clean at this
level** — including STORY-75's four new closures (band extent, backdrops,
background-image axis, module-invariant exclusion) and STORY-79's new guarantee 5
(dependency preflight), both of which arrived after the last ac-level pass and
are fully covered.

Findings 1 and 4 are **carried forward unrepaired** from `report-728bd245`
(REPORT-1327, 2026-08-05, findings 1 and 2). Neither AC-637 nor STORY-76's AC set
has been touched since 2026-08-05T23:13Z. Findings 2, 3 and 6 are new to this
pass.

## Cumulative Intent Considered

Condensed from the ledger established at story level this cycle
(`report-f150ba1e` / REPORT-1643), narrowed to the intents that bear on AC-level
findings. Nothing at this level required re-deriving the full chronology.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 `bundle-ab9e0cb6` (REQ-58, REQ-59, REQ-61, REQ-62) | free_and_reconciled | 2026-07-17 | `intent_uid` of all five stories. REQ-59 gradient stop positions (→ AC-634/635); REQ-62 panel gradient capture + render + diff (→ AC-636/637/638 + finding 4); REQ-61 `--size` + `responsive-diff` | YES |
| BUNDLE-7 `bundle-31e474b9` (REQ-63, REQ-79, REQ-82/83/84) | free_and_reconciled | 2026-07-22 | REQ-63 typography/effect axes (→ AC-711/712/713/714). **REQ-79/84 framework pivot retired the semantic layout modules** — the ground for finding 1 | YES |
| BUNDLE-8 `bundle-cceaba25` (REQ-89, BUG-10) | free_and_reconciled | 2026-07-29 | REQ-89 quiet bootstrap + conditional Astro container (→ AC-738/739); BUG-10 painted-marker precondition (→ AC-711) | YES |
| **REQ-114** `request-3cd338cd` | **free_and_reconciled** | 2026-07-31 | **L1 palette colour model: literal base, palette overlay. Retired the palette-role alias from module colour fields — the ground for findings 2, 3, 6** | YES (retires) |
| BUNDLE-11 `bundle-ee56a66e` (BUG-27) | free_and_reconciled | 2026-08-05 | Capture-side backdrop/lazy-media ask (→ AC-816) | YES |
| BUNDLE-16 `bundle-15c1f647` (REQ-44) | free_and_reconciled | 2026-08-07 | Per-command dependency preflight (→ AC-1013…AC-1017) | YES |
| REQ-73, REQ-76, BUG-16, BUG-22, BUG-24, BUG-25 | free_and_reconciled | 2026-07-18…25 | Reach no story body, therefore no AC can be expected. **Escalated at story level** (REPORT-1643 findings 2, 3, 5, 6, 7, 8); not re-filed here — see Notes | YES — see Notes |
| REQ-80 `request-7756b2e8`, REQ-65, REQ-69 | abandoned | 2026-07-18/19 | Retired; correctly absent from every AC | NO |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| **STORY-75** `story-d5de22a5` — 14 ACs | REQ-58, REQ-63, REQ-79, BUG-10, BUG-27 | **aligned.** All eleven Description items covered with no orphan AC: item 1→AC-629 + AC-630; item 2→AC-631; item 3→AC-632 (width+colour) + AC-713 (line style + text-run thickest-painted side); item 4→AC-633; item 5→AC-711 (incl. the painted-marker precondition in full); item 6→AC-712 + AC-714 (`object-position`); item 7→AC-715; item 8→AC-815; item 9→AC-816 (all three exclusions + the both-edges definition of full-bleed); item 10→AC-817; item 11→AC-818 (incl. the accessible-name leg). The four new ACs (AC-815…818) close the gap the 2026-08-06 story edit opened |
| **STORY-76** `story-82eb6908` — 5 ACs | REQ-59, REQ-62, REQ-114 (retires) | **NOT aligned — 4 violations.** Item 1 cleanly covered by AC-634 + AC-635. Item 2's *Diffed* leg → AC-636 ✓; *Authored* leg → AC-637, whose **title** contradicts the story's own Out-of-scope and names a deleted module (finding 1) and whose **body** carries a colour model REQ-114 retired (finding 2); *Captured* leg → **no AC** (finding 4). AC-638 covers the content-field validation but repeats the retired colour model (finding 3) |
| **STORY-77** `story-16f2793c` — 8 ACs | REQ-61, REQ-58 (ladder) | **aligned on the Description surface**, 1 warning on Technical Context. item 1→AC-639; item 2→AC-643; item 3's three fail-loud legs→AC-641 + AC-642 + AC-644; item 4→AC-647. AC-640 pins the no-`--size` legacy path; AC-645 pins vocabulary rejection. Deterministic per-width cell choice still unpinned (finding 5, carried from REPORT-1327 finding 3) |
| **STORY-78** `story-2c7069fe` — 9 ACs | REQ-61 | **aligned.** Every In-scope bullet has an AC: N-way table→AC-648 (carrying the join key); `--sizes`→AC-649; changed/steady + presence flips→AC-650 (incl. sub-pixel-jitter exclusion); occurrence alignment→AC-651; `--classify`→AC-652; `--json` + required `--ref`→AC-655; `--out`→AC-721; terminal-fails→AC-653 + AC-654 |
| **STORY-79** `story-e15a19ef` — 12 ACs | REQ-58, REQ-79, REQ-89, **REQ-44** | **aligned.** g1→AC-656 (both flag orders); g2→AC-657 + AC-658 + AC-659 (restore on the throwing path) + AC-738 (suppressed at source, either stream, incl. non-rendering verbs); g3→AC-720; g4→AC-739; **g5→AC-1013** (resolution) + **AC-1014** (drift as its own fault, incl. both boundary shapes) + **AC-1015** (both faults in one refusal) + **AC-1016** (`ENVIRONMENT`, exit 6, `--json` envelope) + **AC-1017** (per-verb gating + offline verbs never gated + the set pinned as a whole). Guarantee 5 arrived 2026-08-07 with its ACs; no gap |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-637 `acceptance_criterion-377af866` (STORY-76) — **title** | ac-edit | **Carried forward unrepaired from REPORT-1327 finding 1** (AC untouched since 2026-08-05T23:13:02Z). The title reads "A **text-block** authored with a gradient panel renders a **padded, rounded** panel with that gradient surface" — contradicted three ways. (a) **Its story forbids it**: STORY-76 Out of scope reads "homing the resolved gradient surface fill as an authored render on a specific module (… *no module currently owns a padded/rounded/inset gradient-panel render*)" — the title asserts exactly the render the story disclaims. (b) **Its own body doesn't say it**: the Criterion describes only that an authored `gradient` value resolves to a `background-image: linear-gradient(...)` surface fill; the Verification calls `resolveSurfaceGradient` directly. No padding, no rounding, no module render. (c) **`text-block` no longer exists**: REQ-79/REQ-84 (BUNDLE-7, free_and_reconciled) removed the semantic layout modules — `packages/framework/src/modules/dials.ts:10` states "text-block panel, services-grid card chrome, …) are gone — layout is owned by" L1; `packages/framework/src/modules/` holds only `carousel/` and `contact-form/`, and no `text-block` module file exists. The matrix advertises a gradient-panel render on a deleted module | Retitle to match the body and the story, e.g. **"An authored gradient value resolves via the shared resolver to a gradient surface fill; under-specified stops resolve to no fill"**. Do NOT deprecate — the resolver behaviour is live (`packages/framework/src/modules/text-style.ts:223`) and is reconciled REQ-62 intent |
| 2 | violation | consistency | AC-637 `acceptance_criterion-377af866` (STORY-76) — **Criterion + Verification** | ac-edit | The Criterion states "Each stop colour is resolved as either an absolute hex literal or a **palette-role alias (absolute-or-overlay)**", and the Verification prescribes asserting the resolver returns `background-image: linear-gradient(<direction>, <hex> 0%, **var(--color-<role>)** 100%)`. **REQ-114** `request-3cd338cd` (free_and_reconciled, 2026-07-31) retired the palette-role half: `resolveColor` is now literal-only (`packages/framework/src/modules/text-style.ts:165-167`) and `gradientImage` **drops the whole gradient** when any stop is not a `#hex` literal (`text-style.ts:195-207`, comment at `:190-193`). The AC's prescribed assertion cannot pass against live code. The AC's own UAT already documents the deviation rather than following the AC: `tests/req62-gradient-panel.test.ts:75-82` carries the comment "REQ-114 — the literal-or-alias stop is now literal-only" and asserts hex-only stops. A UAT diverging from its AC's Verification with an explanatory comment is the drift signal, not a fix | Replace "absolute hex literal or a palette-role alias (absolute-or-overlay)" with a `#hex` literal only, and add the REQ-114 consequence: a stop that is not a literal drops the whole gradient (a partial sweep would paint a colour the author never chose). Rewrite the Verification to assert the hex-only declaration and the non-literal-drops-all case, matching `tests/req62-gradient-panel.test.ts:81-87` and `tests/reconciliation-l1-one-colour-system.test.ts:180-183` |
| 3 | violation | consistency | AC-638 `acceptance_criterion-a657c39c` (STORY-76) | ac-edit | Same retired colour model, on the *validation* side and in the opposite direction: the Criterion says the gradient content field "**accepts** a well-formed gradient object — … each stop colour an absolute hex **or a palette-role alias** — producing no validation error". Under REQ-114 a role-alias stop is now **rejected**: `validateGradient` routes every stop through `validateColor` (`packages/framework/src/modules/validate.ts:130-134`), which errors on anything that is not a `#hex` literal (`validate.ts:101-107`, whose own comment reads "REQ-114 removed the palette-role alias"). Corroborated by `tests/reconciliation-l1-one-colour-system.test.ts:162-167`, which asserts a role-valued colour field **fails** content validation naming the field. So the AC currently advertises as accepted precisely the value the validator rejects | Narrow the accepted stop-colour form to a `#hex` literal, and move the role alias to the rejected side (it is now a malformed value, alongside the string/number cases already listed). Direction (`angleDeg` degrees literal or direction alias) is unaffected — `validate.ts:117-125` still accepts both |
| 4 | violation | coverage | STORY-76 `story-82eb6908` — item 2, "**Captured**" leg | ac-add | **Carried forward unrepaired from REPORT-1327 finding 2.** STORY-76's In-scope line declares "**capture** of stop positions and surface gradients", and item 2's first sub-bullet states a specific, non-obvious selection rule: "the nearest painting ancestor's surface gradient is recorded, **skipping a text-fill gradient** and **stopping at the first opaque solid** (a gradient hidden behind an opaque fill never shows, so it is not the surface)". **No AC covers it.** AC-636 covers only the *diff* (it presupposes "a reference run sits on a panel/card whose surface is a gradient" without pinning how that surface was selected); AC-634/635 are the text-fill stop-position axis; AC-637/638 are the authoring side. The rule is the one place the capture can be silently wrong in a way the diff cannot detect — pick the wrong ancestor and both sides agree on a value that is not what paints | Author an AC for the surface-gradient capture rule: for a run inside nested painting ancestors, the recorded surface gradient is the nearest painting ancestor's; a text-fill (`background-clip: text`) gradient on an ancestor is skipped rather than recorded as the surface; the walk stops at the first opaque solid so a gradient hidden behind it records none; and a run with no gradient ancestor records none |
| 5 | warning | coverage | STORY-77 `story-16f2793c` (Technical Context) | ac-add | **Carried forward from REPORT-1327 finding 3.** Technical Context states "a single **deterministic** reference cell is chosen per width (prefer the primary engine at rest)". No AC pins it: AC-639 asserts the reference values come from the ladder at the selected width but not that the choice among candidate cells at that width is deterministic or engine-preferring. A non-deterministic choice makes `--size` diffs flaky in a way every other AC would report clean. Warning rather than violation — it sits in Technical Context, not the story's In-scope Description | Either add an AC pinning the per-width cell selection (same bundle + same width → same reference cell; the primary engine's at-rest cell preferred when several are present), or drop the claim from Technical Context if the ladder in practice carries exactly one cell per width |
| 6 | warning | consistency | STORY-76 `story-82eb6908` (body, item 2 "Authored" bullet) | story-body-edit | The root of findings 2 and 3 lives one level up: the story body itself reads "Each stop colour is an absolute hex literal or a **palette-role alias (absolute-or-overlay)**". Because AC and story agree here, this is not an AC-vs-story inconsistency — it is a stale claim that both levels inherit from pre-REQ-114 intent. Filed as a warning at this level so the editor repairs body and ACs in one pass rather than "fixing" the ACs into disagreement with their story | Update STORY-76's item 2 "Authored" bullet to `#hex`-literal stops, noting REQ-114 moved the palette overlay into L1 (a role resolves to a literal before any module resolver sees it), and that a non-literal stop drops the whole gradient. Findings 2 and 3 then follow the body |

## Notes for the Editor

**1. Fix findings 1–4 together, in one pass over STORY-76.** All four are the same
story's item 2. Findings 1, 2 and 6 are three edits to one AC plus its story
bullet; do them as a unit or the AC and its story will disagree again.

**2. Findings 1 and 4 are repeat offenders.** Both were filed on 2026-08-05
(REPORT-1327 findings 1 and 2) and neither AC has been touched since
`2026-08-05T23:13:02Z`. If a fix pass has run against this capability since then,
it did not reach STORY-76. Verify the edits actually land before re-running this
check.

**3. The story-level cycle for this anchor is still FAIL and its repairs have not
landed.** `report-f150ba1e` (REPORT-1643, 2026-08-07T22:44Z) carries 8 open
story-level violations — the values-diff `gap` axis (REQ-73), cause clustering
(REQ-76), split-control surface attribution (BUG-22), in-browser gradient
hexification (REQ-72), band-overlay capture across modern colour syntax (BUG-24),
per-text-node run geometry (BUG-25), and the offline re-extract mirrored-reference
rule (BUG-16) — none of which appears in any story body. No STORY-* body has been
modified since that report (latest story `updated_at` is STORY-79 at
2026-08-07T03:22Z, ~19h before the report). **No AC can be expected for those
behaviours yet**, so they are deliberately not re-filed here; each will become an
`ac-add` once the story bodies are repaired. Re-run the ac level after the
story-level fixes land — the AC surface of STORY-75 and STORY-79 in particular
will need to grow.

**4. Cross-cutting pattern: REQ-114 fallout is under-propagated.** The
"absolute-or-overlay" colour phrasing (findings 2, 3, 6) is a pre-REQ-114
formulation that survived in this capability's gradient tree because REQ-114 was
reconciled against the L1 colour capability, not this one. The production code and
its tests were updated; the matrix was not. Worth a grep for
"absolute-or-overlay" / "palette-role alias" across other capabilities' ACs before
closing this out — the same phrase may be stale elsewhere.

**5. What is genuinely clean, so the editor does not churn it.** STORY-75's four
new ACs (AC-815 band extent, AC-816 backdrops, AC-817 background-image basename,
AC-818 module-invariant exclusion) and STORY-79's five new ACs (AC-1013…AC-1017,
the REQ-44 dependency preflight) were both authored after the last ac-level pass
and each covers its story bullet completely, including the negative and
boundary cases. No edits needed there.
