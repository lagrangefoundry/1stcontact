---
uid: comment-7222e43c
id: COMMENT-403
type: comment
title: Comment on bug BUG-17
created_by: xgd
created_at: '2026-07-23T23:41:03.872920+00:00'
updated_at: '2026-07-23T23:59:57.632496+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-88dfa748
  kind: chat_transcript
---

<!-- xgd-turn id="5efe5369-4253-458e-bdf7-b14c6deefe97-user" -->

<!-- xgd-chat role="user" ts="2026-07-23T23:41:01.828112+00:00" -->
#### You
Please free code a fix for this

<!-- xgd-turn id="5efe5369-4253-458e-bdf7-b14c6deefe97-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-23T23:59:57.597218+00:00" -->
#### Claude
I'll start by reading the current ticket state and the relevant code.

Let me read the full fold.ts and the relevant schema/renderer files.

I'll read the full file directly.

Now let me look at the L1 schema types, the renderer, and the capture's ValueElement padding fields.

Let me check the ValueElement type (what the fold reads) for padding fields, and the L1 axes types.

Now let me read the L1 schema.ts to understand the axes structure and the renderer.

Let me read the renderer.

Now let me check the validator and the l1 index exports, plus how the fold is tested and the sampleFidelity gate.

Let me look at existing L1 tests to match conventions, and check how the fold/render are tested.

REQ-91 added structured axes — the closest analog. Let me read its test to match conventions.

I now have a complete picture. Let me first update the ticket body to record the plan, then implement.

My design: add a shared node-level `padding` structured axis (mirroring the `transform`/`mask` node-level precedent), fold it from the captured `paddingTop/Right/Bottom/LeftPx`, and emit it in the renderer. The global `box-sizing: border-box` (render.ts:537) makes this geometry-safe — padding insets content within the pinned keyframe box rather than inflating it.

Let me start implementing. First, the schema:

Now add `padding` to the node schemas (text, image, slot, box, container):

Now the box and container (interfaces + lazy schemas):

Now the lazy box/container schemas:

Add `padding` to the slot schema too, for uniformity with the node-level `transform`/`mask` fields (keeps renderer access clean):

Now the types.ts export:

Now the validator envelope bound:

Now add the padding range check. `checkEffects` runs on every node, so I'll add it there:

Now the renderer — emit padding node-level, alongside transform/mask:

Now the fold. Add the `L1Padding` type import and a `foldPadding` helper, then wire it into the text/image/box leaves:

Now add the `foldPadding` helper. I'll place it near `textAxes`/`boxAxes`:

Now wire `foldPadding` into the three leaf emissions. First the text leaf:

Now the image leaf:

Now the box leaf:

Now let me check the naming convention enforcement before writing tests:

Let me check the real gigabytealchemy bundle for captured padding values, to anchor a design-check test:

The badges are captured text runs with padding `4/12/4/12`. Now let me write the UAT test file:

Now let me run the new test plus the L1 regression scope:

The 6 core tests pass; the fold produces an invalid doc but the error is collapsed to a generic `/root: Invalid input`. Let me get the detailed validation errors:

Let me check whether my change broke the existing fold test too:

The schema change broke union parsing for real folded docs generally (not padding-specific in isolation). Let me instrument the validator to see the real Zod issues:

A concurrent modification (BUG-18 responsive tracks) appeared in schema.ts. Let me check the current state of the working tree and what's actually going on:

schema.ts shows +71 lines but my padding change was ~27. Let me read the actual current file to see ground truth:

There's a concurrent BUG-18 edit in schema.ts (inert, unwired responsive-track schemas). Let me determine whether the fold failure is from my change or pre-existing by testing a clean baseline:

Baseline passes (12/12) — so something in the working-tree changes broke the fold. There's concurrent BUG-18 work entangled here. Let me restore and investigate precisely:

fold.ts doesn't emit `responsive` and BUG-18 schemas are inert — so my padding change is the cause, yet a hand-built padded node validates fine. Let me instrument the fold to surface the actual failing node:

The bad nodes are exactly the padded badges/buttons. Let me see the full node JSON:

The padding looks valid, yet a bare padded text node validates fine. Let me capture the exact failing node and bisect its fields:

The node validates fine standalone — so the failure is document-level (likely a node-count cap or a different node). Let me dump the full pre-validation doc and validate it deterministically:

The full folded doc now validates OK. The earlier failure was likely a transient half-edited state from the concurrent edits. Let me remove my debug hook and re-run cleanly:

Same `validateL1`, same doc, different result between fold-context and test-context — that points to a module resolution mismatch: the `tools/generate` fold imports `@1stcontact/site-schema` which likely resolves to a **stale built dist** lacking my `padding` field, so its strict schema rejects the key the fold now emits. Let me verify:

Confirmed — `@1stcontact/site-schema` resolves to the built `./dist`, which is stale (missing my `padding` field), so the fold's strict schema rejects the new key. The dist must be rebuilt (this is also required for the real `1c` pipeline). Let me check the build setup:

The dist is stale. Building a single package with `tsc` (not `pnpm run`, to avoid dependency reconcile) is safe. Let me rebuild the `site-schema` and `framework` dists that `tools/generate` consumes:

site-schema rebuilt; `framework` is consumed from source (no dist). Let me verify the dist now has padding and re-run:

All 7 pass. Now let me run the regression scope — L1 fold/render/validate/gate tests and the static guardrails:

Two failures. Let me see the full list and check if they're pre-existing (unrelated to my change):

