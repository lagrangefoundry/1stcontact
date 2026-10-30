---
uid: report-9b460ad7
id: REPORT-5249
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T01:53:42.365117+00:00'
updated_at: '2026-09-28T01:53:42.365117+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-0cdfdc5b.md` — UU, intent/bookkeeping ticket (STEP 2e).
  Both sides diverge from the merge base in the frontmatter only; the body is
  byte-identical on both sides.
  - `bundled_in: bundle-b3b7c399` — added identically by BOTH sides. Not a
    conflict; preserved.
  - `status` / `updated_at` / `completed_at` — the single genuinely competing
    fact. Incoming (`9940e1ce`, 2026-08-23 19:10 -0700) sets
    `status: bundled`, `updated_at: 2026-08-24T02:10:41Z`, `completed_at: null`.
    HEAD (`99812762`, 2026-08-31 07:22 -0700) sets
    `status: free_and_reconciled`, `updated_at: 2026-08-31T14:22:38Z`,
    `completed_at: 2026-08-31T14:22:38Z`.
    Per 2e's later-positioned-intent rule, HEAD wins this fact: it is later by
    commit timestamp AND later by lifecycle position
    (`bundled` -> `free_and_reconciled`). Taking incoming here would have
    regressed the ticket's status backwards.
  - Net: HEAD's version is a strict superset of incoming's intent, so the
    resolved file equals HEAD. Staged; `git status --porcelain` is empty,
    i.e. the staged diff against HEAD is clean and the finalize step will
    skip the commit.

## Incoming changes preserved

- `.xgd/tickets/hot/request-0cdfdc5b.md` — incoming introduced exactly two
  changes relative to the merge base:
  1. `bundled_in: bundle-b3b7c399` — PRESENT in the resolved file (line 51).
  2. `status: bundled` (+ its `updated_at` bump) — deliberately superseded,
     not discarded. HEAD already carried this ticket through `bundled` and on
     to `free_and_reconciled` a week later; re-applying incoming's older
     status would be a regression, which is precisely the case 2e's
     later-positioned-intent rule governs.

No code files were involved in this conflict, and no BUG-1301 precedence
exception was needed.
