---
uid: report-6a8ab2b2
id: REPORT-4431
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:49:59.574351+00:00'
updated_at: '2026-09-19T12:49:59.574351+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `tests/test_UAT_FC_REQ-172_material_content_type.workers.test.ts` — **AA** (both added), rule **2b / 2f** with the enrichment's timestamp rule ("intent unknown on one side; take the more recent commit by timestamp and flag for post-merge review"). Resolved to the HEAD side via `git checkout --ours` + `git add`.

  The two sides are **byte-identical except a single line** (205). The only difference is how one fixture's binary bytes are written in source:

  - ours (HEAD, `53605136` "Workflow fix_reconciliation_review completed: done", 2026-09-14, `xgd-intent: bundle-8e1807f6`):
    `bytesOf('\x00\x01binary')`
  - theirs (incoming, `8fd0841a` "Merge branch 'free-REQ-172' into xgd-working", 2026-09-01):
    same call with **raw NUL + SOH control bytes embedded literally** in the source file

  These are the same JavaScript string — the assertion under test (`content_type === 'application/octet-stream'` for an unmapped extension) is unchanged either way. HEAD's escaped form is the later commit by timestamp (2026-09-14 vs 2026-09-01) and also avoids literal NUL bytes, which make the file read as binary to `grep` and similar tooling in this repo. No test function, assertion, comment or behaviour differs between the sides.

## Incoming changes preserved

- All **5** `it('UAT_FC_REQ-172 ...')` functions from the incoming side are present in the resolved file (verified by count against the incoming blob `ac53526d`). Nothing was deleted; 2f is not engaged and the BUG-1301 precedence exception was not needed.
- The incoming commit `8fd0841a` touches 9 files. The other 8 (`apps/control-app/src/builder/{app,builder.css,library,markdown,reader}`, `src/material.ts`, `src/tickets.ts`, `tests/test_UAT_FC_REQ-172_library_document_preview.test.ts`) merged with **no diff vs HEAD** — their content is already present on the reconcile branch, so the cherry-pick is redundant rather than discarded (STEP 3 distinction). `git diff --cached HEAD` is consequently empty; per STEP 4 this is staged and exited `@done` without calling `--skip`, leaving the finalize step to detect the empty commit.

**Flagged for post-merge review** (per the enrichment rule): the content-type fixture line in this UAT file, where ours and theirs express the same binary payload differently.
