---
uid: comment-6d0d2af6
id: COMMENT-4884
type: comment
title: Comment on bug BUG-198
created_by: xgd
created_at: '2026-10-04T15:22:37.203170+00:00'
updated_at: '2026-10-04T15:32:29.422131+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-24c5e78b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "746bca88-d45f-4183-bf43-784f790a64ce",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="aeaf6935-cb4a-44a2-a2d3-afd0fba136e9-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T15:21:13.936663+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="aeaf6935-cb4a-44a2-a2d3-afd0fba136e9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T15:32:29.359300+00:00" -->
#### Claude
Reading the extractor and the values-diff code to confirm both root causes before scoping.

Both root causes confirmed in the code. Now I'm finding the diff entry point so I can prototype the change against the real manifests.

Reading the textless-field pairing loop in values-diff to decide where an unmatched panel can be paired against the reproduction's run surface.

Design settled; checking every map a new delta property must be added to.

Design decided. Recording it on the ticket, then cutting the branch.

Now implementing item 1 (pair an unmatched panel field against the reproduction's run surface).

Now wiring the fallback into the textless pairing loop.

Tracking down why the fill-presence comparison doesn't fire on the header run. Something filters it after the text pass.

The reference simply didn't record `surfaceFill` on that run (it's absent, not `null`), so the presence check correctly stays quiet there. Removing the debug line.

Writing the resolution into the ticket before the UATs, so every test traces to ticket language.

All 8 pass. Checking they fail against the unfixed code, then running the regression scope.

Many whole-file failures. That looks like a load error rather than an assertion failure, so checking one directly.

That's the known fresh-worktree gap: `apps/control-app/src/generated` is a build artifact. Copying it in from the main checkout, which is gitignored and not committed.

The two remaining failures (REQ-180 `/api/plan` route and BUG-64 composer gating) are known pre-existing failures unrelated to values-diff. Running a typecheck next.

Typecheck is clean. Bumping the version and committing.

Committed. Now taking the merge lock and landing it on xgd-working.

I fixed both items in BUG-198, and both changes are only in the values-diff. On the stored hearingzone510 manifests, `unmatched` drops from 2 to 0, the two CRITICAL `missing` deltas are gone, and the header run now reports a surface delta. The ticket is at `free_coded` at version 0.2.482, and the branch is merged into xgd-working and cleaned up.

**Item 1: the testimonial panels.** When a reference panel finds no matching field on our side, it now pairs with the painted surface behind our text runs if the two boxes overlap enough. I chose this over changing the extractor. Recording plain coloured boxes as fields would also change what the fold builds on reference pages, which is a much bigger change. After pairing, the panel is compared on fill, position and size like any other field, so a wrong colour or rect still reports. A panel with no overlapping surface on our side still reads as `missing`.

**Item 2: surface extent.** There is a new `surfaceBox` delta (HIGH), and every text run's object card now has a `surface` row showing both sides' surface rect.
- **Left and right edges only (4px tolerance).** I first compared all four edges as the ticket suggested. That added 40 HIGH deltas over identical pixels, because our reproduction builds one reference band as a stack of slabs with the same fill. Comparing only the sides leaves exactly one new delta on this bundle: the header run, `(0, 0) 1280×40 → (464, 8) 352×23`.
- **Fill on one side only.** A surface fill that both sides measured but only one paints is now a delta. It doesn't fire on this bundle, because the reference never recorded a fill for the header run.

**Evidence:**
- **New tests:** 8 tests in `tests/test_UAT_FC_BUG-198_surface_pairing_and_extent.test.ts`; 6 of them fail without the fix.
- **Regression run:** the values-diff, surface, gate, BUG-190/197 and REQ-370/377 suites all pass except two failures already known before this change: REQ-180's "no plan or billing route" test and BUG-64's composer gating test.
- **Typecheck:** clean.

The bundle numbers come from running the diff directly on the stored manifests. The `values-diff.json` file in `storage/tmp` hasn't been regenerated, so the ticket's "See it" one-liner will still print `2 2` until the gate is re-run:
```
CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-www-hearingzone510-com --ref storage/references/www.hearingzone510.com/index --sandbox
```

The ticket body now has a Resolution section and a Test plan, story points are set to 3, and promoting it to `ready_to_reconcile` is up to you.

<!-- xgd-chat-end -->