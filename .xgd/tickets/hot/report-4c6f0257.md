---
uid: report-4c6f0257
id: REPORT-11512
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-11-08T16:18:48.739864+00:00'
updated_at: '2026-11-08T16:18:48.739864+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-0d00566a
  anchor_uid: bundle-0d00566a
  overrides_audited: 2
  trust_boundary_overrides: 0
  gaps:
  - id: G1
    type: evidence_insufficient
    story: story-44d0a572
    ac: AC-2421
    claim: The builder runs the same anchor and measurement definitions (nearestAnchors
      from site-schema anchors.ts, measureScript from measure-svg.ts) as relate/solve/measure_drawing,
      not a separate copy
    problem: 'Proven only by source-text inspection: tests/reconciliation-marked-points.test.ts:722-730
      readFileSync()s tools/generate/src/cli/assets.ts and apps/control-app/src/builder/main.js
      and asserts string containment. The harness also hands the controller its own
      api (line 196: the test imports anchors/measureScript itself) and a measure
      double (lines 194, 208, 260 measureImpl), so neither the production wiring (app.js:429
      createMarkedPoints fed by main.js:8-9 /framework imports) nor the default measure
      path (points.js:114-117 evaluateMeasure(api.measureScript), points.js:426) is
      exercised. A builder that passed a hand-copied anchors module, or whose evaluateMeasure
      was broken, would still pass.'
    remediation: 'Replace the source-string assertion with behavioural evidence: (a)
      drive `1c assets` (as the AC-2464 UAT does), walk the emitted graph from /builder/main.js,
      assert it reaches /framework/site-schema-anchors.js and /framework/measure-svg.js,
      import those emitted files and assert nearestAnchors/measureScript give byte-identical
      results to the source modules on the fixture; (b) cover the default (non-injected)
      measure path with a browser-gated test (same gating pattern as the REQ-211 runs-survive-a-capture
      tests) asserting near: equals measure_drawing + nearestAnchors output for the
      same SVG and point. Do not weaken AC-2421; the claim is intent-backed (REQ-210
      implementation notes, ''Three modules are now served to the browser'').'
  - id: G2
    type: intent_missing_unrecorded
    story: story-44d0a572
    intent: 'REQ-210 ''The pill behaves like a pill'': ''Coordinates on hover, so
      a reused letter can always be disambiguated.'''
    problem: No AC covers it and no Reconciliation Decision records dropping it. The
      existing 'Atomic pill deferred' decision attributes only atomicity/undo to BUG-72
      §3; BUG-72 did not scope out hover coordinates. Meanwhile the code puts the
      full formatted expansion on the MARK as a tooltip (apps/control-app/src/builder/points.js:482
      mark.el.title = points.formatMarkedPoint(mark.point)), which no story or AC
      describes.
    remediation: Add a Reconciliation Decision to STORY-174 stating that a literal-text
      pill cannot carry a hover (same root cause as BUG-72 §3, upstream webui-chat),
      that disambiguation of reused letters is instead guaranteed by deleting a point
      removing its pills (AC-2417) and points clearing on send (AC-2424), and that
      the mark's tooltip carries the point's formatted expansion. Formalize the mark
      tooltip as a clause of AC-2414 or AC-2418 (re-resolved on drag) with a UAT assertion
      on the mark's title.
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: 
**Anchor**: bundle-0d00566a
**Stories Reviewed**: 8 (story-44d0a572/STORY-174, story-e214a00d/STORY-175, story-1e340c9a/STORY-176, STORY-144, STORY-104, STORY-99, STORY-159, STORY-103)

## Behavior Inventory

~60 behaviours identified across the 9 bundled intents (REQ-210, REQ-211, REQ-212, REQ-213, BUG-67, BUG-69, BUG-70, BUG-71, BUG-72), traced through points.js, marked-points.ts, anchors.ts, l1 schema/validate/render, fold/inline-runs/probes, material.ts role route, chat.js/app.js, builder.css, assets.ts, capture pipeline, backends.ts/host-core.ts.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Mark Points toggle, edit-only, reassigns click, crosshair/dimmed outline | Covered | STORY-174 | AC-2413 |
| 2 | Lettered marks, letter reuse, pill appended, 26 cap | Covered | STORY-174 | AC-2414 (cap and end-of-draft recorded as decisions) |
| 3 | Asymmetric fade reach, no timer, hover restores | Covered | STORY-174 | AC-2415 (BUG-72) |
| 4 | Geometric cross, 22px hit area | Covered | STORY-174 | AC-2416 (BUG-72) |
| 5 | + re-inserts pill, x deletes point and pills | Covered | STORY-174 | AC-2417 |
| 6 | Drag moves and re-resolves | Covered | STORY-174 | AC-2418 |
| 7 | Expansion frames, document coords, viewport width, render ordinal, width-ambiguity note | Covered | STORY-174 | AC-2419 |
| 8 | SVG user space via object-fit + preserveAspectRatio, no inlining | Covered | STORY-174 | AC-2420 |
| 9 | near: from closed anchor vocabulary, never snapped, same served implementation | Covered, evidence insufficient | STORY-174 | AC-2421: 'same definitions' claim proven only by source inspection (G1) |
| 10 | Only referenced points expanded, lenient typed refs | Covered | STORY-174 | AC-2422 |
| 11 | Bubble keeps pill, turn carries expansion, cut/paste | Covered | STORY-174 | AC-2423 |
| 12 | Clear on send, grey until next render | Covered | STORY-174 | AC-2424 |
| 13 | Published/standalone edit renders and bridge unchanged | Covered | STORY-174 | AC-2425 |
| 14 | Pill atomicity / undo | Out of scope (recorded) | STORY-174 | BUG-72 §3 operator scoping, Reconciliation Decision present |
| 15 | Pill 'coordinates on hover' (intent) / mark tooltip with full expansion (code, points.js:482) | Uncovered | — | G2: intent behaviour dropped without a recorded decision; code substitute undocumented |
| 16 | L1 dialog role, action verb, 4 validator rules | Covered | STORY-175 | AC-2426..2430 |
| 17 | Button retag, panel/shell, scrim/placement from doc, covered-viewport obligations | Covered | STORY-175 | AC-2431..2433 |
| 18 | Vetted script once, no instance data, script-gated overlay, edit render, reveal suppressed, byte-identical no-modal | Covered | STORY-175 | AC-2434..2438 |
| 19 | Open/close/focus, Escape/scrim dismiss, Tab trap, scroll lock, independent panels | Covered | STORY-175 | AC-2439..2441 |
| 20 | REF-l1 projection | Covered | STORY-175 | AC-2442 |
| 21 | Text runs: string/run union, closed form, single-run refused, envelope bounds | Covered | STORY-176 | AC-2443..2448 |
| 22 | Span per varying run, bare text for axis-less runs | Covered | STORY-176 | AC-2444, AC-2447 |
| 23 | Capture inline-flow membership, fold rejoin of varying flows only, longest-run axes, flow-root rect | Covered | STORY-176 | AC-2449..2452 (baseline-only decision recorded) |
| 24 | Oracle/round-trip agree with fold | Covered | STORY-176 | AC-2453 |
| 25 | Editor text1..N, single-run edit, unaddressable field refused | Covered | STORY-176 | AC-2454..2456 |
| 26 | Text-height estimation over runs | Covered | STORY-176 | AC-2457 |
| 27 | Library role correction, server-derived republishable, 400s | Covered | STORY-144 | AC-2458 (+ AC-1717/1718 modified in place) |
| 28 | 403 fetched/captured, no control; absent origin = uploaded | Covered | STORY-144 | AC-2459 (decision recorded) |
| 29 | Widen places via shared path; 0/several sites = not placed; soft failure | Covered | STORY-144 | AC-2460 |
| 30 | Narrow-after-placed 409 | Covered | STORY-144 | AC-2461 |
| 31 | Chat keyed on business; draft stays with business | Covered | STORY-104 | AC-2462 |
| 32 | Every text-bearing builder control at control token | Covered | STORY-99 | AC-2232 (modified) |
| 33 | Shared styled empty detail box | Covered | STORY-99 | AC-2463 |
| 34 | 1c assets import-graph closure, pre-swap verification, report counts | Covered | STORY-99 | AC-2464 |
| 35 | Capture: DNS failure not retried, one guarded www alternate, timeout no alternate | Covered | STORY-159 | AC-2465 (EAI_AGAIN decision recorded) |
| 36 | Capture: corrected host carried through all passes; actionable no-such-host message | Covered | STORY-159 | AC-2466 |
| 37 | Backend model/max_tokens from project backends.json, both hosts, static import | Covered | STORY-103 | AC-2467 (malformed-doc rejection recorded as library-owned decision) |

## Ungrounded Stories

None found. Every story claim traces to intent or to code with a recorded Reconciliation Decision.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Marked Points (REQ-210, BUG-72) | story-44d0a572 (new) | ✓ |
| 2. L1 Modals (REQ-212) | story-e214a00d (new) | ✓ |
| 3. Text Runs (REQ-211) | story-1e340c9a (new) | ✓ |
| 4. Library role (REQ-213) | STORY-144 upgrade: AC-2458..2461 added, AC-1717/1718 modified | ✓ |
| 5. Assistant Pane (BUG-69) | STORY-104 upgrade: AC-2462 | ✓ |
| 6. Builder Workspace (BUG-70, BUG-71) | STORY-99 upgrade: AC-2463, AC-2464 added, AC-2232 modified | ✓ |
| 7. Reference Capture (BUG-67 B) | STORY-159 upgrade: AC-2465, AC-2466 | ✓ |
| 8. Backend settings (BUG-67) | STORY-103 upgrade: AC-2467 | ✓ |

## Supersession Check (Step 4c)

PASS. REQ-213 narrows the old read-only claim, and AC-1717/AC-1718 are rewritten in place (Case 2, the rest of each claim still holds); no intent declares outright supersession. No STORY-159 AC pins the old unconditional retry, no STORY-103 AC pins a model id, and no STORY-104 AC pins keying on the bare session id. No AC that pins retracted behaviour is still active.

## Evidence Sufficiency (Step 5b)

The latest scoped quality report (report-bdf4c87b, commit bb248150f3, which comes after both overrides; HEAD differs only in ticket files) passes 275/275. It includes at least one passing `test_UAT_AC{N}_` for every one of the 58 bundle ACs reviewed (AC-1717, AC-1718, AC-2232, AC-2413..AC-2467). The scan found no `vi.mock` of repository code. AC-2467's `vi.doMock` replaces only the JSON data document, which is acceptable. The AC-2232 typography sweep reads CSS/JS source, but that is the static enumeration the AC's own verification requires, and a mounted-ancestry check complements it. Accepted.

**Gap (G1): AC-2421.** The claim that the builder runs the same anchor and measurement definitions is evidenced only by `readFileSync` + `toContain` on `assets.ts` and `main.js` (tests/reconciliation-marked-points.test.ts:722-730). The harness supplies both `api.anchors` and a `measure` double (lines 194-209, 260), so it exercises neither the production wiring (app.js:429 fed by main.js:8-9) nor the default measure path (points.js:114-117, 426). A hand-copied anchors module or a broken `evaluateMeasure` would pass.

## Mode Override Audit

2 overrides audited, 0 touched a trust boundary.

- report-22b124dd (code_frozen, STORY-99, rung 3). Diff 546ef3ef9d changes only builder.css: one `font-size: 13px` becomes `var(--builder-control-font-size)` on the Contacts composer inputs (item 1 ✓). The scoped quality run after it passes, including STORY-99's earlier ACs (item 2 ✓). It matches the BUG-70 / AC-2232 'no literal' rule (item 3 ✓), stays within the stated scope (item 4 ✓), touches no trust boundary (item 5 ✓) and edits only the named file with no new behaviour (item 6 ✓).
- report-974846f1 (code_frozen, STORY-99, rung 2). Diff 9f07a3f0b5 adds a `.builder-library__badge--role` rule to builder.css. Its declarations restate the base `.builder-library__badge` colour and border (builder.css:1135-1136), so nothing visible changes, as the planner required. The test-file edit (transport `subscribe` shape) is outside code_frozen's scope, and `unnamed_files_touched` is empty (item 1 ✓). Quality passes (item 2 ✓). The rule is consistent with AC-2232's 'every builder-* class is matched' verification (item 3 ✓), adds no `.is-placed` state and leaves library.js alone (item 4 ✓), and touches no trust boundary (item 5 ✓, conformance pass). It edits only the named production file (item 6 ✓).

No override was misjudged.

## Judgment Calls

- REQ-212 §5.4 'script and stylesheet exported by name for CSP hashing' sits in Technical Context with no AC. Acceptable: it is a consumer-facing export detail, not reader-visible behaviour.
- BUG-67 Defect A items 2-5 (stop_reason, truncation, audit input, usage persistence) live in lagrange-framework BUG-49, and the intent assigns them there. Their absence from these stories is correct.
- STORY-103 records malformed backends.json rejection as library-owned behaviour (lagrange-framework BUG-49) and does not give it a separate AC. That is a recorded decision, so it is accepted.
- BUG-71's 'not fixed here' items (1c builder does not build assets; stale `serve` usage text) are explicitly out of scope and correctly left out.
- G2 is flagged as material because it is an intent-declared behaviour with a stated purpose (disambiguating reused letters). It was dropped with no recorded decision, and the code's substitute (a mark tooltip) is undocumented, so a reader of STORY-174 would not know either fact. The fix is small.

## Verdict

FAIL: coverage and evidence gaps found. The fix loop should address these:

1. **G1, story-44d0a572 / AC-2421: evidence insufficient (source inspection).** Replace tests/reconciliation-marked-points.test.ts:722-730 with behavioural evidence. Drive `1c assets`, walk the emitted graph from /builder/main.js to /framework/site-schema-anchors.js and /framework/measure-svg.js, import the emitted modules and assert they give results identical to the source modules on the fixture. Also add a browser-gated test of the default (non-injected) measure path, asserting `near:` equals measure_drawing + nearestAnchors for the same SVG and point. Keep AC-2421 as written.
2. **G2, story-44d0a572: intent behaviour missing and unrecorded.** REQ-210 asks for 'coordinates on hover' on the pill. Add a Reconciliation Decision explaining that a literal-text pill cannot carry a hover (same root cause as BUG-72 §3) and that reused-letter disambiguation is guaranteed by AC-2417 and AC-2424 instead. Formalize the code's substitute, the mark tooltip carrying the formatted expansion (points.js:482), as a clause of AC-2414 or AC-2418, with a UAT assertion on the mark's `title`.

Everything else is faithful to the intent and complete: plan items 1-8 all produced their stories, nothing is ungrounded, and the supersession check passes.
