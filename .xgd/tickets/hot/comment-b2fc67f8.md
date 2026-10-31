---
uid: comment-b2fc67f8
id: COMMENT-5704
type: comment
title: Comment on request REQ-461
created_by: xgd
created_at: '2026-10-25T23:36:28.755790+00:00'
updated_at: '2026-10-26T00:27:18.048080+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-82f960f5
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "6e9cbcff-7861-4cad-996e-8778dcd166e6",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="3b506cd5-8476-406a-976e-51b247239f02-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T23:35:50.440522+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="3b506cd5-8476-406a-976e-51b247239f02-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T00:27:17.241009+00:00" -->
#### Claude
Framework REQ-220 (the blocker) has landed, so I'm mapping the 1stcontact side (imagegen wiring, L1 image node, renderer, capture, spend) before cutting a branch.

Good — `ai-videogen` is already installed in the shared store. Now looking at how `generated/` is produced and the L1 image node.

Blocker is cleared (framework REQ-220 is free_coded and installed in the shared store). This is multi-part work, so I'll cut a branch and set status.

Now I'll research the control-app wiring in parallel while I read the L1 image node myself.

Reading the renderer's existing framework-owned runtime scripts (reveal/zoom) to model the video runtime on them.

Capture side plan: add `video` to the capture's media candidates, record src/poster/playback markers, and branch the fold's media leaf into a `video` node. Checking the element type fields next.

I have enough on the L1 side to start writing the schema while the research agents finish.

Writing the `video` node schema now.

Now wiring the node into the union, types and the validator.

Site-schema typechecks. Now checking the repo-wide typecheck to find exhaustive `kind` switches that need a `video` case.

Only two exhaustive switches to fill. Looking at both.

Probes treat a clip's layout like a picture's. Now the renderer case — reading the top of `emitNode` for its local variables.

Writing the renderer case plus the framework-owned runtime script.

Now the renderer edit itself.

The priming agent's map is in: guidance should go into host-side parameter text (outside the priming budget), and assets/talker/slow-tools need entries. Checking what `ai-videogen` exports.

Disclosure will be a once-per-business refusal through the declared `invalid_request` error, so the model has to tell the client before the first paid call. Meanwhile, finishing L1 asset resolution.

Need the session at progress time. Checking whether the router's host is per session or per business.

No call context in the toolbox. Looking at how host-core tracks in-flight slow tools (`workingNotes`) to add a narrow heartbeat seam.

I'll add a narrow `slowToolHeartbeat(deps)` seam in host-core that re-posts the live consultant turn's working note as model-sourced progress. Reading the helpers it needs.

Heartbeat seam typechecks. Now the spend path — reading how the report aggregates rows.

I'll use the tenant's atomic `nextCounter` for both the per-site clip cap and the once-only disclosure, so no new schema is needed. Checking how upstream maps errors thrown from the backend.

Now the `generated/` shims for `ai-videogen` and `videogen` in the asset build.

Writing the generated shim files into the worktree by hand (gitignored; same content `1c assets` would emit) rather than running the full asset build.

Shims resolve. Now refactoring `imagegen.ts` to share its generated-fields and material-reader halves with the video store.

Refactor is behaviour-preserving. Tidying the now-orphaned comment above `...reader`.

Now the `video` material kind.

Writing the media-spend writer in `spend.ts`.

Spend path typechecks. Now writing `videogen.ts`.

Now wiring into `router.ts` and `workerHost`.

Editing `ai.ts` and `router.ts` to compose the clip surface.

Router wiring typechecks. Now `talker.json`, `slow-tools.json`, and the deploy secret hook.

Writing the `FAL_KEY` deploy hook and its capability probe, mirroring the OpenAI one.

Now `slow-tools.json` and `talker.json`.

Now resolving clip `src` and `poster` in the L1 asset localiser.

Now capture → fold round-trip. Checking the element type the fold's media path reads (`widest`).

Adding a carried `video` substance through the capture chain (raw field → capture field → manifest element), defined once in `types.ts`.

Capture fields project through the value-axes registry, so a carried `video` axis covers both sides. Making those edits now.

Capture chain typechecks. Now the fold: emitting a `video` leaf when the media element carries a clip.

Everything typechecks. Moving to tests — first looking at the REQ-217 workers test for the setup pattern, and at the framework's fake fal transport and fixture clips.

