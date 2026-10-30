---
uid: report-a12cf308
id: REPORT-5232
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T00:38:38.083887+00:00'
updated_at: '2026-09-28T00:38:38.083887+00:00'
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

  Incoming commit `1a64efded1` (2026-08-23 16:03:08 -0700), per
  `git show 1a64efded1 -- <path>`, does two things:

  1. Advances `updated_at` → `2026-08-23T23:03:08` (`completed_at` still
     `null`, `last_field_updated` still `body`, `status` still `draft`).
  2. Appends the `# Approved scope addition — fix the publish credential
     (option A)` block — "Why the API token cannot simply be swapped in",
     "The change" (`bin/access-token`, `push.ts` client-id/secret headers,
     `redirect: 'manual'`, `index.ts` flags, `bin/publish`, `ACCESS.md`),
     and "Note — two service tokens were created and revoked".

  HEAD carries the ticket's fully reconciled state: `updated_at
  2026-08-31T19:19:38`, `completed_at` set, `status: free_and_reconciled`,
  plus `story_points`, `commits` (`working_sha ea48502d0d90…`),
  `version: 0.2.10`, `bundled_in: bundle-78f4e2fe`, and the whole landed
  implementation record — which already includes the entire block the
  incoming commit appends.

  Two conflict hunks: the lifecycle scalar block, and the body from the
  `## Status` line onward.

## Incoming changes preserved

Verified two ways.

1. Index-stage diff (`git diff <stage3> <stage2>`). The complete set of
   lines present on the incoming side and absent from the resolved (HEAD)
   version is:

   ```
   updated_at: '2026-08-23T23:03:08.033794+00:00'
   completed_at: null
   last_field_updated: body
   status: draft
   Scope drafted, awaiting operator confirmation before coding.
   ```

   That is: four superseded lifecycle scalars, and the one-line `## Status`
   placeholder that HEAD replaced with the actual landed-status record.
   Nothing from the appended scope-addition block is missing.

2. Direct grep of the HEAD blob `e3e27e2c` for the incoming commit's
   distinctive strings — all present:

   ```
   163: # Approved scope addition — fix the publish credential (option A)
   168: ## Why the API token cannot simply be swapped in
   188: **`bin/access-token`** (new) — one-time provisioning, run by the operator.
   199: Also `redirect: 'manual'`, which is a real bug fix rather than tidiness. With
   218: ## Note — two service tokens were created and revoked
   ```

   HEAD in fact goes further (line 261+ records how the credential pair is
   handled after `bin/access-token` prints it), i.e. it is the later,
   fuller state of the same narrative.

Taking the incoming side instead would have regressed
`free_and_reconciled` → `draft` and dropped `version`, `bundled_in`,
`commits`, `story_points` and the landed implementation record — a strict
loss with no compensating gain.

No code files were involved, so no BUG-1301 precedence exception was
needed and no UAT function was touched.

Resolution leaves no net change from HEAD (`git status --porcelain` is
empty), which is expected: HEAD already contains this commit's effect.
`CHERRY_PICK_HEAD` left intact at `1a64efded1`.
