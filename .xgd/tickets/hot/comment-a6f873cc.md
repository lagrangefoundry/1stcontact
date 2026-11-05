---
uid: comment-a6f873cc
id: COMMENT-5607
type: comment
title: Comment on request REQ-448
created_by: xgd
created_at: '2026-10-24T20:21:51.108189+00:00'
updated_at: '2026-10-24T23:09:03.798114+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-baeb116a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "977fb49c-ffe1-4d6f-882d-3d6f48ca2515",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="21f63cf8-3caa-4113-8410-9a9f2183623d-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T20:20:53.344440+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="21f63cf8-3caa-4113-8410-9a9f2183623d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T20:25:04.619049+00:00" -->
#### Claude
Checking how much of this depends on REQ-447: its worktree has no code yet. Next, a quick scan of the existing pieces (plan tools, Looks, describer, Debug tab), so my questions are concrete.

I haven't written any code. One thing blocks the start, and two design points need your call before I build.

**1. REQ-447 isn't built yet, and this ticket needs it.** REQ-447 is marked `free_coding` and its branch `free-REQ-447` exists, but it has no commits or changes yet. Most of this ticket runs on its pieces:
- `set_design` validates with REQ-447's validator.
- Builders are told to build with REQ-447's names (`role`, `space`, `width`, `component`, `aspect`).
- Blocking builder writes to `textStyles` / `theme` only means something once REQ-447 replaces those paths with `site.design`.
- Looks map onto parts of the design, and the Debug tab shows the design object.

Building now would mean guessing REQ-447's schema shape, file locations and function names while another session writes them, then redoing the work when it lands. **My recommendation: start this ticket once REQ-447 is merged into xgd-working.** If you'd rather run them in parallel, I'd only do the parts that don't touch the schema: photo focal point in the material describer, the logo ink-height and palette seed, and the consultant priming text. Everything else would wait.

**2. Focal point conflicts with an earlier decision.** `apps/control-app/src/material.ts:2761` says there should be no focal point on the material, because it belongs on the L1 image node with the per-placement framing. `packages/site-schema/src/schema.ts:1227` records that an earlier `focalPoint` field was removed because nothing read it. This ticket asks the describer to record a focal point on the material when a photo is added. The reason given then no longer holds, because REQ-447's `aspect` crops will read it. **My recommendation:**
- The describer stores a default focal point on the material.
- The L1 image node can override it for one placement.
- The renderer uses the node's value if set, otherwise the material's.
- I'd rewrite both comments to match.

OK?

**3. Today's Looks change more than palette and fonts.** A Look today is a whole copy of one page. `choose_look` gives the page "everything the look changed", which can include layout, and it refuses only when the words or pictures differ. This ticket makes a Look a variant of the whole site's design, and says existing looks map their palette and fonts onto it. **My recommendation:**
- New Looks are design variants only: one set for the whole site, and choosing one replaces `site.design`.
- The existing per-page look sets keep their current behaviour unchanged, rather than having layout changes squeezed into a design.
- The consultant's priming points only at the new kind.

Or do you want the old per-page Looks removed entirely? That would be simpler, but anything already sitting in a site's Looks tab would go.

Once you answer these, and REQ-447 has landed (or you tell me to go ahead in parallel), I'll fill in the ticket body, cut `free-REQ-448`, and build it.

<!-- xgd-turn id="03bb3b5c-c28a-4c2b-b804-84b641087f64-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T20:29:50.627540+00:00" -->
#### You
We want the same Looks UX, but I love the idea that a look is just a change to the design pattern lets do that

<!-- xgd-turn id="03bb3b5c-c28a-4c2b-b804-84b641087f64-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T20:30:29.956762+00:00" -->
#### Claude
REQ-447 is still in progress: one new file, nothing committed. I'll record both decisions in the ticket now, so the scope is settled before any code.

Done. A look is now just a change to the design, and the Looks screens stay as they are. Both decisions are in REQ-448's ticket body:

- **Looks:** the Looks tab, carousel and band, `show_client` → `looks`, and `choose_look` with the client's words and the "Before …" undo all stay the same. Underneath, a look holds a version of `site.design`, not a copy of a page. Choosing one changes the site's design, so every page updates at once, and "Before …" puts back the previous design. A look can't change words, pictures or layout, so `choose_look`'s `CONTENT_CHANGED` refusal no longer applies to these looks. Existing look sets map their palette and fonts onto the design.
- **Focal point:** you didn't object, so I took my recommendation. The photo's material record holds a default focal point, and an image node can override it for one placement. I'll rewrite the two older comments that said there should be none.
- I added two test-plan lines to match: choosing "Before …" restores the previous design, and an `aspect` crop uses the focal point.

**Still open: waiting for REQ-447.** Its branch has one uncommitted new file (`design-names.ts`) and no commits, so the design schema, validator and renderer this ticket builds on don't exist yet. Unless you say otherwise, I'll start once REQ-447 is merged into xgd-working. At that point I'll cut `free-REQ-448`, set the status to `free_coding`, and build against its real names.

