---
uid: report-c55e8a76
id: REPORT-7536
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-01T09:29:02.726387+00:00'
updated_at: '2026-11-01T09:29:02.726387+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-94dbe947
  plan_item_index: '3'
---

Plan item 3 is done. Story STORY-103 (`story-a58a0974`) was updated in place, AC-1792 was restated, and five new acceptance criteria now sit under the story. No new story was created and no runtime code was changed. All five new criteria show as children of the story.

**What changed in the story:**
- **Session texts:** added a section on how the three texts are organised.
  - The product level names no role.
  - The role text comes first in the system prompt, and the priming carries a short purpose naming DOC-33, DOC-35, DOC-31 and both corpora.
  - The reminder is a few lines that point to DOC-33 instead of restating it. The two per-turn signals are its one stated exception.
- **Ledger:** added a section on the consultant writing the record of decisions into the conversation's `chat` ticket. Only the deployed runtime has it; on the command line it is simply absent.
- **Summary manual:** priming now carries the summary version of the tool manual, with `DescribeTools` for a tool's full entry. The sizes are recorded (about 11k against 43k characters).
- **Old wording replaced:** the continuity section no longer says the body is "left for a summary something else writes". The out-of-scope bullet saying REQ-171 owns that summary is gone, replaced by three narrower out-of-scope items.
- **Reconciliation decisions (2026-11-01):** recorded under the existing heading:
  - **Role before product:** the intent never fixes the order in its acceptance list, and putting the role first follows from its reason for keeping role text in the system prompt.
  - **Trigger cost:** it is stated in the story's prose rather than as a testable criterion, because a caller can't observe it.
  - **Renaming:** the last writer wins. The intent requires compare-and-set only for entries and says nothing about the title.
  - **AC-1319 and AC-2066** are left unchanged on purpose.

**Criteria:**
- **AC-1792 (modified, and retitled):** a turn being saved never writes the ticket body. The body is the ledger, written only by the ledger operation. Its check now confirms a later turn leaves an already-written entry exactly as it was.
- **AC-2107 (new):** three-part structure, with each piece of material in exactly one part. The product text names no role, and the role text comes before it.
- **AC-2108 (new):** the summary manual is projected against the session's grant, every group has a description, and `DescribeTools` is offered.
- **AC-2109 (new):** the reminder stays under 600 characters and points to DOC-33. Its per-turn signals appear only when there is something to report, with the knowledge-base delta last.
- **AC-2110 (new):** recording a decision appends a numbered entry with compare-and-set. It covers clash, unrelated-failure and no-ticket-yet refusals, renaming the engagement, and the surface being absent on the command line.
- **AC-2111 (new):** the stated trigger: record a decision when it is settled, one per call, with rejected options; rename once the business is known; no clock or size threshold.

The ticket commits were made locally, but every write attempt to push to `github.com:22` was blocked by the sandbox, so none of these changes have been pushed.

```
Upgrade mutations applied for plan item 3 of 10

Target Stories: story-a58a0974
Primary Story UID: story-a58a0974
Stories Modified: 1
ACs Modified: 1
ACs Added: 5
ACs Removed: 0

tickets_modified:
  stories:
    - "story-a58a0974"
  acceptance_criteria:
    modified: ["acceptance_criterion-e44d6bbb"]
    added: ["acceptance_criterion-7284de3a", "acceptance_criterion-0bc4c461", "acceptance_criterion-e399a742", "acceptance_criterion-549dbeb0", "acceptance_criterion-f46b665b"]
    removed: []

Progress: 3 of 10 plan items complete
```
