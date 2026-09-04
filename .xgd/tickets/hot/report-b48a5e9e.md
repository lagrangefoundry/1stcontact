---
uid: report-b48a5e9e
id: REPORT-3343
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T20:12:00.293903+00:00'
updated_at: '2026-09-02T20:12:00.293903+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, intent/bookkeeping ticket (STEP 2 §2e).
  Resolved per-fact toward HEAD (`git checkout --ours` + `git add --sparse`).

  Incoming commit: `b0af50e157` "xgd(ticket): update bug bug-6612c4b7"
  (2026-08-24T21:06:24Z) — the follow-on to `fe97d3bc34` in the same
  xgd-working timeline. It applies the BUG-37 title edit to the top-level
  `title:` field (the prior commit had only written the transient
  `fields.title` mirror) and bumps `updated_at`.

  A single conflict hunk, all four lines being the same facts at two different
  working-timeline positions:
  - `updated_at`: incoming 2026-08-24T21:06:24Z vs HEAD 2026-08-31T19:19:36Z
  - `completed_at`: incoming `null` vs HEAD 2026-08-31T19:19:36Z
  - `last_field_updated`: incoming `title` vs HEAD `status`
  - `status`: incoming `draft` vs HEAD `free_and_reconciled`

  HEAD is later on every one, so HEAD is kept for the whole hunk. HEAD's state
  is the terminal one for this ticket (worked, bundled as
  `bundle-78f4e2fe`, `version: 0.2.13`, reconciled); the incoming side is the
  ticket as it stood seconds after creation.

  The `fields.title` region conflicted in the previous attempt (`fe97d3bc34`,
  scope 45/0) but merged cleanly here: HEAD had already removed that scratch
  field via `a9021e4749` (2026-08-24 14:06:30, the incoming author's own next
  commit), and `b0af50e157` does not touch it.

## Incoming changes preserved

The incoming commit's sole substantive change is the ticket title:
`'control-app: Edit mode 503s with Cloudflare 1102 …'` →
`'control-app: Edit mode dies with Cloudflare 1102 …'`.

That change **is present in the resolved file** — lines 5-6 read
`title: 'control-app: Edit mode dies with Cloudflare 1102 — the preview render
cache never hits in the Worker'`, outside the conflict region and therefore
unconflicted, because the working-timeline commits following `b0af50e157` were
already merged into HEAD by an earlier sync. Verified against
`git show b0af50e157 -- .xgd/tickets/hot/bug-6612c4b7.md`: the commit's `+`
title line matches the resolved file verbatim.

No code/implementation files were conflicted, so no BUG-1301 precedence
exception was invoked and no UAT test function was touched.

Net effect: the staged tree is byte-identical to HEAD (`git diff --cached` is
empty). This is the BUG-1109/BUG-1122 redundant-commit case, not a discard —
STEP 3's distinguishing test passes, since the incoming commit's key change is
present in HEAD via a later commit on the same timeline rather than merely
absent. Per STEP 4 the resolution is staged and left for
`cherry_pick_finalize_resolution` to skip; `CHERRY_PICK_HEAD`
(`b0af50e15776b86450ee3293be69c365779dd26e`) is intact and no sequencer command
was run.
