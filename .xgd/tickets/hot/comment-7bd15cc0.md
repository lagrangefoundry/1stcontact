---
uid: comment-7bd15cc0
id: COMMENT-891
type: comment
title: Comment on bug BUG-33
created_by: xgd
created_at: '2026-08-10T07:24:15.026379+00:00'
updated_at: '2026-08-10T07:34:45.699588+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-ede1fb8c
  kind: chat_transcript
---

<!-- xgd-turn id="9b2b4a26-b298-4171-b57e-4f8b5e2fefaa-user" -->

<!-- xgd-chat role="user" ts="2026-08-10T07:24:10.706954+00:00" -->
#### You
Can you free code a fix for this?

<!-- xgd-turn id="9b2b4a26-b298-4171-b57e-4f8b5e2fefaa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-10T07:34:45.563209+00:00" -->
#### Claude
I'll cut a branch for this, then diagnose.

Only the REQ-115 failure remains — the five modal failures have since been fixed upstream. Let me look at the test.

Confirmed the diagnosis, and found *why* the second assertion passes by luck: `setMode` emits `src` (updating the soon-to-be-detached anchor) *before* emitting `mode` (which rebuilds it), so the stale handle is frozen at the previous mode's href. Now let me fix the test.

Both suites green (14/14 — the five modal tests ran and pass; they were fixed by intervening work). Now a wider regression scope over the builder area:

Four failures in *other* files (untouched by my edit) — let me see them all and confirm they're pre-existing.

`req115-builder-shell` passed in isolation — that was a load-induced flake. Three real failures remain in `reconciliation-copy-edit-gesture.test.ts` (Playwright, `.fields-value` click timing out). These are outside the ticket's named set, but let me spend a moment seeing whether they're the same class of defect.

`.fields-value` is the *view* that becomes a control on click — and `openLoneControl` now auto-opens it for one-field forms, so the view element is already gone when the test clicks it. Same class of defect as the REQ-115 one: a test gesture gone stale against a product change. Let me confirm the timeline.

Confirmed: tests generated Aug 6; `openLoneControl` landed Aug 7 and auto-opens the single field, so `.fields-value` is gone before the test clicks it. Same defect class, same feature area — I'll fix these too. Let me see all the call sites.

All four are the same redundant gesture. The fix is to drop the now-obsolete click and let the control that `openLoneControl` already opened receive the text.

Now a comment at the first site recording *why* the gesture is gone:

Three gesture failures fixed. One different failure surfaced in a test I hadn't run before — let me check whether it's mine or pre-existing.

Both were red before; my change fixed one. The remaining one is a separate pre-existing defect — let me look.

Same root cause a third time: `openLoneControl` turns the value into a control, and `textContent` can't see an input's value. The assertion's intent — "the full string is legible in the form" — still holds; it just has to read the control.

All 59 green. Now the wider builder scope to confirm nothing adjacent broke:

All green across the builder area. Now version bump and commit.

Now update the ticket body to reflect what actually landed, preserving the existing diagnosis:

Done. BUG-33 is at `free_coded`, commit `af78081b6` fast-forwarded onto `xgd-working`.

## What I found

The ticket's REQ-115 diagnosis was correct, but the failure set had shifted. **The five `reconciliation-copy-edit-gesture-modal` tests were already green** — fixed by intervening work, not by me. In their place, four *other* red assertions in the same feature area turned out to be the **same defect class**, so I fixed those too rather than leave the area red:

> The test holds something the product has since replaced, and asserts against the detached survivor rather than what an operator touches.

Two mechanisms:

1. **Rebuilt anchor** (REQ-115, as diagnosed). One detail worth adding: the `setMode('edit')` step was passing *by luck* — `panel.setMode` emits `src` **before** it emits `mode`, so the doomed anchor gets one last sync before `render()` replaces it. `setSite` rebuilds it again and the captured handle is frozen at the previous mode's href.

2. **Auto-opened control** (the other five). `openLoneControl` in `editor.js:350` opens a one-field form straight into its control, so the `.fields-value` *view* the tests clicked no longer exists — `locator.click` timed out at 30s each. It landed in `86dce8ffe` on 2026-08-07, one day *after* these UATs were generated in `3516bca3e` on 2026-08-06. That same change is also why the value is no longer in the modal's `textContent`: it's an input's `value`.

## What changed

Test-side only — **no product code**. In every case the live control was already correct, matching the ticket's original conclusion. No assertion was weakened; each now exercises the control an operator actually touches, which is strictly closer to the behaviour under test.

## Verification

- Named suites + the four newly-found ones + surrounding copy-edit: **7 files, 59 tests passed**
- Wider builder regression (workspace chrome/mounted/origin, REQ-115 shell, viewport fill, gradient/chat/session panels): **8 files, 51 passed, 2 skipped**

Two things to flag:

- `req115-builder-shell.test.ts` timed out once in a 13-file parallel run and passed in isolation and in the 8-file run. That's a **load-induced flake**, not a defect — I didn't address it, and it's noted in the ticket.
- The five modal tests the ticket named are green, but I did not fix them and can't tell you which commit did without further digging.

Ticket body records the full picture including the corrected scope. Left at `free_coded` — promotion to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->