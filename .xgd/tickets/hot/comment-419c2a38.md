---
uid: comment-419c2a38
id: COMMENT-1218
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T02:29:10.041328+00:00'
updated_at: '2026-08-20T02:29:10.041328+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-06d9a4da
  kind: note
---

Report **REPORT-2316** (`report-06d9a4da`) filed. Three test mutations, one per finding:

**Violation 1 — AC-1240 had no evidence** → authored `test_UAT_AC1240_the_edit_client_is_served_derived_from_the_renderers_own_source` in the origin suite. It fetches `/framework/edit-client.js` over `startBuilder`, then asserts the served body **equals** the derivation of `packages/framework/src/l1/edit-client.ts` done exactly as the origin does it (transpile + import rewrite) — the derivation claim AC-1006 does not make. Per finding 4 it leaves the browser-runtime claim to AC-1006 and detects a second copy by *content* rather than by AC-1006's declaration/attribute scan.

**Violation 2 — AC-966's test asserted what the criterion disclaims** → rewrote it. The `dist` byte-comparison is gone; the fetch is driven from `previewUrl` (the pane's own address), real content is proven by a marker in the site's own definition, the stylesheet and image references are parsed **out of the returned document** and each must resolve 200 over the same origin, and the whole probe runs against a site created but **never rendered to disk** — the guard the AC turns on, which the old shape structurally excluded.

**Warning 1 — AC-973 never dragged** → replaced `setSplit(37)` with a real `pointerdown`/`pointermove`/`pointerup` on the divider element, asserting both the ratio and the width the component writes onto the pane; the rail is now asserted as rendered (`is-rail`, `split--collapsed`, divider withdrawn) instead of via `isCollapsed()`.

One thing to flag plainly: **the two origin UATs could not be executed here.** `startBuilder` calls `server.listen(0)`, which binds `0.0.0.0`, and this sandbox refuses it (`EPERM … syscall: 'listen'`) in `beforeAll`, failing the file before any test body runs. AC-973 does run and passes (chrome file 9/9). For the two I could not run, I type-checked the file (no new errors) and executed their non-HTTP halves in a scratch vitest file, since deleted: the AC-1240 derivation/copy-detection logic passes against the real source, and the AC-966 fixture renders through the real `cmdRender` with both reference kinds resolving inside the channel. Only the `fetch`-over-`startBuilder` transport is unverified, and every neighbouring UAT in that file already depends on it.