I'll copy the framework's fixture clip/poster bytes into a local fake-fal test double (the external boundary) for the workers suite.

Writing the control-app workers UATs.

Six of seven pass; the one failure is my regex matching "falls" in the filename. Fixing the assertion.

All seven tool UATs pass. Now the L1 node UATs: envelope security/robustness, renderer output, and the runtime script under jsdom.

All 11 node UATs pass. Now the capture round-trip — finding an existing render → capture → fold test to model on.

Round-trip passes in real Chromium (ran, not skipped). Now the BUG-48 rule-provocation table and the related existing suites. First, BUG-48.

Memory says this test was already red from REQ-335 rules without provocations. Checking which keys are missing, to confirm none are mine.

Only the eight pre-existing REQ-335 rules lack provocations; my three are covered. Now running the existing suites most likely affected.

Hit the long-filter limit from memory (~60 paths finds nothing). Splitting into batches.

Five failures to triage. Pulling their messages.

REQ-146 looks like mine (the `console.error` in `videogen.ts`). Baselining the other four against clean xgd-working in the main checkout.

The four are pre-existing on clean xgd-working. Checking REQ-146 against the baseline too.

All five failures are pre-existing on clean xgd-working. Now the related workers suites in batches.

REQ-386 is mine (its expected slow-tool list needs `AnimateImage`). Baselining REQ-208, REQ-295, REQ-416 and REQ-431 on clean xgd-working.

All four are pre-existing. Updating REQ-386's slow-tool list to include `AnimateImage`.

Now the priming budget: in production `FAL_KEY` will be set, so the clip surface's summary text will count. Checking BUG-129 with `FAL_KEY` in its deployment env.

Still ~207 chars over. Measuring the baseline without `FAL_KEY` to see what the clip surface itself costs.

Baseline headroom is only 39 chars, and the clip surface now adds ~246. Checking exactly what the summary-level manual projects per surface.

The summary manual skips an empty overview. I'll drop the overview at summary level entirely (its paragraph already moves into the op description) and measure again.

The clip surface still adds ~202 chars against 39 of headroom. I'll fold the group text into the op summary (one line), then look for an existing priming paragraph to tighten so the net change fits.

The logo paragraph is heavily pinned by REQ-423, so I'll look elsewhere. Scanning the consultant priming for lines no test pins.

That paragraph pins only "One thing is not a framework concept" and "IMAGE-5". Tightening its tail (meaning kept) and making the clip's summary block minimal, then re-measuring.

One char over. Shortening the summary line to "A slow, paid hero clip from a stored picture."

With `FAL_KEY` set the consultant priming measures 99,986 of 100,000 (net +25 chars vs. today). Re-running the pinned priming suites, then looking at Range support on the public site.

Adding byte-range support to the public site's asset serving (Safari won't play an mp4 inline without it). Checking for an existing public-site test harness first.

The fake R2 bucket in the test fixture has no range support; I'll use R2's native `range` option in the Worker and teach the fake bucket the same (it stands in for the external R2 boundary).

Now a UAT for ranged serving of a published clip.

Range serving works and the existing public-site suites still pass. Checking that adding clip files to `l1AssetReferences` doesn't make the publish try to build image renditions for an mp4.

Asset references only feed the digest and the held-asset check, which is exactly what a clip and its poster should go through. Checking the design-token check covers a clip's `aspect`.

The aspect check is kind-agnostic. Checking the L1 reference projection covers the new node and rules (`l1VocabularyGaps`).

Only the pre-existing BUG-48 failure. Now the broader render/capture/fold suites, in batches.

167 suites — launching them detached in sequential batches and polling the results.

The batch runner is going. Meanwhile, the version bump and ticket. Reading my notes on the free_coded gate.

While the suites run, updating the ticket body: keeping the original spec, refreshing the stale Status section, and appending an as-built section with the design decisions.

Ticket body updated. Checking the L1 batch progress.

Collecting failures for a single baseline run once the batches finish. Meanwhile reviewing the full diff.

Checking that the pre-existing scope-rebrand failure didn't gain an offender from my files.

Same nine offenders in both, so nothing new from me. Re-reading the edited declaration section of `videogen.ts` for coherence.

Reads correctly. Checking batch progress again.

