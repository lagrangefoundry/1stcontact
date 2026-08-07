---
uid: report-78d9ff95
id: REPORT-1561
type: report
title: 'Code Review: request-66e4c630'
created_by: xgd
created_at: '2026-08-07T05:05:38.426240+00:00'
updated_at: '2026-08-07T05:05:38.426240+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: request-66e4c630
  anchor_uid: request-66e4c630
---

# Code Review

**Result**: FAIL

## Summary

The implementation itself is good: image editing genuinely travels the existing
`1c copy get|set` / `/api/copy` surface with no `image set` verb and no `/api/image`
route, `copyFieldsOf` was extended rather than forked, enum membership is enforced
server-side before the shared validator, and `listSiteAssets` replaces the partial
registry-only listing rather than adding a second one. It fails on the quality gate:
**3 tests fail on this branch**, all of them pre-existing matrix-backed reconciliation
UATs that this change regressed and that were not updated with it. The ACs they bind to
*were* correctly updated during reconciliation; the UATs were left behind, so the
evidence now contradicts the matrix.

## Quality Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Lint | pass | report-a3f3985c: 0 errors, 0 warnings |
| Build | pass | report-a3f3985c: exit 0 |
| Tests | **FAIL** | `pnpm test` on this worktree: **2 files failed, 3 tests failed**, 1235 passed, 59 skipped (1297) |
| Coverage | n/a | not reported by the scoped quality runs |

**The pipeline's quality reports cannot be relied on here.** Every scoped quality report
for this run (report-a3f3985c, report-22d87dc5, report-3c034046, report-9f781ea1) records
`"suites": {}` — "0 tests, 0 failed". The suite was never executed by the gate, which is
why the regression reached this review. The failures above are from running `pnpm test`
directly on this worktree.

### The three failures

All three are in files **untouched by this branch** (`git log main..HEAD --` on both files
is empty), so they were green on `main` and are regressions of this change:

1. `tests/reconciliation-copy-edit-write-path.test.ts:246`
   `test_UAT_AC981_a_region_with_nothing_editable_succeeds_with_an_empty_field_list`
   — iterates `[A_CONTAINER, A_MODULE, A_IMAGE]` and asserts `fields` is `[]`. An image
   now returns two fields (`src` enum + `alt`).

2. `tests/reconciliation-copy-edit-write-path.test.ts:603`
   `test_UAT_AC991_markup_saved_as_copy_stays_literal_text_and_every_field_is_plain_string`
   — sweeps every region and asserts `field.type === 'string'`. The `src` descriptor is
   `'enum'`.

3. `tests/reconciliation-copy-edit-gesture-modal.test.ts:268`
   `test_UAT_AC1001_a_region_with_nothing_editable_says_so_and_names_its_kind`
   — resolves `[data-l1-edit-segment="image"]` at path `0.1` and asserts
   `fields === []` and `values === {}`.

The matrix already moved; only the evidence lags:

- **AC-981** (acceptance_criterion-95afd919) now states "an image region is not one of
  them, because it exposes which image goes there and its alt text", and its Verification
  asks for "a container region and a module-instance region", contrasted with "an image
  region, which returns two".
- **AC-991** (acceptance_criterion-08c7ebe8) is now titled "every control is either plain
  text or a pick from a list the surface itself supplied", and its Verification asks that
  every field be plain-text **or** closed-list, "and that every closed-list field carries
  the list of values it will accept".
- **AC-1001** (acceptance_criterion-2f436fa0) now scopes "nothing editable" to "a
  container, a module instance".

`tests/req117-copy-editing.test.ts` was updated for exactly this reason (image → painted
container as the "nothing to edit" specimen). These three were missed — the ticket's
declared regression scope lists `req117-copy-editing`, `req117-edit-loop`,
`req117-modal-dismiss`, `req117-stale-edit-render`, `req116-edit-render`,
`req11-structured-edit`, `reconciliation-edit-render-channel` and `chat9-edit-hooks`, but
not `reconciliation-copy-edit-write-path` or `reconciliation-copy-edit-gesture-modal`.

