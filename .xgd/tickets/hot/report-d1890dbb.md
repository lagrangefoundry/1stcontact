---
uid: report-d1890dbb
id: REPORT-6126
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T23:17:22.500984+00:00'
updated_at: '2026-10-04T23:17:22.500984+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Conflict: .xgd/tickets/hot/request-439cd0c8.md

Pick: a473afd7fa (2026-08-31 15:57, "xgd(ticket): update request request-439cd0c8") — shadow→description rename in the body.

Resolution: **--ours** (zero net change).

Evidence:
- Base da952dfa89 → theirs cb19407922: the shadow→description/describe rename hunks only.
- Base → ours 67db22b9a1 (HEAD d58e8e3fd3, 2026-09-09 seed_local_overlay): every one of those rename hunks verbatim, plus later state: status `bundled`, commits/version 0.2.24/bundled_in bundle-87be4669, an extra acceptance criterion, "What was built", "Resolved after implementation (2026-08-31)", and a replaced Open questions section.
- `git diff --numstat theirs ours` = 176 / 8. The 8 theirs-only lines are the stale `updated_at`/`last_field_updated`/`status: draft` frontmatter and the two old open questions that ours explicitly resolves. Taking theirs would regress status bundled→draft and drop the post-implementation record.
- Enrichment's "most recent timestamp" rule agrees: ours is 2026-09-09 and theirs is 2026-08-31, and ours is a successor overlay of the state this pick produced.

Apply target: 397daf02997f5670ac4ce7c26f12ed9050b0f66d. Candidate publish tip sha was not in the recovered (empty-prompt) arguments, so this is filed under the anchor report-10bbd54c with the apply target as the reference sha.
