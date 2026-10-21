---
uid: comment-9c913f76
id: COMMENT-5550
type: comment
title: Comment on request REQ-423
created_by: xgd
created_at: '2026-10-21T21:15:13.741062+00:00'
updated_at: '2026-10-21T21:54:48.084692+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-0ca14af3
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e1ef6189-adad-4058-a323-0d4dc291cf31",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="aef09b81-0bb7-4df6-aa0c-082d1098cd92-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T21:14:30.906115+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="aef09b81-0bb7-4df6-aa0c-082d1098cd92-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T21:19:13.685062+00:00" -->
#### Claude
Reading the surfaces and grant code to understand who holds what before scoping the change.

Still mapping the code: now looking at how a drawing becomes a Library item (REQ-404) on the Worker side, and what surfaces builders get.

Still investigating — now checking how generated pictures become Library items (to reuse that path for drawings) and how `screenshot` looks at a Library item.

Design is coming together (drawing becomes a `draw_image` op on the Library surface, reusing the generated-image material path). Checking the `screenshot` side for Library SVGs.

I've read the ticket and traced the code it touches. Two things in the ticket don't match the code as it stands, and how I resolve them changes the design. I'd like your call on both before I write anything.

**1. Builders can't place Library images today.** The ticket assumes builders "still place images (`place_on_site`)". They don't: since REQ-387 a builder gets the Library read-only, so it can read items but not place, re-role or delete them (`host-core.ts`, `readOnlyLibrary`). The consultant does keep `place_on_site` while it's commissioning, because the Library's grant travels with that surface and isn't narrowed.
- **(A), my recommendation:** the consultant draws, looks, places the drawing itself, and then briefs the builder with the `/assets/…` handle. No grant changes, and it's the same way every other Library picture reaches a builder now.
- **(B):** give builders the `PlaceOnSite` group. That reverses part of REQ-387's reasoning, because placing writes `placed_on` onto the client's material record.

