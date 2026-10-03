---
uid: comment-c8bd4759
id: COMMENT-4866
type: comment
title: Comment on bug BUG-188
created_by: xgd
created_at: '2026-10-03T22:53:12.660269+00:00'
updated_at: '2026-10-03T23:05:23.485688+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-144e5246
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "25c3f906-b6ca-4d2a-b5b7-cc60cb3e732e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="78fea415-7b48-4d77-acad-b97fb3cd28da-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T22:52:00.267878+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="78fea415-7b48-4d77-acad-b97fb3cd28da-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T23:05:22.233609+00:00" -->
#### Claude
Reading the layout model in `probes.ts`. Next I'll check the served CSS from the reproduction to confirm when the browser collapses margins.

Reproducing the reported gate output first.

Reproduced: `maxDelta 0.009`. Now dumping the model's boxes at 1280 for the served document to diagnose the 575.75px gap.

Tracing where the gate's `at 1280px×768px:` finding prefix is written, so I can mark findings that were made under perturbed content.

Working out the CSS margin-collapse rules the renderer's output triggers. Then I'll update the ticket body and start coding.

I have enough to scope this. Appending the diagnosis and plan to the ticket and leaving the filed body as it is.

Ticket updated and set to `free_coding`. Cutting the branch.

Implementing in the worktree. First checking every call site of `layout(`.

Now the edits to `layout` / `layoutInFlow`.

Now passing the flow slot to children.

Running the probe harness against the worktree's code.

The model now matches Chromium: backdrop-0..box-1 at y 84 / 1050 / 1562 / 2077 / 2637, the same numbers Chromium reported. Running the gate.

The fresh worktree is missing the generated control-app artifact (a known gap). Copying it in from the main checkout; it's gitignored.

Next, the second fix: the finding sentence should name the content scale.

Two follow-ups: close the new arrow-function block correctly, and make `escapesOnly` carry `contentScale` through (the gate filters robustness findings through it).

Now the UAT. Looking at how an existing test builds an L1 document by hand.

Writing the UAT file. It builds L1 documents by hand and drives `evaluateLayout`, `sampleFidelityProbe`, `contentRobustnessProbe` and `layoutCollisions`.

Removing a leftover helper I didn't use.

All 5 pass. Checking they fail without the fix: setting the production diff aside, running, then restoring it.

Without the fix, the 4 positive UATs fail and the negative one passes, as intended. Now the regression scope: every suite that touches the model or the gate.

Only 5 stored references. Running the gate on each, old against new.

Only bluelotus changes; the other four bundles are identical, old to new. Running typecheck and lint.

Typecheck is clean. Before committing, reading my notes on this project's version-bump procedure.

Committing on the branch: the two source files and the UAT only.

Committed `68dc6f71d5`. Taking the merge lock and merging into `xgd-working`.

Merged. Updating the ticket body with what actually landed (including the effect on `chooseRecovery`) before the `free_coded` gate.

Status is `free_coded` at version 0.2.463. Releasing the lock and tearing down the branch.

BUG-188 is fixed and the ticket is at `free_coded` (commits `68dc6f71d5` plus the automatic version bump to 0.2.463, 3 story points). The branch is merged into `xgd-working` and cleaned up.

**Issue 1 was a real gap in the layout model, and it's fixed.** The renderer draws every `container` as flex or grid, where margins don't collapse. But a `box` with children, and the page root inside `body`, are plain blocks, where a first child's top margin passes up through the parent. The model didn't do this, which is why it reported 0.009px.
- The model now collapses that margin, except where something separates the two edges: top padding, a top border, absolute placement, `clip`, or the box being turned into a link or button. Nested margins combine as CSS combines them and are applied once.
- Every box and container now acts as the anchor for its absolutely-placed children, because the renderer gives each one `position: relative` or `absolute`. That is what makes the pinned bands move down with the root.
- At 1280 the model now puts the root and its five bands at y 84 / 1050 / 1562 / 2077 / 2637, the same numbers Chromium reported.

**Issue 2 was not a model error.** At rest the model puts About Me at y 1088, the value the ticket itself says is correct once the button height is restored. The 1628.75 box and every escape size in the verdict (212 / 643 / 1062px …) came from the content-robustness check, which grows every text run 2.5×. The finding sentence never said so. Now it reads "at 1280px×768px, copy grown 2.5×: …".

**One outcome differs from what the ticket expected.** The ticket predicted the gate would show an 84px error on the served page. Instead, the restructured version of the page now shows its real 84px cost (`fidelityMaxDeltaPx` 84). The same choice logic that `1c repro` uses therefore no longer picks it. It grades the flat original instead, which is exact. So a fresh `1c repro` would serve this page without the 84px shift. The restructured version becomes usable again once the renderer stops collapsing that margin (REQ-371 issue 2).

**Verification:**
- The 5 new tests pass, and 4 of them fail on the old code. The fifth checks that nothing collapses where it shouldn't, so it passes either way.
- All 57 existing test files that touch the layout model or the gate pass; 7 tests were skipped because they need stored reference sites or a browser.
- Typecheck of `tools/generate` is clean.
- I ran `l1-gate` on all 5 stored reference sites, old code against new. Only bluelotus changed; the other four are identical on every reported number.

**Not done:** the browser self-check inside `l1-gate` that the ticket suggested. It would add a Chromium dependency to a command that is deliberately analytic. Issue 2 turned out not to be a divergence, and issue 1 is now modelled. Chromium can't launch in this sandbox anyway. Say if you still want it, ideally as its own ticket.

The ticket body keeps the original filing and now has two added sections: the diagnosis, and what landed. I also saved a note that escape boxes in `gate.json` usually come from the 2.5× grown-copy check, so later investigations look at the finding's `probe` field first.

<!-- xgd-chat-end -->