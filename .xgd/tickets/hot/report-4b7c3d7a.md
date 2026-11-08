---
uid: report-4b7c3d7a
id: REPORT-11532
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-11-08T17:41:51.164747+00:00'
updated_at: '2026-11-08T17:41:51.164747+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-0d00566a
  anchor_uid: bundle-0d00566a
  overrides_audited: 2
  trust_boundary_overrides: 0
  gaps: []
  prior_review_uid: report-91d568a0
  prior_gaps_resolved:
  - G1
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: 
**Anchor**: bundle-0d00566a
**Stories Reviewed**: 8 (STORY-174 story-44d0a572, STORY-175 story-e214a00d, STORY-176 story-1e340c9a, STORY-144, STORY-104, STORY-99 story-e674c60a, STORY-159, STORY-103)

2 overrides audited, 0 touched a trust boundary.

## Scope of this pass

This is a re-review after the fix loop for G1 from report-91d568a0. G1 found AC-2464 (STORY-99, BUG-71) insufficiently evidenced.

Since that review (commit c06bca4690), the branch changed in exactly one non-ticket file: `tests/reconciliation-builder-workspace-import-graph.test.ts` (+205 lines). Everything else is ticket bookkeeping: report-90cb4ed2, comment-33e58752, report-16feba3a, and a bundle field update. No stories, ACs or production code changed.

The bundle body still has no comments. Every other finding of report-91d568a0 therefore still holds against unchanged inputs and is carried forward: intent fidelity for all 9 intent units, the coverage map, the decisions, and Step 4c. The coverage map is summarised below.

## Behavior Inventory

There are 35 behaviour units across the 9 intent units (REQ-210, REQ-211, REQ-212, REQ-213, BUG-67 A+B, BUG-69, BUG-70, BUG-71, BUG-72). They carry 58 ACs:
- 55 new, AC-2413..AC-2467;
- 3 modified: AC-1717, AC-1718 and AC-2232.

I confirmed from the ticket store that all 58 exist: 13 under STORY-174, 17 under STORY-175 and 15 under STORY-176, with the rest under the upgraded stories.

The latest scoped quality run, report-16feba3a at 934ba4d5fe (the fix commit), passed: 281 tests, 0 failed, 0 skipped, lint and build clean. Its failure list is empty. All five test_UAT_AC2464_* tests appear and passed.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1-11 | Marked Points: toggle, lettered marks, reach fade, geometric cross, x/+, drag, expansion frames + near anchors + render id, referenced-only, bubble/turn split, clear-on-send, published untouched | Covered | story-44d0a572 | AC-2413..AC-2425 |
| 12 | Atomic pill / undo | Deferred (recorded) | story-44d0a572 | BUG-72 §3, upstream webui-chat |
| 13-18 | L1 modals: dialog/action, 4 rules, button retag, shell, vetted script, no-script fallback, edit render no script, reveal suppressed, focus/trap/Escape/scrim/scroll lock, REF-l1 | Covered | story-e214a00d | AC-2426..AC-2442 |
| 19-21 | Text runs: schema union, single-run refused, envelope, span-per-varying-run, inline-flow capture, fold rejoin, shared oracle, text1..N editor | Covered | story-1e340c9a | AC-2443..AC-2457 |
| 22-26 | Library role correction: upload-only, 403, server-derived republishable, widen places, 409 narrowing, AC-1717/1718 narrowed | Covered | STORY-144 | AC-2458..AC-2461, AC-1717, AC-1718 |
| 27 | Chat pane keyed on business, draft stays | Covered | STORY-104 | AC-2462 |
| 28-29 | Every text-bearing control on the token; shared empty box | Covered | STORY-99 | AC-2232, AC-2463 |
| 30 | Framework import graph: emission, type-only/comment handling, source-resolution failures, pre-swap verification, report counts | Covered | STORY-99 | AC-2464. G1 resolved, see Evidence |
| 31-32 | Capture: DNS failure not retried, one guarded www alternate, timeout earns none, alternate carried through passes, actionable message | Covered | STORY-159 | AC-2465, AC-2466 |
| 33 | Model/max_tokens from backends.json on both hosts | Covered | STORY-103 | AC-2467 |
| 34 | Malformed backends.json | Scope (recorded) | STORY-103 | Library validator, lagrange-framework BUG-49 |
| 35 | BUG-67 Defect A items 2-5 | Out of repo (recorded) | — | Cross-repo per intent |

## Ungrounded Stories

