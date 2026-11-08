---
uid: report-bf0b84bc
id: REPORT-11475
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-08T14:25:49.404043+00:00'
updated_at: '2026-11-08T14:25:49.404043+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-0d00566a
  plan_item_index: '6'
---

Plan item 6 is applied to STORY-99. I updated the story, rewrote AC-2232 and added two new ACs (AC-2463, AC-2464), and the new ACs show as children of STORY-99. No new stories were created and no runtime code or UATs were touched. The code matches BUG-70 and BUG-71, so I flagged no code issues.

When the two ACs were created, the ticket tool tried to reach `github.com:22` (SSH, probably a store sync) and the sandbox blocked it. The tickets are in the local store, but any push to the remote did not happen from here.

```
Upgrade mutations applied for plan item 6 of 8

Target Stories: STORY-99
Primary Story UID: story-e674c60a
Stories Modified: 1
ACs Modified: 1
ACs Added: 2
ACs Removed: 0

tickets_modified:
  stories:
    - "story-e674c60a"
  acceptance_criteria:
    modified: ["acceptance_criterion-e09aeac6"]
    added: ["acceptance_criterion-afd49ca5", "acceptance_criterion-8b22495a"]
    removed: []

Progress: 6 of 8 plan items complete
```

- **STORY-99:**
  - **Typography:** the bullet that named BUG-53's controls now covers every text-bearing builder control, as BUG-70 asks.
  - **Empty state:** a new bullet describes the shared "nothing is selected" box.
  - **Served bridges:** a BUG-71 paragraph under the build-artifacts point says each bridge's full import graph is emitted and checked before the new tree replaces the old.
  - **Reconciliation Decisions:** a dated (2026-11-08) entry records the choices below.
- **AC-2232 (rewritten):** the rule now applies to every text-bearing control instead of a fixed list, and is checked by walking each control's real parent chain on mounted surfaces. A check of the source files covers surfaces the tests don't mount. These are exempt:
  - controls that paint no text;
  - the Marked Points overlay;
  - controls drawn by the shared out-of-repo components.

  The BUG-53 points are kept: shared padding, the dialog-button class, the primary-button marker and the top-bar override.
- **AC-2463 (new):** the Library and Contacts empty detail panes show their prompt inside one shared styled box, never as bare text.
- **AC-2464 (new):** `1c assets` emits each bridge's full import graph and fails the build on any import that can't be resolved, naming each one and leaving the previous `dist-assets` in place. The full details are in the AC.

The Reconciliation Decisions entry records three choices:
- BUG-71 sits next to AC-1400, which already covers the bridges as build artifacts.
- Two behaviours the intent doesn't mention are now ACs: a source import that resolves to no file, or to one outside the repo, fails the build where it's found; and the refusal is an ENVIRONMENT error.
- BUG-71's own "not fixed here" items are not claimed: `1c builder` still doesn't build assets first, and the CLI usage text still lists the deleted `serve` command.