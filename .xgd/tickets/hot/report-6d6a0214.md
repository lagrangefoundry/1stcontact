---
uid: report-6d6a0214
id: REPORT-2891
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-31T09:33:33.666300+00:00'
updated_at: '2026-08-31T09:33:33.666300+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-b3b7c399
  plan_item_index: '1'
---

Story and criteria are in place and correctly parented.

**Grounding.** I read REQ-147's ticket body first (its six stated ACs, the `workers_dev` finding, the scope boundaries), then the implementation record in the same bundle, then the code — `access.ts`, `index.ts`, `wrangler.toml`, `ACCESS.md` — and the FC evidence file.

**Three judgment calls worth surfacing:**

1. **New capability created** (CAP-103, `capability-3606e35b`, "Operator Access Gate: Who May Reach The Builder"). No existing capability covers authorising the operator surface; CAP-85 owns the workspace *behind* the gate. This matches the plan's own justification for classifying item 1 as a feature.

2. **The "no local-development bypass" claim in the plan item is superseded by later intent in the same bundle.** REQ-147's record says there is no bypass and leaves it as an open question; REQ-145 answers it by adding `ACCESS_DEV_OPEN`, and the operator's review note names it as a bypass explicitly. Writing an AC asserting "no bypass exists" would set regression against the operator's own restated intent. The criteria instead assert that a **configured** gate has no exception path — true today, and still true if the exception is removed. The exception's containment (absent from `[env.production.vars]`) is asserted by the REQ-145/REQ-144 tests, so it belongs to items 3 and 9. Recorded under `## Reconciliation Decisions`.

3. **REQ-147 AC2 has no criterion**, per the plan's flag. An identity that authenticates but is off the policy is refused upstream; the Worker never sees it. AC-1384 carries an explicit "out of scope for this criterion" section so the story cycle doesn't attempt a UAT that cannot exist.

Three intent-silent behaviours were formalized as decisions rather than deferred: key rotation without restart (AC-1380), uncacheable/unindexed refusals (AC-1381), and cookie-vs-header precedence (AC-1376). Live-origin smoke ACs were deliberately **not** claimed here — the plan routes those two checks to item 9.

One minor drift noted but not formalized: `ACCESS.md` still says both settings "ship empty" while `wrangler.toml` now carries real values. That is the lifecycle the document itself instructs, so pinning the empty state as an AC would make the correct next step a test failure.

```
Story #1 created for reconciliation bundle-b3b7c399

Story UID: story-182e8cb9 (STORY-120)
Title: The builder is private: only granted identities reach it, on every address it answers on
Type: feature
Acceptance Criteria: 10 created (AC-1375 … AC-1384)

Progress: 1 of 11 plan items complete
```
