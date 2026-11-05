---
uid: bug-ffc8d54d
id: BUG-309
type: bug
title: 'Plan surface: duplicate "note" key in written-result descriptions'
created_by: EPIC-19
created_at: '2026-10-28T02:34:53.643641+00:00'
updated_at: '2026-10-28T02:53:53.006878+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: low
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-fb6f8c8a
  commits:
  - working_sha: 23d2f71fa415f96ce8f81f4f1a83021e54842a73
    reconcile_sha: null
    main_sha: null
  version: 0.2.692
  story_points: 1
---

## Symptom

The control-app bundle warns `Duplicate key "note" in object literal` for `tools/generate/src/cli/ai/plan-surface.json`, lines 35 and 41. Both are under `written` (the descriptions of what a plan write returns):
- line 35, `"note": "the section and length of the note added, when the change was a note"` (2026-10-02, `dbd64a27b8`): the plan's notes section, emitted by `plan-core.ts` as `{ note: { section, characters } }`;
- line 41, `"note": "the story-board note as it now stands"` (2026-10-18, `c80b1bcda3`).

JSON keeps only the last duplicate, so the consultant's tool description has silently lost the first meaning. It's told `written.note` is always a story-board note, even when it's a plan note.

## Fix

1. **Keep one `note` key whose description covers both shapes,** for example "the note: for a plan note, its section and length; for a story-board note, the note as it now stands". Or rename one of the two result keys in the code that emits it, and its description with it. Choose whichever leaves the consultant's reading unambiguous, and record the choice here.
2. **Guard against it recurring:** the declaration loader, or a test, refuses a surface JSON with a duplicate key. Every `*-surface.json` under `tools/generate/src/cli/ai/` is checked, so the bundle warning can't be the only signal.

Not in scope: the bundle's other warning (`ACCESS_DEV_OPEN` at the top level, not under `env.production.vars`) is deliberate. Its absence from production is the REQ-145 security control, pinned by a UAT and documented in `wrangler.toml`.

## Test plan

- `test_UAT_FC_BUG-309_written_note_describes_both_shapes`: the parsed plan surface's `written.note` description covers both the plan-note and story-board-note results (or each key, if renamed, matches what the code emits).
- `test_UAT_FC_BUG-309_surface_json_has_no_duplicate_keys`: every `*-surface.json` in `tools/generate/src/cli/ai/` parses with no duplicate keys at any depth.


## What changed (2026-10-27)

**Choice: one key, not a rename.** `shapes.written.note` in `plan-surface.json` now reads "the note: for a note added to the plan, its section and length; for a story-board note, the note as it now stands". It stays at the first key's position, and the duplicate further down is removed. Both emitters are unchanged: `plan-core.ts` `add_note` returns `{ note: { section, characters } }`, and `story-core.ts` returns `{ note: <the note> }`. A rename would have changed result keys that the consultant and the existing UATs already read. One description that names both shapes fixes the reading with no change to any API.

**Guard:** a test, not the loader. Surface files are imported as JSON modules, so they're already parsed (and duplicates already collapsed) before any loader sees them. `tests/test_UAT_FC_BUG-309_surface_json_keys.test.ts` scans the raw text of every `*-surface.json` in `tools/generate/src/cli/ai/` for duplicate keys at any depth. It uses a small in-test scanner (no dependency), which also checks itself against a known duplicate.

Regression scope: 15 related suites (plan/priming/tool-manual). The 4 failures, in REQ-416 worker_and_talker and REQ-424 focus_tasks, are pre-existing: they fail identically with the old JSON.