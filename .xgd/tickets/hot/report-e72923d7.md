---
uid: report-e72923d7
id: REPORT-4880
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-23T22:54:40.797091+00:00'
updated_at: '2026-09-23T22:54:40.797091+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — UU, intent/bookkeeping ticket (STEP 2e).
  Out of the sparse-checkout cone, so the conflict lived only in the index (no
  working-tree markers); resolved via `git checkout --ours` + `git add --sparse`.

  Three facts differed between the sides:
  - `bundled_in`: ours `bundle-87be4669` vs incoming `bundle-203b1dc2`. Same field,
    two different values — a genuine intent conflict, so the later-positioned
    intent wins per 2e. `xgd working-timeline` places `bundle-87be4669` at
    2026-09-11T10:28:15Z; the incoming bundling stamps `updated_at`
    2026-09-02T17:48:27Z. Ours is the later bundling → ours.
  - `updated_at`: ours 2026-09-09T21:32:50Z vs incoming 2026-09-02T17:48:27Z →
    ours, consistent with the `bundled_in` decision above.
  - `status`: `bundled` on both sides — no conflict.

  Body: ours adds a trailing section ("Note: the account/business split came after
  this ticket", referencing DOC-40 §2/§2.1 and REQ-178). The incoming side does not
  touch the body at all, so this is a non-overlapping addition that is kept. Ours is
  therefore a strict superset of the incoming content in the body, and the later
  intent in the frontmatter; the resolved file is ours verbatim.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflict was a
bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>` verification applies
only to `.xgd/tickets/hot/request-3bc4b835.md`.

The incoming side of that ticket contributed exactly one fact not shared with ours:
`bundled_in: bundle-203b1dc2`. It is intentionally not carried into the resolution,
under 2e's genuine-intent-conflict rule, because ours records a strictly later
bundling of the same ticket (`bundle-87be4669`, 2026-09-11) than the incoming one
(2026-09-02). Taking the incoming value would regress the ticket's bundle
membership to an older bundle. Every other incoming fact (`status: bundled`,
`last_field_updated: status`, the unchanged body) is present in the resolved file.

No UAT test functions were involved, and no hunks were dropped under the BUG-1301
precedence exception.
