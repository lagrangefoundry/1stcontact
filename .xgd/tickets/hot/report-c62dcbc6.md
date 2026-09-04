---
uid: report-c62dcbc6
id: REPORT-3355
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T20:36:13.836312+00:00'
updated_at: '2026-09-02T20:36:13.836312+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — **UU**, intent/bookkeeping ticket (rule **2e**).
  Resolved to the HEAD-side blob via `git checkout --ours` (not a hand-edit, so no
  stale frontmatter is written back), then `git add --sparse`.

  Incoming commit: `82518d609902d85715f6f34a28eae4e1aa7ae781`
  (`xgd(ticket): update bug bug-a98fb3b0`, 2026-08-24 15:16). It promotes BUG-38
  from the stub (`title: Untitled`, `status: draft`, body `(new ticket)`) to a
  fully written-up bug: real title, `severity: high`, `status: free_coding`, and
  the complete Symptom / Root cause / Fix / Test plan body.

  Git auto-merged everything substantive — the title, `severity: high`, and the
  entire 70-line body all landed **outside** the conflict markers, because HEAD
  already carries identical text. Three marker regions remained, resolved
  per-fact:

  1. **Lines 9–19 — lifecycle scalars** (`updated_at`, `completed_at`, `status`):
     genuine per-fact conflict. HEAD = `status: free_and_reconciled`,
     `updated_at`/`completed_at` `2026-08-31T19:19:34`. Incoming = `status:
     free_coding`, `updated_at 2026-08-24T22:16:14`, `completed_at: null`.
     Same ticket, and `free_coding → free_and_reconciled` is forward lifecycle
     progress, so HEAD is the later-positioned state by seven days — consistent
     with both 2e's per-fact timeline rule and the enrichment's "take the more
     recent commit by timestamp". Taking incoming here would roll workflow-owned
     status backwards and re-null a real `completed_at`. HEAD kept.
     (`last_field_updated: status` is identical on both sides.)
  2. **Lines 26–35 — HEAD-only `fields:` entries** (`commits`, `version: 0.2.14`,
     `story_points: 2`, `bundled_in: bundle-78f4e2fe`) against an empty incoming
     side. Nothing to weigh; HEAD kept.
  3. **Lines 101–105 — trailing-newline artifact**: both sides carry the byte-identical
     line ``Regression scope: ... `tests/test_UAT_FC_REQ-122_chat_host.test.ts`.``;
     they differ only in HEAD lacking a final newline. Not a fact conflict.

  No `xgd working-timeline` call was needed: both sides' own `updated_at` stamps
  and the monotonic lifecycle ordering settle region 1 unambiguously. No content
  was invented, and no `intent_uid`/`story_uid`/`capability_uid` field was touched.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md`: **preserved.** Verified against
  `git show 82518d6099 -- <file>`; every substantive addition is in the resolved
  file — the title (line 5), `severity: high` (line 18), and the full body
  including the `SiteStore.hasDraft(slug)` fix description (line 71) and the
  `test_UAT_FC_BUG-38_chat_session_survives_isolate_churn` test plan (line 81).

  The only incoming values NOT in the result are the two superseded lifecycle
  scalars (`status: free_coding`, `updated_at 2026-08-24T22:16:14`) — superseded
  by HEAD's strictly later state per 2e's per-fact timeline rule, which is the
  prescribed resolution, not a discard of developer content.

No hunks were dropped under the BUG-1301 precedence exception; no code or UAT
files were involved in this conflict.

## Note: resolution nets to no diff vs HEAD

`git diff --cached HEAD` is empty. This commit's content already reached the
branch through a later route (HEAD holds the same title, severity, and body, at a
more advanced status), so replaying it adds nothing — the BUG-1109/BUG-1122
redundant-commit case, **not** a discard. STEP 3 distinguishes them by whether the
incoming commit's key changes are *present* in HEAD, and here they are, verbatim.

Per STEP 4, `--skip` was NOT called; the resolution is staged and the cherry-pick
sequencer state is untouched (`CHERRY_PICK_HEAD` still resolves to
`82518d609902d85715f6f34a28eae4e1aa7ae781`) for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit itself.
