---
uid: report-84f2f9bc
id: REPORT-6908
type: report
title: 'Reconciliation Review: commits (BUNDLE-32)'
created_by: xgd
created_at: '2026-10-30T20:28:02.135451+00:00'
updated_at: '2026-10-30T20:28:02.135451+00:00'
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
    reason: 'item 5 (trust boundary): marking on the screenshot path is preserved
      at HEAD only by an ungranted fidelity-core.ts edit in 0a0f97f216 (fix_reconciliation_review),
      made after code_frozen was denied for this batch (report-1312a88f) and not present
      at the reference state; the trust-boundary preservation therefore has no audited
      grant'
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: 
**Anchor**: bundle-5607a08d (BUNDLE-32: BUG-45, BUG-44, BUG-47, REQ-157, REQ-176, REQ-174, BUG-49, REQ-177)
**Stories Reviewed**: 11 (the 9 named, plus story-b3de4571 STORY-107 and story-325da65f STORY-145, which plan items 1 and 3 target)

3 overrides audited, 1 touched a trust boundary.

This is a re-review after the fix loop for report-9ddac478 (REPORT-6902), at HEAD c6f2473def. The latest scoped quality run, report-8737a96a at fbdaca77b1, passed: 230 tests, 0 failed. Its 177 ACs include every active AC on the 11 stories, as well as AC-2014, AC-2021, AC-2066 and AC-2067.

## Summary

The story-level work from the previous review is resolved:

- **G1**: the AC-2046/2048/2049/2050 titles match the code. The intent–code conflict with REQ-157 AC6 is recorded under Reconciliation Decisions, follow-up BUG-315 (bug-84072362) is filed, and AC-2051 gained an assertion for a mid-capture refusal.
- **G2**: AC-2014 and AC-2021 are active and have UATs.
- **G3**: the UATs for AC-2036, AC-2039 and AC-2040 now drive the real `1c diff --json` / `1c gate --json` through `cli.run`. The other UATs flagged as weak were tightened.
- **G4**: AC-2066 now covers the wording of the per-turn reminder.
- **G5**: the stale note on story-58b2cec4 is resolved.

The review still fails. The fix step, `fix_reconciliation_review` in commit 0a0f97f216, changed **production code** in a code-frozen reconcile run, and no mode_override grants either change. One of them re-does the very batch whose `code_frozen` grant the previous review had denied (report-1312a88f).

## F1 — Production code changed with no grant (hard)

Commit 0a0f97f216 ("Workflow fix_reconciliation_review completed: done") changed two production files. No `mode_override` report exists for either change; the only mode_override reports on this anchor are report-be7d1be4 and report-c89e2900.

1. **`tools/generate/src/cli/ai/fidelity-core.ts`**, `contentBlocksFrom` plus a new `framed()` helper, about 20 lines added:
   - The Toolbox wraps untrusted results in a frame. This change copies the text before and after the recovered JSON array (the untrusted frame) onto the first and last text blocks.
   - report-1312a88f had explicitly denied this batch (story-58b2cec4 batch 0, `code_frozen`): "it will not be granted again there, so the next plan decides that batch at the next rung".
   - The change is also **new behaviour, not a port**. The reference state `reconcile-src-BUNDLE-32` still has the unframed version: fidelity-core.ts:185-198 returns `parsed` bare, and host-core.ts:2656 returns `contentBlocksFrom(payload) ?? payload`.
   - The new AC-2067 (acceptance_criterion-827e8986), its UAT `test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame` (reconciliation-assistant-looking-surface.test.ts:817), and the note on story-58b2cec4 all pin behaviour that exists only because of this ungranted edit.
2. **`tools/generate/src/cli/index.ts`**:
   - Lines 314 and 480-481: `serve` is removed from the `1c repro` help line and from the list of offline verbs that are never gated.
   - REQ-177 asks for this, and the reference state has it, so this one is a legitimate port. It still went through no grant.

The intent behind both edits may be sound:

- REQ-157 says "a captured page's text must never be able to read as an instruction".
- REQ-177 says `1c help` should not advertise a raw server.

But in a reconcile run, runtime code changes only through a planner grant that leaves an auditable `mode_override` report: files, rung or tip_evidence, the computed trust-boundary fields, and the conformance verdict. The first edit is in the trust boundary and was made outside that process.

**Remediation (for fix_reconciliation_review / test_fix planner):**

