---
uid: comment-f71b55a7
id: COMMENT-3042
type: comment
title: Comment on bug BUG-105
created_by: xgd
created_at: '2026-09-17T23:07:07.362324+00:00'
updated_at: '2026-09-17T23:26:00.268586+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-15a86b19
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "58985a0a-26c3-4abc-9eea-4277f1013ba8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="4c13e945-e7d6-4495-81f3-37b1c90eab50-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T23:06:36.606407+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="4c13e945-e7d6-4495-81f3-37b1c90eab50-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T23:25:57.159696+00:00" -->
#### Claude
I've established the two open questions. Let me record the measurement evidence and write the fix.

Now let me run the UAT.

Now let me update the ticket body with the measured evidence, then bump and commit.

Now lock, merge back, and claim.

BUG-105 is done and landed on `xgd-working` at `status=free_coded`.

## What I found

The ticket asked me to settle two things before choosing a fix. I measured both rather than inferring them.

**1. Does the rail's report cross 64 KiB?** Yes — and it doesn't need more references to. The size is dominated by the *tests* phase, which prints one line per test file that is failing and wasn't on the recorded bar, so it's bounded by the suite, not by the number of sites on the rail. Driven through the real `recordRail`/`runRail` against this repo's own test-file list:

| failing test files | report bytes |
|---|---|
| 400 | 55,808 |
| 450 | 62,988 |
| 554 (the whole suite today) | **78,203** |

Crossover is ~466 files; the suite has 554. The ordinary scenario the rail exists for — bar recorded green, engine change breaks the suite — already produced a truncated report. The references axis is the slower one: ~2.2 KB per reference when every metric regresses, so ~30 references would do it on that axis alone.

**2. Does the rail terminate without the forced exit?** Yes. With the exit removed and a real `repro-rail record --only typecheck` run through the launcher (spawning `pnpm -r build` and `pnpm -r typecheck` as real children), the only live handle after `server.close()` resolves is a `ProcessWrap` for an already-closed child, and node ended the process in the same millisecond `main` returned.

So the natural-exit variant is safe here — no need for the explicit-drain variant that keeps a `process.exit` around.

## The fix

`tools/repro-console/bin/boot.mjs`: both exits converted to `process.exitCode`, not just the success one — the catch arm printed its reason to stderr, which is asynchronous when piped for the same reason stdout is. The `keepAlive: true` console path is untouched.

## The test

`tests/test_UAT_FC_BUG-105_rail_piped_stdout_not_truncated.test.ts`, 7 assertions in 1.6s, no browser, no network, no stored bundles. Two separate claims: the launcher carries a document whole (real subprocess, pipe vs file descriptor byte-identical, ends on its own, exit status preserved at 0/1/**2** — 2 matters because the rail uses it for "partial pass"), and the rail's own report really can exceed a pipe buffer (real `runRail`, only the command seam substituted).

The fixture is a stand-in entry module through the real `boot.mjs` — running the actual rail would mean minutes of wall clock, a browser and gitignored reference bundles, i.e. a test that skips on exactly the machines most likely to regress it.

Verified the bug reproduces: the same fixture through the pre-fix launcher returns exactly 65536 bytes; through the fixed one, all 70,076.

## One thing to note

REQ-267 landed a 0.2.240 bump while I held my branch, so my bump collided. I merged `xgd-working` into the branch, re-bumped to 0.2.241, fast-forwarded back, and claimed that — both SHAs are ancestors of `xgd-working` and the ticket is at `free_coded` with `story_points: 2`. Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->