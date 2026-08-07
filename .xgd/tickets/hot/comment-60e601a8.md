---
uid: comment-60e601a8
id: COMMENT-797
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T19:51:13.248278+00:00'
updated_at: '2026-08-07T19:51:13.248278+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-c5a97ce2
  kind: note
---

**Result: FAIL** — REPORT-1617 (`report-c5a97ce2`), level=story, 1 violation, 2 warnings, 0 needs_review. Schema verified: top-level `result: fail`, `report_kind: capability_validation`, `subject_uid: capability-a994b8f3`, integer counts.

**The ledger.** CAP-85 has one story (STORY-99), aligned to BUNDLE-16 = REQ-115 (the primary intent), REQ-117 (its chrome/origin sections), REQ-44 (lands elsewhere). REQ-119, which would retire the Node-origin-plus-proxy arrangement, is still `draft` — so the story's "deliberate and temporary" framing is not stale.

**Violation (coverage) — the workspace origin's edit transport is expressed nowhere.** REQ-117 records `/api/copy` GET/POST on the builder origin as a thin transport returning the validator's own `code`/`path`/`hint` as an expected 400; it ships at `tools/generate/src/cli/builder.ts:225`. STORY-99 enumerates the origin's operations as "(listing the store, publishing)", pushes "the write path behind it" out of scope, and none of its 21 ACs covers it. STORY-100 (CAP-86) meanwhile states the workspace "exposes this same surface over its origin as a thin transport". Each story names the other as owner; the matrix holds it nowhere. Resolution: `story-body-edit` on STORY-99 (plus the capability body's one-line operations list), keeping semantics with CAP-86.

**Warnings.** (1) STORY-99 twice references CAP-84 as live; it is `superseded` by CAP-87, and STORY-98 now carries `capability_uid: capability-12fee326` — STORY-100 carries the same stale pointer. (2) AC-965 claims unconfigured-vs-unreachable origin are distinct explanatory failures, implemented at `apps/control-app/src/index.ts:28,45`, but the story body never mentions either.

Two things I checked before *not* raising them: the "freshness over caching" bullet has no supporting REQ body, but COMMENT-601 on REQ-117 settles it explicitly and the code carries it on every route — recorded as an info entry so a later check doesn't misread the silence as drift. REQ-118's `/api/assets` on the same origin is claimed by STORY-102 (CAP-89), which is the exact claim finding #1 is missing.
