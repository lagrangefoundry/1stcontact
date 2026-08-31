---
uid: report-3e9f2ec5
id: REPORT-2884
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T09:11:41.959936+00:00'
updated_at: '2026-08-31T09:11:41.959936+00:00'
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

  Incoming this time is `e9540426` "xgd(ticket): update request request-554ac441"
  (committed 2026-08-23T15:05:13-07:00) — a *different* commit from the one at scope 214
  (`c9f82a85`, 15:01:14), and a substantive one: 80 insertions, 3 deletions.
  HEAD side is `b6ac2faa` "xgd(ticket): seed_local_overlay request request-554ac441"
  (committed 2026-08-30T22:06:21-07:00).

  Both sides' diffs vs base:
  - **Incoming**: frontmatter `updated_at` → `2026-08-23T22:05:12Z` and
    `last_field_updated: status` → `body`; plus an ~80-line new body section
    "Follow-up: the deploy secret guard asked the wrong question" (cause, decision table,
    ACs 13–16, test changes, version bookkeeping closing at 0.2.8). Frontmatter `version`
    left at 0.2.7; `status` left at `free_coding`.
  - **Ours**: `updated_at` → `2026-08-24T02:10:41Z`, `status: free_coding` → `bundled`,
    `version` 0.2.7 → 0.2.9, added `bundled_in: bundle-b3b7c399` and `chat_comment: comment-98e86f10`,
    two new `working_sha` entries plus `working_sha_history` on the existing two — and the
    **same** "Follow-up: the deploy secret guard asked the wrong question" section, carried
    forward with a longer Version bookkeeping tail.

  Per-fact resolution:
  - **The new body section** — not a competing fact at all: both sides add it, and ours
    contains the incoming's text verbatim through the ACs and Test changes. Not a "pick a winner".
  - **Version bookkeeping closing paragraph** — the only body region that differs. Ours is a
    later evolution that *retains* the incoming's fact ("one commit, which bumped to 0.2.8")
    and appends the subsequent `move-to-free-coded` narrative closing at 0.2.9. Superset kept,
    per 2e; nothing the incoming asserted was dropped, only extended.
  - **`status` / `updated_at` / `version` / `last_field_updated`** — the facts both sides set
    differently. Later-positioned side wins per fact: ours' ticket `updated_at`
    (2026-08-24T02:10Z) and commit date (2026-08-30) are both later than incoming's
    (2026-08-23T22:05Z / 2026-08-23). `bundled` is downstream of `free_coding`, `0.2.9` is
    downstream of `0.2.7`, and ours' `bundled_in` names this very bundle (bundle-b3b7c399) —
    taking incoming would regress the ticket behind the bundling HEAD already performed.

  No content was invented; nothing outside what one side already declared was modified.

## Incoming changes preserved

No code/implementation files were in this conflict — the single conflicted path is a
bookkeeping request ticket (2e), not a spec ticket (2d) and not source. The verification
below was run anyway, since this incoming commit carries real authored prose.

Diffing the incoming stage against the resolved file, exactly **six** incoming lines are
absent, all of them superseded bookkeeping rather than discarded content:

    updated_at: '2026-08-23T22:05:12.768189+00:00'     -> ours 2026-08-24T02:10:41Z (later)
    last_field_updated: body                           -> ours: status (later operation)
    status: free_coding                                -> ours: bundled (downstream state)
      version: 0.2.7                                   -> ours: 0.2.9 (downstream bump)
    "The fix, its UATs, the ...README.md contract update and the
     version bump are one commit. Ticket version is now 0.2.8."
                                                       -> ours retains the 0.2.8 fact and
                                                          extends it through to 0.2.9

Every one of the ~80 substantive body lines the incoming commit authored — the whole
"Follow-up: the deploy secret guard asked the wrong question" section, its Cause, the
four-row decision table, the `--dry-run` paragraph, acceptance criteria 13–16, and the
Test changes section naming `tests/test_UAT_FC_REQ-149_deploy_secret_hook.test.ts` and its
seven UATs — is present verbatim in the resolved file. Nothing was discarded.

Consequently the staged tree is byte-identical to HEAD for this path (the ours stage was
verified equal to the HEAD blob, and `git status --porcelain` reports nothing). Per STEP 4
this is the redundant-commit case (BUG-1109/BUG-1122), **not** a @fail: STEP 3 distinguishes
them, and here the incoming's key changes are demonstrably *present* in HEAD via a later
route, not absent. `--skip` was **not** called; the tree is staged and left for
cherry_pick_finalize_resolution. `CHERRY_PICK_HEAD` was verified still present after staging.

No hunks were dropped under the BUG-1301 precedence exception. No UAT test files were
involved in this conflict (the incoming prose *describes* a UAT file, but does not touch it).

## Flagged for post-merge review

The auto-enrichment reported intent unknown on one or both sides and asked that this file be
flagged. Flagging here: `.xgd/tickets/hot/request-554ac441.md` was resolved by commit/ticket
timestamp ordering plus superset containment rather than by an `xgd working-timeline` intent
comparison. This is the second consecutive cherry-pick in this bundle to conflict on this same
ticket and resolve to ours (scope 214 was `c9f82a85`, this is 216/`e9540426`) — both were
ticket-bookkeeping commits whose effect HEAD already carries.
