---
uid: report-256e3f7f
id: REPORT-11240
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-08T02:34:36.893572+00:00'
updated_at: '2026-11-08T02:34:36.893572+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-4164b433
  plan_item_index: '4'
---

```
Upgrade mutations applied for plan item 4 of 7

Target Stories: STORY-149
Primary Story UID: story-3cf3d57b
Stories Modified: 1
ACs Modified: 1
ACs Added: 1
ACs Removed: 0

tickets_modified:
  stories:
    - "story-3cf3d57b"   # STORY-149
  acceptance_criteria:
    modified: ["acceptance_criterion-a0c627a1"]   # AC-1795
    added: ["acceptance_criterion-078e755f"]      # AC-2364
    removed: []

Progress: 4 of 7 plan items complete
```

**What changed**
- **AC-1795:** the consultant system prompt now comes first, then one landscape section holding both maps (the client's first), then the purpose, then how to search, on every host. I removed the old requirement for a "closing instruction to begin", because BUG-63 says that sentence and the "Your purpose" heading were deleted along with `KnowledgeDocs`. The check now reads the system prompt the model was actually sent, with any cache-split blocks joined back into one string.
- **AC-2364 (new):** on the Node host and both Worker paths, the model must actually be sent the system prompt, the landscape, the purpose, how to search, and that turn's reminder. This applies whether the system prompt goes out as one string or as cache-split blocks. A host with no knowledge base built is sent the system prompt and the tool manual, with no knowledge-map sections, and still runs. I added that fallback from BUG-63's test plan and recorded it as a reconciliation decision.
- **STORY-149:** the scope now includes the system-prompt-first order and the delivery requirement. Technical Context now explains the configuration-based priming and how the old keys were silently dropped. A new reconciliation decision, dated 2026-11-07, explains both AC changes and lists what this story leaves out: the describer role, the bridge-shim export list, and the change-signal rule.

**Where the code differs from the commit message:** the commit says the four entries are defined once in `kmPrimingEntries` in `roles.ts`. On this branch they are built inline at `tools/generate/src/cli/ai/host-core.ts:648-664`, under `consultant-*` names. The order is the same, and entry names never reach the prompt, so neither AC depends on this and I did not flag it as a code issue.

All the ticket edits went through. The creation of AC-2364 also tried to reach `github.com:22`, and the sandbox blocked it, so the ticket store has not been pushed.