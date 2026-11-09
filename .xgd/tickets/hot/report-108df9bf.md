---
uid: report-108df9bf
id: REPORT-11988
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-09T18:46:33.607103+00:00'
updated_at: '2026-11-09T18:46:33.607103+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-0881342c
  plan_item_index: '5'
---

Plan item 5 is done: STORY-144 now covers the image modal, with seven new ACs and AC-1718 updated. One AC, the chat one, will fail against the current code, on purpose.

**The failing AC (AC-2554, opening the modal from the chat).** The chat URL parser `materialUidFromUrl` (`apps/control-app/src/builder/api.js:700`) only accepts the bare `/api/material/file` path. In every real session the builder forms that address with a `/b/<businessId>` prefix, so a picture the builder put in the chat can't be opened by the builder's own click. REQ-220's ticket body names this as REQ-220's own defect to fix: *"the parser should recognise the material file route with or without a `/b/<id>` prefix."* The ticket's transcript says nothing on the point, so the body settles it. The AC states that intent rather than the current behaviour, and the story records it as a code issue for `fix_uat_coverage`.

**The other new ACs:**
- **AC-2553:** opening the modal from the Library pane. The picture is a keyboard-reachable button, only one modal opens at a time, and it closes when you select another row.
- **AC-2555:** only non-SVG images are offered the editor. Captures, drawings and other kinds are not, and a direct edit request for them gets a 403 with a different message for drawings.
- **AC-2556:** the Library name is one field in the pane and the modal. It changes the material's title, never its filename. An empty name is refused.
- **AC-2557:** crop, turn, resize and the three sliders each commit one operation to the material's recipe. The modal then re-fetches the rendered picture, and no control sends bytes.
- **AC-2558:** undo and redo only cover the current sitting, and each step is saved straight away.
- **AC-2559:** a refused edit returns 409 with the vocabulary's own message and only that step is removed. With no image renderer, the edit is still stored and the modal says so.

**AC-1718 changed** because the name field now appears on every material. The editable fields are the name, the description and, on uploads only, the role. AC-1717 is unchanged: the name has its own block, so the rights record is still read-only apart from an upload's role.

**Decisions recorded in the story**, where the intent said nothing and I followed the code: the name field appears on every material, not just pictures; empty names are refused; a missing uid on either new route is a 400. Also, keeping drawings out of the modal is correct for now. REQ-220 wants a name-only modal for drawings once they have catalogue entries, and that work moved to REQ-228, which isn't in this bundle.

The sandbox blocked the ticket store's push to GitHub (port 22) on each write. All the changes are saved locally but not pushed.

```
Upgrade mutations applied for plan item 5 of 6

Target Stories: story-1500b111
Primary Story UID: story-1500b111
Stories Modified: 1
ACs Modified: 1
ACs Added: 7
ACs Removed: 0

tickets_modified:
  stories:
    - "story-1500b111"
  acceptance_criteria:
    modified: ["acceptance_criterion-bf0d2b7c"]
    added: ["acceptance_criterion-557f94f1", "acceptance_criterion-c103782e", "acceptance_criterion-80e8a7f6", "acceptance_criterion-acd3fdd7", "acceptance_criterion-2b87849f", "acceptance_criterion-1e42ad48", "acceptance_criterion-27547093"]
    removed: []

Progress: 5 of 6 plan items complete
```