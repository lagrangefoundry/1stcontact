---
uid: report-92bf42db
id: REPORT-3258
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T23:11:14.872036+00:00'
updated_at: '2026-09-01T23:11:14.872036+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/doc-7937c11c.md` — class **AA** (both added), sparse-excluded path (staged with `git add --sparse`). Bookkeeping/doc ticket → STEP 2e per-fact rule. Resolution: **took incoming (theirs) whole**, because the two sides differ by exactly one fact and the incoming side wins it on timeline.

### Why theirs, in detail

The two stages are byte-identical except for two adjacent frontmatter lines:

```
-updated_at: '2026-08-16T01:21:28.933181+00:00'
+updated_at: '2026-08-31T19:43:30.291550+00:00'
 fields:
   doc_kind: project_context
-  system_kb: true
```

The entire document body (Vision, Expressive Thesis, Positioning,
Architectural Principles, MVP Scope, Monitoring, Business Strategy,
Future Expansion) is identical on both sides — no prose was in
contention, so nothing from the HEAD side was dropped by taking
theirs.

Both sides carry `last_field_updated: system_kb`, i.e. each side's
operation was a toggle of the same single field. That makes this a
same-fact conflict, not two disjoint edits, so 2e's "apply BOTH" and
"keep the superset" branches do not apply — the timeline rule does:

- OURS  `3ed3abed35` committed 2026-08-15T18:21:29-07:00 — set `system_kb: true`
- THEIRS `381bf6f61c` committed 2026-08-31T12:43:30-07:00 — removed `system_kb`

Incoming is later by ~16 days, matching both the auto-enrichment
directive ("Intent unknown on one or both sides. Take the more
recent commit by timestamp") and the standing rule that the
incoming `free_coded` side is authoritative. The `updated_at`
bump is a dependent stamp of that same toggle and travels with it.

Per the enrichment note, this file is **flagged for post-merge
review**: the intent behind dropping `system_kb: true` from DOC-4
(Webcaretaker) could not be confirmed from either side's commit
metadata — the subjects on both sides are the generic
`xgd(ticket): update doc doc-7937c11c`. If DOC-4 is meant to remain
in the system knowledge base, the field needs restoring by a
deliberate edit rather than by reverting this resolution.

## Incoming changes preserved

Confirmed. After `git checkout --theirs`, the worktree file hashed
to `b1d977304eb0a977e80e37164b3ee22f10962beb`, exactly equal to the
incoming stage-3 blob, and the staged stage-0 entry is that same
hash. Every change authored by the incoming commit is present in
the resolution verbatim; none were dropped.

No hunks were dropped under the BUG-1301 precedence exception —
it did not arise. No code, test, or UAT files were involved in
this conflict; the sole conflicted path is a doc ticket.

Cherry-pick sequencer state (`CHERRY_PICK_HEAD` = `381bf6f61c`)
left intact for `cherry_pick_finalize_resolution`. No
`--continue`/`--skip`/`--abort`/`reset` was run.
