---
uid: comment-591f10f7
id: COMMENT-5621
type: comment
title: Comment on bug BUG-276
created_by: xgd
created_at: '2026-10-25T01:19:24.195218+00:00'
updated_at: '2026-10-25T01:46:49.639705+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-c3d03743
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "ab8b8b8c-4593-48b5-b0a0-dccc53277e22",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="af7a36fb-5ea7-4d74-9da3-8f1268574235-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T01:17:50.468506+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="af7a36fb-5ea7-4d74-9da3-8f1268574235-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T01:46:47.678241+00:00" -->
#### Claude
Reading the existing design/brand, layout-check and renderer code before cutting the branch.

Still mapping the code: found the brand schema and a design seed; now reading the seed, the layout-check brand rule and the logo rendering path.

Reading the plan surface's `read_design`/`set_design` and the host's seed wiring next.

Still designing: I'm working out how the renderer can identify the logo node and size it per width. Checking how header/footer parts render.

Design settled; checking the layout check's off-system and design hand-off, then I'll write the ticket's design notes and cut the branch.

Design is settled. Recording it on the ticket, setting `free_coding`, and cutting the branch.

Worktree ready. Now the schema: `brand.logo`, the `logo` image name, defaults, census, dangling refs and variables.

Schema side done. Now the renderer: a `logo`-named image takes the brand size through `--l1-logo-*`.

Renderer and resolution callers wired. Threading the part through the off-system census callers next.

Seed now proposes a brand. Wiring the `set_design` refusal into the host.

Delegate refusal added. Looking for where the Delegate tool's description is set, to add the brand line.

Typechecks clean. Now the layout check: the brand rule measured against `brand.logo`, plus the dominance, edge and footer rules.

Check rewritten. Updating its thresholds and their documentation in `layout-check.json`.

Priming updated. Running the related UATs (REQ-126 surface, REQ-447, REQ-448, BUG-267, BUG-238, REQ-429) to see what moved.

Writing the node UAT file now (seed, default size, census, and the Chromium layout cases).

Now the workers UAT: `set_design` refusal and seed over the real routes, and the `Delegate` brief refusal.

Workers UATs green (13/13, including REQ-448 and REQ-449). Running a wider regression batch: design, layout, priming budget and Delegate suites.

Checking whether these three fail on clean `xgd-working` too, before blaming the diff.

Those four fail on clean `xgd-working` too, so they predate this change. Running the rest of the batch.

REQ-428 also fails on clean `xgd-working`, so that one predates this change too. Next, the Delegate-heavy workers suites.

BUG-249 passes alone (it only failed in the batch). Baselining the six new failures on clean `xgd-working`.

All six fail identically on clean `xgd-working`, so none of them come from this change. Before committing, reading the promotion memory for this repo's version-bump order.

Updating the ticket body's design section to match what was built.

Ticket body updated cleanly. Committing the work on the branch, then the lock → merge → bump → promote sequence.

Lock acquired. Merging `xgd-working` into the branch, bumping the version there, then fast-forwarding back.

Merged back (a merge commit, since a ticket commit landed in between). Promoting to `free_coded`.

BUG-276 is implemented, merged into `xgd-working` and parked at `free_coded` (commits `8646c18a3e` and the version bump `391912177d`, 0.2.632). The ticket body describes what was built. The three Chromium UATs could not run here because the sandbox blocks Chromium, so the visible-size, dominance and edge checks have not been run on a real page. Everything else passes.

**What changed**
- **The brand owns the logo's size.** The old `brand.logoHeight` is replaced by `brand.logo = { by: height|width, header, footer }`. Each size is what a visitor sees, per width.
- **The logo takes the brand's size by default.** A picture can now say `logo: "header"` or `logo: "footer"`. On the header and footer, a logo that sets no size of its own gets the brand's size, and the header's height follows it. If the header's root holds the logo directly, with no section of its own around it, it now gets the design's gutter. That is why Dina's logo sat against the edge at 900px and 375px.
- **The host seeds the brand from the logo itself.** `read_design` now proposes a `brand` from the logo's visible ink. A wordmark at least twice as wide as it is tall is sized by width: header 160→240px, footer 120→160px (phone→desktop). Any other mark is sized by height: header 52→84px, footer 40→56px.
- **A design without a brand is refused.** On a site whose header shows a logo, `set_design` refuses a design without `brand.logo` and hands back the seeded brand. I relaxed one thing from the ticket: a site with no logo is not required to have a brand, since there is nothing to size. Shout if you want it required everywhere.
- **Briefs can't set logo pixels.** `Delegate` refuses a brief that gives the logo a size in px, before any builder runs, and points at `brand.logo`. Its description says the same. A size the builder types on the logo is counted as off the design.
- **The layout check holds it.** The header logo must show at least 95% of the brand size. It must also be the header's largest element and at least half the header's height, and sit at least 12px from the screen's edge. The footer logo has its own minimum. Without a brand, the floors rise from 64/44px to 72/48px. Every new fault holds the hand-back like the other layout faults.
- **Priming.** Both the consultant's and the builder's priming now say the logo's size is the brand's.

**One existing test changed:** REQ-448's design UAT now writes a design with a brand, because this ticket replaces REQ-448's acceptance of a design without one.

**Tests**
- The new BUG-276 tests that don't need a browser pass: 5 node and 3 workers. They cover the seed, the refusals, the default size on a real site render, and the off-design count.
- The REQ-447, REQ-448, REQ-449, REQ-429, BUG-267 and BUG-238 UATs pass.
- In the wider batches, nine tests fail on clean `xgd-working` as well, so they predate this change: BUG-244, BUG-245 (×2), BUG-252, REQ-428, REQ-416, REQ-424 (×2) and REQ-431. BUG-275's two workers tests also fail on clean `xgd-working`. BUG-249 failed once inside the large batch and passes on its own.

**To run the Chromium UATs yourself**, outside the sandbox:
```
npx vitest run tests/test_UAT_FC_BUG-276_the_logo_is_the_header.test.ts tests/test_UAT_FC_BUG-267_first_draft_header_and_hero.test.ts tests/test_UAT_FC_BUG-238_brand_and_heading_layout.test.ts
```
The thresholds that most need checking against real headers are the 0.5 header-height share and the area comparison for "largest element". Both are in `layout-check.json`, and the starting sizes are `LOGO_START` in `design-seed.ts`.

<!-- xgd-chat-end -->