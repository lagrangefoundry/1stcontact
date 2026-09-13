---
uid: report-4e141f12
id: REPORT-4168
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T23:13:24.957662+00:00'
updated_at: '2026-09-13T23:13:24.957662+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — UU, intent/bookkeeping ticket
  (rule 2e). HEAD is a strict superset of the incoming side, so the
  superset was kept (`git checkout --ours` + `git add --sparse`).

  Auto-merge had already absorbed the incoming commit's substantive
  additions outside the conflict markers (`fields.commits` with all three
  working_shas, `fields.version: 0.2.31`, and the trailing-newline removal
  at EOF). The two marker regions held only:
  - `updated_at` / `status`: HEAD `2026-09-09T21:32:49` / `bundled`
    vs incoming `2026-09-01T18:35:52` / `free_coded`. Same fact, changed
    differently — later-positioned intent wins per fact, and HEAD's
    `bundled` is the downstream lifecycle state of the incoming
    `free_coded`, so HEAD's value was kept.
  - `fields.bundled_in: bundle-87be4669`: HEAD-only addition, incoming
    side empty. Kept.

  No field was invented; no field from either side was dropped except the
  superseded `status`/`updated_at` scalars described above.

## Incoming changes preserved

Verified with `git show e4ba0304 -- .xgd/tickets/hot/request-26dafd83.md`
against the resolved file. Every change the incoming commit made is present
in the resolution:
- `fields.commits` (3 entries: 52fd6302, 9ae73384, c2f6c582) — present
- `fields.version: 0.2.31` — present
- `last_field_updated: status` — present
- status advanced off `free_coding` — present (HEAD carries it further, to
  `bundled`)
- EOF newline removed — present

Because HEAD already carried these facts via the seeded local overlay, the
staged diff against HEAD is empty. This is the redundant-commit case
(BUG-1109/BUG-1122), not a discard: the incoming commit's key changes are
present in HEAD rather than absent. `--skip` was NOT called; the finalize
step will detect the clean staged diff. CHERRY_PICK_HEAD left intact.

No code/implementation files, UAT tests, or spec tickets were involved.
No BUG-1301 precedence drops were needed.
