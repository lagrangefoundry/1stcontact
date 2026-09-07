---
uid: bug-81ab84f9
id: BUG-58
type: bug
title: 'Invite modal: composer fields overflow the panel'
created_by: martin-github@westhead.me
created_at: '2026-09-06T22:44:05.075064+00:00'
updated_at: '2026-09-07T22:06:33.630161+00:00'
completed_at: null
last_field_updated: body
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
  The left edge and a width floor are asserted alongside it, because a composer
  collapsed to nothing also fits and is not a fix. A missing browser skips
  loudly rather than quietly.
- **Structural, always runs**: the stylesheet's narrow-panel rule names the
  composer among the surfaces that keep the copy width, and the composer rule
  declares no width of its own, so the day someone re-narrows the panel or
  re-adds the `min-width` this fails rather than the operator finding it.

### What the measurement needed from the harness

The browser half of this exists to be run, not to be skipped — a measurement
that reports green having measured nothing is the failure mode it was written
against. Four things stood between it and a real reading, and each is fixed in
the test file rather than worked around:

- **The browser is found even when Playwright's pinned build is absent.** An
  unqualified `launch()` reports "no browser installed" on a machine that has a
  perfectly good Chromium in a neighbouring build directory, which is
  indistinguishable from a machine with none. The suite now falls back to the
  installed Chrome and then to whatever build the Playwright cache actually
  holds, named through `executablePath` and discovered rather than hardcoded.
  A sandboxed host that refuses Chromium's mach bootstrap check-in gets one
  further, deliberately last, degraded `--single-process` attempt.
- **The page is waited for by condition, not by `networkidle`.** The builder
  chrome pulls its markdown renderer from a CDN, so on a host with no route out
  the network never goes idle and the navigation expires on a page that has
  been ready for most of the timeout. The wait is `load` plus the shell being
  mounted, which is the condition the measurement actually needs.
- **The dynamic import into the browser is built at runtime.** The evaluated
  function's source is compiled by vite on the way in, and a literal `import()`
  in it is rewritten to vite's SSR loader, which does not exist in a browser.
- **The injected source stylesheet keeps its font URLs.** The built copy the
  origin serves is dropped rather than layered over — the stale narrow rule
  matches the dialog and would simply win on order — and the source file is
  injected inline in its place. Inlining moves the base URL to the document, so
  its relative `url('./fonts/…')` are rebased to the path the origin serves
  them at. Without that the faces 404 and fall back, and the label column is
  `9ch`, so every measurement would be taken in a typeface the product does not
  ship. No rule is otherwise touched.

Regression scope run green: the Contacts tab, contact axes and history suites,
and the modal suites (`req117-modal-dismiss`, `req121-copy-modal-elegance`,
`reconciliation-copy-edit-gesture-modal`) — 47 tests.

The fix was verified red-then-green: with the `min-width` restored the browser
measurement fails with Subject's right edge at 1052px against a panel content
edge of 901.5px, which is the reported symptom to the pixel.
