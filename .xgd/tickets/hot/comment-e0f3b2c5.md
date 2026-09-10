---
uid: comment-e0f3b2c5
id: COMMENT-2513
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T10:18:42.299131+00:00'
updated_at: '2026-09-10T10:18:42.299131+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-718c7ce2
  kind: note
---

**REPORT-3714 (`report-718c7ce2`) — FAIL: 5 violations, 1 warning, 0 needs_review.**

Schema verified: `result=fail`, `report_kind=capability_validation`, `subject_uid=capability-a994b8f3`, `level=uat`, integer counts.

## What I checked

All 36 active ACs on STORY-99 map to at least one `test_UAT_AC<n>_*` function (45 functions across 12 files), and every one drives real entry points — live `startBuilder` origin over HTTP, the Worker's own `fetch` under `workerd`/`unstable_dev`, real jsdom mounts over actually-installed `webui-*` components, real `1c` command functions. **No coverage voids and no structural-check-only ACs.** All five violations are consistency failures: a test left aimed at what its AC used to say.

## The violations

1. **AC-978** — the AC's rewritten enumeration names three artifact prefixes and requires a traversal probe for each; the `trees` table at `reconciliation-builder-workspace-origin.test.ts:202` has no `/framework/` group, so the "one refusal, every tree alike" assertion runs over a set missing the prefix carrying the edit client.
2. **AC-964** — the only unadmitted probe is one preview URL, status-only; no build artifact, no refusal-body comparison, despite the AC saying "Include the build artifact explicitly."
3. **AC-966** — the test performs the byte-equality-against-disk assertion the AC now explicitly forbids (assigning it to AC-1032) and none of the evidence it requires. It mounts nothing and, because the fixture is `cmdNew`'s starter, has no definition-derived marker — so it cannot distinguish a pane wired to a stand-in, which is the criterion's whole subject.
4. **AC-1033** — the BUG-37 half ("two workspaces never share a rendering", driven under one account id) has no test anywhere; `openWorkspace()` is called once per test throughout.
5. **AC-1401** — the read/write/render sweep runs through the local front door only; the AC requires the same requests through the deployed runtime and a comparison of the two.

Warning: AC-1036 repeats AC-978's three traversal probes, which its own Verification says not to.

Findings 1 and 2 were pre-announced in `report-c47daafa`'s "Carried Forward to the uat Cycle" table; I re-verified both against current test source rather than taking that claim. Findings 2, 3 and 5 are one cross-wiring pattern — AC-966's test is now AC-1032's assertion, AC-964's is largely AC-1401's, AC-1401's covers one door — so the report gives the editor a fix ordering to avoid producing a second round of overlap.

Read-only: no test was run, no ticket, test or source file modified.
