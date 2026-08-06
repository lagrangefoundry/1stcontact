---
uid: report-2259b61c
id: REPORT-1437
type: report
title: 'Code Review: bundle-e0143ffa'
created_by: xgd
created_at: '2026-08-06T19:26:34.905247+00:00'
updated_at: '2026-08-06T19:26:34.905247+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-e0143ffa
  anchor_uid: bundle-e0143ffa
---

# Code Review

**Result**: FAIL

## Summary

The implementation itself is of high quality — well-structured, densely and honestly documented, correctly wired into every entry point, and the security envelope is preserved. It fails on one gate only, and it is the non-negotiable one: **7 tests are red, and all 7 are regressions this bundle introduced.** REQ-109's `relativizeUrl` changed the emitted URL shape from `/assets/x` to `assets/x`; the ticket re-baselined nine expectations across eight suites but missed three reconciliation UAT suites, which still assert the pre-REQ-109 shape. Those suites are byte-identical to `main`, so the failures are caused by production code in this bundle, not by stale fixtures the bundle also owns.

The regression reached review because **every quality report in this reconcile ran zero test suites** (`"suites": {}`), so no gate ever executed the suite.

## Quality Gates

| Gate | Status | Evidence |
|---|---|---|
| Lint | PASS | report-e649b364: 0 errors, 0 warnings |
| Build | PASS | `pnpm -r build` exit 0 — 7 of 8 projects, `tsc --noEmit` clean for `apps/public-site` and `apps/control-app` |
| Tests | **FAIL** | `pnpm vitest run`: **3 files failed, 7 tests failed**, 1015 passed, 67 skipped (1089) |
| Coverage | Not reported | quality reports carry no coverage figure; `suites: {}` means no suite ran |

### The 7 failing tests (all new, all one root cause)

All three files are **unchanged from `main`** (`git diff main..HEAD` is empty for each), and `relativizeUrl` does **not** exist on `main` (`git show main:packages/framework/src/l1/render.ts` → 0 occurrences). The suites were therefore green on `main` and are red here because of `packages/framework/src/l1/render.ts`.

| File:line | Test | Expected → Actual |
|---|---|---|
| `tests/reconciliation-l1-control-and-texture.test.ts:537` | `test_UAT_AC831_five_axes_paint_as_ordered_layers_and_untextured_pages_are_byte_identical` | `url("/assets/hero.png")` → `url("assets/hero.png")` |
| `tests/reconciliation-l1-navigation.test.ts:162` | `test_UAT_AC839_run_box_and_container_become_the_navigable_element` | `href="/pricing"` → `href="pricing"` |
| `tests/reconciliation-l1-navigation.test.ts:219` | `test_UAT_AC840_linked_image_keeps_its_paint_inside_a_layout_free_enclosure` | `/<a href="\/gallery"/` → `<a href="gallery"` |
| `tests/reconciliation-l1-navigation.test.ts:316` | `test_UAT_AC842_target_outside_the_allowlist_never_becomes_a_live_link` | `href="/pricing"` → `href="pricing"` |
| `tests/reconciliation-l1-navigation.test.ts:612` | `test_UAT_AC848_a_definition_without_links_publishes_unchanged` | `src="/assets/a.png"` → `src="assets/a.png"` |
| `tests/reconciliation-l1-shared-axis-groups.test.ts:211` | `test_UAT_AC685_structured_axis_and_resource_table_payloads_emit_no_raw_css` | `src: url("/fonts/ok.woff2")` → `url("fonts/ok.woff2")` |
| `tests/reconciliation-l1-shared-axis-groups.test.ts:616` | `test_UAT_AC805_background_handles_resolve_site_local_on_every_kind_or_are_reported` | `url("/assets/card.png")` → `url("assets/card.png")` |

**These are stale expectations, not behavioural defects.** The new URL shape is the intended REQ-109 behaviour. But 7 acceptance criteria (AC-831, AC-839, AC-840, AC-842, AC-848, AC-685, AC-805) currently have **failing evidence**, which is a red matrix regardless of cause.

Note the security halves of the affected ACs still hold: AC-842 fails only on the *permitted*-href shape assertion — its rejection of off-allowlist targets (`javascript:`, `data:text/html`) still passes — and AC-685's injection payloads are still inert.

### Bundle ticket claims that did not reproduce

