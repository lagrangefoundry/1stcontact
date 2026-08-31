---
uid: report-f257d7ad
id: REPORT-2882
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T09:09:26.134867+00:00'
updated_at: '2026-08-31T09:09:26.134867+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — UU, intent/bookkeeping ticket (STEP 2 rule **2e**).
  Out of the sparse-checkout cone, so the conflict existed only in the index with no
  working-tree markers; resolved with `git checkout --ours` + `git add --sparse` (DOC-986 §2/§4.1).

  Both sides' diffs vs base:
  - **Incoming** (`c9f82a85` "xgd(ticket): update request request-554ac441", committed 2026-08-23T15:01:14-07:00):
    4 frontmatter lines only — `updated_at` → `2026-08-23T22:01:13Z`, `last_field_updated: body` → `status`,
    `status: free_coded` → `free_coding`, plus stripping the trailing EOF newline. Body unchanged.
  - **Ours** (`b6ac2faa` "xgd(ticket): seed_local_overlay request request-554ac441", committed 2026-08-30T22:06:21-07:00):
    `updated_at` → `2026-08-24T02:10:41Z`, `last_field_updated: status`, `status: bundled`,
    `version` 0.2.7 → 0.2.9, added `bundled_in: bundle-b3b7c399` and `chat_comment: comment-98e86f10`,
    two new `working_sha` entries plus `working_sha_history` on the existing two, and an ~87-line new
    body section ("Follow-up: the deploy secret guard asked the wrong question"). Also no trailing EOF newline.

  Per-fact resolution:
  - **Body / fields the other side never touched** — ours is a strict superset (incoming made zero body
    edits beyond the EOF newline, which ours matches). Superset kept, per 2e "one side is a strict superset".
  - **`status` / `updated_at`** — the one fact both sides changed. Later-positioned side wins per fact:
    ours' ticket `updated_at` (2026-08-24T02:10Z) and commit date (2026-08-30) are both later than
    incoming's (2026-08-23T22:01Z / 2026-08-23). `bundled` is also downstream of `free_coding` in the
    lifecycle, and ours' `bundled_in` names this very bundle (bundle-b3b7c399) — taking incoming would
    regress the ticket behind the bundling HEAD already performed.
  - `last_field_updated: status` is identical on both sides; no conflict there.

  No content was invented; nothing outside what one side already declared was modified.

## Incoming changes preserved

No code/implementation files were in this conflict — the single conflicted path is a bookkeeping
request ticket (2e), not a spec ticket (2d) and not source.

The incoming commit's only changes to this file are the lifecycle advance to `status: free_coding`
and its accompanying `updated_at`. That intent **is present in HEAD via a later route**, not discarded:
HEAD carries the same ticket forward past `free_coding`/`free_coded` to `status: bundled` with a strictly
later `updated_at`, and preserves every body byte the incoming side had. This is STEP 4's
redundant-commit case (BUG-1109/BUG-1122), not STEP 3's discard case — the incoming change is superseded
by a downstream state on the same field, not absent.

Consequently the staged tree is byte-identical to HEAD for this path (`git diff --cached HEAD` is empty).
Per STEP 4 this is **not** a @fail and `--skip` was **not** called; the tree is staged and left for
cherry_pick_finalize_resolution to handle. `CHERRY_PICK_HEAD` was verified still present after staging.

No hunks were dropped under the BUG-1301 precedence exception. No UAT test files were involved.

## Flagged for post-merge review

The auto-enrichment reported intent unknown on one or both sides and asked that this file be flagged.
Flagging here: `.xgd/tickets/hot/request-554ac441.md` was resolved by commit/ticket timestamp ordering
plus superset containment rather than by an `xgd working-timeline` intent comparison.
