---
uid: report-dfe39571
id: REPORT-1149
type: report
title: 'Code Review: bundle-4ff83a8b'
created_by: xgd
created_at: '2026-08-03T04:51:52.005860+00:00'
updated_at: '2026-08-03T04:51:52.005860+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-4ff83a8b
  anchor_uid: bundle-4ff83a8b
---

# Code Review

**Result**: FAIL
**Anchor**: bundle-4ff83a8b (BUNDLE-10) · **Mode**: commits
**Scope**: 23 free-coded commits, 36 non-test files (6,741 insertions / 717 deletions)

## Summary

The code itself is of high quality — the L1 envelope extensions (column anchor,
viewport response, responsive scalar tracks, per-side padding, chip axes) are
typed, bounded, validated and safely emitted, the new modules are all wired into
their usage context, and the REQ-93 slot/behaviour seam respects the DOC-2
structured-only invariant. **But the bundle ships a tracked data artifact that
its own schema rejects**: `storage/sites/gigabytealchemy/draft/pages/home.json`
still carries the retired `geometry.anchor` shape, so `1c render gigabytealchemy`
— the exact next step `1c repro` tells the operator to run — exits 1. It renders
cleanly on `main`, so this is a regression introduced by this bundle.

## Quality Gates

| Gate | Report | Independent verification |
|------|--------|--------------------------|
| Lint | success, 0 errors / 0 warnings | **No-op** — 0.00009s; no lint script in `package.json` |
| Build | success | **No-op** — 0.0s; no build/typecheck in the quality run |
| Tests | `report-aac215fd`: 117 passed, 0 failed (751 deselected) | scoped run only |
| Coverage | threshold 25% | n/a |

Because lint/build are unwired no-ops, I verified compilation myself:
`tsc -p … --noEmit` on `packages/site-schema`, `packages/framework` and
`tools/generate` — **all three exit 0, clean**.

Note also that `report-7b5fcec3` ("Report: quality for standalone", status
**pass**) executed **zero** tests — "868 tests were collected and all were
deselected by the -k filter". It is not evidence of anything.

## External Interface Accessibility

New entry points wired in: **yes** — no dead modules found.

| New/changed surface | Wired at |
|---|---|
| `tools/generate/src/l1/forms.ts` | `fold.ts:60`, `capture.ts:9`, `bundle.ts:20`; re-exported `l1/index.ts:22-32` |
| `tools/generate/src/l1/assets.ts` (`localizeAssets`) | called `cli/repro.ts:131`; exported `l1/index.ts:34` |
| `packages/site-schema/src/l1/slots.ts` | `schema.ts:3` (page validator), `l1/index.ts:9` |
| `latestModuleVersion` | `registry.ts` → `modules/index.ts:1` → `framework/src/index.ts:26` → used `repro.ts` |
| `renderL1Document(doc, {mounts})` | `tools/generate/src/render/render.ts:121-125` |
| New CLI reporting (`localizedAssets`, `unreferencedAssets`, `forms`, mounted behaviours) | `cli/index.ts:345-372`, `cli/index.ts:392-409` |
| `needsAstro` widened for L1+module pages | `render/render.ts:207` |

`1c --help` documents `repro` and `l1-gate`; both are routed in the parser.

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `storage/sites/gigabytealchemy/draft/pages/home.json` | 33 of 71 nodes carry the removed `anchor` shape (`widthFraction` ×27, `startPx`/`widthPx` ×15); the artifact fails `validateL1` and breaks `1c render` | **Critical** |
| `tests/` (absent) | Nothing validates the committed `storage/sites/**` L1 documents against the schema — which is why this shipped with a green suite | Warning |
| `packages/site-schema/src/l1/validate.ts:404-418` | The dangling-anchor pre-pass re-walks the tree independently of `walk()`; the two traversals can drift | Nit |
| `tools/generate/src/cli/capture/playwright-driver.ts:60,64` | Font-barrier budgets (`4000`, `2000` ms) inlined in the in-page script string rather than named | Nit |
| `tools/generate/src/l1/forms.ts:180-185` | `submitSlotFrom` strips `geometry`/`visibility` via `Record<string, unknown>` casts rather than a typed omit | Nit |

Positives worth recording: no debug statements, no TODO/FIXME/commented-out
blocks anywhere in the added production lines; thresholds are named constants
with the measured evidence for their values in the doc comment
(`CLUSTER_GAP_FACTOR`, `BAND_TAIL_PAD`, `PADDING_MAX`); shared resolvers are
reused rather than re-implemented (`primaryFamily` in `theme.ts` keys both the
resource table and `usedFontFaces`); the reuse-first invariant holds — everything
lands in existing files/axes, no `_v2` parallel implementations.

## Security Review (DOC-2 — structured-only, validated by construction)

No checklist ticket exists, so this is my own pass against the policy. **No
violation found.**

- **The one new raw-HTML sink is the slot mount** (`render.ts:666`,
  `${mounted}`). It is fed exclusively from `render/render.ts:121-125`, where the
  string is the output of the framework's own Astro module render — the vetted
  behavior-module seam DOC-2 §3 explicitly sanctions. Instance data never reaches
  it; every value inside already passed the module's escaping/URL sinks.
  `L1RenderOptions.mounts` is not reachable from site JSON.
- **Envelope extended coherently, not loosened**: `paddingPx` bounded 0–10,000;
  scalar tracks range-checked per axis *and* pinned to the document's declared
  widths; anchor terms bounded (`geometryPx`, fraction ±10); text chip axes
  (`borderRadiusPx`, `border.widthPx`, `boxShadow`) now bounded exactly like box
  axes; every new object is `.strict()`.
