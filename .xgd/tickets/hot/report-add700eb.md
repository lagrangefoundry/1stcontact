---
uid: report-add700eb
id: REPORT-4254
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-09-14T07:30:50.283500+00:00'
updated_at: '2026-09-14T07:30:50.283500+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-8e1807f6
  plan_item_index: '9'
---

Only the ticket store's change feed is dirty — no runtime code was touched.

**In scope / out of scope**

- In scope: `story-7f437d57` (STORY-104) and its AC-1063.
- Explicitly left alone: AC-1066 and AC-1054 (plan item 10's targets, a later call), `story-1500b111` (STORY-144 — BUG-42's Library half belongs to item 8), `story-a58a0974`, and `story-e674c60a`.

**What the intent and code said**

BUG-42's body states the rule directly: *"do not paint markdown before the engine has settled."* The code matches — `builder/markdown.js:37` starts both loads at import and exports a `markdownReady` that `.catch()`es each load so it settles on failure and never rejects; `builder/app.js:357` awaits it in a `Promise.all` alongside `openSession(slug)` under the existing generation guard, and line 362 makes the failure branch wait too. `chat.js:48` imports the module for its side effect only. The FC suite drives exactly this ordering with an injected deferred (`tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts:208`). Nothing in the code contradicts the intent.

One thing the story previously asserted is now false and was withdrawn: its Technical Context carried *"No criterion asserts rendered markdown"* as a known upstream gap. The intent closed that gap, so the note is replaced by a statement of what actually holds — degradation when the engines are **absent** is still unclaimed as rendering; painting while they are merely **late** is the defect the ordering criterion now covers. That distinction, plus the decision to state the shared-engine guarantee once here rather than on every story that waits on it, and the decision to keep the injectable readiness seam out of the criteria (it is a test affordance, not a product boundary), are recorded under `## Reconciliation Decisions` dated 2026-09-14.

```
Upgrade mutations applied for plan item 9 of 10

Target Stories: story-7f437d57
Primary Story UID: story-7f437d57
Stories Modified: 1
ACs Modified: 1
ACs Added: 1
ACs Removed: 0

tickets_modified:
  stories:
    - "story-7f437d57"   # STORY-104
  acceptance_criteria:
    modified: ["acceptance_criterion-871fba3a"]   # AC-1063
    added: ["acceptance_criterion-c8dcd861"]      # AC-1816
    removed: []

Progress: 9 of 10 plan items complete
```