None. No story content changed since report-91d568a0, which found none.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Marked Points (REQ-210 + BUG-72) | story-44d0a572 | ✓ |
| 2. L1 Modals (REQ-212) | story-e214a00d | ✓ |
| 3. Text Runs (REQ-211) | story-1e340c9a | ✓ |
| 4. Library role (REQ-213) | STORY-144 | ✓ |
| 5. Assistant pane (BUG-69) | STORY-104 | ✓ |
| 6. Builder workspace (BUG-70, BUG-71) | STORY-99 | ✓ |
| 7. Reference capture (BUG-67 B) | STORY-159 | ✓ |
| 8. Backend settings (BUG-67) | STORY-103 | ✓ |

## Supersession Check (Step 4c)

PASS, unchanged. REQ-213 narrows REQ-161's read-only rights claim. AC-1717 and AC-1718 are reworded in place, because the rest of each claim still holds. No other AC pins the retracted behaviour.

## Evidence Sufficiency (Step 5b): G1 re-examined

AC-2464 claims, checked against the four new tests in tests/reconciliation-builder-workspace-import-graph.test.ts:

**Pre-swap verification: the previous served tree is left exactly as it was.**
The dangling-edge test drives the real `run(['assets'])` in a mirrored checkout and seeds dist-assets with a known previous tree. It asserts four things:
- CommandError(ENVIRONMENT) naming `/framework/never-built-ac2464.js <- /builder/main.js`;
- the full staged tree exists in `.staging`, broken import included, so the failure occurred at verification and not earlier in emission;
- dist-assets is byte-identical to its pre-build snapshot;
- no `.retired` directory exists.

In assets.ts, `checkImportGraph` (line 1085) runs before the renames (1093-1094). If that order were reversed, the snapshot comparison would fail. Sufficient.

**A source import that resolves to no file, or to a file outside the repository, fails as ENVIRONMENT naming the importer and the specifier.**
Two tests do this through the real build. Each asserts the exact message emitted at assets.ts:265 or :276, and that the served tree is untouched. Sufficient.

**Type-only imports are not emitted, and a comment-quoted import is not rewritten.**
The test reads edit.ts only to pin its precondition, that the fixture still has type-only `./palette`/`./types` imports and a quoted comment. Its behavioural assertions are on the emitted output:
- no palette.js or types.js is emitted;
- no emitted specifier names either;
- the comment line appears verbatim in site-schema-edit.js, and no rewritten palette URL appears.

An implementation that followed type imports or rewrote comment text would fail. The source read is a guard on the fixture, not the evidence. Sufficient.

**Every dangling edge is named.**
The multi-edge naming (missing absolute import, unmapped bare import, missing stylesheet, commented specifier omitted) is still asserted by calling checkImportGraph on a staged tree. The new end-to-end test proves that this same function gates the swap in the real build. Accepted.

No mocks of repository code were added. The mirror replaces only filesystem locations the build writes to; it does not replace code.

G1 is closed. Every other AC's evidence finding from report-91d568a0 stands unchanged.

## Mode Override Audit

2 overrides audited, 0 touched a trust boundary.

**report-22b124dd** (code_frozen, STORY-99, rung 3): commit ee35098b94.
- It touches only builder.css: 1 line, `font-size: 13px` becomes `var(--builder-control-font-size)`. That is exactly what was granted.
- It is consistent with AC-2232's 'none restates the size as a literal'.
- Tests are green in report-16feba3a, and no trust boundary is involved. Pass.

**report-974846f1** (code_frozen, STORY-99, rung 2): commit bd2726798e.
- It changes builder.css (+11 lines) and the test double's `subscribe` shape. The test file is outside the code_frozen rule, and both files are listed in files_touched.
- The new `.builder-library__badge--role` rule restates the base badge's own color and border-color (builder.css:1135-1136), so what the user sees is unchanged, as the planner required.
- It has no font-size literal and no `.is-placed` state, and library.js and AC-2232 are untouched.
- The conformance verdict was pass, and trust_boundary_touched is false. Pass.

Neither override is misjudged.

## Judgment Calls

- Findings carried forward: the branch diff since report-91d568a0 is test-only, the stories and ACs are byte-unchanged, and the bundle has no new comments. Re-deriving them would assess identical inputs. That keeps the verdict deterministic.
- AC-2464's 'every dangling edge named' is accepted at the checkImportGraph level, because the new end-to-end test shows that function is the gate the real build applies before the swap.

## Verdict

PASS. The stories document the behaviour surface accurately and completely, and they are faithful to the bundle's intent. Every plan item produced its story, and no superseded AC remains active. G1 is closed with behavioural evidence through the real `1c assets` entry point. A developer reading these stories would have a correct mental model of what the operator intended and what the code does.
