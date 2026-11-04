---
uid: report-bab43851
id: REPORT-10872
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-04T17:22:13.326750+00:00'
updated_at: '2026-11-04T17:22:13.326750+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-5052a63c
  plan_item_index: '5'
---

```
Story #5 created for reconciliation bundle-5052a63c

Story UID: story-4630e921 (STORY-167)
Title: Contact history: an immutable record of what happened to each contact, shown on the Contacts tab
Type: feature
Acceptance Criteria: 17 created (AC-2258 – AC-2274)

Progress: 5 of 8 plan items complete
```

The story sits under capability-e5939ceb, alongside the other Contacts stories (STORY-163/164). It's worth 3 points and depends on plan item 4.

**What the ACs cover:**
- **The event record:**
  - Edits to a recorded event are refused, and events have no status field.
  - A delivery outcome that changes adds a new event under the same message ref; it never overwrites the old one.
  - Deleting a contact deletes their events and no one else's.
- **Reading history:** events come back as one list, newest first by when they happened, with sent and received mail mixed together. Ties keep a stable order and the list stops at 100. Each event keeps both when it happened and when it was recorded. Event kinds the app has never seen are still stored and returned exactly as written.
- **Origin:** a contact's origin is their earliest event, even when that event is past the 100-event cut-off. A contact who came in twice keeps both events. A contact with no events has no origin.
- **What records events today:**
  - A first invite records `contact.created` (via invite) plus `contact.invited`, and each later invite adds another `contact.invited`.
  - Accepting the terms records `member.signed_up` with the terms version.
  - A seeded platform operator gets `contact.created` (via platform_admins) exactly once.
- **Business separation and API:** each event belongs to the contact's own business. Another business reading the history sees nothing. Another business trying to write an event gets the same "no such contact" error as an unknown ID. The contact detail response includes the history and origin, and returns not-found when the contact belongs to another business.
- **History section on the Contacts tab:** labelled rows, with unknown kinds shown as their raw dotted name. The "recorded" time only appears when it differs from when the event happened. There's an "Origin:" line, the empty state reads "Nothing recorded yet.", and the section is read-only and fully styled.

**Decisions I recorded under Reconciliation Decisions:**
- REQ-195's original acceptance list says events are never deleted. Its later "What was built" section changes that: edits stay forbidden, but deletion is allowed so erasing a contact also erases their events. I treated that later section as the intended rule, not a conflict with the code.
- The original ticket also said only email would record events. The later section adds three other actions that record events, so those are written up as ACs.
- The ticket doesn't specify how the History section should look, so the details as built are now ACs.

**Needs a test:** AC-2260 (erasing a contact also erases their events) has no UAT in the REQ-195 test files, so the coverage step will need to write one.

The `xgd ticket` writes kept hitting a blocked SSH connection to `github.com`, probably an attempted push. Every create and update still reported success.