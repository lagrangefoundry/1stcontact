---
uid: request-b3534e71
id: REQ-343
type: request
title: The consultant stops writing L1
created_by: EPIC-20
created_at: '2026-09-27T22:31:31.949374+00:00'
updated_at: '2026-09-27T22:33:39.725320+00:00'
completed_at: null
last_field_updated: epic_children
status: draft
fields:
  epic_parent: epic-0923bb64
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-18898cd8
---

## Why

**DOC-60** §"4. The primary stops writing L1" and §"Why this order, and what gates the
last step". This is the design's end state and its last step.

The measured case for it: across the metered window workers did **27% of the element
writes for 2.9% of the spend**, at **$0.046 per element write against the consultant's
$0.54** — about twelve times cheaper — and every write a worker landed has stayed and
none has been found wrong. The model that is right for judgement is the wrong one for the
mechanical majority of the work, and paying its rate for that majority is the waste
EPIC-20 exists to remove.

## Behaviour

1. **The consultant can read the whole site and write no part of its L1.** It keeps
   every read, every measurement and every camera; it loses the authority to replace an
   element, author a page, write configuration or change the palette.

2. **Construction is commissioned.** The consultant's route to a change in the site is a
   brief to a worker and nothing else.

3. **The delegation rollback still works.** With delegation disabled in configuration the
   surface is not composed at all, so this ticket must not leave a state in which the
   consultant can neither write nor delegate. Turning delegation off must remain a true
   rollback.

## The gate

This ticket is held until the record shows, over **ten consecutive delegations**:

- no delegation returns `silent` while its diff contains writes; and
- no delegation's diff contradicts its own self-report.

Both are facts about recorded runs rather than judgements, so the gate can be checked
rather than argued. Today the first condition fails at **2 of 7** and the second is
unmeasurable, which is the point of the diff.

## Dependencies

All of DOC-60's preceding tickets: the upstream result-accounting ticket, the diff
provider, the worker's context, the builder's grant, and the delegate-first prose. This
is the only ticket in the set that is gated on evidence rather than on code.

## Not in scope

Any change to what a worker may do — that is the grant ticket. Any change to the
delegation configuration switch, which stays exactly as it is because it is the rollback.