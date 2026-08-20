---
uid: report-a03ac65e
id: REPORT-2355
type: report
title: Fix 1c Capture & Diff Fidelity (story) — attempt 8
created_by: xgd
created_at: '2026-08-20T03:42:44.029076+00:00'
updated_at: '2026-08-20T03:42:44.029076+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: story
  fixes_applied: 11
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — 1c Capture & Diff Fidelity (story)

**Attempt**: 8
**Fixes applied this call**: 11
**Violations remaining**: 0
**Needs more work**: false

All four violations (findings 1–4) are resolved. The three warnings are either
deferred by the assessor's own instruction (finding 5, BUNDLE-19 still
reconciling) or cross-capability and explicitly out of CAP-63's repair scope
(findings 6, 7) — forwarded below.

Every intent was read in full and grounded in live code before editing, so each
story body describes what the branch actually does rather than what the intent
proposed.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-create | STORY-116 (`story-aaddb221`) | **New sibling story** — "Values-diff noise management: an exact capture reported as counted defects, in repair order, rolled up to ranked causes". Carries finding 1 (REQ-64) and finding 4 (REQ-76). `intent_uid=request-07d0e3e1`, `updated_by=[request-3a11304d]`, `capability_uid=capability-aa030c83`, kind `feature`, 3 points. Six description items: noise-as-overlay-over-exact-capture with the operator dial and the three admissible rule kinds; `--collapse` per-defect dedup with range folding and the stated raw total; derived-axis demotion (`position` as the integral of `gap`/`size`; `size`/`renderedTextBox` explicitly not derived); the Type-A flat / Type-A structural / Type-B classification and the fixed repair order; `--clusters` ranked causes with fix/review/accept dispositions and the fall-through-to-`review` rule; and cluster viewport-awareness as the anti-phantom guard. Out-of-scope clause hands the capture-side preconditions (marker precondition, paints-nothing exclusion, per-text-node runs) back to STORY-75 even though a noise audit surfaced them, and hands `--json` stream hygiene to STORY-79 while keeping payload *meaning* here — consistent with the capability's mechanism-vs-meaning rule |
| 2 | ac-add | AC-1285 (`acceptance_criterion-dec81393`) | STORY-116 — noise treatment is a reversible layer over an exact capture, with an operator dial; verification asserts the raw captured values are unchanged when a delta is suppressed |
| 3 | ac-add | AC-1286 (`acceptance_criterion-0c4c0e8b`) | STORY-116 — `--collapse` one row per defect, width set recorded, scalar-vs-range folding, `systemic` rollups excluded, raw total stated |
| 4 | ac-add | AC-1287 (`acceptance_criterion-62c1609f`) | STORY-116 — derived axis reported for drill-down, excluded from headline count and repair classes; `size`/rendered-text-extent stay counted |
| 5 | ac-add | AC-1288 (`acceptance_criterion-88661be9`) | STORY-116 — Type-A flat / structural / Type-B classification (all three structural triggers) and the printed flat → structural → emergent order |
| 6 | ac-add | AC-1289 (`acceptance_criterion-3dfc51df`) | STORY-116 — `--clusters` ranked dispositioned causes, shared-cause mapping, unmapped-property fall-through, and no phantom merge across disjoint widths |
| 7 | story-body-edit | STORY-76 (`story-82eb6908`) | Finding 2 (REQ-72). Added Description item 3, "In-browser stop-colour resolution": each colour token in a captured gradient declaration is resolved to `#rrggbb` in the browser before the TS-side `normalizeGradient` parses stops, positions/keywords/direction untouched, applied to **both** the text-fill and panel `surfaceGradient` paths; states the failure it prevents (a modern-colour-space gradient parsing to `135° []` — direction with no stops — which reads as a clean match against any reproduction). Also widened the Story sentence, added the mechanism to **In scope**, and added a Technical Context bullet tying it to the sibling scrim-probe lesson (a capture-side parser narrower than the engine is a silent-skip machine) plus a back-compat note for pre-REQ-72 bundles |
| 8 | field-update | STORY-76 | `updated_by=["request-0698bbdf"]` (was unset) |
| 9 | story-body-edit | STORY-75 (`story-d5de22a5`) | Finding 3 (REQ-73). Added Description item 15, "Adjacent-gap axis, and the retirement of band vertical padding": row grouping by *reference* y-overlap, gap between consecutive rows as the compared coordinate, HIGH tier, 6px default / 16px `--tolerant`, overlapping rows skipped, drift-free (one wrong gap = one delta), and the linear inversion (`expected − actual` is the correction to the one spacing knob; Type-B yet directly actionable). States the paired retirement explicitly — section band `paddingTopPx`/`paddingBottomPx` are captured but deliberately **not** compared (a component of a sum the two sides distribute via margins vs padding), with band `textAlign` unaffected. Also widened the Story sentence and the **In scope** list, and added a Technical Context bullet: an axis must be compared in a coordinate both sides can agree on, and choosing the comparison coordinate is a decision distinct from choosing what to capture |
| 10 | field-update | STORY-75 | `updated_by` extended with `request-859652ae` (existing four bundle attributions preserved) |
| 11 | capability-body-edit | CAP-63 (`capability-aa030c83`) | Added a **Scope** bullet for the values-diff report surface (noise layer, `--collapse`, derived demotion, repair order, `--clusters`), so STORY-116 has a declared scope home and the capture-vs-report line is stated. Added a **History** entry, "Unbundled-intent repair (2026-08-19)", recording the ledger hole (bundle-only enumeration), the four in-scope unbundled intents and where each now lives, REQ-66's correct absence, and the deliberate exclusion of REQ-74/REQ-78 as cross-capability |

