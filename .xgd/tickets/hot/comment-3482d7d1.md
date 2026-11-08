---
uid: comment-3482d7d1
id: COMMENT-7867
type: comment
title: Comment on bug BUG-360
created_by: xgd
created_at: '2026-11-05T21:05:13.890961+00:00'
updated_at: '2026-11-05T21:58:42.607770+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-82d9a5b5
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "bd3b7ad7-f6ba-4beb-a34a-64893a404a22",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="8447f349-fa8c-4989-80ac-cf5e83dc8910-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T21:04:22.016827+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="8447f349-fa8c-4989-80ac-cf5e83dc8910-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T21:58:39.921423+00:00" -->
#### Claude
Reading the existing estimate code (REQ-625) and how the host uses it, so I can see how far this ticket already reaches.

The host already feeds the consultant a measured figure once planned work is under way. Next I'm checking where the layout fix rounds, jobs and operator views live.

Now checking whether I can read production D1 at all, since the re-survey depends on it.

Production's last runs end 2026-11-04 18:47, before the container cutover (REQ-646, 2026-11-05). So the only post-cutover runs are in local dev. Checking those now.

The post-container corpus is local dev from 2026-11-05T00:51Z onward (turns that carry `wall_s`), three sites in all. Checking repo script conventions before writing the survey.

Working out how to classify each builder pass from the tool transcripts. The `Delegate` inputs are elided at 5,800 bytes, so I'm checking whether `scope` and `steps` survive the cut.

Refused `Delegate`s (no handle) are easy to spot and leave out. Next I'm finding where the host's layout-look results land, so fix rounds can be identified.

The delivered pass results aren't in the tool transcript; they open the next round. Checking whether the chat transcript records those round prompts, which would show when the layout hold kicked in.

Names are right: `edit_image` is the quick recipe edit, `EditImage` the slow AI edit. Before cutting the branch, reading my notes on branch and worktree setup for this repo.

Setting the ticket to `free_coding` and cutting the branch.

Branch cut worked. Now giving the worktree its `node_modules` links per my setup notes.

Worktree is ready. Now reading the remaining touch points: where the speak-first refusal is produced, how the `Delegate` result passes through the host, and what the prompt says about time.

DOC-75 is a system-KB ticket, so I'll update it at merge time. Now writing the survey core. First, a short look at how a `1c` command is wired.

Writing the survey next. First checking where a detached pass's step is marked done in the host, since that's where an accuracy record would hook in.

I have the shape now. Reading REQ-625's UAT next, since the scripted-consultant harness it uses is what my estimate UAT will build on.

Writing the survey core: pure analysis over request rows, turn rows and transcript bodies, so the UAT can drive it with a synthetic fixture.

The survey core is written. Now looking at how the host creates its per-site step queues, to decide where finished-step records get handed to D1.

Writing the new `estimate-core.ts`: the 80th percentile is the estimate, fix rounds are counted, figures round up, and finished steps report estimated against actual.

Now the loader and the `1c estimates survey` command. It reads local dev D1 files, or remote D1 through wrangler, and with `--write` rewrites the `measured` table.

Writing the loader module and wiring the command into the CLI.

Wiring `1c estimates survey` into the CLI's switch and usage text.

Now converting `slow-tools.json` to the new shape so the survey can load it. The new fields start as placeholders, and the survey's `--write` replaces them.

Now updating `cadence-core`'s slow-tool table to the new shape (the estimate is `p80`).

The loose "ran out of" pattern also matched guidance text inside three first-draft deliveries, so those were wrongly dropped. Tightening it to the result's own `outcome`.

I'll have the survey also return each measured pass in order (kind, fix-round flag, minutes, chat), which the JSON output can carry, and use it to look at the fix-round chains.

The table is written. The source label shows the temporary copy's path, so I'm rewording `measured` to name the dev database properly.

The refusal has the call's input, so it can carry the host's figure for that exact call. Checking which tests pin the refusal text before changing it.

I'll pass the call's input through to the `after` hook. That way the hand-off result can carry the host's figure for the steps that call declares. Checking the output's shape before appending to it.

Now `host-core`: the `after` hook gets the call's input, the hand-off carries the figure, fix rounds and outcomes are wired, and the email fallback stops quoting a guessed "30–45 minutes".

