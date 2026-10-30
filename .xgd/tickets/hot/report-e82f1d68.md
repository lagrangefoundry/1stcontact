---
uid: report-e82f1d68
id: REPORT-6927
type: report
title: 'Reconciliation Review: commits (BUNDLE-32)'
created_by: xgd
created_at: '2026-10-30T21:30:12.839314+00:00'
updated_at: '2026-10-30T21:30:12.839314+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-5607a08d
  anchor_uid: bundle-5607a08d
  overrides_audited: 3
  trust_boundary_overrides: 2
  gaps:
  - id: G1
    kind: supersession_and_evidence
    ac_uid: acceptance_criterion-b2825a04
    ac_id: AC-1109
    story_uid: story-b3de4571
    authoring_intent: STORY-107 (beyond-L1 authoring, pre-bundle)
    superseding_intent: bundle-5607a08d (BUG-44 behaviour 5)
    summary: AC-1109 still claims the CLI writes a drawing 'with optional alt text'.
      BUG-44 removed alt from write_image/editAssetWrite and the CLI no longer reads
      --alt. The AC1109 UAT passes --alt, which is silently ignored, and asserts nothing
      about it.
  - id: G2
    kind: unflagged_code_divergence
    story_uid: story-b3de4571
    summary: 1c usage text (tools/generate/src/cli/index.ts:438) still advertises
      `1c asset write ... [--alt <t>]`, but the option is ignored since BUG-44. No
      story records this straggler.
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: 
**Anchor**: bundle-5607a08d (BUNDLE-32: BUG-45, BUG-44, BUG-47, REQ-157, REQ-176, REQ-174, BUG-49, REQ-177)
**Stories Reviewed**: 11. These are the 9 named stories plus story-b3de4571 (STORY-107) and story-325da65f (STORY-145), which plan items 1 and 3 target.

3 overrides audited, 2 touched a trust boundary.

This is a re-review after the fix loop for report-b5be9c7c (F1). HEAD is 437b50e5e0. The scoped quality report report-ae2eccaa (commit 601eba2d08) passes 230/230 with lint and build clean. That run includes every bundle AC (AC2009–AC2067) and the dependency ACs.

## What changed since report-b5be9c7c

- **Production code:** the net change since 328f474f91^ is one file, `tools/generate/src/cli/ai/fidelity-core.ts` (+25/-1). This is the `contentBlocksFrom` frame-keeping change granted by mode_override report-d58b23f8.
  - 328f474f91 (fix_reconciliation_review) also edited production code (`fidelity-core.ts`, `cli/index.ts`). 4ea164bc3b reverted it exactly, so no ungranted production change remains. Even so, a fix_reconciliation_review step should not touch production code; this is noted, not failed.
- **AC-2067 and its two UATs** now require the untrusted frame (opened before the image, closed after it), and they pass.
- **report-b5be9c7c F1 is resolved.** On the picture path, the `<<<untrusted>>>` marking now survives at HEAD, and AC-2067 asserts it.

## Mode Override Audit (OVERRIDE-AUDIT.md)

**report-be7d1be4** (code_frozen, story-58b2cec4: AC-2031/2034/2025)
- Item 1: pass. It touched `ai.ts`, `router.ts`, `host-core.ts` and `fidelity-core.ts`, all of which are named.
- Item 2: pass. The quality run is green.
- Items 3, 4 and 6: pass. The diff ports REQ-206's image-block recovery and the Worker composition (`sessionFidelity` → `shot.ts` `fidelityDeps`). REQ-157 demands both ("screenshot returns an image block", "Both hosts"). No BUG-256, adopt or lowDetail code came with it.
- Item 5: pass.
  - `trust_boundary_touched` was never computed on the report. Prior reviews computed it by hand as true.
  - Earlier this item failed because the granted `contentBlocksFrom` dropped the frame.
  - At HEAD the one path this change affects (`host-core.ts:521-526` → `contentBlocksFrom`) preserves the marking: leading and trailing frame text are carried onto the blocks, an unframed payload is returned unchanged, and a refusal (`null`) stays as text. If the payload has a stray `[` before the array, JSON parsing fails and the framed string is returned whole.
  - The tests that assert this are `test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame` and `test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame` (tests/reconciliation-assistant-looking-surface.test.ts).
  - Note: the report lacks `rung`, `files_touched` and `conformance_verdict`.

