---
uid: report-59a9fc12
id: REPORT-1795
type: report
title: 'Code Review: bundle-e59210c5'
created_by: xgd
created_at: '2026-08-10T10:49:17.948433+00:00'
updated_at: '2026-08-10T10:49:17.948433+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-e59210c5
  anchor_uid: bundle-e59210c5
---

# Code Review

**Result**: PASS

## Summary

Re-review of bundle-e59210c5 after `fix_review_free_coded`. The nine free-coded commits (REQ-119/121/122/126/127/128/129/130 + a webui scope fix) land request-time draft/edit rendering, an AI control surface over the structured-edit commands, a live chat pane, background-image selection and a generated-SVG asset channel. Both criticals from the prior review (`report-6869af7f`) are closed, and closed at the sink that matters — I verified the SVG entity fix end-to-end through the CLI, not by reading the patch. The one warning was fixed too. All configured gates pass by execution in this worktree, every new entry point is wired and runs, and nothing else in the bundle was disturbed.

## Quality Gates

Verified by execution here, **not** taken from the scoped quality report — `report-259d2d0a` records `"suites": {}` / 0 tests and a lint duration of 1.2e-4 s, so it is vacuous as evidence for either gate.

| Gate | Command | Result |
|---|---|---|
| Tests | `npx vitest run` | **1419 passed, 67 skipped, 0 failed** (200 files) |
| Build | `pnpm -r build` | **pass** (control-app + public-site `tsc --noEmit`) |
| Typecheck | `pnpm -r typecheck` | **pass** (site-schema, framework, generate) |
| Lint | report `report-259d2d0a` | 0 errors, 0 warnings — but see note |

Baseline was 1418 passed; +1 is the new REQ-130 entity UAT. The 67 skips are the pre-existing `WEBUI_INSTALLED` / Astro gating, unchanged.

Lint note (informational, not a gate failure): the repository has no root `eslint.config.js` and `package.json` declares no `lint` script, so the reported `0 errors / 0 warnings` is vacuously true rather than a linter having run clean. This is pre-existing and outside this bundle's scope.

Flake observed (does **not** block): the first full-suite run failed `tests/req117-builder-viewport-fill.test.ts > test_UAT_FC_REQ-117_preview_frame_tracks_the_window_height` with `expected 0 to be greater than 700` — a real-browser measurement returning a zero-height frame under full-suite parallel load. It passes in isolation (3 passed, 2914 ms) and the whole suite passed clean on immediate re-run. The file is **not** touched by this bundle (`git diff main..HEAD` shows no change to it), so this is a pre-existing non-determinism in that browser test, not a regression. Recorded as a warning below.

## Fix Verification (prior review's findings)

| # | Finding | Status | Evidence |
|---|---|---|---|
| 1 | `validateSvg` did not enforce its documented entity invariant | **Fixed** | `packages/site-schema/src/svg.ts:200-220` — `entitiesAreAllowed()` scans **every** `&` with the sticky `ALLOWED_ENTITY`, mirroring the character-data scanner at `:274-283`; called at `:354`. `ALLOWED_ENTITY_AT` deleted rather than left beside its replacement. |
| 2 | Raw NUL bytes made two production sources binary to git | **Fixed** | NUL scan clean on both files; `git diff main..HEAD --numstat` now reports `417 0` for `tools/generate/src/cli/ai/host.ts` and `177 0` for `tools/generate/src/cli/preview.ts` (was `- -`). The only remaining binary paths in the bundle diff are the four `.woff2` fonts, which is correct. |
| 3 | Wrong byte offset in attribute error messages (warning) | **Fixed** | `svg.ts:337` — `where = at + 1 + opening.length + attribute.index`. Verified live: the smuggled `fill` in `<svg …><rect fill="…"/></svg>` reports **byte 46**, which is exactly the `fill` token. |

**Independent verification of Fix 1** — I re-ran the review's own attack table through the shipped CLI (`1c asset write`), the model-reachable sink, not just the exported function:

| Input | Expected | Actual |
|---|---|---|
| `<title>Bea &amp; Co</title>` + `<rect fill="#ff0000"/>` | accept | `{"ok":true,…,"src":"/assets/mark.svg"}` ✓ |
| `<rect fill="&amp;url&#x28;http://evil.example/x&#x29;"/>` | reject | `SCHEMA_INVALID` — *byte 46: 'fill' carries markup or an entity in its value* ✓ |
| `<text x="&amp;&#x3c;script&#x3e;">` | reject | `SCHEMA_INVALID` — *byte 46: 'x' carries markup or an entity in its value* ✓ |
| `<script>alert(1)</script>` | reject | `SCHEMA_INVALID` — *`<script>` is not an element a generated image may use* ✓ |

The loop is correct on inspection as well: `ALLOWED_ENTITY` is sticky (`/y`), `lastIndex` is set immediately before each `exec` at both call sites and read after neither, so sharing the pattern across the two scanners is safe; the index advance (`index += entity[0].length - 1`, then `indexOf('&', index + 1)`) lands past the `;` and cannot skip an `&`.

