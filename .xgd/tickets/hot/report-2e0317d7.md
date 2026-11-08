---
uid: report-2e0317d7
id: REPORT-11327
type: report
title: 'Override conformance: batch 0'
created_by: xgd
created_at: '2026-11-08T07:03:59.559086+00:00'
updated_at: '2026-11-08T07:03:59.559086+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: override_conformance
  subject_uid: story-39c992d3
  findings:
  - item: 5
    reason: 'planner misjudged trust boundary: the override was granted with planner_trust_boundary
      false, but the production diff matches the trust-boundary patterns (trust_boundary_mismatch
      is true).'
    added_lines:
    - '  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, ''\\$&'')).join(''|'')'
    - '  const backendPhrase = new RegExp(`Backend\\s+"(?:${escaped})"`, ''gi'')'
    - '  const bare = new RegExp(escaped, ''gi'')'
    absent_tip_lines:
    - '"planner_trust_boundary": false'
    - '"trust_boundary_mismatch": true'
    files:
    - apps/control-app/src/imagegen.ts
  mode_override_uid: report-483291fe
  parent_report_uid: report-a313553e
  batch_index: 0
  attempt: 0
---

# Override conformance

- Item 1: pass. unnamed_files_touched is empty; files_touched is only apps/control-app/src/imagegen.ts, the file the override names.
- Item 3: pass. REQ-208 requires that no error sentence the model sees names the image vendor. The change rewrites `Backend "<vendor>"` to "This generator" and other vendor or model names to "the generator". The error keeps its code, class, declared sentence ('That is not a shape this generator offers') and the list of supported ratios, as AC-2380 and the other shape ACs require.
- Item 4: pass. The change is in imageSurface() next to meteredDraws, as instructed. It covers every model-read error (create_image and edit_image) and removes IMAGE_PROVIDER and the backend model id. ai-imagegen.js, the framework plugin, AC-2380 and its test are untouched.
- Item 5: FAIL. trust_boundary_mismatch is true: the planner declared trust_boundary false, but the diff matches the trust-boundary patterns, so the checklist requires 'planner misjudged trust boundary'. The matched lines escape regex special characters in the platform's own vendor and model names before building the scrub patterns. They do not change how any untrusted content is marked or escaped. To clear this, the planner should re-declare trust_boundary true, and the batch should cite or add a test that checks the scrub (the AC-2380 test asserting no 'openai' in the unsupported-shape error may qualify).
- Item 6: pass. Rung 1 (REQ-208 in scope). Only the named file is edited, and the added behaviour (vendor-free errors on every image operation) is what REQ-208 demands.

Notes, not findings: the plain-name pattern matches case-insensitively anywhere in the text, so a short model id could also replace part of an unrelated word in the host's error detail. The fix also changes the caught Error in place (message and detail) rather than wrapping it in a new one.

1 override audited, 1 touched a trust boundary.