Three of nine batches done. While waiting, updating the priming-budget memory with today's figure.

Waiting on the remaining batches with a monitor.

Waiting on the batches; I'll triage failures against the clean baseline once they land.

Five of nine batches done; waiting for the rest.

Six of nine batches are done.

Seven of nine batches are done.

Eight of nine batches are done.

Baselining those 11 suites on clean xgd-working.

All 12 failures are identical on clean xgd-working, so none are mine. Committing the work on the branch.

Now lock, bring xgd-working in, bump the version, and merge back.

Clean merge. Quick typecheck and my UATs on the merged tree before committing the bump.

Merged. Moving the ticket to free_coded.

Ticket is free_coded with both commits, version 0.2.653, 13 points. Cleaning up the branch.

The main checkout's gitignored `generated/` folder doesn't have the two new shims yet, so anything that imports `videogen.ts` there would fail until `1c assets` runs. I'll write the same files there.

REQ-461 is built and merged into `xgd-working`, and the ticket is at `free_coded` (2 commits, version 0.2.653, 13 points). Its body keeps your spec and now has an "As built" section listing the design decisions. Parts 1–3 are done; **the pilot (part 4) is not** — it needs a real `FAL_KEY` on dev, and I couldn't run it from here. You didn't have any questions to answer up front: framework REQ-220 had already landed and was installed, so nothing was blocking.

**The `video` page element**
- **Validation:** the clip must be an `.mp4` or `.webm` and the poster is required. Unsafe URLs, unknown keys and an out-of-range `restMs` are all rejected. Muted, inline, no controls and no audio are not settings, so nothing can turn them on.
- **Reduced motion:** the clip is gated on the visitor's motion preference in the HTML itself, so a visitor who turned motion off gets only the poster and the clip is never downloaded. No script is needed for that.
- **Runtime script:** a small framework-owned script handles `restMs`, `once_per_session` and `in-view`, and is only added to pages that use them.
- **Round-trip:** capturing a rendered page and folding it back gives the same element. I checked this in a real browser.

**The clip tool (consultant only)**
- **No key, no tool:** without `FAL_KEY` the tool doesn't exist and the deploy still goes ahead. A key fal refuses fails the deploy. That probe's assumption about how fal answers hasn't been checked against the live service.
- **Storage:** a clip is saved as a `video` material, and its last frame as a separate `image` material used as the poster. Each goes on the site through the Library's existing placement.
- **Disclosure:** the first request for each business is refused, with the sentence the consultant should say (the photo goes to an outside AI service, and roughly what it costs). The next request goes ahead.
- **Per-site cap:** 20 clips per client business, counted before the provider is called. I picked 20 because your epic left the budget open.
- **Spend:** each clip is its own row in `turn_spend`, so its cost appears in the spend report under `media`. It adds nothing to engaged time.
- **Heartbeat:** a new heartbeat keeps the consultant's turn alive while the provider is polled.

**Things I added that the ticket didn't ask for**
- **Safari playback:** the public site now serves files in byte ranges. Without that, Safari won't play an mp4 on the page.
- **Priming budget:** the guidance (one subtle clip per page, say the cost first, how to place it) went into the tool's own description, which doesn't count against the budget. Even so, with `FAL_KEY` set the tool's one-line manual entry pushed the consultant's priming over 100,000 characters. I shortened the tool's titles and summary and tightened one sentence about the "IMAGE-5" catalogue number without changing its meaning. It now measures 99,986 of 100,000, and the budget test now runs with `FAL_KEY` set.

**Tests:** 20 new UATs pass, along with REQ-386, BUG-129 and BUG-48 after updating them. About 300 related existing suites were run. Every failure among them also fails on clean `xgd-working`.

**Decision for you:** the consultant's priming says "the top banner stays still, nothing slides or spins". A hero clip contradicts that. I left the line alone; the only steer is "subtle, at most one" in the tool description.

**To run the pilot:**
1. Add `FAL_KEY` to the dev secrets file.
2. Run `bin/deploy --env dev`, which also writes the two new `generated/` files. I wrote them by hand into the main checkout so it already works locally.
3. Make Dina's pepper reveal (`once`) and Ariel's Old Scratch fire loop, and compare the loop against `scratch-flicker-2.svg`.

<!-- xgd-chat-end -->