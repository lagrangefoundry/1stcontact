---
uid: report-ddb6d8d3
id: REPORT-2357
type: report
title: Fix 1c Capture & Diff Fidelity (story) — attempt 9
created_by: xgd
created_at: '2026-08-20T04:03:50.770483+00:00'
updated_at: '2026-08-20T04:03:50.770483+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: story
  fixes_applied: 10
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — 1c Capture & Diff Fidelity (story)

**Attempt**: 9
**Fixes applied this call**: 8
**Violations remaining**: 0
**Needs more work**: false

All three findings from report-cb71281a are addressed: the one violation
(finding 1, `code-issue`) and both warnings (findings 2 and 3).

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | code-issue | `tools/generate/src/cli/args.ts` | Registered the six drifted boolean flags (`collapse`, `clusters`, `edit`, `dry-run`, `prune`, `apply`); exported `BOOLEAN_FLAGS` with a doc comment stating the pinning discipline |
| 2 | code-issue | `tools/generate/src/cli/index.ts:183` | Re-exported `BOOLEAN_FLAGS` so the registry is assertable from evidence |
| 3 | code-issue (evidence) | `tests/req58-multi-viewport.test.ts` | Added `test_UAT_FC_REQ-58_boolean_flag_set_is_pinned_entire` — asserts the set entire, mirroring REQ-44's `test_UAT_FC_REQ-44_gated_set_is_exactly_the_browser_and_imaging_verbs` |
| 4 | code-issue (evidence) | `tests/req58-multi-viewport.test.ts` | Added `test_UAT_FC_REQ-58_boolean_flag_never_swallows_the_slug`, parameterised over every member of the registry, proving `<slug>` survives as a positional in both flag orders |
| 5 | story-body-edit | STORY-79 (`story-e15a19ef`) | Generalised §1 from the single `--multi-viewport` example to the boolean flag set as a whole; named the four additional verbs that reach the same fault; stated the assert-entire discipline; added a Technical Context bullet for the registry and the drift it had accumulated; scrubbed "In scope"/"Out of scope" to match; retargeted the stale `CAP-63 (1c Values-Diff Fidelity), CAP-65 (1c Size-Aware Diffing)` cross-reference (finding 2) |
| 6 | story-body-edit | STORY-75 (`story-d5de22a5`) | Finding 2 — Technical Context "Belongs to capability **1c Values-Diff Fidelity**" → "**1c Capture & Diff Fidelity** (CAP-63, `capability-aa030c83`, `1c_capture_diff_fidelity`)" |
| 7 | story-body-edit | STORY-76 (`story-82eb6908`) | Finding 2 — both dangling `[[values_diff_fidelity]]` wiki-links retargeted to `[[1c_capture_diff_fidelity]]` (Out of scope; Technical Context) |
| 8 | story-body-edit | STORY-77 (`story-16f2793c`) | Finding 2 — "Generalizes CAP-63 (1c Values-Diff Fidelity)" → generalises this capability's single-fixed-width comparison, CAP-63 / `1c_capture_diff_fidelity` |
| 9 | story-body-edit | STORY-78 (`story-2c7069fe`) | Finding 2 (the assessor's "most misleading" case) — "Belongs to CAP-65 (1c Size-Aware Diffing)" → "Belongs to CAP-63 (`capability-aa030c83`, `1c_capture_diff_fidelity`)", matching its own `capability_uid`; the dependency line now names the sibling story STORY-77 rather than the retired CAP-65 |
| 10 | story-body-edit | STORY-116 (`story-aaddb221`) | Finding 3 — §5's cause-map example now states `shape + border` (REQ-76's taxonomy) and marks `outline` as a shipped-code extension; new Technical Context bullet cites `tools/generate/src/cli/fidelity.ts:463-465` as its source and explains why the extension is consistent with the map's own rule |

## Code Edits