REQ-108/109/113 each claim ~4 pre-existing failures in `reconciliation-1c-astro-free-render`, `reconciliation-3probe-gate`, `reconciliation-3probe-gate-evaluator`, `reconciliation-l1-fold-full-language`. **None of those appear in the current run** (4 test files are now skipped). The 7 failures observed are a different, disjoint set. The "pre-existing failures" framing does not cover them.

## External Interface Accessibility

All new entry points are wired in — no dead code found.

| Surface | Wired | Evidence |
|---|---|---|
| `1c deploy` command | Yes | `tools/generate/src/cli/index.ts:372` case + help text at :168 |
| `deploy` module exports | Yes | `tools/generate/src/index.ts:9` re-exports `./deploy`; `deploy/index.ts` is a complete barrel |
| `L1_POINTER_SCRIPT` | Yes | `packages/framework/src/index.ts:99` export; emitted at `render.ts` doc assembly, gated on `state.hasPointerAccent` |
| `pointerAccent` axis | Yes | `schema.ts:613` in `surfaceAxesShape`; validated `validate.ts:394`; consumed `render.ts` `pointerAccentRules` |
| Worker `SITES` R2 binding | Yes | `apps/public-site/wrangler.toml`; `Env.SITES` consumed in `index.ts:53` |
| `assertNoReservedSegment` | Yes | called from `cmdDeploy` (`deploy.ts:127`) before upload |
| `htmlFallbackFor` | Yes | set on the `asset` route (`routes.ts:171,188`), consumed in `serve` (`index.ts:121`) |

## Smoke Test

| Invocation | Result |
|---|---|
| `1c --help` | PASS — deploy section renders |
| `1c deploy xgd --channel bogus` | PASS — `Invalid --channel 'bogus'. Use draft\|published.`, no stack trace |
| `1c deploy no-such-site-xyz` | PASS — clean `Site source not found: …`, no stack trace |
| `pnpm -r build` | PASS — exit 0 |

Not run: `1c deploy <slug> --dry-run` against the real site. `--dry-run` writes nothing but still performs a **network read** (`readManifest` → `wrangler r2 object get`) against the operator's live Cloudflare account, so it was deliberately not invoked in an automated review. The REQ-110 UATs cover this path against `MemoryR2Client` and pass.

## Code Quality

The production code is genuinely good: intent-first comments that explain *why* (including recorded dead ends and empirically-chosen constants), constants named rather than inlined, clean seams (`R2Client`, `SiteStore`), and pure functions kept pure so they are testable without a runtime.

| File | Finding | Severity |
|---|---|---|
| `packages/framework/src/l1/render.ts` | `relativizeUrl` landed without re-baselining 3 reconciliation suites → 7 red UATs | **Critical** |
| `tools/generate/src/deploy/manifest.ts:93` | `writeManifest` uses a re-read comparison, not R2's `onlyIf` etag as REQ-110 specifies. The code documents the deviation and its reason honestly (`wrangler r2 object` does not expose conditional writes) and preserves the loud-failure property, but a TOCTOU window remains and the ticket body was never amended to match. | Warning |
| `apps/public-site/src/content-type.ts` / `tools/generate/src/deploy/r2.ts` | Duplicated MIME table. Justified in-comment (Worker bundle cannot import Node deploy code) and the claim of a pinning UAT is **true** — `tests/reconciliation-serve-deployed-snapshot.test.ts:43,51` imports both and compares. | Accepted |
| `bin/verify_req108_pointer.mjs` | 351-line throwaway harness committed to `bin/`. Follows the existing `bin/verify_req100_reveal.mjs` precedent already on `main`, so it is consistent rather than novel. | Nit |

No leftover debug code, commented-out blocks, or TODO stubs found. No magic numbers left unexplained. No duplicate/parallel implementations or `_v2` suffixes.

### Security envelope — verified intact

- `relativizeUrl` is applied strictly **after** `isSafeUrl` / `CSS_URL_ALLOWED` at all three sinks (`cssUrl`, node `href`, `img src`), so it reshapes an already-vetted value and can never admit one.
- The `//` guard is present and correct — `//evil.com/x` is not stripped to `/evil.com/x`.
- BUG-30's rule (`firstSegment === '' || firstSegment.includes(':')` → `./`) correctly closes the `/javascript:x` re-promotion hole that a naive `slice(1)` would have opened.
- The `.trim()` added at the href/src sinks is safe: `isSafeUrl` trims internally (`validate.ts:89`), so the validated and rewritten strings agree.
- Worker: untrusted URL input never reaches an R2 key — the draft id is looked up in `manifest.previews` and the prefix built from the manifest's own value; `parseRoute` rejects `.`, `..`, embedded separators, and malformed percent-encoding.

