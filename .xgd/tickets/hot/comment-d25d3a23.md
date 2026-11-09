---
uid: comment-d25d3a23
id: COMMENT-8131
type: comment
title: Comment on bug BUG-403
created_by: xgd
created_at: '2026-11-09T17:10:30.653838+00:00'
updated_at: '2026-11-09T19:42:43.718027+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-a35a1d7d
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "66dc966d-e714-40af-9e2c-0d5cf35f2a8e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="fdf95729-b877-4fe3-af07-3163c1621753-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T17:09:06.630283+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="fdf95729-b877-4fe3-af07-3163c1621753-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T17:13:12.754826+00:00" -->
#### Claude
Not a duplicate (lagrange-framework BUG-117 is the widget half, still draft). Now exploring the host-side progress code.

Still mapping the code paths (host → junction record → builder widget) before deciding scope.

I've stopped before writing code, because one dependency decides the order of work.

**Not a duplicate.** The nearest tickets are BUG-360, BUG-371, REQ-625 and REQ-626. Each covers one piece (estimates, pace, step counts, the job-finished email); none of them covers the whole-job bar or the milestones. lagrange-framework BUG-117 is the matching widget half, still a draft with no branch. BUG-403 stays at `draft`.

**The blocker.** The host can't put the new fields on the status record yet. It writes that record through the framework's `manager.progress(sessionId, text, { elapsedS, etaS, source })` (`components/ai/js/src/manager.js:2825`), and that function silently drops any option it doesn't know. BUG-117 item 10 adds the new fields there, but that's lagrange-framework code, and I won't edit the sibling repo from this session. Until it lands, a host test that checks a record carries `job_title`, `job_started_at`, `job_remaining_s` or `activity` would fail, and I won't commit failing tests. The bar test in our own plan is also really a test of BUG-117's widget.

**Options:**
- **A (my recommendation): land BUG-117 first, then this ticket.** Before that, I'd add a comment to BUG-117 fixing the option names the host will pass: `{ jobTitle, jobStartedAt, jobRemainingS, activity, jobDone }`, written to the record as `job_title`, `job_started_at`, `job_remaining_s`, `activity` and `job_done`. Then both sessions build to the same names.
- **B: build the parts here that don't need the framework now, and wire the record fields later.** That means:
  - the time and the "N of M" count come out of all client-visible text;
  - the whole-job remaining time is recomputed after each step;
  - a chat line with a link when a part finishes;
  - the "done" signal fires only when the last step finishes;
  - the builder tab title and the one-time notification offer.

  The record-field and bar tests would follow once BUG-117 lands.

In the meantime under B, I'd keep sending `eta_s`, but as the whole job's remaining time rather than a step's. The current widget would then count down the whole job, which isn't per-step but still sits beside its "so far" clock until BUG-117 removes it.

**Three design choices I'll make unless you say otherwise:**
1. **Job title:** "Building your checkout pages" comes from the consultant's note on the first hand-off of the job, and stays the same for the whole job.
2. **Activity line:** the `what` of the step running now, from the steps the consultant declared. Between steps, it's the last note.
3. **Chat line when a part finishes:** only a builder step that wrote at least one page gets one ("Checkout page is ready — view it"), linking to the preview of the first page it wrote. Steps that only change the design, header or settings get no line.

Should I go with A or B, and are those three choices right?

<!-- xgd-turn id="3ab43eaa-8a58-42f5-8c9a-f8bb0d3902fb-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T18:21:42.054585+00:00" -->
#### You
117 has

landed please proceed

<!-- xgd-turn id="3ab43eaa-8a58-42f5-8c9a-f8bb0d3902fb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T19:42:42.489484+00:00" -->
#### Claude
BUG-117 is installed in the shared store. Starting the free-coding flow: status → free_coding, cut the branch.

Now the host side: where plans are declared, the working hook, and the detached pass path.

Mapping is done; the existing REQ-625/627/390 UATs pin the old "N of M done, about X left" text and will be updated as an explicit supersession. Reading their harnesses to reuse for the new UATs.

Design settled. Writing the host side now: estimate/cadence cores first.

Adding the job-field projection and the per-stream pinning to progress-core.

Core progress plumbing typechecks (the two errors are pre-existing, unrelated files). Now the milestone chat line replacing REQ-436's talker cue.

Removing the now-dead talker cue (template, function, `pageDoneLine`); then I'll update the UATs that pinned it.

Host side typechecks. Now the builder: done-marker tab title and the one-time notification offer.

Writing the builder module.

Wiring done. Running the existing suites that touch these paths to see what moved.

Before fixing, a baseline: some of these may already be red on clean xgd-working.

Baseline: REQ-386 "20 second rule" and REQ-436 "at the ceiling" are already red on clean xgd-working; the other 9 failures are mine to update (they pin the superseded text/cue). Reading them.

A TDZ bug: the inserted lines sit in a block that later declares its own `said`. Moving the flush into a helper at the wrapper's scope.

