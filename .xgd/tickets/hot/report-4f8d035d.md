---
uid: report-4f8d035d
id: REPORT-2808
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:37:28.428710+00:00'
updated_at: '2026-08-31T07:37:28.428710+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-22a6521a.md` — class **AA** (both added), intent/bookkeeping ticket (`request-*`, kind-based so 2e applies even though it lives in `hot/` per tiering). Rule applied: **2e — strict superset, keep the superset.**

  Diff between the two index stages was a single added line on the incoming side:

  ```
  +  chat_comment: comment-0891bc1f
  ```

  under `fields:` in the frontmatter. Every other byte of the 152/153-line file is identical across both sides — same `status: free_and_reconciled`, same `version: 0.1.32`, same `bundled_in: bundle-e59210c5`, same `commits[].working_sha`, same body. No field is set to two different values on the two sides, so there is no competing fact and no timeline tiebreak was needed (`xgd working-timeline` not consulted — nothing to arbitrate).

  The auto-enrichment header flagged this as "intent unknown on one or both sides → take the more recent commit by timestamp and flag for post-merge review." That fallback is moot here: the incoming side contains the HEAD side in full plus one field HEAD never touched, so the superset rule and the timestamp rule select the same content. Resolved to the incoming blob `191bf6a1` (stage 3) via `git checkout --theirs` + `git add --sparse` (path is under `.xgd/tickets/`, outside the sparse-checkout cone — DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-22a6521a.md` — **confirmed, byte-exact.** The staged index entry is `100644 191bf6a120dbd76d1b3cb2cfc781c103af3f94b0 0`, which is the incoming (stage 3) blob hash unchanged. The incoming commit `387e079528e9d9cde15eb38243db62bd07e5ac0e` ("xgd(ticket): update request request-22a6521a", Martin Westhead, Sun Aug 23 13:12:46 2026 -0700) touches only this one file; its `chat_comment: comment-0891bc1f` addition is present in the resolved version.

No hunks were dropped. The BUG-1301 precedence exception was not invoked — no HEAD-side refactor removed any target here, and no test functions were involved in this conflict.

`git status --porcelain` shows no remaining conflict classes; the file stages as `M`. The in-progress cherry-pick was left untouched (`CHERRY_PICK_HEAD` still present) for `cherry_pick_finalize_resolution`.
