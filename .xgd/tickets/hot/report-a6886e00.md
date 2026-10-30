---
uid: report-a6886e00
id: REPORT-5535
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T10:20:49.195107+00:00'
updated_at: '2026-09-29T10:20:49.195107+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `package.json` — UU, config file (§2g scalar) + enrichment tie-break rule.
  Sole conflicting hunk is the `version` scalar: HEAD `0.2.51` vs incoming
  `0.2.47`. Enrichment classed intent as unknown on one side and directed
  "take the more recent commit by timestamp": HEAD `447d77e2ef` is
  2026-09-29, incoming `f1a2b40860` is 2026-09-02. Kept HEAD's `0.2.51`.
  Resolution staged; staged blob is byte-identical to HEAD, so no `M` line
  appears for it in `git status --porcelain` (expected).

No other conflict classes were present. The remaining 17 files from the
incoming commit auto-merged cleanly and are staged (13 `M`, 4 `A`).

## Incoming changes preserved

The incoming commit `f1a2b40860` touches 18 files. All 17 non-`package.json`
files are staged with their incoming content:

- New files present at exactly their incoming line counts:
  - `apps/control-app/src/capture-material.ts` (347)
  - `tests/test_UAT_FC_REQ-166_capture_site_adopts.workers.test.ts` (173)
  - `tests/test_UAT_FC_REQ-166_capture_to_ticket.workers.test.ts` (394)
  - `tests/test_UAT_FC_REQ-166_library_shows_a_capture.test.ts` (309)
- Modified and staged: `builder/api.js`, `builder/library.js`, `describe.ts`,
  `material.ts`, `router.ts`, `shot.ts`, `tickets.ts`,
  `tests/support/fake-capture-driver.ts`, `ai/fidelity-core.ts`,
  `ai/fidelity-surface.json`, `capture/extract.ts`, `capture/pipeline.ts`,
  `capture/types.ts`.
- Spot-check of the commit's load-bearing invariant (recapture keyed on
  bundle NAME, not URL): `bundleNameFor` is referenced from
  `capture-material.ts` and `tickets.ts` in the staged tree, wired to
  `store/reference-store.ts`.

All 17 REQ-166 UATs from the incoming commit are present; none were deleted
or modified. No BUG-1301 precedence exception was invoked — no incoming hunk
was dropped.

`package.json` is the single exception, and no developer code is lost by it:
the incoming diff for that file is solely `0.2.46 -> 0.2.47`, a version bump
that HEAD's `0.2.51` already supersedes. Flagged for post-merge review per
the enrichment rule, though no action is expected.
