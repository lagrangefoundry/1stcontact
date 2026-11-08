---
uid: report-7b026f36
id: REPORT-11503
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-08T15:54:17.466462+00:00'
updated_at: '2026-11-08T15:54:17.466462+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-0d00566a
  plan_item_index: '8'
---

Plan item 8 is applied. I updated STORY-103 and added one new acceptance criterion, AC-2467, which now shows up among the story's children (48 in total).

**What the intent says and what the code does.** BUG-67's 2026-09-10 scope addition (items 9–11) and its later decision to move the model to Opus 5 call for these settings to be the project's own configuration. The code matches that intent with no contradiction:
- `tools/generate/src/cli/ai/backends.json` declares `claude: { model: "claude-opus-5", max_tokens: 64000 }`.
- `backends.ts` imports that file statically, not through the filesystem, and passes it to the framework's `configureBackends`.
- In `host-core.ts`, `build()` calls `configureProjectBackends(lib)` before `registerBackend`, so both hosts send the same settings from the first turn.

**Changes to STORY-103** (content only; I left `story_kind` as `upgrade`):
- **Scope:** a new bullet, "Which model answers, and how long a reply may be". It gives the current values and says that editing the document alone changes them. The build includes the document rather than reading it at run time, so both hosts agree. It is installed before the first backend is constructed, and a malformed document stops start-up with the framework's error naming the key.
- **Technical Context:** why the settings are a document rather than constructor options. The registry builds backends from zero-argument factories, so configuration reaches every construction site where an argument reaches only one. Also why it is installed before registration and imported statically, and that the request sends only `model`, `max_tokens`, `system`, `messages`, `tools` and `stream`.
- **Reconciliation Decisions (2026-11-08, BUNDLE-41):** two decisions. The new criterion checks the request itself and reads the expected values from the document instead of hard-coding them. Rejecting a malformed document stays in scope only, not as its own criterion, because that validation belongs to the framework (lagrange-framework BUG-49).

**New AC-2467:** every model request carries the `model` and `max_tokens` the project's backend document declares, from the first turn of a new session, the same on the CLI and deployed hosts. Changing the document alone changes the next request.

When the ticket store tried to reach `github.com:22` after creating the AC, the sandbox blocked it, so a push or sync step may not have run. The AC was still created locally and is linked to the story.

```
Upgrade mutations applied for plan item 8 of 8

Target Stories: STORY-103
Primary Story UID: STORY-103
Stories Modified: 1
ACs Modified: 0
ACs Added: 1
ACs Removed: 0

tickets_modified:
  stories:
    - "STORY-103"
  acceptance_criteria:
    modified: []
    added: ["AC-2467"]
    removed: []

Progress: 8 of 8 plan items complete
```