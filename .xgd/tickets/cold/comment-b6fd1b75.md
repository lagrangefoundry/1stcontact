---
uid: comment-b6fd1b75
id: COMMENT-398
type: comment
title: Comment on bug BUG-12
created_by: xgd
created_at: '2026-07-23T19:34:26.571360+00:00'
updated_at: '2026-07-23T19:43:48.412117+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-61f43435
  kind: chat_transcript
---

<!-- xgd-turn id="264faafc-cc02-4ef4-b294-ef368efcf951-user" -->

<!-- xgd-chat role="user" ts="2026-07-23T19:34:24.470868+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="264faafc-cc02-4ef4-b294-ef368efcf951-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-23T19:43:48.380945+00:00" -->
#### Claude
I'll start by reading the current ticket state and the relevant code to understand the exact wire that needs to be built.

The ticket body is well-populated. Let me investigate the actual code — the fold, extract, and the multistate wiring.

The fold already receives fonts via `fontResourcesFromTheme(result.capture.theme.fonts)` at capture.ts:82. So the wire partly exists. Let me trace why it produces nothing — the theme font building and an actual captured bundle.

The Cinzel woff2 **was** mirrored as an asset, but `theme.fonts` shows `files: []`. The break is in `signals.fontFaces` not connecting. Let me read the extraction script's font-face logic.

Root cause confirmed: line 959 — cross-origin stylesheets (Google Fonts `css2`) throw `SecurityError` on `.cssRules` access and are skipped, so `signals.fontFaces` never sees Cinzel, even though its woff2 was mirrored. Let me verify the captured stylesheet bytes contain the @font-face rule we need.

The captured stylesheet bytes contain exactly what we need — the live CSSOM just can't read them cross-origin. The fix is to parse `@font-face` from the captured stylesheet **response bytes**. Let me read the pipeline's asset/response handling.

I now fully understand the bug. The fix belongs in the capture pipeline: parse `@font-face` from captured stylesheet **bytes** (which include cross-origin sheets the CSSOM blocks). Let me first set up task tracking and update the ticket, then implement.

Let me record the refined root cause on the ticket (preserving the existing body) and check the version-bump tooling.

Now I'll implement the fix. First, the `@font-face`-from-bytes parser helper in pipeline.ts:

Now update the import to include `RawFontFace`, and rewire `captureOnce`:

The fix is in place. Now let me find the existing capture-pipeline test patterns to write a proper UAT with a fake driver.

Now let me look at the fake-driver pattern used to drive `runCapturePipeline`:

The `FakeDriver` + `runCapturePipeline` pattern is exactly right. Let me write the BUG-12 UAT — a full-flow test proving cross-origin `@font-face` bytes now reach the theme (and through to the folded `l1.resources`).

The fourth test's `driverFactory` is garbled — it takes a factory, not an instance. Let me fix it:

Now let me run the new test plus the regression scope (capture + REQ-90 + REQ-83 fold):

Three focused tests pass — the theme wire is fixed. The full-flow test fails because the fold found no Cinzel-painting leaf. Let me check whether `flattenSignals` gives band content runs the geometry the fold needs.

The content run needs a painted `box` for the fold to emit a text leaf. Let me add geometry to the heading run:

All 4 pass, including the full-flow capture→fold→`l1.resources` test. Now the regression scope and a typecheck:

Regression green. Now a typecheck on the touched package (the memory note warns green vitest ≠ typecheck-clean):

No tsc errors from tools/generate. Let me confirm the test file itself typechecks under whatever config covers `tests/`:

tsc clean. The fix is complete and tested. Now let me update the ticket body with the refined root cause (preserving the scope/coordination/links), bump the version, and commit.

Committed. Now promote to `free_coded` via the gate command and set story points:

Done. Let me verify the final ticket state:

BUG-12 is free-coded and complete. Summary:

## What the bug actually was

The fold *already* received fonts via `fontResourcesFromTheme(capture.theme.fonts)` (REQ-90). The real break was one layer up: the in-page extractor reads `@font-face` from the **live CSSOM** (`extract.ts:957`), and `styleSheet.cssRules` throws `SecurityError` on any **cross-origin** stylesheet — Google Fonts' `css2?family=Cinzel`, most CDN font sheets. The `catch { continue }` silently dropped those faces. So `signals.fontFaces` was empty, the family→woff2 mapping never formed, `theme.fonts[*].files` stayed `[]`, and the fold's resource table was starved (`doc.resources: null`) — even though the `.woff2` had been mirrored into the bundle. The `Cinzel` handle dangled and rendered as a serif fallback.

I confirmed this empirically against the gigabytealchemy bundle: `theme.fonts` had `files: []` for `Cinzel` while `assets/8vIJ…woff2` sat right there, and the captured `css2` bytes contained the exact `@font-face` rule.

## The fix (capture-side only)

`tools/generate/src/cli/capture/pipeline.ts`:
- `fontFacesFromStylesheets(responses)` — parses `@font-face` from the cached stylesheet **response bytes** (which are captured regardless of CSSOM cross-origin blocking, per DOC-13 §3).
- `fontFilesByFamilyOf(faces, urlToLocal)` — unions those with the same-origin CSSOM faces, dedups per family, keeps only faces whose `src` actually mirrored.

`fold.ts` was **not** touched — no churn against BUG-11's `fold.ts` work.

## Evidence
`tests/bug12-cross-origin-font-faces.test.ts` (4 UATs, all green): theme-file population, a negative control (unmirrored face → no files), same-origin union/dedup, and a full-flow `cmdCapturePage` test proving cross-origin bytes → theme → fold → `l1.resources.fonts`. Regression scope (capture, REQ-90, REQ-83 fold, REQ-24) — 27 passed. `tsc -p tools/generate` clean.

- Commit: `c78f27ae` `[FREE-CODED]`, version `0.0.184`, `status=free_coded`, `story_points=2`.

Promotion to `ready_to_reconcile` is your call when you've validated the font renders correctly. Note there's a pre-existing unstaged change (`storage/sites/gigabytealchemy/draft/pages/home.json`) I left untouched — it isn't part of this fix.

<!-- xgd-chat-end -->