**2. What happens to `write_image`.** Once builders lose it and the consultant draws into the Library, nothing needs `write_image` (which writes straight onto the site).
- **(A), my recommendation:** remove it from the L1 surface entirely, along with its group, its sequence and its talker entry. Add `draw_image` to the Library surface. It would:
  - run the same `validateSvg` check;
  - store the drawing through the same code path generated pictures use, so it gets a label (IMAGE-n), a description and indexing;
  - hand back a display line so the client sees the drawing.

  Every draw makes a new Library item. The ticket store can't swap a file on an existing item, so there's no in-place redraw.

  The cost: the existing tests that use `write_image` get ported or retargeted (security, display line, REQ-404's "every picture has a Library item", and the grant tests). We also lose REQ-209's `assert` (relation checks on write). `measure_drawing`, `relate` and `solve` still work on a drawing once it's placed on the site. I'd write the loss of `assert` into the ticket body as an explicit supersession of that REQ-209 acceptance criterion.
- **(B):** keep `write_image` declared but granted to nobody. That's dead code and a second way to draw, so I don't recommend it.

The rest I'll decide as I go:
- **"Look before using":** `screenshot` with `of.image` already shows a stored SVG whole. For "at header size" the consultant looks at the page after the drawing is placed.
- **Priming:** wordmark first, image generation for illustrated marks, hand-drawn SVG only for simple geometric marks.
- **Builder refusal:** a builder asked to draw refuses and points back to the consultant.
- **Talker:** `draw_image` goes on its withhold list.

If you're happy with 1A and 2A, say so and I'll scope the ticket and start.

<!-- xgd-turn id="6c16c694-8339-49b1-a924-475a3d927e69-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T21:20:44.151001+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="6c16c694-8339-49b1-a924-475a3d927e69-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T21:54:46.389954+00:00" -->
#### Claude
No answers to the two questions, and the note asks me to make implementation decisions, so I'm going ahead with my recommendations (1A, 2A). Scoping the ticket first.

Building now. First the Library surface: the declaration, then the operation.

Now the surface declarations. Writing the Library op and removing `write_image` from L1:

Surfaces done. Now the Library operation in `library-core.ts`:

Now the host side in `library.ts`, reusing `generatedMaterialStore` so a drawing is stored exactly like a generated picture.

Only Workers tests import `library.ts`, so it's safe to import `imagegen.ts` there. Adding the host's `draw`:

Now removing `write_image` from `toolbox-core.ts` and checking what else becomes dead code (`assetUrl`, `assertOnWrite`):

`assetUrl` (the drawing's display address on the L1 surface) exists only for `write_image`, so I'm removing that wire too rather than leaving it dead.

Fixing the positional callers in the REQ-313 tests, then the host-core / `ai.ts` / router wiring:

Removing the last stale `assetUrl` mentions from comments, then on to priming.

Code wiring is done. Now priming: the consultant's logo method and the builder's refusal.

Splicing the priming text into `priming.json` (both the with-corpus and without-corpus copies), editing the text directly rather than re-serializing the JSON:

Source changes are in. Typechecking the two packages next.

The fresh worktree is missing generated modules (known: a fresh worktree has no control-app `generated/` output), so I'm filtering the typecheck to the files I touched:

No type errors in the touched files. To run the Workers tests I need the generated modules, so I'm copying them from the main checkout (they're gitignored):

Typecheck is clean. Now finding every test that touches what changed and running them to see what breaks:

41 failures, all in tests that exercised `write_image` or the grants it was part of. Checking the two REQ-228 failures first, since they could be a real problem with the new declaration:

Next, the `write_image` story in `reconciliation-beyond-l1-authoring.test.ts`:

Retargeting this story: the CLI's `asset write` keeps the site-asset drawing path, so AC1104/1105/1107 prove it there, and AC1108 moves to the Library declaration.

That file passes now. Next is REQ-130:

REQ-130's three `write_image` cases duplicate AC1104/1105/1107, which now prove the site-drawing path through the CLI, so I'm removing those three and trimming the grant test.

Next, REQ-209 (measuring), which used `write_image` to put a drawing on the site:

REQ-209 passes. Now the remaining node failures — reading their assertion messages together:

Working through the remaining test fixes; two left in this batch. Checking whether the REQ-295 list mismatch is mine or was already there:

That REQ-131 failure happens on a clean tree too, so it isn't mine. Restoring my changes:

Now BUG-44 and the REQ-217 node test, which pinned `write_image`'s prose and display line:

Removing the now-unused fixtures from the REQ-217 test, then rerunning both:

Those pass. Running every node test that reads the changed declarations, priming or talker config:

29 failures, mostly in suites that start a local server, which the sandbox blocks. Checking the error messages to sort sandbox noise from real breakage:

Most of these are the known `logDir` upstream drift (Node host passes `logDir` where the framework now wants `junctions`). To be certain none are mine, I'm running the same files on a clean tree:

The baseline run printed no summary and the working tree now shows 28 changed paths instead of 26. Checking both before anything else:

The tree is fine: the two extra paths are test files I edited after the first count. Rerunning the baseline with its output captured:

zsh passed the file list as one argument (a known trap). Rerunning with it split properly:

The same 29 fail on a clean tree, so none are caused by this change. Now the Workers-side tests:

Likely my added priming text pushed the consultant's priming over its character cap, so a later passage got cut. Checking the cap:

Not a truncation (the cap is 200k characters). Checking whether this test fails on a clean tree:

REQ-416 also fails on a clean tree, so it isn't mine. The other three are. Reading them:

Now REQ-404, rewritten for the new path (draw into the Library, then place):

I'll reuse REQ-387's delegation harness for the builder-side UATs. First, confirming which priming entry the logo section landed in:

Writing the node UAT (priming, talker, grants):

The description writes "No script…" with a capital N; making the match case-insensitive:

Now the Workers UAT: what a delegated builder is really offered, and draw → look → place through the real routes.

All 4 pass. Now the full suite, to catch anything outside the files I targeted. Running the node project first:

The new-failure list is mostly build/serve suites that look timing-sensitive, but AC1255 (draft change journal) is plausibly mine. First, the working tree count went up by 4:

In isolation all the "new" failures pass except three that also fail on a clean tree. So the node suite has no regressions from this change. Now the full Workers suite:

Only AC1266 fails, which is the known `logDir` issue that also fails on a clean tree. Confirming the Library version bump took:

Both bumps are in. Before committing I'm checking my notes on how this project's `free_coded` gate handles the version:

Committed as `82bd97bd`. Taking the merge lock to land it on `xgd-working`:

The main checkout has other sessions' uncommitted edits, but none overlap my files. Merging:

The merge touches `module-assets.ts`, which I never meant to change. Test runs rewrite that file (a known side effect), so I probably swept it into the commit. Checking:

Confirmed: a test run's rewrite of `module-assets.ts` slipped into the commit. Nothing has been merged yet, so I'm restoring that file to its parent version and amending:

Merged. Running the ticket-overlay rematerialize step, then updating the ticket body before marking it `free_coded`:

Nothing to rematerialize (0 candidates). Re-reading the ticket before editing its body:

Ticket body is current. Moving it to `free_coded` (no `--version`, so the gate does the bump):

Status is `free_coded` with both commits recorded (my change plus the gate's version bump to 0.2.576). Cleaning up the branch and worktree:

I've implemented REQ-423 as described in my earlier message: the consultant now draws, builders no longer can, and every drawing is stored in the client's Library. The work is merged into `xgd-working` and the ticket is at `free_coded` with 8 story points; promoting it to reconcile is your call. One cleanup step is blocked: `xgd branch clean REQ-423` refused because another session (BUG-250) now holds the merge lock. Run it later, or sweep with `xgd branch clean --stale`.

**What changed**
- **Builders can't draw.** `write_image` is gone from the site-editing tools entirely, along with the pieces only it used. The builder's priming now says that if a brief asks it to draw, it refuses, says drawing is the consultant's, and builds the rest.
- **The consultant draws with a new `draw_image` tool on the Library side.** It keeps this while commissioning builders. The SVG goes through the same safety check as before; anything executable is refused whole and nothing is stored.
- **A drawing is a normal Library item.** It is saved the same way as a generated picture: an IMAGE-n label, the description as its body, the `.svg` file attached. The result includes a line the consultant pastes so the client sees the drawing in the conversation. It is not on the site until it is placed.
- **The consultant places it, not the builder.** I went with option 1A: builders still only read the Library. The consultant places the drawing with `place_on_site` and gives the builder the `/assets/…` address. I corrected the ticket where it said builders place images.
- **Priming:** the consultant's logo method is in: wordmark first, illustrated marks via image generation, hand-drawn SVG only for simple shapes, and look at the item and then at the header before building around it.
- **Talker:** `draw_image` is on the talker's withhold list.

**Things you lose or might notice**
- The `assert` check that `write_image` ran on save is gone. `measure_drawing`, `relate` and `solve` only work once a drawing has been placed on the site.
- Every redraw creates a new Library item (the ticket store can't replace a file in place), so iterating on a logo adds IMAGE-n entries.
- The ticket body lists explicitly which existing acceptance criteria and tests this supersedes: REQ-209's assert, AC1104–AC1108, and one REQ-343 test.
- `1c asset write` on the command line still writes an SVG straight onto a site.

**Tests:** 11 new UATs pass: 7 for the declarations, grants and priming, and 4 driving the real Worker routes. Those 4 check that a delegated builder is offered no drawing tool, that a drawing becomes a labelled Library item and placing it puts the exact bytes on the site, and that hostile SVG is refused with nothing stored. I updated the existing tests that drew with `write_image`.

The full suites still have failures, but none caused by this change. I checked by re-running the failing files on a clean tree:
- **Workers:** the same 11 tests fail before and after.
- **Node:** 77 failures are already there on a clean tree (mostly the known `logDir`/`junctions` mismatch with the framework). A dozen more failed only during the full run and passed when re-run alone. One genuine break, from the shape I removed, was fixed before merging.

<!-- xgd-chat-end -->