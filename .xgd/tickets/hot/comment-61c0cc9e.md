---
uid: comment-61c0cc9e
id: COMMENT-7877
type: comment
title: Comment on bug BUG-361
created_by: xgd
created_at: '2026-11-05T22:55:03.919465+00:00'
updated_at: '2026-11-05T23:17:22.326594+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-b3995ecd
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "b5f123c1-f205-4922-a99a-b00fe7fcd48a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d96837ec-0655-462a-8379-24eade9d5915-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T22:54:40.413311+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="d96837ec-0655-462a-8379-24eade9d5915-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T23:17:21.951122+00:00" -->
#### Claude
I'm reading the BUG-361 ticket and finding the host code for the stuck-after-timeout resume, then I'll cut the branch and start coding.

Still mapping the host's job loop (how a "picking it back up" round is supposed to get scheduled) before I touch anything.

I'm reading the dev junction log for the stuck 21:40 job to see why its promised resume never started.

Checking the dev worker's own log at the incident minute for the container's model-request failure.

Adding a `row_gap` finding to the layout check's `rows` entry. Reading the `H.drawn` helper so "measured on what is drawn" doesn't flag a deliberate photo-against-panel split.

Now the builder's slot-rebuild guidance. Finding where the product-page / slot guidance text lives.

Investigation done. Moving the ticket to `free_coding` and cutting the branch.

Branch cut. Wiring the worktree's `node_modules` the way the memory notes say: real directories, `@1stcontact` links pointing at the branch's own packages.

Worktree is ready. Now the first fix: settle the talkers in `withProgress` even when the work stream throws.

Host fix in place. Now the panel: a talker reply that started but never finished must not hold Stop up once every work stream has closed.

Panel fix done. Now the `row_gap` layout finding in the `rows` check.

Layout check done. Now the builder guidance in `l1-surface.json` (the `add_component` description the builder reads).

Guidance updated. Now the UATs — looking at the existing BUG-277 error-carry UAT to reuse its scripted-model harness.

I'll model the host UAT on this file. Checking the scripted model client's helpers.

Writing the host UAT (workers pool, real router + junction, scripted model).

Running the new host UAT on the branch.

Both pass. Now confirming the second one actually catches the bug: re-running it with the `progress-core.ts` fix reverted.

It passes even without the fix, so the test isn't reproducing the incident yet. Dumping the stream to see which path it actually took.

Now it reproduces: without the fix the client's message goes unanswered. Running with the fix restored:

Passes with the fix, fails without it. Correcting a doc comment I left inaccurate (both tests throw the same non-transient error).

Now the panel UAT. Looking at the existing REQ-416 panel test for its harness.

I'll write the panel UAT the same way. Finding how webui-chat marks the composer's Send vs Stop button.

`isBusy()` is the composer's Stop state. Checking the `interrupted` shape `paintInterrupted` expects, for the leftover-`pending_turn` case.

Writing the panel UAT (jsdom, real `createChatPanel` + installed webui-chat).

Both pass. Now confirming the first panel test fails with the `chat.js` fix reverted:

The panel test fails without the fix (Stop stuck on) and passes with it. Next, the layout-check UAT in a real Chromium, modelled on REQ-449's.

Skipped: `engineAvailable('chromium')` is false here. Checking the test-harness memory notes for how Chromium suites run in this sandbox.

Two fixes from those notes: run with `CHROMIUM_LAUNCH_ARGS=--single-process`, and give the fixture a second section so the runner doesn't descend into the only one.

All four pass. The new finding could also fire on other layout fixtures, so next I'll run every suite that imports the layout check — on the branch and on clean `xgd-working` as a baseline.

7 failures on the branch. Running the same 30 files on the clean main checkout to see which were already red.

Same 7 failures on clean `xgd-working`, so none are mine. Checking that none of the branch's failure messages mention `row_gap` (they might fail for two reasons):

Six workers failures on the branch. Baselining the same 27 files on clean `xgd-working`:

Identical 6 on the baseline. Since I changed the `rows` check's `said` phrase and BUG-271 tests the critic rubric built from those phrases, comparing that failure's message on both runs:

Same failure on both. Last regression scope: the jsdom suites that load the panel's `chat.js`.

