---
uid: report-bf3eb67d
id: REPORT-4219
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T03:57:14.806404+00:00'
updated_at: '2026-09-14T03:57:14.806404+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` — UU, intent/bookkeeping ticket (rule 2e:
  "one side is a strict superset of the other — keep the superset").
  Ours = `xgd(ticket): seed_local_overlay request request-51514090` (updated_at
  2026-09-11T18:53:54Z); theirs = incoming `xgd(ticket): update request
  request-51514090` = d3c5e85be971ade247792a50bbdb08070e778e24 (updated_at
  2026-09-01T22:05:43Z).

  `git diff :2: :3:` shows ours is a strict superset of theirs: ours already
  carries the entire body section the incoming commit appended ("One honest
  caveat about 'the last native dependency'"), and additionally carries later
  bundle bookkeeping the incoming side never had (`status: bundled`,
  `last_field_updated: status`, `fields.commits` with three working SHAs,
  `fields.version: 0.2.39`, `fields.bundled_in: bundle-8e1807f6`). The only
  content theirs has that ours does not is a trailing newline at EOF and an
  older `updated_at`/`status` — both superseded by the later ours-side update.
  Resolved with `git checkout --ours` + `git add --sparse`.

## Incoming changes preserved

- `.xgd/tickets/hot/request-51514090.md`: preserved. The incoming commit's two
  hunks were (1) the `updated_at` bump and (2) the appended "One honest caveat"
  section. Hunk (2) is present verbatim in the resolved file (line 238 onward,
  verified by grep and by the `:2:` vs `:3:` diff showing no textual delta in
  that region beyond EOF newline). Hunk (1) is a bookkeeping timestamp that a
  strictly later ours-side ticket update (2026-09-11) already advanced past.

  No hunk was dropped under the BUG-1301 precedence exception; this is not a
  discard. This is the seeded-overlay redundancy case (memory:
  reconcile-seed-overlay-makes-ticket-creates-redundant): the local overlay seed
  already carried the incoming field, so the resolution nets to an empty staged
  diff vs HEAD (`git diff HEAD:<path> :2:<path>` was empty). Per STEP 4 that is
  expected — the finalize step will detect the clean staged diff and skip the
  commit. No `--skip`/`--continue` was issued; CHERRY_PICK_HEAD is intact.

## Staging state

`git status --porcelain` is empty — no UU/AA/DU/UD lines remain.
