---
uid: report-9ddac478
id: REPORT-6902
type: report
title: 'Reconciliation Review: commits (BUNDLE-32)'
created_by: xgd
created_at: '2026-10-30T19:55:55.910119+00:00'
updated_at: '2026-10-30T19:55:55.910119+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-5607a08d
  anchor_uid: bundle-5607a08d
  overrides_audited: 3
  trust_boundary_overrides: 1
  override_misjudged:
  - report_uid: report-be7d1be4
    rule: code_frozen
    batch_index: '0'
    reason: 'item 5 (trust boundary): trust boundary change without a test — contentBlocksFrom
      (fidelity-core.ts, applied in host-core.ts box.run wrapper) slices the JSON
      array out of the Toolbox''s rendered text and returns it, discarding the untrusted-content
      frame the Toolbox wraps around every `provenance: untrusted` result (fidelity-surface.json:186
      screenshot). Marking is therefore NOT preserved on the screenshot path to the
      model, and no test asserts marking on that path (only the manual-wide ''untrusted''
      mention, looking-surface.test.ts:387). The report also lacks computed trust_boundary_touched
      / files_touched / conformance_verdict fields although planner_trust_boundary
      is true.'
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: 
**Anchor**: bundle-5607a08d
**Stories Reviewed**: 11 (the 9 named + story-b3de4571 STORY-107 and story-325da65f STORY-145, targeted by plan items 1 and 3)

3 overrides audited, 1 touched a trust boundary.

## Behavior Inventory

~45 behaviours across 7 features: asset store without registry (BUG-44/45), placement (BUG-47), Library row + wording (REQ-176), fidelity surface see/compare/capture (REQ-157), consultant role (REQ-174), kb account discovery (BUG-49), `1c serve` removed (REQ-177).

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | No asset registry; legacy key ignored; listing = store bytes | Covered | story-c46abfa6 | AC-2009, AC-1018 (AC-1019 superseded correctly) |
| 2 | get_asset by id/handle, listing shape, NOT_FOUND | Covered | story-c46abfa6 | AC-2010 |
| 3 | add/write/remove bytes-only + journal; conflict/force rules | Covered | story-c46abfa6 | AC-2011; add-has-no-replace recorded as a Reconciliation Decision |
| 4 | No alt on assets; manual tells truth; absence note | Covered | story-c46abfa6 | AC-2012 |
| 5 | write_image never stands in for a supplied file (BUG-45 kept) | **Gap** | story-b3de4571 | AC-2014 is `pending`, no test_UAT_AC2014_* exists; only an FC test covers it |
| 6 | placed_on recorded on landed promotion only; union; no site field on ingest | Covered | story-aacb7060 | AC-2015, AC-2016 |
| 7 | Promotion journals; rights-gate refusal journals nothing | Partial | story-aacb7060 | AC-2017 gate half never reaches the gate (see evidence) |
| 8 | Pill / Used on / filter read placed_on and agree | Covered | story-1500b111 | AC-1715, AC-1716, AC-2018 |
| 9 | Type icon, no kind pill, one-line row | Covered | story-1500b111 | AC-2019, AC-2020 (weak) |
| 10 | Purpose / Site asset / Background information from one constant | **Gap** | story-325da65f | AC-2021 is `pending`, no UAT; role filter, detail role and unknown-role raw display untested |
| 11 | 'Live on the site' NOT implemented | Covered (correctly absent) | story-1500b111 | Technical Context says declined |
| 12 | Second surface, picture vocabulary, rev-<id> channel, bound to site | Covered | story-58b2cec4 | |
| 13 | screenshot image block reaches backend; downsample; SSE strip | Covered | story-58b2cec4 | AC-2031, AC-2034 load-bearing and sound |
| 14 | No operation changes a site | Partial | story-58b2cec4 | AC-2035 omits check_fidelity |
| 15 | compare == `1c diff`; check_fidelity == `1c gate` | Partial | story-47fb84e6 | Equality to CLI never driven (see evidence) |
| 16 | capture_site refused for private space, over-large, redirect loops; journalled | **Divergence (disclosed, mis-titled)** | story-31204812 | See below |
| 17 | Consultant rename, preamble, legacy alias, straggler guard | Covered | story-a58a0974 | per-turn reminder has no AC (REQ-174 names it explicitly) |
| 18 | BUG-49 discovery cases | Covered | story-c4f329d3 | AC-1306, AC-2058, AC-2059 sufficient |
| 19 | `1c serve` gone; help offers builder; startServe still binds | Partial | story-e15a19ef | help still names `serve` (index.ts:314, :480); flagged in story as a code issue |

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Site Asset Store | story-c46abfa6, story-b3de4571 | ✓ (updated_by bundle) |
| 2. Promotion & placement | story-aacb7060, story-1500b111 | ✓ |
| 3. Library row & wording | story-1500b111, story-325da65f | ✓ |
| 4. Fidelity: see | story-58b2cec4 | ✓ |
| 5. Fidelity: compare & judge | story-47fb84e6 | ✓ |
| 6. Fidelity: capture | story-31204812 | ✓ |
| 7. Consultant role | story-a58a0974 | ✓ |
| 8. KB account discovery | story-c4f329d3 | ✓ |
| 9. 1c serve removed | story-e15a19ef | ✓ |

