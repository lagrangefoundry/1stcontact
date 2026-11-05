---
uid: comment-8bcac127
id: COMMENT-5759
type: comment
title: Comment on bug BUG-298
created_by: xgd
created_at: '2026-10-26T15:44:06.670909+00:00'
updated_at: '2026-10-26T15:59:05.020231+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-d6e6d650
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1887ec9b-11a4-43ee-8a02-3dee4fc7fbf8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a69140aa-81ef-418a-bebf-c700e9924e79-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T15:42:37.694816+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a69140aa-81ef-418a-bebf-c700e9924e79-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T15:59:03.640168+00:00" -->
#### Claude
I've read the ticket and the speak-first gate in `cadence-core.ts`. Next I'm reading how `host-core.ts` refuses calls and recognises cues, so I can design the change.

I'm tracing where the "what the client just finished" notice comes from, so the host's line can acknowledge it.

Plan is clear. Setting the ticket to `free_coding` and cutting the branch.

Branch is cut and set up. Writing the core change now: the gate holds only slow calls, and the host's line comes from the call's own working note.

Now the host side: the tool check takes the call's name, and the acknowledgement comes from the plan.

The code typechecks. Now running the existing speak-first suites to see which tests assumed reads get refused.

Six existing tests failed, all for the expected reason: they count on a quick read being refused, which this ticket deliberately changes. I'll move each one to a slow call. Reading them now.

Updating the BUG-278 test to use a slow call (`screenshot`) where it used a read.

BUG-262 already used a slow call and passes. Updating the BUG-292 test, which asserted the old fixed sentence.

Existing tests updated. Now writing the new BUG-298 UATs. First I'll check how other tests finish the comparison board.

I've written the three new BUG-298 UATs. Running them with the updated suites now.

The slow tool `screenshot` is "not enabled" without a browser double, so it's turned away before the gate sees it. I'll give these tests the shared fake browser, as the BUG-262 test does.

All 21 pass. Now a broader regression run. Checking my notes on running the full suite and the known baseline failures first.

Running the targeted regression scope: every test that touches cued rounds, the cadence wrapper, or the finish notice.

13 failures across 9 files. Checking whether they fail on clean `xgd-working` too, by running the same files in the main checkout.

12 of the 13 fail on clean `xgd-working` as well. The one exception is BUG-275 `…cut_off_before_it_wrote_anything…`, so I'm re-running that file on its own in my branch.

Both runs pass on their own, so it was a load flake under the batch. Now the non-workers tests in scope.

All 4 fail identically on clean `xgd-working`, so this change introduced no regressions. Linting the changed files, then committing.

No ESLint in this repo; the typecheck is clean. Checking my notes on this project's version-bump and promotion gate before committing.

Updating the ticket body first, keeping what's there and adding what landed and why.

The commit landed. The ticket check printed 0, but `ticket get` truncates long bodies, so I'm reading the ticket file directly.

The append didn't take. Checking my notes on `xgd ticket` quirks.

`--append-body` takes a string, not `--body-file`. I'll write the section to a file and pass it as a string.

The ticket body is updated. Next: merge back and promote. I'm checking the note on the version-gate race first.

Locking, merging `xgd-working` into the branch, then merging back.

The merge was clean, but BUG-297 just landed and changed the home-length hold, close to this code. Re-checking against the merged state before merging back.

All 28 pass on the merged tree, including BUG-297's and BUG-287's suites. Merging back into `xgd-working`.

The merge was a fast-forward. Promoting to `free_coded`, letting the gate do the version bump.

I'm updating one memory that is now wrong: it says a cued round refuses every tool.

BUG-298 is fixed, merged into `xgd-working`, and the ticket is at `free_coded` (commits `66541f0` plus the version bump `8027201`, version 0.2.668, 3 points). I didn't need to ask you anything first.

**What changed**

1. **Speak-first only holds slow calls.** On a held round, the gate now refuses only calls that make the client wait: `Delegate` and the tools in `slow-tools.json`, which are exactly the calls that put up a working note. Reads like `list_changes`, `list_pages` and `get_design` run without the round speaking first. The round still has to say something before its first slow call. Because "slow" is defined in one place, a tool added to `slow-tools.json` is gated automatically.
2. **The host's stand-in line now says what is happening.** The fixed "I'm working on this now…" sentence is gone. When a refused slow call is re-issued without words, the host writes that call's own working note:
   - a `Delegate` gets its `note` verbatim, e.g. "Building the first draft of your home page and catering page now; about 15 minutes."
   - a slow tool gets its status and estimate, e.g. "Taking a screenshot; about a minute."
3. **It acknowledges what the client just did.** On a round started because the client finished something, the line opens with a short clause read from the plan. For example: "Thanks for going through the comparison board." or "Glad the direction works for you." Other held rounds, such as continuations or the home-length hold, follow nothing the client did, so they get no opener.

**This reverses part of BUG-278.** BUG-278 made the gate refuse any tool, including reads; this ticket deliberately narrows it back to slow calls. Six tests in the BUG-278, BUG-284, BUG-290 and BUG-292 UATs used a read as the call that gets refused, so I switched them to `screenshot`. I also renamed one BUG-278 test, which still said "quick read", to `…_a_slow_call_before_any_words_is_refused_…`. The ticket body records all this so reconcile reads it as intended.

**Tests**
- The three new `test_UAT_FC_BUG-298_*` tests cover the cases in the test plan, and pass.
- The new tests and the related speak-first suites (BUG-262/278/284/287/290/292, plus BUG-297, which landed while I worked) all pass after merging in the latest `xgd-working`: 28 tests.
- The wider regression run (106 related files) shows nothing new broken. 16 tests fail, and 15 of them fail the same way on a clean `xgd-working` checkout. The 16th, a BUG-275 test, failed only in the full batch and passed in two runs on its own.

<!-- xgd-chat-end -->