---
uid: comment-2df4ab65
id: COMMENT-5592
type: comment
title: Comment on bug BUG-266
created_by: xgd
created_at: '2026-10-24T15:09:55.394926+00:00'
updated_at: '2026-10-24T15:21:47.554300+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-7484f13a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "306aa8f8-9723-4b7c-b0f1-d32afd04072c",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="734be746-f4e0-43f1-8ab1-1c3718e561eb-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T15:08:26.319325+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="734be746-f4e0-43f1-8ab1-1c3718e561eb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T15:21:45.458005+00:00" -->
#### Claude
I've cut branch `free-BUG-266`. Now I'm finding where the builder's change account is shaped, so the idle check reads `places` and not the emptied `differences` field.

I'm reading the REQ-436 test harness so the new UAT can drive real builder results. The fix: `wrote` decides whether a build changed anything, and `differences` ∪ `places` say where.

Now let me edit host-core.

Now apply the edits.

The fix is in `host-core.ts`. I'm now writing the BUG-266 UAT on the real builder harness.

This worktree is missing generated build artifacts. I'm copying them in from the main checkout, then running the new UAT.

Three builds ran and three announcements were cued. My helper read the wrong request, so let me fix it.

All four pass. The site-settings test's link check passes trivially if no announcement fires, so I'll make it wait for one. Then I'll confirm the suite fails without the fix.

Both bug cases fail without the fix and pass with it. Next: the related UATs, the typecheck and lint.

That run printed nothing, so I'll write the output to a file and read it.

All related UATs pass (some browser suites skip, as they do everywhere). Now the typecheck and lint.

The typecheck is clean. Next I'm removing the harness pieces I copied into the test but don't use.

The fix and UAT are done and verified. Before committing I'm checking the version-bump and gate conventions in memory.

Now update the ticket body (preserving existing content), then commit.

The fix is committed. Next: merge it back with the retry loop, then set the ticket to free_coded.

I've fixed BUG-266, merged it into xgd-working and set the ticket to `free_coded` at version 0.2.611. I haven't promoted it to `ready_to_reconcile`; that's your call.

**What was wrong.** BUG-252's slimming (`presentedChanges`) moves a large build's changes out of `account.changed.differences` and into `places`. So exactly the builds that changed the most came back with `differences: []`. REQ-436's idle check read only `differences`, so every real build looked idle. After two builds, every `Delegate` was refused for the rest of the request, and the "this piece is ready" announcement never fired.

**The fix** (`tools/generate/src/cli/ai/host-core.ts`): one function, `buildChanges(output)`, replaces `writtenPages`.
- **Whether a build changed anything** now comes from the result's `wrote` flag. The host sets it from the builder's full record before the account is cut down, so trimming the account can no longer hide a write.
- **Which pages changed** comes from both `differences` and `places`. A change with no page counts as site-wide: nav, palette, text styles, or a write whose places were all cut for size.
- **Pages shown to the client** (`shownPages`) are now the pages touched, plus the home page for a shared part or a site-wide change.
- **Side effect you might notice:** after a build that changed only site settings, the host's REQ-415 look now checks the home page. Before, it skipped the look entirely.
- **Idle count per message:** confirmed, no change needed. Each new client message starts at 0, and host continuations of the same request share the count, as REQ-436 intends.

**Tests:** `tests/test_UAT_FC_BUG-266_a_build_that_wrote_is_not_idle.workers.test.ts` drives the real builder, so it gets the result shape the builder produces today, not a hand-written one.
- **Three large page rewrites:** none counts as idle, all three are built, and each is announced. The test asserts the real shape (`wrote: true`, empty `differences`, the page under `places`), so a future reshaping of the account fails here instead of quietly disabling building.
- **Palette-only builds:** not idle, and announced with a link to the home page.
- **Two builds that write nothing:** the third is still refused.
- **A new client message after an idle stop:** its first build goes ahead.

The first two fail on the old code and all four pass with the fix. The related suites pass: REQ-436, BUG-256, BUG-252, BUG-243, BUG-248, REQ-415, REQ-422, REQ-427 and REQ-438. Some of them skipped their browser tests, which they do in every worktree. The `tools/generate` typecheck is clean.

I added the details above to the ticket body under the existing text, and set story points to 2.

<!-- xgd-chat-end -->