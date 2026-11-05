---
uid: report-bacbbf6e
id: REPORT-11074
type: report
title: 'Report: mode_override for story-179b8c06'
created_by: xgd
created_at: '2026-11-05T22:08:56.063224+00:00'
updated_at: '2026-11-05T22:08:56.063224+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: story-179b8c06
  anchor_ticket: bundle-7988e925
  rule: code_frozen
  batch_index: 1
  parent_report_uid: report-84738adf
  quality_mode: reconcile
  justification: The reference state composes each behavior's client.js in its own
    block scope (BUG-75), so the bundle parses; HEAD's plain join yields a duplicate-const
    SyntaxError that kills all client behavior on every page. AC-1624's clean desktop
    run is right and the composer is wrong.
  files:
  - tools/generate/src/cli/module-assets.ts
  - packages/framework/src/modules/module-assets.ts
  rung: 2
  tip_evidence:
  - file: tools/generate/src/cli/module-assets.ts
    lines: 42-75
  - file: tools/generate/src/cli/module-assets.ts
    lines: 120-124
  - file: packages/framework/src/modules/module-assets.ts
    lines: 13-13
  external_cause: null
  planner_trust_boundary: false
  granted_head: de5c8d9d76924df2a5a255c3df42799e6770b671
---

# Mode override granted: code_frozen

The reference state composes each behavior's client.js in its own block scope (BUG-75), so the bundle parses; HEAD's plain join yields a duplicate-const SyntaxError that kills all client behavior on every page. AC-1624's clean desktop run is right and the composer is wrong.

Planner instructions for the batch:

AC-1624's desktop arm is correct. The 4 violations are the page error from an unparseable capabilities.js, one per width (768/1024/1280/1440). Fix the composer, not the module constants: the reference state gives each behavior's client.js its own block scope in the bundle and drops the statement-leading `export` that a block cannot contain (BUG-75). Renaming ERROR_SELECTOR is explicitly rejected there, because it only waits for the next collision. Then regenerate packages/framework/src/modules/module-assets.ts with `1c assets` so the committed MODULE_CLIENT_JS parses (verify with node --check on the extracted bundle). Do not add any page-error exception to the test. Keep the REQ-145 build-artifact suite (generated file matches its inputs) and the other REQ-93 slot tests green. If Chromium still reports violations after the bundle parses, print their text and fix what they name.
