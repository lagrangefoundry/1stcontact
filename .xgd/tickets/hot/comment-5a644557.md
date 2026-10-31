---
uid: comment-5a644557
id: COMMENT-5651
type: comment
title: Comment on request REQ-463
created_by: xgd
created_at: '2026-10-25T22:25:01.701844+00:00'
updated_at: '2026-10-25T23:22:48.735632+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-fe808622
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "9a259396-48fb-4ee3-9fc2-eba7ca3cbc05",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="574f08ee-1f73-44c4-b24d-30d0864ac960-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T22:23:07.052123+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="574f08ee-1f73-44c4-b24d-30d0864ac960-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T23:22:47.885096+00:00" -->
#### Claude
I'm reading the design-system code (`design.ts`) and the layout check before deciding the shape of the change.

I'm still in the reading phase: next is the REQ-460 site-structure decision, to see where a per-section composition would be recorded.

I'm still working out how the builder learns each section's composition. The host deliberately never adds to a brief (BUG-233), so I'm checking what context builders already receive.

I'm looking for Dina's Diner 3's stored home page (the ticket's test fixture). It's not in the repo, so I'm checking the local dev store.

Found Dina 3 (site_005ef0…). Its sections are stored separately, so I'm assembling the full home page to use as the test fixture.

Assembling Dina 3's home page from its stored sections so I can see its actual structure.

Next I'm checking whether Chromium can launch here, since the layout check needs a real browser.

I'm still trying to get the browser-backed tests to run in this sandbox. The test passed, but its log output was hidden, so I'm re-running it to see it.

Browser tests run with `CHROMIUM_LAUNCH_ARGS=--single-process`. Now I'm exporting Dina 3's site and pages as a fixture and running today's layout check on it as a baseline.

Now writing a throwaway probe that renders Dina 3 with today's code and lists every layout finding at desktop, so I can calibrate the new check against the real symptom.

Baseline: nothing currently flags the half-empty sections. Next I'm measuring where the room/coffee/Dino pictures and text actually sit at 1280px.

Next: the design seed, which fills in a complete design's missing parts. It will need to seed the text measure and the compositions.

Design settled. Before coding I'm recording the implementation decisions on the ticket, setting it to `free_coding` and cutting the branch.

The worktree runs the probe. Starting on the schema layer: vocabulary, design schema, node fields.

Now editing `design-names.ts`.

Now the node schema: `composition` on sections, `width: 'text'` on text runs.

Now `design.ts`: the layout schema, the soundness and completeness checks, references, resolution and the `--l1-text` variable.

Writing the resolution half: composing sections and giving running text the measure by default.

Site-schema typechecks. Now the renderer: the `text` measure on groups and runs.

Both packages typecheck. Next I'm extending the probe to render a composed Dina 3 (text measure on; split / statement / cards / full / overlay assigned) and measure it at 1280, 900 and 375.

Now the two new checks. First, the runner's helpers.

