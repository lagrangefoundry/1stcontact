---
uid: report-e8cde7a0
id: REPORT-6770
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-10-26T01:40:26.884462+00:00'
updated_at: '2026-10-26T01:40:26.884462+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-5607a08d
  plan_item_index: '3'
---

Plan item 3 is done: STORY-144 and STORY-145 now describe the REQ-176 Library row and overlay wording as built. Two stories were updated, one AC was changed and three were added. No runtime code or UATs were touched, and no story tickets were created.

```
Upgrade mutations applied for plan item 3 of 9

Target Stories: story-1500b111, story-325da65f
Primary Story UID: story-1500b111
Stories Modified: 2
ACs Modified: 1
ACs Added: 3
ACs Removed: 0

tickets_modified:
  stories:
    - "story-1500b111"
    - "story-325da65f"
  acceptance_criteria:
    modified: ["acceptance_criterion-d45bf6ea"]
    added: ["acceptance_criterion-e625bfde", "acceptance_criterion-c72effd0", "acceptance_criterion-1e3b64e8"]
    removed: []

Progress: 3 of 9 plan items complete
```

**Stories**
- **STORY-144 (The Library):**
  - Adds a section on how a row looks: a type icon in place of the kind pill, the icon readable by a screen reader, everything on one line, and a 13px title that truncates while the pills keep their width.
  - Adds row presentation to In scope. In Technical Context it notes that the shared list component is unchanged and that the role pill's words come from STORY-145.
  - Records under Technical Context that the placement wording is unchanged and still open. The strings stay *On this site* / *Used on* / *Used on this site*; *Live on the site* is not documented.
  - Adds one Reconciliation Decision, below.
- **STORY-145 (Handing A File To The Platform):**
  - Switches the overlay text to *Purpose* / *Site asset* / *Background information*.
  - Adds a paragraph saying the area labels are defined once and shared by the overlay, the Library and the assistant's manual. The role IDs `site` / `reference` don't change.
  - Notes in Technical Context what REQ-176 renamed.

**ACs**
- **AC-1725 (changed):** the prompt reads *Purpose*. The two areas read *Site asset* then *Background information*, with IDs `site` then `reference`. Both hint lines are unchanged, including the promise that background material won't appear on the site.
- **AC-2019 (new, STORY-144):** every row opens with exactly one icon. Document, image and font each get their own; capture and unknown kinds share a fallback. Screen readers announce the icon as the kind, and no row has a kind pill. The role and placement pills stay, and kind is still a filter and still shown in the detail pane.
- **AC-2020 (new, STORY-144):** the row is one line, in the order icon, title, pills. The 13px title takes the remaining space and truncates with an ellipsis, while the icon and pills never shrink or wrap.
- **AC-2021 (new, STORY-145):** the overlay labels, the Library's role pills and role filter, and the role in the detail pane all read from one definition. The assistant manual's "cannot fetch a file" note quotes the *Site asset* label exactly.

**Reconciliation Decision (2026-10-25):** REQ-176 doesn't say what happens to a row with no recorded kind. In the code it gets the fallback icon labelled *file*, and I've written that into AC-2019. I found no places where the code contradicts the intent.

**Worth knowing**
- AC-1726, AC-1731 and AC-1733 still say *put it on the site* / *just for you to read*. I left them alone: they describe what each role means and check the role values, not the button text.
- Every `xgd ticket create` call reported a blocked outbound connection to `github.com:22`. The tickets were still created locally, but nothing has been pushed to GitHub from here.
