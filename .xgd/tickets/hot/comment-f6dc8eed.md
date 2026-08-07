---
uid: comment-f6dc8eed
id: COMMENT-825
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T23:04:01.359167+00:00'
updated_at: '2026-08-07T23:04:01.359167+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f8f844e2
  kind: note
---

Report schema verified — matches the shape of prior reports in this chain (top-level result carried as report status `fail`, body carries `**Result**: FAIL`).

## Assessment complete — **FAIL**

**REPORT-1649** (`report-f8f844e2`) — capability-aa030c83, level=uat: **4 violations, 4 warnings, 0 needs_review**.

### What I found

Coverage is structurally complete: all 48 ACs across the five stories have a `test_UAT_AC<n>_*` test. No AC is testless, and no two tests are redundant. Every finding is about **depth of evidence**, not absence.

**Three violations are carried forward unrepaired** from the last uat-level pass (`report-a85d40c2`, 2026-08-05). I confirmed all three test files are untouched since their original generation commit:

1. **AC-657** — the test never invokes `values-diff`; it calls `withCleanStdout`, writes the JSON document itself (`:77`), then parses what it just wrote. Re-verified: no test anywhere drives the values-diff success emit at `index.ts:780-793`.
2. **AC-643** — passes `actualImagePath`, taking `perceptual.ts:483`'s branch out of play. The sole `--size`→`cmdShot` forwarding (`:493`) is never executed.
3. **AC-720** — still only the pure `subRenderOptions` seam; the file's docstring still concedes the end-to-end crop-pair check is manual.

**One violation is new** — AC-815 (authored 2026-08-06, after the last uat pass). Its Verification names four assertions; two are unexercised. The fixture `bug27-nested-backdrop.html` contains no `overflow` declaration at all, so the clip-vs-extend clamp at `extract.ts:497-499` — whose own comment names the missing fixture verbatim — never runs. "A conventional band's box is unchanged from its own border box" is asserted nowhere.

### The pattern worth acting on

Findings 1, 2, 5 and 6 are one defect shape: four ACs state a property of a *command* but are tested one layer below it. In each case the implementing line can be deleted with the whole capability still green. All four are fixable with harnesses already in the repo (`runCli` at `…responsive-diff.test.ts:74-90`; the fake `driverFactory` at `…size-aware-diff.test.ts:312`) — one batch clears two violations and two warnings.

Two things I flagged for sequencing rather than filing twice: AC-637's test/AC divergence is the **AC** being stale under REQ-114, already open at ac level; and both upper layers (`report-f150ba1e` story, `report-cb7ea283` ac) failed this cycle and remain unrepaired, so an editor should work story → ac → uat rather than treating this report in isolation.

One process observation, recorded in the report: findings 1–3 have now survived two consecutive uat-level passes untouched. If the fix loop isn't reaching those three files, that's worth checking before a third pass files them again.
