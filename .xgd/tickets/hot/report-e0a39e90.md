---
uid: report-e0a39e90
id: REPORT-1501
type: report
title: 'Code Review: bundle-0385746c'
created_by: xgd
created_at: '2026-08-06T22:23:50.474797+00:00'
updated_at: '2026-08-06T22:23:50.474797+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-0385746c
  anchor_uid: bundle-0385746c
---

# Code Review

**Result**: PASS
**Anchor**: bundle-0385746c (BUNDLE-14 — BUG-31 + REQ-114 + REQ-116)
**Mode**: commits (`f9cc60ccd`, `be8571f3b`, `127c03026` after cherry-pick)

## Summary

Three well-executed free-coded changes. BUG-31 threads the store root through every R2 key and makes the Worker's servable root a fixed constant, so a sandbox key is unreachable by construction rather than by a check. REQ-114 replaces the closed 15-slot token palette with the L1 literal-base/palette-overlay model and retrofits the sites; I independently verified the retrofit is value-preserving. REQ-116 adds the edit render as a mode threaded through the single existing emitter — no second renderer, no schema change. All gates green, all new entry points smoke-tested working. Findings are warnings only; none block the merge.

## Quality Gates

| Gate | Result | Evidence |
|---|---|---|
| Lint | PASS | report-4559a877: 0 errors, 0 warnings |
| Build | PASS | `pnpm -r build` exit 0 (control-app, public-site `tsc --noEmit`) |
| Typecheck (extra) | PASS | `pnpm -r typecheck` clean — framework, site-schema, tools/generate. Run explicitly because `-r build` does **not** cover those three packages (they expose `typecheck`, not `build`), so the reported build gate alone would not have caught type drift across the wide schema cut (REQ-114 AC12) |
| Tests | PASS | `pnpm vitest run`: 162 files passed / 1 skipped; **1140 passed, 9 skipped, 0 failed**, 90.3s |
| Coverage | n/a | Not collected by this suite; not configured as a gate for this repo |

The four fold/gate failures noted in REQ-116's ticket body as pre-existing are **not** present here — the suite is fully green on this worktree.

## External Interface Accessibility

All new surfaces are wired in and reachable — verified by invocation, not by reading:

| Surface | Wired at | Verified |
|---|---|---|
| `1c colors <slug>` | `cli/index.ts:877` case + USAGE:266 | Ran on `xgd`: 18 distinct colours, 16 distinct RGB, alpha family `#2e86a3` at α 1.00/0.65/0.33 — reproduces the DOC-23 §5.3 table (AC7) |
| `1c colors --assign [--names]` | `cli/index.ts:879-891` | Ran against a scratch copy of `storage/sites`: derives 6 entries for `xgd`, 8 for `gigabytealchemy`, writes and re-validates |
| `1c render --edit` | `cli/index.ts:371`, USAGE:163-167, `commands.ts:136-145` | Ran on `xgd`: 62 copy / 24 container / 1 module segment, `<body data-fc-edit>`, no `capabilities.js` written or referenced, no `l1-rv` class |
| `RenderChannel: 'edit'` → `dist/<slug>/edit/` | `store/paths.ts:13` | Channel resolves; `--out` override also works |
| `SERVABLE_ROOT` | `apps/public-site/src/site-store.ts:49`, used at :53/:99/:103 | Grep confirms **no** other key construction in `apps/public-site/src` and no root derived from a request |
| Framework exports `L1_EDIT_*`, `L1SegmentKind` | `packages/framework/src/index.ts:101-114` | Consumed by `tools/generate/src/render/render.ts:9-10` |
| Schema exports `resolveL1Palette`, `checkPaletteRefs`, palette schemas | `packages/site-schema/src/l1/index.ts:7-23` | Consumed by `loadSite.ts:4`, `validate.ts:4`, `render.ts:14`, `colors.ts:37` |

No dead modules, no uncalled functions.

## Independent Verification of the Load-Bearing Claims

**REQ-114 AC3 (conversion is pixel-identical).** Resolved each retrofitted page's palette references back to literals and diffed the colour multiset against the pre-change file on `main`:

- `xgd/home.json`: 148 colour values after vs 147 before — the **only** delta is the added `textColor=#111827`.
- `gigabytealchemy/home.json`: 91 vs 90 — same single delta.