If you'd rather I start now, I can do the parts that don't depend on its schema first: the focal point in the material describer, the logo ink-height and palette seed, and the consultant's priming text.

<!-- xgd-turn id="430653a6-d801-44de-81af-670b974610c0-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T22:10:19.264138+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="430653a6-d801-44de-81af-670b974610c0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T23:09:02.164953+00:00" -->
#### Claude
REQ-447 has landed and is at `ready_to_reconcile`. Next I'll read what it built.

Everything this ticket needs from REQ-447 is on xgd-working. Starting the free-coding steps.

The worktree is set up. This ticket touches several separate areas, so I'll map them in parallel.

While those run, I'll read the design schema myself, since every part of this ticket uses it.

I've read the design schema. Waiting for the three maps.

Still mapping the code: reading how settings are written while the three background maps finish.

Reading the consultant's priming text to see where the new design guidance should go.

Still reading the current Looks code; the background maps of Looks, plan tools and the describer are due back shortly.

I've worked out how a design look could be stored and drawn. Waiting on the three maps before deciding.

Waiting for the code maps to finish.

The Looks map is back. Waiting for the other two.

Still waiting on two of the three background maps: plan tools and Delegate, and the describer and Debug tab.

The describer and Debug-tab map is back. One map left.

All three maps are back. My build plan:

- **Plan tools:** `read_design`, `set_design` and `offer_looks`. `set_design` writes a marker on the plan.
- **Delegate:** before the first build, Delegate is refused until the design has been written.
- **Builders:** their `set_config` refuses writes to `design`, `theme` and the old text-style keys.
- **Looks:** a look holds a design, choosing one swaps the site's design, and the Looks screens are unchanged.
- **Measured seed:** photo focal points, logo ink height and a starting palette.
- **Debug tab:** shows the design.

First, checking how many existing Delegate tests the new refusal would affect.

The priming budget is about full, so new wording has to be paid for by cutting elsewhere. Starting with the schema: a look carries a design.

Rewriting the look-making function so each look carries a design variant instead of a page copy.

Now the choose path: choosing a design look swaps the site's design.

Now the renderer: a design look is drawn as its page, in the look's design.

Next, builders' `set_config` refuses design writes. Checking how the tool surface declares error codes.

Builders' `set_config` now refuses design writes. Next, I'm wiring the tool declarations and removing the old page-copy look tool.

Now the plan-surface tools for the consultant. Reading the `choose_look` implementation to copy its pattern.

I'll record "design written" inside the plan's existing `milestones` field, so `PLAN_KEYS` doesn't change. Writing the plan ops now.

Adding the `look_list` type to the plan surface and removing the now-unused one from the builder surface.

Next, connecting the new ports in `host-core`.

I'm adding focal points to the material describer. Checking first whether there's an existing image-size reader to reuse.

Writing a small image-size reader (PNG, JPEG, GIF, WebP) in `png.ts`, and adding focal points to the describer.

Exposing the new photo facts on Library rows so the seed and placement can read them.

Rewriting the old "no focal point on the material" comments, as recorded in the ticket.

Now the measured seed. Finding how edit code reads a site's asset bytes.

I'll pull the opaque-box scan out of `trimTransparentEdges` so the logo-ink measurement reuses it rather than copying it.

Writing the seed module: logo size and ink, photo sizes and focal points, and a palette from PNG pixels.

Wiring the design port and `offer_looks` into `host-core`.

Adding the Delegate check that refuses a first build until the design is written. Now hooking it into the host.

The code typechecks clean. Next, the Debug tab shows the design.

Adding the read-only design section to the Debug pane.

Now the priming text. Reading the exact passages to replace.

Measuring the priming budget against the BUG-129 test.

The session no longer opens, so something in my declarations is probably rejected. Checking with a smaller plan-surface test.

The priming comes to 99,420 characters, under the 100,000 cap. Now running the related suites to see what my changes affect.

These failures are the expected ones. Looking at the REQ-130 and REQ-420 cases.

Switching REQ-420's design writes to the operator CLI, since builders can no longer write the design.

Next, rewriting the REQ-391 node suite for design looks.

Writing the new REQ-391 node file with fixture-seeded design looks.

Next, the workers suites. First, a test helper that marks a plan's design as written, for the existing Delegate tests.

Many of these will be the new refusal. Taking a baseline of the same suites on the clean main checkout to separate my failures from pre-existing ones.

Only REQ-416 line 397 was already red on the clean checkout; the rest are mine, mostly the new refusal. Finding where each Delegate suite seeds its site.

Now inserting the helper after each seed in the Delegate suites.

My helper landed in a test that builds its own plan by hand; removing it there.

Now my own UATs. Reading the REQ-436 harness, which has a scripted builder, to copy its shape.

Writing the REQ-448 UATs now. Checking the starter document's shape so the fixture validates.

Three fixable failures. Checking the upload response's shape.

Four of five pass. The upload response doesn't carry the new fields, so I'm checking what the route returns.

The workers suite passes (5 of 5). Now the node UATs: builders refused, and the Debug tab showing the design.

The Debug tab test passes, and it really ran (not skipped). Next, the builder refusal UAT.

