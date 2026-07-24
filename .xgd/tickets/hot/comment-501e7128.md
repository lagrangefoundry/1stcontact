---
uid: comment-501e7128
id: COMMENT-399
type: comment
title: Comment on bug BUG-13
created_by: xgd
created_at: '2026-07-23T19:59:16.666430+00:00'
updated_at: '2026-07-23T20:12:23.235954+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-5908809a
  kind: chat_transcript
---

<!-- xgd-turn id="6b2ab845-6ae4-46da-a33b-8b968fb8385d-user" -->

<!-- xgd-chat role="user" ts="2026-07-23T19:59:14.378781+00:00" -->
#### You
Please free code this bug

<!-- xgd-turn id="6b2ab845-6ae4-46da-a33b-8b968fb8385d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-23T20:12:23.200818+00:00" -->
#### Claude
I'll start by reading the current ticket state and investigating the bug.

Let me investigate the relevant code. I'll look at the fold logic, the capture structures, and BUG-11's surface-box emission.

Now let me look at the existing BUG-11 test to mirror structure, and confirm the fold's imports/helpers I'll reuse.

Now I have a complete picture. Let me implement the fix. First, the `SectionValues` interface and imports in `values-diff.ts`:

Now add a URL-extraction helper and populate both flatten functions:

Now the fold — add the section-background box emit pass. Let me add the import for `SectionValues` and the emit logic:

Now add the section-background fold helper before `foldToL1`:

Now wire it into root assembly:

Now update the renderer so a background image renders as a cover fill (not tiled) at the band's size:

Now let me check test exports and the RawBand/Capture shapes I'll need for the tests:

Now let me write the UAT test file:

Let me verify the `sampleFidelityProbe` signature before running:

Now let me run the new test:

All 9 pass. Now the regression scope — the fold, capture values-diff, and L1 tests:

The failing file (`reconciliation-capability-modules.test.ts`) is a pre-existing failure unrelated to BUG-13 — it imports `validateCapabilityConfig`/`validateCapabilitySlots` which don't exist in the source (capability-module refactor drift, not my code). Let me confirm my changes typecheck cleanly:

Both typecheck clean. Let me run the capture/values-diff tests directly to confirm my flatten changes are safe:

All green. The one failing file is a pre-existing, unrelated capability-module test-import drift (never touched by my change). Now the free-coding commit steps — version bump first:

The version file is `package.json` (JS project). The `home.json` change is a pre-existing unrelated modification — I'll exclude it. Staging my files:

Now update the ticket body to reflect the implemented approach (preserving the existing scope/dependencies):

Let me verify the final ticket state:

BUG-13 is free-coded and complete. Here's what I did.

## Summary

**Root cause:** A page's hero/section imagery is painted as CSS `background-image` on the band (`RawBand.backgroundImage`), not as `<img>` elements. That value was captured but never projected into the value manifest the fold reads, and `SectionValues` carried no geometry — so **0 of 59** fold-input elements had an image `src` and nothing represented the imagery.

**Fix** — carry the band background through the manifest as a *section-level treatment* (not a new element-diff surface) and fold it to an L1 `box`:

1. **`values-diff.ts`** — `SectionValues` gains `backgroundImageUrl?` + `box?`. `flattenSignals` extracts the `url(...)` from `RawBand.backgroundImage`; `flattenCapture` reads the mirrored-local `section.background.image`. Unsafe schemes (`data:`, `javascript:`) are dropped via `isSafeUrl` at projection time, so a disallowed URL can never reach — and throw in — the envelope validator.
2. **`fold.ts`** — `foldSectionBackgrounds` matches section entries by ordinal index across the sampled widths and emits one `box` per section carrying `axes.backgroundImageUrl` + a geometry keyframe track, painted beneath all content (`[...sectionBg, ...surfaces, ...content]`).
3. **`render.ts`** — a box with a real background image URL now also emits `background-size: cover; background-position: center; background-repeat: no-repeat` — the faithful hero/section backdrop default.

**Verification:**
- New UATs `test_UAT_FC_BUG-13_*` (9 tests) — all pass, driving real `foldToL1` / `renderL1Document` / `flattenSignals` / `flattenCapture` / `sampleFidelityProbe`.
- Regression scope: 7 fold/L1 suites (51 tests) + 4 values-diff/capture suites (48 tests) all green; `sampleFidelity` (text geometry) confirmed unchanged.
- `tsc --noEmit` clean on `tools/generate` and `packages/framework`.

The one unrelated failing test file (`reconciliation-capability-modules.test.ts`) is a pre-existing import-drift failure in the capability-module code — untouched by this change.

**Free-coding lifecycle:** version bumped `0.0.184 → 0.0.185`, committed `0ef00248` with `[FREE-CODED]`, ticket at `status=free_coded` with `commits` + `story_points: 3` and body synced to the implementation.

The ticket is parked at `free_coded` — promote to `ready_to_reconcile` when you're ready for the matrix to catch up.

<!-- xgd-chat-end -->