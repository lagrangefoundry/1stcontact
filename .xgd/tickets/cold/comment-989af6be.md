---
uid: comment-989af6be
id: COMMENT-557
type: comment
title: Comment on request REQ-103
created_by: xgd
created_at: '2026-07-27T23:38:14.359017+00:00'
updated_at: '2026-07-28T23:14:10.098536+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-37e63e46
  kind: chat_transcript
---

<!-- xgd-turn id="eeb4d605-169e-4822-91ff-b39b853115be-user" -->

<!-- xgd-chat role="user" ts="2026-07-27T23:38:12.418782+00:00" -->
#### You
Has this been implemented already?

<!-- xgd-turn id="eeb4d605-169e-4822-91ff-b39b853115be-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-27T23:38:55.205662+00:00" -->
#### Claude
I'll check the current state of the code against REQ-103's acceptance criteria.

No — REQ-103 is not implemented. I checked the three places it would show up:

**1. Gradients are still linear-only.** `packages/site-schema/src/l1/schema.ts:304` is verbatim what the ticket quotes:
```ts
export const l1GradientSchema = z.object({
  angleDeg: finite.optional(),
  stops: z.array(l1GradientStopSchema).min(2),
}).strict()
```
No `kind` discriminator, no radial. The only `radial-gradient` anywhere in the renderer is `render.ts:233`, and that's a mask for soft edges, not a surface fill.

**2. No `pattern` axis.** Proposal (b) doesn't exist — zero hits for `pattern` in the L1 schema or renderer, and no `patternSchema`.

**3. Background images still can't tile.** `render.ts:283-286` still pins the BUG-13 triple unconditionally, and there is no `backgroundRepeat` / `backgroundSizePx` anywhere in `packages/` (proposal (c) also absent).

The xgd.dev site is currently doing exactly the workaround the ticket names as unacceptable: full-bleed SVG assets stretched by `cover` — `/assets/xgd-grid-hero.svg`, `xgd-grid-mark.svg`, `xgd-echo-{1,3}.svg`, referenced via `backgroundImageUrl` at `storage/sites/xgd/draft/pages/home.json:297, 991, 4417`. The two most recent site commits (`7614d67cb`, `c93fb8369`) are hand-tuning stroke opacity inside those SVG files — design decisions living in binary-ish assets rather than in L1, which is the cost the ticket predicts.

Ticket is still `status: draft` with no `fields.commits`. There are no `test_UAT_FC_REQ-103_*` tests.

One unrelated thing in the tree: `packages/site-schema/src/validate.ts` has uncommitted changes, but they're REQ-107 work (running `validateL1` on the authoring path), not this ticket.

<!-- xgd-turn id="1980328d-56d8-4c60-8c6f-af924bd71c6d-user" -->

<!-- xgd-chat role="user" ts="2026-07-28T23:01:18.198066+00:00" -->
#### You
Can you finish up the free coding process please

<!-- xgd-turn id="1980328d-56d8-4c60-8c6f-af924bd71c6d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-28T23:14:10.067005+00:00" -->
#### Claude
Now implementing. Starting with the schema:

Now add `pattern` to the shared surface group:

Now the types:

Now the renderer — gradient emission and the pattern layers:

Now the surface emitter, where layer order and the sizing triple are decided:

Now the envelope bounds:

Now fix the fold's gradient constructor for the narrowed union, then typecheck:The texture reads as a quiet echo of the warped-grid motif without competing with it. Now the regression scope:

All 900 tests pass. Bumping the version and committing:

Now the ticket — updating the body to describe what landed, preserving the original gap analysis:

REQ-103 is implemented and the free-coding cycle is closed. Ticket is at `free_coded` with `commits=[84db6dad3]`, `version=0.0.224`, `story_points=4`, tree clean.

**What landed** (`84db6dad3`, 6 files + 1 new test file):

**`pattern` axis** on REQ-98's shared surface group, so every box-rendering kind gets it — `shape: dots|grid|lines`, `spacingPx`, `thicknessPx`, hex `color`, `angleDeg` (tilts `lines`). The renderer compiles it to repeating gradients: `dots` → one tiled `radial-gradient`, `grid` → two tiled `linear-gradient` layers (a CSS gradient runs along one axis, so a grid needs one rule set per axis), `lines` → a `repeating-linear-gradient` that carries its own period and so tilts without shearing a tile. No asset, no raw CSS.

**Radial gradients** — `l1GradientSchema` is now `linear | radial`. Linear keeps `angleDeg` with `kind` optional (what a folded capture emits); radial requires `kind` and carries a typed `origin` (nine box positions, never `at 30% 40%`) and `extent`. The branches don't mix — a radial with an angle is rejected rather than silently ignored. `foldGradient` is typed to the linear branch.

**The BUG-13 constraint**, resolved without re-opening it: `background-size`/`-position`/`-repeat` become positional lists (one value per layer) only when a pattern is present, so a tiled texture and a `cover` backdrop coexist; with no pattern the emission is byte-for-byte what it was. Layer order top-most first: scrim → texture → gradient wash → image → fill.

**Envelope**: `spacingPx` bounded `[1, 1000]`, `thicknessPx` `[0, 1000]`, checked inside the shared `checkSurface` so an interaction-state delta is bounded by the same rule. The 1px floor is robustness, not taste — a sub-pixel period tiles a full-bleed band millions of times.

**Verification**: 6 UATs in `tests/req103-l1-texture.test.ts`, all through real entry points. Full suite green — 128 files / 900 tests. Clean `pnpm -r build`; no new typecheck errors in the touched files (the workspace has a pre-existing baseline of DOM/worker-type errors in browser-context and test files).

**AC6 is partial, and it's the one thing to know about.** xgd.dev's two flat cream bands (`problem`, `close`) now carry a 48px hairline grid in the brand brown at 10% alpha from the axis; I re-shot the page and the texture reads as a quiet echo of the motif without competing with it. But the hero/how/contract grids stay as SVG assets: they're a **perspective projection** — a grid warped toward a vanishing point with a fade mask — and a repeating gradient tiles a constant cell by construction. So the axis reaches the motif at rest, not the motif in perspective. The ticket's claim that "the brand's defining graphic cannot be drawn by the substrate" is therefore only partly answered; I recorded that as an explicit Residual section on the ticket rather than marking AC6 done. Whether a projected-grid L1 primitive is worth adding is a design question for you, not something I'd fold into this ticket.

The ticket is parked at `free_coded` — promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->