The new UATs pass. Running the full suite as regression. First, the notes on how to batch it.

I'll run the whole node project in three batches, as before.

35 failures. Baselining those same files on the clean main checkout to find which are mine.

Every failure that's red only in my worktree is a builder/webui origin test — the known artifact of where a worktree sits. Running the UAT files in two halves.

Only BUG-134 is new in this batch. Checking whether that's the worktree's location or my change.

Environmental: BUG-134 depends on a local secrets file, not on my code. Running the second UAT batch.

Only REQ-350 is new: it writes the design through the builder's `set_config`. Updating it the same way as REQ-420.

The node project is clean apart from baseline and location artifacts. Now the whole workers project.

Many more Delegate tests hit the new refusal; they call Delegate a different way. Checking how they seed.

About 40 suites now, so I'll apply the same mechanical insertion across every workers suite that delegates.

Explicit seeding beats a hidden default in `seedTenantSite`, and the edit is mechanical, so I'll script it.

The remaining failures look pre-existing; REQ-295 is on my list of suites that fail on clean working. Confirming against the base.

Pre-existing. Second workers batch next.

Both workers batches match the baseline. Re-running the typechecks before committing.

Clean. Before committing, reading my notes on this project's free_coded gate.

Everything's verified. Updating the ticket body with what landed, keeping the existing content.

Ticket updated. Committing on the branch.

Committed. Taking the merge lock and merging back into xgd-working.

REQ-449, which judges pages against the design, landed meanwhile. Resolved the import conflict; now checking that the merged result still typechecks and passes.

REQ-449's new workers suite fails after the merge, probably on my changes. Checking why.

REQ-449's suite passes (4 of 4). REQ-449 also added priming text, so re-measuring the budget after the merge.

Still 99,420 characters. Committing the merge and the REQ-449 adjustment on the branch.

The rebased tree differs from the pre-rebase one in `plan-core.ts` and the REQ-449 test. Checking what the last commit holds.

No difference: that stat output came from `git show`, and the trees match. Fast-forwarding xgd-working.

The rematerialize path the lock printed doesn't exist (a known quirk); using `xgd ticket-store rematerialize` instead.

Nothing to rematerialize. Moving the ticket to `free_coded` with both commits, letting the gate bump the version itself.

Now `free_coded`, at version 0.2.625. Cleaning up the branch.

Done. Saving one note for future sessions: workers tests that delegate on a fresh site now need the design marked as written.

REQ-448 is implemented, merged into xgd-working and parked at `free_coded` (version 0.2.625). It has two commits plus the automatic version bump, and the ticket body records what landed.

**What changed**
- **The consultant writes the design.** It has three new plan tools:
  - `read_design` returns the design plus what the host measured: the logo's size and visible ink height and aspect, each Library photo's size and focal point, and up to six colours drawn from the logo.
  - `set_design` writes groups of the design, checked by REQ-447's validator; an invalid design is refused with the reason and nothing is written.
  - `offer_looks` offers looks to the client.
- **The first build waits for the design.** A first `Delegate` on a site whose design hasn't been written is refused, with a message telling the consultant to write it first. A site that already had a first build isn't blocked.
- **Builders can't change the design.** Their `set_config` refuses `design`, `theme` and the old text-style keys, saying the design is the consultant's and to report anything missing. You can still change it from the command line with `1c config set`.
- **A look is a version of the design, with the same Looks UX.** A look holds only a design and is drawn from the client's real page as it stands now. Choosing it replaces the site's design, so every page changes at once, and "Before …" puts the old design back.
  - The builder's `make_alternatives` tool is gone; page-copy looks already stored on a site can still be chosen.
- **Photos get a focal point.** The describer now records it, along with the image size, when a photo is added. Placing a photo copies the focal point onto the picture, so crops keep the subject in frame.
- **The Debug tab shows the design** and anything wrong with it. Like the rest of that tab it isn't restricted to the operator yet.
- **Priming:** the consultant's design guidance and the old Looks section are merged into one section, and the builder's priming says to build with the design's names. The consultant's priming is 99,420 characters against the 100,000 limit.

**Tests**
- The three new REQ-448 test files pass, and the full node and workers projects pass apart from failures that are also red on a clean checkout. The handful of failures only in the branch checkout are builder/web-UI origin tests that depend on where the checkout sits, plus BUG-134, which needs a local secrets file.
- About 45 existing workers tests that start a build on a fresh site would now hit the new refusal. Each now calls a test helper that marks the design as written, so they still test the build rather than the refusal.
- REQ-420, REQ-350 and REQ-130 used to write the design through the builder's `set_config`; they now use `1c config set`.

**Changed in another ticket's code**
- REQ-449 landed while I was working. Its "review is due after a design change" rule only fired after a build, and builds can no longer change the design. It now fires after `set_design` or choosing a look, and I updated its test to match.

**Things you may want to change**
- Builders can still edit palette entries, and design colour roles can point at them, so a builder can still recolour the site indirectly. Say if you want palette writes treated as part of the design.
- Colours are only read from PNG images. JPEG photos still report their size and focal point but add no colours.

<!-- xgd-chat-end -->