---
uid: comment-9058c6ae
id: COMMENT-3328
type: comment
title: Comment on bug BUG-127
created_by: xgd
created_at: '2026-09-20T19:51:19.930293+00:00'
updated_at: '2026-09-20T20:12:05.732120+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-b4273c40
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "3464b221-0969-485d-8d90-ac5b31808f0b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="7dd197b9-f219-4c1f-8cf5-67189b4b7e11-user" -->

<!-- xgd-chat role="user" ts="2026-09-20T19:50:21.079008+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="7dd197b9-f219-4c1f-8cf5-67189b4b7e11-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-20T20:12:04.862790+00:00" -->
#### Claude
Now the guard rewrite.

Now the Playwright driver seam.

Now the Cloudflare driver.

Now the `capture_site` verdict.

Now the test file.

Now the regression scope around capture and the fidelity surface.

Done. BUG-127 is `free_coded` on `xgd-working` at `087bafe2f0` + `2e3ad02fe4` (v0.2.292).

**What I changed**

1. **The redirect cap now counts redirect hops along one chain** (`egress-guard.ts`). The `documents` origin-set is gone. `allow(url, { kind, redirectDepth })` takes the two facts only the driver knows; both production drivers supply them — Playwright from `resourceType()` + the `redirectedFrom()` chain, the CF driver from `resourceType()` + `redirectChain().length` (the locally-named puppeteer surface gained those as optional methods, so existing fakes still compile). A page pulling forty subresources across forty origins is forty chains of depth zero. `MAX_REDIRECTS` stays 5 — it now means hops.

2. **An iframe is a subresource.** `kind` is `'document'` only for a main-frame navigation, so a refused embed is a hole in a page rather than the loss of it. An unclassifiable request reads as a subresource — the reading that can never alone condemn a capture.

3. **Only the byte cap latches**, because it alone is a whole-capture budget. A redirect/address refusal refuses that one request and leaves later passes their own pages. Under the latch, refused *documents* are journalled every time (subresources aren't — it would bury the finding).

4. **`capture_site` has a verdict.** Refusals now carry `kind`, the guard exposes `documentRefused`, and `capture_site` raises `REFUSED` before `adopt()` when a page of its own capture was refused. Nothing gets adopted. Subresource refusals stay non-fatal and reported as before.

On fix 5 (billing): there's no page-load ledger in this repo to debit — that meter is Browser Rendering's. The lever available here is the verdict, so a refused capture can no longer be *reported* as a delivered one; I noted that in the ticket and left the metering question to the separate capture-budget discussion.

**Evidence** — new `tests/test_UAT_FC_BUG-127_capture_egress.test.ts`, six UATs covering each line of the ticket's test plan. The guard, the operation, the store and the full four-pass pipeline are real; the browser is the one double, and it answers a refused document with the refusal *page* rather than throwing, because that's the shape of the bug. A real browser is impossible here: the guard refuses loopback, which is what a test server is. Four of the six fail against the old code. I also rewrote REQ-157's redirect-cap UAT, which asserted the origin-counting behaviour this ticket supersedes.

**Full suite**: 5161 passed, 12 failed across 6 files — all pre-existing (wrangler asset config, no launchable browser, backend-settings `contextWindow`); I confirmed they fail identically with my changes stashed.

<!-- xgd-chat-end -->