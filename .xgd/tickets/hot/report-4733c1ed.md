---
uid: report-4733c1ed
id: REPORT-6823
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-10-28T04:10:46.163648+00:00'
updated_at: '2026-10-28T04:10:46.163648+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-5607a08d
  plan_item_index: '7'
---

```
Upgrade mutations applied for plan item 7 of 9

Target Stories: story-a58a0974
Primary Story UID: story-a58a0974
Stories Modified: 1
ACs Modified: 1
ACs Added: 4
ACs Removed: 0

tickets_modified:
  stories:
    - "story-a58a0974"
  acceptance_criteria:
    modified: ["acceptance_criterion-fe61861f"]
    added: ["acceptance_criterion-954802af", "acceptance_criterion-230228e8", "acceptance_criterion-1c526ad9", "acceptance_criterion-9c3a196d"]
    removed: []

Progress: 7 of 9 plan items complete
```

All REQ-174 changes are now in the matrix. I checked them against `roles.ts`, `host-core.ts` and `instances.json`, and against the existing UAT file `tests/test_UAT_FC_REQ-174_consultant_role.test.ts`. The code matches the intent; it contradicts it nowhere.

- **STORY-103:**
  - The scope now says the one role on offer is the consultant, and that this is the only name the host ever reports or records.
  - It describes the advisory preamble: form a view, say when a request would make the site worse, never build past an open question, and keep the closed-vocabulary rule.
  - It says a conversation stored under the old name still reopens and keeps working.
  - One leftover "caretaker" in the Technical Context became "role's".
  - A new 2026-10-27 Reconciliation Decisions block records why the BUNDLE-27 rule "claim nothing about the preamble's wording" no longer covers the parts REQ-174 specifies.
- **AC-1051 (modified):** the answer names `consultant` and no other name, and the old name is never reported.
- **AC-2054 to AC-2057 (added):**
  - AC-2054: the preamble the model actually receives.
  - AC-2055: the name recorded in the archive header and returned by the roles endpoint, plus the grant key and the corpus purpose.
  - AC-2056: a conversation stored under the old name reopens and can still take a turn, with nothing written under the old name.
  - AC-2057: a check that no file in the working tree contains the old word except the alias declaration.
- **Decision where the intent was silent:** the code's word check excludes more than the `kb/` and `generated/` folders the intent lists. It also skips `storage/` (stored conversations, deliberately not migrated), dependencies and build output, dot-folders, and file types other than source and docs. I wrote these into AC-2057 as categories and recorded the reasoning under Reconciliation Decisions.

The sandbox blocked the outbound pushes to `github.com:22` that ran while the ACs were created. The tickets exist in the local store and are linked to the story, but they haven't been synced to the remote.
