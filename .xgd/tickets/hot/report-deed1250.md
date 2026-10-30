---
uid: report-deed1250
id: REPORT-4745
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:46:26.320818+00:00'
updated_at: '2026-09-21T14:46:26.320818+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — **UU**, intent/bookkeeping ticket (STEP 2e, plus the auto-enriched
  per-file rule: "intent unknown on one or both sides; take the more recent commit by timestamp and flag for
  post-merge review"). Conflict was confined to the frontmatter `updated_at` / `status` pair; the document body
  was byte-identical on both sides.
  - OURS (HEAD, `c94654a355` `xgd(ticket): seed_local_overlay`): `updated_at: 2026-09-09T21:32:50`,
    `status: bundled`
  - THEIRS (incoming `58d4f8ec81` `xgd(ticket): update`): `updated_at: 2026-09-01T18:53:35`,
    `status: free_coded` (a transition from `ready_to_reconcile`)
  - **Resolved to OURS.** HEAD is the more recent side on both axes: later timestamp (8 days), and later
    lifecycle position (`free_coded` precedes `bundled`). The unconflicted region of the same frontmatter
    carries `bundled_in: bundle-87be4669`, which is only coherent with `status: bundled` — taking the incoming
    side would have left the ticket reading `free_coded` while still pointing at a bundle.
  - Flagged for post-merge review per the enrichment rule, though the inconsistency risk is low: the sides do
    not disagree about any fact other than where the ticket sits in its own lifecycle, and HEAD is downstream.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a bookkeeping ticket, so STEP 3's
`git show $CPHEAD -- <file>` verification does not apply to any source file, and the BUG-1301 precedence
exception was not invoked anywhere.

For the ticket itself, the incoming change is not "preserved" in the literal sense and should not be: incoming
`58d4f8ec81` set `status: free_coded` at 2026-09-01, a state HEAD has already advanced past to `bundled` at
2026-09-09 via `c94654a355`. Per STEP 2e's per-fact rule, the later-positioned intent wins for the one fact both
sides touched. Nothing disjoint was discarded — the two sides edited exactly the same two frontmatter keys and
nothing else.

## Note for the finalize step

The resolved tree is byte-identical to HEAD, so `git status --porcelain` reports clean and this cherry-pick has
no net staged diff. This is expected, not an error. Per STEP 4 the resolver did not invoke `--skip`; deciding
between `--skip` and `--continue --allow-empty` is left to the finalize step. `CHERRY_PICK_HEAD` was left in
place and no `--continue`/`--skip`/`--quit`/`--abort` was run.
