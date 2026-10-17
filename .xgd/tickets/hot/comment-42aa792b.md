---
uid: comment-42aa792b
id: COMMENT-5467
type: comment
title: Comment on bug BUG-217
created_by: xgd
created_at: '2026-10-17T22:58:05.820794+00:00'
updated_at: '2026-10-17T23:13:49.707012+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-3c91a2d9
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "5e7795f9-0d7a-4f1c-97eb-50e038ed4de5",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="6a0239f5-8cf8-404c-8aed-bf438600dd16-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T22:56:50.706593+00:00" -->
#### You
Opening the editor gives me: Being worked on

builder worker-builder-7-y326gs is working on this since 22:53 UTC (3 min). You can edit it once that work has finished.

This needs to be made more user friendly

<!-- xgd-turn id="6a0239f5-8cf8-404c-8aed-bf438600dd16-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T23:03:36.622470+00:00" -->
#### Claude
Found it: the server builds the line in `apps/control-app/src/router.ts:6765` and the editor shows it in `apps/control-app/src/builder/editor.js:150`. Reading the helpers now.

I'll scope the ticket first, then cut a branch.

Now the edits.

Good — I can backdate a lease with a custom clock.

That's the known missing `generated/` artifact in a fresh worktree. I'll copy it over from the main checkout.

Tests pass (11/11). Committing and merging back.

I fixed the message. A site owner who clicks a section a builder is working on now sees:

> **This section is being updated**
> Your AI assistant is updating this section right now (started 3 minutes ago). You'll be able to edit it as soon as it's finished — try again in a minute or two.

The builder's internal id and the UTC clock time are gone. Two less common cases get their own wording:
- **The owner's own save in progress:** "You're already saving a change to this section…"
- **A system change:** "Another change is being applied to this section…"

**What changed:**
- **`tools/generate/src/store/leases.ts`:** a new `busyLine()` helper builds the owner-facing wording, with the time given as "just now" or "N minutes ago". The old helper with the id and clock is still used for logs and for the error a refused Save returns.
- **`apps/control-app/src/router.ts`:** the section-lookup response (`GET /api/copy`) now uses the new wording. The other fields in that response are unchanged.
- **`apps/control-app/src/builder/editor.js`:** new modal title and closing sentence.
- **Tests:** a new test file, `tests/test_UAT_FC_BUG-217_friendly_busy_line.workers.test.ts`, checks the three wordings against the real route and database. I also updated one check in the earlier REQ-397 test that expected the old "builder … since HH:MM UTC" text. Both test files pass, 11 tests in total.

**Ticket:** BUG-217 has a title and a description of the final behaviour, and is at `free_coded` with 1 story point. It records two commits: `d99598db` (the fix, merged into xgd-working) and the version bump the tool committed itself. I left it there; moving it to reconcile is your call.

**Loose end:** `xgd branch clean BUG-217` refused because BUG-216 now holds the merge lock. The fix is already merged, but the `free-BUG-217` branch and its worktree are still there. Once that lock is released, `xgd branch clean --stale` will remove them.

**To see it on dev:** dev serves a frozen snapshot, so the new message won't appear there until you run `bin/deploy --env dev`.

<!-- xgd-turn id="29372015-9976-497c-b755-f7c4620170ea-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T23:13:02.536581+00:00" -->
#### You
please complete the free-coding of this ticket

Blocking details:
- branch `free-BUG-217` still exists at `/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-217`
- branch HEAD: `d99598dbca92ea3236dcf65e363abf60b7e3d098`

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="29372015-9976-497c-b755-f7c4620170ea-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T23:13:45.045571+00:00" -->
#### Claude
The `cd … &&` prefix defeated the sandbox exclusion. Re-running the command bare:

BUG-217's free-coding is now finished. The `free-BUG-217` branch and its worktree are gone, and the merge lock is released.

The first cleanup attempt was refused with "Operation not permitted". That happened because I ran it as `cd … && xgd branch clean`, and the `cd` prefix stops the sandbox from recognising the command it normally lets through. Running `xgd branch clean BUG-217` on its own worked.

The ticket is ready to hand over:
- **Status:** `free_coded`, 1 story point, version 0.2.518.
- **Commits:** both are recorded and on xgd-working — `d99598db` (the fix) and `cb1db1d2` (the version bump).
- **Description:** describes the final wording and lists all three tests.

Moving it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->