---
uid: report-a25498cc
id: REPORT-1616
type: report
title: 'UAT Coverage: Structured Copy Editing: One Validated, Atomic Write Path'
created_by: xgd
created_at: '2026-08-07T19:41:46.241022+00:00'
updated_at: '2026-08-07T19:41:46.241022+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-f753cecd
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# UAT Coverage Assessment: Structured Copy Editing: One Validated, Atomic Write Path

**Result**: PASS
**AC verdicts**: 17 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

Chronological ledger of intents bearing on this capability's write path:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-11 | free_and_reconciled | 2026-06-30 | 1c structured-edit commands (page/config/asset CRUD + get + status) — the **shared validator and atomicity rule** this surface reuses, and the "AI tool surface" the peer claim is measured against | YES |
| REQ-116 | free_and_reconciled | 2026-07-31 | The edit render: derived segments, L1 addresses, outlines — supplies the **address vocabulary** this surface resolves (contract later hoisted into `site-schema/src/l1/edit.ts`) | YES (neighbouring; CAP-84) |
| REQ-115 | free_and_reconciled | 2026-07-31 | Builder shell / `site` tab — the **origin** AC-992 exercises as a thin transport | YES (neighbouring; CAP-85) |
| REQ-117 (in BUNDLE-16) | free_and_reconciled | 2026-07-31 | Copy editing end-to-end (T3): address contract, `copyFieldsOf` / `applyCopyFields`, `1c copy get\|set`, one-map-one-diff, validate-before-apply, no raw mode, module-slot copy, overflow legibility. Follow-up "the loop is closed" added `/api/copy` GET/POST + `data-fc-page` | YES |
| REQ-118 | free_and_reconciled | 2026-07-31 | Image selection (T4): field vocabulary widened `'string'` → `'string' \| 'enum'`; image region exposes `src` (closed list = site images **+ current handle**) and `alt`; enum membership enforced write-side; **no** `image set` command and **no** `/api/image` route; test plan names "a save re-rendering both channels" | YES |
| REQ-119 | draft | 2026-07-31 | Request-time draft and edit renders inside control-app | NO (not yet active) |

No intent in the ledger retires any behavior this capability's matrix describes. REQ-118
is the only *modifying* intent, and it widened the surface (copy → any edit) rather than
narrowing it — which is exactly what the AC set records.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-100 | REQ-11, REQ-116, REQ-117, REQ-118 (+ REQ-115 for the origin) | aligned | `story_kind: upgrade`, `updated_by: request-66e4c630` (REQ-118). Every "In scope" bullet traces to reconciled intent; the story's own Out-of-scope list matches REQ-117's and REQ-118's non-goals (framing, upload, text properties, undo, asset listing as its own surface, the browser gesture, the edit render channel) |

**Story-body claims checked individually against intent** (independent of AC verdicts):

- *Naming a region* — REQ-117 "the edit-address contract moved to `site-schema`" → AC-987, AC-989
- *Asking what a region exposes* — REQ-117 `copyFieldsOf`; REQ-118 §1 → AC-980, AC-981, AC-1024, AC-1025
- *Applying one change as one change* — REQ-117 AC3; REQ-118 §"alt in the same diff" → AC-983, AC-1026
- *Validating the whole result* — REQ-117 AC5; REQ-118 AC-3 → AC-986
- *Refusing legibly* — REQ-117 AC4; REQ-118 §2 (membership at the field) → AC-984, AC-985, AC-988
- *Making the change visible, both renderings* — REQ-117 "loop is closed"; REQ-118 test plan "a save re-rendering both channels" → AC-982, AC-1026, AC-992
- *Being incapable of raw code* — REQ-117 AC6 + the invariant; REQ-118 §1 (enum is narrower) → AC-991
- *Changing nothing but structured fields* — REQ-118 AC-6 → AC-1027