## Supersession Check (Step 4c)

PASS. AC-1019 is `superseded` with superseded_by_uid bundle-5607a08d. AC-1306, AC-1017, AC-1051, AC-1018/1020/1022/1104/1105/1711/1715/1716/1725 were rewritten in place and no longer pin retracted behaviour. Minor: AC-1717 still says 'which site it is used on' (singular), but AC-2018 covers the plural.

## Mode Override Audit

- **report-c89e2900** (code_frozen, story-a58a0974): PASS on all items. Only host.ts and system-knowledge.ts were changed in production, both named. The host.ts edit is only logDir→junctions. The system-knowledge.ts edit is comment-only. trust_boundary_touched is false and the conformance verdict is pass. Note: tests/reconciliation-assistant-consultant-role.test.ts was changed outside `files`. That is a test file, outside code_frozen's scope. It now accepts `system` as a block array, which is not a material weakening.
- **report-be7d1be4** (code_frozen, story-58b2cec4): **MISJUDGED, item 5.** Commit 13aa65737c touched only named production files (item 1 ok) and stayed within the stated scope (items 3, 4, 6 ok; no BUG-256, adopt or lowDetail ported). But `contentBlocksFrom` returns the block array carved out of the Toolbox's rendered text. That drops the untrusted-content frame the Toolbox puts on every `provenance: untrusted` result. So a screenshot of an arbitrary URL, which is third-party content, reaches the model unmarked. No test asserts per-result marking on this path. The report is also missing the computed trust_boundary_touched, files_touched and conformance fields, so the in-loop audit appears not to have run.
- **report-c8fd0348** (aligned_to_tip, story-31204812): mechanical items pass.
  - Item 1: tip evidence exists at reconcile-src-BUNDLE-32 and is production code. bundle.ts:95-99 has a non-tolerant readCapture; cf-driver.ts:231-232 and :280 checked.
  - Item 2: no later in-window intent requires the retired behaviour, and the erratum comment COMMENT-5803 is present on REQ-157.
  - Item 3: the only production changes since 618bfdc1b7 belong to the separate c89e2900 grant. The six ACs were rewritten in place and stay `active`.
  - The narrowing itself is an intent-fidelity problem; see below.

## Gaps for the fix loop

### G1 — REQ-157 AC6 narrowed below intent; AC titles contradict bodies (story-31204812)

REQ-157 AC6 says capture_site is *refused* for private address space, over-large responses and redirect loops, on both hosts. As now written:
- An over-large response trips the guard but a bundle is still returned (AC-2050).
- The redirect cap counts distinct origins, and the capture still succeeds (AC-2049).
- On Node there is no byte cap, no loop detection and no redirect-hop guard.
- The 60 s cap is declared but never applied.

The story's 'Known gaps' section discloses these, so this is not silent absorption. Three things remain to fix:
- (a) The titles of AC-2046 ('refuses … with NOT_FOUND'), AC-2048 ('in both hosts'), AC-2049 ('refused as a redirect loop') and AC-2050 ('In both hosts … abandoned and refused … offers no reference') still promise the retired behaviour. Rewrite them to match their bodies, and rename the UATs that carry stale names (test_UAT_AC2049_redirect_cap_counts_hops_not_subresource_origins, test_UAT_AC2050_..._in_both_hosts).
- (b) Record the divergence from REQ-157 AC6 under `## Reconciliation Decisions` as an intent–code conflict, and file or link a follow-up fix ticket. The Known gaps call themselves 'candidate for a fix ticket', but none exists.
- (c) AC-2051 asserts the audit record only for a pre-flight refusal and a success. Add an assertion that mid-capture refusals (in `refusals`) reach the audit record with their URL, as AC6's 'each refusal is journalled' requires.

### G2 — Pending ACs with no UAT
- AC-2014 (story-b3de4571, write_image no-stand-in): status `pending`, no test_UAT_AC2014_*.
- AC-2021 (story-325da65f, one shared label constant feeding overlay, role pill, role filter, detail and manual): status `pending`, no test_UAT_AC2021_*.

Activate both and add UATs. For AC-2021, cover the role filter options, the role in the detail record, and the raw display of an unknown role.