All updated suites green except the pre-existing REQ-436 ceiling failure. Now the BUG-403 UATs; first the builder-panel harness from REQ-459's test.

Writing the builder-side UAT (real panel + real widget, recorded job frames).

All four pass. Checking the bar test actually depends on the pinning (it should fail without `JobFrames`):

Now the host-side UAT through the real routes (REQ-625's harness shape).

Both BUG-403 UAT files are green. Now a broader regression pass: first the node/jsdom project in full.

Full suite is too big for one call (per memory). Running a targeted set instead: every test that imports a changed module or drives progress frames / Delegate.

The same 16 fail on the base: pre-existing, not mine. Second half of the node list:

Also red on base. Last node chunk:

REQ-646 hangs in the sandbox (known); excluding it. Also REQ-467's test still imports the deleted `pageDoneLine`. Fixing that first.

Four priming suites fail only on my branch. Checking why:

They pass alone, so the chunk failures were load flakes. Now the 102 affected workers suites, in two chunks.

BUG-298 is mine (the stand-in line). Looking at what it pins:

Only REQ-459's workers test is a new failure on my branch. Inspecting:

Regression pass is clean apart from pre-existing failures. Checking lint/typecheck scripts:

Committing the last edit, then folding the WIP commits into one `[FREE-CODED]` commit with a non-interactive rebase (no reset/squash-merge).

Single commit, 19 files. Now the ticket body: keeping the existing text and adding an "As built" section (with the explicit supersessions).

Ticket body updated. Now merge-back: lock, merge xgd-working into the branch, bump the version there, then fast-forward.

Merge was clean, but other tickets landed meanwhile (BUG-405/407/408). Re-checking typecheck and the BUG-403 and updated suites on the merged tree before the version commit.

Only the pre-existing REQ-436 ceiling failure. Node-side BUG-403 + REQ-467 check, then commit the version and fast-forward.

Fast-forwarded. The printed rematerialize path doesn't exist (known); using the CLI verb:

`free_coded` with both SHAs. Setting story points, then cleaning up the branch.

BUG-403 is implemented and merged into xgd-working. The ticket is at `free_coded` (version 0.2.853, 8 story points, two commits) and the branch is cleaned up. Nothing is deployed, so dev still serves the old code until `bin/deploy`.

**What the client sees now**
- **Status words:** the host's status text is only what is being done ("The consultant is building your home page"). It no longer carries a time, "N of M done" or a step countdown.
- **Job fields:** planned work sends BUG-117's job fields instead:
  - **title:** the job's first note;
  - **time left:** the whole job's remaining time, recomputed after every step from the actual pace;
  - **activity:** the current step;
  - **finished signal:** sent once, when the last step actually completes, never when the estimate runs out.
- **One bar across rounds:** a job runs over several rounds, and both the bar and the start time used to reset each round, so the bar dropped back. The host now keeps one start and one round id for the whole job, so the bar never goes back.
- **Chat line per finished part:** when a step finishes pages, the host writes one line in the chat, e.g. "[Prices page](…) is ready." Nothing about it appears in the progress area.
- **Tab title:** if the tab isn't being looked at when the job finishes, its title becomes "✓ Done — …" until the client comes back to it.
- **Notification offer:** the first job estimated at over 8 minutes shows a one-time "Tell me when it is done" button in the chat. The browser only asks for permission when it's pressed; after that, finished jobs also send a notification.

**Behaviour changes to existing tickets** (written into the ticket body)
- **REQ-436:** the build-done line used to be left to a talker the host prompted. The host now writes it itself, so that cue and its template are deleted.
- **REQ-625/627/390/459/257/266/467:** their tests pinned the old "k of N done, about M minutes left" text or the talker cue, so I updated them to the new behaviour.
- **BUG-279 fix:** the first-draft hold now checks a line's words, not its link addresses. It was treating "draft" inside `#show=draft&page=…` as the whole draft being announced, and holding back every page line.
- **Slow tools:** a slow tool outside planned work keeps its own short countdown as before. I didn't change that.

**Tests**
- **New:** two BUG-403 test files. One drives the real routes. The other drives the real chat panel and widget with a recorded three-round job: the bar starts at 3–5%, never goes down, stays at or under 95% until finished, then shows 100. All pass, including after merging in the latest xgd-working.
- **Wider run:** the other tests that touch these modules show no new failures. Every failure left also fails on unchanged xgd-working: REQ-436 "at the ceiling", REQ-386, REQ-295, REQ-416, REQ-458, REQ-466, REQ-409, REQ-452/454/472, BUG-249/278/284, and some older reconciliation tests. I skipped REQ-646 because it hangs in this sandbox.

**Left as is**
- **Quiet-job line:** "No news from the job for N min" still appears when a job goes quiet. It still contains a time, and the widget shows it as the activity line.
- **Reload mid-job:** after a reload during a job, the bar may start lower than it was before the reload. It still never goes back after that.

<!-- xgd-chat-end -->