- (a) Revert the production hunks of 0a0f97f216 in `fidelity-core.ts` and `cli/index.ts`, or have the test_fix planner decide each one at its rung with a recorded `mode_override`:
  - **index.ts**: this is a port. Use rung 2 with tip evidence from the reference state's USAGE.
  - **fidelity-core.ts framing**: the reference state lacks it, so it can only be granted on rung 1 (REQ-157 intent) or rung 3 (AC-2067's test stands). The grant needs the computed `trust_boundary_touched`, `files_touched` and `conformance_verdict`.
- (b) If the framing is not granted:
  - Retire or rewrite AC-2067 to the running code under an `aligned_to_tip`-style ruling.
  - Record the unframed screenshot path as an intent–code conflict with REQ-157 under story-58b2cec4 `## Reconciliation Decisions` / Known gaps.
  - Track it in a follow-up bug, as BUG-315 does for capture_site.
  - Remove the story-58b2cec4 note claiming the frame is kept.
- (c) If the help-text edit is reverted, the story-e15a19ef Technical Context must again record the leftover `serve` lines. The tightened AC-2064 help assertion must then fail, or be aligned to the code.

## Behavior Inventory

About 47 behaviours across 7 features:

- the asset store without a registry (BUG-44/45)
- placement (BUG-47)
- the Library row and wording (REQ-176)
- the fidelity surface: see, compare and capture (REQ-157)
- the consultant role (REQ-174)
- kb account discovery (BUG-49)
- removal of `1c serve` (REQ-177)

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | No asset registry; legacy key ignored; listing is the store's bytes | Covered | story-c46abfa6 | AC-2009, AC-1018; AC-1019 superseded_by bundle-5607a08d |
| 2 | get_asset by id or handle, in the listing's shape; NOT_FOUND | Covered | story-c46abfa6 | AC-2010 |
| 3 | add, write and remove change bytes only and are journalled; conflict and force rules | Covered | story-c46abfa6 | AC-2011; add has no replace option (Reconciliation Decision) |
| 4 | No alt on assets; manual tells the truth; absence note points at the site-asset area | Covered | story-c46abfa6 | AC-2012; AC-1022 human output now asserted |
| 5 | write_image is never a stand-in for a supplied file | Covered | story-b3de4571 | AC-2014 active with a UAT; AC-1104 asserts site.json byte-identical |
| 6 | placed_on written only when a promotion lands; union; ingest writes no site field | Covered | story-aacb7060 | AC-2015, AC-2016 |
| 7 | Promotion journals; refusal at the rights gate journals nothing | Covered | story-aacb7060 | AC-2017 refusal half now reaches the gate |
| 8 | Pill, Used on and filter read placed_on and agree, across a site switch | Covered | story-1500b111 | AC-1715, AC-1716, AC-2018; AC-1717 pluralised |
| 9 | Type icon, no kind pill, one-line row | Covered | story-1500b111 | AC-2019, AC-2020 (all CSS blocks read, DOM order asserted) |
| 10 | Purpose / Site asset / Background information from one constant | Covered | story-325da65f | AC-1725 literals pinned; AC-2021 active with a UAT |
| 11 | "Live on the site" not implemented | Covered (correctly absent) | story-1500b111 | |
| 12 | Second surface, picture vocabulary, rev-<id> channel, bound to one site, grant narrowed | Covered | story-58b2cec4 | AC-2022 to AC-2030; AC-2024 now covers the Worker without BROWSER |
| 13 | Screenshot image block reaches the backend; 1024px box downsample; byte ceiling; SSE strip | Covered | story-58b2cec4 | AC-2031 to AC-2034 |
| 14 | Screenshot reaches the model inside the untrusted frame | **Covered only by an ungranted code edit** | story-58b2cec4 | AC-2067; see F1 |
| 15 | No looking operation changes the site | Covered | story-58b2cec4 | AC-2035 runs all six operations and requires each to succeed |
| 16 | compare equals `1c diff`; common-rectangle crop; viewport follows the actual side; labelled fallback | Covered | story-47fb84e6 | AC-2036 to AC-2038, AC-2041, AC-2042; real CLI oracle |
| 17 | check_fidelity equals `1c gate`; five verdicts, each with its next step | Covered | story-47fb84e6 | AC-2039, AC-2040, AC-2043 |
| 18 | capture_site, list/describe, egress guard, pre-flight, REFUSED and audit, untrusted | Covered (divergence flagged) | story-31204812 | AC-2044 to AC-2053; conflict with REQ-157 AC6 recorded; BUG-315 |
| 19 | Consultant role: preamble, reminder, purpose, grant key; legacy alias on read; straggler guard | Covered | story-a58a0974 | AC-1051, AC-2054 to AC-2057, AC-2066 |
| 20 | kb account discovery and its diagnoses | Covered | story-c4f329d3 | AC-1306, AC-2058, AC-2059 |
| 21 | `1c serve` removed; help offers the builder; startServe fixture kept | Covered | story-e15a19ef | AC-1017, AC-2064, AC-2065; help text fixed by the ungranted edit (F1) |

## Ungrounded Stories

None. Every story describes behaviour that the intent or the code supports. Item 14 is grounded in REQ-157's intent, but at this commit the code behaviour exists only through F1.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Site Asset Store (registry removed) | story-c46abfa6, story-b3de4571 | ✓ |
| 2. Promotion & Library placement | story-aacb7060, story-1500b111 | ✓ |
| 3. Library row & overlay wording | story-1500b111, story-325da65f | ✓ |
| 4. Fidelity surface: see | story-58b2cec4 | ✓ |
| 5. Fidelity surface: compare & judge | story-47fb84e6 | ✓ |
| 6. Fidelity surface: capture + egress guard | story-31204812 | ✓ |
| 7. Consultant role | story-a58a0974 | ✓ |
| 8. KB account discovery | story-c4f329d3 | ✓ |
| 9. 1c serve removed | story-e15a19ef | ✓ |

## Supersession Check (Step 4c)

PASS. AC-1019 is `superseded`, with superseded_by_uid bundle-5607a08d. The other ACs touched by the plan were rewritten in place and no longer pin retracted behaviour: AC-1018/1020/1022/1104/1105/1711/1715/1716/1717/1725/1017/1051/1306.

## Mode Override Audit

3 overrides audited, 1 touched a trust boundary.

- **report-c89e2900** (code_frozen, story-a58a0974): PASS.
  - Items 1, 4 and 6: production edits are limited to the named host.ts change (logDir to junctions) and a comment-only change in system-knowledge.ts. Both port the reference state.
  - Item 3: the change is consistent with REQ-174 and AC-2056/AC-2057.
  - Item 2: passes, since the quality run is green.
  - Item 5: trust_boundary_touched is false, and conformance_verdict is pass.
- **report-be7d1be4** (code_frozen, story-58b2cec4): **still misjudged, item 5.**
  - The granted diff (13aa65737c) carved the image-block array out of the Toolbox's rendered text and dropped the untrusted frame.
  - The rule was then denied for this batch (report-1312a88f).
  - At HEAD the frame is restored and asserted by the AC-2067 UAT. However, that preservation comes from the ungranted fidelity-core.ts edit in 0a0f97f216 (F1), not from any grant. The trust-boundary item therefore cannot be confirmed through an audited path.
  - Items 1, 3, 4 and 6 still pass for the granted diff.
- **report-c8fd0348** (aligned_to_tip, story-31204812): PASS.
  - Item 1: the tip evidence exists at `reconcile-src-BUNDLE-32` and is production code. bundle.ts:95-99 has a non-tolerant readCapture; cf-driver.ts:231-232 and :280 were re-checked.
  - Item 2: no later in-window intent requires the retired behaviour. The erratum comment COMMENT-5803 (comment-989911e3) is on REQ-157 (request-3f8737f2).
  - Item 3: the six ACs (2045 to 2050) were rewritten in place and are still `active`; none was deleted. The production edits since the ruling touch no capture code; they are the separate F1 matter.
  - The narrowing below REQ-157 AC6 is now recorded as an intent–code conflict, with follow-up BUG-315.

## Judgment Calls

- Declaration-level ACs are accepted as behavioural evidence for declaration-level claims, because the declaration is the artifact the model receives. These are AC-2012, AC-2014 and the REQ-176 manual reference, all asserted on the shipped l1-surface.json and fidelity-surface.json.
- The AC-2057 working-tree walk is accepted because it is the AC's own claim (a straggler guard).
- The REQ-157 AC6 narrowing on story-31204812 is now properly flagged:
  - Known gaps 1-7 and an intent–code conflict entry are under Reconciliation Decisions.
  - BUG-315 is filed.
  - The AC titles no longer promise refusal on both hosts.
  - It is not silent absorption.
- The quality runs report a lint duration of about 0 s, and the build is skipped ("No tsconfig.json"). This is noted as context only, not as a story-coverage finding.
- F1 is treated as a hard failure, not a nit. The previous review had explicitly denied `code_frozen` for that batch, and the reference state does not contain the framing behaviour. Accepting the edit would let a review fixer write unaudited trust-boundary code into a reconcile branch.

## Verdict

FAIL.

The stories now represent the intent faithfully and completely:

- All nine plan items produced stories.
- The BUG-44-over-BUG-45 supersession and the REQ-157 AC6 divergence are recorded rather than absorbed.
- Every active AC has a passing UAT that a broken implementation would fail.

The run fails on one item. fix_reconciliation_review changed production code with no mode_override grant, contradicting the explicit denial in report-1312a88f:

- `tools/generate/src/cli/ai/fidelity-core.ts`, the `contentBlocksFrom` untrusted framing, which is new behaviour absent from the reference state
- `tools/generate/src/cli/index.ts`, removal of the `serve` help leftovers

As a result, report-be7d1be4 stays misjudged on item 5. Either revert those hunks, or route each one through the test_fix planner with a recorded override. If the framing is not granted, align AC-2067 and story-58b2cec4 to the running code and record the conflict with REQ-157, plus a follow-up bug.
