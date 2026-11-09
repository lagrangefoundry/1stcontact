---
uid: report-905aef30
id: REPORT-12051
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-09T22:52:51.441136+00:00'
updated_at: '2026-11-09T22:52:51.441136+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-374f88d6
  plan_item_index: '3'
---

I've updated STORY-85 to match the BUG-76 change for plan item 3. No new story was created, no runtime code changed, and no UATs were written.

Each creation logged a blocked outbound connection to github.com:22. The tickets were created locally, but if xgd syncs the ticket store over that connection, the sync may not have happened.

**What changed:**
- **Story (STORY-85):** The story now describes account-chrome at contract version 2:
  - a `labelMode` setting that decides where the email prompt shows;
  - the field's label declared as a `label` element;
  - a single declared sentence on the invariant label saying it is hidden, which every reference document repeats;
  - required `sent` and `error` slots in place of the old message setting;
  - an overlay that shows one of three parts: the form, the sent card or the error card.

  It also covers three validation changes. Unknown config keys and slot names are now refused when an instance is written. A schema error inside a behavior slot now reports the same precise location as the same error in the page tree. A refused write now lists all its errors. The story's scope, version history and technical notes are updated to match.
- **AC-2331:** now says account-chrome is `account-chrome@2`, has no sent-message setting, needs six slots (adding `sent` and `error`), and that the default preset supplies all six.
- **AC-2330:** now says a completed request, whatever its HTTP status, hides the form and shows the author's `sent` card; a network failure shows the `error` card and leaves the form usable. The working no-script form and the rule that the response is never read are unchanged.
- **AC-2573 (new):** `labelMode` gives the email field a visible prompt. The label is always present but hidden. The reference documents say it can't be styled from the page and describe it truthfully.
- **AC-2574 (new):** An unknown config key or slot name is refused when written, naming the key and the allowed set. A site already stored with such a key still renders.
- **AC-2575 (new):** An error inside a behavior slot reports the same path and key as in the page tree. An unknown node kind lists the valid kinds. All errors are reported in one refusal.

**Decisions I recorded on the story:**
- **AC-2331 and AC-2330 were rewritten, not retired.** BUG-76 explicitly replaces part of each, but most of each still holds. The ticket's own decision section settles every point, so I didn't need to check older conversations.
- **The error list is capped at 10.** BUG-76 says "every error". The code stops at 10 and says how many more there were. The ticket doesn't mention a cap, so AC-2575 states the cap and treats it as a deliberate choice, not a defect.
- **The slot error fix stays on this story.** It lives in shared schema code, but the problem BUG-76 describes is specific to behavior slots. STORY-83's criteria are untouched.
- **No criterion for the sign-in address note.** BUG-76 says the note about `POST /sign-in` is documentation only and gets no test, so it is recorded in the story's technical notes.

```
Upgrade mutations applied for plan item 3 of 8

Target Stories: story-179b8c06
Primary Story UID: story-179b8c06
Stories Modified: 1
ACs Modified: 2
ACs Added: 3
ACs Removed: 0

tickets_modified:
  stories:
    - "story-179b8c06"
  acceptance_criteria:
    modified: ["acceptance_criterion-2996decb", "acceptance_criterion-42cb53a1"]
    added: ["acceptance_criterion-9f74c90f", "acceptance_criterion-69a7cff0", "acceptance_criterion-9b6c72f3"]
    removed: []

Progress: 3 of 8 plan items complete
```