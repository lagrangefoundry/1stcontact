---
uid: comment-b26f984b
id: COMMENT-8151
type: comment
title: Comment on bug BUG-412
created_by: xgd
created_at: '2026-11-09T20:29:27.326469+00:00'
updated_at: '2026-11-09T20:29:27.326469+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-1c0aef3f
  kind: note
---

## Closed as a duplicate of BUG-410 (2026-11-09)

Every problem here (1–9) is covered by **BUG-410**, "Purchase pages: consultant builds start from the defaults, and the defaults are complete enough to need no help", filed from the same review of the same rebuild. BUG-410 also fixes the root cause: the consultant composes these pages from a field list instead of starting from the platform's defaults.

- 1, 2, 4, 5 and 7 (price and total placement and labels, photo, prompt, held space, order-number label): BUG-410 §B–D. The checkout's top half becomes the same labelled order-summary block as the order page, above the region selector.
- 3 (terms line font and place): BUG-410 §C.6. Directly under the payment form, in the site's small type, and placeable by the page.
- 6 (line photo size, overflow): BUG-410 §B. 72px square thumbnails; nothing wider than the screen.
- 8 (Return to checkout): BUG-410 §E.
- 9 (inset slot): BUG-410 §G.

The tickets this one already deferred to (BUG-408, BUG-373, BUG-409) are unaffected.
