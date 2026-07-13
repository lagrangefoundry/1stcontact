---
uid: comment-d49f31b0
id: COMMENT-96
type: comment
title: Comment on request REQ-53
created_by: xgd
created_at: '2026-07-12T23:17:24.423621+00:00'
updated_at: '2026-07-12T23:33:17.767737+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-52fc5c06
  kind: chat_transcript
---

<!-- xgd-turn id="8e1badff-053d-4078-8cf4-09860b9bc789-user" -->

<!-- xgd-chat role="user" ts="2026-07-12T23:17:21.330851+00:00" -->
#### You
Please implement this ticket

<!-- xgd-turn id="8e1badff-053d-4078-8cf4-09860b9bc789-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-12T23:33:17.737362+00:00" -->
#### Claude
I'll start by reading the current ticket state and exploring the values-diff implementation to understand what needs to change.

The ticket body is already fully populated with requirements and UATs. Good — this is my scope ticket at `draft`. Let me wait for the exploration to complete before touching code.

Let me look at the versioning setup while I wait.

Let me read the rest of the file — the `diffManifests` implementation and CLI option handling.

Now let me find the CLI command handler that parses the flags.

The core module and CLI wiring are clear. Let me check all usages of `strict` and `sizeTolerancePx` across the codebase and read the existing REQ-35 test file.

The investigation confirms my analysis. Let me read the existing REQ-35 test file to understand the test style and fixtures before writing.

The test style is clear. Splitting `size` and tightening `position` defaults could break existing REQ-47/48 geometry tests. Let me check those before making changes.

Important finding: `test_UAT_FC_REQ-48_cross_engine_subpixel_layout_tolerated` (req48 line 528) calls `diffManifests` directly with a 2px offset expecting NO position/size delta — this will break under exact position defaults. That's the cross-engine case, which is legitimately a "not-authored" tolerance. Let me check the test infrastructure and other near-value clean expectations.

The test infrastructure is clear (vitest, `node_modules/.bin/vitest` present). The calibration seeds all inject large defects (fire regardless of tightening). Only the req48 cross-engine subpixel test needs updating (it's the legitimate "not-authored" cross-engine case). `diffMultiState` isn't wired to a shipped CLI gate, so no production regression.

Let me update the ticket type to `request`→ keep, but first record the design decision as a transcript comment (Step 1.5 — this is a CLI session), then make edits. Let me start with the core code changes.

Now I'll make the edits. First, the `DiffOptions` JSDoc and `strict`→`tolerant` field:

Now the per-metric field JSDocs (color through weight):

Now the tolerance-resolution logic in `diffManifests`:

Now the `compareGeometry` width/height split:

Now the CLI (`index.ts`) — usage text and `diffOptions` build, plus new per-metric flags:

Now `args.ts` boolean flags and `fidelity.ts` comment:

Now update the req48 cross-engine subpixel test to be explicit about its not-authored tolerance:

Now update the REQ-35 test suite to the new policy — trim the now-obsolete default-suppression tests, preserve the orthogonal behaviors (inferred-colour, ΔEOK metric), and point tolerance-policy coverage at REQ-53. Let me rewrite it:

Now create the new REQ-53 test file covering all the acceptance criteria:

Let me verify the types I import are exported from the CLI barrel, then run the affected tests.

`Box` isn't exported from the barrel. Let me check how req47/req48 define their `box` helper:

They construct inline without importing `Box`. Let me fix my test file to drop the `Box`/`SectionValues` type imports and construct inline (matching the codebase convention):

Now let me run the affected test files (fast, non-browser tests) to validate:

All pass. Now run the geometry-heavy REQ-47/48/51 fidelity suites that could be affected by the tightened defaults:

Two failures, both tests asserting the OLD loose defaults — exactly what REQ-53 changes. Let me read and update them to reflect the new policy (the tolerance-band intent moves under the explicit opt-out).

All fidelity suites green. Let me run the full test suite and check for lint/typecheck to ensure nothing else references the removed `strict`/`sizeTolerancePx`:

No residual references. Let me run a TypeScript typecheck and the full test suite:

tsc passed clean for tools/generate. Let me confirm whether tests are type-checked anywhere and run the full suite:

Full suite green: **543 tests pass across 50 files**. The typecheck is clean. Now let me follow the free-coding lifecycle: version bump, then commit.

Version bumped to 0.0.97. There are pre-existing unrelated faelan deletions in the working tree — I must stage only my files. Let me check what the version bump touched and stage precisely:

Staged exactly my 9 files (faelan deletions left unstaged). Now commit with `[FREE-CODED]`:

Now move the ticket to `free_coded` via the gate command, then record story points:

Ticket is `free_coded`. Now sync the ticket body with an implementation-notes section documenting the decisions made (preserving the existing body via append):

Let me verify the final ticket state and git status:

Done. REQ-53 is implemented, committed, and parked at `free_coded`.

## Summary

I made **exact match the default** in `1c values-diff`, retaining tolerance only where the rendered value is genuinely not authorable.

**Code (`tools/generate/src/cli/`):**
- `capture/values-diff.ts` — Inverted the tolerance model. Replaced `strict` with `tolerant` in `DiffOptions`; the `tol()` helper now resolves to an **exact default** unless a per-metric override or `--tolerant` is set. Group A axes (colour, font-size/weight, line-height, letter-spacing, padding, border-width, corner-radius) → **0**; position + width → **1** (±1 integer-rounding allowance); split the combined `size` axis so **width is exact** and **height keeps an 8px wrapping tolerance**; gradient angle / overlay opacity / content anchor stay art-directed-tolerant.
- `index.ts` / `args.ts` / `fidelity.ts` — swapped `--strict` for `--tolerant` (no legacy dual-mode), added `--position-tol/--width-tol/--height-tol/--radius-tol`, updated usage text.

**Design decision worth flagging:** the size "split" is a *tolerance* split within the single `size` delta property — width and height use separate tolerances but still emit one `size` delta, preserving the object-card `box → [position, size]` mapping and the `w×h` label. A real width gap can no longer hide behind the height wrapping allowance.

**Tests:**
- New `tests/req53-values-diff-exact.test.ts` covering all five ACs plus a per-metric-override test.
- Trimmed `req35-values-diff-noise.test.ts` to the behaviours that survive the flip (OKLab metric, inferred-colour low-confidence); removed the obsolete default-jitter/`--strict` tests.
- Pointed the two REQ-47/48 tolerance-band tests at the explicit `{ tolerant: true }` opt-out.

**Verification:** full suite **543 tests / 50 files pass**; `tsc --noEmit` clean.

**Lifecycle:** version bumped `0.0.96 → 0.0.97`, committed `1f625dff` with `[FREE-CODED]` (only my 9 files staged — the pre-existing faelan deletions were left untouched), ticket gated to `free_coded` with `story_points: 3` and an implementation-notes section appended.

It's parked at `free_coded` for you to validate. Promotion to `ready_to_reconcile` is your call when you're ready.

<!-- xgd-chat-end -->