---
uid: report-d0c1367b
id: REPORT-2766
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:44:28.317427+00:00'
updated_at: '2026-08-31T06:44:28.317427+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-66ae4d00.md` — class **AA** (both added), intent/bookkeeping ticket (`request-*`).
  Rules applied: **2b** (both added) + **2e** (intent/bookkeeping ticket), strict-superset branch.
  The two sides were identical except for a single frontmatter field present only on
  the incoming (`free_coded`) side:

  ```
   fields:
     auto_merge_back: true
     needs_review: false
     priority: medium
  +  chat_comment: comment-569d776b
  ```

  Incoming is a strict superset — it adds a field the HEAD side never touched, and
  changes nothing else (no differing field, no differing prose section). No per-fact
  timeline adjudication was needed because there is no competing fact: `xgd
  working-timeline` applies only when both sides changed the SAME fact differently.
  Resolved with `git checkout --theirs` + `git add --sparse` (path is under
  `.xgd/tickets/`, outside the sparse-checkout cone on this reconcile branch — DOC-986
  §2/§4.1; the conflict existed in the index only, with no working-tree markers).

  Note on the auto-enriched metadata: it reported "Intent unknown on one or both sides
  … take the more recent commit by timestamp and flag for post-merge review." That rule
  is moot here — the sides do not disagree on any fact, so timestamp adjudication has
  nothing to decide, and the superset resolution preserves 100% of both sides' content.
  No content was invented and no field was modified beyond what the incoming side's own
  commit declares. Flagging for post-merge review is therefore not warranted, but the
  single added field is named above should a reviewer wish to confirm it.

## Incoming changes preserved

- Incoming commit `5b343e09684a915b47df9d340e932aadc3b92730`
  ("xgd(ticket): update request request-66ae4d00", Martin Westhead, 2026-08-23)
  touches exactly one file, adding it whole: `.xgd/tickets/hot/request-66ae4d00.md`,
  205 insertions, 0 deletions.
- Verified: the staged blob for that path is **byte-identical** to the incoming
  side's blob (`aba38e78b13ea9a186372b747549cc50656634d3`) — `diff` between the two
  reports no differences. Every line of the incoming commit's content is present in
  the resolution; nothing from the developer's commit was discarded.
- No hunks were dropped. The BUG-1301 precedence exception was not invoked and does
  not apply here.
- No code/implementation files, no UAT test files, and no spec (matrix-defining)
  tickets were involved in this conflict — the sole conflicted path is a bookkeeping
  `request` ticket.

## Git state

Conflict-class entries (UU/AA/DU/UD/AU/UA) are gone from `git status --porcelain`;
the path now shows as `M ` (staged, modified). The in-progress cherry-pick was left
untouched — `CHERRY_PICK_HEAD` is still present for
`cherry_pick_finalize_resolution`. No `--continue`/`--skip`/`--quit`/`--abort`,
`reset`, or branch checkout was run. Pre-existing untracked `comment-*.md` /
`report-*.md` files under `.xgd/tickets/hot/` were present before this step and were
left as-is.
