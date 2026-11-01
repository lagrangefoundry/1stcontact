---
uid: report-f379333d
id: REPORT-722
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-22T19:38:45.448676+00:00'
updated_at: '2026-07-22T19:38:45.448676+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-d0a8cfad
---

All 7 UATs pass, with both real-browser probes (AC-683 and AC-688) genuinely executing against all three engines — not skipped. One UAT per AC, all names matching `^test_UAT_AC\d+_\w+$`. No runtime code or existing tests were modified; the only environmental step was building the workspace `dist/` (a build artifact, not a source change).

```
UATs generated for story story-d0a8cfad (plan item 1 of 9)

Story: story-d0a8cfad — L1 layout substrate rendered safe by construction (REQ-82)
Test file(s) created:
  - tests/reconciliation-l1-substrate.test.ts

Tests written: 7
Tests passed: 7
Tests failed: 0

AC → UAT mapping (1:1):
  AC-682 → test_UAT_AC682_valid_document_and_optional_primitives_accepted   (validator, engine-free)
  AC-683 → test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths  (real Chromium, ran 4.6s)
  AC-684 → test_UAT_AC684_interpolate_varies_continuously_and_snap_holds    (renderer CSS, engine-free)
  AC-685 → test_UAT_AC685_text_url_alt_and_fontfamily_payloads_are_neutralised  (emitter, engine-free)
  AC-686 → test_UAT_AC686_envelope_boundary_is_the_range_not_the_property   (validator, engine-free)
  AC-687 → test_UAT_AC687_multiple_violations_all_reported_with_path_and_message  (validator, engine-free)
  AC-688 → test_UAT_AC688_no_layout_divergence_across_three_engines         (3 real engines, ran 7.8s)

test_files_created:
  - "tests/reconciliation-l1-substrate.test.ts"
```

Notes for the outer workflow:
- The existing FC file `tests/req82-l1-substrate.test.ts` remains untouched (not my task to modify). It is the `test_UAT_FC_REQ-82_*` orphan that downstream reconciliation review will rename/delete against these AC-linked UATs.
- AC-687's behavior (full per-field error list) was **not** covered by the FC file; the new UAT proves it directly by submitting a document with three simultaneous violations and asserting `result.errors` carries the paths `/widths/1`, `/root/children/0/axes/fontSizePx`, and `/root/children/1/src`.
- No divergence between the ACs and the code was found — every test passes against the existing implementation.
