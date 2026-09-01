---
uid: report-7669bee8
id: REPORT-3147
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T00:41:27.474413+00:00'
updated_at: '2026-09-01T00:41:27.474413+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/request-a03967f2.md` — class **AA** (both added), intent/bookkeeping
  ticket (`request-*`) → rule **2e**, applied per-fact. Path is outside the sparse-checkout
  cone (`!/.xgd/tickets/**`, DOC-986 §2/§4.1) but was materialized with real markers;
  staged with `git add --sparse`.

Both sides descend from the same ticket state (blob `ae065ef78f`, `status: free_coded`,
`updated_at: 2026-08-22T22:07:40Z`). It presents as AA only because the incoming commit
records the path as a new file on its branch history. The two blobs differ in **frontmatter
only** — the 164-line body is byte-identical. Complete fact inventory (`git diff :2: :3:`,
two hunks; the worktree file contained exactly two marker regions, matching one-to-one, so
no auto-merged region existed anywhere in the file):

| Fact | Ours (HEAD `a4b923f9`, Aug 30, `seed_local_overlay`) | Incoming (`c5752ee5`, Aug 22, `update`) | Resolution |
|---|---|---|---|
| `status` | `bundled` | `ready_to_reconcile` | **ours** — not competing: `bundled` is downstream of `ready_to_reconcile` in the lifecycle and subsumes it; ours is also the later-positioned intent (Aug 30 vs Aug 22) |
| `fields.chat_comment` | `comment-869ded75` | absent | **ours** — field incoming never touched (strict superset) |
| `fields.bundled_in` | `bundle-b3b7c399` | absent | **ours** — field incoming never touched (strict superset) |
| `updated_at` | `2026-08-24T02:10:41Z` | `2026-08-23T03:29:49Z` | **ours** — later |

Ours is a strict superset on every fact, so the per-fact composition equals the ours blob
(`97b4d0d0`) exactly, which is also the HEAD blob — `checkout --ours` was provably lossless
here rather than assumed so. Taking the incoming `status` would additionally have produced
an internally inconsistent ticket: `status: ready_to_reconcile` alongside
`bundled_in: bundle-b3b7c399`.

No fields.intent_uid / story_uid / capability_uid were touched. No content was invented.

## Incoming changes preserved

No code/implementation files were in this conflict; the sole conflicted file is a
bookkeeping ticket.

The incoming commit `c5752ee5`'s only change to this ticket was the transition
`status: free_coded → ready_to_reconcile`. That intent is **present in the result via a
different route, not discarded**: HEAD carries `status: bundled`, a state reachable only
by passing through `ready_to_reconcile`, and `fields.bundled_in: bundle-b3b7c399`
corroborates that the ticket did progress past reconcile-readiness into a bundle.

This is the BUG-1109/BUG-1122 redundant-commit shape, and STEP 3's discard guard is
satisfied on its own terms: the incoming commit's key change is present in HEAD (redundant),
not simply absent (discarded). The resolution therefore nets to an empty staged diff vs
HEAD, which STEP 4 states is not a failure condition. Per STEP 4 I did **not** call
`--skip`; the staged tree is left for `cherry_pick_finalize_resolution` to detect and skip.
`CHERRY_PICK_HEAD` (`c5752ee5`) is intact and `git ls-files -u` is empty.

No hunks were dropped under the BUG-1301 precedence exception.
