---
uid: report-dd466dac
id: REPORT-7818
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-01T19:33:56.114387+00:00'
updated_at: '2026-11-01T19:33:56.114387+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-39edf66d
  plan_item_index: '4'
---

```
Story #4 created for reconciliation bundle-39edf66d

Story UID: story-a55c2f35
Title: Contacts tab — editing a contact's grants and record
Type: feature
Acceptance Criteria: 15 created

Progress: 4 of 8 plan items complete
```

The story is STORY-164, under capability `capability-e5939ceb`. It depends on story-0034d937, the read side of the Contacts tab from plan item 3. Its ACs are AC-2188 to AC-2202 and cover:

- **Who they are (AC-2188 to AC-2191):** only Email and Name can be edited; the eight observed fields are locked. A confirmed edit sends just that one field, and the pane then shows the value the server stored. A malformed email is refused in the panel before anything is sent, and a server rejection rolls the cell back and shows the message.
- **Record write (AC-2192 to AC-2197):** an owner can correct a contact's email and name, and email is casefolded. Fields left out of a request stay as they were, and observed fields sent in a request are ignored. A malformed email gets 400, and a duplicate address within the same business gets 400. The same address in another business is accepted. An unknown id and an id from another business get the same 404. A caller who doesn't own the business gets 403.
- **Grants (AC-2198, AC-2199):** opening a grant requires a business and a plan. Withdrawing marks the grant revoked, keeps the row, and stops it conferring access.
- **Login status (AC-2201):** suspending a person stops them signing in and restoring lets them back in. The server keeps this, but the panel has no control for it.
- **Provision a business (AC-2202):** the control appears only for callers who may fulfil, and it submits the contact's own address.

**Where the code doesn't match the intent.** These ACs follow the intent, so they will fail against the current code. Both are flagged as code-issues in the story's Reconciliation Decisions for the fix step to correct:

1. **AC-2200 (missing owner check):** opening a grant, withdrawing one, and changing a person's login status don't check whether the caller owns the business. Any signed-in caller can open or revoke any grant by id, or suspend a person. That goes against REQ-170's "the gate that matters is at the API" and REQ-180's rule against a customer-reachable route that hands out live grants. The AC requires a 403 for non-owners.
2. **AC-2198, AC-2199 (wrong error code):** a refused grant, either one that names no business or plan or a withdraw of an unknown id, comes back as a generic 500. The ACs pin a 400 with the message, matching the convention the record and invite routes already follow.
