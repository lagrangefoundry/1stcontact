---
uid: report-f08d7d2b
id: REPORT-6749
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-26T00:23:00.504386+00:00'
updated_at: '2026-10-26T00:23:00.504386+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/request-420e1a6e.md` (REQ-170, admin console). Class: DU, deleted by us, on an intent/bookkeeping ticket (2a + 2e). Rule applied: restored and kept the incoming version (`git checkout --theirs`, then `git add --sparse`).
  - HEAD never deleted this ticket. It was never on this branch or on `main`. The commits that created it (`eb833e5a12`, `b4a33fc9b1`) are outside this bundle's cherry-pick window.
  - The ticket is present on the source branch `reconcile-src-BUNDLE-32`, so the bundle should carry it.
  - The incoming file holds the complete ticket, with front matter and body. Keeping it preserves the new "Revision: accounts and businesses are two levels (DOC-40 §2)" section. It also stops later updates to this ticket in the window from conflicting the same way.

## Incoming changes preserved

- No code files were involved. The staged ticket matches the incoming commit `da9ca90610` byte for byte (stage 3): `updated_at` and `last_field_updated` are bumped and the revision section is appended.

## Post-merge review flag

- The ticket arrives on this branch without its creation commits, so in this branch's history it first appears as an update. Worth checking whether the creation history matters.
