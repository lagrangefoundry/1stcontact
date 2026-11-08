---
uid: report-91d568a0
id: REPORT-11529
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-11-08T17:29:30.620623+00:00'
updated_at: '2026-11-08T17:29:30.620623+00:00'
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
    story: story-e674c60a
    ac: AC-2464
    claims_unevidenced:
    - 'Verified before it is served: if anything dangles the build fails and ''the
      previously served tree is then left exactly as it was'''
    - An unresolvable source import (resolves to no file, or to a file outside the
      repository) fails the build as an environment error naming the importing file
      and the specifier
    - Imports that exist only for types are not emitted; an import quoted inside a
      comment is not followed and not rewritten (emission side)
    problem: tests/reconciliation-builder-workspace-import-graph.test.ts drives `1c
      assets` only on the happy path. The refusal half (lines 132-154) calls checkImportGraph()
      directly on a hand-made staged dir and asserts only that err.hint contains 'the
      previous dist-assets is untouched'. Nothing runs the build with a dangling edge
      and then inspects apps/control-app/dist-assets, so an implementation that swapped
      stageDir into place before checking (assets.ts:1085-1094 order reversed, which
      is exactly the hazard BUG-71 Fix §2 says pre-swap checking exists to prevent)
      would still pass. No assertion exercises the source-side resolution failure
      (no file / outside repo -> ENVIRONMENT naming importer + specifier). No assertion
      checks that a type-only import (e.g. ./palette, ./types per BUG-71 Fix §1) is
      absent from dist-assets/framework, or that a comment-quoted specifier is left
      un-rewritten in an emitted file. The FC test tests/test_UAT_FC_BUG-71_framework_import_graph.test.ts:191
      has the same hint-text-only check.
    remediation: 'Test-only (tests_frozen does not apply to reconcile UAT generation;
      no production change is expected): (a) make the build itself fail on a dangling
      edge. For example, run `1c assets` against a temp app dir or a fixture bridge
      that imports a missing sibling. Snapshot dist-assets (file list plus a content
      hash) before, and assert after the CommandError(ENVIRONMENT) that it is byte-identical
      and that no .staging swap happened. (b) Drive emission with a bridge whose import
      resolves to no file, and one that resolves outside the repo. Assert ENVIRONMENT,
      naming the importing file and the specifier. (c) After the happy-path run, assert
      that a known type-only dependency of a bridge has no emitted file and is not
      referenced, and that a comment quoting an import in an emitted bridge keeps
      its original text. If any of (a)-(c) cannot be exercised through the real entry
      point, narrow AC-2464''s wording to what is evidenced and record the narrowing
      under STORY-99 ## Reconciliation Decisions with the BUG-71 citation. Do not
      weaken the pre-swap claim without evidence; it is intent-backed (BUG-71 Fix
      §2).'
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: 
**Anchor**: bundle-0d00566a
**Stories Reviewed**: 8 (STORY-174 story-44d0a572, STORY-175 story-e214a00d, STORY-176 story-1e340c9a, STORY-144, STORY-104, STORY-99, STORY-159, STORY-103)

2 overrides audited, 0 touched a trust boundary.

## Behavior Inventory

9 intent units (REQ-210, REQ-211, REQ-212, REQ-213, BUG-67 A+B, BUG-69, BUG-70, BUG-71, BUG-72). They add 55 new or modified active/pending ACs (AC-2413..AC-2467, plus AC-1717, AC-1718 and AC-2232 modified). Every AC has at least one test_UAT_AC{N}_ test, and all of them are in the selection of the latest scoped quality run (report-c8863adc, 274 tests, 0 failed, 0 skipped).

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Mark Points toggle, edit-only, reassigns click; off restores modal | Covered | story-44d0a572 | AC-2413 |
| 2 | Lettered marks, letter reuse, pill appended at end of draft, 26 cap | Covered | story-44d0a572 | AC-2414; end-of-draft and cap recorded as decisions |
| 3 | Label fade on leaving asymmetric reach / next point, never timer | Covered | story-44d0a572 | AC-2415 (BUG-72) |
| 4 | Geometric cross, 22px hit area | Covered | story-44d0a572 | AC-2416 (BUG-72) |
| 5 | + re-inserts pill; x deletes point and its pills | Covered | story-44d0a572 | AC-2417 |
| 6 | Drag moves the point and re-resolves it; hover tooltip on mark | Covered | story-44d0a572 | AC-2418; prior G2 resolved by decision |
| 7 | Expansion: SVG user space, node, document + width, near:, render ordinal, width-ambiguity note | Covered | story-44d0a572 | AC-2419, AC-2420, AC-2421 |
| 8 | Only referenced points sent; lenient Point X | Covered | story-44d0a572 | AC-2422 |
| 9 | Bubble keeps pill, turn carries expansion | Covered | story-44d0a572 | AC-2423 |
| 10 | Clear on send, grey until next render | Covered | story-44d0a572 | AC-2424 |
| 11 | Published/standalone renders and bridge untouched | Covered | story-44d0a572 | AC-2425 |
| 12 | Atomic pill / undo | Deferred (recorded) | story-44d0a572 | BUG-72 §3, operator's later decision |
| 13 | dialog/action placement, 4 structural rules | Covered | story-e214a00d | AC-2426..AC-2430 (REQ-212 §8 items 1-6) |
| 14 | Button retag + ARIA, panel shell, document-sourced paint | Covered | story-e214a00d | AC-2431..AC-2433 |
| 15 | Single vetted script only with modal; no-script in-flow; edit render no script | Covered | story-e214a00d | AC-2434..AC-2436 |
| 16 | reveal on panel suppressed; no-modal byte-identical | Covered | story-e214a00d | AC-2437, AC-2438 |
| 17 | Open/close, focus in/back, Escape/scrim, Tab trap, scroll lock, several panels | Covered | story-e214a00d | AC-2439..AC-2441 |
| 18 | REF-l1 projection | Covered | story-e214a00d | AC-2442 |
| 19 | Text runs: schema, closed form, single-run refused, envelope, span rules | Covered | story-1e340c9a | AC-2443..AC-2448 |
| 20 | Inline-flow capture, fold rejoin, longest-run axes, oracle agreement | Covered | story-1e340c9a | AC-2449..AC-2453 |
| 21 | Editor text1..N, per-run edit, unknown field refused, height estimate | Covered | story-1e340c9a | AC-2454..AC-2457; 1:1 with REQ-211 'Behaviour to verify' |
| 22 | Upload role correction, server-derived republishable | Covered | STORY-144 | AC-2458 |
| 23 | Fetched/captured refused 403, no control | Covered | STORY-144 | AC-2459 |
| 24 | Widen places via shared path; 0 or several sites means not placed | Covered | STORY-144 | AC-2460 |
| 25 | Narrow after placed refused 409 | Covered | STORY-144 | AC-2461 |
| 26 | Rights read-only except upload role; editable fields | Covered | STORY-144 | AC-1717, AC-1718 modified |
| 27 | Chat pane keyed on business; draft stays with its business | Covered | STORY-104 | AC-2462 |
| 28 | Every text-bearing control on the control token | Covered | STORY-99 | AC-2232 |
| 29 | Shared styled empty detail box | Covered | STORY-99 | AC-2463 |
| 30 | Framework import-graph emission + pre-swap verification + report counts | Covered, evidence insufficient | STORY-99 | AC-2464, see G1 |
| 31 | DNS failure not retried; one guarded www alternate; timeout earns none | Covered | STORY-159 | AC-2465 |
| 32 | Alternate host carried through all passes; actionable message | Covered | STORY-159 | AC-2466 |
| 33 | Model/max_tokens from backends.json, both hosts, document edit changes the request | Covered | STORY-103 | AC-2467 |
| 34 | Malformed backends.json is a start-up failure | Scope (recorded) | STORY-103 | Decision: library validator's own behaviour (lagrange-framework BUG-49) |
| 35 | BUG-67 Defect A items 2-5 (stop_reason, truncation, audit input, usage) | Out of repo (recorded) | — | Cross-repo lagrange-framework BUG-49 per intent |

## Ungrounded Stories

None found. Every story claim traces to the intent or is recorded under ## Reconciliation Decisions.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Marked Points (REQ-210 + BUG-72) | story-44d0a572 (STORY-174) | ✓ |
| 2. L1 Modals (REQ-212) | story-e214a00d (STORY-175) | ✓ |
| 3. Text Runs (REQ-211) | story-1e340c9a (STORY-176) | ✓ |
| 4. Library role (REQ-213) | STORY-144 (AC-2458..2461 added, AC-1717/1718 modified) | ✓ |
| 5. Assistant pane (BUG-69) | STORY-104 (AC-2462) | ✓ |
| 6. Builder workspace (BUG-70, BUG-71) | STORY-99 (AC-2463, AC-2464 added; AC-2232 modified) | ✓ |
| 7. Reference capture (BUG-67 B) | STORY-159 (AC-2465, AC-2466) | ✓ |
| 8. Backend settings (BUG-67) | STORY-103 (AC-2467) | ✓ |

## Supersession Check (Step 4c)

PASS. REQ-213 narrows REQ-161's 'every rights row read-only' claim. The narrowing was applied by rewording AC-1717 and AC-1718 in place, which is correct because the rest of each claim still holds. No other STORY-144 AC (I read all 34) still pins 'role is read-only' or 'description is the only editable field'. No other rewrite in this bundle explicitly supersedes a prior contract.

## Mode Override Audit

2 overrides audited, 0 touched a trust boundary.

- **report-22b124dd** (code_frozen, STORY-99, rung 3), commit ee35098b94. It changes one line in builder.css: `.builder-people__subject/__tolist/__body` goes from `font-size: 13px` to `var(--builder-control-font-size)`, still immediately after `font: inherit`. (1) Only the named file was touched. (2) The later scoped quality run report-c8863adc has 274 tests, 0 failed. (3) Consistent with AC-2232 'none restates the size as a literal' and BUG-70. (4) Exactly the one declaration the planner named. (5) No trust boundary was touched. (6) Rung 3: no behaviour beyond what AC-2232 demands. Pass.
- **report-974846f1** (code_frozen, STORY-99, rung 2), commit bd2726798e. It adds `.builder-library__badge--role { color: var(--shell-fg-muted); border-color: var(--shell-border) }`. Both values equal the base `.builder-library__badge` rule (builder.css:1130-1138), so the role pill looks the same. That satisfies the planner's 'what the user sees must not change'. The commit also changed a test transport double in the typography test, which code_frozen does not govern. unnamed_files_touched is empty, trust_boundary_touched is false, and the in-loop conformance verdict was pass. No library.js or AC edits, and no .is-placed state. Items 1-6 pass.

Neither override is misjudged.

## Evidence Sufficiency (Step 5b)

No vi.mock of repository code in any of the bundle's UAT files. The only doubles are at external boundaries: the browser/DNS in the capture tests, the Anthropic client in AC-2467, and the transports in jsdom builder mounts. AC-2467's 'document alone changes it' replaces the JSON data module, not code. That is acceptable.

Prior review report-4c6f0257 raised G1 (AC-2421 proven by source-text inspection) and G2 (hover coordinates unrecorded). Both are resolved. AC-2421 is now proven behaviourally in tests/reconciliation-marked-points-served-modules.test.ts: it walks the emitted graph, checks parity with the source modules, and runs the default measure path in a browser. STORY-174 records the hover decision.

The AC-2232 typography UAT mounts the real builder and resolves the winning rules through the parsed stylesheets. Its secondary static sweep reads builder/*.js source, but that only supplements the mounted sweep, which is the AC's stated method. It is accepted, noted here.

**G1: AC-2464 (STORY-99, BUG-71) is insufficiently evidenced.** The UAT runs `1c assets` only on the happy path. The refusal is exercised by calling `checkImportGraph` directly and asserting only the hint text 'the previous dist-assets is untouched'. So the AC's central safety claim, 'the previously served tree is then left exactly as it was' (BUG-71 Fix §2: checking before the swap is what makes strictness safe), would still pass if the swap at assets.ts:1093-1094 ran before the check at :1085. Three other claims have no assertion at all:
- an unresolvable source import (no file, or outside the repo) fails the build naming the importer and the specifier;
- type-only imports are not emitted;
- a comment-quoted import is not rewritten in emitted output.

The remediation is in fields.gaps.

## Judgment Calls

- The atomic pill, undo, and hover coordinates on the pill are deferred. This is acceptable because the operator's later BUG-72 §3 scoped them out, and STORY-174 records the decision with its rationale.
- REQ-212 §7 asks for DOC-48/DOC-47 prose additions. This is not story behaviour and not gated here.
- BUG-67 Defect A items 2-5 are cross-repo (lagrange-framework BUG-49) per the intent's own Cross-repo status section. They are rightly absent from this repo's stories.
- The malformed-backends.json start-up failure is assigned to the library validator, and that assignment is recorded as a STORY-103 decision. Acceptable.
- The upgrade ACs AC-2458..AC-2467 carry status `pending`, not `active`. They are judged as in-scope criteria. Each has passing UATs, so the status is not itself a finding.
- AC-2464 is flagged as a FAIL, not an acceptable omission, because a broken implementation passes the UAT while violating the property the intent calls the reason the design is safe. The fix is test-side.

## Verdict

FAIL: the stories faithfully and completely represent the bundle's intent. All 8 plan items produced stories, no divergence was silently absorbed, the supersession check passes, and both overrides are correctly judged. One evidence gap remains. AC-2464's claims that the previous served tree is preserved on refusal, that unresolvable source imports fail naming importer and specifier, and that type-only and comment-quoted imports are excluded from emission are not proven by any assertion that would fail if the behaviour were removed (G1). The fix loop should add behavioural evidence through the real `1c assets` entry point, or narrow the AC with a recorded decision.
