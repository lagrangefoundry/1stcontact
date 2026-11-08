---
uid: report-e282f617
id: REPORT-11282
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-08T05:12:57.366390+00:00'
updated_at: '2026-11-08T05:12:57.366390+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-c0301347
  plan_item_index: '3'
---

Upgrade mutations applied for plan item 3 of 6

Target Stories: story-a58a0974, story-3cf3d57b
Primary Story UID: story-a58a0974
Stories Modified: 2
ACs Modified: 2
ACs Added: 4
ACs Removed: 0

```
tickets_modified:
  stories:
    - "story-a58a0974"
    - "story-3cf3d57b"
  acceptance_criteria:
    modified: ["acceptance_criterion-7284de3a", "acceptance_criterion-e399a742"]
    added: ["acceptance_criterion-677e9510", "acceptance_criterion-09f39ffa", "acceptance_criterion-d9b95844", "acceptance_criterion-14ebcba9"]
    removed: []
```

**AC changes:**
- **AC-2107** (modified): the framework's product tier is declared empty. The product text is now an entry in the role's list, after the role text, and still names no role. The old claim that the purpose names "the documents the role must read" is replaced by the subjects-and-map wording from BUG-65.
- **AC-2109** (modified): the reminder is six configured entries in a fixed order: site first, corpus delta last, separated by blank lines. An entry with nothing to report is dropped along with its separator. The "contains DOC-33" check now looks for a pointer to the knowledge base and requires that no `DOC-<n>` id appears.
- **AC-2374** (new, STORY-103): all priming and reminder prose is in one configuration file, including line-list prose and the `{placeholder}` templates, with two declared orders (with and without a knowledge base). Each of the five malformed shapes stops start-up with an error naming the entry.
- **AC-2375** (new, STORY-103): an entry whose condition doesn't hold is dropped with its separator. The priming budget is a declared 60,000 characters, and overflow fails naming the entry with no truncation.
- **AC-2376** (new, STORY-149): each priming list ends with exactly one cache boundary, so the whole priming is one cached prefix. The landscape is read once per session.
- **AC-2377** (new, STORY-149): no text a session can be sent contains a `DOC-`/`REF-` id or a corpus document title. Adding or demoting a document costs no edit to the configuration file.

**Story bodies:** both stories' text now describes the configured priming. Each has dated entries under Reconciliation Decisions. The most important one: the old claim that "resolving per assembly lets a new document reach the session" is replaced. The map is now assembled once per session, so the per-turn corpus delta is how a new document reaches the session.

**No code-issues found.** The code matches REQ-182's as-built scope and BUG-65. The `DOC-22` citations left in the configuration file's maintainer-only `about` block are the provenance BUG-65 explicitly allows.

Three of the five malformed shapes in AC-2374 have no UAT yet: a boundary marker carrying other keys, two markers in one list, and a marker in the reminders. They are the framework loader's checks, and the existing REQ-182 UATs only exercise both-or-neither and the unregistered provider. Downstream UAT generation will need to add tests for them.

The ticket commits were saved locally, but the sandbox blocked the git push to github.com over SSH. They will need pushing from outside the sandbox.

Progress: 3 of 6 plan items complete