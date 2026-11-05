---
uid: comment-a84d2098
id: COMMENT-7768
type: comment
title: Comment on epic EPIC-9
created_by: xgd
created_at: '2026-11-04T17:17:17.203429+00:00'
updated_at: '2026-11-04T17:17:17.203429+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: epic-ce0874f2
  kind: note
---

From EPIC-31 (operator decision, 2026-11-04): refunds at launch are made from the Shop's own buttons (Cancel, Record return and Refund, in REQ-644), not only in the Stripe dashboard. The EPIC-9 webhooks and Checkout ticket, or a sibling, needs to provide a refund operation on the connected account: any amount up to the refundable remainder, idempotent, and issuing the credit note. Dashboard refunds still arrive by webhook. REQ-643 also relies on Checkout sessions with automatic capture, shipping address collection restricted to one country, a 30-minute expiry, an immediate expire when the buyer returns from Stripe's cancel, and order and invoice metadata.