---
uid: report-b89b36de
id: REPORT-2370
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-20T04:45:08.126182+00:00'
updated_at: '2026-08-20T04:45:08.126182+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-77b28def
  plan_item_index: '7'
---

Upgrade mutations applied for plan item 7 of 9.

**What I read first:** REQ-123's body (`request-488d874b`) and its full chat transcript (COMMENT-831), then the code — `cli/ai/toolbox.ts:454-516` (the two-surface composition and `knowledgeInstanceConfig([SYSTEM_KB])`), `cli/ai/host.ts:229-395` (`openKnowledge`, `primingSource`, the role's `source`), the upstream `knowledge_surface.json` (three ops, all `effect: read`, all `provenance: untrusted`, group `ReadKnowledge`) and `instanceConfig` (one name list filling both `kb` and `document` axes), plus `tests/test_UAT_FC_REQ-123_session_knowledge.test.ts`.

**Alignment notes:** the intent's §3 "Wiring" and its "Degradation, not failure" paragraph are the authority for all four new criteria; nothing was added from code the intent is silent on. Two things the code does that the intent scoped *out* were deliberately not absorbed: the D1 store and the tenancy model (the operator moved both off this ticket), recorded in Technical Context as design a later ticket inherits rather than as behaviour claimed here. The evidence caveat the intent itself states — `1c kb build` never ran against real Cloudflare credentials, so the session-side proof uses a stand-in embedder — is recorded rather than glossed.

**One existing AC was inaccurate after this change:** AC-1058 was titled "offered only granted **site** operations", which stops being true the moment a knowledge base is built. Sharpened rather than removed — the invariants that actually matter (no path, no site parameter) hold for the corpus operations too, and now say so.

```
Target Stories: story-a58a0974
Primary Story UID: story-a58a0974
Stories Modified: 1
ACs Modified: 1
ACs Added: 4
ACs Removed: 0

tickets_modified:
  stories:
    - "story-a58a0974"        # STORY-103, story_kind feature -> upgrade
  acceptance_criteria:
    modified: ["acceptance_criterion-24fae61d"]   # AC-1058 sharpened
    added:
      - "acceptance_criterion-3590669c"           # AC-1317 one granted surface; gated, untrusted, audited
      - "acceptance_criterion-6a13867e"           # AC-1318 read-only, both scope axes from one declaration
      - "acceptance_criterion-bb427b19"           # AC-1319 primed with the map + manual, not the documents
      - "acceptance_criterion-ceeb657c"           # AC-1320 degradation silent, failed-open reported
    removed: []
```

No new story tickets were created; no runtime code was touched. STORY-117 (plan item 6, the corpus build) was left alone and is now named as this story's out-of-scope boundary and dependency.

Progress: 7 of 9 plan items complete.