Adding `handOffEstimate` to `estimate-core`.

REQ-410's UAT pins three phrases of rule 8. I'll keep them word for word and add the host's figures around them.

Replacing the same guessed "30–40 minutes" example in the talker's priming and in `email_when_ready`'s description.

Priming done. Running the typechecker on what I've changed so far.

Typecheck is clean for my files; the two errors are in untouched files. Now the D1 side: a migration for the outcome rows. Looking at the last migration and the manifest format first.

Writing migration `0050_estimate_outcomes.sql`, and moving the test harness's head marker to it.

Migration and manifest are in. Now `apps/control-app/src/estimates.ts`, which holds the D1 writer and the per-kind report. First, how `turnMeter` reaches the host from the router.

`ai.ts` already holds `env.DB` and the tenant where it hands `turnMeter` to the host, so the recorder can be built right there. Writing `estimates.ts`.

Wiring the recorder into the host deps in `ai.ts`.

Now the admin route. Reading the `/api/admin/turns` handler to follow its gating pattern.

Adding the route constant and handler.

Route done. Now the console section, modeled on `turn-health.js`. Reading its config labels and how sections are registered.

Four grid columns are styled, so I'll fit the table to four (step, estimated, took, share late) and reuse the turn-health classes, adding no CSS. Writing the labels, the fetch helper and the section.

Console section written. Checking whether any UAT pins the console's list of sections.

Nothing pins the full list. Typechecking both packages.

Both packages typecheck clean. Before writing the new UATs, finding the existing suites my change touches.

Running the most directly affected suites first.

REQ-386 already fails on xgd-working. REQ-390 and REQ-459 are mine. Looking at their details.

This test's `Delegate` declares no steps, so my hand-off line shouldn't touch it. Running it alone to see the frames.

The refusal now arrives wrapped in content blocks, so something else uses the new third argument. Looking for other `after` hooks passed to `toolSet`.

Testing whether the worktree environment alone causes it: swapping my tool-code changes out, running the test, then putting them back.

zsh didn't split the file list, so nothing was swapped. Confirming my changes are still in place, then retrying with an array.

Now REQ-625's UAT, which pins the old table shape. BUG-360 supersedes it explicitly: new kinds, the 80th percentile, fix rounds, rounding up.

REQ-625 and REQ-390 now pass; the remaining failure is the environmental one. Writing the new UATs, starting with the survey over a synthetic D1 fixture. Checking how other node suites drive `1c`.

The CLI printed nothing to `console.log`. Capturing stderr to see why.

`mockRestore()` clears the recorded calls, so the output was read after it had been wiped. Reading the calls before restoring.

Both survey UATs pass. Next is the scripted-consultant UAT, plus the accuracy-record and operator-route UAT. Reading how REQ-306's workers suite admits a platform operator for an admin route.

Writing the two workers UATs: the consultant is told the host's figure when work starts, and a finished job is recorded and shown on the admin route per kind.

Removing the hand-off line, and making the speak-first refusal carry the host's figure for the refused call.

Typecheck is clean. Updating the six suites that pin the refusal exactly, so each asserts the refusal is present rather than equal. Their meaning is unchanged.

Now rewriting my "when work starts" UAT around a round the host started, where the refusal is what the consultant reads before it speaks. Borrowing BUG-298's helpers.

Both pass. Now the console UAT (jsdom), mounting the shipped section against a planted route answer.

Now the BUG-298 pins on the old figures ("a few minutes left", "about a minute" for a capture), computed from the table instead.

BUG-284's two failures and BUG-278's also fail on the unchanged xgd-working checkout, so they predate this work. BUG-292 is mine: it pins "about a minute" for a capture. Updating it the same way.

BUG-292 passes. Time for the broad regression run. Checking my notes on running the full suite in batches.

1,367 files is far more than a few batches can cover, so I'll run the suites that touch what I changed: priming, rules, cadence, estimates, delegation, the CLI and the console.

57 failures across these files. Running the same failing files on the unchanged xgd-working checkout for a baseline.

Two new failures are mine. REQ-295 and REQ-353 check that the consultant with delegation switched off is never told about `Delegate`, and my rule 8 names it. Rewording the rule without the tool name.

