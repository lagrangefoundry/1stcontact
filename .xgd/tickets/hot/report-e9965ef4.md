---
uid: report-e9965ef4
id: REPORT-3242
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T22:37:09.454459+00:00'
updated_at: '2026-09-01T22:37:09.454459+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/doc-111df670.md` — **AA (both added)**, bookkeeping/doc ticket
  (rule 2e + the enrichment's "take the more recent commit by timestamp").
  Both sides carry an `xgd(ticket): update doc doc-111df670` commit. Diff between
  index stages 2 and 3 was two lines only:
    - `updated_at`: ours `2026-08-16T01:20:59` vs theirs `2026-08-31T19:43:07`
    - `fields.system_kb: true` present on ours, removed on theirs
  Theirs (incoming `463c4dc6a0`, free_coded, 2026-08-31) is strictly later and its
  commit body declares the operation: "field: retire system_kb boolean; membership
  moves to doc_kind (DOC-39 3.3)". Ours' only edit to that region was the HEAD-side
  commit `c36754fe17` (2026-08-15) that had *set* `system_kb: true` — i.e. the same
  fact, edited later by incoming, not a disjoint edit. Per-fact timeline rule
  therefore gives the fact to incoming.
  Resolution: `git checkout --theirs` then `git add --sparse`.
  Every other field (`uid`, `id`, `title`, `created_at`, `doc_kind`,
  `last_field_updated`, `status`, and the full 190-line document body) is
  byte-identical on both sides, so nothing from ours was discarded.

No AA appeared here as a seeded-overlay artifact: unlike the create-commit case,
the HEAD side genuinely lacked the incoming field retirement, so this resolution
produces a real (non-empty) staged diff.

## Incoming changes preserved

- `.xgd/tickets/hot/doc-111df670.md`: `git show 463c4dc6a041402633a6b631be54fc1ebf6c4552`
  differs from HEAD in exactly the `updated_at` bump and the `system_kb: true`
  removal. `git diff --cached HEAD` after resolution shows exactly those two
  changes and nothing else. The incoming commit's full intent is present in the
  staged result.

No hunks were dropped; the BUG-1301 precedence exception was not invoked.
No code/implementation files, UAT tests, or spec (story/AC/capability) tickets
were involved in this conflict.
