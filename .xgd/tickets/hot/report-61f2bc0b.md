---
uid: report-61f2bc0b
id: REPORT-11676
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-09T03:14:57.351004+00:00'
updated_at: '2026-11-09T03:14:57.351004+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bug-00de1faf
  plan_item_index: '1'
---

Upgrade mutations applied for plan item 1 of 1

Target Stories: story-e674c60a
Primary Story UID: story-e674c60a
Stories Modified: 1
ACs Modified: 2
ACs Added: 6
ACs Removed: 0

tickets_modified:
  stories:
    - "story-e674c60a"
  acceptance_criteria:
    modified: ["acceptance_criterion-4c720b7e", "acceptance_criterion-e2cece6c"]
    added: ["acceptance_criterion-149c4e2e", "acceptance_criterion-9fb77753", "acceptance_criterion-a985df70", "acceptance_criterion-dadda0fd", "acceptance_criterion-e5c2749a", "acceptance_criterion-31fbf720"]
    removed: []

Progress: 1 of 1 plan items complete

**What changed**

The BUG-79 body, its transcript and `panel.js`/`app.js` agree on every point. The conflict-resolution ladder stopped at its first step, the operator's words being "It needs to flip in-place".

- **STORY-99:**
  - **Display panel:** a new scope bullet describes one frame per document mode, kept alive. A switch only changes which frame is visible, and hidden frames use `visibility`, never `display`. It also covers when a frame navigates, priming of the idle channel, and the panel announcing a frame when it is revealed.
  - **REQ-215 bullet:** the carried state is now applied to a document that is already laid out, not one that has just arrived.
  - **Technical Context:** the carry note is updated, and a new frame-per-mode note covers the two frame classes, the `panel.frame` getter and `reloadDocument()` replacing the three reload call sites.
  - **Reconciliation Decisions:** a new BUG-79 entry is added.
- **AC-968:** restated for one frame per channel. The pane and every frame stay the same live elements across a switch and back, the displayed address still changes, and a mount mode hides frames by class, not by the `hidden` attribute.
- **AC-2496:** the outcome stays the same (same page, same scroll offset). The old "the pane replaces its document, then re-scrolls" mechanism is gone.
- **New ACs, one for each of the six UATs in the BUG-79 test plan:**
  - AC-2517: a switch navigates neither channel.
  - AC-2518: the channel left behind stays laid out.
  - AC-2519: the idle channel is primed, but a frame that is only stale is not.
  - AC-2520: a revealed document is announced, and the edit loop, Marked Points and the carry bind to the panel.
  - AC-2521: a write reloads the shown page in place and marks the others out of date.
  - AC-2522: a site change or refresh invalidates every channel.
- **Decisions where the intent says nothing (recorded in the story):**
  - If the operator followed a link before flipping, the other channel navigates to that same page.
  - Only a load in the shown frame is announced.
  - Addresses are compared after they are resolved.
  - If the shown frame's window can't be reached during a write, the frame is pointed back at its last address.
- **Nothing marked superseded:** BUG-79 replaces a mechanism, not behaviour that any AC described.

No contradiction between the code and the intent was found, so nothing is flagged as a code issue. The six new ACs are in `pending` status. Each `xgd ticket create` call also tried to reach `github.com:22`, and the sandbox blocked it. The tickets were still created and checked locally, but that sync attempt didn't go through.