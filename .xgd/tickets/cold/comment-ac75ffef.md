---
uid: comment-ac75ffef
id: COMMENT-306
type: comment
title: Comment on request REQ-90
created_by: xgd
created_at: '2026-07-23T02:31:27.872205+00:00'
updated_at: '2026-07-23T04:41:47.132947+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-bc4c1408
  kind: chat_transcript
---

<!-- xgd-turn id="f318c8e6-059c-4029-a701-5ffb16a36090-user" -->

<!-- xgd-chat role="user" ts="2026-07-23T02:31:25.519347+00:00" -->
#### You
Please free code this ticket - BUG-5 and 7 are underway but I believe this work is independent

<!-- xgd-turn id="f318c8e6-059c-4029-a701-5ffb16a36090-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-23T02:39:29.474235+00:00" -->
#### Claude
I'll start by reading the current ticket state and exploring the relevant code areas.

Let me explore the relevant code structure in parallel.

Now let me look at cmdRepro and how assets/fonts flow through capture and serving.

I have a complete understanding now. Let me implement. Starting with the schema.

The file was modified on disk since I read it. Let me check what changed to avoid conflicts with concurrent work.

There's concurrent uncommitted work (BUG-5/7) in the same files. This is a critical situation — I must not sweep their changes into my commit. Let me examine the overlap.

This is important. The working tree already contains **uncommitted concurrent work** in the exact files REQ-90 needs to touch. Let me map it precisely before proceeding.

The picture is now clear and it changes things. Let me confirm the render.ts change ownership before I report.

I need to stop and flag a coordination problem before writing any more code — the situation on disk contradicts the "independent" assumption in a way that matters for how (and whether) I can commit.

## What I found

The work is **logically** independent, but **physically** it is not. REQ-90 must edit four files, and **all four already have uncommitted changes from REQ-91** (the "structured effect axes" work — gradient/shadow/border/mask/transform), which is being edited *right now* (`render.ts` became modified partway through this session):

| File REQ-90 needs | Uncommitted concurrent work |
|---|---|
| `packages/site-schema/src/l1/schema.ts` | REQ-91 (effect schemas) |
| `packages/site-schema/src/l1/types.ts` | REQ-91 (effect types) |
| `packages/site-schema/src/l1/validate.ts` | REQ-91 (effect envelope bounds) |
| `packages/framework/src/l1/render.ts` | REQ-91 (effect CSS emitters) |

(Also present but not in my path: `tools/generate/src/l1/probes.ts` REQ-91, and `tests/bug7-row-layout.test.ts` BUG-7.)

## Why this blocks a clean free-code

The free-coding gate needs REQ-90's commit to contain **only** REQ-90's changes. But my changes to `schema.ts` / `types.ts` / `validate.ts` / `render.ts` are interleaved in the same files as REQ-91's uncommitted work. If I `git add` those files and commit, I sweep REQ-91's in-flight work into REQ-90's SHA — that corrupts REQ-91's provenance and breaks its session's own commit. Partial-hunk staging while REQ-91 is actively rewriting those same files is fragile (line offsets move under me) and I don't think it's safe to attempt unattended.

So far I've made exactly **one** additive edit (the `resources` table block in `schema.ts`) and written no other code — nothing hard to undo.

## My recommendation

**Let REQ-91 (and BUG-7) commit + sync first, then I free-code REQ-90 on a clean tree.** REQ-90 and REQ-91 both extend the L1 schema/validator/renderer; sequencing them avoids the entanglement entirely, and my REQ-90 diff will then apply cleanly on top of REQ-91's committed base. My implementation is fully planned (schema `resources.fonts` table → `@font-face` emitter in `renderL1Document` → fold populates from `capture.theme.fonts` → validator scheme-checks font `src`), so once the tree is clean this is quick.

Alternatives if you'd rather not wait:
- **Co-bundle:** treat REQ-90 + REQ-91 as one reconcile bundle — but they're separate tickets with separate owners, so this muddies both.
- **Proceed now with isolated hunk-staging:** I attempt to stage only REQ-90 hunks via a hand-built patch. Doable but genuinely risky while REQ-91's session is live in the same files; I'd rather not.

How would you like to proceed? My vote is to pause REQ-90 until the REQ-91 changes land.

<!-- xgd-turn id="058d0a2c-e475-4ffa-b424-db0163d7ecbe-user" -->

<!-- xgd-chat role="user" ts="2026-07-23T04:29:20.946270+00:00" -->
#### You
Theyare done, please proceed

<!-- xgd-turn id="058d0a2c-e475-4ffa-b424-db0163d7ecbe-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-23T04:41:47.100156+00:00" -->
#### Claude
The tree is now clean of the concurrent work — only my `schema.ts` edit remains. Let me verify my edit survived and REQ-91's changes are fully gone (not partially reverted), so I'm building on a coherent base.

REQ-91 is committed at `d399062f` and is now my base. My `schema.ts` resources edit sits cleanly on top. Now I must re-read the current (post-REQ-91) `types.ts`, `validate.ts`, and `render.ts` since they changed under me.

Now let me add my types. Let me update types.ts:

Now the validator. Let me re-read the current post-REQ-91 validate.ts:

Now the renderer — re-read the current post-REQ-91 render.ts:

Now I'll add the `@font-face` emitter. First the import:

Now the fold — accept font resources and attach a filtered resource table:

fold.ts changed on disk — let me re-read it.

REQ-91 also extended fold.ts (now committed). Let me add my font-resource wiring:

Now wire capture.ts to pass font substance into the fold. Let me re-read it:

Let me typecheck the affected packages before writing tests.

site-schema is clean. Now framework and generate:

Cross-package resolution uses site-schema's built `dist` (the stale-dist trap from memory). Let me rebuild site-schema:

Typecheck clean across all three. Now let me look at how existing tests build fixture captures so my fold + e2e UATs match conventions.

All exports available. Now I'll write the UAT tests.

Now run the REQ-90 tests:

7/8 pass — the deterministic contract is solid. The e2e face didn't resolve; let me debug what the browser actually reports.

vitest is swallowing console output. Let me surface the data by throwing it.

The font **loads correctly** (`check:true`, `Req90CustomFace:loaded`) — but the band-based `EXTRACT_SCRIPT` returns no elements for my minimal page (absolute children give the body no height, so the extractor treats the text as off-canvas). Also, `document.fonts.check` can't discriminate the control (an undeclared family falls back and still reports "checkable"). Let me measure the real pixel-mover directly: the loaded font-face set **and** the rendered glyph width.

The `<p>` has a geometry-pinned `width: 600px`, so box width can't vary by font. Let me drop the fixed geometry from the e2e doc so the text flows at its natural (font-dependent) width.

The block `<p>` fills the container width (1280) regardless of font. Let me measure the actual glyph-run width via a Range over the text content:

All 8 UATs pass, including the browser end-to-end proving the face loads and paints at a different glyph width vs fallback. Now let me run the broader L1 suite to confirm no regressions from my schema/validate/render/fold changes.

One reconciliation test failed. Let me inspect it — need to determine if my change caused it or it's pre-existing.

My validator change only runs on docs with a `resources` field — none of these variants have one, so it can't be my cause. Let me confirm which variant fails and whether it's pre-existing on HEAD.

I've stashed my changes. Let me confirm the reconciliation failure exists on clean HEAD (proving it's pre-existing, not mine), then restore my work.

Confirmed **pre-existing** — the reconciliation test fails on clean HEAD too (it uses a stale `capability` slot key that the schema renamed to `behavior`; unrelated to REQ-90). Let me restore my work.

Pre-existing failure, not mine — my changes are clean. Let me confirm REQ-90 is still green after the stash round-trip, then proceed to version bump + commit.

Green. Now the version bump and ticket prep. Let me check the version-bump interface and current ticket-update mechanics:

Version bumped to 0.0.176. Let me review my complete diff before committing:

The diff is focused and additive. Now let me commit exactly my REQ-90 files plus the version bump (not the unrelated untracked `storage/sites/gigabytealchemy/`):

Committed as `6cf5f488`. Now update the ticket. Let me check the ticket CLI surface:

Moved to free_coded. Let me verify the final ticket state:

REQ-90 is complete and free-coded. 

## Summary

Closed the **form hole** in the L1 language (REQ-90 / DOC-27): L1 carried font *handles* (`text.axes.fontFamily`) but had nowhere to bind a handle to its pixel-determining *substance* (the served `.woff2`), so a named face rendered as a serif fallback. All changes are additive on top of REQ-91's now-committed effect axes.

**What landed** (commit `6cf5f488`, v0.0.176, status `free_coded`):
- **schema** — document-level `resources.fonts` table: `family → served src`, optional `weight`/`style`; strict + typed like every other L1 field.
- **validate** — each font `src` clears the same URL-scheme allowlist as an image (served asset / http(s) only — no `data:`/remote-fetch smuggle); weight bounded to the CSS range.
- **render** — `renderL1Document`/`renderL1Page` emit `@font-face` through the sole safe sink: name-sanitised family, `isSafeUrl`+escaped `url()`, extension-derived `format()`, `font-display: swap`.
- **fold** — populates the table from the capture's mirrored faces, keeping only families a folded text leaf actually paints (an entry earns its place iff it moves a pixel).
- **capture** — passes the bundle's `theme.fonts` substance into the fold; `cmdRepro` already mirrors the assets.

**Tests** — 8 UATs (`test_UAT_FC_REQ-90_*`), all green: schema/envelope/render/fold plus a Chromium end-to-end that serves a page + the real joyful **Oswald** webfont and proves the bound face **loads** (`fonts.size===1`, status `loaded`) and **paints at a different glyph width** than the fallback — skipping cleanly where the engine or captured font is absent.

**Two notes worth flagging:**
1. **The coordination pause was real and correct** — REQ-91 had uncommitted work in all four of my target files; you landed it (`d399062f`) and I rebased my additions cleanly on top. No entanglement in the final commit.
2. **One unrelated pre-existing failure**: `tests/reconciliation-l1-substrate.test.ts` fails on clean HEAD (a variant uses a stale `capability` slot key that the schema renamed to `behavior` — REQ-87 drift). I verified it fails without my changes too, so it's **not** a REQ-90 regression — but it's a red test sitting in the suite if you want it filed separately.

The untracked `storage/sites/gigabytealchemy/` was left alone (not mine, gitignored territory).

<!-- xgd-chat-end -->