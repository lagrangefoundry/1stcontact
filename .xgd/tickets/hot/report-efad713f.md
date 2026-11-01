---
uid: report-efad713f
id: REPORT-7747
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:49:44.428457+00:00'
updated_at: '2026-11-01T15:49:44.428457+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-93cc89ff.md` (REQ-185): intent/bookkeeping ticket (2e). Rule: one side is a strict superset, so keep the superset (ours/HEAD, blob e3f01d8c). The file is outside the sparse cone, so it was resolved index-only to stage 0 with the skip-worktree bit restored.
  - Incoming (54d52d9174, "update request request-93cc89ff") changed frontmatter only, from base: status free_coding -> free_coded, last_field_updated body -> status, updated_at 2026-09-05T00:57, and added the `commits` list (2103d2e6, 75b37bc1) and `version: 0.2.70`. The body is identical to base.
  - Ours already contains every one of those incoming facts (the same commits list and version 0.2.70), plus the later `status: bundled`, `bundled_in: bundle-39edf66d`, updated_at 2026-11-01, and extra body text (the platform_operator rename note, the PLATFORM_ADMINS implementation paragraph, and the ownsBusiness/ownsPlatformBusiness and exported-seed paragraphs).
  - The only differing scalars are status and updated_at. Ours is later on both (bundled follows free_coded; 2026-11-01 is after 2026-09-05), which also matches the enrichment's "take the more recent" rule.

## Incoming changes preserved

There are no code files in this conflict. Every fact the incoming commit introduced (commits list, version) is present in the resolved ticket. Its status and updated_at were superseded by later values on HEAD. The resolution nets to no diff vs HEAD because the commit is redundant: its effect was already integrated. That is not a discard.
