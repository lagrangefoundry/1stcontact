---
uid: comment-326251f7
id: COMMENT-5623
type: comment
title: Comment on request REQ-456
created_by: xgd
created_at: '2026-10-25T01:28:10.032214+00:00'
updated_at: '2026-10-25T02:00:56.931735+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3fb70644
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1af4db49-1945-4934-8c84-4315fa68d9b1",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="b90b7ed9-a95e-4737-938b-28e29fa9e656-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T01:26:51.466847+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="b90b7ed9-a95e-4737-938b-28e29fa9e656-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T02:00:56.102474+00:00" -->
#### Claude
I'm reading the REQ-447/448/449 design-system code (schema, validator, `set_design`, layout check) so I understand the contracts before I settle scope.

Still mapping the code: found the host's design seed (`design-seed.ts`) and `set_design`'s handler; now reading how the host writes and validates a design.

Mapped the main pieces. Now checking the type-role schema and how roles resolve, since the ticket needs a new `quote` role and per-width sizes on roles.

Scope is clear enough to proceed without questions; I'll record the decisions I'm settling on the ticket, mark it `free_coding`, and cut the branch.

Now writing code: first the schema (new `quote` role) and the completeness check in `design.ts`.

Now the completeness rules and the typed-text census in `design.ts`.

Schema side compiles. Now the host's seed: a pure `seededDesign()` that fills every missing part of the current design from the measured facts.

Now wiring the host: `get_design` reports `missing`, `read_design` returns `seed.design`, and the consultant's write refuses an incomplete design.

Now the surface text: `set_design` / `read_design` descriptions and the `design` shape.

Next: the `typed_text` layout check (held like every layout fault), fed by a per-section count in the census.

Code is in place; now writing the UATs. Checking how the REQ-448 workers suite drives `set_design` so I can reuse it.

Next, the UATs. Looking at how the REQ-447 suite loads the migrated fixture sites and renders them, to reuse its helpers.

Writing the node UAT file (real CLI/toolbox, with the browser parts gated on Chromium like REQ-447/449).

Good news: the Chromium-rendered checks (gutter at 375/900, h1 within its line limit at 900, quote/body sizes) pass here through the degraded launcher. Fixing the two remaining failures.

The `typed_text` check fires in-page exactly as intended (none at 1 typed run, both sections at 2). The negative browser runs failed suspiciously fast, so checking they fail for the right reason:

Seeded: 45.5px, 4 lines (≈17 letters a line); Dina's 54px: 5 lines. Tightening the assertions to the fixed minimums and line limit:

Browser evidence now fails on a zero gutter and on Dina's 54px headline, and passes on the seeded design. Next, the workers suite for the consultant's real `set_design` / `read_design` path.

