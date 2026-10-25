---
uid: comment-3339e038
id: COMMENT-5613
type: comment
title: Comment on request REQ-449
created_by: xgd
created_at: '2026-10-24T22:20:42.781904+00:00'
updated_at: '2026-10-24T23:21:00.966187+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ebdc3a7f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "bef19ce7-100b-4968-a5bf-4ef7aa18dcd4",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="91cc52d5-2e7d-4d61-993b-b67bb9f03516-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T22:19:53.452211+00:00" -->
#### You
Does this ticket depend on 448?

<!-- xgd-turn id="91cc52d5-2e7d-4d61-993b-b67bb9f03516-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T22:22:25.279749+00:00" -->
#### Claude
Yes, partly. REQ-449 isn't formally blocked by REQ-448: its `blocked_by` lists only `request-6b5389b6` (REQ-447), the same blocker REQ-448 has. But one piece of REQ-449 does need REQ-448 to land first.

- **The hard dependency is the "Crops keep their subject" check.** It checks an image's focal point, and REQ-448 is what adds focal points. REQ-448 has the material describer record one when a photo is added, and lets an L1 image node override it for one placement. Before that, nothing records a focal point, so this check has nothing to measure.
- **The rest is a soft dependency.** The ticket body says it "works best with REQ-448 (a design the principal wrote), but a migrated design is enough to start." The other layout checks and the critic changes work against REQ-447's migrated design. They just give better verdicts once the principal has written the design. The other checks are heading proximity, section vs block gaps, grid edges as a hold, matching rows and the off-system share.

REQ-448 is still at `free_coding`. So there are two ways forward:
1. Add `request-baeb116a` (REQ-448) to REQ-449's `blocked_by`, so the whole ticket waits.
2. Keep REQ-449 unblocked but make the focal-crop check wait for REQ-448. That means either doing that check last or skipping it when no focal point exists.

I'd go with option 2 if you want REQ-449 to start before REQ-448 finishes, and option 1 otherwise. I haven't changed the ticket; tell me which you want.

<!-- xgd-turn id="0ab2dfb1-abe9-4df3-b5c0-29a7d49dfb2a-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T22:23:14.771600+00:00" -->
#### You
Please start on the parts that are unblocked

<!-- xgd-turn id="0ab2dfb1-abe9-4df3-b5c0-29a7d49dfb2a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T23:00:54.014779+00:00" -->
#### Claude
REQ-447 has landed on xgd-working, so I can build on it. I'll set the ticket to `free_coding` and cut the branch.

I've read the layout-check framework. Next I'll look at how holds and notes are decided, the critic, and REQ-447's design object.

Still mapping the code: every layout finding is already held by the host, so the real change for `edges` is measuring it against the design's widths. Now I'm reading REQ-447's `site.design` object.

I have enough of the layout side. Next, the critic: where it's commissioned, its rubric, and REQ-427's due points.

I have the critic's rubric. Now the existing test harnesses for REQ-429 (Chromium fixtures) and REQ-427 (critic due points), so the new UATs follow them.

The worktree is set up. Now a baseline run of the REQ-429 suite in real Chromium before I change anything.

Builders write the design through `set_config`, so the design-change UAT can drive it through a real builder. Writing the code now, starting with the on-system half of the census in `site-schema`.

Now `layout-check.ts`. First the finding kinds, the imports and the design facts each width is checked with.

Now the checks themselves. `edges` measures against the design's grid when the site has one, and three new entries are added: `gaps`, `rows` and `off_system`.

Now the runner: the design facts injected per width, plus two shared helpers (`frameOf` and `drawn`).

Now the TS side that works out the design facts for each width and the per-section census.

Next, pass the design and the page's L1 to the checker at both places the layout check runs: the builder's page map and the host's look after a build.

The type check is clean. Now the critic, in `critic-core.ts`: the design in its brief, a snapshot kept on each review, and the two new due triggers.

That value formatter came out convoluted. I'm rewriting it before going on.

Now the plan's `critique` tool and the deps type.

Now the host: the critic reads the design and off-system counts, and a finished build checks whether a review falls due.

Everything type-checks. Now the critic's rubric in `priming.json`: the style lens judges against this site's design, and the "nothing measures" list keeps only what still isn't measured.

Now the REQ-449 UATs. First I'll check how the BUG-256 hold test feeds layout findings through the fake browser, so the `edges`-holds test can use the real host path.

