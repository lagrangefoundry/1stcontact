---
uid: comment-2e8da8c2
id: COMMENT-886
type: comment
title: Comment on request REQ-128
created_by: xgd
created_at: '2026-08-09T19:38:59.300517+00:00'
updated_at: '2026-08-09T19:55:11.720416+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-de67e1a1
  kind: chat_transcript
---

<!-- xgd-turn id="e0057106-2c91-404a-9cdf-ea72263ee9cc-user" -->

<!-- xgd-chat role="user" ts="2026-08-09T19:38:54.989810+00:00" -->
#### You
Please free code this cicket

<!-- xgd-turn id="e0057106-2c91-404a-9cdf-ea72263ee9cc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-09T19:55:11.579059+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Ticket is fully scoped with 7 ACs. Let me explore REQ-118's implementation to mirror it.

Client needs no change — the modal is field-count driven. The change is in the derivation. Let me cut a branch.

Now the implementation. First the derivation:

Now the `copyFieldsOf` branch:

Now the write side:

Now `segmentOptions` in the CLI:

Now the UAT suite. Let me write `tests/req128-background-image-selection.test.ts`:

All 10 pass. Let me verify the suite actually discriminates — it must fail without the implementation:

9/10 fail without the change (the pass is AC-7, the "nothing changed here" contrast — correct). Now the regression scope:

Confirmed pre-existing (identical 3 failures on a clean tree). Now typecheck and lint:

Typecheck clean. Now the full suite in the background while I update the ticket:

Now let me update the ticket body while the suite runs:

While the suite runs, let me check interim progress:

Waiting on the full suite. Let me verify the final diff shape in the meantime:

4 failing files, none mine. I already confirmed one is pre-existing — let me baseline the other three on a clean tree:

All 14 failures are pre-existing (identical baseline on a clean tree). Now bump version and commit:

Now update the ticket body, preserving the existing scope and recording what was actually built:

Ticket is at `free_coded` (story_points already 2). Now merge back:

REQ-128 free-coded and merged to `xgd-working`. Status `free_coded`, commit `2e3f0b7c2`, version `0.1.31`.

## What was built

A painted `box`/`container` carrying `backgroundImageUrl` now exposes a picker of the site's images — the same control REQ-118 built for `image.src`, over the same asset listing, through the same `copy get`/`copy set` surface.

The whole change is in the **derivation**, which is what makes "no second mechanism" structural rather than asserted:

- `packages/site-schema/src/l1/edit.ts:218` — `backgroundHandleOf()` gates on kind + non-empty value; `copyFieldsOf` returns one `required` enum field; `applyCopyFields` assigns into the **existing** `axes` object so no other axis moves.
- `tools/generate/src/cli/edit.ts:377` — `segmentOptions` supplies the listing for `{image, box, container}` instead of `image` alone.
- `tools/generate/src/cli/ai/l1-surface.json` — three declaration strings corrected so the AI surface's documentation stays true (including the appearance-absence, which now carves out the background handle and states that *adding* one is still impossible).

No client and no renderer change: `editor.js` already branches on field count, and `segmentKind` already stamps `container` for any box that paints.

## Verification

10 UATs, one per AC plus three origin re-checks, all passing. **Discrimination checked, not assumed** — with the source changes stashed, 9 of 10 fail; the one that still passes is AC-7, which asserts the behaviour that didn't change.

Full suite: `1364 tests — 14 failed, 1283 passed, 67 skipped`. All 14 failures are **pre-existing** — verified by re-running the four failing files on a stashed tree and getting an identical baseline (3+1+2+8 across `reconciliation-copy-edit-gesture`, `req115-builder-composition`, `req117-edit-loop-browser`, `test_UAT_FC_REQ-122_chat_host`). `pnpm -r typecheck` clean.

One correction worth flagging: the ticket predicted a pre-existing failure at `reconciliation-edit-render-channel.test.ts:316`. That file **passes** on this tree — the four above are the real baseline. I recorded that in the ticket body.

The ticket is parked at `free_coded`; promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->