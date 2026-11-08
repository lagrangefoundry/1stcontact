---
uid: report-fc7eb692
id: REPORT-11273
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-08T04:38:01.696775+00:00'
updated_at: '2026-11-08T04:38:01.696775+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-c0301347
  plan_item_index: '2'
---

Plan item 2 is done: STORY-157 and its acceptance criteria now describe what REQ-206 (commit e8413985) built, and no new story was created. All four AC changes and the story edit read back from the store with the new text. The push to GitHub (`github.com:22`) was blocked by the sandbox, so these ticket commits exist only locally for now.

```
Upgrade mutations applied for plan item 2 of 6

Target Stories: story-58b2cec4
Primary Story UID: story-58b2cec4
Stories Modified: 1
ACs Modified: 2
ACs Added: 2
ACs Removed: 0

tickets_modified:
  stories:
    - "story-58b2cec4"
  acceptance_criteria:
    modified: ["acceptance_criterion-34345748", "acceptance_criterion-8fb41bd7"]
    added: ["acceptance_criterion-eba77f29", "acceptance_criterion-b38aac0b"]
    removed: []

Progress: 2 of 6 plan items complete
```

**What changed:**
- **AC-2024 (modified):** a Worker with a browser but no private bucket now counts as "cannot look", the same as a Worker with no browser. The session still opens, replays its transcript and edits, with no looking operations offered. I added a verification branch for the missing-bucket case.
- **AC-2031 (modified):** the screenshot arrives as an image content block on both the Worker and the 1c CLI. The criterion now rules out JSON text with base64 inside it. It also requires that the call still goes through the Toolbox's validation, gate, refusals and audit, and that other tools' results pass through unchanged.
- **AC-2372 (new):** on the Worker the looking surface is bound to the request's business:
  - captures go into that business's own private bucket and are adopted as references marked third-party;
  - re-adopting the same capture doesn't create a duplicate, and one business can't see another's references;
  - pictures of the draft come from the `/preview/*` renderer at the deployment's own origin;
  - captures of outside sites are never answered from our own store;
  - no new HTTP route is added.
- **AC-2373 (new):** each Worker session gets 40 browser acquisitions, counted before each lease, so a failed launch still spends one. Reading anything already captured or rendered is free. The 41st acquisition gets a `BUDGET:` refusal that says what still works, while other tools keep working. The 1c CLI has no budget.
- **STORY-157:**
  - `story_kind` changed from feature to upgrade.
  - The description and scope now cover mounting on the Worker per business, the budget, and the image recovery.
  - Technical Context names `sessionFidelity`, `fidelityDeps` and `browserBudget`.
  - New dated entries under Reconciliation Decisions record two behaviours the intent doesn't mention: a failed launch still spends, and re-adoption doesn't duplicate.

**One possible conflict, judged not to be one:** REQ-206 says the provenance markers "do not survive the round trip". I read that as describing the code before the later fix, not as a requirement that the markers be absent. So AC-2067, which requires the image to stay inside the untrusted-content frame, is unchanged, and the story records that decision.