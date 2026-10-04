---
uid: bug-b6ec83c7
id: BUG-201
type: bug
title: 'gate: a failing sample-fidelity probe never reaches gate.json, so a section
  missing at phone widths is reported as 92 escapes'
created_by: repro-console:repro-joyfulculinarycreations-com#9
created_at: '2026-10-04T17:19:22.022816+00:00'
updated_at: '2026-10-04T17:19:22.022816+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  defect_class:
  - instrument-blind
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-1f10286b
---

Filed by `repro-console:repro-joyfulculinarycreations-com#9`. Bundle: `storage/references/joyfulculinarycreations.com/index`. Companion to REQ-385.

**defect_class:** `instrument-blind`. The gate reported a structural failure and named it as 92 escapes, while the one probe that measured a content loss (`sampleFidelity`) is absent from `gate.json` entirely. For this content loss the report is not wrong; it is empty.

## 1. gate.json drops the sample-fidelity probe, so content missing at a captured width is never named

- `1c l1-gate --ref storage/references/joyfulculinarycreations.com/index --json` on the same retained l1.json reports `sampleFidelity: {pass: false, tolerancePx: 2, maxDelta: 14.61, residuals: 8, unmatched: 23}`. The unmatched entries include **all six visible runs of the testimonial section at both 320 and 375** ("What people are saying", the visible testimonial, "Dan H.", "Parent / CFO", both arrows). They are `display: none` in the served CSS (REQ-385 issue 1).
- `storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-9/diff/gate.json` contains the string `sampleFidelity` **0 times**. Its `layout.findings` holds 92 entries, all `kind: "escape"`, `probe: "contentRobustness"`. The diagnosis says the failure is "92 backing surface(s) have left the content they back". The next step says "Make each escaping surface size itself…".
- Cause: `tools/generate/src/cli/gate-core.ts:1118-1121` builds `collisions` from `onSample` plus `escapesOnly(offSample)` plus `escapesOnly(contentRobustness)`. `sampleFidelity`'s `unmatched` and `residuals` never reach `layout.findings` or the diagnosis (`gate-core.ts:1162-1250`). The only trace of the probe is `l1Pass: false`.
- Consequence: the round's worst defect by the brief's own ordering (content completeness first) is a full section missing on phones. That defect reached this round only because I ran `l1-gate` by hand. values-diff (1280 only) and the perceptual diff (1280 only) cannot see it by construction.

**Proposed change.** Carry `sampleFidelity.unmatched` (and residuals over tolerance) into `gate.json` as their own finding kind, for example `kind: "missing-at-width"` with the text and width. Name them **first** in the structural diagnosis, ahead of overlaps and escapes, with the sentence "N run(s) the reference paints at width W are not drawn". Count unmatched entries into the round's `unmeasured` population too: a run that paired with nothing is BUG-106's population, and today it is reported as `unmeasured 0`.

**This will raise the count of reported findings** for this bundle by 23 (12 of them at 320/375), because it makes currently unreported failures visible.

## 2. l1-gate reports the flow recovery only as counts, so nobody can tell why it is not served

`recovery: {served: false, servedFindings: 892, recoveredFindings: 1642, fidelityMaxDeltaPx: 14.61, fidelityResiduals: 35}` (retained) and `{…recoveredFindings: 1205, fidelityMaxDeltaPx: 80.02, fidelityResiduals: 215}` (HEAD fold, refolded copy). The recovered document's own findings and residuals are not in the JSON. This is why REQ-385 issue 3 (the 92 escapes) had to be filed `cannot-tell`.

**Proposed change.** Emit `recovery.findings` / `recovery.residuals` (or at least per-surface counts) under `--json`.

## How to see it

```
cd /Users/martin/lagrangefoundry/1stcontact
grep -c sampleFidelity storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-9/diff/gate.json
./bin/1c l1-gate --ref storage/references/joyfulculinarycreations.com/index --json | python3 -c "import json,sys; g=json.load(sys.stdin); s=g['sampleFidelity']; print(s['pass'], len(s['unmatched']), sorted(g['recovery']))"
```
- **Wrong (now):** `0`; then `False 23 ['fidelityMaxDeltaPx', 'fidelityResiduals', 'promoted', 'recoveredFindings', 'served', 'servedFindings']`.
- **Right:** a re-gate (`CHROMIUM_LAUNCH_ARGS=--single-process ./bin/1c gate repro-joyfulculinarycreations-com --ref storage/references/joyfulculinarycreations.com/index --sandbox --out /tmp/g`) whose `gate.json` names the 23 unmatched runs and leads its diagnosis with the 12 at 320/375, and an l1-gate JSON whose `recovery` carries its findings.