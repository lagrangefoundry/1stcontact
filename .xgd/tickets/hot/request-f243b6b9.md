---
uid: request-f243b6b9
id: REQ-84
type: request
title: 'Framework pivot C: strip layout modules to L1 (delete hero/text-block/services-grid/footer/header/layer
  + helpers)'
created_by: xgd
created_at: '2026-07-20T19:48:27.064344+00:00'
updated_at: '2026-07-22T18:51:59.178748+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 1a2faeeefac8e0d261e898cc907f1ec98b4c211a
    reconcile_sha: null
    main_sha: null
  version: 0.0.162
  story_points: 8
  bundled_in: bundle-31e474b9
---

Part of the framework pivot — see **REQ-79 (request-87b26bca)**. Do after the L1 substrate REQ (render.ts is the L1 loop by then).

## Goal
Remove the semantic **layout** module system now that L1 is the layout substrate. Leave **no dangling references or old-model vestiges** — future sessions must not see the old model.

## Behaviour
- **DELETE** module dirs: `header/ hero/ footer/ text-block/ services-grid/ layer/`.
- **DELETE** layout helpers: `layer.ts overlay.ts row.ts nav.ts motion.ts background.ts`.
- **MODIFY** `registry.ts`, `modules/index.ts`, `framework/src/index.ts` (drop layout metas/exports); `dials.ts` (keep shared resolvers + capability subset, delete ~20 layout-only dials); `render.ts` (remove residual layout-composition); `scaffold.ts` (L1/empty starter).
- **DELETE** ~19 pure-layout tests; **repoint** ~14 mixed/conformance/schema tests off `text-block`/layout types onto capability or synthetic modules.
- Catalog reduces to `carousel` + `contact-form`.

## Acceptance (UAT — `test_UAT_FC_<this REQ id>_*`)
- `no_layout_modules`: `getModule` for hero/text-block/etc. is a catalog miss; `getModuleCss` iterates only capability modules.
- `build_clean`: framework + tools build with no dangling imports; full suite passes.

## Docs (same session)
- **DOC-7**: split — delete the semantic-module-catalog half; keep / re-found the security half (§6.2/§6.5) on L1.
- **Supersede DOC-14, DOC-6.**
- Rewrite **CLAUDE.md** "Generalize Modules Before Adding New Ones" (capability framing); refresh `packages/framework/README.md`.

**Reconcile:** these deletions supersede the REQ-79 layout-dial commits (see REQ-79 reconciliation note) — intentional, not overwrites.


## Known item — subScales responsive type-drift (surfaced in REQ-82)

`packages/framework/src/tokens/css.ts` → `subScaleVars` types subscale axes as **flat** (`number|string`); `site-schema` (`schema.ts:722`, `subScaleSchema`) allows **responsive** subscale axes. The mismatch is currently masked by a stale `site-schema` `dist` and by vitest not full-typechecking; it surfaces under `tsc` once `dist` is rebuilt (B1/REQ-82 triggers this) — and a clean-build **reconcile/regression will fail the typecheck gate** on it.

`badge`/`checklist` subscales are **layout-module-era** features (services-grid / list treatments). Resolve HERE:
- **Delete** with the layout-token cleanup (most likely — subscales go with the modules they served), OR
- if subscales survive, **update `subScaleVars`** to handle/flatten the responsive shape (or drop `responsive` from the schema).

Do **not** patch in isolation earlier — it is soon-dead code. Between now and this phase, a clean `tsc` will flag it; that is **expected**, not a new bug.

-