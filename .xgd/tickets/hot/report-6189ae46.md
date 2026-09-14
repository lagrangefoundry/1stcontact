---
uid: report-6189ae46
id: REPORT-4196
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T01:13:27.605076+00:00'
updated_at: '2026-09-14T01:13:27.605076+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` — **AA** (both added), intent/bookkeeping
  ticket (§2e). Path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so
  the conflict existed only in the index; both sides were read via
  `git show :2:` / `:3:`.
  - **Ours (HEAD)**: BUG-41 at its current state — `status: bundled`,
    `updated_at: 2026-09-11T18:53:54Z`, real title ("Library: an uploaded .md is
    stored undescribed…"), full Symptom / Root cause / Fix / Test plan body, and
    fields `chat_comment`, `severity`, `commits`, `version`, `story_points`,
    `bundled_in`.
  - **Theirs (incoming, d8ab3ec)**: `xgd(ticket): create bug bug-93851fea` — the
    ticket's own original 18-line creation stub, `title: Untitled`,
    `status: draft`, body `(new ticket)`.
  - **Rule applied**: §2e "one side is a strict superset of the other — keep the
    superset". Ours is a strict superset: every fact the incoming `create`
    establishes is present in it unchanged. No timeline lookup was needed —
    the two sides are not competing over any fact.

## Incoming changes preserved

Incoming (`git show d8ab3ec -- .xgd/tickets/hot/bug-93851fea.md`) is a pure
addition of the creation stub. Each fact it introduces is present verbatim in the
resolved file:

- `uid: bug-93851fea`, `id: BUG-41`, `type: bug` — present
- `created_by: xgd`, `created_at: '2026-09-01T20:41:58.464808+00:00'` — present,
  byte-identical (and matching the incoming commit's own author date,
  2026-09-01 13:41:58 -0700, confirming this is that ticket's genesis commit)
- `completed_at: null` — present
- `fields.auto_merge_back: true`, `fields.needs_review: false`,
  `fields.priority: medium` — all present, unchanged

The three stub placeholders the incoming side carries — `title: Untitled`,
`status: draft`, body `(new ticket)` — are absent by design: they are the
create-time defaults that this ticket's own later ledger entries (already
integrated into HEAD via the seeded local overlay) superseded. Dropping a
placeholder that the same ticket's subsequent, already-integrated updates
replaced is ledger advancement, not a discard of developer intent.

No BUG-1301 precedence exception was invoked; no code or test files were
involved in this conflict.

## Staging result

`git status --porcelain` is empty and `git diff --cached HEAD` is empty: this
commit is **redundant**, not discarded. Per STEP 3's discriminator, the incoming
commit's key changes are present in HEAD (via the overlay's copy of the same
ticket), rather than simply absent. Per STEP 4, `--skip` was NOT called — the
finalize step will detect the clean staged diff. `CHERRY_PICK_HEAD` is still
present at d8ab3ec.