### G3 — Evidence insufficient (Step 5b)
- **AC-2036** (story-47fb84e6): the oracle is the test re-composing computeDiff(cropRaster(...)) (test_reconciliation_fidelity_compare_and_judge.test.ts:209-212), not the real `1c diff` path (perceptual.ts:242-245, which applies opts.tuning). Drive `1c diff` for the equivalent invocation and compare verdicts.
- **AC-2039**: never runs `1c gate` (gate.ts cmdGate) on the same bundle. It only checks the verdict is in the five-value set (:295-315). Assert verdict equality with `1c gate`.
- **AC-2040**: calls reconcileGates directly (:345-349). Drive each verdict through check_fidelity. The whole file also calls fidelityOperations directly rather than the composed Toolbox (:200 onward).
- **AC-2035** (story-58b2cec4): check_fidelity is never run (:818-827), and the compare result is not checked to be a non-error. Run all six operations and assert each succeeded.
- **AC-2024**: only the Node no-origin branch is driven (:394). Add the Worker-without-BROWSER branch.
- **AC-2056** (story-a58a0974): 'nothing written under the legacy name' is checked only on file names (site-<slug>.md), so it can never fail (:236-238). Re-read the archive header after the further turn and assert role === consultant or unchanged legacy, as the AC intends.
- **AC-2064** (story-e15a19ef): the help check only rejects lines starting `1c serve` (req177-discontinue-raw-server.test.ts:75), so it passes while USAGE still lists `serve` at index.ts:314 and :480. 'Binds no port' is not asserted. Tighten the test so it would catch the straggler. The help text itself is a code divergence the story already flags, and reconciliation cannot fix code.
- **AC-1022** (story-c46abfa6): only `--json` is driven (site-asset-listing.test.ts:269). Assert that the human output has no `(unregistered)` marker, prints one line per asset, and says 'no assets' for an empty site.
- **AC-1104** (story-b3de4571): does not assert the site definition is byte-identical after write_image, and does not assert the listing entry has no alt or registered field (beyond-l1-authoring.test.ts:744).
- **AC-2017** (story-aacb7060): the 'rights-gate refusal writes no journal entry' half uses role: 'reference', which returns at router.ts:494 before promoteToSiteAsset runs (placement.workers.test.ts:251). Use a site-role, non-republishable material so the gate is actually reached.
- **AC-1725** (story-325da65f): compares labels against UPLOAD_PROMPT/UPLOAD_AREAS themselves (upload-overlay.test.ts:131). Pin the literals 'Purpose', 'Site asset' and 'Background information' and the area order.
- Lesser, also to fix:
  - AC-1018 has no alt or declared-field and no legacy-key assertion in its own UAT.
  - AC-2020: `rule()` reads only the first selector block, and the DOM order icon→title→pills is not asserted.
  - AC-2054 does not assert that 'user' is absent from the preamble.
  - AC-2019: kind-pill absence is checked by one class name only.

### G4 — Intent behaviour with no AC
- REQ-174 explicitly says the per-turn reminder changes register ('client', no old word). No AC covers consultantReminder, and AC-2057 skips roles.ts, so a regression would pass. Add an AC and a UAT reading the reminder the turn actually carries.

### G5 — Stale story text
- story-58b2cec4 Technical Context still says 'Code issue flagged: the Worker never composes the surface'. That was fixed by 13aa65737c, and AC-2025 passes. Update it.

## Judgment Calls
- AC-2012 and the REQ-176 manual test assert on the shipped l1-surface.json. That declaration is the artifact the model receives, so it is accepted as behavioural evidence for declaration-level ACs, as BUG-45 and BUG-44 state.
- The AC-2057 working-tree walk is the AC's own claim (a straggler guard), so it is accepted.
- The REQ-177 help straggler and the l1-surface.json repeating the label literal rather than reading the constant are both disclosed in their stories' Technical Context. They are not silent absorption.
- story-145's DOM suites run under describe.skipIf(!WEBUI_INSTALLED). They ran here with 0 skipped, so this is not a finding.
- report-97ab550b ran only the javascript-vitest suite. Its lint step took about 0 s and the build skipped type-check ('No tsconfig.json'). This is noted as context, not a story-coverage finding.

## Verdict

FAIL. All 9 plan items produced stories, and intent is mostly represented faithfully: BUG-44 over BUG-45 and the declined 'Live on the site' are handled correctly. The review fails on four counts:
- (1) The report-be7d1be4 override is misjudged on the trust-boundary item: the screenshot path drops the untrusted-content frame, with no test.
- (2) Two intent behaviours rest on `pending` ACs with no UAT (AC-2014, AC-2021).
- (3) Eleven active ACs have UATs that a broken implementation could pass. The worst cases are AC-2036, AC-2039 and AC-2040, which never compare against the real `1c diff` / `1c gate`.
- (4) The REQ-157 AC6 narrowing is disclosed, but four AC titles still promise refusal on both hosts and no follow-up ticket exists.
