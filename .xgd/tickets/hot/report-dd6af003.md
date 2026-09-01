---
uid: report-dd6af003
id: REPORT-3263
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T23:20:47.589827+00:00'
updated_at: '2026-09-01T23:20:47.589827+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/doc-c93c09a6.md` — AA (both added), bookkeeping/doc
  ticket, sparse-excluded (index-only conflict, no working-tree markers).
  Rule 2b/2e: the two sides differ in exactly one hunk — `updated_at` and
  the presence of `fields.system_kb: true`. No disjoint content exists on
  the ours side, so there is nothing to compose; this is a single
  same-fact conflict resolved by the timeline rule.
  Ours = eed2a1cba9 (2026-08-15, no operation narrative).
  Incoming = 40a15571cf (2026-08-31, free_coded) with an explicit
  narrative: "field: retire system_kb boolean; membership moves to
  doc_kind (DOC-39 3.3)".
  Incoming is both later-positioned and the only side declaring an
  operation, so incoming wins: `git checkout --theirs` +
  `git add --sparse`.

## Incoming changes preserved

- `.xgd/tickets/hot/doc-c93c09a6.md`: working-tree blob after resolution
  hashes to `b3cfde8d67041867fba410af0cf7c369d3214701`, byte-identical to
  stage 3 (incoming). The staged diff vs HEAD is precisely the incoming
  commit's two changes — `system_kb: true` removed, `updated_at` advanced
  to 2026-08-31T19:43:37Z. The remaining 300+ lines of document body were
  identical on both sides and are unchanged.

No hunks were dropped; the BUG-1301 precedence exception was not needed.
No code, test, or spec-ticket files were involved in this conflict.