## Checklist Compliance

No architecture, security, or design checklist reports exist for this project (all three queries returned `{"items": []}`). Sections omitted per instructions.

## Issues Found

**Critical (must fix)**:
- 7 failing UATs across 3 reconciliation suites, caused by REQ-109's URL-shape change. Quality gate 1 (all tests pass) fails.

**Warnings (should fix)**:
- The reconcile's quality gates ran **zero test suites** (`"suites": {}` in report-e649b364, report-69505308, report-5b5755ba, report-0f61f372, report-2baf063f). A gate that executes no tests cannot detect a test regression — this is why 7 red tests reached code review. Worth raising as an XGD tooling issue independent of this bundle.
- REQ-110's ticket body still claims R2 conditional-write (`onlyIf` etag) concurrency control; the implementation uses a re-read comparison. Amend the ticket body so the recorded intent matches the built artifact.

## Fix-It Prompt

Re-baseline the 7 stale assertions to the emitted document-relative shape. **Do not change production code** — the new URL shape is correct, intended REQ-109 behaviour, and the round-trip/relocatability UATs that pin it are green. **Do not weaken any assertion**: each must still pin exactly the property it pinned before, with only the URL shape moved. This is the identical operation REQ-109 already performed on eight other suites.

Apply the same rule the renderer applies (`relativizeUrl`): a single leading `/` is dropped, **except** when the remainder is empty or its first path segment contains a `:`, in which case it becomes `./<rest>`. Absolute (`https://`, `http://`), protocol-relative (`//host`), and fragment-only (`#how`) values are unchanged.

1. `tests/reconciliation-l1-control-and-texture.test.ts:537`
   - `expect(layers[3]).toBe('url("/assets/hero.png")')` → `toBe('url("assets/hero.png")')`

2. `tests/reconciliation-l1-navigation.test.ts:162` (AC-839)
   - `expect(html, label).toContain(\`href="${link.href}"\`)` interpolates the authored href over a `cases` array. Two of the fixtures are absolute (`https://example.com/paper`) and must stay byte-identical; only the root-relative one changes. Apply the relativize rule to the expectation rather than hard-coding — e.g. compute the expected href from `link.href` with the same rule — so the test keeps covering both forms.

3. `tests/reconciliation-l1-navigation.test.ts:219` (AC-840)
   - `toMatch(/<a href="\/gallery" style="display:contents"><img /)` → `/<a href="gallery" style="display:contents"><img /`

4. `tests/reconciliation-l1-navigation.test.ts:316` (AC-842)
   - The permitted-href loop iterates `['https://example.com/docs', 'http://example.com/docs', '/pricing', '#how']`. Only `/pricing` → `pricing`; the other three are unchanged. Apply the relativize rule per-href — **do not blanket-strip the leading slash**, which would corrupt the absolute cases and silently reduce this security AC's coverage. The rejection half of this test (off-allowlist targets never becoming live links) already passes and must not be touched.

5. `tests/reconciliation-l1-navigation.test.ts:612` (AC-848)
   - In the expected full-HTML string, `src="/assets/a.png"` → `src="assets/a.png"`

6. `tests/reconciliation-l1-shared-axis-groups.test.ts:211` (AC-685)
   - `expect(faces[0]).toContain('src: url("/fonts/ok.woff2")')` → `'src: url("fonts/ok.woff2")'`
   - Leave the adjacent `font-family` injection-inertness assertions exactly as they are — that is this AC's security core and it currently passes.

7. `tests/reconciliation-l1-shared-axis-groups.test.ts:616` (AC-805)
   - `expect(css).toContain('url("/assets/card.png")')` → `'url("assets/card.png")'`
   - Leave the `not.toContain('example.test')` off-host assertions untouched.

**Verification**: run the full suite (`pnpm vitest run`) and confirm **0 failed**. Do not rely on the scoped quality gate — it ran zero suites in this reconcile and will report success without executing anything.