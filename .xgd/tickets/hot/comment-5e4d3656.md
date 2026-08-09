---
uid: comment-5e4d3656
id: COMMENT-864
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-09T01:40:22.789737+00:00'
updated_at: '2026-08-09T01:40:22.789737+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-8d184529
  kind: note
---

Cluster 8 is resolved. **All three stories confirmed in place — no reassignments, no merges, no ticket mutations.**

## Why

The cluster is a clean three-layer chain over one deliberately shared vocabulary (a site's image handles), not contested ownership:

| Layer | Story | Capability | Proved at |
|---|---|---|---|
| Supply — what the site *has*; narrows nothing | STORY-102 | CAP-89 Site Materials | `askForAssets()`, CLI + builder origin |
| Narrow & write — what a region *may hold*; closed list, server-side membership check, atomic write | STORY-100 | CAP-86 Structured Copy Editing | `readFields()` + `copy set` CLI |
| Render — what the operator *touches*; same form, same transport | STORY-101 | CAP-87 In-Page Copy Editing | JSDOM over editable rendering + `resolveEditTarget()` |

Each story body already cedes the neighbouring layers by name. The survey detected the shared handle vocabulary — which is the intended design (one listing, no parallel picker) — rather than duplicated behavior.

I checked the one genuinely near-duplicate pair: AC-1025 ("current image always among its options") and AC-1028's third bullet read alike, but they're verified by different tests at different entry points — `reconciliation-copy-edit-image-selection.test.ts:307` proves the alt-text-only save can't silently swap the image with no browser involved; `req118-image-selection.test.ts:177,406` proves the modal obtains its choices over the copy transport, which is unprovable from the CLI. Overlap in assertions, not in ownership.

Reassigning either way would break something: moving AC-1028 to CAP-86 leaves the gesture story with no evidence that image regions reach the operator; moving STORY-100's image half to CAP-89 splits one write path across two capabilities and orphans the AI's non-browser edits.

**One thing flagged but not acted on** (outside this task's mandate — it's capability prose, not a story assignment): CAP-86's body still describes exposed fields as "plain words and nothing else," which predates the field vocabulary growing to include the closed list. Worth a one-line fix when CAP-86's body is next revised.

Report created: **REPORT-1717** (`report-8d184529`), `result=pass`, `cluster_id="8"` verified set.