Two expected-shape mismatches: a design that is both unsound and incomplete should name both (REQ-447's reason first), and a fresh site lacks the whole `layout` group. Fixing both.

All 12 workers UATs pass (REQ-456 plus the updated REQ-448/449). Now the wider regression scope.

Two failures that don't look related to my change; baselining them on clean `xgd-working` in the main checkout.

Both fail identically on clean `xgd-working`, so they predate this change. Checking the earlier note that `design-seed.ts` changed in the main checkout:

Another session just landed BUG-276 (logo sized by the design's brand), touching `design-seed.ts`, which I also changed. Reading it before I merge.

Resolving the four conflicts: REQ-448 keeps BUG-276's brand inside the chosen design, and the host's write runs BUG-276's brand check inside the deep-merged completeness check.

Now updating my side to BUG-276's model: `brand.logo` instead of `logoHeight`, the seed's brand from `facts.brand`, and `editDesignSet` taking the brand check.

The tree is back to the final state with the merge holding only the resolution. Before committing the adaptations, checking `set_design`'s description still matches BUG-276's `brand.logo`:

Now the full regression scope on the merged branch: node suites (incl. BUG-276) and workers suites (incl. BUG-129 priming budget).

Node: 210 pass; the only 2 failures are the pre-existing BUG-48 / REQ-122 ones. Now workers.

Now syncing the ticket body with what actually landed (brand via BUG-276, keyframes on the starter ladder, combined refusal), preserving the existing text.

Ticket synced. Now the merge-back: lock, merge `xgd-working` into the branch, bump the version on the branch, merge back, and move to `free_coded`.

REQ-457 just landed new layout checks (`edge`, `fits`, `shape`, `type_scale`) in the same registry. Checking `type_scale` for overlap with my `typed_text` before resolving.

Now the follow-up commit removing what's left of `typed_text` (kind, config text, census field, `l1TypedTextSizes`) and re-pointing the UAT at `type_scale`.

The hold test skips here (Playwright's own launch is blocked), so verifying it with the degraded launcher in a throwaway copy:

Held at tablet and phone; quote and body never reported. Committing, then re-running the layout and design suites against the merged tree.

Only the pre-existing REQ-416 failure. Updating the ticket's item 4 decision and evidence to match:

Now the promotion loop: merge `xgd-working` in, bump on the branch, fast-forward back with `xgd-merge`, and move to `free_coded` (retrying if another session's ticket commit lands on the tip).

Done. Saving two non-obvious lessons to memory.

Correcting one existing memory: the degraded launcher does work in the sandbox.

REQ-456 is implemented, merged into `xgd-working` and at `free_coded`. I didn't need to ask anything first; I made the open calls myself and recorded each one in the ticket body.

**What changed**
- **A design must be complete before `set_design` accepts it.** The required parts are:
  - a gutter of at least 16px on a phone and 24px from a tablet up;
  - the `caption`, `small`, `body`, `lead`, `quote` and heading roles;
  - `lead` and the headings sized per width, each heading small enough at 900px to fit a half-width column (h1 needs 16 letters a line, so Dina's 54px fails);
  - the `background`, `text`, `action` and `onAction` colours;
  - `button.primary` and `button.secondary`;
  - the `hero` and `inline` picture shapes;
  - a `brand`.

  The refusal lists every missing part with its path and points at the seed.
- **New `quote` type role**, never smaller than `body`.
- **The host seeds a completed design.** `read_design` now returns `seed.design`: the current design with every missing part filled in from what the host measured. It is accepted as it is.
- **Migrated sites still validate and render unchanged.** The site validator is untouched; `get_design` and `read_design` now report their `missing` parts for the consultant to complete.

**Two things changed under me while I worked**
- **BUG-276** landed and replaced `brand.logoHeight` with `brand.logo`. The completeness rule and the seed now use its `brand.logo` and its measured brand. Its rule that a site with a logo needs `brand.logo` still applies, and that reason appears in the same refusal.
- **REQ-457** landed a `type_scale` layout check. It already holds any text rendered at a size none of the design's roles has, with no threshold. I had built a separate `typed_text` check for item 4 and removed it, so one rule has one check. The ticket body explains this.

**One design constraint worth knowing:** a role's per-width size is copied into every text block that uses it, and those keyframes must be widths the page is laid out at. So the seed sizes roles at 375 / 768 / 1024 / 1280, all on the starter ladder.

**Tests**
- **New UATs:** `tests/test_UAT_FC_REQ-456_a_design_is_complete.test.ts` and `.workers.test.ts`.
  - The browser checks render the page in real Chromium: text stays at least 16 / 24px from the edge at 375 / 900, the h1 keeps its line limit at 900, and quote and body render at the design's sizes. I confirmed each fails on the bad case: a zero gutter, and Dina's 54px headline (five lines).
  - Through the real routes, an incomplete design is refused and nothing is written, and the seeded design is accepted.
- **The `type_scale` hold test skips here** because Playwright's normal launch is blocked in the sandbox. I ran it through the fallback launcher instead: the typed 26px paragraph is held, quote and body are not. It still needs one run on your machine.
- **Existing suites:** I changed the REQ-448, REQ-449 and BUG-276 tests that wrote incomplete designs so they write complete ones. REQ-447/448/449/457, BUG-276 and the BUG-129 priming budget all pass.
- **Three failures, also red on clean `xgd-working`:** BUG-48 `every_stated_rule…`, REQ-122 `the_model_is_primed…` and the REQ-416 priming test.

**Commits:** `18b8111c`, `a42746c2`, `99b11b5e`, and the version bump `4770b465` (0.2.635). Story points are set to 8. Promoting to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->