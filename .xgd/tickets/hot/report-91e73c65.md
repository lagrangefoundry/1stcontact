---
uid: report-91e73c65
id: REPORT-12031
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-09T21:57:02.671258+00:00'
updated_at: '2026-11-09T21:57:02.671258+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-374f88d6
  plan_item_index: '1'
---

Upgrade mutations applied for plan item 1 of 8. All writes landed locally; xgd's attempt to reach github.com was blocked by the sandbox, so nothing was pushed.

**What changed and why**
- **STORY-157:**
  - The story's description, scope and technical notes now say how a stored picture actually reaches the browser. The page opened is a fixed, short shell. The picture's data is sent in afterwards in 512 KiB pieces, so a large photo no longer hits Chromium's 2 MiB address limit.
  - The notes also record the safeguards on failure:
    - **Bounded error text:** any error is cut to at most 400 characters, with `data:` addresses and long base64 runs removed.
    - **Size ceiling:** pictures over 64 MiB are refused before a browser is leased.
    - **Media type cleaned:** the stored media type is sanitised before it goes into the page.
  - Added to out-of-scope:
    - a general cap on all tool-result text (belongs in another repository);
    - a resize tool, which BUG-80 deliberately does not add;
    - REQ-227;
    - the repair of the broken session.
  - Added the BUG-80 UAT file to the evidence list.
  - The numbers BUG-80 left unstated (400 characters, 120-character base64 runs, 64 MiB, 512 KiB pieces, the media-type fallback) are recorded as Reconciliation Decisions dated 2026-11-09.
- **AC-2485 (one change beyond the plan, which listed no edits to existing ACs):**
  - Its verification step required the picture's data to be inside the navigated address, which is exactly what BUG-80 removes.
  - I reworded it to say the data reaches the browser by a separate channel, not in the address. What it guarantees is unchanged: the browser fetches nothing.
- **Code issue flagged for `fix_uat_coverage`:**
  - BUG-80 says *"Every browser interaction on this path is wrapped."* Two are not: leasing the browser (`screenshot.ts:317`) and taking the final screenshot (`screenshot.ts:345`). A failure there would still reach the model unshortened.
  - AC-2565 states the intended behaviour and includes a case for a failing screenshot. That case will fail until the code is fixed, and none of the existing BUG-80 tests covers it.

```
Upgrade mutations applied for plan item 1 of 8

Target Stories: story-58b2cec4
Primary Story UID: story-58b2cec4
Stories Modified: 1
ACs Modified: 1
ACs Added: 3
ACs Removed: 0

tickets_modified:
  stories:
    - "story-58b2cec4"
  acceptance_criteria:
    modified: ["acceptance_criterion-b6e7c9b7"]
    added: ["acceptance_criterion-4ff0040f", "acceptance_criterion-57778c84", "acceptance_criterion-6c2e9899"]
    removed: []

Progress: 1 of 8 plan items complete
```

The new ACs are AC-2564 (large photo renders through the fixed shell page), AC-2565 (bounded error text with no `data:` address or base64) and AC-2566 (64 MiB ceiling and media-type cleaning). No story was created and no runtime code was changed.