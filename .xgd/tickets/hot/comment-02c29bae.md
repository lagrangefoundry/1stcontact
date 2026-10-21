---
uid: comment-02c29bae
id: COMMENT-5536
type: comment
title: Comment on request REQ-420
created_by: xgd
created_at: '2026-10-20T23:33:59.571224+00:00'
updated_at: '2026-10-21T01:12:51.159479+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3cb0e179
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "933f3856-2d6f-4c79-bfbb-7cff20e210c5",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="dac8ca4d-c7b6-4d88-a64c-a2b292c05df2-user" -->

<!-- xgd-chat role="user" ts="2026-10-20T23:32:59.504096+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="dac8ca4d-c7b6-4d88-a64c-a2b292c05df2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T00:20:47.298145+00:00" -->
#### Claude
I'm still reading the L1 schema and renderer to work out where text styles and container spacing live before I write any code.

The ticket needs decisions in several places where the code pushes back, so I'm checking how folded reproductions place in-flow children (leading offsets). Rhythm margins must not disturb them.

Before designing the keep-with-next wrapper I need to know how the REQ-82 round trip reads a rendered page back, since an extra wrapper element could break it.

Remaining design question: should a text stack with no `gapPx` switch to rhythm by default? That depends on what stored pages actually contain, so I'm measuring that now.

`set_config` with key `rhythm` will cover the unit with no new op. Now finding where builders and the consultant are taught L1 node fields, for item 8.

I've finished surveying. Moving the ticket to `free_coding` and cutting a branch.

Starting the schema changes in `packages/site-schema`.

Now the container's spacing-mode enum, next to the layout mode.

The schema package typechecks. Checking whether other packages consume site-schema's source or a built `dist`.

Source-exported, so no build step. On to the renderer: reading the text-node emission and how a node's declarations become a rule.

Now the function that emits a rhythm container's children, including the keep-with-next groups.

Typechecks. Excluding modal panels from rhythm membership too, since they paint in a covering shell, not in the flow.

Passing the site's unit into the production page render:

Mirroring the arithmetic in the analytic evaluator (`probes.ts`) for stacks:

Now letting the round-trip capture render with the site's rhythm unit:

Typechecks. Now the REQ-420 finding in the REQ-415 browser layout check.

Two builder primings (with and without the corpus) carry the same role text, so I'll splice both.

Adding a short note for the consultant too, since it adjusts spacing when the client asks:

Now the tool-surface descriptions:

The surface now accepts new fields, so a consumer pinned to its version should see the number move. Bumping `surface_version` and its code constant together:

Next, regenerating the L1 reference (`REF-l1.md`) from the schema. Finding the command that writes it:

`1c kb export` would also re-export documents from the sparse worktree ticket store, so I'll call `writeProjections()` alone through Vite, the way `1c.mjs` loads the CLI.

Pattern noted: real CLI (`run`), the real Toolbox, `cmdRender` for the served page. Checking how browser-dependent UATs handle engine availability:

Browser UATs use `describe.runIf(engineAvailable)`. Checking the geometry keyframe shape for the `type assign` fixture, which needs reproduction-style flow offsets:

Checking how a test makes a site and what a stored page file looks like:

Writing the UAT file:

Running the new UATs:

The worktree is missing the gitignored generated control-app files, a known fresh-worktree gap. Copying them from the main checkout:

zsh passed the file list as one argument. Re-running through `xargs`:

The rest are fine: they set `gapPx`, carry geometry (fold), or are the starter page, which should start with rhythm. Re-running `flow_l1`, then checking the two suspect failures against the baseline:

Still failing. Reading the test to reproduce and see the refusal:

Before chasing it, checking whether it fails without my change. Baseline run of the three suspect suites:

All six fail at baseline too, so they predate this change. Now the full node suite, in foreground batches with the JSON reporter:

The full node suite is done: 104 failures across 710 files. Now the same failing files at baseline, compared test by test:

Both are deliberate sweeps: a new node-level field must be added to their sample tables, so every kind is proven to accept it. Checking how AC802 also proves an unknown key is refused:

