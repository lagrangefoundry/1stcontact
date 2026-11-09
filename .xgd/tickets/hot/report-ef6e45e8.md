---
uid: report-ef6e45e8
id: REPORT-11640
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-09T00:59:12.526963+00:00'
updated_at: '2026-11-09T00:59:12.526963+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-7ba3af93
  plan_item_index: '8'
---

Plan item 8 is done. Both target stories and the four planned ACs now describe what the code does. On every point, REQ-223's own text, the code and the plan agreed, so the first rung of the ladder (ticket body, matrix and code) settled each one and I didn't need the transcripts. No new stories were created, no ACs were added or retired, and no runtime code was touched.

- **STORY-169 (outgoing message record):** the story now treats `complained` as a message status of its own, and never another name for `bounced` (REQ-223 §5). The signed webhook maps `email.complained` onto it, and the store's status list is the same single list the code uses. I set `story_kind` to `upgrade` and updated the title.
  - AC-2293 adds a verified complaint moving the record to `complained`, checked through the real signed webhook.
  - AC-2299 now names three handled event types; opens, clicks and `email.sent` are still acknowledged with 200 and ignored.
  - AC-2287 adds `complained` to the status list and requires that every status the code writes is accepted by the store.
- **STORY-95 (serving a published site):** the read-only rule now has one declared exception, `POST` to `/api/lead` or `/site/<siteKey>/api/lead` (REQ-223 §3.1 and §8.13). AC-912 covers it. Every other method, and `POST` to any other path, still gets 405 with `allow: GET, HEAD`. So does an apex `POST /api/lead` when the deployment has no apex site.

**Decisions I made where the intent says nothing** (each recorded under Reconciliation Decisions):
- A complaint stores no failure reason, because the code only reads a reason from the provider's bounce data.
- The Contacts list gets no `complained` marker; the bounced marker (AC-2304) stays bounce-only.
- The 405 still lists only GET and HEAD as allowed.
- `GET` on `/api/lead` gets no special handling.

**Code problem flagged, not fixed:** an existing note says a late `delivered` event can overwrite `bounced`. The same bug can overwrite `complained`. That would let a complained address be mailed again, breaking REQ-223's rule never to mail an address that complained. No AC accepts this behaviour, so it is left for a follow-up fix.

```
Upgrade mutations applied for plan item 8 of 8

Target Stories: story-219b4217, story-d34eccd8
Primary Story UID: story-219b4217
Stories Modified: 2
ACs Modified: 4
ACs Added: 0
ACs Removed: 0

tickets_modified:
  stories:
    - "story-219b4217"
    - "story-d34eccd8"
  acceptance_criteria:
    modified: ["acceptance_criterion-7d56c5fb", "acceptance_criterion-0d7c7f71", "acceptance_criterion-6cd3c79e", "acceptance_criterion-8140f45e"]
    added: []
    removed: []

Progress: 8 of 8 plan items complete
```