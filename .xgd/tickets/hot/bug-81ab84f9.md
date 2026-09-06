---
uid: bug-81ab84f9
id: BUG-58
type: bug
title: 'Invite modal: composer fields overflow the panel'
created_by: martin-github@westhead.me
created_at: '2026-09-06T22:44:05.075064+00:00'
updated_at: '2026-09-06T22:49:02.637461+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-fcea0353
  severity: medium
---

## Symptom

Open the Contacts tab, tick a contact, press **Invite**. The Subject, To-List and
Body boxes are drawn wider than the modal panel behind them — they run past the
right edge of the dialog's background and sit on the page's backdrop.

## Root cause

Two rules that were written independently and are in direct conflict.

`.builder-modal__panel` is 880px wide *only* when the dialog contains one of the
three copy-sized surfaces named in its `:has()` list (`__box`, `__picker`,
`__reader`). The invite composer is none of those, so the panel falls to the
message-modal width — `min(520px, 100vw - 48px)`, i.e. about 476px of content
inside its 22px padding.

`.builder-people__compose` then declares `min-width: min(70ch, 70vw)`. `.shell`
sets no font-size, so `ch` resolves against the inherited ~16px and 70ch is
roughly 590px. A flex item does not shrink below its own `min-width`, so the
composer is laid out ~115px wider than the panel it sits in, and every field in
it — all `flex: 1 1 auto` — ends at the composer's right edge rather than the
panel's.

The `min-width` was reaching for the right thing (a composer needs a real
measure) and reaching for it in the one place that cannot deliver it: a child
cannot widen a panel whose width is already fixed, it can only overflow it.

## Fix

Say what the composer *is* instead, and let the panel size to it. A message with
a subject line and a twelve-row body is copy in exactly the sense the 880px
branch was written for, so `.builder-people__compose` joins `__box`, `__picker`
and `__reader` in the panel's `:has()` list. The composer then stretches to the
panel's content width as an ordinary flex child, and the `min-width` that was
forcing the overflow is deleted — with it gone there is no width the composer
can assert that the panel does not already have.

This also fixes the narrow-window case the old rule got wrong in the other
direction: below ~306px of viewport, `70vw` still exceeded the panel's
`100vw - 92px` of content, so the boxes overflowed there too.

Nothing else about the dialog changes: same fields, same order, same labels.

## Test plan

`tests/test_UAT_FC_BUG-58_invite_modal_fits.test.ts`

- **Measured in a real browser** (playwright against the local builder origin,
  the pattern `req117-builder-viewport-fill.test.ts` established, because jsdom
  lays nothing out and every `getBoundingClientRect()` there is zero): mount the
  real Contacts panel, open the real invite dialog, and assert that the right
  edge of each of Subject, To-List and Body is inside the panel's right edge —
  at 1280px, and again at a narrow viewport where the panel is viewport-bound.
  A missing browser skips loudly rather than quietly.
- **Structural, always runs**: the stylesheet's narrow-panel rule names the
  composer among the surfaces that keep the copy width, so the day someone
  re-narrows the panel this fails rather than the operator finding it.