Fixed; the two REQ-295 failures left are also on the base. Now the 218 related node suites, in chunks of about 55.

Baseline for the 31 failing node files on the unchanged checkout:

Typecheck is clean. Updating the ticket body before committing: keeping the operator's text and adding what was built, the measured table, the design decisions and what this supersedes.

Ticket body updated. Committing the work on the branch.

Committed. Taking the merge lock, then merging xgd-working into the branch, checking first for a migration-number clash.

Lock taken, and no other 0050 migration on xgd-working. Merging xgd-working into the branch.

Clean merge, though other work touched `cadence-core`, the priming and REQ-459's suite. Re-running typecheck and my UATs on the merged tree.

Only the two REQ-295 failures that are also on the base. Bumping the version on the branch.

Merged into xgd-working. (The ancestor check that errored used a made-up SHA of mine; ignore it.) Now moving the ticket to `free_coded` with both commits.

`free_coded` is set. Releasing the lock and removing the branch.

Branch cleaned. Last, the prompt side in DOC-75 (system KB): its plan step still asks for "roughly how long". Pointing it at the host's figures.

The phrase didn't match, and the update ran anyway with a file that was never written. Checking DOC-75 wasn't damaged.

DOC-75 is intact (20 KB; the update must have failed on the missing file). "Roughly how long" is no longer in it, so someone has edited the doc since. Seeing what it says about time now.

BUG-360 is implemented and merged into xgd-working, and the ticket is at `free_coded` (commits `fa0825ac` and `7cc2ea46`, version 0.2.788). My UATs and the suites I updated pass. The failures left in the related suites also fail on unchanged xgd-working, or fail in the branch worktree because of where it sits.

**What I found when re-measuring:** fix rounds are most of the wait. After an ordinary builder pass the host's layout check adds about 1.7 fix rounds of roughly 7 minutes each. That is why "about 3 minutes" became 8.

**What changed**
- **Re-survey is one command:** `1c estimates survey --write`. It measures, from D1, how long each kind of step takes: builder passes by scope (section, page, pages, site), layout fix rounds, slow tools and the consultant's own time. Each comes as median and 80th percentile with `n`, and lost, stopped and refused passes are left out. The method is recorded in `slow-tools.json`, which now holds today's figures.
- **How the estimate is worked out:** each step's 80th percentile, plus the expected fix rounds per builder pass, rounded up to the next 5 minutes. One of each now comes to about 20 minutes for a section, 25 for a page, 30 for two or three pages, and 30 for a first draft.
- **The consultant gets the number before it speaks:**
  - Its rules list the host's figure for each kind of step. The guessed "15–20 minutes" and "30–40 minutes" are gone.
  - When the host makes it speak before working, the refusal it reads gives the exact figure for the call it was about to make.
  - While work runs, each request still gives the time left.
- **Accuracy check:** each finished step and job is stored with its estimate and actual time in a new `estimate_outcomes` table (migration 0050). `GET /api/admin/estimates` and a new "Time estimates" section in the console show the error per kind.

**Decisions you may want to look at**
- **No estimate on `Delegate`'s result.** The ticket suggested this, but builder passes hand off without waiting: the round ends at the "started" result and the model never reads it. Anything added there would be dead code, so the figure goes in the rules and the refusal instead.
- **The data is thin.** Production had no container-era runs to measure: migration 0048 isn't applied there yet. The table comes from today's local dev runs, three sites, with `n` between 1 and 30 per kind. The accuracy check is what will show drift; re-run the survey with `--remote-env production` once production has container runs.
- **These replace REQ-625's rules explicitly:** the median, nearest-5 rounding, "a few minutes", and the old step kinds `revision` and `many_pages`. I updated the UATs that pinned them (REQ-625, REQ-390, REQ-459, BUG-292, BUG-298) to compute from the table. The speak-first suites now check that the refusal contains the standard text, since the figure follows it. All of this is listed in the ticket.

**Before or at the next deploy:** migration 0050 needs applying.

DOC-75 needed no edit: another session rewrote it at 13:44 today and it no longer asks for a time.

<!-- xgd-chat-end -->