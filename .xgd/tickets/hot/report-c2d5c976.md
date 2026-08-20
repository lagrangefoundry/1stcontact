---
uid: report-c2d5c976
id: REPORT-2351
type: report
title: 'Resync resolve conflicts: 7292af8f63220275216b82416fc441658a744e02'
created_by: xgd
created_at: '2026-08-20T03:25:37.514198+00:00'
updated_at: '2026-08-20T03:25:37.514198+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-db1949d9
---

## Files resolved

- `apps/control-app/src/router.ts` — **UU, code file (§2c: incoming authoritative, non-overlapping kept from both sides).** The two sides changed *disjoint* things in one adjacent region, so this was a compose, not a pick:
  - **Ours (HEAD, `c5088a8e0` REQ-146 line)** added the per-isolate chat host — `let CHAT`, `chatHost()`, `resetChatHost()` — which the incoming commit knows nothing about. **Kept in full.**
  - **Theirs (`ade64575a`, REQ-148)** narrowed `previewRenderer` from `(store, render: RouterDeps['render'])` to `(store)`. **Taken.**
  - Result: HEAD's chat-host block, immediately followed by incoming's one-arg `previewRenderer`. Nothing from either side was discarded.

- `package.json` — **UU, version scalar only.** Incoming bumps `0.1.57 → 0.1.58`; HEAD (`0f44ef1ba`, `sync_working_to_main` post-watermark) already carries `0.1.59`. **Kept HEAD's `0.1.59`.** A free-coded version bump is bookkeeping, not code: taking the incoming scalar would move the version *backwards* and hand out a number a later ticket has already claimed. This matches the enrichment rule (HEAD's sync commit is the more recent side). No other hunk in this file conflicted.

## Incoming changes preserved

All four hunks of `ade64575a`'s `router.ts` diff are present in the resolved file — three applied cleanly outside the conflict, one was taken by hand:

- `import type { RenderSiteOptions } from '.../render/render'` — **removed** (absent from the import block).
- `function previewRenderer(store: TenantSiteStore): PreviewRenderer` — **one-arg signature taken** from incoming (this was the conflicted hunk); body calls `new PreviewRenderer(store)`.
- `RouterDeps` — the `render?: Pick<RenderSiteOptions, ...>` member is **gone**, and incoming's replacement doc comment ("REQ-148 — the render is no longer one of these …") is in place.
- `servePreview` — the `render: RouterDeps['render']` parameter is **gone** from the definition, the call site passes four args, and the body calls `previewRenderer(store)`.

Cross-checked against the incoming tree: `PreviewRenderer`'s constructor in `tools/generate/src/cli/preview.ts:94` is `constructor(private readonly store: SiteStore) {}` — single-arity, so the resolved `new PreviewRenderer(store)` and `previewRenderer(store)` call sites type-check against it.

`package.json` carries no incoming *code* change — the only incoming hunk was the version scalar, deliberately superseded as described above.

## Staging state

`git ls-files -u` is empty; no conflict-class entries remain in `git status --porcelain`. `apps/control-app/src/router.ts` is staged as `M`. `package.json` resolves byte-identical to HEAD and therefore shows no staged diff — correct, not an omission. `CHERRY_PICK_HEAD` (`ade64575a4706348dc54df0ed2d2b3f384fe3eb2`) is intact; no `--continue`/`--skip`/`--quit`/`--abort` was run.

## Flagged for post-merge review

Per the enrichment's "intent unknown on one or both sides" rule, both files are flagged. The substantive one is `router.ts`: REQ-146 (chat host) and REQ-148 (render seam removal) both touch `RouterDeps`, and the composed result keeps `chatHost(env, deps)` reading `deps.store` while `deps.render` no longer exists. That is consistent as written, but the pairing has never been compiled or tested together on this branch — a `tsc --noEmit` over `apps/control-app` and the REQ-146/REQ-148 UATs should run before publish.
