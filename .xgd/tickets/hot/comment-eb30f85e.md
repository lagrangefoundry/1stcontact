---
uid: comment-eb30f85e
id: COMMENT-683
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-05T23:16:02.112213+00:00'
updated_at: '2026-08-05T23:16:02.112213+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-5fe95c00
  kind: note
---

Assessment complete. **REPORT-1329** (`report-5fe95c00`) — result **FAIL**, 7 violations / 3 warnings / 0 needs_review.

## What I found

Coverage is not the problem in the usual sense: all 39 ACs carry a `test_UAT_AC<n>_*` test, and I ran them — 9 files, 44 passed, 2 skipped (both browser-gated `test_UAT_FC_*` siblings, not AC UATs). Nothing is missing or trivially stubbed.

The problem is that **five ACs are proven by a test that cannot fail when the production line the AC names is deleted**. I verified each seam in the source rather than taking the prior alignment report's word for it:

| AC | Unguarded line | Why the test can't see it |
|---|---|---|
| AC-657 | `index.ts:491-506` | The test writes the JSON document itself and parses it back; `grep run(['values-diff'` over `tests/` → no matches anywhere |
| AC-643 | `perceptual.ts:467` (`viewport: opts.size`) | Test passes `actualImagePath`, taking the whole `if (!actualImage)` shot branch out of play |
| AC-639 | `fidelity.ts:167` | Same shape on the values-diff side — `actualManifestPath` bypasses `extractDraftManifest` |
| AC-720 | `subRenderOptions` → render/serve handoff | End-to-end crop-pair clause is declared **manual** in the test file's own docstring |
| AC-631 | capture-side compositing | Its capture-leg owner is browser-gated; I ran that file and confirmed it **skips** here (5 passed, 3 skipped) |

Plus two structural gaps: STORY-76 declares surface-gradient *capture* in scope with a specific ancestor-walk rule that no AC expresses, and `values-diff --multi-viewport` — live, documented, FC-UAT'd — is described by no story in the matrix, a merge artifact of today's consolidation.

Verdicts written: 34 AC pass / 5 fail; STORY-78 pass, the other four fail; capability fail. Intent ledger is clean — nothing retired, nothing unsupported, so zero deprecations and zero needs_review.

Two notes for whoever picks up the fix: findings 2+4 are one edit across both size-aware commands, and 1+8 are one edit on the values-diff CLI path — every ingredient (fake `BrowserDriver`, byte-level stdout harness, jsdom `EXTRACT_SCRIPT` pattern) already exists in the repo. And STORY-78 is the model — all nine of its UATs drive `run(argv)`, which is why it's the only story with no findings.