## External Interface Accessibility

New entry points wired in: **mostly yes, one gap.**

| Surface | Wired | Evidence |
|---------|-------|----------|
| `GET /api/assets` | yes | `tools/generate/src/cli/builder.ts:205`, `editAssetList` imported at `:9`; exercised by `tests/reconciliation-site-asset-listing.test.ts:362,373` and `tests/req118-image-selection.test.ts:452,458` |
| `1c asset list` | yes | `tools/generate/src/cli/index.ts:1145` (pre-existing verb, now backed by the union listing) |
| `listSiteAssets` | yes | `tools/generate/src/cli/edit.ts:732`, called by `editAssetList` (`:766`) and `imageHandles` (`:760`) |
| `L1SegmentFieldOptions` | yes | re-exported `packages/site-schema/src/l1/index.ts:51`; threaded via `segmentOptions` at `tools/generate/src/cli/edit.ts:400,439` |
| `fetchAssets` | **no** | `apps/control-app/src/builder/api.js:34` — zero callers in `apps/`, zero references in `tests/` |

`fetchAssets` is a dead export. The ticket's justification for the route (the asset store
is its own surface) holds for the *route*, which is tested. The JS wrapper has neither a
consumer nor a test, so nothing establishes that it works. Warning, not the fail cause.

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `packages/site-schema/src/l1/edit.ts:222` | `copyFieldsOf` extended in place rather than renamed/forked; `widgetFor` factored out of the duplicated textarea rule. Clean. | ok |
| `packages/site-schema/src/l1/edit.ts:198` | `imageChoices` always includes the node's current handle — the select-selects-first-option hazard is correctly closed and documented. | ok |
| `packages/site-schema/src/l1/edit.ts:290` | `known` widened `Set`→`Map` so enum membership is checked at the field before the shared validator. Correct: a safe-but-absent handle is structurally invisible to the envelope. | ok |
| `tools/generate/src/cli/edit.ts:698` | `assetHandle` mangles a non-local registry `src`: `https://cdn.example/x.png` → `/assets/https://cdn.example/x.png`. Unreachable today (`editAssetAdd:828` writes a bare filename), but the doc comment claims it normalises "any way of naming the asset". | warning |
| `tools/generate/src/cli/edit.ts:367` | `segmentOptions` skips the directory read for non-image kinds — no waste on the text path. | ok |
| `tools/generate/src/cli/builder.ts:205` | `/api/assets` follows the surrounding route pattern exactly (slug guard → `json(res, 400/200, …)`). | ok |
| all changed files | No debug code, no commented-out blocks, no TODO stubs, no magic literals outside the two named extension sets. | ok |

Architecturally the ticket's central claim holds under inspection: `grep` finds no
`image set` subcommand and no `/api/image` route, and the write path is the same
`applyCopyFields` → `validateOrThrow` sequence copy uses.

## Checklist Compliance

No architecture, security, or design checklist reports exist for this project
(`xgd ticket list --type report --filter fields.report_kind=<kind>` returns an empty set
for all three). Sections omitted.

## Smoke Test

Entry points invoked on this worktree:

- `1c asset list xgd` → 9 rows, correct `kind` derivation (5 `font`, 4 `image`), all
  marked `(unregistered)` — exactly the registry-empty/directory-full case the union
  listing exists for.
- `1c asset list gigabytealchemy` → 5 rows spanning `image`/`font`/`other`.
- `1c asset list harbor-cafe` → `(no assets)`; `--json` → `{"ok":true,"data":{"assets":[]}}`.
- `1c asset` with no slug → clean `INTERNAL: Missing required <slug> argument.` with hint,
  no stack trace.
- `GET /api/assets` — exercised against a real `startBuilder` server by
  `tests/reconciliation-site-asset-listing.test.ts` and `tests/req118-image-selection.test.ts`
  (both pass).

No crashes, no stack traces.

## Issues Found

**Critical (must fix)**:

- 3 failing tests on this branch, all regressions of this change:
  `reconciliation-copy-edit-write-path.test.ts:246` and `:603`, and
  `reconciliation-copy-edit-gesture-modal.test.ts:268`. Their ACs (AC-981, AC-991,
  AC-1001) were updated for REQ-118; the UATs were not.

**Warnings (should fix)**:

- `apps/control-app/src/builder/api.js:34` — `fetchAssets` has no caller and no test.
- `tools/generate/src/cli/edit.ts:698` — `assetHandle` produces a nonsense handle for an
  absolute-URL registry `src`; either narrow the doc comment or pass non-local `src`
  through unchanged.

**Informational (no action)**:

- The ticket reports a pre-existing failure at
  `tests/reconciliation-edit-render-channel.test.ts:316`. That test **passes** on this
  worktree — it was resolved earlier in the reconcile run.
- Root `index.html` appears in `git diff main..HEAD` but arrived via commit `c99b072e0`
  (`xgd(resync): terminal state complete`), not the free-coded commit `58cd03439`. Outside
  this anchor's scope.

## Fix-It Prompt

Three UATs encode pre-REQ-118 behaviour and must be brought in line with the ACs that were
already updated during this reconciliation. Do **not** change production code — the
behaviour under test is intended and the ACs now say so. Do not weaken the assertions;
re-point them at the specimen the AC now names.

**1. `tests/reconciliation-copy-edit-write-path.test.ts:239-259`**
(`test_UAT_AC981_a_region_with_nothing_editable_succeeds_with_an_empty_field_list`)

AC-981 (acceptance_criterion-95afd919) now reads: "Address a container region and a
module-instance region in a seeded site … Contrast with a copy region of the same page,
which returns one field, and an image region, which returns two."

- Drop `A_IMAGE` from the `[A_CONTAINER, A_MODULE, A_IMAGE]` loop at line 242 — the
  `no editable copy` human-output assertion at line 253 no longer holds for it either.
- Extend the contrast block at lines 256-259: keep the one-field copy-region assertion and
  add an image-region read asserting exactly two fields (`src`, `alt`).
- Mirror the fix already made in `tests/req117-copy-editing.test.ts`, which replaced the
  image specimen with the painted container.

**2. `tests/reconciliation-copy-edit-write-path.test.ts:593-608`**
(`test_UAT_AC991_markup_saved_as_copy_stays_literal_text_and_every_field_is_plain_string`)

AC-991 (acceptance_criterion-08c7ebe8) now allows two shapes and adds a requirement:
"every field offered is either a plain-text field or a closed-list field, and … every
closed-list field carries the list of values it will accept."

- Replace the `expect(field.type).toBe('string')` assertion at line 603 with a check that
  `field.type` is one of `'string' | 'enum'`, and that when it is `'enum'`, `field.enum` is
  a non-empty array of strings. Type the loop variable as
  `{ type: string; enum?: unknown }` rather than `{ type: string }`.
- AC-991's Verification also asks for the markup-as-alt-text case: save a
  script/style-bearing string into an image region's `alt` and assert it renders as literal
  text introducing no element or active style — add it alongside the existing copy-region
  case if it is not already covered.
- Rename the test to drop the now-false `and_every_field_is_plain_string` claim while
  keeping the `test_UAT_AC991_` prefix intact.

**3. `tests/reconciliation-copy-edit-gesture-modal.test.ts:251-290`**
(`test_UAT_AC1001_a_region_with_nothing_editable_says_so_and_names_its_kind`)

AC-1001 (acceptance_criterion-2f436fa0) now scopes the case to "a container, a module
instance".

- Replace the `[data-l1-edit-segment="image"]` / path `0.1` specimen (lines 254-255) with a
  container or module-instance segment from the same fixture that genuinely exposes no
  fields, and update the `expect(loaded.kind).toBe('image')` assertion at line 267 to that
  kind. The `fields === []` / `values === {}` assertions and the message-dialog assertions
  below them stay as they are.

**After fixing**: run `pnpm test` and confirm 0 failures. Do not trust a scoped quality
report showing `"suites": {}` / "0 tests" — that is the empty-scope result that let this
regression through in the first place.
