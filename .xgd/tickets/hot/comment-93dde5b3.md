---
uid: comment-93dde5b3
id: COMMENT-3008
type: comment
title: Comment on request REQ-250
created_by: xgd
created_at: '2026-09-16T00:24:29.270418+00:00'
updated_at: '2026-09-16T00:38:33.329764+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-4b60eae1
  kind: chat_transcript
---

<!-- xgd-turn id="cd9c28d7-004a-4c98-8a1e-3ddc5fde09b7-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T00:23:58.434574+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="cd9c28d7-004a-4c98-8a1e-3ddc5fde09b7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T00:38:33.270414+00:00" -->
#### Claude
I'll start by reading the ticket to understand what's being asked.

The ticket is detailed and I have the full picture. Let me confirm the key facts I found, then proceed — no blocking questions.

Good — REQ-249's hostname section is present in the branch. Now the `api.js` change so the refusal survives the throw:

Now the modal module:

Now `reveal()` on the hostname section:

Now the branch in `app.js`:

Now the CSS for the dialog body:

Now the UATs. Let me check how the settings transport is injected in the existing surface test so the mounted builder can reach the hostname section:

Now the UAT file:

Now the server-side scope (the router constant change) and a typecheck:

Now updating the ticket body while that runs — adding the language for behaviour I introduced as a technical consequence:

The insert landed between `lockedPublish`'s doc comment and its declaration. Fixing:

Both failures are pre-existing on `xgd-working` — unrelated to this change. Committing:

Now lock, merge back, and record the commit:

The tip is a ticket auto-commit, which defeats the gate's merge-aware path. Re-bumping and landing it as the merge tip:

Done. REQ-250 is at `free_coded` with both commits recorded.

## What landed

**The refusal is now a dialog with a route out of it.** `POST /api/publish`'s 409 for a site with no public address used to reach `block.fail(message)` — the same grey line where *"the ladder was larger than one request"* goes. It now opens a dialog in the shared `modal.js` shell:

> **Your site needs an address before it can go live.**
> There is nowhere for anyone to type yet. Choose your free web address, or connect a domain you already own — either one is enough.
> `[ Not now ]` `[ Choose my web address ]`

`Choose my web address` selects the Settings tab *and* reveals REQ-249's hostname section with its box focused — either half alone is half a route. `Not now` leaves the builder exactly as it was, Publish still pressable.

**Telling it from every other publish failure.** `streamPublish` threw away everything but `parsed.error`, so a missing address and an invalid draft arrived the same shape. It now carries the `code` and the HTTP `status` through the throw, and `app.js` branches on the code — not the prose (a second copy of a rule the Worker already applied, and it breaks when someone improves the sentence) and not a bare 409 (a shape a second refusal on this route could share). Everything else still reaches `block.fail` unchanged; this is one added branch.

**Nothing is checked in the client.** Publish is always pressable, the post always happens, the dialog is a rendering of the answer. A static UAT scans the builder source to prove there is no address check to disagree with the gate.

**Files:** `publish-address.js` (new — the copy and the dialog), `api.js`, `app.js`, `hostname.js` (`reveal()`), `builder.css`, `router.ts` + `errors.ts` (the code as an exported constant rather than two literals).

## Tests

12 new UATs in `tests/test_UAT_FC_REQ-250_publish_needs_an_address.test.ts`, all passing. Full suite: **4272 passed, 2 failed** — `bug32-webui-scope-rebrand` and `BUG-67 backend_settings`, both of which fail identically on `xgd-working` before this change. Pre-existing and unrelated.

## One thing worth flagging

`xgd ticket move-to-free-coded` rejected the first attempt: its merge-aware version check only fires when the tip of `xgd-working` *is* the merge commit. I'd run `xgd ticket update --fields story_points` after merging, and that auto-commit sat on top of the merge with a single parent, so the check fell through to the naive path and read the bump as someone else's. I worked around it by bumping again on the branch and landing that as the merge tip — hence two SHAs on the ticket. Worth knowing: **record the ticket fields before merging, or run `move-to-free-coded` immediately after the merge and before any other ticket write.**

<!-- xgd-chat-end -->