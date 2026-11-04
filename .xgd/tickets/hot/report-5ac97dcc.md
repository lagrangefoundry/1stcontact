---
uid: report-5ac97dcc
id: REPORT-10890
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-04T18:04:00.327652+00:00'
updated_at: '2026-11-04T18:04:00.327652+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-5052a63c
  plan_item_index: '7'
---

```
Story #7 created for reconciliation bundle-5052a63c

Story UID: story-219b4217 (STORY-169)
Title: Outgoing message record: every message is kept on the contact, delivery and bounce events land on it, and the Contacts tab shows them
Type: feature
Acceptance Criteria: 18 created (AC-2287 … AC-2304)

Progress: 7 of 8 plan items complete
```

The story is filed under the existing Outgoing Mail capability (CAP-116), next to STORY-168, which covers the mail port and templates this record builds on.

The 18 ACs cover:
- **The record (AC-2287–2292):**
  - the `email` record type and its fields;
  - the record is saved as `queued` before the send is attempted;
  - a successful send becomes `sent`;
  - a failed send becomes `failed` with the reason, and the caller gets it back rather than an error;
  - the stored body is what was actually sent, and later template changes don't alter it;
  - mail goes out only through the sender passed in, so tests can't send real mail.
- **The delivery webhook (AC-2293–2299):**
  - delivered and bounced events update the right record, in whichever business sent it;
  - requests with a missing or bad signature are refused;
  - requests with a timestamp more than five minutes off are refused, so they can't be replayed;
  - with no secret configured, everything is refused;
  - a signed body that isn't valid JSON gets 400;
  - an event for a message we never sent gets 404 and writes nothing;
  - opens, clicks and other events get 200 and change nothing.
- **Access gate (AC-2299):** only a POST to the exact webhook path skips the Access gate; every other route stays behind it.
- **What the operator sees (AC-2300–2304):**
  - the Messages section lists messages newest first, with the reason on failed or bounced rows;
  - a contact with no messages shows "Nothing has been sent to them yet.", and a failed read says so instead;
  - an unknown contact gets an empty list rather than a 404;
  - one business can't see another's messages;
  - contacts with a bounced message are marked "bounced" in the Contacts list.

The code doesn't contradict REQ-198 anywhere. Where REQ-198 says nothing, I made six decisions to match the code and recorded them under Reconciliation Decisions in the story:
- every webhook refusal returns the same `401 Refused.`;
- an event for an unknown message gets 404;
- events other than delivered/bounced are acknowledged and ignored;
- the bounce reason is stored and shown on the row;
- messages are ordered by when they were queued, and an unknown contact gets an empty list;
- a message with an empty subject is still recorded.

Every ticket was written locally, but each write also tried to push to `github.com:22`, and the sandbox blocked that each time. Those commits aren't on the remote yet.