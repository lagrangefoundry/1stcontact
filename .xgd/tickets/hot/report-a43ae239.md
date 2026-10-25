---
uid: report-a43ae239
id: REPORT-6688
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T22:49:35.120190+00:00'
updated_at: '2026-10-25T22:49:35.120190+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-5bc83942.md` (BUG-44): intent/bookkeeping ticket (2e). UU conflict that exists only in the index, because the file is outside the sparse cone. Rule applied: keep the superset. HEAD (stage 2, commit 8bee1d92af, 2026-10-25) has the same body as the incoming commit (ca07ea9bf2, 2026-09-01 "update bug bug-5bc83942") up to `## Status`. It also adds the operator's "Decision: remove the registry" section, the required behaviour and the test plan, plus the later frontmatter (`status: bundled`, `commits`, `version`, `bundled_in: bundle-5607a08d`, `updated_at` 2026-10-25). This also matches the enrichment rule: HEAD's commit is the more recent one. Resolved with `git checkout --ours` + `git add --sparse`.

## Incoming changes preserved

The incoming commit is an older snapshot of the same ticket (status draft, last_field_updated body). Every line of its body is already present word for word in the HEAD version. The only fields where it differs are older values of status/updated_at/last_field_updated, which HEAD's later updates replace. Nothing unique to the incoming side was lost. The staged result is the same as HEAD (no net diff); finalize will detect this and skip the commit. No code files were involved.

## Post-merge review flag

Flagged per the enrichment rule ("take more recent, flag for post-merge review"). Expect little to review, because the incoming side is a strict subset.
