---
uid: report-e05c796f
id: REPORT-5481
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T05:46:54.193726+00:00'
updated_at: '2026-09-29T05:46:54.193726+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` — **AA** (both added), intent/bookkeeping
  ticket (STEP 2e: `.xgd/tickets/.../request-*.md`). Resolved to the HEAD side in
  full, as a **strict superset**. Outside the sparse-checkout cone, so staged with
  `git add --sparse` per DOC-986 §2/§4.1.

  Incoming (`d1d63bebd3` "xgd(ticket): create request request-8b33a146") is the
  ticket's *creation stub*: `title: Untitled`, `status: draft`,
  `completed_at: null`, `last_field_updated: created_at`, body `(new ticket)`.
  HEAD is the same ticket (REQ-172) advanced to its final state:
  `status: free_and_reconciled`, completed 2026-09-14, titled "Library detail:
  render documents inline, with an expand-to-modal reader", two recorded
  `working_sha` entries, `version: 0.2.37`, `bundled_in: bundle-8e1807f6`, plus
  the full specification body.

  No per-fact conflict arises: there is no field where the two sides assert
  different durable facts. Every field the stub sets is either carried forward
  verbatim by HEAD or is a placeholder HEAD later filled in. The 2e superset rule
  therefore governs; the auto-enrichment's fallback (later `updated_at` wins —
  HEAD 2026-09-19 vs incoming 2026-09-01) points the same way.

## Incoming changes preserved

No code files were in conflict, so no BUG-1301 precedence exception was invoked
and no hunk was dropped.

For the one resolved file, every durable fact established by the incoming
creation commit is present verbatim in the resolved version:

- `uid: request-8b33a146` ✓
- `id: REQ-172` ✓
- `type: request` ✓
- `created_by: xgd` ✓
- `created_at: '2026-09-01T21:04:04.214569+00:00'` ✓
- `fields.auto_merge_back: true` ✓
- `fields.needs_review: false` ✓
- `fields.priority: medium` ✓

The only incoming values absent are the four stub placeholders and the
`(new ticket)` body, each superseded by HEAD's later recorded state for the same
field. That is the ticket's own forward progress, not discarded developer intent.

Staging verified: `git status --porcelain` reports `M  .xgd/tickets/hot/request-8b33a146.md`
with no remaining conflict-class entries. `CHERRY_PICK_HEAD` left intact at
`d1d63bebd3771a887c161c7642f0415b6c820f8c` for the next workflow step.

Note for the finalize step: because the resolution keeps HEAD unchanged for the
only file in the commit, the staged diff against HEAD is empty. Per STEP 4 this
was left alone rather than skipped here — Python's finalize step should detect
the clean staged diff and skip the commit.