Adding the two fields to both sample tables:

AC802 and REQ-105 pass now. AC977 also fails at baseline. REQ-154 is genuinely new: no Playwright reachable from the Worker. Seeing what it found:

One worker failure; it looks like deployment wiring, not rendering. Checking it at baseline:

Same failure at baseline, so it predates me. My restore failed again, this time because the patch also held the two test edits, which I hadn't reverted. Restoring the source files only:

Everything is back. A quick confirmation run on the restored tree, with the browser enabled:

Typechecks. Updating the UAT regexes for the marker, and adding a browser assertion that section addressing sees through a wrapper:

All 35 pass. Before committing I'm re-reading my notes on this repo's `free_coded` gate:

Ticket updated. Committing on the branch, staging each file by name:

Committed and clean. Taking the merge lock:

Two conflicts: another session changed `layout-check.ts` and `priming.json` on `xgd-working` while I worked. Resolving them in the main checkout:

Notably, another session's commit, `1b860b3810`, *also* added a floating-headings check to the layout check. Reading it so the two don't duplicate:

Their rule is a strict superset of mine (below ≥ 0.75 × above, with above ≥ 16px). Resolving: their finding kinds, my block and doc lines removed, my look-through kept.

`layout-check.ts` now differs from `xgd-working` only by the look-through. Next, the `priming.json` conflicts:

Combining both: their header paragraph stays, and their one-sentence heading rule gives way to my paragraph, which states the same principle plus how to apply it with rhythm. Same in both copies:

Reads cleanly. Checking whether BUG-238's UAT pins the sentence I replaced:

Their test pins *"put clearly less space below it than above it"*. I'll keep their paragraph verbatim and open mine as its continuation, so the principle is stated once:

Fixing the short line left by the splice:

Now my UAT moves to their `loose_heading` and wording, and the surface's `warnings` description matches their threshold:

Merged; the remaining modified files belong to other sessions and were there when I started. Running the ticket-overlay check the protocol requires:

Nothing to fix there. Fast-forwarding my worktree to the merged tip and running the affected suites with the browser on:

All 68 pass, BUG-238's suite included. Updating the ticket's layout-check paragraph to match what landed, so reconcile has the right spec if it meets the same conflict:

Ticket updated. Moving it to `free_coded` with the feature commit, and no `--version`, so the gate bumps the version inside its own lock:

Done. Saving one non-obvious lesson from this session to memory: the patch-swap baseline can fail and silently leave work unapplied.

The sandbox blocked the shell append to the memory index, so I'll use the editor:

REQ-420 is implemented and merged into `xgd-working`. The ticket is at `free_coded` with commit `ba720eb` and the version bump `bb6ed83` (0.2.562), and its body records the design as built. I haven't promoted it; `ready_to_reconcile` is your call.

**What it does now**
- **Rhythm unit:** the site sets one spacing unit, `site.rhythm.unitPx`, which can vary by screen width. If unset, it's the body text's line height, or 24px. The consultant sets it through `set_config` key `rhythm`.
- **Space on styles and elements:** text styles and individual elements can carry `spaceAbove`/`spaceBelow`, in units from 0 to 16. Defaults are as the ticket says: H1 3/0.75, H2 2.5/0.5, H3 2/0.5, body 0/1. H4–H6 get 1.5/0.5 and anything else, such as an image, 1/1. They all live in one table in `packages/site-schema/src/l1/rhythm.ts`.
- **Neighbour spacing:** in a rhythm stack, the space between two neighbours is the larger of the first one's space below and the next one's space above. The first child's space above and the last child's space below are dropped.
- **Keep-with-next:** a heading and the element after it are wrapped as one labelled group, so a wrapping row can't split them. Tools that find sections by position see through the wrapper.
- **Reading rhythm back:** a new reader recovers the unit and each style's spacing from a laid-out page. A browser round trip recovers the values exactly.
- **Teaching:** the builder and consultant prompts and the tool descriptions explain the new fields. The tool surface version went from 20 to 21.

