---
uid: report-bc7c758e
id: REPORT-2462
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (story) — attempt
  1'
created_by: xgd
created_at: '2026-08-20T15:44:37.925220+00:00'
updated_at: '2026-08-20T15:44:37.925220+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: story
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (story)

**Attempt**: 1
**Fixes applied this call**: 3
**Violations remaining**: 0
**Needs more work**: false

The report carried exactly one violation (finding 1) and one warning the assessor
explicitly ruled out of matrix scope (finding 2). Findings 3–6 are `info` with
`Suggested edit: none`. Both halves of finding 1 — the story In-scope bullet and the
AC that gives the orphaned evidence a home — were applied in this call, so the matrix
is consistent at this call boundary rather than passing through a state where the
story claims an import-graph property no AC expresses.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-118 (`story-3f4a5f2b`) | Added a Description paragraph ("The seam is asserted over the imports, not only over a run that behaved") placed with the other seam claims, ahead of "Two stores, both current, neither detected" — not appended at the bottom. It states that the editing surface's module and the port's supporting modules name no filesystem module at all, and why a behavioural pass cannot substitute (under `nodejs_compat` a filesystem import *resolves* in workerd and yields a per-isolate ephemeral filesystem, per REQ-146 AC-6 and its REQ-103 finding). |
| 2 | story-body-edit | STORY-118 (`story-3f4a5f2b`) | Added the In-scope bullet the finding asked for, immediately after the "declared storage operations … absence of any location-shaped return value" bullet whose scope it extends: the surface and the port's own modules reach no filesystem *in their imports*, the seam asserted over the import graph rather than inferred from a suite that passed. Out-of-scope and Technical Context were re-read and need no parallel scrub — neither contradicts the added claim. Everything else preserved verbatim (body 10050 → 10971 chars, additive only). |
| 3 | ac-add | AC-1353 (`acceptance_criterion-003caa07`) | New AC "The editing surface and the port import no filesystem module" under `story-3f4a5f2b`, `kind=behavior`, `regression_only=false`, promoted from `pending` to `status=active` to match its eight siblings. Criterion covers `edit.ts` plus the port's own modules (declaration, assembly/validation path, journal model, filesystem-free store), and records that the filesystem-backed adapter behind its separate entry point is the one expected filesystem import. Verification is structural by intent, on the same footing the report notes for AC-1328/AC-1329 ("the structure *is* the deliverable"), with the reason a behavioural route cannot carry it stated in the AC itself. |

## Evidence Chain for Finding 1

Confirmed against `origin/main` rather than the working tree, for the reason the
report gives (this worktree's HEAD `07caaba86` predates BUNDLE-19's merge `b18b859d…`
and has no `tools/generate/src/store/site-store.ts` and no `vitest.workers.config.mts`):

- REQ-142 (`request-0dd62a5d`, `free_and_reconciled`) §6 AC-2: "No `node:fs` or `node:path` import remains in `edit.ts`", and §7 "Injection": `edit.ts` imports the port's *types* only; `fsSiteStore(ctx)` lives in a Node-only entry so the Worker-safe path never pulls `node:fs`.
- The evidence is already in the tree and already labelled with the intent's AC number — `git show origin/main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts` carries the header `// ── AC-2: the seam is real, not described` above two tests at lines 105 and 115: "edit.ts imports no filesystem module" (asserts no `from 'node:fs'`, no `from 'node:path'`, no `from '../store'`) and "the port and its model reach no filesystem" (asserts no `from 'node:` and no `from './fsutil'` across `site-store.ts`, `assemble.ts`, `journal-model.ts`, `memory-store.ts`). AC-1353's criterion was written to match what those two already assert, so the uat-level cycle can map them without rewriting either.
- Why it is a distinct claim rather than covered by AC-1322/AC-1324: REQ-146 (`request-0cdfdc5b`) §2 records REQ-103's finding that under `nodejs_compat` `node:fs` resolves in workerd and gives a per-isolate ephemeral filesystem, so a file-backed path "passes a test in workerd and loses every session in production" — "A successful import is not evidence; the guard is a static import-graph check". REQ-146's own AC-6 encodes the same reasoning.

## Code Edits (if any)

None this call.

## Not Applied, With Reasons

| Finding | Why not |
|---|---|
| 2 (warning, `code-issue`, `vitest.workers.config.mts:23-28`) | The report's own suggested edit is "No matrix edit. Operator decision." The stale rationale comment is on `origin/main` and this worktree has no `vitest.workers.config.mts` at all, so it is not editable from here even if it were in scope. STORY-118's "Known divergence" paragraph was left untouched — it is accurate, it was verified during the check, and it is the only thing in the matrix stopping a later reader re-deriving the retracted supply-chain diagnosis. Forwarded below. |
| 3, 5, 6 (info) | `Suggested edit: none` / explicitly deferred to the ac-level and uat-level cycles. AC-1321's narrow enumeration (finding 5) and the FC-vs-reconciliation UAT overlap (finding 6) are named as belonging to those levels, not this one. |
| 4 (info) | Four `ready_to_reconcile` intents (REQ-143, REQ-145, REQ-146, REQ-148) will stale the "two implementations" and eleven-verb claims. Authoring those edits now would make the matrix describe unreconciled code, which the report explicitly rules out. Expect a `story-body-edit` when REQ-143 reconciles. |

## UAT Note for the Next Level

No UAT was authored for AC-1353 and `uat_coverage` was deliberately left unset, matching
its eight siblings (all `uat_coverage: None`). Two reasons: level here is story, and the
worktree physically cannot host the test — `tools/generate/src/store/` here contains only
the pre-port modules (`base.ts`, `diff.ts`, `fsutil.ts`, `history.ts`, `index.ts`,
`loadSite.ts`, `paths.ts`, `snapshot.ts`), with no `site-store.ts`, `assemble.ts`,
`journal-model.ts` or `memory-store.ts` to assert over, and `tests/` contains no
`test_UAT_AC132*` file. A `test_UAT_AC1353_*` reconciliation UAT should be authored on a
tree containing BUNDLE-19, where it can mirror the two existing FC assertions.

**Survey hazard, restated for whoever does that**: `builder.ts` and `fidelity.ts` carry
deliberate NUL bytes as cache-key separators, so a plain recursive grep skips them as
binary. Any import survey must force text mode (`git grep -a`) or it will miss the port's
largest consumer.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `vitest.workers.config.mts:23-28` (on `origin/main`) | Finding 2: the pin's rationale comment states the retracted supply-chain-policy cause; REQ-141 left it "pending a decision on whether to reopen this ticket for a comment-only commit or fold it into the dependency-bump work" | Correct or delete the comment, or fold it into the dependency-bump work. No matrix action either way; STORY-118's divergence note stays until it is done. |