**report-c89e2900** (code_frozen, story-a58a0974: AC-2054..2057)
- Item 1: pass. `unnamed_files_touched` is empty. `tests/reconciliation-assistant-consultant-role.test.ts` is in `files_touched` but not in `files`; it is a test file, outside code_frozen's scope.
- Item 2: pass.
- Items 3, 4 and 6: pass.
  - `host.ts` swaps `logDir` for `junctions: lib.fileJunctions(...)`. This is the smallest change that removes the framework's `unknown option logDir` error that blocked every Node session (AC-2056).
  - `system-knowledge.ts` changes only a comment, to remove the old role word (AC-2057).
  - The comment ported from the tip cites out-of-window REQ-452, but no behaviour beyond the option rename came with it.
- Item 5: pass (`trust_boundary_touched` is false).
- Note: the report has no `rung` field.

**report-d58b23f8** (code_frozen rung 1, report-00553335: AC-2067)
- Items 1–4 and 6: pass. Only `fidelity-core.ts` was touched, which is what the planner instructions scoped. REQ-157's Grant and safety section demands the behaviour.
- Item 5: pass. `trust_boundary_touched` is true and `trust_boundary_mismatch` is false. Marking is preserved on every path, as analysed above, and the AC-2067 UATs assert it. `conformance_verdict` is pass.

**report-c8fd0348** (aligned_to_tip, story-31204812: AC-2045..2050)
- Item 1: pass. The tip evidence exists at `reconcile-src-BUNDLE-32` and is production code:
  - `bundle.ts:95-99` (`readCapture` throws)
  - `cf-driver.ts:231-232` (goto with no applied 60 s cap)
  - `playwright-driver.ts:101-110` (route-only guard)
  - `egress-guard.ts:228-275` (address classification)
- Item 2: pass. No later in-window intent (BUG-45/44/47, REQ-176/174, BUG-49, REQ-177) requires the retired clauses. The erratum comment comment-989911e3 is on REQ-157 (request-3f8737f2).
- Item 3: pass. No AC was retired outright. The six were rewritten and remain `active`. The production changes after the ruling belong to the separately audited grants above, not to this ruling.

No override is misjudged.

## Behavior Inventory

