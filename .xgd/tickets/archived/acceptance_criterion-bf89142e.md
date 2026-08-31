---
uid: acceptance_criterion-bf89142e
id: AC-900
type: acceptance_criterion
title: The deploy report names each stage on its own labelled line and terminates
  in the deploy's destination
created_by: xgd
created_at: '2026-08-06T18:39:53.516354+00:00'
updated_at: '2026-08-16T07:23:24.308193+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The human-readable deploy report is a sequence of labelled lines rather than an
opaque spinner. It contains a line for each stage that ran — the render, the
content hash, each upload group (the rendered-output half and the definition
half, named separately), the index update, and any prune — with the stage label
first, its subject next, and a trailing detail where one applies (file count and
total size for the file-moving stages, and, when nothing needed uploading, an
explicit note on the hash line that the content was already deployed). The final
line of the report is the deploy's destination: the shareable URL where there is
one, and otherwise the snapshot's storage prefix with its reason.

## Verification

Deploy a site and inspect the printed report. Assert that a line begins with each
of the render, hash, upload and index stage labels; that both upload halves are
named distinctly; and that the last non-empty line is the shareable URL. Deploy
again unchanged and assert the hash line carries the already-deployed note.