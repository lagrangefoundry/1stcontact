---
uid: report-5cd8c8df
id: REPORT-5230
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T00:31:58.156692+00:00'
updated_at: '2026-09-28T00:31:58.156692+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — UU, intent/bookkeeping ticket
  (`bug-` kind, rule 2e). Resolved to the HEAD side in full, because HEAD
  is a strict superset of the incoming intent.

  Three conflict hunks, all the same shape:

  1. Lifecycle scalars — HEAD `updated_at 2026-08-31T19:19:38`,
     `completed_at` set, `status: free_and_reconciled`; incoming
     `updated_at 2026-08-23T22:13:33`, `completed_at: null`,
     `status: draft`.
  2. Fields block — HEAD carries `story_points`, `commits`
     (`working_sha ea48502d0d90…`), `version: 0.2.10`,
     `bundled_in: bundle-78f4e2fe`; incoming carries none of these.
  3. `## Status` and everything after it — HEAD has the landed
     implementation record (production-state findings, interim patch,
     approved scope addition, implementation notes, "Still open, and NOT
     this ticket"); incoming has the single placeholder line
     "Scope drafted, awaiting operator confirmation before coding."

  `git show 1524d1503f -- <path>` shows the incoming commit is this
  ticket's **initial body fill**: `title: Untitled` → real title, body
  `(new ticket)` → Symptom / Diagnosis / Proposed fix / Test plan, plus
  `severity: high`. It is the earliest content-bearing commit on the
  ticket, not a later edit competing with HEAD.

## Incoming changes preserved

Verified by diffing the two index stages directly
(`git diff <stage3> <stage2>`). The complete set of lines present on the
incoming side and absent from the resolved (HEAD) version is:

```
updated_at: '2026-08-23T22:13:33.974071+00:00'
completed_at: null
last_field_updated: severity
status: draft
Scope drafted, awaiting operator confirmation before coding.
```

That is: four superseded lifecycle scalars, and the one-line status
placeholder that HEAD replaced with the actual landed-status record.
Every substantive addition the incoming commit made — the title, the
whole Symptom / Diagnosis / Proposed fix / Test plan body, and
`severity: high` — is present verbatim in the resolved file (`severity:
high` sits in the unconflicted region of the fields block).

No code files were involved, so no BUG-1301 precedence exception was
needed and no UAT function was touched.

Taking the incoming side here would have regressed `free_and_reconciled`
→ `draft` and dropped `version`, `bundled_in`, `commits`, `story_points`
and ~270 lines of implementation record — a strict loss with no
compensating gain.

Resolution leaves no net change from HEAD (`git status --porcelain` is
empty), which is expected: HEAD already contains the incoming commit's
effect. `CHERRY_PICK_HEAD` left intact at `1524d1503f`.