Three Technical-Context passages disclaim coverage **explicitly and correctly**, so none is
a gap: the browser gesture needing no change for images ("not claimed as an acceptance
criterion here"), the `webui-fields` enum label/thumbnail limitation (closed upstream per
DOC-8 §9.4, "no criterion here asserts a label or a preview"), and the divergence over what
clicking an empty region opens (belongs to the gesture capability). The known cosmetic
unicode-escaping diff is recorded as wanting its own ticket, not as a behavioral promise.

No behavior the ledger calls for is missing from the story body. REQ-117's ACs 9 and 10
(innermost-first nested resolution, View mode unaffected) and REQ-118's AC-7 (asset listing
reachable independently) belong to neighbouring capabilities the story explicitly scopes
out — the gesture and the asset store — and each has its own reconciliation suite
(`reconciliation-copy-edit-gesture.test.ts`, `reconciliation-site-asset-listing.test.ts`).

## Findings — Categorized by Editor Action

None. Zero violations, zero warnings, zero needs_review.

## Evidence Quality

All 17 ACs are covered by 22 UATs across two files, and **all 22 were executed and passed**
during this assessment (`vitest run`, 22 passed / 22, 0 skipped, 1.45s):

- `tests/reconciliation-copy-edit-write-path.test.ts` — 13 UATs
- `tests/reconciliation-copy-edit-image-selection.test.ts` — 9 UATs

The evidence satisfies the substantive-cover rule on every axis checked:

- **Real entry points.** Every UAT drives `run(argv)` — the real `1c` CLI, argv in,
  `{ok,data}` / `{ok,error}` envelope and process exit code out — or a live builder origin
  via `startBuilder` + real `fetch`. Observables are bytes on disk (draft page document,
  both rendered channels, asset files), never internal call records.
- **No internal mocking.** No `vi.mock` / `vi.fn` / `vi.spyOn` / stub anywhere in either
  file; the only fixtures are a throwaway `mkdtempSync` store per test and the seeded page.
- **No conditional skips.** Neither file guards on `WEBUI_INSTALLED` (unlike
  `req117-stale-edit-render.test.ts`), so the origin half genuinely runs here — confirmed by
  0 skipped.
- **Nothing structural.** No test reads source text to assert a name appears.
- **The two hardest claims are proved by consequence, not assertion.** AC-986 plants a
  9999px `fontSizePx` violation at a node *no edit under test touches*, then asserts a copy
  edit, an **image** edit and an unrelated `config set` fail with the identical code,
  message *and* path — which none could do if it validated only what it touched or ran its
  own validator. AC-983/AC-1026 prove "one save is one change" via `1c status` against a
  published base (zero modified files after a half-bad map; exactly `['pages/home.json']`
  after a two-field map).
- **The negative-space assertions are real.** AC-1027 fingerprints every asset file's
  contents, size *and* mtime across an image swap and deep-compares the node to
  `{...before, src}`; AC-984 compares draft and rendered bytes for four distinct classes of
  rejection; AC-991 sweeps every stamped region and asserts both field shapes were actually
  observed, so an all-empty page could not pass it vacuously.

## Notes for the Editor

Nothing to fix in this capability. Two observations, neither a finding:

1. **`.xgd/uat_index.json` carries no run signal.** All 308 ACs and all 322 tests in the
   index read `status: "missing"`, `last_run: null` — including these 22, which demonstrably
   exist in source and pass. The index's status field is unpopulated project-wide, so it
   must not be read as evidence of missing tests. Verdicts here were made against the test
   sources and a real run, not the index. If a future round wants the index to mean
   something, populating it is a tooling task, not a matrix task.

2. **AC-992's "there is no separate image route" is proved positively, not negatively.**
   The UATs establish one endpoint by driving `/api/copy` for both a word change and an
   image change and matching each against the CLI — which is what the AC's own Verification
   section asks for, hence the `pass`. A cheap future strengthening (not required, and not
   filed as a warning) would assert that `/api/image` returns 404, pinning REQ-118's "no
   `/api/image` route" claim against a regression that adds one.
