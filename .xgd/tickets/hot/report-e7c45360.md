---
uid: report-e7c45360
id: REPORT-3325
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T19:13:37.401718+00:00'
updated_at: '2026-09-02T19:13:37.401718+00:00'
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

  Incoming commit for this attempt: `bcedebfb` (`xgd(ticket): update bug
  bug-db356ff8`, Sun Aug 23 15:21:10 2026 -0700). Merge base is `a541a6d9` —
  the ticket state left by the immediately preceding commit in this bundle
  (`1524d150`, resolved in attempt 27). The incoming diff is purely additive to
  the body: it appends two sections,

  - `## Production state — confirmed empirically (2026-08-23)` (including the
    `### Interim production patch applied` subsection and its `INSERT OR IGNORE
    INTO tenants ...` SQL), and
  - `## Second finding — bin/publish --production cannot authenticate as
    written`,

  and advances `updated_at` to `2026-08-23T22:21:09.946754+00:00` with
  `last_field_updated: body`. `status` stays `draft`, `completed_at` stays null.

  HEAD-side blob `e3e27e2c` (from commit `56ced613`, Mon Aug 31 12:19:38 2026
  -0700) already contains **both** of those sections verbatim, and carries the
  ticket further still: `status: free_and_reconciled`, `completed_at` set,
  `story_points`, `commits[working_sha=ea48502d]`, `version: 0.2.10`,
  `bundled_in: bundle-78f4e2fe`, plus the later approved-scope-addition and
  landed-implementation sections. HEAD is therefore a strict superset of the
  incoming side and later on the timeline (Aug 31 vs Aug 23), so 2e's
  "keep the superset" case applies; the only per-fact disagreements are the
  bookkeeping scalars, which go to the later side.

  No content was invented; no field was touched beyond what the two sides
  already carried.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket.

Verified mechanically: diffing every line added by `bcedebfb` against the
resolved (HEAD) blob leaves exactly two lines absent, both of them superseded
bookkeeping scalars —
`updated_at: '2026-08-23T22:21:09.946754+00:00'` and
`last_field_updated: body`. Every substantive body line the developer authored
in this commit — the full "Production state" and "Second finding" sections — is
present verbatim in the resolved version.

No hunks were dropped under the BUG-1301 precedence exception.

Note for the finalize step: because HEAD already contained this commit's full
effect, the staged tree is byte-identical to HEAD and `git diff --cached` is
empty. This is the redundant-commit case (BUG-1109 / BUG-1122), not a discard —
STEP 3's check confirms the incoming commit's changes are present in HEAD
rather than absent. `--skip` was not called; the cherry-pick sequencer state is
left intact.
