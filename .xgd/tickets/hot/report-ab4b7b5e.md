---
uid: report-ab4b7b5e
id: REPORT-1704
type: report
title: 'Resync resolve conflicts: 0a409cf4fa5ab3667cbc9c1b94c0ff8b57b791be'
created_by: xgd
created_at: '2026-08-08T02:22:58.877468+00:00'
updated_at: '2026-08-08T02:22:58.877468+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-f53a5001
---

## Files resolved

- `tools/generate/src/cli/builder.ts` — **UU**, code file (rule 2c: incoming
  authoritative, non-overlapping changes keep BOTH). The conflict was confined
  to the import block (lines 11–16); the rest of the file merged cleanly.
  - Ours (main-rooted, `develop` / `bug-5cabb340`): hoisted the cache freshness
    directive out of the per-route `writeHead` calls into a single
    `res.setHeader('cache-control', NO_STORE)` before routing, with `NO_STORE`
    extracted to `./serve` (`serve.ts:110`) and imported.
  - Theirs (incoming, `6ff75bddb`, REQ-119 free-coded): added
    `import { fsDraftStore, PreviewRenderer, type PreviewChannel } from './preview'`.
  - The two edits touch disjoint symbols, so both import lines were kept:

        import { fsDraftStore, PreviewRenderer, type PreviewChannel } from './preview'
        import { NO_STORE, resolveStaticFile, sendFile } from './serve'

    Module ordering follows the file's existing alphabetical-by-specifier
    convention. Nothing was dropped from either side.

## Incoming changes preserved

Verified by diffing the resolved file against the incoming blob
(`git show 6ff75bddb:tools/generate/src/cli/builder.ts`). Every delta is
attributable to ours' `NO_STORE` refactor; no incoming logic was discarded.

- `servePreview`, `escapeHtml`, `previewRenderer`, the `PREVIEWS` cache map,
  `PreviewRenderer`, `fsDraftStore`, `PreviewChannel`, `InvalidDefinitionError`
  are all present in the resolved file.
- The request-time preview route (`draft`/`edit` rendered on request,
  `published` still served off disk) is present, including the
  `InvalidDefinitionError` → HTML 500 branch.
- Both `cmdRender` calls on the save path are gone, and `cmdRender` is absent
  from the file entirely — the incoming removal survived.
- The REQ-119 header comment block replaced the old T1 text as incoming wrote it.
- Ours' `NO_STORE` hoist is retained and still coherent: `NO_STORE` is imported
  and used at the single `res.setHeader` site; no local `const NO_STORE`
  remains, so there is no shadowing or duplicate definition.

`tsc -p tools/generate/tsconfig.json --noEmit` exits 0 on the resolved tree, so
both sides' symbols resolve.

## Post-merge review flag

Per the enrichment rule (intent unknown on the incoming side), flagging for
review — note this is a pre-existing property of the incoming commit, not a
merge artifact:

- The incoming commit embeds a **raw NUL byte** (`0x00`) in TypeScript source,
  used as a cache-key separator in `builder.ts`
  (`const key = ` + "`" + `${ctx.cwd}<NUL>${ctx.root}` + "`" + `) and again in the new
  `tools/generate/src/cli/preview.ts` (offset 7098). It is present in blob
  `6ff75bddb` itself, and in neither the merge base nor ours. It was preserved
  verbatim as incoming-authoritative content.
- Consequence: git and ripgrep classify both files as **binary** — `preview.ts`
  shows as `Bin 0 -> 7389 bytes` in `git diff --stat`, and future diffs of these
  files will be suppressed unless `--text` is passed. A follow-up replacing the
  literal byte with the `\0` escape would restore normal diffing; it is out of
  scope for conflict resolution.
- Minor redundancy, not a defect: incoming's new `servePreview` responses state
  `'cache-control': 'no-store, must-revalidate'` literally, while ours' hoisted
  `setHeader` supplies the same value via the `NO_STORE` const. Values are
  identical, so behaviour is unaffected.
