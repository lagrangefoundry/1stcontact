---
uid: comment-168f341f
id: COMMENT-7804
type: comment
title: Comment on bug BUG-353
created_by: xgd
created_at: '2026-11-05T01:06:37.150822+00:00'
updated_at: '2026-11-05T01:19:31.387537+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-105779dd
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "f85b45f1-062f-46b3-a9b0-fba600ba40da",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="b7fea798-4552-44fb-b5d6-24b324e82e2c-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T01:06:09.960039+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="b7fea798-4552-44fb-b5d6-24b324e82e2c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T01:19:30.974873+00:00" -->
#### Claude
Reading the drain and `openMessage` paths in `host-core.ts` now. Next I'll see how a round sends its prompt to the model, so a queued block array can run with its blocks intact.

Tracing who queued the Delegate result. It looks like the framework's `promptStream` queues the turn's content (blocks, for a delivery round) when it loses the claim race. Checking that now.

The scope is clear. Updating the ticket with what the junction showed and the extra guard, then cutting the branch.

Writing the UATs now. I'm checking how a test can seed a raw `enqueue` record onto a session's junction Durable Object.

Still reading the runner plumbing. The container step protocol already has an `{ ended: true }` answer, and I want to see what it means before adding the ended-job guard.

Now the edits. First the job-record constant and the waiting-messages helpers:

Now the drain, the ended-job guard, and sending round 0 as blocks:

Code's in. Typechecking next.

Running the new UATs:

All four pass. I'll check they fail without the fix by running them against the old `host-core.ts`.

Four failures in the talker suites. Checking whether they're existing by running the same two files against the old `host-core.ts`:

Those four fail the same way without my change, so they're existing failures, not regressions. Moving on to commit. Checking the version-bump convention for this repo:

Committing the work on the branch first:

Now the merge-back loop (lock, merge working in, bump, fast-forward, gate):

`free_coded` on the first attempt. Running the ticket-overlay rematerialize check for the merge, then setting story points and cleaning up the branch:

Nothing to rematerialize: zero tickets needed hiding. Cleaning the branch:

Last step: adding a short "what landed" note to the ticket body, keeping the existing text.

I've fixed this, and BUG-353 is at `free_coded` (v0.2.776). With the fix, a queued message made of content blocks no longer crashes the drain, so the site's messages stop ending "stopped".

**What changed** (all in `tools/generate/src/cli/ai/host-core.ts`):
- **Content blocks are accepted.** The drain now takes a queued message as words or content blocks. The cue and rejection checks read the text of the blocks, and the queued message's first turn sends its blocks as they are, so an image runs as an image. The `as string` casts on queued content are gone.
- **Bad records are retired.** A queued message that is neither words nor blocks is retired with a recorded reason. The job carries on and ends `complete`, so one bad record can't block a site again.
- **Ended jobs run nothing.** A step of a job that has already ended now returns that job's existing end without running anything, and a job never gets a second `job_end`.

**Your open question: yes, the enqueue was a bug.** I read the dev junction. Job `turn_bf1c4b7a…` was ended `lost` by another process at 21:37:59 while its step 3 was still running. At 21:46:24 that step went on to deliver builder result `worker-builder-2-zm6sfz`, which the live job was delivering at the same moment. The leftover step lost the race for the session, so the framework queued its delivery as content blocks. That record is the poison. The ended-job guard closes this path.

**Tests:** four UATs in `tests/test_UAT_FC_BUG-353_queued_content_blocks_drain.workers.test.ts`, one per test-plan item:
- a queued text-and-image message runs with its image;
- a session that already holds such a record recovers, and the next message doesn't run it again;
- an unrunnable message is retired and the job ends `complete`;
- a step of an ended job makes no model call, drains nothing and writes no second end.

All four pass with the fix and fail without it. The REQ-624, REQ-627, BUG-256, BUG-294, BUG-326 and BUG-343 suites pass. Four talker cases in REQ-416 and REQ-436 fail, but they fail the same way without this change.

**Before you test on dev:**
- **Dev has to be redeployed.** Dev runs a frozen copy of the code, so the fix only reaches it after `bin/deploy --env dev`.
- **The bad record clears itself.** That site's next job will run it as a turn once, as a builder result the consultant replies to.

The branch is merged into xgd-working and cleaned up. The ticket body has a "What landed" section appended, and promotion to `ready_to_reconcile` is yours to decide.

<!-- xgd-chat-end -->