The BUG-256 fake browser only answers when the script is exactly `LAYOUT_SCRIPT`. A site with a design now gets a different script, so I need to check whether `siteSeed` sites carry a design.

No seed sets a design, but a legacy site may be carried to a design when it's read. Checking whether that happens on import, which would quietly change the script those fakes compare against.

The type check passes. Now the Chromium UAT file for the checks.

All 7 pass on the first run. The off-system assertion uses a loose alternation, though, so I'll tighten it to the exact axis counts: 3 type, 1 spacing, 1 colour.

The tightened assertion passes. Now the existing layout suites, because the new checks could add findings to fixtures that expect a clean page.

They pass. But my clean gaps leg now has no design, so it passes vacuously. I'm giving it the same design as the faulty leg.

Seed sites already start with a body-only design, so builders can change it with `set_config`. Next, the wording of the layout hold, for the `edges`-holds UAT.

Now the workers UAT file: `edges` holds the hand-back with the design in the page, the critic is handed the design, and the revision trigger.

Three pass. The off-system line is missing from the brief, so I'll print what the critic was actually handed.

Console output is swallowed in workerd, as noted in memory. I'll throw the brief out through an error instead.

The count is right: `home 3, prices 1`. The starter page's root keeps its own padding, so each page counts one extra spacing value. I'll correct the expectation and remove the debug throw.

zsh didn't split the file list (a known trap). Running it again with the list split properly.

Both pass. Now a wider node regression: every node suite that imports the files I touched, plus the priming-budget and design tests.

312 files, most of the node suite. I'll run them in two foreground batches with a JSON reporter, as noted in memory.

Now the baseline: the same failing files run in the main checkout, which is clean xgd-working.

The workers project has no new failures: all 16 also fail on clean xgd-working. Next, lint the changed files.

The repo has no linter, only `tsc`. Type-checking every project the change touches, tests included.

All three projects type-check clean. Before committing, I'll check the version-bump and promotion gate notes in memory.

The ticket body matches the implementation. Now the code commit on the branch, staging only my files.

Committed (`41750c7`). Now taking the merge lock and merging xgd-working into the branch, to see what has landed since the cut.

Only my ticket edit landed since the cut, so there's no code drift and nothing to re-test. Bumping the version on the branch.

The merge back was a fast-forward, and xgd-working's tip is my bump commit. Moving the ticket to `free_coded`.

It's at `free_coded`. Now tearing down the branch, run as its own call.

REQ-449 is done except the focal-crop check, which needs REQ-448's focal points. It's merged into xgd-working and the ticket is at `free_coded` (commits `41750c7` and `c6029f3`, version 0.2.624). The new tests pass in real Chromium and in workerd, and I found no new failures against a clean xgd-working.

**Layout checks.** They now take the site's design and the page's stored L1, both after a build and on the builder's page map. Every finding holds the hand-back.
- **Heading proximity:** already measured by the existing `heading` check, so I reused it rather than adding a second one. It has new tests.
- **Section vs block gaps (`gaps`):** every gap between sections must be larger than every gap inside a section, measured on what is drawn. It only applies to a site that has a design. Without that limit it flagged the bare fixtures in REQ-415 and REQ-418, whose sections sit 3–17px apart. Every real site has a design now, because REQ-447 migrates legacy sites.
- **On the grid (`edges`):** with a design, a section's content must sit at the content measure, the wide measure, or full width. Without a design, the old "matches most sections" rule still applies.
- **Rows (`rows`):** items side by side must line up at the top, and a picture beside a text panel (text in a drawn box) must match its height.
- **Off-system share (`off_system`):** reports a section where more than half its styled values are typed in rather than taken from the design. It comes from the stored page, so it's reported once, at desktop.

**Critic.**
- **Brief:** its second turn now gets the site's design and each page's off-system count. The first, stranger's-eye turn does not. The style lens asks whether each page follows this site's design.
- **Re-runs:** a new review falls due after a build that changes the design, or rewrites more than half of a page's sections since the last review. It never falls due while the last review's findings are still being answered.

