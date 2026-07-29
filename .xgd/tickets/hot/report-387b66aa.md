---
uid: report-387b66aa
id: REPORT-1048
type: report
title: 'Code Review: bundle-cceaba25'
created_by: xgd
created_at: '2026-07-29T05:25:59.420738+00:00'
updated_at: '2026-07-29T05:25:59.420738+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-cceaba25
  anchor_uid: bundle-cceaba25
---

# Code Review

**Result**: FAIL

## Summary
The bundle (BUG-7/6/8/9/10/11 + REQ-89/90/91/92) is coherent, well-documented, typed
end-to-end, and every quality gate is green — full suite 659/659, typecheck clean,
`1c` boots silently. Two defects introduced by the bundle block the pass: (1) the new
CSS `url()` sinks neutralise an instance string with an HTML escaper, so a newline/`}`
in a font `src` or `backgroundImageUrl` breaks out of the declaration and injects
arbitrary CSS — a direct violation of DOC-2's "the renderer is the only emitter / no
instance string ever becomes raw CSS"; (2) the new non-text fidelity pairing (REQ-92)
pairs the oracle's `box` samples positionally against a leaf list that BUG-11 now
prefixes with synthesized `surface-*` boxes, so the gate reports phantom fidelity
failures (reproduced: 1040px of false delta) on any capture that has both a
panel-backed run and a standalone painted surface. Both were reproduced against the
real code, not inferred.

## Quality Gates
| Gate | Status | Evidence |
|------|--------|----------|
| Lint | PASS | REPORT-1046: 0 errors, 0 warnings |
| Build | PASS | REPORT-1046 + independent `pnpm -r build` (7/8 projects, exit 0) and `tsc --noEmit` on `packages/framework` and `tools/generate` (both exit 0) |
| Tests (scoped) | PASS | REPORT-1046: 54 passed, 0 failed |
| Tests (full suite, run for this review) | PASS | `pnpm vitest run` — 98 files, 659 tests, 0 failed, 0 skipped |
| Coverage | PASS | REPORT-1046: 93.99% (threshold 60%) |

## External Interface Accessibility
New entry points wired in: **yes**.
- `FoldResidual` / `classifyElement` / `FoldableElement` / `FoldLeafKind` exported from `tools/generate/src/l1/index.ts:14`.
- `foldResiduals` threaded `cmdL1Gate` -> `L1GateResult` (`tools/generate/src/cli/repro.ts:140`) and printed by the CLI (`tools/generate/src/cli/index.ts:375`), including the `--json` path.
- `fonts` wired from the capture theme into the fold (`tools/generate/src/cli/capture/capture.ts:82`); `resources.fonts` -> `@font-face` in `packages/framework/src/l1/render.ts:100`.
- `src`/`alt` plumbed capture -> manifest -> fold (`extract.ts:843`, `sections.ts:157`, `values-diff.ts:779`).
- Lazy Astro container in `tools/generate/src/render/render.ts:190` (module pages only).

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| `packages/framework/src/l1/render.ts:110,445` | `escapeHtml` (an HTML escaper) used to neutralise a value emitted into a CSS `url("...")` string. A newline is not escaped and terminates the CSS string; the following `}` closes the rule and subsequent text becomes real CSS. Verified: `validateL1` accepts `/a.png\n} body { display: none } .x{background:url(https://evil.example/x` and the renderer emits it verbatim into both `@font-face { src: url(...) }` and `background-image: url(...)`, injecting a live `body { display: none }` rule and an off-allowlist remote background URL. | **Critical** |
| `tools/generate/src/l1/probes.ts:514-536` + `tools/generate/src/l1/fold.ts:619` | Non-text fidelity pairing is positional by kind, but `foldToL1` prepends BUG-11's synthesized `surface-*` boxes to the child list, and those have no oracle counterpart (their source element classifies as `text`). So the k-th oracle `box` sample pairs with the k-th *surface*. Reproduced with a 3-element synthetic capture (band run + panel run + decorative divider): `sampleFidelityProbe` returns `pass:false` with residuals `dy 400 / dw up to 1040` for a document that reproduces the divider exactly. Latent on gigabytealchemy/joyful only because neither capture yields a `box-*` leaf. | **Critical** |
| `tools/generate/src/l1/fold.ts:544` | `surfaceIdx` is consumed for band runs whose backing box is later filtered out, so emitted ids are non-contiguous (`surface-1` with no `surface-0`). Cosmetic, but ids are the non-text pairing/debug handle. | Warning |
| `tools/generate/src/l1/fold.ts:600` | A text-free element that *does* paint a surface but has no geometry at any width falls through to the residual reason "neither media, a painted surface, nor a known control", which misnames the gap (the real reason is missing geometry). The image path gets this right (`fold.ts:566`). | Warning |
| `tools/generate/src/l1/probes.ts` (`rebuilt` inside `promoteToFlow`) | Recovery rewrites a failing `container` to `layout: 'stack'` unconditionally, silently discarding a `row` layout in the recovered overlay. Correct for today's flat pinned folds; worth an explicit note/guard once REQ-92 folds real row containers. | Warning |
| `tools/generate/src/l1/fold.ts` (`residualKindOf` vs `classifyElement`) | Two near-duplicate element-kind classifiers. `classifyElement` was deliberately made the single source for fold/probe agreement; `residualKindOf` re-derives kind with different rules (`a11yRole` -> `field`). Reuse or document the divergence. | Warning |
| `storage/sites/gigabytealchemy/**` | A 2.4 MB third-party PNG plus a mirrored `.woff2` and a 3325-line generated draft are committed to the repo. Note only — these arrived on the `xgd(resync)` commit, not on the eleven `[FREE-CODED]` commits under review. | Note |

