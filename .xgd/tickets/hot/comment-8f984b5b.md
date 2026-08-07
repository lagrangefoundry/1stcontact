---
uid: comment-8f984b5b
id: COMMENT-833
type: comment
title: Claude response for fix_implementation_drift report
created_by: xgd
created_at: '2026-08-07T23:39:08.200898+00:00'
updated_at: '2026-08-07T23:39:08.200898+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-61520331
  kind: note
---

**@done**

## What the verdict actually reported

Not failing UATs. Vitest ran **12 passed, 0 failed** — all 9 failures came from the `AC Coverage` pseudo-suite, every one `orphaned_ac`. Those criteria had no *passing* test because their UATs **skipped**.

All 9 sit in `describe.skipIf(!WEBUI_INSTALLED)` blocks in `tests/reconciliation-builder-workspace-chrome.test.ts`. The 12 that passed are the siblings authored to degrade gracefully — which is exactly why the split was 12/9.

## Root cause

The webui components come from a shared artifact store installed *beside* the checkout (`/Users/martin/lagrangefoundry/node_modules/@gendevlabs/…`), found by Node's upward resolution. A `git worktree` checkout is the same repository parked at `~/.xgd/worktrees/…` — outside that tree. The walk reached nothing, so every component resolved as absent, `WEBUI_INSTALLED` went false, and the suites skipped. That is the authored response to a machine that never ran the out-of-band install, and indistinguishable from one.

The implementation was never wrong — the evidence was unreachable, and would have been on **every** develop/reconcile/regression worktree, permanently. Proven by symlinking the store in (diagnostic only, since removed): the same unmodified tree went from `1 passed | 9 skipped` to `10 passed`.

## Fix — `d3609ac54`

- `tools/generate/src/cli/webui.ts` — anchor resolution at the repository's main checkout (via `.git`'s `commondir` when in a linked worktree).
- `vitest.config.mts` — derive Vite `resolve.alias` from that same single resolution point, since Vite resolves the builder's bare specifiers at transform time and needs the same answer.

Fresh-clone behaviour is unchanged: nothing resolves, nothing is aliased, suites skip as before.

## On the timeline rule

The owning intent (`bundle-15c1f647`, T=1786076192) is *earlier* than the anchor (`bug-5cabb340`, T=1786121518), which reads mechanically as case 2b. I did not treat it as 2b, because its premise fails: `git diff main..HEAD` touches only `.xgd/tickets/**` — the branch carries **zero code**, so it cannot have superseded anything, and BUG-32's scope rename *supports* these criteria rather than invalidating them. Exiting `@fail` there would have advised deprecating nine sound ACs. Handled as 2c.

## Verification

Under the verdict's own filter: **21 passed** (was 12 passed / 9 orphaned). All three resolution branches exercised directly. Typecheck identical before and after (verified by stashing).

## Flagged for you

Two pre-existing problems, not caused by this change, that stop being hidden once worktrees run these suites — both confirmed failing identically in the main checkout on `xgd-working`, and neither in the AC-959…979 filter, so the `matrix_verdict` re-run is unaffected. A later full-suite gate will see them:

- `story-3bf94bd4` — AC-994, AC-1000, AC-1001, AC-1002, AC-1003 fail in `tests/reconciliation-copy-edit-gesture-modal.test.ts`.
- `test_UAT_FC_REQ-115_open_in_new_tab_matches_the_iframe_exactly` is an **FC orphan** reconciliation should have renamed or deleted; its successor AC-971 passes.

Report: `REPORT-1659` (`report-61520331`), `result: pass`.