## Evidence Grounding (read before editing; all live on this branch)

| Behaviour | Verified at |
|---|---|
| REQ-64 repair order, `CollapsedDefect`, `collapseMultiViewport`, `formatCollapsedReport`, structural triggers, derived block | `tools/generate/src/cli/fidelity.ts:271-428` |
| REQ-64 derived-axis rationale + `DERIVED_PROPERTIES = {position}` | `tools/generate/src/cli/capture/values-diff.ts:1355-1366` |
| REQ-76 `DefectCause`, `CAUSE_MAP`, `clusterDefects`, `formatClusterReport` (dispositions, width scope, summary line) | `tools/generate/src/cli/fidelity.ts:430-531` |
| `--collapse` / `--clusters` flag wiring + JSON payload selection | `tools/generate/src/cli/index.ts:272-274, 790-798` |
| REQ-73 gap axis: row grouping by y-overlap, consecutive-row gap, overlap skip | `tools/generate/src/cli/capture/values-diff.ts:2493-2541` |
| REQ-73 tolerance 6px / 16px tolerant; HIGH tier; Type-B-but-linear | `values-diff.ts:1953-1955, 1127-1129, 1341-1343` |
| REQ-73 band vertical padding deliberately not compared (textAlign still is) | `values-diff.ts:2575-2583` |
| REQ-72 `hexifyGradient` (probe element + computed colour), applied to text-fill and surface paths | `tools/generate/src/cli/capture/extract.ts:329-347`, call sites `846`, `1132` |

Note: `fidelity.ts` and `values-diff.ts` contain NUL bytes and read as binary to a
plain `grep -r`; they were read via an explicit decode, so this survey did not
silently skip them.

## Code Edits

None this call. All four violations were coverage gaps in the matrix, not
disagreements between code and intent — every behaviour cited was already live and
correct on this branch.

## needs_review / Cross-Capability Items Forwarded

| Element | Assessor said | Action taken / decision needed |
|---|---|---|
| STORY-79 / BUNDLE-19 (finding 5, warning) | REQ-144 adds a standalone `1c preflight` verb + `cli/shared-store.ts`; bundle still `reconciling`, neither present on this branch | No edit, per the assessor's own "no edit yet". Re-verified absent: no `cli/shared-store.ts`, no `preflight` verb in the `cli/index.ts` command switch. Carry into BUNDLE-19's reconciliation; the CAP-63/CAP-82 line for the shared-store component inventory still needs settling |
| REQ-74 `adopt-gaps` (finding 6, warning) | Live at `cli/edit.ts:1552-1596`, storied nowhere; ownership "probably not CAP-63" | Not swept in. Recorded in the capability History as a deliberate exclusion. **Operator/assessor decision needed**: CAP-71 (reproduction/adopt) is the likely owner — it writes a repair into a site, which is not capture-and-compare. If no capability claims it, this is a matrix-wide gap to file |
| REQ-78 `1c aligned-crops` (finding 7, warning) | The verb's own meaning is unstoried anywhere; STORY-79 correctly owns only its store-routing mechanism | Not swept in; recorded as a deliberate exclusion. **Decision needed**: file against whichever capability owns the perceptual-judge pipeline |
| Matrix-wide (Notes for the Editor) | 38 reconciled, unbundled intents unreferenced by any story store-wide | Out of this scope path, but worth restating: every capability's story-level check should re-run with unbundled intents included. The sweep is at `.xgd/tmp/sweep.py` |

## Consistency at the Call Boundary

- STORY-116 was created together with its five ACs, so the new story is not left
  as an immediate AC-coverage gap.
- Each story-body edit was paired with its `updated_by` attribution in the same
  call, so no story claims a behaviour without naming the intent that asked for it.
- The capability's Scope bullet and History entry landed in the same call as the
  story they describe, so the capability body never claims a report surface no
  story carries, nor the reverse.
- The five new ACs are `pending` with no UATs yet — the expected next-phase
  signal at level=ac / level=uat, not a regression introduced here.
