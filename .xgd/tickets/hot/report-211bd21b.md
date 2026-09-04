---
uid: report-211bd21b
id: REPORT-3326
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T19:15:33.664093+00:00'
updated_at: '2026-09-02T19:15:33.664093+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` (BUG-36) — class **UU**, intent/bookkeeping
  ticket → rule **2e**. Resolved to the **HEAD (ours)** side, staged with
  `git add --sparse` (path is outside the sparse-checkout cone).

  Incoming commit for this attempt: `1a64efde` (`xgd(ticket): update bug
  bug-db356ff8`, Sun Aug 23 16:03:08 2026 -0700). Merge base is `2ffe0bc5` —
  the ticket state left by the preceding bundle commit `bcedebfb` (resolved in
  attempt 28). The incoming diff is purely additive to the body: it appends the
  section

  - `# Approved scope addition — fix the publish credential (option A)`,
    with its `## Why the API token cannot simply be swapped in`,
    `## The change` (bin/access-token, push.ts, cli/index.ts, bin/publish,
    ACCESS.md), and `## Note — two service tokens were created and revoked`
    subsections,

  and advances `updated_at` to `2026-08-23T23:03:08.033794+00:00`.
  `status` stays `draft`, `completed_at` stays null, `last_field_updated`
  stays `body`.

  HEAD-side blob `e3e27e2c` (from commit `56ced613`, Mon Aug 31 12:19:38 2026
  -0700) already contains that entire section verbatim, and carries the ticket
  further still: `status: free_and_reconciled`, `completed_at` set,
  `story_points`, `commits[working_sha=ea48502d]`, `version: 0.2.10`,
  `bundled_in: bundle-78f4e2fe`, plus the later `## Implementation — the tenant
  fix` record. HEAD is therefore a strict superset of the incoming side and
  later on the timeline (Aug 31 vs Aug 23), so 2e's "keep the superset" case
  applies; the only per-fact disagreement is the `updated_at` bookkeeping
  scalar, which goes to the later side.

  This is the third consecutive bundle commit against this ticket (attempts
  27, 28, 29) whose body additions HEAD already carries — the working-timeline
  edits were folded into HEAD ahead of the replay.

  No content was invented; no field was touched beyond what the two sides
  already carried.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket.

Verified mechanically: diffing every line added by `1a64efde` against the
resolved (HEAD) blob leaves exactly one line absent —
`updated_at: '2026-08-23T23:03:08.033794+00:00'`, a superseded bookkeeping
scalar. Every substantive body line the developer authored in this commit (the
full "Approved scope addition" section) is present verbatim in the resolved
version.

No hunks were dropped under the BUG-1301 precedence exception.

Note for the finalize step: because HEAD already contained this commit's full
effect, the staged tree is byte-identical to HEAD and `git diff --cached` is
empty. This is the redundant-commit case (BUG-1109 / BUG-1122), not a discard —
STEP 3's check confirms the incoming commit's changes are present in HEAD
rather than absent. `--skip` was not called; the cherry-pick sequencer state is
left intact.
