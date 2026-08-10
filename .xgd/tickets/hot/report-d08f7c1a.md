---
uid: report-d08f7c1a
id: REPORT-1747
type: report
title: 'UAT Coverage: Structured Copy Editing: One Validated, Atomic Write Path'
created_by: xgd
created_at: '2026-08-10T07:41:37.559409+00:00'
updated_at: '2026-08-10T07:41:37.559409+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-f753cecd
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# UAT Coverage Assessment: Structured Copy Editing: One Validated, Atomic Write Path

**Result**: PASS
**AC verdicts**: 17 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Attempt 3. Verdicts were re-derived independently from intent, ticket bodies and test
sources; the 22 UATs were **executed** during this assessment (`vitest run` over both
files: 2 files passed, 22/22 tests passed, 0 skipped, 1.67s).

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-11 | free_and_reconciled | 2026-06-30 | `1c` structured-edit commands (page/config/asset CRUD + get + status) — the shared validator and atomicity rule this surface reuses, and the AI tool surface the peer claim is measured against | YES |
| REQ-44 | free_and_reconciled | 2026-07-03 | Tooling hygiene (in BUNDLE-16); no behavioural bearing on this capability | YES (inert here) |
| REQ-115 | free_and_reconciled | 2026-07-31 | Builder shell / `site` tab — the origin AC-992 drives as a thin transport | YES (neighbouring, CAP-85) |
| REQ-116 | free_and_reconciled | 2026-07-31 | The edit render: derived segments, L1 addresses, outlines — supplies the address vocabulary this surface resolves | YES (neighbouring, CAP-84) |
| REQ-117 | free_and_reconciled | 2026-07-31 | Copy editing end-to-end (T3): address contract, `copyFieldsOf`/`applyCopyFields`, `1c copy get\|set`, one-map-one-diff, validate-before-apply, no raw mode, module-slot copy, overflow legibility, `/api/copy` | YES |
| REQ-118 | free_and_reconciled | 2026-07-31 | Image selection (T4): field vocabulary widened `'string'` → `'string' \| 'enum'`; image region exposes `src` (closed list = site images + current handle) and `alt`; enum membership enforced write-side; no `image set` command, no `/api/image` route | YES (the `updated_by` on STORY-100) |
| REQ-112 | abandoned | 2026-07-31 | — | NO |
| REQ-119 | bundled | 2026-07-31 | Request-time draft and edit renders inside control-app | imminent (neighbouring; no claim here) |
| REQ-121 | bundled | 2026-08-07 | Copy-edit modal chrome/typography | imminent (gesture capability; explicitly out of this story's scope) |
| REQ-122 | bundled | 2026-08-07 | Builder chat panel / AI session | imminent (neighbouring) |
| REQ-125 | legacy_done | 2026-08-08 | DOC-30 authored (a document, no behaviour) | YES (inert) |
| REQ-126 | bundled | 2026-08-08 | Declares the L1 control surface as a Toolbox surface — explicitly "a formalisation of `edit.ts`, not a second surface beside it", no consumer gains a bypass of validation/atomicity/re-render | imminent — **additive, retires nothing here** |
| REQ-127 | bundled | 2026-08-08 | L1 tooling configuration over that API (deletes `declare.ts`) | imminent (tooling) |
| REQ-128 | bundled | 2026-08-08 | Background image selection: a *container* segment carrying `backgroundImageUrl` exposes it through this same surface | imminent — **additive**; see Warning 1 |
| REQ-129 | bundled | 2026-08-09 | Verbatim `get_l1`/`set_l1` on the control surface, "leave the operator's click-to-edit modal exactly as it is" | imminent — additive, retires nothing here |
| REQ-130 | bundled | 2026-08-09 | Structured config, module instantiation, page metadata, generated assets | imminent (beyond L1; neighbouring) |

**No intent in the ledger retires any behavior this capability's matrix describes.**
REQ-118 is the only *modifying* intent that has reconciled, and it widened the surface
(copy → any edit through this surface) rather than narrowing it — which is exactly what
the AC set records. The `bundled` cluster (REQ-126…REQ-130) is uniformly additive and
each ticket states in its own words that the shared write path is preserved.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-100 | REQ-11, REQ-116, REQ-117, REQ-118 (+ REQ-115 for the origin) | aligned | `story_kind: upgrade`, `updated_by: request-66e4c630` (REQ-118). Every "In scope" bullet traces to reconciled intent; the Out-of-scope list matches REQ-117's and REQ-118's stated non-goals (framing, upload, text properties, undo, the asset listing as its own surface, the browser gesture, the edit render channel) |

Story-body claims checked individually against intent, independently of the AC verdicts:

- *Naming a region* (strict form, one resolution rule, module-scoped by instance+slot) — REQ-117's address contract → AC-987, AC-989
- *Asking what a region exposes* (copy / image / empty) — REQ-117 `copyFieldsOf`, REQ-118 §1 → AC-980, AC-981, AC-1024, AC-1025
- *Applying one change as one change* — REQ-117 atomicity, REQ-118 "alt in the same diff" → AC-983, AC-1026
- *Validating the whole result with the shared validator* — REQ-117, REQ-118 AC-3 → AC-986
- *Refusing legibly* (code/path/hint/exit, membership at the field) — REQ-117, REQ-118 §2 → AC-984, AC-985, AC-988
- *Making the change visible in both renderings* — REQ-117 "the loop is closed", REQ-118 test plan → AC-982, AC-1026, AC-992
- *Being incapable of raw code* — REQ-117 + the DOC-2 invariant, REQ-118 §1 (enum is strictly narrower) → AC-991
- *Changing nothing but structured fields* — REQ-118 AC-6 → AC-1027

Three Technical-Context passages disclaim coverage explicitly and correctly, so none is a
gap: the browser gesture needing no change for images ("not claimed as an acceptance
criterion here"), the `webui-fields` enum label/thumbnail limitation (closed upstream per
DOC-8 §9.4), and the divergence over what clicking an empty region opens (the gesture
capability's). The unicode-escaping diff is recorded as wanting its own ticket, not as a
behavioural promise.

## Evidence Quality

All 17 ACs are covered by 22 UATs across two files, and all 22 were run during this
assessment and passed:

- `tests/reconciliation-copy-edit-write-path.test.ts` — 13 UATs
- `tests/reconciliation-copy-edit-image-selection.test.ts` — 9 UATs

Checked against the substantive-cover rule:

- **Real entry points.** Every UAT drives `run(argv)` — the real `1c` CLI, argv in,
  `{ok,data}`/`{ok,error}` envelope and process exit code out — or a live builder origin
  via `startBuilder` + real `fetch`. Observables are bytes on disk (the draft page
  document, both rendered channels, the asset files), never internal call records.
- **No internal mocking.** No `vi.mock` / `vi.fn` / `vi.spyOn` in either file; the only
  fixtures are a throwaway `mkdtempSync` store per test and the seeded page.
- **No conditional skips.** Neither file guards on `WEBUI_INSTALLED`; 0 skipped confirmed
  in the run.
- **Nothing structural.** No test reads source text to assert a name appears.
- **The two hardest claims are proved by consequence.** AC-986 plants a 9999px
  `fontSizePx` violation at a node no edit under test touches, then asserts a copy edit,
  an image edit and an unrelated `config set` fail with the identical code, message *and*
  path — impossible if either validated only what it touched or ran its own validator.
  AC-983/AC-1026 prove one-save-is-one-change via `1c status` against a published base.
- **Negative space is asserted.** AC-1027 fingerprints every asset file's contents, size
  and mtime across a swap and deep-compares the node to `{...before, src}`; AC-984
  compares bytes across four distinct rejection classes plus a whole-definition
  validation failure; AC-991 sweeps every stamped region and asserts both field shapes
  were actually observed, so an all-empty page cannot pass it vacuously.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | story | STORY-100 | no-action-now (folds in at reconcile) | REQ-128 (`bundled`, 2026-08-08) extends **this** surface: a container segment carrying `backgroundImageUrl` exposes a picker through the same `copy get\|set` / `/api/copy` path. The story body and AC set describe only copy and `image`-kind regions. The code is **not in this branch** — `grep backgroundImageUrl packages/site-schema/src/l1/edit.ts` returns nothing — so it is unreconciled working-branch intent, not matrix drift | Do **not** author ACs/UATs for it here: they would fail against this branch. Reconcile REQ-128 in the normal way; the matrix edit belongs to that pass |
| 2 | warning | uat | AC-984 | uat-edit (optional strengthening) | AC-984 claims the *previously rendered page* is byte-identical after a refusal; `test_UAT_AC984_...` renders and compares only the **edit** channel, never the plain draft channel. Substantive as written — the byte-identity property is genuinely exercised — but one of the two renderings the story promises is unwitnessed on the rejection path | Add `await cmdRender('acme', { cwd })` to the arrange step and assert `renderedBytes(cwd, 'draft')` alongside `'edit'` in the rejection loop |

Zero violations, zero needs_review.

## Notes for the Editor

1. **`.xgd/uat_index.json` carries no run signal.** All 311 indexed ACs read
   `status: "missing"`, `last_run: null` — including these 22, which demonstrably exist
   and pass. The index's status field is unpopulated project-wide and must not be read as
   evidence of missing tests. Verdicts here were made against test sources plus a real
   run. The index also lists the pre-rename test names for AC-981, AC-986, AC-988, AC-991
   and AC-992 alongside the current ones, so its per-AC counts overstate; populating and
   pruning it is a tooling task, not a matrix task.

2. **The `bundled` cluster is the thing to watch, and it is uniformly additive.**
   REQ-126, REQ-128, REQ-129 and REQ-130 all touch or extend `edit.ts`, and every one of
   them states in its own body that the single shared write path is preserved (REQ-126:
   "a formalisation of `edit.ts`, not a second surface beside it"; REQ-129: "leave the
   operator's click-to-edit modal exactly as it is"). Nothing in the cluster retires an
   AC here. When they reconcile, expect this capability to gain container-background
   selection (REQ-128) and to acquire a neighbour for the declared control surface —
   neither is a correction to what the matrix currently says.

3. **AC-992's "there is no separate image route" is proved positively.** The UATs
   establish one endpoint by driving `/api/copy` for both a word change and an image
   change and matching each against the CLI — which is what the AC's own Verification
   section asks for, hence the `pass`. A cheap future strengthening (not filed as a
   finding) would assert `/api/image` returns 404, pinning REQ-118's claim against a
   regression that adds one.
