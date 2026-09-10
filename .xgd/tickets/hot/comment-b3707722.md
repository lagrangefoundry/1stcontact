---
uid: comment-b3707722
id: COMMENT-2474
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T05:55:13.701795+00:00'
updated_at: '2026-09-10T05:55:13.701795+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f8bf6a19
  kind: note
---

Report filed: **REPORT-3675** (`report-f8bf6a19`) — **FAIL**, 4 violations, 0 warnings, 0 needs_review. Schema verified (`result=fail`, `report_kind`, `subject_uid`, `level=story`, integer counts).

## What drifted

All four violations trace to one intent the capability never absorbed: **REQ-149** (`request-554ac441`, free_and_reconciled, landed 2026-08-20 as `30abfebebd`) — a member of `bundle-b3b7c399`, which *is* STORY-121's recorded `intent_uid`. It changed the port itself:

- **five verbs added** — `revisions`, `writeRevision`, `readRevision`, `draftBase`, `setDraftBase` (`tools/generate/src/store/site-store.ts:206–234`), implemented by all three adapters;
- **one verb removed** — `pendingChanges` left the port and became a function above it (`tools/generate/src/publish/publish.ts:101`);
- **the cloud store became a revision store** — its own header says so (`d1r2-store.ts:50`), with `site_revisions` and `sites.base_revision` from `0002_revisions.sql`.

Against that:

1. **STORY-118** still enumerates the pending-against-base question as a declared storage operation and names none of the five revision verbs.
2. **STORY-118** out-of-scope claims publish, checkout and history "stay on the filesystem directly" — the deployed router publishes through the store at `apps/control-app/src/router.ts:399`.
3. **STORY-121** out-of-scope says publishing and revision history "remain filesystem-backed here" and that the store "reports every file as pending against no base". Both were already false when the story was authored on 2026-08-31.
4. **STORY-121** out-of-scope says "the builder is still a proxy". REQ-145 deleted the proxy; CAP-85's STORY-99 records the relocation as landed; the deployed builder opens this store on every route (`apps/control-app/src/store.ts:88`) — and the claim contradicts the story's own AC-1447/AC-1448, which only exist because a production caller does.

Everything else covers cleanly: REQ-141, REQ-142, REQ-143, BUG-36, BUG-37 and REQ-162 each have their asked behaviour expressed, and REQ-149's publish-side behaviour is correctly homed in CAP-82's STORY-94 rather than here. No `needs_review` — each ambiguity resolved against the implementation.

Two items recorded for the editor without counting as violations: the **capability body itself** still says "Two implementations are live" while its own AC-1385 says three (same intent delta as finding 3, one level up), and **AC-1385's enumeration** omits the revision verbs — deliberately left to the `ac`-level cycle since that enumeration is explicitly scoped to the editing surface.
