---
uid: comment-3dca5858
id: COMMENT-307
type: comment
title: Comment on request REQ-91
created_by: xgd
created_at: '2026-07-23T02:32:10.660585+00:00'
updated_at: '2026-07-23T02:50:54.930995+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-42385423
  kind: chat_transcript
---

<!-- xgd-turn id="82747b77-cf60-4484-924f-bbff8f278de7-user" -->

<!-- xgd-chat role="user" ts="2026-07-23T02:32:08.339256+00:00" -->
#### You
Please free-code this ticket. Note that BUGs 5 and 7 and REQ-90 are underway but I believe this work is independent

<!-- xgd-turn id="82747b77-cf60-4484-924f-bbff8f278de7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-23T02:50:54.899451+00:00" -->
#### Claude
I'll start by reading the current ticket state and exploring the relevant code.

I have the ticket. Now let me explore the key L1 files to understand the current schema, renderer, and capture extraction.

Now the renderer and validate envelope:

Now let me look at the capture extract.ts (what pixel-movers are captured) and the fold.ts (how capture → L1):

Let me read the fold (capture→L1) and the existing test file, plus check how the design-check captures are stored.

Now let me look at the ValueElement type (capture projection consumed by fold) and the existing REQ-82 test file:

The ValueElement already captures everything. Now let me look at the structured types (TextGradient, BorderTreatment, GradientStop) I should reuse for typed axes, and how gradients are normalized:

Let me look at the existing test conventions and the framework's existing gradient render-side type:

I now have a complete picture. This is a large but mechanical ticket: add typed L1 axes for 8 families of captured pixel-movers across schema → validate → render → fold, with tests. The ticket body is already populated and the operator confirmed free-coding. Let me set up task tracking and begin.

I'll proceed directly with implementation to conserve the one-shot budget. Let me start with the schema — adding the shared structured sub-schemas and the per-node axis additions.

Now the text axes additions:

Now add node-level `transform` and `mask` to each node schema (text, image, slot) and the recursive box/container:

Now the recursive box/container interfaces and their lazy schemas:

Now export the new types in types.ts:

Now let me check the l1 index.ts to ensure the new schemas/types are exported from the package:

Now the envelope validator additions. Let me update `walk` in validate.ts to bound the new numerics and scheme-check `backgroundImageUrl`:

Now add the `checkEffects` helper. Let me insert it before `walk`:

The schema was reformatted by the linter but my additions are intact. Now the renderer — the safe sink. Let me update the imports and add the render helpers:

Now add the REQ-91 render helpers after `cssFontFamily`:

Now wire the emitters into `emitNode`. First the text case:

Now the box case — compose background layers plus effects:

Now the image case:

Now the node-level transform/mask, applied after the switch (before `if (base.length)`):

The renderer is wired. Now let me check for real capture data to co-design the axes against (the ticket requires folding real gigabytealchemy/joyful elements through each axis):

Real captures exist. Let me extract actual captured pixel-mover values to co-design against and use in the design-check tests:

I have real captured values across every family. Now let me wire the cleanly-structured **text** families into fold.ts (the fold-side design check), keeping it additive:

Now update fold.ts imports for the new types:

Now let me typecheck the changed packages before writing tests:

One missing `errors` arg. Let me fix:

The framework resolves `@1stcontact/site-schema` from its built `dist`. I need to rebuild site-schema so the new exports are visible:

site-schema rebuilt. Let me re-typecheck framework and tools (most errors were downstream of the stale dist):

Both clean. Let me look at how the existing fold test loads a real capture, to reuse the pattern for the design-check test:

Let me verify the real capture folds and surfaces the gradient before writing the test:

Path resolution issue — let me put the script in the repo:

The standalone runner can't load `.astro`, but vitest can. Let me write the comprehensive UAT test file — it exercises validator, renderer, security, robustness, and the real-capture fold design check:

All 12 pass. Now the regression scope — run the L1/reconciliation/framework suites to confirm nothing broke:

One reconciliation test failing on a `slot` with a `capability` key. Let me check whether this is pre-existing or caused by my change:

Let me confirm whether this failure is pre-existing (independent of my change) by checking the original schema for a `capability` field on slot:

This `test_UAT_AC682` failure is **pre-existing** (fails at HEAD with my changes stashed — the test uses `capability` on a slot but the schema field is `behavior`; unrelated to REQ-91). But I also notice a **REQ-90 font-face section** in the diff that I did not write. Let me get the full picture of what's in the working tree — there may be concurrent REQ-90 work I must not sweep into my commit:

The initial session status was clean (only the untracked dir) — so `1c.mjs`, `tools/generate/src/render/render.ts`, `tests/req89-*.ts`, and a **REQ-90 font-face section in schema.ts** are all concurrent work from other in-flight sessions (BUG 5/7, REQ-89, REQ-90) writing to the shared `xgd-working` tree. I must commit **only** REQ-91's hunks. Let me examine the mixed files precisely:

Concurrent REQ-90 hunks are appended after my REQ-91 hunks. Let me map exactly which files/hunks are mine vs concurrent so I can stage surgically:

Let me confirm validate.ts has no concurrent hunks, then check the schema.ts last-hunk boundary precisely:

