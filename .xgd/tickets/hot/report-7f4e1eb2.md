---
uid: report-7f4e1eb2
id: REPORT-1743
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-10T07:31:18.378627+00:00'
updated_at: '2026-08-10T07:31:18.378627+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-e59210c5
  plan_item_index: '1'
---

All mutations are applied and committed; no runtime code was touched.

**What I did, and the one judgment call worth flagging:** REQ-119's own body declares its AC-1 ("served by `control-app` at request time") unreachable and not attempted. So every criterion I wrote describes the **builder origin** and the observable an operator has — none claims the edge Worker renders. I recorded the deviation explicitly in STORY-99's Technical Context rather than letting the matrix quietly absorb the code as if it satisfied the original intent.

Two small extensions beyond the plan's literal AC list, both required for story↔AC consistency:
- STORY-100's "Making the change visible" bullet said a successful edit is *followed by re-rendering* and that the origin covers both channels — no longer true of the origin path (`editCopySet` renders nothing; the CLI still does). I rewrote that bullet and added a Technical Context note recording the supersession. The CLI clause in AC-982 is untouched because `1c copy set` does still render both channels to disk and report both paths.
- STORY-99's confinement bullet enumerated "rendered channels" as a served file tree; draft/edit are now a lookup plus the site's assets directory. Reworded to stay truthful without changing AC-978's claim.

```
Upgrade mutations applied for plan item 1 of 8

Target Stories: story-e674c60a, story-37a3921b
Primary Story UID: story-e674c60a
Stories Modified: 2
ACs Modified: 3
ACs Added: 6
ACs Removed: 0

tickets_modified:
  stories:
    - "story-e674c60a"
    - "story-37a3921b"
  acceptance_criteria:
    modified:
      - "acceptance_criterion-e1acae35"   # AC-973 — companion pane is the assistant panel, not a placeholder
      - "acceptance_criterion-9561711e"   # AC-992 — both views current, observed at the origin; "before it reports success" dropped
      - "acceptance_criterion-d4bc1184"   # AC-1026 — origin clause observed at the origin; CLI clause unchanged
    added:
      - "acceptance_criterion-e9a9ba3b"   # AC-1031 — channels answer with no artifact on disk, serving writes nothing back
      - "acceptance_criterion-46534535"   # AC-1032 — one render backs writer and reader: same file set, same bytes, both channels
      - "acceptance_criterion-ae33f0ab"   # AC-1033 — out-of-band change shows next request, no render step, and unwinds
      - "acceptance_criterion-912dcc52"   # AC-1034 — invalid draft reported in the pane, naming the field
      - "acceptance_criterion-4d519076"   # AC-1035 — published comes from the publish-time render, never today's draft
      - "acceptance_criterion-46e9debf"   # AC-1036 — same addresses resolve; nothing outside the channel
    removed: []

Progress: 1 of 8 plan items complete
```
