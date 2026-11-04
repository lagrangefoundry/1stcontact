---
uid: acceptance_criterion-990f178f
id: AC-2304
type: acceptance_criterion
title: A contact holding a bounced message carries a 'bounced' marker in the Contacts
  list, and the people list read reports those contacts
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:36.116437+00:00'
updated_at: '2026-11-04T18:14:34.045180+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
The people list read for a business returns, alongside the people, a `bounced` array of the ids of contacts in that business who hold at least one message with status `bounced`. Each id appears once. The array is empty when there are none. In the Contacts list, each such contact's row shows a "bounced" marker and other rows do not. After switching to a different business, the previous business's bounced markers are no longer shown.

## Verification
Seed a business with contact X holding a bounced message (plus a delivered one) and contact Y holding only delivered messages. Read the people list and assert `bounced` equals [X]. Render the Contacts list and assert X's row has the "bounced" marker and Y's does not. Switch to a business with no bounces and assert no row carries the marker.