---
uid: report-0b59b7f3
id: REPORT-4215
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T03:42:57.269848+00:00'
updated_at: '2026-09-14T03:42:57.269848+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — AA (both added), sparse-excluded so the
  conflict existed only in the index (DOC-986 §2/§4.1; inspected via
  `git show :2:` / `:3:`). Rule 2b/2e: **one side is a strict superset — keep the
  superset.** Resolved to OURS via
  `git checkout --ours --ignore-skip-worktree-bits`, staged with `git add --sparse`.

  - **Ours (HEAD)**: `xgd(ticket): seed_local_overlay bug bug-360c5a44` — the fully
    populated BUG-43 ticket ("Builder preview: the frame is never reloaded after an
    assistant turn"), `status: bundled`, `updated_at: 2026-09-11T18:53:54Z`, with
    `fields.chat_comment`, `severity`, `commits[working_sha=84cc117a]`, `version`,
    `bundled_in: bundle-8e1807f6`, plus the full Symptom / Root cause / Fix /
    Test plan body.
  - **Theirs (incoming, `0d64e0f0`)**: the original bare creation — `title: Untitled`,
    `status: draft`, `last_field_updated: created_at`, body `(new ticket)`, and only
    the three seed fields `auto_merge_back`, `needs_review`, `priority`.

  The enrichment block flagged intent as unknown on one side and suggested the
  timestamp rule; that rule and the superset rule agree here — ours is both the
  later state (2026-09-11) and a strict superset of the incoming 18-line creation.

## Incoming changes preserved

Nothing from the incoming commit is discarded. `0d64e0f0` is an 18-line
pure-creation commit, and every fact it establishes is present in the resolved
(HEAD) version, byte-identical where it is not a later-advanced field:

- `uid: bug-360c5a44`, `id: BUG-43`, `type: bug` — identical.
- `created_by: xgd`, `created_at: '2026-09-01T21:52:34.046521+00:00'` — identical.
- `completed_at: null` — identical.
- `fields.auto_merge_back: true`, `fields.needs_review: false`,
  `fields.priority: medium` — identical.
- `title`, `status`, `updated_at`, `last_field_updated`, and the body are the
  incoming placeholders (`Untitled` / `draft` / `(new ticket)`) superseded by
  real content in HEAD — that is the normal lifecycle of this ticket, not a
  competing edit.

This is the seeded-overlay case: the local overlay already carries the incoming
creation plus everything applied to it since, so the cherry-pick of the `create`
commit is redundant rather than discarded. The staged diff against HEAD is
therefore empty (`git diff --cached HEAD` — no output), which is expected;
per STEP 4 the finalize step detects this and skips the commit. No `--skip`,
`--continue`, or other sequencer transition was issued; CHERRY_PICK_HEAD
remains in place.

No code/implementation files, spec tickets, or UAT tests were involved, so no
BUG-1301 precedence exception was needed and no hunk was dropped.