| File | Lines | Evidence chain |
|---|---|---|
| `tools/generate/src/cli/args.ts` | 11–34 (`BOOLEAN_FLAGS`) | The capability declares, for the whole command set, that "boolean flags parse as boolean and do not swallow following positionals" (scope §5), and STORY-79 §1 carries it. `parseArgs` implements it as one allowlist consulted before the command switch; an unregistered name falls to the value-taking branch (`args.ts:26-32`) and consumes the next non-`--` token. I enumerated every boolean read in the CLI (`flags.X === true` across `cli/index.ts`) and found exactly thirteen: the seven registered plus `collapse`, `clusters` (`:794-795`), `edit` (`:469`), `dry-run`, `prune` (`:498-499`), `apply` (`:978`) — the assessor's six, independently confirmed. Each of those six is reached by a command that takes `slug = requireSlug(rest[0])`, so the slug was being eaten and the command died with the `Missing required <slug>` signature REQ-58 fixed. Registered all six; exported the set. |
| `tools/generate/src/cli/index.ts` | 183 | Re-export so evidence can assert the registry entire. |
| `tests/req58-multi-viewport.test.ts` | 8–9, 112–150 | Two new UATs calling the real `parseArgs` entry point (no mocks). The parameterised UAT fails against the pre-fix registry for all six unregistered names; the pinning UAT is what converts future drift from a user-visible failure into a red test. |

Verified before checking whether the six were safe to register: no valued use of
any of them exists anywhere in the repo — all thirteen sites read `=== true`, and
the `--help` text describes each as a bare toggle.

**Test results.** `tests/req58-multi-viewport.test.ts`,
`tests/reconciliation-1c-cli-output-hygiene.test.ts`, `tests/req61-size-diff.test.ts`,
`tests/req44-install-preflight.test.ts`,
`tests/reconciliation-1c-install-preflight.test.ts` — 44 passed, 2 skipped
(chromium-gated). `tests/req63-values-diff-coverage.test.ts` — 33 passed. No test I
did not touch changed state.

`tsc --noEmit -p tools/generate/tsconfig.json` reports one error,
`builder.ts(337,29)`, which I confirmed pre-exists my change by stashing and
re-running. Not introduced here; not in scope for this finding.

Committed as `9e8abb376`.

## Deliberately Not Done

**No capability-body edit.** Finding 1 names `capability-aa030c83 (scope §5)` as a
co-located element, but its claim was accurate all along — the assessor's own
framing is that "the guarantee is meant to hold CLI-wide; the allowlist is what has
fallen behind". With the registry complete the scope sentence is now true as
written, so narrowing or annotating it would move the matrix away from the
capability's stated reason for owning CLI mechanism wholesale. See the read-anomaly
note below for a second reason I did not write this ticket.

## needs_review Items Forwarded

None from report-cb71281a's findings table. Two observations for the operator:

| Element | Observation | Decision needed |
|---|---|---|
| `capability-aa030c83` | **`xgd ticket get` returns a stale body for this capability.** The read (both human and `--json`) yields 6425 chars and is missing attempt 8's report-surface scope bullet *and* both new History paragraphs ("BUNDLE-10 attribution repair", "Unbundled-intent repair"). The committed file at git HEAD (`.xgd/tickets/hot/capability-aa030c83.md`, 9959 chars) has all of them. This worktree's sparse-checkout excludes `/.xgd/tickets/**`, so xgd is materialising ticket files on demand; the story reads were all current (verified — every story edit I made lands as a small surgical diff with no unintended deletions), but the capability read is not. **Any editor that reads this capability body and writes it back will silently revert attempt 8's repair.** I avoided that by not writing it. | Is the on-demand materialisation caching per ticket type, or is there a second store copy? Worth fixing before another attempt edits a capability body. |
| Matrix-wide | The assessor's "Notes for the Editor" identify the unbundled-intent sweep as the highest-yield next move against CAP-70 (REQ-67/68/70/71/75/77/87) and CAP-71 (BUG-5, REQ-74, REQ-78). Out of scope for this capability. | Schedule the sweep against those capabilities. |
