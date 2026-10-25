---
uid: comment-5a2da424
id: COMMENT-4872
type: comment
title: Comment on bug BUG-192
created_by: xgd
created_at: '2026-10-04T00:14:30.451282+00:00'
updated_at: '2026-10-04T00:27:24.472385+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-be316679
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d23d9e66-ef79-4e40-b5c4-537820378515",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="2e192125-8d11-4367-a450-f0ff0daf1ecd-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T00:13:13.790181+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="2e192125-8d11-4367-a450-f0ff0daf1ecd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T00:27:24.278524+00:00" -->
#### Claude
Reading the ticket and tracing how the builder's preview frame learns about draft changes — so far it reloads only when a chat turn reports a write (`onSiteChanged`), which explains the bug.

Branch `free-BUG-192` is cut; now reading the panel's reload and site-switch code to wire the subscription in.

Now writing the server side: the feed route, the stream function, and the change-count stamp on builder preview pages.

Good — there's a BUG-43 UAT for the existing chat-driven reload I can model the client test on.

Server route and client wiring are written; now finding an existing route test to model the UATs on.

Workers UAT written; running it now (plus the REQ-233/REQ-312 neighbours as regression scope).

Page key includes `.json`; stripping it.

Switching the test's out-of-band writer to a palette `add` (a real journalled write).

Now the client-side UAT (jsdom), modeled on the BUG-43 suite.

Several failures; some are likely worktree/sandbox artifacts, but the "byte-identical" ones may be real — the meta stamp changes preview bytes. Checking the messages.

Byte-identity suites pass now. Re-running the wider builder/preview list to separate pre-existing failures from mine.

Committing on the branch, then merging back and letting `move-to-free-coded` do the version bump itself (avoids the known tip race).

Now updating the ticket body to match what landed (Server-Timing instead of meta), then locking and merging.

Ticket body is current. Locking and merging back.

BUG-192 is fixed and parked at `free_coded`. Commits are `42ed8b29` (the fix) and `19923a5e` (version bump to 0.2.472). The branch is merged into `xgd-working` and cleaned up.

**Cause.** The preview frame only reloaded on `site_changed` events. The server sends those inside the consultant's own chat stream, after tool activity. A write made while nobody was reading that stream never reached the frame: the delegated builder that aborted, or a dropped socket. Nothing compared the frame with the draft afterwards, so the stale page stayed up until another turn happened to send `site_changed` on a live stream.

**Fix.** The preview now watches the draft directly, using the same pattern as the Library and Contacts live feeds:
- **New feed:** `GET /api/sites/changes?site=` streams the draft's change count. Every structured write moves that count, whichever session made it. After a dropped connection, the browser reconnects and the gap is reported straight away.
- **Preview responses state their count:** draft and edit previews carry a `Server-Timing: draft-at;desc="<n>"` header. My first try put the count in a `<meta>` tag, but that broke the rule (REQ-119) that preview bytes match build bytes. Two suites caught it, so it's a header instead.
- **Builder:** it subscribes to the feed for the site on screen. Both the feed and the chat's `site_changed` reload the frame only if it is behind the reported count. So a write reported on both channels reloads once, and the operator's own saves aren't reloaded again a moment later.

I didn't add a "preview out of date" banner, because the preview now catches up by itself.

**Tests:** 11 new `test_UAT_FC_BUG-192_*` tests (6 server-side against real D1, 5 in the browser app) all pass. So do the existing BUG-43, REQ-119, REQ-201, REQ-233 and REQ-312 suites. In the wider builder run, four files fail:
- `reconciliation-colour-palette-overlay` (test AC931) fails the same way on a clean `xgd-working`.
- `reconciliation-builder-workspace-origin`, `req115-builder-shell` and `req117-edit-loop` got 503s because the control-app assets aren't built in a fresh worktree. My change doesn't touch asset serving, but I didn't re-run those three in the main checkout to confirm.

**Your questions in the ticket:**
- **Are notifications per session?** Yes. They lived in the writing session's chat stream, so they were lost with it.
- **Does the preview resync after a drop?** It didn't before; it does now.
- **Was it sticky?** Only until the next `site_changed` arrived on a live stream. If the stream had died, the 75→77 pass would not have refreshed it either.

The dev server serves a frozen snapshot, so you'll need `bin/deploy --env dev` before you can see this on :8789. The ticket body is up to date. Promoting to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->