Positives worth recording: the structured-form axes (gradient/shadow/border/mask/transform) are genuinely typed with no passthrough strings; `evalGeometry`'s half-open `[a.at, b.at)` interval now mirrors the renderer's highest-`min-width`-wins cascade; `rowChildWidths` models flex-row without a browser; the union-find region recovery is a real improvement over the single-pile promote; BUG-10's one-line `display: list-item` gate is exactly the right fix.

## Checklist Compliance
No architecture, security, or design checklist reports exist in the ticket store — sections omitted. The critical finding is nonetheless assessed against the project's standing **Security Policy** (DOC-2 section 2, "Layer 2 — the renderer is the only emitter ... No instance string ever becomes raw CSS or HTML"), which the CSS `url()` sink violates.

## Smoke Test
| Entry point | Result |
|---|---|
| `./bin/1c --help` | OK — commands listed |
| `./bin/1c list` | OK, **stderr empty** — REQ-89 acceptance confirmed (no `Missing pages directory`) |
| `./bin/1c render gigabytealchemy --out /tmp/...` | OK — 2 files rendered from a pure L1 page with no Astro container; no bullets on non-list runs (BUG-10 effect visible) |
| `renderL1Document` / `validateL1` (direct, via vite-node) | Ran — surfaced the CSS `url()` injection above |
| `foldToL1` + `sampleFidelityProbe` (direct, via vite-node) | Ran — surfaced the surface/box mispairing above |

## Issues Found
**Critical (must fix)**:
- CSS `url()` injection: `escapeHtml` does not neutralise newlines (or `}`), so an instance-supplied `resources.fonts[].src` or `box.axes.backgroundImageUrl` can break out of the CSS string and inject arbitrary rules, including an off-allowlist remote `url()` (egress). Both the validator (`isSafeUrl`) and the renderer let it through.
- `sampleFidelityProbe` non-text pairing mispairs synthesized `surface-*` boxes with oracle `box` samples, producing phantom fidelity failures. The gate is the acceptance instrument for the whole REQ-88 effort; a wrong measurement is the same class of defect BUG-7/BUG-8 were filed for.

**Warnings (should fix)**:
- Non-contiguous `surface-*` ids (`fold.ts:544`).
- Misleading residual reason for a geometry-less painted surface (`fold.ts:600`).
- `promoteToFlow` silently rewrites `row` containers to `stack` in the recovered overlay.
- `residualKindOf` duplicates `classifyElement`'s job with different rules.

## Fix-It Prompt

**1. Close the CSS `url()` hole (security invariant, DOC-2 section 2).**
- In `packages/site-schema/src/l1/validate.ts` `isSafeUrl`: reject any URL containing a control character, newline/CR/tab, `"`, `'`, backslash, `(`, `)`, `<`, or `>` — a legitimate served-asset or http(s) URL never needs them raw (percent-encoding is available). Keep the existing scheme allowlist.
- In `packages/framework/src/l1/render.ts`: stop using `escapeHtml` for CSS contexts. Add a dedicated `cssUrl(src: string): string | null` that returns null unless the value clears `isSafeUrl` and a conservative allowlist regex, and CSS-escapes the remainder; use it at `render.ts:110` (`@font-face src`) and `render.ts:445` (`background-image: url(...)`). Defence in depth means the renderer must be safe even if the validator is bypassed — do not rely on the validator fix alone.
- Add UATs alongside `tests/req90-l1-font-resources.test.ts` / `tests/req91-l1-pixel-mover-axes.test.ts`: a font `src` and a `backgroundImageUrl` containing a newline followed by `} body{display:none}` must (a) be rejected by `validateL1` and (b) never produce a `}` or a second rule in `renderL1Document`'s CSS. Assert on the emitted CSS, not just on the absence of `javascript:`.

**2. Fix the non-text fidelity pairing (`tools/generate/src/l1/probes.ts:514-536`).**
- Synthesized backing surfaces have no oracle counterpart and must not enter the `box` pairing queue. Exclude them structurally — e.g. mark the fold's backing boxes (a `synthesized` flag carried onto the eval leaf, or filter on the `surface-` id prefix if ids stay the marker) and skip them when building `nonTextQueues`. Do not change the oracle side: `classifyElement` correctly reports the backing surface's source element as `text`.
- Regression UAT (this is the exact reproducer): a ladder capture with (a) a run on the dominant band, (b) a run on a differing panel fill (-> one `surface-*` leaf), and (c) a text-free painted surface with geometry (-> one `box-*` leaf and one oracle `box` sample). Assert `sampleFidelityProbe(...).pass === true` and `residuals === []`. Against current HEAD this fails with `dw` up to 1040 at 1280px.

**3. Warnings.** Allocate `surface-*` ids only for surfaces that survive the band filter; give the geometry-less painted-surface residual its own reason string; either preserve `layout` in `promoteToFlow`'s `rebuilt` or document why stack is forced; fold `residualKindOf` onto `classifyElement`.
