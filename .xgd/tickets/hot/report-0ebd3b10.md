---
uid: report-0ebd3b10
id: REPORT-2963
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:23:37.405087+00:00'
updated_at: '2026-08-31T15:23:37.405087+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **UU**, intent/bookkeeping ticket (REQ-149,
  `type: request`), so rule **2e**. Conflict lived in the index only: the path is
  outside the sparse-checkout cone (DOC-986 §2/§4.1), so the working tree carried no
  markers. Resolved with `git checkout --ours` + `git add --sparse`.

  Incoming commit: `e95404260a1c82b22d20887b366729ed9e7af497` (2026-08-23 15:05 -0700,
  Martin Westhead, "xgd(ticket): update request request-554ac441"), 80 insertions /
  3 deletions, this file only.
  HEAD-side commit: `b6ac2faae63d9bbfb4e29cb7b19ed6623f58a32c` (2026-08-30 22:06 -0700,
  "xgd(ticket): seed_local_overlay request request-554ac441"). HEAD is unchanged from
  the previous attempt (`1fc01ad9` tip), the prior cherry-pick having been a no-op.

  Merge base for this attempt is blob `72613269…` — the previous attempt's incoming
  blob. Per-fact resolution:

  - **body — the "Follow-up: the deploy secret guard asked the wrong question"
    section** (cause, decision table, ACs 13–16, test-changes note). This is the whole
    substance of the incoming commit, and HEAD already holds it **byte-identical**.
    A direct blob diff of theirs (`8aef843d…`) against ours (`6546223f…`) shows zero
    difference across all 77 lines of that section.
  - **body — the closing "### Version bookkeeping" paragraph.** The one place the two
    bodies differ, and both sides wrote it. Incoming: "the fix, its UATs, the README
    contract update and the version bump are one commit. Ticket version is now 0.2.8."
    HEAD: the same fact ("one commit, which bumped to 0.2.8") plus the subsequent
    second bump and why `move-to-free-coded` required it, ending at 0.2.9. HEAD is a
    later revision of the same paragraph that retains incoming's fact rather than
    contradicting it → keep HEAD.
  - **fields.commits / fields.version / fields.bundled_in / fields.chat_comment** —
    only HEAD changed them (two additional `working_sha` entries plus
    `working_sha_history: []` backfill on two more, `version: 0.2.7 → 0.2.9`,
    `bundled_in: bundle-b3b7c399`, `chat_comment: comment-98e86f10`). Untouched on the
    incoming side → keep HEAD.
  - **status** — incoming leaves `free_coding`; only HEAD changed it, to `bundled`.
    Single-sided → keep HEAD. It is also the only lifecycle-consistent answer:
    `free_coding → free_coded → bundled`.
  - **updated_at / last_field_updated** — derived markers of whichever edit was last.
    Incoming: `2026-08-23T22:05:12` / `body`. HEAD: `2026-08-24T02:10:41` / `status`.
    HEAD's edit is the later one by ~4 hours, and `status` is the correct derived
    marker for it (that edit set `status: bundled`). Keeping HEAD's pair is the
    self-consistent choice; adopting incoming's `body` marker alongside HEAD's later
    status change would leave the two fields describing different edits.

  No fields were invented, and no `intent_uid` / `story_uid` / `capability_uid` was
  touched.

## Incoming changes preserved

No code or implementation files were conflicted — the incoming commit `e9540426`
touches exactly one file, this ticket. STEP 3's code-file verification therefore has
no targets.

For the ticket, the STEP 3 test is answered directly and positively: the incoming
commit's key change — the entire deploy-secret-guard follow-up section, ACs 13–16
included — **is present in HEAD**, verbatim, verified by blob-to-blob diff. This is
the redundant case (present via a different route: the same body text reached HEAD
through the `seed_local_overlay` commit), not the discarded case. Nothing developer-
authored is lost: the only text unique to the incoming side is an earlier draft of one
bookkeeping paragraph whose content HEAD's later draft subsumes.

No hunk was dropped under the BUG-1301 precedence exception; no UAT test function was
deleted (none appear on either side of this conflict).

## Staging state

Resolution nets to no diff vs HEAD (`git diff --cached HEAD` is empty), because HEAD
already holds the later state of every fact in dispute. Per STEP 4 this is staged and
exited `@done` as normal — `--skip` was NOT called, and `CHERRY_PICK_HEAD`
(`e95404260a1c82b22d20887b366729ed9e7af497`) is still present for
`cherry_pick_finalize_resolution`.
