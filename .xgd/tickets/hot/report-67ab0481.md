---
uid: report-67ab0481
id: REPORT-4875
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-23T22:38:38.918187+00:00'
updated_at: '2026-09-23T22:38:38.918187+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` — UU, intent/bookkeeping ticket (rule 2e).
  Two conflicted regions, both expressing one fact pair: `updated_at` and
  `fields.bundled_in`. Resolved per-fact toward HEAD.

  - HEAD: `updated_at: 2026-09-09T21:32:49`, `bundled_in: bundle-87be4669`
    (BUNDLE-26 — created 2026-09-09, `status: free_and_reconciled`,
    `completed_at: 2026-09-11`, carries `main_sha 66e172dd4c`).
  - Incoming `ed7b3cc779` (authored 2026-09-02): `updated_at: 2026-09-02T17:48:26`,
    `bundled_in: bundle-203b1dc2` (BUNDLE-23 — created 2026-09-02,
    `status: ready_to_reconcile`, every `main_sha` still null).

  Both bundles carry the identical title `REQ-164 + REQ-159 + REQ-165 + REQ-163 +
  REQ-161 + 2 more`: REQ-159 was re-bundled from the stale BUNDLE-23 into
  BUNDLE-26, and BUNDLE-26 is the one that actually reconciled onto main. HEAD is
  therefore the later-positioned intent for both facts; taking the incoming side
  would regress the ticket's `bundled_in` to a superseded bundle that never
  landed.

## Incoming changes preserved

- `ed7b3cc779` made three frontmatter changes to this ticket. Two of them —
  `status: ready_to_reconcile` -> `bundled` and the addition of a `bundled_in`
  key — are already present on HEAD unconflicted (`status: bundled`,
  `bundled_in` present). The incoming intent "this request is now bundled" is
  fully preserved in the resolved file. Only the specific bundle uid and the
  timestamp differ, and on those two facts the HEAD-side value is the later,
  superseding one, resolved per rule 2e's per-fact timeline test.
- No code, UAT or spec-ticket files were involved in this conflict, so no hunk
  was dropped under the BUG-1301 precedence exception.

The staged resolution is byte-identical to HEAD for this path, so the
cherry-pick of `ed7b3cc779` will finalize with an empty diff.
