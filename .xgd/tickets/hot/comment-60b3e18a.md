---
uid: comment-60b3e18a
id: COMMENT-5644
type: comment
title: Comment on request REQ-462
created_by: xgd
created_at: '2026-10-25T21:17:42.414491+00:00'
updated_at: '2026-10-25T21:43:03.578103+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b8322637
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "52f81761-3960-4134-a910-1dc5c95cf885",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="6553441d-ea0b-40b4-be65-bef1c0acbb97-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T21:16:23.401011+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="6553441d-ea0b-40b4-be65-bef1c0acbb97-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T21:43:00.125653+00:00" -->
#### Claude
I'm reading the BUG-276 brand schema and the REQ-422 header part to work out how the header arrangement should sit alongside them.

I'm checking how the layout check finds the logo and what REQ-460's positioning card holds, since the location rule depends on both.

I'm now looking at how the renderer passes the design and part through, so the arrangement can go into the same pure design step.

I've worked out the shape. I'm checking the `write_positioning` tool declaration before I write the ticket's design down.

I'll look at BUG-276's UATs to reuse its test harness for rendering and the brand check.

I have enough to design it. Before writing it up, I'm checking `opaqueBox` in `png.ts` so the line-counting for an emblem can reuse it.

The design is settled, so I'm marking the ticket as being worked and cutting the branch.

The worktree runs. Now the schema: `brand.header` with its arrangement and the location flag.

Now the arrangement itself, as a pure step in `resolveL1Design` right after the logo takes its size.

Next the renderer: the shared header is drawn with `arrange` and the site's address.

Now the seed: count the logo's lines of lettering, and let that and its shape pick the arrangement and size.

Now `seededDesign` carries the arrangement and, for a location-led card, the address.

Now the positioning card gets a typed `location_led`, and the host reads it into the seed.

Typecheck is clean. Quick check of the line counter against Dina's real logo (local file only, not committed):

Dina's logo now seeds `logo_centred` at 126px desktop (1.5× of 84). Now the UATs, built on BUG-276's harness.

The non-browser UATs pass. Now the browser ones, using the single-process launch that works in this sandbox:

All six pass in a real Chromium. Now the regression scope the ticket names: BUG-276, REQ-447, REQ-448, REQ-422, plus REQ-456/REQ-425/REQ-460, which share the seed and the card.

REQ-460 passes on its own. For the BUG-276 case, I'm checking whether it is already red on unchanged `xgd-working` by running it in the main checkout:

That case fails the same way on unchanged `xgd-working`, so it was already red before this change. Now the workers suites that go through `read_design`, `set_design` and `write_positioning`:

All green. The `plan-surface.json` edit can trip the declaration and priming-budget tests, so I'm running those too:

The priming-budget suite (BUG-129) passes. The REQ-416 failure is the known one: memory records it red on clean `xgd-working`, because of a wrapped hand-over line. Now committing.

Committed. Now updating the ticket body, keeping its existing text and adding what was built and why:

Now the merge back, using the order my notes say the free_coded gate needs: lock, merge working into the branch, bump, fast-forward back.

REQ-462 is built and merged into `xgd-working`. The ticket is at `free_coded` (version 0.2.646, commits `622f62a5` and `38261cf5`), and its body now records what was built. All six new UATs pass, including the three browser ones in real Chromium.

**How it works**
- **The design states the arrangement.** `site.design.brand.header` is `{ arrangement: 'logo_left' | 'logo_centred', location?: true }`. The consultant writes it with `set_design`, and a look can change it.
- **The renderer lays out the header from it.** The stored header file is not rewritten, so the builder's paths into it stay the same. A site without `brand.header` renders exactly as today.
  - `logo_centred`: three equal columns from 640px. Whatever the builder put before the logo goes on the left, the logo in the middle, whatever comes after it on the right.
  - `logo_left`: the logo, then everything else together on the right.
  - **On a phone** either one shows the logo, the menu and the first item after the logo (the main action); the rest only shows from 640px.
- **The address.** With `location: true`, the site's address goes in the secondary slot, unless the header already shows it.
- **The seed reads the logo.** A roughly square logo drawn in three or more colours (or on two or more lines), or any logo with three or more lines, counts as an emblem: it starts centred and 1.5× larger on desktop. A plain wordmark starts on the left. Dina's real logo has 8 colours, so it seeds centred at 126px instead of 84px.
- **Location-led.** `write_positioning` takes a new `location_led: true`. The host passes it into the design seed, which then turns on `location`.
- **The brand check needed no change.** It already measures the logo against the brand size, which now holds the larger emblem size.

**Decisions I made that you may want to revisit**
- **Colour count, not line count, decides "emblem".** On Dina's real logo the script swash overlaps the DINER bar, so counting lines finds only one. Colour count is the main test; line count is a second one.
- **Header order defines the slots.** I didn't add a new field to mark which items go left or right; the builder's order decides it. So the main action for phones has to be the first thing after the logo.
- **Location-led is a yes/no on the positioning card** that the consultant sets, rather than something guessed from the card's text.
- **The header previewed on its own isn't arranged.** The arrangement shows on every page that carries the header, but not when the header is opened by itself in the editor.

**Regression:** the BUG-276, REQ-422, REQ-447, REQ-448, REQ-456, REQ-425 and REQ-460 suites pass (node and workers), as does the BUG-129 priming budget. Two tests fail, both in ways unrelated to this change:
- BUG-276's `a_logo_that_is_not_the_headers_largest_element_or_is_flush_is_held` fails the same way on unchanged `xgd-working`.
- REQ-416's priming hand-over test is the one my notes record as red on clean `xgd-working`; I didn't re-run it there.

To see it on Dina's Diner 2, the consultant needs to re-run `read_design` and write the seed's `brand` with `set_design`. The site's address also has to be in `config.contact.address` for the header to show it.

<!-- xgd-chat-end -->