The fix also repaired self-inflicted fallout honestly rather than suppressing it: making `host.ts` text again exposed it to `git grep -I`, `tests/bug32-webui-scope-rebrand.test.ts` began failing on a prose mention of the component scope literal, and the comment at `host.ts:12-15` was reworded to point at `sharedModuleUrl` instead. That test passes in the suite above.

## External Interface Accessibility

Every new surface is wired into its usage context:

| Surface | Wiring |
|---|---|
| `1c asset write`, `1c behavior list`, `1c module add/set/rm` | Imported and dispatched in `tools/generate/src/cli/index.ts` (`case 'module'`, `case 'behavior'` in the command switch; `dispatchEdit` handles all subs); all documented in `--help`. |
| `PreviewRenderer`, `fsDraftStore` | Exported from `tools/generate/src/cli/index.ts:91-92`. |
| `renderSiteFiles` / `RenderedSite` | Exported via `tools/generate/src/render/index.ts`; `renderSite` reduced to a writer over it. |
| `validateSvg` and friends | `export * from './svg'` in `packages/site-schema/src/index.ts:23`. |
| `presetSlots` / `hasSlotPreset` | `packages/framework/src/index.ts:131`; consumed at `tools/generate/src/cli/edit.ts:961,1013`. |
| `replaceL1Node` | `packages/site-schema/src/l1/index.ts:43`. |
| Request-time draft/edit channels | `apps/control-app/src/index.ts` proxies to the Node origin, which now serves the render rather than pre-built files. |

No dead module, uncalled function or unconfigured entry point found.

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `packages/site-schema/src/svg.ts:200-220` | The fix is an extracted, documented predicate rather than an inlined regex tweak, and it deletes the pattern it replaces instead of leaving two. Docstring states the non-obvious part (why per-`&`, why shared sticky state is safe). | Info — good |
| `tools/generate/src/render/render.ts:205-330` | `renderSiteFiles` is a genuine single render; `renderSite` is a thin writer over it. This is the substance of REQ-119's "one render implementation, not two" and it holds. `index.html` as a map copy of `${home.slug}.html` is safe: `homePage()` (`:200-202`) always returns a member of `site.pages`, and the page loop *throws* on a nested slug (`:279-284`) rather than skipping, so the entry always exists. | Info |
| `packages/framework/src/l2/presets.ts` | Behavior-id → default-slot-presentation index sits in `l2/`, the sanctioned location, and returns `null` (a legitimate answer) rather than throwing. `behaviorId` reaches it only as `meta.id` from `requireBehavior()`, so the object-literal lookup is never fed an arbitrary string. Correct placement under the L1/L2/behavior-module boundary. | Info |
| whole bundle | No debug code, no commented-out blocks, no TODO/FIXME stubs, no `console.log`, no `@ts-ignore`. One justified `eslint-disable-line` for the untyped runtime-loaded AI library, boundary narrowed by declared interfaces. | Info |

No structural or maintainability issues found.

## Checklist Compliance

No architecture, security or design checklist reports exist (`xgd ticket list --type report --filter fields.report_kind=<kind>` returns 0 items for all three). Sections omitted per the review contract.

## Smoke Test

Invoked live against sandbox sites, all exit clean, no stack traces:

- `1c --help` — new command groups present and rendered.
- `1c behavior list --json` — returns the contact-form (v4) and carousel (v3) catalog.
- `1c new` → `1c asset write … --content <svg>` → `{"ok":true,…,"src":"/assets/mark.svg"}`; the three hostile payloads above all refused with structured `SCHEMA_INVALID` + operator hint.
- `1c page add` → `1c module add … contact-form --config {…}` → `{"ok":true,…}` (L2 default look, no L1 authored).
- `1c module add … carousel` with no slots → refused: *'carousel' has no default presentation, so its slots must be supplied: slide, dots.* Correct refusal.
- `1c config set … seo '{"title":"Hi"}'` → merged as documented.
- `1c render <slug>` and `1c render <slug> --edit` → both channels rendered (2 files each). The nested-slug guard fires with a clear operator message when given `/contact`.

Sandbox sites and `storage/dist/sandbox` removed afterwards; `git status --porcelain` is empty.

## Issues Found

**Critical (must fix)**: none.

**Warnings (should fix)**:

- `tests/req117-builder-viewport-fill.test.ts::test_UAT_FC_REQ-117_preview_frame_tracks_the_window_height` is non-deterministic under full-suite parallel load — measured a 0 px frame on one of two full runs, passes in isolation. **Not introduced by this bundle** (the file is unchanged from `main`), so it does not block this review, but it will intermittently redden CI and should be stabilised under its own ticket rather than by raising a timeout.
- The repository has no configured linter (no root `eslint.config.js`, no `lint` script), so the quality report's `0 errors / 0 warnings` gate is not actually measuring anything. Pre-existing and out of scope here; worth a separate ticket.