`surface-N` id assertion has nothing to do with padding — likely a pre-existing/concurrent mismatch. Let me confirm by checking baseline. First let me find both failing tests, then test baseline:

Confirmed: `test_UAT_FC_REQ-92_form_controls_stay_residuals` fails at **baseline** too — pre-existing, unrelated to my change. Let me restore my work and rebuild, then identify the second failure:

Let me look at the second failure — `test_UAT_AC682_valid_document_and_optional_primitives_accepted`:

The second failure uses `capability: 'carousel'` on a slot, but the schema field is `behavior` — a pre-existing test/source drift I didn't touch. Let me do a definitive clean-baseline check (my source stashed + dist rebuilt to baseline) for both failing tests:

Both failures are pre-existing at true baseline — **my change introduces zero new failures**. They're concurrent source/test drift (slot `behavior` vs test `capability`; `surface-N` id expectation) unrelated to padding. Let me restore my work and rebuild:

Now let me typecheck the affected packages to confirm the TS changes are sound (per the clean-rebuild lesson):

All three packages typecheck clean. Now let me run my UAT test once more plus lint on the touched files to confirm everything's green before committing:

Lint isn't configured for CLI here (no eslint config); tests pass and typecheck is clean. Let me check git status — importantly whether the rebuilt `dist` is tracked and must be committed:

`dist/` is gitignored (rebuilt by the pipeline). My design-check test follows the exact same pattern as the existing req83/91/92 fold tests (all import `foldToL1` → the built `site-schema`), so it's consistent with the established build flow. Let me confirm the vitest setup builds/resolves correctly:

Everything's consistent with the established pattern. Now let me follow the free-coding lifecycle — version bump first:

Version bump changed `package.json`. Before committing, I need to handle two things carefully: `home.json` (pre-existing, unrelated to my fix — must exclude) and possible concurrent BUG-18 edits mixed into my files. Let me audit each file for non-BUG-17 content:

Only `schema.ts` has concurrent BUG-18 content mixed in; the other four files are purely my BUG-17 work. I must not commit another intent's in-progress work. Since interactive `git add -p` is unavailable and editing the file risks racing the concurrent writer, I'll stage only my hunks into the index via a filtered patch (leaves the working tree untouched). Let me build it:

Let me verify the staged schema.ts has my padding but not BUG-18, then stage the rest and confirm the full staged set:

Staged set is clean: my BUG-17 padding only (schema.ts 25 insertions, no BUG-18), and `home.json` correctly excluded. Let me commit (following FREE-CODING.md: `[FREE-CODED]`, no LLM-attribution trailer):

Committed. Let me verify the version bump is in the commit and that the working tree still preserves the concurrent BUG-18 work + untouched home.json:

The commit is clean: version bump 0.0.189 included, and the concurrent BUG-18 work + `home.json` remain safely uncommitted in the working tree. Now the gate command to move to `free_coded`:

Now set story points and update the ticket body to reflect the final implementation:

Let me verify the final ticket state:

The fix is complete and the ticket is in the correct resting state. Here's a summary.

## BUG-17 — Fold + render element padding: done

**Status:** `free_coded` · commit `b3e14ab5` · version `0.0.189` · 2 story points

### Root cause
`foldToL1` never carried the captured `paddingTop/Right/Bottom/LeftPx` onto L1 leaves, and L1 had no padding axis for the renderer to emit — so pill badges/buttons rendered as tight text and their missing box height inflated inter-element gaps.

### Fix
Added a **node-level `padding` structured axis** (`{topPx,rightPx,bottomPx,leftPx}`), mirroring the existing node-level `transform`/`mask` precedent:
- **schema** — `l1PaddingSchema` (strict, non-negative) on text/image/slot/box/container; `L1Padding` type exported.
- **envelope** — `paddingPx` bound `0..10_000`; negatives/out-of-range rejected before render.
- **renderer** — emits per-side `padding-*` longhands through the numeric-only sink. Because the reset sets `box-sizing: border-box`, padding **insets content inside** the pinned keyframe box rather than inflating geometry → round-trip-safe.
- **fold** — `foldPadding()` carries captured per-side padding onto text/image/box leaves.

### Verification
- `tests/bug17-fold-padding.test.ts` — **7/7 pass** (validator accept/reject, renderer longhands + border-box insetting, real-capture design check: gigabytealchemy badges "Coming soon" 4/12/4/12 fold + render with padding).
- Typecheck clean across `site-schema`, `framework`, `tools/generate`.
- L1 regression scope green **except two pre-existing failures I confirmed fail at baseline** with my work stashed (`REQ-92_form_controls_stay_residuals`, `AC682` slot `capability`-vs-`behavior`) — unrelated to this change.

### Two things worth flagging to you
1. **Buttons vs badges:** the badges are text leaves and now get padding. "Send message"/"Subscribe" are form controls the fold routes to the `contact-form` behavior module as residuals — their padding is a behavior-module concern, out of L1's scope (noted in the ticket body).
2. **Concurrent editing:** a separate process is actively adding **BUG-18** responsive-scalar-track schemas to `packages/site-schema/src/l1/schema.ts` on this same `xgd-working` checkout. I committed **only my BUG-17 hunks** (staged via a filtered patch into the index, leaving the working tree untouched) so BUG-18's in-progress work and the unrelated `home.json` change stay uncommitted for whoever owns them. You may want to check that the other session lands its work cleanly.

The ticket is parked at `free_coded` — promote it to `ready_to_reconcile` when you're ready for reconcile to run.

<!-- xgd-chat-end -->