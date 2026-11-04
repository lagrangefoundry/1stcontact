---
uid: acceptance_criterion-132d09fb
id: AC-2301
type: acceptance_criterion
title: The Contacts detail pane's Messages section lists the contact's messages newest
  first, showing subject, when queued and status, with the reason on failed or bounced
  rows
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:33.883999+00:00'
updated_at: '2026-11-04T18:03:33.883999+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
Opening a contact in the Contacts tab shows a **Messages** section listing every message recorded for that contact in the current business, ordered by queued time with the most recent first. Each row shows:
- the subject, or "(no subject)" when the subject is empty;
- when it was queued, shortened from the stored timestamp and never reformatted into another value;
- its status, as one of the five status words, also carried as a data attribute on the row's status element.

A row whose message carries a failure reason (a failed send or a bounce) also shows that reason. The per-contact messages read returns the same list, newest first, each item carrying subject, queued time, status and failure.

## Verification
Seed a contact with three messages at different queued times: one `sent`, one `failed` with a reason, one `bounced` with a reason. Open the contact's detail pane. Assert the Messages section lists three rows in descending queued order, with each row's subject, shortened time and status, and the reason text on the failed and bounced rows only. Call the messages read for that contact and assert the same order and fields.