About 48 behaviours across 7 features:
- the asset store with no registry (BUG-44/45)
- placement (BUG-47)
- the Library row and wording (REQ-176)
- the fidelity surface: see, compare and judge, capture (REQ-157)
- the consultant role (REQ-174)
- kb account discovery (BUG-49)
- removal of `1c serve` (REQ-177)

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | No asset registry; the legacy key is ignored; the listing is the store's bytes | Covered | story-c46abfa6 | AC-2009, AC-1018; AC-1019 superseded_by bundle-5607a08d |
| 2 | get_asset by id or handle, in the listing's shape; NOT_FOUND | Covered | story-c46abfa6 | AC-2010 |
| 3 | add, write and rm change bytes only and are journalled; conflict and force rules | Covered | story-c46abfa6 | AC-2011; the add-has-no-replace decision is recorded |
| 4 | No alt on assets: the surface | Covered | story-c46abfa6 | AC-2012 |
| 4b | No alt on assets: the CLI `1c asset write` | **Contradicted** | story-b3de4571 | AC-1109 still claims "optional alt text" (G1); the usage text still advertises `--alt` (G2) |
| 5 | write_image is never a stand-in; a drawing is bytes only | Covered | story-b3de4571 | AC-2014, AC-1104, AC-1105 |
| 6 | placed_on is written only when a promotion lands; union; ingest and fetch write no site field | Covered | story-aacb7060 | AC-2015, AC-2016 |
| 7 | Promotion is journalled and renames on collision | Covered | story-aacb7060 | AC-2017, AC-1711 |
| 8 | The pill, the Used on row and the filter read placed_on and agree, including across a site switch | Covered | story-1500b111 | AC-1715, AC-1716, AC-2018 |
| 9 | Labelled type icon with fallback; no kind pill; one-line row; 13px title | Covered | story-1500b111 | AC-2019, AC-2020 |
| 10 | Purpose / Site asset / Background information from one constant, including the manual | Covered | story-325da65f | AC-1725, AC-2021 |
| 11 | "Live on the site" is not implemented | Correctly absent | story-1500b111 | Recorded as still open |
| 12 | Second surface, picture vocabulary, rev-<id> channel, bound to one site, grant narrowed, absent without a browser | Covered | story-58b2cec4 | AC-2022–AC-2030 |
| 13 | The image block reaches the backend inside the untrusted frame; 1024px box downsample; 3 MiB ceiling; SSE strip | Covered | story-58b2cec4 | AC-2031–AC-2034, AC-2067 |
| 14 | No looking operation changes the site | Covered | story-58b2cec4 | AC-2035 |
| 15 | compare equals `1c diff`; check_fidelity equals `1c gate` with five verdicts and next steps; crop, viewport and fallback | Covered | story-47fb84e6 | AC-2036–AC-2043 |
| 16 | capture_site, list and describe; preflight; seam guard; caps; REFUSED and audit; untrusted; read-only | Covered (divergences flagged) | story-31204812 | AC-2044–AC-2053; Known gaps 1–7 and an intent–code conflict entry; BUG-315 |
| 17 | Consultant role, advisory preamble, reminder, legacy read-only alias, straggler guard | Covered | story-a58a0974 | AC-1051, AC-2054–AC-2057, AC-2066 |
| 18 | Token-only account discovery; override; several, none and undiscoverable diagnoses; missing-token message | Covered | story-c4f329d3 | AC-1306, AC-2058, AC-2059 |
| 19 | `1c serve` removed; help offers the builder; the startServe fixture still binds | Covered (straggler flagged) | story-e15a19ef | AC-1017, AC-2064, AC-2065; leftover `serve` mentions in the help are recorded as a code issue |

## Ungrounded Stories

| Story | Claim | Issue |
|-------|-------|-------|
| story-b3de4571 (via AC-1109) | The command line writes a drawing "with optional alt text" | Neither the intent (BUG-44 behaviour 5: write_image no longer takes an alt) nor the code supports it. The CLI `write` arm passed `alt: str('alt')` on main and no longer does at HEAD (`tools/generate/src/cli/index.ts:1607-1612`). |

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Site Asset Store (registry removed) | story-c46abfa6, story-b3de4571 | ✓ (AC-2009–AC-2014; AC-1018/1020/1022/1104/1105 rewritten; AC-1019 superseded). AC-1109 was missed (G1). |
| 2. Promotion & Library placement | story-aacb7060, story-1500b111 | ✓ |
| 3. Library row & overlay wording | story-1500b111, story-325da65f | ✓ |
| 4. Fidelity surface: see | story-58b2cec4 | ✓ |
| 5. Fidelity surface: compare & judge | story-47fb84e6 | ✓ |
| 6. Fidelity surface: capture with egress guard | story-31204812 | ✓ |
| 7. Consultant role | story-a58a0974 | ✓ |
| 8. KB build account discovery | story-c4f329d3 | ✓ |
| 9. 1c serve removed | story-e15a19ef | ✓ |

## Gaps (for fix_reconciliation_review)

### G1: AC-1109 (acceptance_criterion-b2825a04, story-b3de4571 / STORY-107) pins alt text that BUG-44 retracted (Step 4c and Step 5b)

**The AC.** It reads: "writing a drawing by supplying its content with optional alt text and explicit replacement".

**The supersession is unambiguous.** BUG-44 (bundle-5607a08d), behaviour 5, says: "`add_asset` and `write_image` no longer take an `alt` … an image's alt text is the required `alt` on the L1 image node".
- The code follows it. `editAssetWrite` has no alt option. The CLI `case 'write'` passed `{ ...opts, force, alt: str('alt') }` on main and passes `{ ...opts, force }` at HEAD (`tools/generate/src/cli/index.ts:1607-1612`).
- STORY-107's own body (line 37) says the drawing "carries no alt text of its own".
- So the AC contradicts its own story, the intent and the code.