**Decisions you may want to check**
- **Which stacks default to rhythm:** a plain stack holding text, with no `gapPx` and no children placed by fixed geometry. That's the ticket's literal rule. Every page that uses `gapPx` renders byte-identically. Of the 13 stored fixture and sandbox pages, 4 change because they have bare text stacks: xgd home and whitepapers, Charlie's home, and the sandbox demo. New starter sites get rhythm too.
- **Item 7 (capture/fold):** the fold produces pinned geometry and no text styles, so there was nowhere in it to put spacing. Instead, `1c type assign` (where a reproduction's styles get created) measures the page's rhythm and records it on the heading and body styles it creates, plus `site.rhythm`. It only does this on a site with no rhythm containers, so the page's rendering doesn't change.
- **Headings don't inherit the default style's spacing.** Otherwise a body style with `spaceBelow: 1` would make every heading float again.
- **Two limitations:** a rhythm container that's a row at some widths gets no space between items at those widths, and email pages ignore spacing.

**Merge conflict with BUG-238:** another session landed the same floating-heading check as `loose_heading` while I was working. I dropped my duplicate and pointed my test at theirs. In the builder prompt I kept their sentence, which their test checks for, and continued it with the rhythm guidance. The conflict resolution lives in merge commit `4e6eb7f`, which isn't in the ticket's commits because reconcile only takes non-merge commits. If reconcile hits the same conflict on `main`, the ticket body describes the intended result.

**Tests:** 9 new UATs in `tests/test_UAT_FC_REQ-420_vertical_rhythm.test.ts`, 4 of them in Chromium, all passing. I also added the two new fields to the REQ-105 and AC802 tests, which require every element-level field to be listed. In the full node suite, the failures I checked also fail without my change: BUG-48, REQ-269, the browser test of `flow_l1` and REQ-219, plus about 90 server and setup failures in this worktree. The browser tests only run with `CHROMIUM_LAUNCH_ARGS=--single-process` here; otherwise they skip.

<!-- xgd-turn id="97585a66-508f-437e-b4b6-8a5bf4c9965e-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T00:39:41.410410+00:00" -->
#### You
can you review and implement the adjustments to the ticket please?

<!-- xgd-turn id="97585a66-508f-437e-b4b6-8a5bf4c9965e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T00:40:20.370307+00:00" -->
#### Claude
I reviewed the adjustments, and none of them need code. Nothing was committed and the ticket stays at `free_coded`.

- **Review note:** it describes the build accurately. Spacing lives on the text styles, nothing refuses a heading with more space below than above, per-element overrides exist, the floating heading is reported by BUG-238's `loose_heading` check, and all the work is in this repo.
- **Rewritten item 9, the `gapPx` half:** confirmed. Containers with `gapPx` render byte-identically; a UAT checks it, and I hash-compared every stored page before and after the change.
- **Item 9, the plain-text-stack half:** confirmed. A text stack with no stated spacing now spaces by rhythm. The UAT `a_rhythm_stack_attaches_each_heading_to_its_text` uses exactly such a stack, and 4 of the 13 stored pages change.
- **Item 9, "a published site changes only when it is published again":** this was the one new claim, and it holds. Publishing renders static HTML into R2 (`publish.ts` → `renderSiteFiles`), and the public site serves those files as they are. A live site keeps its old spacing until the next publish, while drafts and previews show rhythm straight away.

<!-- xgd-turn id="4f535891-a162-4d70-ad5c-969ac56f312f-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T01:12:50.407860+00:00" -->
#### You
**Are you happy to call colours and lettering done, or does anything still feel off?**Bob, the layout check flagged the message form again after the colour change. It's the same false alarm as BUG-237, so I've left the form alone. <-- This bold text appeared as normal text on the chat with ** around it (i.e. it did not render)

The consultant talks about workers and builders - I think that might be a little confusing - I did break character earlier, but we should decide what language it should use for things like that

<!-- xgd-chat-end -->