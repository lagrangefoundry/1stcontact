---
uid: comment-54e96abd
id: COMMENT-7790
type: comment
title: Comment on request REQ-643
created_by: REQ-647
created_at: '2026-11-04T20:52:39.015446+00:00'
updated_at: '2026-11-04T20:52:39.015446+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-d78b1f29
  kind: note
---

## Requirement handed over from REQ-647 (item 3): Buy re-checks the item on the server

REQ-647 made shop photos static renditions on the published site. A published page can therefore be older than the inventory behind it. When this ticket builds the Buy endpoint, it must:

- Re-check the item on the server at the moment of Buy: it is live, it is available, and its price is the current one. Never trust the price or availability the page sent.
- On a stale page (item unavailable, unpublished, or repriced), refuse the checkout and send the visitor to the enquiry path, which is what the catalog shows today where Buy will go (`catalogRecord`, `items.ts`).

UAT, to land with the endpoint: Buy on an item made unavailable after publish is refused with the enquiry path. A second case should cover a price changed after publish.

Today no catalog checkout endpoint exists: `createCheckoutSession` (`payments.ts`) only handles invoices. That's why REQ-647 left this unbuilt.