**The evidence is insufficient (Step 5b).**
- `test_UAT_AC1109_every_capability_is_reachable_from_the_command_line` (tests/reconciliation-beyond-l1-authoring.test.ts:1021-1033) passes `--alt 'The XGD wireframe mark'` and asserts only `ok` and `src`.
- It passes even though the alt behaviour the AC claims has been removed.

**Fix (matrix and tests only; code_frozen).**
1. Rewrite AC-1109 in place so the drawing clause reads "writing a drawing by supplying its content, with explicit replacement". Drop "optional alt text". Record the change under STORY-107's Reconciliation Decisions as following BUG-44 behaviour 5.
2. Update the AC1109 UAT to stop passing `--alt`. Optionally, assert that the written asset carries no `alt`, as AC-2009 does with `not.toHaveProperty('alt')`.
3. If the matrix convention for a retracted clause is supersession rather than an in-place rewrite, instead set AC-1109 `status: superseded` with `superseded_by_uid: bundle-5607a08d` and add a replacement AC without the alt clause.

### G2: a CLI help straggler is not recorded (story-b3de4571)

The `1c` USAGE text at `tools/generate/src/cli/index.ts:438` still advertises `1c asset write <slug> <name> --content <svg> [--alt <t>] [--force]`. The option is accepted and ignored. An operator reading the help would be surprised, and so would a developer reading only the stories.

Record it in STORY-107's Technical Context as a code issue, not encoded as an AC, the same way STORY-79 records the leftover `serve` mentions in the help. Removing the line needs a mode_override grant; do not edit it without one.

## Judgment Calls

- **story-31204812's capture divergences are flagged, not absorbed.** Examples are the Node redirect-hop gap, the unapplied 60 s cap, cap trips that return a reference, and seam refusals that are not journalled. Each appears under Known gaps and as a dated intent–code conflict, tracked by BUG-315. This satisfies "flagged rather than silently absorbed".
- **The REQ-177 help stragglers are flagged.** The "render/serve/shot" loop line and the `serve` entry in the offline-verb list are recorded in story-e15a19ef as a code issue. REQ-177's "What landed" claims the offline-verb entry was removed, but commit 9632cd6ae0 never removed it. A developer reading the story would not be surprised.
- **story-58b2cec4 has stale wording; non-blocking, fix in the same pass.**
  - Technical Context still says the AC-2067 UATs "fail by design" until the rung-1 grant lands.
  - Reconciliation Decisions says the change "is to be made".
  - The grant has landed (report-d58b23f8) and the UATs pass. Reword both to the past tense.
  - BUG-316 (bug-d9778adf) is still `draft` although its fix has landed; resolve it against report-d58b23f8.
- **Sibling ACs that use the old area labels are acceptable.** AC-1726, AC-1731 and AC-1733 italicise *put it on the site* and *just for you to read*. STORY-145 explains that these name the role's meaning, not the button text, and that they assert role values.
- **Source scans are acceptable.** The AC-2057 straggler guard scans the working tree. Here the scan is the behaviour ("no file carries the word"), not a stand-in for runtime behaviour. AC-2012, AC-2014 and AC-2021 assert on the declaration because their ACs say so explicitly; obedience is out of scope.
- **No internal mocking in the bundle UATs.** The doubles are the Cloudflare fetch (external), the Playwright module (external browser), a console.log capture and a `net.Server#listen` observer.
- **The global AC scan found no other AC pinning retracted behaviour.** It covered `registered`/registry, `site_slug`, `caretaker`, `1c serve`, `CLOUDFLARE_ACCOUNT_ID`, the old labels, the kind pill and `--alt`/alt text.

## Verdict

FAIL. Coverage gaps found:
- **G1:** AC-1109 (acceptance_criterion-b2825a04, STORY-107) still claims optional alt text on the CLI drawing write, which BUG-44 behaviour 5 retracted and the code no longer does. Its UAT passes `--alt` without asserting it.
- **G2:** the dead `[--alt <t>]` option in the `1c asset write` usage line is not recorded as a code issue in STORY-107.

Everything else holds:
- all plan items produced stories
- every override audit passes
- intent divergences elsewhere are flagged
- all other active ACs have passing behavioural UATs

The fix loop should address G1 and G2 (matrix and tests only) and tidy the stale story-58b2cec4 wording.
