---
uid: report-06d9a4da
id: REPORT-2316
type: report
title: 'Fix Builder Workspace: Chrome, Origin & Display Panel (uat) — attempt 4'
created_by: xgd
created_at: '2026-08-20T02:28:49.623759+00:00'
updated_at: '2026-08-20T02:28:49.623759+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-a994b8f3
  level: uat
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Builder Workspace: Chrome, Origin & Display Panel (uat)

**Attempt**: 4
**Fixes applied this call**: 3
**Violations remaining**: 0 (authored; two of the three could not be *executed* here — see
"Execution status", which is the one thing the assessor should check first)
**Needs more work**: false

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-1240 (`acceptance_criterion-bd9ce1d6`) | Authored `test_UAT_AC1240_the_edit_client_is_served_derived_from_the_renderers_own_source` in `tests/reconciliation-builder-workspace-origin.test.ts:194-282`, in the suite that already runs real HTTP over `startBuilder` |
| 2 | uat-edit | AC-966 (`acceptance_criterion-6fb2bebc`) | Rewrote the UAT against the current criterion and renamed it `test_UAT_AC966_the_pane_shows_the_selected_sites_whole_rendering_over_this_origin` (`…-origin.test.ts:125-192`) — the old name asserted the `byte_identical` claim AC-966 now cedes to AC-1032 |
| 3 | uat-edit | AC-973 (`acceptance_criterion-e1acae35`) | Rewrote `test_UAT_AC973_…` (`tests/reconciliation-builder-workspace-chrome.test.ts:384-461`) to drive a real pointer gesture and to assert the rail as rendered. **Runs and passes here** |

No ticket bodies or fields were changed: every finding at this level was a test finding, and
no `uat_coverage` field is moved to `pass` on evidence this machine could not execute
(see below).

### 1 — AC-1240, the absent evidence (violation 1)

The new UAT is written about *what this origin answers with*, per finding 4's constraint:

- fetches `/framework/edit-client.js` over the running origin; asserts 200 and a JavaScript
  content type;
- locates `packages/framework/src/l1/edit-client.ts` and derives it **exactly as the origin
  does** (`ts.transpileModule` at ES2022/ESNext, then the `@1stcontact/site-schema` →
  `/framework/site-schema-edit.js` rewrite), and asserts `served === derived` — so a file
  authored separately beside it fails. This equality is the criterion's own subject
  (derivation), and it is the clause AC-1006 does *not* make: AC-1006 asserts only that the
  same `export function` names survive;
- asserts the source carries build-time-only syntax and that none of it survives into the
  answer;
- asserts the rewritten import points at a sibling this origin answers for (a 200 only —
  what that sibling *contains* is left to AC-1006);
- detects a second copy **by content**, not by declaration: substantial statements of the
  derived module must not appear verbatim in any `apps/control-app/src` source. AC-1006's
  check is name/attribute-based (`function resolveEditTarget|mountL1EditBridge`, the four
  stamp attributes) — deliberately a different detector, and neither the browser-runtime
  nor the single-delivery-point claim is restated here.

### 2 — AC-966, the criterion that moved and the test that did not (violation 2)

The disk comparison is gone, and it is not merely gone — the three clauses the AC now turns
on are each asserted:

- **the address is the pane's**: `previewUrl` is imported from the workspace's own
  `apps/control-app/src/builder/api.js` and the fetch is driven from it, rather than from a
  literal path this test invented;
- **real content**: asserted by a marker written into the site's *own definition*, not by
  byte-equality with `dist` (AC-1032 owns that);
- **whole**: the stylesheet `href`s and the image `src`s are parsed **out of the returned
  document**, resolved against the displayed URL, and each must answer 200 over the same
  origin with a non-empty body; the stylesheet must arrive as `text/css`;
- **the guard**: the whole probe runs against a site created in the real store and **never
  rendered to disk** (asserted as a precondition, so the guard cannot be vacuous). This is
  AC-1031's *technique* reused for AC-966's own probe — AC-1031's guarantee ("serving
  materialises nothing") is not restated.

### 3 — AC-973, the drag that was never dragged (warning 1)

`app.split.setSplit(37)` is replaced by a real `pointerdown` on the divider element followed
by `pointermove`/`pointerup` (the component listens on `document` once the handle has taken
the pointer; jsdom falls back to plain bubbling, which the component documents). 100px of a
1000px container moves the split ten points and the width the component **writes onto the
primary pane** moves with it — so the gesture-to-model-to-layout wiring is what is evidenced.
The rail is asserted as rendered — `is-rail` on the secondary pane, `split--collapsed` on the
root, the divider withdrawn, the restore control present — rather than as `isCollapsed()`.

One stand-in was necessary and is geometry, not behaviour: jsdom computes no layout, so the
container is given a box (`getBoundingClientRect`, restored in a `finally`). Without it the
drag is reduced to a no-op by arithmetic rather than by the component, and the split's
responsive flip reads the same zero width. Every line of the divider handler, the drag
reduction and the layout it applies is the shipped code.

## Execution status — READ THIS

| UAT | Ran here? | Result |
|---|---|---|
| `test_UAT_AC973_…` (chrome) | yes | **passes**; the whole file passes (9/9) |
| `test_UAT_AC966_…` (origin) | **no** | suite cannot start in this sandbox |
| `test_UAT_AC1240_…` (origin) | **no** | same |

`tests/reconciliation-builder-workspace-origin.test.ts` cannot run in this environment:
`startBuilder` → `server.listen(0)` binds `0.0.0.0` and the sandbox refuses it —
`{ code: 'EPERM', errno: -1, syscall: 'listen', address: '0.0.0.0' }`, raised in `beforeAll`
at `tools/generate/src/cli/builder.ts:623`, which fails the file before any test body runs.
This is an environment restriction, not a defect in the tests or in the origin, and it is
unrelated to the component store (which is installed).

So the two origin UATs were validated as far as this machine permits:

- **type-checked** (`tsc --noEmit` over the file): no new errors. The only diagnostics on the
  file are pre-existing ones shared with untouched code (the `wrangler` type name, the
  `playwright` import, and the identical `api.js` dynamic-import cast already at
  `…-origin.test.ts:765`).
- **the non-HTTP halves executed** under vitest in a scratch file (since deleted; the tree is
  clean apart from the two test files):
  - AC-1240's derivation and copy detection: the derivation produces browser JS, `import
    type` and `interface …{` are gone, `@1stcontact/site-schema` is rewritten to the sibling
    route, ≥6 distinctive statements are available to detect a copy by, and **no**
    `apps/control-app/src` source contains any of them. Both `createRequire` sites resolve
    the same `typescript@6.0.3` (workspace root, symlinked from `tools/generate`), so the
    equality is against the same compiler the origin uses.
  - AC-966's fixture and reference walk: the exact fixture is built and rendered through the
    real `cmdRender`; the rendered home page carries the marker, and both regexes find
    references that resolve inside the channel to files that exist.

What remains unexercised here is only the transport — `fetch` over `startBuilder` — which
every neighbouring UAT in that file already relies on.

## Code Edits (if any)

None this call.

## needs_review Items Forwarded

None. Finding 4 (info) was applied as a constraint on finding 1's fix, and finding 5 (info,
AC-1240 `status=pending`) was left alone as the assessor recorded.