**Decisions you may want to check:**
- **Old test assertion changed:** I edited one assertion in BUG-271's test. The critic's list of craft "nothing measures" no longer names spacing, section edges or column heights, because those are measured now. The ticket body records this as superseding that part of BUG-271.
- **Your call on the hold rule:** the first version let a fix build during a review's hold trigger another review, and REQ-438's test caught it. Builds that answer findings now never re-trigger. You may want the opposite.
- **Thresholds:** all starting values in `layout-check.json`, for example the 8px row-top tolerance and the 50% off-system share. The revision threshold (more than half a page's sections) is a constant in the critic code, not in `layout-check.json`.

**Test failures that aren't from this change:** 25 node and 16 workers tests fail the same way on clean xgd-working. Nine more builder-origin tests fail only in the worktree, with 503s for builder files that aren't present there; nothing I changed touches them.

The ticket body describes what landed and lists the crop check as still owed. I left `story_points` at 10.

<!-- xgd-turn id="6bbbb463-979c-49d1-bac7-1f892e9264e5-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T23:11:13.109516+00:00" -->
#### You
448 is finished, do you want to finish up now?

<!-- xgd-turn id="6bbbb463-979c-49d1-bac7-1f892e9264e5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T23:20:59.818668+00:00" -->
#### Claude
Yes. REQ-448 being done unblocks the last piece, the focal-crop check. I'll check what REQ-448 landed, starting with its ticket and the memory note on its `design_first` refusal.

Now the crop check in `layout-check.ts`: the materials' focal points join the layout context, the page gets the design and the focal points in one object, and the check itself.

Now the threshold, the about text, and the global's new name in the existing workers UAT.

REQ-448's UAT uploads a real photo through `/api/material` and the describer records its focal point. I'll reuse that setup to prove the host hands the material's focal point to the layout check.

The routes are clear. Next I need a way to place an uploaded material on the site so it records `placed_as`. Looking for a placement route.

Nothing was handed to the page, but the `edges` test in the same file passes, so the build itself probably went wrong. I'll surface the builder's tool results.

The builder doesn't have `place_on_site`. I'll have the consultant place the photo before commissioning the build.

It passes: the host handed the page `booth.png`'s focal point, 30% across and 70% down. Removing the debug line and running the REQ-449 suites and the regression set.

The workers set is green: 47 passed, 0 failed. Now the node layout suites.

All green: 91 node tests pass, and `tsc` is clean. Before updating the ticket I'll re-read its body, since the REQ-448 session may have edited it.

I'll edit only the sections that change: status, the crop law, the rubric note, the design-change trigger (REQ-448 moved it to the consultant's `set_design` and `choose_look`), and the test plan.

The ticket is updated. Now committing on the branch and landing it: lock, merge xgd-working in, bump, merge back.

Only tickets moved since the cut, so there's no code drift. Bumping and merging back.

It's merged into xgd-working. Now recording the two new commits on the ticket through the gate command, with the full SHA list.

Last, the memory note I wrote earlier names the old function and global, so I'm updating it.

REQ-449 is now complete. The focal-crop check has landed, the work is merged into xgd-working, and the ticket is back at `free_coded`. It records all four commits, the new ones being `588c2cf` and the bump `27899aa`, at version 0.2.626.

**What the crop check does**
- It looks at each picture cropped to its frame (`object-fit: cover` or `none`). It reports the picture when its subject falls outside the visible part.
- It also reports a subject within 10% of the frame's edge, but only where more of the picture is hidden on that side. So there's no finding when no better crop exists.
- The subject's position is the image node's own `objectPosition` if it sets one. Otherwise it's the focal point the describer recorded on the photo. That follows REQ-448's rule that a placement can override its photo's default.
- The finding tells the builder which `objectPosition` would frame the subject.
- The host reads the photos' focal points from the library, matched by each photo's file name on the site. That applies to both places the layout check runs: after a build, and the builders' page maps.

**This catches a real gap.** When a builder puts a photo on a page with `set_l1`, the photo's focal point isn't copied onto it, so it gets a centred crop. Only the client's own edit form copies it.

**Other changes**
- The critic's list of things "nothing measures for you" now holds only "a logo sized to read". I updated BUG-271's test assertion again to match.
- REQ-448's session had already moved the design-change trigger to the consultant's `set_design` and design looks, and updated my test for it. The ticket body now says so.

**Tests**
- New: a Chromium test where the crop cuts the subject off, one where it presses the subject against the edge, and one where the node's own framing keeps it.
- New: an end-to-end test where a photo is uploaded, the describer gives it a focal point, the consultant places it, and the builder puts it on the page. The layout check then receives that focal point.
- Results: 91 node and 47 workers tests pass with no failures, including the REQ-448 suites, and the type check is clean.

Builders can't call `place_on_site` themselves, so in that test the consultant places the photo. If you meant builders to have it, that's a REQ-448 question.

<!-- xgd-chat-end -->