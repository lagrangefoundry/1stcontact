---
uid: comment-a9a9a328
id: COMMENT-5650
type: comment
title: Comment on bug BUG-286
created_by: xgd
created_at: '2026-10-25T22:24:53.832251+00:00'
updated_at: '2026-10-25T22:48:58.222886+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-362d348e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "fa6c1091-c368-45c6-9a64-7d541023a944",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="99df4344-2f3f-49de-9812-ad6b67af5299-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T22:23:00.703591+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="99df4344-2f3f-49de-9812-ad6b67af5299-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T22:48:57.475510+00:00" -->
#### Claude
I've cut the `free-BUG-286` branch and am now finding where the header arrangement and part-width defaults live.

I'm reading how the renderer wraps the header part, to decide how the bar's root should take the measure without losing its full-width background.

I found Dina 3's stored draft in the local dev store. I'm pulling out its header and design to use as the test fixture.

I'm reading the seed code now. Next I'll look at how the principal's `get_design`/`set_design` ops read and write the design, which is where the missing arrangement gets seeded.

I've found where the principal reads and writes the design: the plan surface's `design` dependency. Next I'm finding the host that implements it.

Width fix is designed; now the layout-check part (fix 4). Reading how the existing header checks (`flush_logo`, `small_logo`) are built.

Now writing the code. First, the typed `inset` primitive in the L1 schema.

Renderer side is in. Next, the resolution changes in `design.ts`: part items keep their natural width, the part's root gets the inset, and header nav links take `brand.header.links`.

Now type-checking the two packages.

Typecheck is clean. Now the seed: the header's links role (fix 2) and the helper the host will use for pre-REQ-462 sites (fix 3).

Fixes 1–3 are coded and type-check. Before the layout check, I'm checking whether the consultant's surface docs describe `brand.header`, so I can add `links` there too.

Adding the packed-header layout check (fix 4) next to the existing `brand` check.

Check is in. Now the UAT file. I'm looking for an existing test that drives the host's `read_design`, to reuse its harness for the seeding case.

I've saved Dina 3's header and design as a fixture. Now writing the node UAT file.

Running the new UATs (Chromium in single-process mode, which works in this sandbox).

All 5 node UATs pass, including the browser ones. Now the workers UAT for fix 3: a pre-REQ-462 design is given an arrangement when the consultant reads it.

Workers UAT passes. Now the regression set: REQ-462, BUG-276, REQ-447, REQ-456, the REQ-422 header suites, BUG-238, REQ-448, plus the surface and priming-budget tests.

The edgeless "flush logo" case fails. Checking whether it also fails on the clean baseline:

That fails the same way on clean `xgd-working`, so it predates this change too (main checkout restored). Now the workers regression set.

Workers set green. The renderer change touches every header and footer render, so next is a wider sweep: every node test that mentions a header/footer part or the design.

Same counts on both sides, so nothing new is hidden. A quick broader workers sweep over files touching the design or header:

226 passed, none failed. Implementation is done. Updating the ticket body to match what was built, keeping the existing Symptom/Cause text.

Committing on the branch now. First checking that the copied `generated/` directory doesn't get staged.

Committed. Now the landing sequence: lock, merge `xgd-working` into the branch, bump the version, then merge back and move to free_coded.

Clean merge, though it auto-merged three of my files. Quick re-check after the merge: typecheck plus the BUG-286 UATs.

Fast-forwarded into `xgd-working`. Moving the ticket to free_coded:

BUG-286 is landed on `xgd-working` and the ticket is at `free_coded` (commits `c7b602c5`, `f001155c`, version 0.2.650). The ticket body describes what was built.

**What changed, by the ticket's four points:**

1. **Header and footer groups no longer get the section width.** In a header or footer, the root's groups now size to what they hold, so `between` can spread them. Pages are unchanged.
   - A header or footer root that doesn't set its own width is now held to the content width by a new typed property, `inset: 'content' | 'wide'`. Its side padding is `max(gutter, (100% − contentWidth)/2)`, so its items line up with the page sections while its background still runs edge to edge.
   - This replaces BUG-276's fixed gutter padding.
   - Dina 3's header sets `width: content` itself, so it keeps that.
2. **`brand.header.links` sets the header links' type role.** The renderer applies it to header menu links unless a link names its own role. A role the design doesn't define is reported as a design issue. The seed sets `lead` when the header logo is 72px or taller at desktop.
   - Dina 3's stored menu items say `role: body` explicitly, so this alone won't enlarge its links. The builder only wrote `body` because nothing told it otherwise; the role now comes from the brand.
3. **Sites designed before REQ-462 get an arrangement.** When the consultant reads the design, or after a successful `set_design`, the host adds the arrangement the logo suggests and reports it in a `seeded` field. It only does this when the design already sizes the logo (`brand.logo`). Otherwise it also wrote into sites that were never designed, which broke a BUG-276 test.
4. **New layout check `packed_header`.** At desktop widths, it flags a header whose items all end in the first half of the bar.

**Tests:**
- **New UATs:** a node test file and a workers test file named `test_UAT_FC_BUG-286_the_header_spreads_across_its_bar.*`, using Dina 3's stored header and design as a fixture. All 6 pass, including the Chromium ones.
  - Get directions now ends at the right edge of the content width.
  - The old layout ends more than 200px short, and the new check flags it at desktop only.
- **Earlier UATs updated:** I changed four assertions in older tests because this ticket deliberately changes what they check:
  - BUG-276 checked for `padding-left: 24px`.
  - REQ-462 and REQ-456 check the seeded header, which now includes `links: 'lead'`.
  - BUG-276 (workers) checked that a written brand gets no header; it now gets one on write.
- **Regression runs:** 226 workers tests touching the design or header all pass. In the node sweep, the remaining failures are the same failures on clean `xgd-working` (BUG-276 `logo_not_dominant` and the no-gutter flush-logo case behind it, REQ-415, REQ-418, BUG-237, capture). The builder-origin tests fail only because they run from a worktree.

Dina 3's live site won't change until it's re-rendered. Its header arrangement will be added the next time the consultant reads its design.

<!-- xgd-chat-end -->