Writing the two checks now: `width_use` (a one-sided empty strip beside running text at desktop) and `composition` (two `full` sections in a row the structure didn't plan).

The new check fires on exactly the four sections the ticket names (room, coffee, Dino, Who stops here) and not on the hero. Now the composed version:

Now the plan side: the `home` list on the structure decision, and the brief line.

Now `account-core`: the structure-first refusal text and the brief-line hook.

Now `host-core`: wire the hook, and hand the structure to the home page's layout check.

The tools typecheck. Next, the design seed fills in a text measure of 65 body characters and offers all five compositions.

Seed done. Now telling builders about `composition`: the `get_design` description and the builder priming.

Now the `get_design` description, and the critic's rubric line.

Implementation is in place. Now the UATs. First, how the REQ-460 tests drive plan operations and delegation.

The brief-carrying UAT should go through the real `/api/ai/prompt` path, as REQ-460's workers suite does. Reading its harness.

Writing the node UAT file: the Dina 3 regression, the text measure, each composition in a real browser, the design rules, the `repeated_full` rule, and the critic rubric.

11 of 12 pass. The overlay assertion only failed on the background-image string; printing the actual value.

The hero's picture is steak and eggs, not the one I'd assumed. Fixing the test.

The node suite passes, 12 of 12. Now the workers suite: the structure's `home` on the plan, the brief line reaching the builder, and the structure reaching the layout check.

All three workers UATs pass on the first run. Removing the probe, then running the related suites as a regression check.

One failure, in BUG-276. My notes say that suite was already red on clean `xgd-working` (from `edge_distance`), so I'm checking the failure detail before deciding whether my change caused it.

Pre-existing: it fails identically on the base code, so it isn't from this change. Now the workers regression batch.

All 12 workers suites pass, including BUG-129 (priming budget) and BUG-233 (briefs carry no story board). Next is the full suite, following the batching recipe in my notes.

The riskiest change for other suites is the new completeness requirement (`textWidth`, `compositions`). Before the full run, I'm finding every suite that relies on a design being complete.

Those pass too. Starting the full node suite in three foreground batches.

34 failures in batch 1, most of which look environmental (fonts, ports, the workspace origin). Baselining just those files against the base code.

Eight failures appear only in my batch run. Batch-versus-isolated runs aren't comparable, so I'm re-running those files in isolation on my code.

In isolation all eight pass. The one remaining failure (AC977) also fails on the base code. Batch 2:

Batch 2 has 28 failures. One worth a closer look is BUG-48 ("every stated rule is one the validator refuses"), since I added validator rules. Baselining the batch on base code:

Only one difference, REQ-122 chat host, which my notes list among known flaky or pre-existing suites. Re-running it alone on my code:

Alone, the differing test passes; the one that fails also fails on base. Batch 3:

The node project shows nothing new against base. Now the workers project (286 files), in two batches.

BUG-275 is timing-flaky (12s stall tests): it fails, then passes 3 of 3 on the next run, and base failed one of them too. Workers batch 2:

The full suite, node and workers, shows no failures that aren't also on base or flaky in isolation. Checking for lint and repo-wide typecheck scripts.

Before committing I'm reviewing the full diff myself.

Ticket updated. Now giving the commit its real message:

Committed. Now the merge-back: lock, merge `xgd-working` into the branch, bump the version, fast-forward, then promote.

Three files conflict: `render.ts`, `design.ts` and `plan-surface.json`. Someone else changed the design system on `xgd-working` meanwhile. Seeing what landed:

BUG-286 added `insetLength`, typed `Exclude<L1WidthName, 'bleed'>`. Since `L1WidthName` now includes `text`, that type silently widens. Checking how BUG-286 declares `inset`:

`inset` is its own `content | wide` enum, so nothing can pass it `text`. I'll keep both functions and narrow `insetLength`'s parameter to `'content' | 'wide'` so the type stays honest.

Merge committed. Re-running my UATs and the incoming BUG-286/287 suites on the merged code:

Merged code passes: node 69/69, workers 19/19. Now the bump, the merge back and the promotion, in the order my notes give.

Fast-forwarded onto `xgd-working`. Promoting the ticket with the two full SHAs:

Branch cleaned and lock released. Raising the estimate to match the work, and confirming the ticket's final state:

I added a memory index entry. One check remains: my notes say edits made inside a merge commit are lost to reconcile, and my merge narrowed `insetLength`'s type. Confirming what that means here.

I've implemented REQ-463 and merged it into `xgd-working` (commits `b1c9caf4` and `d66f6c20`, version 0.2.651). The ticket is at `free_coded` with the build decisions and the as-built test plan added to its body; I left the original body as it was.

**The symptom is now caught and fixable.** On Dina 3's stored home page at 1280px, the new `unused_width` fault fires on the room, coffee, Dino and "Who stops here" sections, not on the hero, and never at tablet or phone width. Each of them leaves 520px (46% of the width) empty beside the text. When I give those sections compositions, the same page has no unused width, no ragged rows, no repeated shape and no unreadable text over a picture.

**What's built**
- **Text measure.** The design has `layout.textWidth`, which must set 45–75 characters of body and fit inside the content width. Running text (body, lead, quote) takes it by default on a page, so builders stop sizing text columns. Dina's 600px columns are still counted as off-system.
- **Compositions.** The design has `layout.compositions`, and a section names one with `composition: "split"` and so on. The design lays the section out at render time, like the REQ-462 header arrangement, rather than through a template:
  - `split`: picture beside text from 768px up, alternating sides on consecutive splits, stacked on a phone.
  - `overlay`: the picture behind the text with a 0.55 black scrim and white text.
  - `statement`: centred at the text measure.
  - `cards`: items in a grid under the heading.
  - `full`: picture across, text centred under it.
  
  A section that names no composition renders exactly as before.
- **Completeness and seed.** A complete design now needs `textWidth` and at least two compositions. The host's seeded design fills both (Dina gets 640px and all five).
- **Structure.** The site-structure decision (`set_decision` on `pages_navigation`) takes `home`: each home section's id and composition. The host adds one line naming them to any build request that may touch the home page.
- **Layout check.** Two new faults: `unused_width` at desktop, and `repeated_full` for two `full` sections in a row unless the structure planned both.
- **Critic.** Its style rubric now names a page whose sections all share one composition as a finding.

**Decisions to review**
- **Builder briefs.** BUG-233 says the brief is the consultant's alone. I made the composition line the one exception, because the ticket asks for the brief to carry it.
- **Split text alignment.** In a split, the text is centred vertically against the picture. The REQ-457 row check now treats that as deliberate rather than a ragged row; otherwise our own composition would fault on any short paragraph beside a photo.
- **"BUG-268 scrim rules".** The ticket's reference doesn't match: BUG-268 is an idle-stop bug. I built the overlay to REQ-440's over-image rule.

**Tests:** 12 node UATs (the browser ones run in real Chromium against a Dina 3 fixture exported from the dev store) and 3 workers UATs all pass. The related suites pass, including the priming-budget (BUG-129) and BUG-233 tests. In the full node and workers runs, every failure also fails on the base code or passes when re-run on its own. One of those is a BUG-276 header-logo test, which was already failing before this change.

BUG-286 landed on `xgd-working` while I was working and conflicted in three files. I kept both sides and re-ran the affected suites. One small tidy-up from that merge lives only in the merge commit, so reconcile won't carry it. It narrows a parameter type in BUG-286's `insetLength` and changes no behaviour.

<!-- xgd-chat-end -->