- **Dangling references rejected, not silently defaulted**: `anchor` without a
  document `column`, and `viewportResponse` without per-keyframe `atHeight`, are
  both errors — the same discipline the policy asks for.
- **Slot binding is validated**: unbound module, unknown slot name, duplicate slot
  name, and `slot` on a page with no L1 tree are each a pathed error
  (`schema.ts:564-616`).
- **Captured endpoints are gated**: `foldedFormFor` admits `form.action` only via
  `isSafeUrl`, otherwise drops it with a residual (`forms.ts:261-262`); the
  module re-checks with `assertSafeUrl` at render.
- **A11y obligation preserved**: `labelMode: 'placeholder'` visually hides the
  `<label>` but keeps it in the DOM and programmatically associated
  (`contact-form/index.astro:110-127`).

## Checklist Compliance

No `architecture_checklist`, `security_checklist` or `design_checklist` report
tickets exist for this anchor — all three sections skipped per instruction.

## Smoke Test

| Entry point | Result |
|---|---|
| `node tools/generate/bin/1c.mjs --help` | **PASS** — exit 0, `repro` / `l1-gate` documented |
| `1c render gigabytealchemy` (the reproduction this bundle rebuilt) | **FAIL** — exit 1: `Invalid site definition 'gigabytealchemy': /pages/0/l1/root: Invalid input` |
| `tsc --noEmit` × 3 packages | **PASS** — exit 0, clean |
| `1c render 1stcontact` / `harbor-cafe` | exit 1: `Module not found in catalog: 'header' v2` — **pre-existing**, module-era storage orphaned by the framework pivot; neither file is touched by this bundle (only `gigabytealchemy` appears under `storage/` in `git diff main..HEAD`). Out of scope, reported for completeness. |

## Issues Found

**Critical (must fix)**:

- `storage/sites/gigabytealchemy/draft/pages/home.json` is stale with respect to
  the schema shipped in the same bundle. Commit `bb9309317` ("anchor x and width
  independently against the column") replaced `l1ColumnAnchorSchema`
  `{startPx, startFraction, widthPx, widthFraction}` with
  `{x?: L1ColumnTerm, width?: L1ColumnTerm}` — but the `home.json` committed in
  that same commit was produced by the **pre-change** fold and was never
  regenerated. Measured at HEAD: 33 of 71 nodes fail, `unrecognized_keys`
  ×18 `widthFraction`, ×9 `startPx`+`widthPx`+`widthFraction`, ×6
  `startPx`+`widthPx`. `validateL1` → `ok: false`; `1c render gigabytealchemy` →
  exit 1. The same file on `main` passes `validateL1` cleanly (it carries no
  `anchor` at all), so this is a regression, not inherited debt.
  The *code* is correct — `widthFraction` appears nowhere in `fold.ts` or
  `schema.ts` — only the committed artifact is wrong.

**Warnings (should fix)**:

- No test asserts that the committed `storage/sites/**` page documents validate.
  `tests/req55-content-width.test.ts:139` is the only test that walks
  `storage/sites`, and it only checks retired dial names. A 33-node schema
  violation therefore shipped with 117/117 scoped tests green. This gap is the
  reason the defect above was invisible.
- The `lint` and `build` quality gates are unwired no-ops (0.00009s / 0.0s), and
  `pnpm typecheck` exists per-package but is not run by `xgd quality`. Nothing in
  the gate would have caught a type error either.

## Fix-It Prompt

Two changes, both in this worktree.

**1. Regenerate (preferred) or migrate the stale reproduction artifact.**

Target: `storage/sites/gigabytealchemy/draft/pages/home.json`.

*Preferred* — re-run the current fold so the artifact is genuinely fold output:

```
node tools/generate/bin/1c.mjs repro gigabytealchemy --ref <captureBundleDir>
```

No capture bundle is checked into the repo, so if one is not available, apply the
mechanical migration instead. The document already declares
`column: {containerPx: 1152, insetPx: 24, maxWidthPx: 896}`, so anchors are legal
once reshaped. Rewrite every `geometry.anchor` object:

| Old key | New location |
|---|---|
| `startPx: S` | `x: { px: S }` |
| `startFraction: F` | `x: { fraction: F }` |
| `widthPx: W` | `width: { px: W }` |
| `widthFraction: F` | `width: { fraction: F }` |

Combined example:
`{"startPx": 12, "widthPx": 300, "widthFraction": 1}` becomes
`{"x": {"px": 12}, "width": {"px": 300, "fraction": 1}}`.
A bare `{"widthFraction": 1}` becomes `{"width": {"fraction": 1}}`.

Note `l1ColumnAnchorSchema` requires at least one of `x` / `width` to be present
(`validate.ts:129-131`), so do not emit an empty `anchor` — drop the key entirely
if neither term survives.

Verify — all three must hold:

```
node tools/generate/bin/1c.mjs render gigabytealchemy   # must exit 0
npx tsc -p tools/generate/tsconfig.json --noEmit        # must exit 0
npx vitest run                                          # must stay green
```

**2. Add the guard test that would have caught this.**

Add a UAT that walks every `storage/sites/*/draft/pages/*.json` (and
`revisions/*/pages/*.json`), and for each document carrying an `l1` key asserts
`validateL1(doc.l1).ok === true`, failing with the offending file path and the
`path :: message` of the first few errors. Attach it to whichever AC in this
bundle owns the L1 envelope/validator so it is traceable. This closes the class
of defect, not just this instance: any future envelope change that outruns a
committed reproduction will now fail the suite instead of the operator's first
`1c render`.

Do **not** "fix" this by relaxing `.strict()` or re-adding the retired anchor
keys to the schema — the `.strict()` rejection is the security invariant working
exactly as DOC-2 specifies (an unknown key is a would-be freeform escape hatch).
The artifact is what is wrong.
