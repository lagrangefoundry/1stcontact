---
uid: report-b12ad6e7
id: REPORT-3645
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T03:16:47.526705+00:00'
updated_at: '2026-09-10T03:16:47.526705+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — class **UU**, rule **2e (intent/bookkeeping ticket)**, per-fact resolution by working-timeline position.
  Resolved to the HEAD side (`git checkout --ours` + `git add --sparse`). No hand-editing of the ticket file.

### Why

Three-way analysis of the blobs (base `1d48ebb6`, ours `bb444506`, theirs `4680e71d`):

- **Incoming (`3fa48a6b`, free_coded, 2026-08-29 21:32:26 -0700) vs base — the ENTIRE diff is two lines:**
  - `updated_at`: `2026-08-28T03:59:15` → `2026-08-30T04:32:26`
  - `status`: `reconciling` → `ready_to_reconcile`
  It touches no other field, no `fields.*` entry, and no body text.

- **HEAD (`8e07e601`, 2026-08-31 07:23:04 -0700) vs base — changes the same lifecycle facts, ~34h later, plus completion bookkeeping:**
  - `status`: `reconciling` → `free_and_reconciled`
  - `completed_at`: `null` → `2026-08-31T14:22:24`
  - `last_field_updated`: `status` → `result`
  - `result: pass`, `merged_at_commit: eef7a8b4`, and the `fields.commits` list rewritten to the resolved `old_sha`/`new_sha` mapping.

Every fact the incoming commit touches (`status`, `updated_at`) is a fact HEAD also
changed, from a later-positioned intent. There is **no disjoint fact on the incoming
side to combine** — so 2e's "apply BOTH" and "keep the superset" branches do not
apply, and the genuine-conflict branch does: keep the later side, per fact. That is
HEAD for both facts, which makes taking ours in full identical to the per-fact result.

Semantically consistent as well: the incoming commit walks the bundle *backwards*
(`reconciling` → `ready_to_reconcile`, a retry reset), while HEAD carries the bundle
to its terminal state `free_and_reconciled` with `result: pass` and the sha mapping
recorded. Reinstating `ready_to_reconcile` would revert an operator-owned terminal
lifecycle status and orphan `result`/`merged_at_commit`.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole conflicted path is an
xgd bookkeeping ticket (kind `bundle`), so STEP 3's code-discard guard has no code
file to check.

For the ticket itself, the incoming commit's single intent (`status:
ready_to_reconcile`) is deliberately not present in the resolution. That is the
correct outcome of 2e's timeline rule, not a discard of developer code: it is an
intermediate lifecycle value that the HEAD side superseded 34 hours later with the
terminal value `free_and_reconciled`. No BUG-1301 precedence exception was needed or
invoked; no test function was deleted.

## Staging state

`git ls-files -u` → 0 unmerged entries; no conflict-class lines remain in
`git status --porcelain`. The staged diff vs HEAD is empty (the resolution nets to no
change), which per STEP 4 is expected — `cherry_pick_finalize_resolution` will detect
the clean staged diff and skip the commit. `CHERRY_PICK_HEAD` is intact; no
`--continue`/`--skip`/`--abort`/`reset` was run.
