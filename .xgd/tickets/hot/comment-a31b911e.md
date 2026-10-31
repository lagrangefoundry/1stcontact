---
uid: comment-a31b911e
id: COMMENT-5826
type: comment
title: Comment on bug BUG-314
created_by: xgd
created_at: '2026-10-29T16:52:07.485771+00:00'
updated_at: '2026-10-29T18:31:08.496354+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-09ad5b3b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "3ef30b8e-a0e0-47b0-addc-bae5407b06f1",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-29T16:52:02Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-29T16:52:02Z" -->
#### You
The Operator Console is not working in production: a banner tells me to sign in again, and Sign in again returns me to the builder.

<!-- xgd-chat role="assistant" ts="2026-10-29T16:52:02Z" -->
#### Claude
The console page is admitted by the app session, but its data is /api/admin/*, behind Access; with no Access cookie the edge refuses and the client reads it as session ended. Workaround: visit /sign-in/access once.

<!-- xgd-chat role="user" ts="2026-10-29T16:52:02Z" -->
#### You
Yes, that worked - can you create the bug for me please?

<!-- xgd-turn id="c76f7117-ffcc-4836-86aa-74c8ba365739-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T18:19:03.502822+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="c76f7117-ffcc-4836-86aa-74c8ba365739-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T18:31:05.556156+00:00" -->
#### Claude
Reading the sign-in and builder-session code now to see how the console decides "session ended".

Found the single fetch wrapper (`api.js` `send`) and the one banner subscriber (`app.js`). Checking how the console is opened and how `/sign-in/access` handles `return`.

Writing the changes now: server `return` check first.

Now the server edit.

Server side done. Now the client: session.js gets the new "operator sign-in" reason.

Now `api.js` `send`: detect the Access refusal on admin paths.

Client wiring is in; moving the console auto-open to the end of `mountBuilder` so it opens over a fully drawn builder.

Tests next: a real `bin/access-sim` in front of a stub builder, driving the real `api.js`. Checking how BUG-52 mounts the builder so I can reuse it for the banner check.

Now the test file.

Tests discriminate (3 of 4 fail without the fix; the 4th is the guard for today's expired-session behaviour). Now the server-side `return` test, reusing the REQ-475 workers suite's helpers.

Server side passes. Running the neighbouring suites (BUG-52, console, builder shell, access-sim) plus typecheck/lint.

Those four fail identically without my change (pre-existing). Typecheck and lint next.

Typecheck clean. Checking this project's version-bump convention before committing.

Now updating the ticket body (preserving the original text) before committing.

Ticket updated. Committing on the branch, then merging back per the ordering that works for this project's version gate.

Lock held. Following the memory's ordering: merge working into the branch, bump the version on the branch, then fast-forward working.

Fast-forward landed. The printed rematerialize script path doesn't exist, so I'm running the CLI form instead.

BUG-314 is at `free_coded` with both commits and version 0.2.700 recorded. Tearing down the branch.

BUG-314 is fixed on `xgd-working` and the ticket is at `free_coded`. It isn't deployed, so production still behaves as before until the next deploy.

**What now happens:**
- **Access refusal:** with your app session but no Access cookie, the console's banner says "The Operator Console needs your operator sign-in." Its **Operator sign-in** button goes through `/sign-in/access`. After the PIN exchange you land back in the builder with the console already open.
- **Expired session:** if your app session has ended, you still get today's **Sign in again**. If the session ends while the operator banner is showing, "Sign in again" replaces it, since that button recovers both.

**How it works:**
- **Spotting the refusal** (`builder/api.js`): console calls to `/api/admin/*` no longer follow redirects. Our Worker never redirects those routes, so a redirect or 401 there must come from the Access edge.
- **Telling the two cases apart:** after such a refusal, the client asks `/api/businesses`, which only the app session guards. A 401 there means your session has ended; any other answer means only the operator sign-in is missing. There's no new endpoint.
- **Landing back** (`sign-in.ts`): `/sign-in/access` now honours `?return=`, but only to a builder page on the same host (`/` or `/b/<id>/`). Anything else lands on `/`, including another host, `//host`, `/\host`, an API or sign-in path, or `javascript:`. REQ-482 has no such check yet, so this is the one it can reuse.
- **Reopening the console:** the return address ends in `#console`. The builder reads that once, clears it, and opens the console if your session owns the platform business.

**Tests:** all five new tests pass.
- Four are in `tests/test_UAT_FC_BUG-314_operator_sign_in.test.ts`. They drive the real builder client through a real `bin/access-sim` process.
- The fifth, for the `return` redirect, is in the REQ-475 workers suite so it can reuse that suite's Access fixtures.
- With the client fix removed, three of the four client tests fail. The fourth, expired session in the builder, passes either way because it guards today's behaviour.
- The REQ-475, REQ-202 and access-sim suites pass and the control app typechecks clean.
- Four other tests (one BUG-52, three REQ-115) fail the same way without my change, so they predate it.

**Not checked against real Cloudflare:** I'm assuming the edge refuses a background request with a redirect or a 401, which is what the simulator does. Both are handled, but it's worth trying the console once after the deploy.

The commits are `8a8108e0c1` (the fix) and `5f1ed2eae4` (the version bump). The branch is cleaned up, and promoting to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->