Same 6 on the baseline, so no regressions in any of the three scopes. Typechecking the changed TypeScript before committing.

`tsc` reports errors, but none in the files I touched. Confirming the count matches clean `xgd-working`:

Typecheck matches the baseline (2 pre-existing errors, neither mine). Now the commit. Checking this repo's version-bump script and recent free-coded commit style.

Committing the work (version bump comes after merging `xgd-working` in, per the promotion recipe).

Committed. Before merging, re-reading the ticket body in case the operator edited it during the session, then updating it with the findings and what changed.

Unchanged since the session began. Writing the updated body: original Symptom and Fix kept as written, plus Findings, What changed, and a test plan that says what is covered and what isn't.

Ticket body updated. Now the promotion sequence: lock, merge `xgd-working` into the branch, bump the version, then merge back.

Another ticket (BUG-366) holds the merge lock right now. Merging `xgd-working` into my own branch doesn't need it, so I'll commit the version bump, then wait for the lock.

Lock acquired. Checking whether `xgd-working` moved while I waited (if it did, the bump has to sit on top of a fresh merge).

BUG-366 landed first and took version 0.2.792. Merging `xgd-working` in again and bumping to the next free version.

Clean merge. Bumping, committing, and merging back with `xgd-merge`, then promoting — retrying if another ticket commit lands on top first.

Moved to `free_coded` on the first attempt. The gate also printed a version warning, so reading the ticket's recorded fields to check it:

All verified: both SHAs recorded, version 0.2.793 checks out, and the work is on `xgd-working`. Tearing down the branch (as its own call, per the sandbox rule):

Cleaned up. One non-obvious lesson here is worth keeping for future sessions, so I'm saving it to memory.

BUG-361 is fixed and merged into `xgd-working`, and the ticket is at `free_coded` (version 0.2.793). I haven't promoted it to `ready_to_reconcile`.

**What actually happened (from the dev junction log):**
- **The promised resume did run**, in the same job. Its model request timed out too, so the message ended there.
- **Your 21:42:21 message is what got stuck.** It arrived while the resume was running, so a talker (the reply that runs beside the work) started answering it. When the resume failed, the host only waits 10 seconds for a talker before ending the step, and this one was still replying. The job ended, its container stopped, and the talker's reply was cut off with its turn never closed.
- **The builder then waited forever** for the rest of that reply, so the stop button stayed up with nothing running.
- **The reload didn't cause the timeouts.** Model requests go straight from the job's container to the provider, not through the page or the Worker. The two failures, 33 s and 43 s, look like the provider client's own connection timeouts, retried and then given up.

**What changed:**
1. **Host:** when a round fails with an error, it now waits for any reply already being written beside it before ending. Your message gets answered and nothing is left open.
2. **Builder:** once the work has ended, a cut-off reply no longer holds the stop button up. The message runs again as the next turn, so it is answered and the composer is back to Send.
3. **Layout check:** it now reports two side-by-side columns with less than 8px between them, measured on what's actually drawn. The fix line tells the builder to set a gap on the box that holds them. A photo meeting a coloured panel edge to edge isn't reported, because that's usually deliberate.
4. **Builder guidance:** rebuilding a product page now says to start from the starter and keep its spacing between the photos and the details.

**Tests:** three new test files (8 tests), all passing. I re-ran the two bug tests with each fix taken out, and both failed as they should. The suites that touch the changed code (30 layout, 27 host/talker/job, 35 builder-panel) gave the same results on the branch as on clean `xgd-working`. The few failures in them are already there on clean `xgd-working`.

**Not done:**
- **No real-browser test of reloading** at the start, middle and end of a turn. The reload wasn't the cause, and rejoining a running job after a reload is existing behaviour, so I've recorded this as not covered in the ticket rather than building it.
- **The "first product sold" and "checkout with no product" tests** in the ticket's test plan belong to BUG-363, so I left them out.
- **A remaining duplicate case:** if a job's container dies while a reply is being written, the re-sent message appears twice in the transcript. That's the case the builder fix covers, and answering it twice beats not answering it.

Dev serves a frozen snapshot, so you'll only see these changes there after `bin/deploy --env dev`.

<!-- xgd-chat-end -->