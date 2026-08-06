---
uid: report-c707c0f6
id: REPORT-1423
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-06T18:50:31.284555+00:00'
updated_at: '2026-08-06T18:50:31.284555+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-e0143ffa
  plan_item_index: '4'
---

Story and criteria created and verified (13 ACs attached to the story).

**Grounding**: read the REQ-111 section of `bundle-e0143ffa` (body + its "As built" decisions, including the three beyond-scope additions, the no-auth decision, the published-TTL wart, and the two unverified items) before reading `apps/public-site/src/{index,routes,site-store,content-type}.ts`, `wrangler.toml`, and `assertNoReservedSegment` in `tools/generate/src/deploy/content.ts`.

**Judgment calls**:
- The extensionless `.html` fallback present in `serve()` and `parseRoute` is deliberately **not** covered here — it belongs to plan item 5, whose claim is agreement between the two serving environments.
- The `SiteStore` seam is described in Technical Context, not as an AC: it is an internal arrangement, and every AC is observable at the HTTP boundary.
- Carried forward into Technical Context rather than absorbed as correct behaviour: the unrun live-bucket/apex-custom-domain smoke check, the currently-unreachable reserved-segment gate, the ≤60s mixed-asset window (ACs pin the short TTL, not the absence of the window), and the stale [[DOC-12]] "author only (private)" wording that the no-authentication decision supersedes.

```
Story #4 created for reconciliation bundle-e0143ffa

Story UID: story-d34eccd8 (STORY-95)
Title: Serve a deployed snapshot: shareable previews and live published sites reach a visitor
Type: feature
Capability: capability-a12e557f (CAP-82 — Site Delivery: Deploy & Public Serving)
Acceptance Criteria: 13 created (AC-902 … AC-914)

Progress: 4 of 5 plan items complete
```
