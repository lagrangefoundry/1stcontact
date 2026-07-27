---
uid: comment-2c339d7a
id: COMMENT-516
type: comment
title: Comment on bug BUG-23
created_by: xgd
created_at: '2026-07-25T01:18:56.878251+00:00'
updated_at: '2026-07-25T01:30:04.008589+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-3bf390f7
  kind: chat_transcript
---

<!-- xgd-turn id="8f458c5e-7abc-4f91-995c-9be0b8b2fbdc-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T01:18:54.755460+00:00" -->
#### You
Please free code this fix

<!-- xgd-turn id="bfcd9a63-92d5-4465-b21c-a4570faab657-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T01:20:48.549952+00:00" -->
#### You
Please free code this fix

<!-- xgd-turn id="bfcd9a63-92d5-4465-b21c-a4570faab657-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-25T01:30:03.977616+00:00" -->
#### Claude
I'll start by getting the ticket state and investigating the fold/repro code.

The uid I guessed is BUG-21. Let me find BUG-23.

Now let me check the L1 index exports and the CLI output surface, then write the code.

Now I'll write the localization module.

Now wire it into `cmdRepro` and add a tolerant capture-assets reader.

Now update `cmdRepro`:

Now export from the l1 index and surface in the CLI output.

Now the UATs.

The tree carries in-progress BUG-21 work from a prior session. Let me isolate it and verify my change standalone.

Now update the ticket body, then commit.

These are concurrent BUG-21/BUG-22 sessions writing into the same worktree. I'll commit only my paths.

Now restore the other sessions' work I set aside.

The other sessions' WIP is intact. Now the free-coded gate:

Done. BUG-23 is at `free_coded` with commit `e6073688`.

## What changed

**`tools/generate/src/l1/assets.ts` (new)** — `localizeAssets(doc, assets)`, one pure function that binds every asset-bearing axis in an L1 document to the bundle's mirror using `capture.json`'s `src` → `localPath` map:

- `image` node `.src`
- `box` node `.axes.backgroundImageUrl`
- `doc.resources.fonts[].src`

Absolute handles resolve to `/<localPath>`; already-local handles (mirrored font faces arrive this way) normalize to root-relative, which also closed a latent depth bug.

**Unmirrored handles fail the import.** `cmdRepro` throws, naming each handle and pointing at re-capture. Falling back to the origin for "just this one asset" is exactly the defect — no partial mode, no silent hotlink path. Verified safe: every referenced handle in both live bundles has a mirror.

**Unreferenced mirrored assets are reported** on `ReproResult.unreferencedAssets` and printed by `1c repro`. Restricted to `image`/`font` — stylesheets and scripts are page subresources, never L1-referenceable, so they'd be noise.

The rewrite lives in `cmdRepro`, not the fold: the fold stays a faithful transcription of the capture; the site — which owns the mirror — binds handles to it. `1c l1-gate` (which folds `multistate.json` directly) is untouched.

## Verification

Against the real bundles, not just fixtures:

- `1c repro gigabytealchemy && 1c render gigabytealchemy` → grep for `https?://` across rendered HTML + CSS returns **nothing**; hero resolves to `/assets/AlchemistLabWithTech.png`, present on disk in the render output.
- Same for `joyfulculinarycreations` — 4 image leaves + 4 font faces, zero absolute URLs.
- The gigabytealchemy repro now reports its one real fold gap: `assets/8vIJ7ww63mVu7gt79mT7PkRXMw.woff2` — Cinzel is painted but its face was never bound (a REQ-90 gap this made visible).

6 UATs in `tests/bug23-repro-local-assets.test.ts` (one per AC plus fail-loud and purity/idempotence). Regression scope green: `req88-l1-repro-pipeline`, `req86-e2e-repro`, `reconciliation-l1-fold`, `reconciliation-l1-substrate`, `bug13-fold-section-background`, `bug12-cross-origin-font-faces`, `capture`, `naming`. Workspace typecheck clean.

## One thing to flag

The worktree carries **in-progress BUG-21 and BUG-22 work from other sessions** — `fold.ts`, `capture/extract.ts`, `capture/types.ts`, `capture/sections.ts`, `capture/values-diff.ts`, and `tests/bug21-control-surface-outset.test.ts`. Files appeared mid-session, so those sessions look concurrent. I committed only BUG-23's paths by explicit pathspec, and verified their WIP is byte-identical after I set it aside and restored it. Nothing of theirs is staged or committed under this ticket — but concurrent sessions in one worktree will collide on the `package.json` version bump if two of us bump at once.

<!-- xgd-chat-end -->