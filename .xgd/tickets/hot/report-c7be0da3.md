---
uid: report-c7be0da3
id: REPORT-2822
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:54:18.615613+00:00'
updated_at: '2026-08-31T07:54:18.615613+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-a03967f2.md` — **UU**, intent/bookkeeping ticket (`request-*`), rule **2e** (strict-superset branch). Path is outside the sparse-checkout cone, so the conflict existed only in the index with no working-tree markers; resolved with `git checkout --ours -- <path>` then `git add --sparse -- <path>` (DOC-986 §2/§4.1).

### Why "ours" rather than a timeline coin-flip

The three index stages differ **only in frontmatter** — the entire markdown body is byte-identical across base, ours and theirs. Diffing the blobs directly:

- base → **theirs** (incoming, `50fc10b7` "xgd(ticket): update request request-a03967f2"): a single added line, `fields.chat_comment: comment-869ded75`. The commit is 1 file / 1 insertion in total.
- base → **ours** (`seed_local_overlay`, `updated_at` 2026-08-24T02:10:41Z): the same `chat_comment: comment-869ded75` line, **plus** `fields.bundled_in: bundle-b3b7c399` and `status: ready_to_reconcile → bundled`.

Ours is therefore a strict superset of theirs, per-fact: every fact the incoming commit asserts is asserted identically on the ours side, and ours additionally carries the later bundling facts (`updated_at` 2026-08-24 > incoming's 2026-08-23T03:29:49Z, which is unchanged from base). There is no fact changed differently on the two sides, so the `xgd working-timeline` tie-break in 2e was not needed — the superset rule settles it, and the auto-enrichment's "take the more recent commit by timestamp" hint points the same way. No content was invented, and no `intent_uid`/`story_uid`/`capability_uid` field was touched.

## Incoming changes preserved

Confirmed. `git show 50fc10b759dfe262320a64390f16b71fc285399a` contains exactly one hunk — `+  chat_comment: comment-869ded75` — and that line is present verbatim in the resolved (staged) file at the same position in `fields:`. Nothing from the incoming commit is absent.

## Note for the finalize step

The staged tree nets to **no diff vs HEAD** (`git status --porcelain -uno` is empty, `git ls-files -u` is empty). This is the redundant-commit case, not a discard: per STEP 3, the discriminator is whether the incoming commit's key change is *present in HEAD* or *simply absent*, and here it is demonstrably present — HEAD's ours-side blob already carries `chat_comment: comment-869ded75`, having been written by a later intent that also bundled the ticket. Per STEP 4 this is staged and exited @done without calling `--skip`; the Python finalize step will detect the clean staged diff. `CHERRY_PICK_HEAD` was left intact.

No BUG-1301 precedence exception was invoked, and no test function was deleted — no code or test file was involved in this conflict.
