---
uid: report-757c442b
id: REPORT-1793
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-08-10T10:40:53.774733+00:00'
updated_at: '2026-08-10T10:40:53.774733+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: bundle-e59210c5
---

All three review findings are fixed and verified. Working tree changes are left for the workflow's commit step, consistent with the pattern on this branch.

## Issues fixed

**1. Critical — `validateSvg` did not enforce its entity invariant** (`packages/site-schema/src/svg.ts`)

- Added `entitiesAreAllowed()` at `svg.ts:203-221`: scans **every** `&` in an attribute value with the sticky `ALLOWED_ENTITY` pattern, exactly as the character-data scanner at `:256-265` already did. Replaced the single-shot check at the old `:332-337` with `if (/[<>]/.test(value) || !entitiesAreAllowed(value))` (`svg.ts:333-335`).
- Consolidated the now-redundant `ALLOWED_ENTITY_AT` into the one sticky `ALLOWED_ENTITY` rather than leaving two identical patterns; the docstring records why sharing sticky state across the two loops is safe (each sets `lastIndex` immediately before its own `exec`).
- Executed against the shipped validator — all three rows from the review's table now behave as documented:

| Input | Expected | Now |
|---|---|---|
| `<text x="&#x3c;">` | reject | reject ✓ |
| `<text x="&amp;&#x3c;script&#x3e;">` | reject | **reject** ✓ |
| `<rect fill="&amp;url&#x28;http://evil/x&#x29;"/>` | reject | **reject** ✓ |
| `<title>Bea &amp; Co</title>` | accept | accept ✓ |
| `<text font-family="Bea &amp; Co">` | accept | accept ✓ |

- UATs added to `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts`: both payloads added to `HOSTILE` (so they run through the `write_image` refusal path *and* the validator-closure test), plus a dedicated `test_UAT_FC_REQ_130_an_allowed_entity_does_not_vouch_for_the_ones_after_it` at `:502-528` covering a third smuggling shape (`clip-path="&quot;&#x75;rl(#a)"`) and asserting both the text-content and attribute-value legitimate-entity cases still pass.

**2. Critical — raw NUL bytes in two production source files**

- `tools/generate/src/cli/ai/host.ts:145` (2 bytes) and `tools/generate/src/cli/preview.ts:170` (1 byte) replaced with the `\0` escape, matching `mintedKey` at `host.ts:167`. Runtime strings unchanged; no test moved.
- `git diff --numstat --no-index /dev/null <file>` now reports `415 0` and `177 0` instead of `- -`. NUL scan is clean. The only remaining binary paths in the bundle diff are the four `.woff2` fonts.

**Fallout this exposed and I also fixed**: making `host.ts` text again un-hid it from `git grep -I`, and `tests/bug32-webui-scope-rebrand.test.ts` immediately failed — a prose mention of the component scope literal at `host.ts:12` had been sitting outside its single permitted declaration site, invisible to the guardrail precisely because the file was binary. Reworded the comment to name the `ai` component and point at `sharedModuleUrl` instead. This is the concrete instance of the operational hazard the review described.

**3. Warning — wrong byte offset in attribute errors** (`svg.ts:318-321`)

`where` now computes `at + 1 + opening.length + attribute.index`, hopping past the `<` and the element name so the `attrs`-relative offset lands in `source`. Verified: an `onclick` on `<rect x="1" y="2" onclick="alert(1)"/>` now reports byte 58, which slices to `onclick="alert(1)"/>`.

## Gates

| Gate | Command | Result |
|---|---|---|
| Tests | `npx vitest run` | **1419 passed, 67 skipped, 0 failed** (200 files) — baseline 1418, +1 new UAT |
| Build | `pnpm -r build` | pass |
| Typecheck | `pnpm -r typecheck` | pass |

Lint: root has no `eslint.config.js`, so `npx eslint` can't run standalone here; the configured suite invokes it through the vitest plugin, which the workflow runs. No new lint-shaped risk introduced — the edits are comments, one extracted function, and test cases in the file's existing style.

## Confidence

High on the two criticals — both were verified by executing the exact checks the review prescribed, not by inspection. The entity hole is closed at the sink the reviewer named, with the closure property (per-`&`, no vouching) now pinned by tests that fail against the old code. Residual risk is limited to the reviewer raising something new: nothing else in the bundle was restructured, and the one adjacent failure surfaced by fixing the NUL bytes was itself fixed rather than suppressed.
