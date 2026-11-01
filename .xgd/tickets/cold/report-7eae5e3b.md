---
uid: report-7eae5e3b
id: REPORT-1066
type: report
title: 'Resync resolve conflicts: f5f29fb9f01dfd222dd5a744af7374b1e371be99'
created_by: xgd
created_at: '2026-07-29T07:03:38.369416+00:00'
updated_at: '2026-07-29T07:03:38.369416+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `packages/framework/src/l1/render.ts` — **UU**, code file (rule 2c: incoming authoritative, integrate non-overlapping, incoming wins where mutually exclusive). One conflicted hunk, inside `surfaceDecls()`.
  - **Ours** (`b43b96828`, "hoist the node-level axis groups; a slot can be measured"): the branch carries `cssUrl()` — the sole CSS `url()` sink (scheme allowlist via `isSafeUrl` **plus** an independent RFC-3986 character allowlist), replacing the earlier `escapeHtml`-based treatment which leaves newlines intact and can therefore break out of a CSS string/rule (DOC-2 §2).
  - **Theirs** (`a243ee8c6`, "typed texture axis + radial gradients", REQ-103): `bgLayers` changes from `string[]` to `BgLayer[]` so each background layer carries its own `size`/`position`/`repeat`, letting a tiled pattern and a `cover` backdrop coexist on one box; adds `patternLayers()`, `plainLayer()`, `RADIAL_ORIGIN_CSS` and the radial-gradient branch.
  - **Integration**: the two changes are orthogonal (security sink vs. layer structure) and were merged rather than either side discarded. Kept the incoming `BgLayer` structure and the positional sizing triple verbatim; the background-image layer's `image` is now produced by `cssUrl(a.backgroundImageUrl)` instead of `` `url("${escapeHtml(...)}")` ``. Incoming's `hasBgImageUrl` boolean collapsed into the `bgUrl` token (same predicate, one evaluation), so the `else if` fallback for the non-pattern case reads `else if (bgUrl)`.
  - **Behavioural note**: an unsafe or unencodable background URL now yields no layer at all, rather than a `cover`/`center`/`no-repeat` sizing triple for an image that never paints. That is ours-side semantics and is the safer of the two.

No other conflict classes were present: the remaining six paths from the pick (`packages/site-schema/src/l1/{schema,types,validate}.ts`, `tools/generate/src/l1/fold.ts`, `storage/sites/xgd/draft/pages/home.json`, `tests/req103-l1-texture.test.ts`) auto-merged and were already staged. No tickets, no UAT deletions, no config conflicts.

## Incoming changes preserved

Verified against `git show a243ee8c6 -- packages/framework/src/l1/render.ts`; every incoming construct is present in the resolved file:

- `L1GradientOrigin` / `L1Pattern` type imports — present
- `RADIAL_ORIGIN_CSS` origin map and the `g.kind === 'radial'` branch of `gradientCss()` — present
- `interface BgLayer`, `plainLayer()`, `patternLayers()` (dots / grid / lines, with the thickness-saturates-at-spacing clamp) — present
- REQ-103 layer ordering in `surfaceDecls()` (scrim → pattern → gradient → image → fill), with `if (a.pattern) bgLayers.push(...patternLayers(a.pattern))` — present
- the positional sizing triple `if (a.pattern && bgLayers.length) { background-size/position/repeat from bgLayers.map(...) }` — present

Ours-side `cssUrl()` / `CSS_URL_ALLOWED` also retained, and `isSafeUrl`/`escapeHtml` remain in use elsewhere in the file (no unused imports).

## Verification

- `pnpm -r build` — clean (7/8 workspace projects; framework has no build script).
- `npx tsc -p packages/framework/tsconfig.json --noEmit` — clean. This matters: the naive "take one side" resolutions do **not** typecheck (ours pushes a `string` into a `BgLayer[]`; theirs reintroduces the `escapeHtml` URL path the branch removed).
- `npx vitest run tests/req103-l1-texture.test.ts` — 6/6 pass (the incoming commit's own UATs).
- Full suite `npx vitest run tests/` — 914/921 pass. The 7 failures are **not** attributable to this pick:
  - 3 × `ENOENT` on gitignored `storage/references/gigabytealchemy.ai/index/multistate.json` (`bug17-fold-padding`, `req96-control-composition` ×2) — environmental, absent capture bundle in a fresh worktree.
  - 4 assertion failures (`reconciliation-1c-astro-free-render`, `reconciliation-3probe-gate`, `reconciliation-3probe-gate-evaluator`, `reconciliation-l1-fold-full-language`) reproduce **identically** with all five code files reverted to `HEAD` in the working tree (index left untouched, restored via `git checkout-index -f`) — pre-existing on the resync base.

Staging verified: no `UU`/`AA`/`DU`/`UD` lines remain, no conflict markers in the tree, net change from `HEAD` is non-empty, and `CHERRY_PICK_HEAD` (`a243ee8c6`) is still present for the next workflow step.
