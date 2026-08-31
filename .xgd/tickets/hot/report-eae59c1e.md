---
uid: report-eae59c1e
id: REPORT-2962
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:21:47.949313+00:00'
updated_at: '2026-08-31T15:21:47.949313+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **UU**, intent/bookkeeping ticket (REQ-149,
  `type: request`), so rule **2e**. Conflict existed in the index only: the path is
  outside the sparse-checkout cone (DOC-986 §2/§4.1), so the working tree carried no
  markers. Resolved with `git checkout --ours` + `git add --sparse`.

  Incoming commit: `c9f82a85cdfd4211ae075ce9306b7c276ec8fb00` (2026-08-23 15:01 -0700,
  "xgd(ticket): update request request-554ac441").
  HEAD-side commit: `b6ac2faae63d9bbfb4e29cb7b19ed6623f58a32c` (2026-08-30 22:06 -0700,
  "xgd(ticket): seed_local_overlay request request-554ac441").

  Per-fact resolution against the merge base (`de1dfccc70ea…`):

  - **body** — only HEAD changed it, appending the "Follow-up: the deploy secret guard
    asked the wrong question" section (cause, decision table, ACs 13–16, test-changes
    note, 0.2.9 version bookkeeping). Incoming's body delta was a stripped trailing
    newline and nothing else. HEAD is a strict superset → keep HEAD.
  - **fields.commits / fields.version / fields.bundled_in / fields.chat_comment** — only
    HEAD changed them (two additional `working_sha` entries, `working_sha_history: []`
    backfill on two more, `version: 0.2.7 → 0.2.9`, `bundled_in: bundle-b3b7c399`,
    `chat_comment: comment-98e86f10`). Untouched on the incoming side → keep HEAD.
  - **status** — the one genuinely competing fact. Incoming: `free_coded → free_coding`.
    HEAD: `free_coded → bundled`. The auto-enrichment reported intent unknown on one or
    both sides, prescribing the more recent commit by timestamp; that is HEAD, later by
    both measures (commit 2026-08-30 vs 2026-08-23; ticket `updated_at`
    2026-08-24T02:10:41 vs 2026-08-23T22:01:13). It is also the only
    lifecycle-consistent answer — `free_coding → free_coded → bundled` — so taking
    incoming would regress an already-bundled ticket back to in-progress. Kept
    `bundled`.
  - **updated_at / last_field_updated** — derived bookkeeping for the `status` decision
    above; they follow HEAD (`2026-08-24T02:10:41.591464+00:00`, `status`).

  No fields were invented, and no `intent_uid` / `story_uid` / `capability_uid` was
  touched.

## Incoming changes preserved

No code or implementation files were conflicted in this cherry-pick — the incoming
commit `c9f82a8` touches exactly one file, this ticket, changing 4 lines
(`updated_at`, `last_field_updated`, `status`, trailing newline). So STEP 3's
code-file verification has no targets.

For the one ticket file: the incoming commit's substance is present in HEAD by a
different route rather than discarded. `c9f82a8` set the ticket to `free_coding` at
2026-08-23 15:01 — the developer re-opening REQ-149 for the deploy-secret-guard
increment. The *output* of that increment is already in HEAD's version of this same
ticket: the ACs 13–16 follow-up section, the `ec144c85…` / `02bd4437…` commit entries,
and the 0.2.9 bump all describe and record precisely that work, after which the ticket
advanced past `free_coding` to `bundled`. Keeping HEAD therefore preserves the incoming
intent's result; only the transient in-progress status marker is superseded, per 2e's
per-fact timeline rule.

No hunk was dropped under the BUG-1301 precedence exception; no UAT test function was
deleted (none appear on either side of this conflict).

## Staging state

Resolution nets to no diff vs HEAD (`git diff --cached HEAD` is empty), because HEAD
already holds the later state of every fact in dispute. Per STEP 4 this is staged and
exited `@done` as normal — `--skip` was NOT called, and `CHERRY_PICK_HEAD`
(`c9f82a85cdfd4211ae075ce9306b7c276ec8fb00`) is still present for
`cherry_pick_finalize_resolution`. This is the redundant case, not the discarded case,
by STEP 3's own test: the incoming commit's key change is present in HEAD via the
ticket's later lifecycle advance, not simply absent.
