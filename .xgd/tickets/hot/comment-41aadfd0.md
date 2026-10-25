---
uid: comment-41aadfd0
id: COMMENT-5541
type: comment
title: Comment on request REQ-421
created_by: xgd
created_at: '2026-10-21T14:29:23.580811+00:00'
updated_at: '2026-10-21T14:38:55.190236+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-577ab461
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "694ce884-12a2-470f-8e94-26c32f2dac07",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="2932adb3-8e00-48ed-bb0e-45b2260d3f5e-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T14:28:39.706051+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="2932adb3-8e00-48ed-bb0e-45b2260d3f5e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T14:38:53.876872+00:00" -->
#### Claude
I'm investigating where builder sessions assemble their system prompt and whether the cache breakpoint lands at the shared-prefix boundary.

REQ-216 (the framework's per-tier cache lifetimes) looks like it may already have landed upstream, so I'm checking that before reading how the request gets put together.

I've cut the branch. Next I'm writing a throwaway diagnostic that sends two builders through the real route and compares their first requests, to find what stops them sharing the prefix.

I've traced the per-session block to the framework's memory core. I'm reading the framework's assembly order now, to see whether the host can fix this or whether the fix has to go upstream.

REQ-216 is already in the installed framework store, so item 2 can land in this repo. Reading how the host passes lifetimes and how the meter prices them.

No paragraph over 120 characters appears in both, so there's no duplication to remove. Deleting the diagnostic and checking lagrange-framework for an existing ticket before filing one.

No existing framework ticket covers this, so I'm filing one with the diagnosis.

Filed lagrange-framework BUG-90 (`bug-110add91`). Now implementing item 2 in the branch worktree. First I'm looking at how the host constructs each backend.

Removing the explicit `cacheTtl` arguments so the framework reads the lifetimes from `backends.json`, the same document the meter reads.

Now `cacheTtlOf` in backends.ts.

Now `backends.json`: add the keys and a paragraph to `about`.

Now updating the two existing UATs that read `cacheTtlOf` as a string, then writing the new UAT.

The worktree lacks the generated control-app artifacts, a known issue. Checking the remembered fix.

My new UAT and both BUG-242 suites pass. One REQ-292 test fails on `logDir`, which matches a remembered pre-existing upstream drift. Confirming it also fails on the clean main checkout.

That failure pre-exists on the clean checkout, so it isn't mine. Running the adjacent delegation and spend suites plus a typecheck.

Two REQ-295 delegation failures, matching a remembered pre-existing failure. Checking them against the main checkout.

Both failures also occur on the clean checkout, so they pre-exist too. Typechecking the generate package.

Typecheck is clean (0 errors). Before committing I'm re-reading the version-bump memories, since the gate has known quirks here.

The ordering that works: commit without a bump, merge back, then let the gate bump the version itself. First I'm updating the ticket body, re-reading it in case it changed.

Ticket updated. Committing on the branch.

Committed (`2121f88`). Taking the merge lock and merging into `xgd-working`.

Merged into `xgd-working`; rematerialize found nothing to change. Moving the ticket to `free_coded` and letting the gate bump the version.

REQ-421 is now at `free_coded`. The 5-minute history cache for builders (item 2) is done here. Getting builders to share the starting prefix (item 1) needs a framework change, which I filed as lagrange-framework BUG-90 instead of coding it here.

**Why builders don't share the prefix.** I sent two builders through the real route with a recording model client and compared their first requests:
- Their tool definitions are byte-identical, so the tools were never the problem.
- Their system prompts differ in one place only: the conversation's ticket id (`chat-985c4771` vs `chat-707c1fbe`). Mask that and the two are identical.
- That id comes from the framework's memory text, which starts "This conversation is ticket {ticket}". The framework puts it in the first ~900 characters of every session's prompt, before the builder's ~48k-character role text, vocabulary and manual.
- A cached prefix has to match from the first byte, so no builder can ever read what another wrote. The consultant doesn't notice because it is one long session re-reading its own prefix.
- I can't fix this here without cutting words, which requirement 4 forbids. The memory settings are shared by the consultant, coordinator and builder, so they can't be changed for the builder alone.

**Lagrange-framework BUG-90** (`bug-110add91`, at draft) asks for the session-specific text to move after the last shared cache breakpoint, with no wording change. The proof that two builders share the prefix belongs to that ticket's test. Once its fix is installed, the same check can be added here.

**Item 2:**
- **Lifetimes:** `backends.json` sets the builder to `{system: "1h", messages: "5m"}` and keeps the consultant and coordinator at `"1h"`.
- **Single source:** the host no longer passes a cache lifetime when it builds each backend. The framework reads `backends.json` (REQ-216, already installed), and the meter reads the same key through `cacheTtlOf`.
- **Metering:** if the provider ever reports a cache write without splitting it by lifetime, the meter prices it at the longer (1-hour) rate. A builder's cost can be over-counted that way but never under-counted.
- **Savings:** this cuts the builders' history writes from 2× to 1.25× input from now on. Their prefix is still written once per builder at the hour rate, same as today, until BUG-90 lands.

**Duplication check:** no paragraph over 120 characters of the builder's prompt also appears in its tool descriptions, so there was nothing to remove.

**Tests:**
- The new UAT `test_UAT_FC_REQ-421_builder_cache_lifetimes.workers.test.ts` passes: builders ask for 1h on the system prompt and 5m on the history, and the consultant asks for 1h throughout. It covers one builder.
- The BUG-242 and REQ-292 tests that check these lifetimes were updated and pass, and so do the neighbouring delegation and spend suites. Typecheck is clean.
- Three tests fail, and they fail the same way on the clean checkout without my change: one REQ-292 test (a framework option rename) and two REQ-295 delegation tests.

The ticket body records the cause, what landed and the test plan, and the commits are `2121f88` plus the gate's version bump to 0.2.567. Once BUG-90 is in, check `turn_spend.attributed`: a short builder run's cache writes should drop to roughly its own growth rather than its whole context.

<!-- xgd-chat-end -->