That one delta is exactly the re-homing of the retired `--color-text` token onto the L1 document (both sites' old `theme.palette.text` was `#111827`), i.e. AC9 working as specified. Every other colour round-trips byte-for-byte. AC3 and AC5 (the three `#2e86a3` alphas → one `primary` entry + the reference alpha axis) hold.

**REQ-114 AC6 (palette is a palette, not a colour list).** `xgd`: 6 entries from 18 literals / 16 distinct RGB — well under the old 15 roles. `gigabytealchemy`: 8 entries from 30 literals.

**REQ-114 AC8 (no `--color-` outside the new model).** Grep across `packages/`, `tools/`, `apps/` returns only comments, an unrelated `--color-tol` CLI flag, a captured vendor CSS asset in `storage/`, and one stale README line (see Warnings).

**REQ-116 AC8 (no edit-channel leakage into shipped channels).** Rendered `xgd` in both channels: draft HTML contains zero occurrences of `data-l1-path`, `data-l1-segment`, `data-fc-edit` or the outline rule; `<body>` is bare; `capabilities.js` is written for draft and absent for edit.

**BUG-31 (sandbox confinement).** Every deploy key is built from `ctx.root` (`deploy.ts:139-142`, `manifest.ts:48`, prune at `deploy.ts:301-305`), `DeployResult.url` is null off the `sites` root, and the Worker resolves `SERVABLE_ROOT` only. Confinement is structural.

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `packages/framework/README.md:29` | Stale: still documents `generateThemeCss(tokens?, { dark? })` emitting `--color-*` and an optional `prefers-color-scheme: dark` palette block. All three were deleted by REQ-114 (`tokens/css.ts`). REQ-114 AC8's grep clause explicitly names `--color-` across `packages/`. | Warning |
| `tools/generate/src/cli/colors.ts:452-497` | On a site with **zero** colour literals, `--assign` still writes `"palette": {}` into `site.json` and rewrites every page file. Reproduced on `1stcontact` and `harbor-cafe` in a scratch copy: an empty palette key plus a whole-tree JSON reformat, for a run that changed nothing. The committed retrofit correctly has no `palette` key on those two, so the shipped command does not reproduce the shipped result for 2 of 4 sites. | Warning |
| `tools/generate/src/cli/colors.ts:119-134, 416-428` | `collectColorLiterals` / `applyRefs` treat **any** string matching the hex grammar as a colour, including text copy and short in-page anchors (`href="#abc"`, `#dad`, `#fed` are all valid 3-digit hex). Fail-closed — proof 2's `validateSite` aborts before writing — but the census over-counts and a legitimate 3-hex-char anchor id would abort the retrofit with a confusing schema error rather than a clear one. | Warning |
| `storage/sites/xgd/draft/pages/whitepapers.json` | A brand-new 1776-line page for the `xgd` site was added inside the REQ-114 commit (`be8571f3b`, `--diff-filter=A` confirms). None of BUG-31 / REQ-114 / REQ-116 mentions it; `nav.entries` is empty so it is reachable only by direct URL. It validates, renders and uses the palette correctly — but it is undocumented content scope swept into a code commit, the same failure mode REQ-116's own provenance note records for `git add -A`. | Warning |
| `packages/site-schema/src/schema.ts:~280, ~651` | Two double-blank-line gaps left where `layerColorRoleSchema` and `paletteTokensSchema` were removed. | Nit |
| `tools/generate/src/cli/colors.ts:408-413` | `resolvedHex` would string-concat `"undefined"` if a step were missing; unreachable in practice (refs are produced by `derivePalette` from the same palette). | Nit |

Positives worth recording: `segmentKind` derives "carries paint" by asking `surfaceDecls` rather than keeping a parallel axis list, so future paint axes are covered for free; the edit render drops the reveal *rules* as well as the script, which is the non-obvious correct call (dropping only the script would leave copy at `opacity: 0` and unclickable); `outline` rather than `border` keeps segment geometry identical to draft; behavior modules own their own settled state via a prop rather than being post-patched; palette resolution happens once at `loadSite`/render entry rather than at each of the dozen colour sinks, which is what makes the conversion pixel-identical by construction.

## Checklist Compliance

No architecture, security, or design checklist reports exist for this anchor (`xgd ticket list --type report --filter fields.report_kind=<kind>` returns empty for all three). Sections omitted.

Informally against DOC-2: the widening of `l1Color` preserves the structured-only invariant — a palette reference is a `.strict()` typed object whose entry value is an opaque-hex-only scalar, a dangling reference is a validation failure with no render-time fallback (`validate.ts:585-616`), and `cssColor` stays fail-closed on anything that is not a literal at the sink (`render.ts:58-68`). No raw-CSS hole was opened.

## Smoke Test

| Entry point | Invocation | Result |
|---|---|---|
| `1c help` | `node tools/generate/bin/1c.mjs help` | Usage prints, includes the new `--edit` and `colors` sections |
| `1c colors <slug>` | `1c colors xgd` | Census printed correctly |
| `1c colors --assign` | via scratch copy of `storage/sites` | Derives, validates, writes; round-trip gate exercised |
| `1c render --edit` | `1c render xgd --edit --out <tmp>` | 3 files; segments, marker, no client bundle |
| `1c render` (draft) | `1c render xgd --out <tmp>` | 3 files + `capabilities.js`; no edit leakage |

`1stcontact` and `harbor-cafe` fail to render (`Module not found in catalog: 'header' v2`). Confirmed **pre-existing**: `main`'s registry (`git show main:packages/framework/src/modules/registry.ts`) also holds only `contact-form` and `carousel`, so this is REQ-96 fallout, not introduced by this bundle. Worth noting that because those two sites are module-only (no `page.l1`), REQ-114's removal of `body { background: var(--color-bg); color: var(--color-text) }` from the page head leaves a module-only page with no page background or text colour at all — latent today only because neither site renders.

## Issues Found

**Critical (must fix)**: none.

**Warnings (should fix)**:
- `packages/framework/README.md:29` documents the deleted `--color-*` emission and `{ dark? }` option.
- `1c colors --assign` writes an empty `palette: {}` and reformats every page on a zero-colour site.
- Colour-literal detection can match text copy and short anchor ids; fail-closed but the error surfaced would be misleading.
- `storage/sites/xgd/draft/pages/whitepapers.json` is undocumented scope inside the REQ-114 commit.
- Latent: a module-only page (no `page.l1`) now renders with no page background or text colour.

None of these affect correctness of the shipped behaviour, gate results, or the security posture. Recommend they be filed as follow-on scope rather than blocking this reconcile.
