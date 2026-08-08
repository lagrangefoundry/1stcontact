---
uid: report-22426fdf
id: REPORT-1675
type: report
title: Claude fix_review report
created_by: xgd
created_at: '2026-08-08T00:34:04.643265+00:00'
updated_at: '2026-08-08T00:34:04.643265+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review
  subject_uid: story-e674c60a
---

All issues from the review report are fixed and verified.

## Critical issue fixed

**AC-977 — JSON responses served cacheable, and the UAT could not see it**

*Implementation* (`tools/generate/src/cli/builder.ts`): rather than patching `json()`'s four call sites, the directive is now set **once, before any routing**, via `res.setHeader('cache-control', NO_STORE)` at the top of `handleBuilderRequest`. Node merges it into every `writeHead` below (none of which names `cache-control`), so it covers the served trees, the hand-written document, every JSON envelope, and every 400/403/404/500 — and any route added later inherits it. The two per-route restatements were removed: the shell's copy (which read as "the shell is the special case" and is what made the JSON gap invisible) and the `/framework/` route's bare `no-store`, which was a near-miss of the string everything else used. `serve.ts` now exports `NO_STORE = 'no-store, must-revalidate'` as the single definition, composed by both senders.

*Evidence* (`test_UAT_AC977_…`): rewritten to be structural, not a list of representatives. It reads the routing table **out of the origin's own source** and checks coverage in both directions — declared-but-unprobed, and probed-but-undeclared (which stops a broken extraction from passing over an empty set). 21 probes cover every route class in success and rejection shape, plus the unrouted fallthrough, asserting the exact directive rather than `/no-store/`.

Three mutation checks confirm it is non-vacuous, each run against a deliberately broken build:
- remove the central directive → fails
- exempt **only** JSON (`removeHeader` inside `json()`, the original defect) → `AssertionError: GET /api/sites: expected null to be 'no-store, must-revalidate'`
- add an unprobed route → `a route the origin declares that no probe covers: expected [ '/api/unprobed' ] to deeply equal []`

Live wire check through the real CLI (`1c builder`) — `/api/sites`, `/api/assets`, `/`, `/builder/main.js`, and both 404 classes all return `cache-control: no-store, must-revalidate`.

## Warnings fixed

**W2 — three artifacts said "never aliased" while `vitest.config.mts` aliases.** Kept the alias (it is derived from `webuiPackageDir`, so it corrects the *route* without forking the consumption path) and recorded it in all four places that contradicted it: `report-62f5dd5e` §1, `doc-c49667b3` §1, the story's Technical Context, and the two test docstrings. Each states the three properties that stop it decaying into a stand-in, and says plainly that the worktree-parent install was rejected because its failure mode is the silent green.

**W3 — six pre-existing red tests.** Confirmed still red (exactly the six predicted) and confirmed not caused by this branch. Filed **BUG-33** (`bug-ede1fb8c`, draft) carrying the traced stale-DOM-handle root cause for the REQ-115 one so it need not be re-derived.

**W4 — `bug-5cabb340` misrecorded `index.html`.** Corrected: deleted, not updated, with the reason (a committed copy of the generator's output is itself a second definition site).

## Verification

`3 files passed, 23 tests passed` for the story suites; `7 files, 47 tests` including every `serve.ts` consumer (STORY-95/96 preview server, REQ-113, clean page URLs, aligned crops). Lint and build gates report success; no new `tsc` diagnostics in any touched file.

**Confidence: high** on AC-977 — the criterion violation is closed at a single point, the UAT now fails against the exact implementation that passed it, and the "no exempt response" claim is checked structurally rather than by sample. The one residual risk is a reviewer preferring the artifact divergence resolved the other way (drop the alias, install at the worktree parent); I took the option the review's own analysis favoured and documented the rejected alternative explicitly.
