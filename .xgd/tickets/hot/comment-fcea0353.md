---
uid: comment-fcea0353
id: COMMENT-2302
type: comment
title: Comment on bug BUG-58
created_by: xgd
created_at: '2026-09-06T22:45:24.668455+00:00'
updated_at: '2026-09-07T22:08:21.059407+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-81ab84f9
  kind: chat_transcript
---

<!-- xgd-turn id="d3d9255e-be77-4ee5-bb86-a86ccacc225e-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T22:45:16.633592+00:00" -->
#### You
The test entry boxes in the invite modal extend past the right side of the modal background

<!-- xgd-turn id="d3d9255e-be77-4ee5-bb86-a86ccacc225e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T23:15:54.964177+00:00" -->
#### Claude
Diagnosis is clear. Let me record it on the ticket before touching code.

<!-- xgd-turn id="d4a0bff9-3c83-4720-9733-513f84943a09-user" -->

<!-- xgd-chat role="user" ts="2026-09-07T21:58:15.186143+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="d4a0bff9-3c83-4720-9733-513f84943a09-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-07T22:08:20.334073+00:00" -->
#### Claude
I'll start by reading the ticket to see what's recorded from the prior session.

The ticket body is fully populated from the prior session. Now let me locate the CSS.

Ticket body is complete and the diagnosis holds up against the code. Cutting the branch.

Prior session left work in the worktree. Let me review it.

The CSS fix matches the diagnosis. Now the test file:

Now let me run the test in the worktree.

3 tests in 1.8s — the browser measurement can't have actually run. Let me see the warnings.

The measurement is skipping. Let me find out why the browser won't launch.

Two harness gaps to close: the browser is present but not discoverable, and the injected source CSS loses its font URLs. Let me fix both.

Now the font-URL rebase on the injected stylesheet:

Browser launches now. Let me diagnose the navigation timeout.

Found it — `networkidle` never settles because the chrome pulls two markdown deps from a CDN the sandbox blocks. Switching to a deterministic wait.

Vite rewrites the `import()` inside the evaluated function. Building the importer at runtime keeps it out of the transform.

All three pass. Now the critical check — does the measurement actually catch the bug? Reverting the CSS to confirm RED.

Genuine RED — the measurement reproduces the overflow (Subject's right edge at 1052px vs the panel's 901.5px). Restoring the fix.

The only surviving occurrence is in the explanatory comment. Now the regression scope — the adjacent modal and contacts suites:

Now updating the ticket's Test plan to cover the harness work, preserving the rest of the body:

Now clean up scratch files and commit.

Now merging back into `xgd-working` before marking the ticket.

Version conflict — `xgd-working` advanced to 0.2.128 while I was branched. Merging working into the branch and re-bumping from there.

The merge brought in code needing a generated artifact the worktree lacks. Copying it from the main checkout.

All green after the merge. Fast-forwarding `xgd-working`.

BUG-58 is free-coded and landed on `xgd-working`.

## The fix

Two rules were in direct conflict, and the ticket's diagnosis from the prior session held up exactly against the code:

- `.builder-modal__panel` only takes the 880px copy width when it contains one of the surfaces in its `:has()` list. The invite composer wasn't on it, so the dialog fell to `min(520px, 100vw - 48px)`.
- `.builder-people__compose` then asked for `min-width: min(70ch, 70vw)` — ~590px — and a flex item doesn't shrink below its own `min-width`.

The composer now joins the copy-width list and drops the `min-width`. The width is the panel's to give.

## Evidence

`tests/test_UAT_FC_BUG-58_invite_modal_fits.test.ts` — a structural pair that always runs, plus a real-browser measurement of the actual Contacts panel and invite dialog. **Verified red-then-green**: with the `min-width` restored, Subject's right edge measures 1052px against a panel content edge of 901.5px — the reported symptom to the pixel.

Getting that measurement to actually *run* was most of the work. It was reporting green having measured nothing, and four separate things were in the way:

1. **The browser was present but undiscoverable.** Playwright only launches its pinned build (`1228`); this machine has `1234`. An unqualified launch reports "no browser installed", which is indistinguishable from a machine with none. The suite now falls back to system Chrome, then to whatever the Playwright cache actually holds via `executablePath` (discovered, not hardcoded), then to a deliberately-last `--single-process` attempt for the sandboxed-host case.
2. **`networkidle` never settled** — the builder chrome pulls its markdown renderer from a CDN the sandbox blocks, so navigation expired on a page that had been ready for 29 seconds. Now `load` plus the shell being mounted.
3. **Vite rewrote the `import()`** inside the evaluated function into its SSR loader, which doesn't exist in a browser. Built via `new Function` at runtime instead.
4. **The injected source stylesheet lost its font URLs.** Inlining moves the base URL to the document, so the faces 404'd and fell back — and the label column is `9ch`, so every measurement would have been taken in a typeface the product doesn't ship.

All four are recorded in the ticket body under "What the measurement needed from the harness", so reconciliation doesn't meet them cold.

## Two things worth flagging

- **The version needed re-bumping mid-flight.** `xgd-working` advanced from 0.2.121 to 0.2.128 while I was branched. I merged working into the branch, took the higher version, and re-bumped to 0.2.129 there — so the ticket carries two SHAs: the fix and the bump.
- **The worktree was missing a build artifact.** After merging, `src/generated/auth-passwordless*` (gitignored, arrives from an unrelated in-flight change) had to be copied from the main checkout or the suite couldn't import. Not caused by this work, but it will bite the next branch cut the same way.

Regression scope green: 47 tests across the Contacts tab, contact axes/history, and the three modal suites. Ticket is parked at `free_coded` — promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->