---
uid: bug-3bf390f7
id: BUG-23
type: bug
title: Reproduction hotlinks the captured origin instead of its mirrored local asset
  — hero renders only while the target site is up, hiding image regressions from the
  gate
created_by: xgd
created_at: '2026-07-24T22:51:03.848182+00:00'
updated_at: '2026-08-05T17:38:12.148866+00:00'
completed_at: '2026-08-05T17:38:12.148866+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 6017002597534ee9ae2ce7b5d899c5d61015f5a1
    reconcile_sha: null
    main_sha: null
  version: 0.0.194
  story_points: 3
  bundled_in: bundle-4ff83a8b
  chat_comment: comment-2c339d7a
---

Scope under [[request-7ff1bacd]] (REQ-88). Related to [[bug-ad50b1df]] (BUG-2, capture asset
loss) but distinct: the asset here *is* mirrored correctly — nothing referenced
it. Builds on [[bug-5908809a]] (BUG-13, section background-image nodes).

## Behavior (bug)
The reproduction hotlinked the live target instead of using its own mirrored
asset. Rendered output contained:

```css
.l1-7 { background-image: url("https://gigabytealchemy.ai/images/AlchemistLabWithTech.png") }
```

while the mirrored copy sat unused on disk at
`storage/sites/gigabytealchemy/draft/assets/AlchemistLabWithTech.png`.

`1c repro` copies bundle assets into the draft (`copiedAssets` path), and the
fold emits `backgroundImageUrl` as the **absolute remote URL** captured from the
source page. Nothing rewrote it to the local mirror.

## Why this matters
1. **It is not a reproduction.** The page rendered only because the original
   site was up and reachable.
2. **The perceptual gate was measuring the wrong thing.** Every `1c shot` /
   `1c diff` run compared the target against a page *serving the target's own
   image over the network*. Hero fidelity was guaranteed by hotlinking, not
   earned by the pipeline — so the gate could not detect an image-handling
   regression at all.
3. It silently egressed to a third-party host on every render and shot.

Point 2 is why this is high severity rather than cosmetic: a hole in the gate,
not just in the output.

## What changed

**`tools/generate/src/l1/assets.ts` (new) — `localizeAssets(doc, assets)`.**
One pure function that binds every asset-bearing axis in an L1 document to the
bundle's mirror, and accounts for what did not resolve on either side. It walks:

- `image` node `.src`
- `box` node `.axes.backgroundImageUrl`
- `doc.resources.fonts[].src`

Resolution uses the bundle's own origin→mirror map (`capture.json`'s
`assets[]`, `src` → `localPath`). An absolute handle resolves to `/<localPath>`;
a handle that is already site-local (mirrored font faces arrive this way) is
normalized to root-relative so it resolves identically from any page depth.
Returns `{ doc, rewritten, unmirrored, unreferenced }`.

**Unmirrored handles fail the import.** `cmdRepro` throws when any absolute
handle has no mirrored counterpart, naming each one and pointing at re-capture.
Falling back to the origin for "just this one asset" is exactly the defect —
a reproduction is self-contained or it does not exist. There is no partial
mode and no silent hotlink path.

**Unreferenced mirrored assets are reported (AC-4).** Assets of kind `image` or
`font` whose bytes are in the bundle but which no node references are returned
on `ReproResult.unreferencedAssets` and printed by `1c repro` as a fold gap.
Stylesheets/scripts/the document itself are page subresources, never
L1-referenceable, so they are excluded from the signal rather than reported as
noise.

**Supporting changes.** `readCaptureAssets(bundleDir)` in `capture/bundle.ts` —
a tolerant reader returning `[]` when a bundle has no `capture.json` (a bundle
with no remote handles reproduces fine; one with them fails loudly downstream).
`ReproResult` gains `localizedAssets` + `unreferencedAssets`, both surfaced in
the `1c repro` CLI summary.

## Design decisions

- **The rewrite lives in `cmdRepro`, not in the fold.** The fold stays a
  faithful transcription of what the capture read; the *site* — which owns the
  mirror — binds handles to it. This leaves `1c l1-gate` (which folds
  `multistate.json` directly) untouched.
- **Fail loud on an unmirrored handle** rather than dropping the node or keeping
  the remote URL. Keeping it preserves the gate hole for that asset; dropping it
  silently deletes content. Verified against both live bundles
  (gigabytealchemy, joyfulculinarycreations): every referenced handle has a
  mirror, so the strict path costs nothing today and names the gap the moment
  one does not.
- **Font faces are normalized too**, closing a latent depth bug: they arrived as
  relative `assets/…` and are now root-relative.

## Verification

`1c repro gigabytealchemy && 1c render gigabytealchemy` →
`grep -rEo "https?://" ` over the rendered HTML + CSS returns **nothing**; the
hero resolves to `/assets/AlchemistLabWithTech.png`, present on disk in the
render output. Same for `joyfulculinarycreations` (4 image leaves + 4 font
faces, zero absolute URLs). The gigabytealchemy repro now also reports its one
real fold gap: `assets/8vIJ7ww63mVu7gt79mT7PkRXMw.woff2` — Cinzel is painted
but its face was never bound (a REQ-90 gap this made visible).

## Test plan

`tests/bug23-repro-local-assets.test.ts` — 6 UATs driving `1c repro` +
`1c render` end to end against a fixture bundle whose fold carries remote
handles:

- `test_UAT_FC_BUG-23_media_handles_resolve_to_local_mirror` (AC-1) — background
  image, image-leaf `src`, and font face all name the mirror; no origin URL
  survives in the written page.
- `test_UAT_FC_BUG-23_rendered_output_is_free_of_captured_origin` (AC-2) — no
  rendered HTML or CSS artifact contains the captured origin.
- `test_UAT_FC_BUG-23_reproduction_renders_without_reaching_the_target_host`
  (AC-3) — every handle the render emits resolves to a file that exists in the
  render output, and no absolute handle remains: the page cannot reach the
  target host because it never names it.
- `test_UAT_FC_BUG-23_unreferenced_mirrored_assets_are_reported_as_a_fold_gap`
  (AC-4) — the orphan image is reported; the stylesheet subresource is not.
- `test_UAT_FC_BUG-23_unmirrored_handle_fails_the_import_rather_than_hotlinking`
  — dropping the hero from the asset map fails the import, naming the handle.
- `test_UAT_FC_BUG-23_localize_is_pure_and_normalizes_already_local_handles` —
  the caller's document is not mutated, and a second pass is a no-op.

Regression scope (all green): `req88-l1-repro-pipeline`, `req86-e2e-repro`,
`reconciliation-l1-fold`, `reconciliation-l1-substrate`,
`bug13-fold-section-background`, `bug12-cross-origin-font-faces`, `capture`,
`naming`. Workspace typecheck clean.

## Acceptance criteria
1. `backgroundImageUrl` (and any other asset-bearing axis) resolves to the
   draft-local mirrored path, not the captured remote URL.
2. Rendered output contains no absolute URL pointing at the captured origin.
3. Reproduction renders correctly with no network access to the target host.
4. Assets present in the bundle but referenced by no node are reported (they
   indicate a fold gap), rather than silently mirrored and ignored.