validate.ts, types.ts, framework render.ts, and fold.ts are entirely mine (no concurrent hunks). Only schema.ts is mixed — its final hunk is REQ-90's font-face table. Let me surgically stage: whole-file `git add` for the clean files, and a filtered patch (dropping the REQ-90 hunk) applied to the index for schema.ts.

Exactly one REQ-90 hunk dropped, my 9 hunks staged. Now stage the entirely-mine files + test, bump the version, and stage package.json:

Staged set is exactly REQ-91 (the REQ-90 `+51` hunk is excluded). Let me verify no concurrent content leaked into the staged diff, then commit:

Two things to investigate: the name-grep fired, and package.json shows `0.0.172→0.0.174` (a concurrent session already bumped to `0.0.173`). Let me get the exact staged file list and understand the version state:

The index was reset between commands — a concurrent process touched it. This shared worktree is actively volatile. Let me reassess the git state completely:

HEAD unchanged (only ticket auto-commits landed), and all my working-tree changes are intact. But I need to verify a concurrent ticket auto-commit didn't sweep my code in via `git add -A`. Let me check what the recent ticket commits actually touched:

Good — recent ticket commits touched only `.xgd/` files; no code leaked in. The index was just unstaged by a concurrent ticket commit. The worktree is volatile, so let me re-stage selectively and commit **atomically in one block** to minimize the race window:

Clean staged set (7 files, no concurrent content). Let me commit immediately:

Committed as `d399062f`. Let me verify the commit is clean, that concurrent REQ-90 work survived in the working tree, and that the version-bump gate passes:

Let me confirm the version gate exit code, the full working-tree status, and re-run the REQ-91 tests against the committed state:

My REQ-91 commit is landed and clean; concurrent sessions are committing their own files (not my concern). REQ-91 UATs pass (12/12), version gate passes. Let me verify HEAD and run the L1 regression scope once more against the committed state:

All green: typecheck clean, 26 L1 regression tests pass, my commit `d399062f` is intact (a concurrent REQ-89 commit landed on top — not my concern). The earlier `test_UAT_AC682` failure is pre-existing and unrelated. Now let me update the ticket body (preserving the requirements) and move it to `free_coded`:

Ticket moved to `free_coded`. Now set story points:

Done. REQ-91 is free-coded and parked at `free_coded` (the stable resting state — promotion to `ready_to_reconcile` is your call).

## What was built

Typed L1 axes for every captured pixel-mover family in the ticket, all emitted through the renderer's safe sink — no raw-CSS passthrough:

| Target | Axes added |
|---|---|
| **text** | `gradientFill` (background-clip:text), `textDecoration`, `textShadow`, `fontVariantCaps` (small-caps), `listMarker` |
| **box** | `surfaceGradient`, `backgroundImageUrl` (scheme-checked), `overlay` scrim, `border`, `boxShadow`, `backdropBlurPx`, `blendMode` |
| **image** | `blendMode`, `border`, `boxShadow` |
| **any node** | `transform` (rotate/scale), `mask` (circle/ellipse/feather) |

Non-scalar families are **typed structured forms** (`l1Gradient`/`l1Shadow`/`l1Border`/`l1Mask`/`l1Transform`), never passthrough strings — the renderer re-derives CSS from numeric/enum/hex fields. Envelope validator bounds the new lengths + scale and URL-allowlists the background image; the strict schema rejects freeform keys.

Fold populates the cleanly-structured **text** families straight from captures; box/image folding and raw-string shadow parsing are deferred to the folder rebuild (REQ-88), as noted in the ticket.

**Co-designed against real captures** (per the ticket's design-check requirement): gigabytealchemy gold→orange wordmark gradient + `#00d492` accent bar + panel gradient, joyful drop shadow, faelan 0.3 hero scrim — used verbatim as UAT fixtures.

## Evidence
- **12 UATs** `test_UAT_FC_REQ-91_*` pass (validator accept/reject, per-family CSS emission, no-injection, and a fold design-check on the real gigabytealchemy capture).
- Typecheck clean across all 3 changed packages; **26 L1 regression tests** pass.
- Commit `d399062f` `[FREE-CODED]`, version `0.0.174`, story_points 5.

## Two things to flag

1. **Concurrent-session hazard, handled.** BUG 5/7, REQ-89, and REQ-90 are writing to the same `xgd-working` tree — REQ-90's font-face work is intermixed in `schema.ts`, and the index got reset mid-way by a ticket auto-commit. I staged **only REQ-91's hunks** (surgically dropping REQ-90's font-face hunk via a filtered `git apply --cached`) and excluded `1c.mjs` / `tools/generate/src/render/render.ts` / `req89` test. Verified the commit touches only my 7 files, and REQ-90's work is preserved uncommitted. Confirmed independent, as you expected.

2. **Pre-existing unrelated test failure** (not mine): `tests/reconciliation-l1-substrate.test.ts::test_UAT_AC682` fails at HEAD too, with my changes stashed. The doc it builds uses `{ kind: 'slot', ..., capability: 'carousel' }` but the slot schema field is `behavior` — a stale matrix/test mismatch. Worth a separate look but outside REQ-91's scope.

<!-- xgd-chat-end -->