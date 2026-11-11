---
uid: report-e87a1fe5
id: REPORT-12596
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-11-11T03:21:35.326283+00:00'
updated_at: '2026-11-11T03:21:35.326283+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-374f88d6
  anchor_uid: bundle-374f88d6
  overrides_audited: 1
  trust_boundary_overrides: 0
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: 
**Anchor**: bundle-374f88d6
**Stories Reviewed**: 10 (story-58b2cec4, story-39c992d3, story-b3de4571, story-179b8c06, story-a0b20525, story-a58a0974, story-aacb7060, story-ed976856, story-3cf3d57b, story-44d0a572)

## Behavior Inventory

27 behaviours across 7 free-coded features (BUG-80, REQ-217, BUG-83, BUG-76, REQ-228 A/B/C, BUG-84, REQ-229); 4 version-bump commits carry none.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Stored picture delivered by script over a constant shell (AC-2564) | Covered | story-58b2cec4 | |
| 2 | Every driver failure (lease, navigate, delivery, decode, shot) is a bounded payload-free refusal (AC-2565) | Covered | story-58b2cec4 | override report-c0389fea |
| 3 | 64 MiB ceiling before lease; media type sanitised (AC-2566) | Covered | story-58b2cec4 | |
| 4 | create_image returns display line (AC-2567) | Covered, evidence weak | story-39c992d3 | G2 |
| 5 | No factory -> no display line (AC-2568, AC-2571) | Covered | story-39c992d3, story-b3de4571 | |
| 6 | write_image display line, surface v9 instructs verbatim, survives reload (AC-2569, AC-2570) | Covered, evidence weak | story-b3de4571 | G3 |
| 7 | Chat pane bounds images (AC-2572) | Covered | story-b3de4571 | |
| 8 | Reminder rides tail of last user message (AC-2364 modified) | Covered | story-3cf3d57b | |
| 9 | Marked-points hover dims without restating stamp (AC-2594) | Covered | story-44d0a572 | |
| 10 | account-chrome@2, sent/error slots, three-part overlay (AC-2331, AC-2330 modified) | Covered | story-179b8c06 | |
| 11 | labelMode / label element / invariantPresentation (AC-2573) | Covered | story-179b8c06 | |
| 12 | Strict config/slot keys at write, stored strays still render (AC-2574) | Covered | story-179b8c06 | |
| 13 | Slot error localisation, unknown-kind listing, all errors (AC-2575) | Covered | story-179b8c06 | |
| 14 | list_library / get_library_item, filters, bounded page (AC-2576..2580) | Covered | story-a0b20525 | |
| 15 | Library item spelled identically for screenshot and edit_image, by uid/filename/title (AC-2581) | Covered, evidence insufficient | story-a0b20525 | G4 |
| 16 | place_on_site, separate grant, non-republishable refusal, absent without store (AC-2582..2585) | Covered | story-a0b20525 | |
| 17 | Assistant reads tickets, ReadTickets only, tenant-scoped, absent on CLI (AC-2586, AC-2587) | Covered | story-a58a0974 | |
| 18 | 1c push refuses capture-mirrored bytes (AC-2588) | Covered | story-aacb7060 | |
| 19 | POST /api/import 403 before createDraft (AC-2589) | Covered | story-aacb7060 | |
| 20 | Worker rights 403 reaching `1c push` is reported as Cloudflare Access advice | Divergence flagged, not resolved | story-aacb7060 | G1 |
| 21 | Promotion applies recipe, records placed_as; recipe change replaces in place; repeat overwrites; missing reported (AC-2590..2593) | Covered | story-ed976856, story-aacb7060 | |

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Stored-picture screenshot (BUG-80) | story-58b2cec4 | ✓ |
| 2. Picture in the turn (REQ-217) | story-39c992d3, story-b3de4571 | ✓ |
| 3. account-chrome v2 + strict validation (BUG-76) | story-179b8c06 | ✓ |
| 4. Assistant library catalogue + place_on_site (REQ-228 B/C) | story-a0b20525 (new) | ✓ |
| 5. Assistant reads tickets (REQ-228 A) | story-a58a0974 | ✓ |
| 6. Mirrored-asset gate (BUG-84) | story-aacb7060 | ✓ |
| 7. Recipe reaches the site (REQ-229) | story-ed976856, story-aacb7060 | ✓ |
| 8. Reminder channel + hover (BUG-83) | story-3cf3d57b, story-44d0a572 | ✓ |

## Supersession Check (Step 4c)

PASS. AC-2331 and AC-2330 were rewritten in place to account-chrome@2. No active AC in the store still pins account-chrome@1, sentMessage, or the 'field and submit disabled' completion. AC-2364 now names the user-message tail. AC-1711 was narrowed in place and is consistent with AC-2592/2583. No active AC still says promotion copies the original bytes or that the recipe stays off the site. No AC still describes data:-wrapper navigation.

## Mode Override Audit

1 overrides audited, 0 touched a trust boundary.

- report-c0389fea (code_frozen, rung 1, story-58b2cec4, screenshot.ts): SOUND.
  - Justification rests on in-scope BUG-80 intent and AC-2565.
  - The diff is confined to the one named file (files_touched = [screenshot.ts]; no unnamed files).
  - The change matches the planner instructions: lease and shot are routed through the same bounded refusal, the decode refusal is not re-wrapped (AC-2485 wording kept), and `finally` still closes the driver.
  - Fix commit e38786bb29 is an ancestor of the quality commit 92fa4bdb; test_UAT_AC2565_* passes in report-d00436eb, and its shot (c) and lease (e) cases fail without the change.
  - The change only narrows what reaches the model; no auth, credential or tenant boundary is involved.

Note: COMMENT-8317 records a second grant (code_frozen, rung 1, push.ts only, for BUG-84). It was not injected here as a mode_override report, and its instructions are not yet carried out at HEAD (see G1).

## Gaps (fix loop)

**G1. Absorbed/unresolved intent contradiction, BUG-84 (story-aacb7060).**
- `tools/generate/src/cli/push.ts:226` sets `refusedByAccess = bounced || res.status === 401 || res.status === 403`, and `:239-242` append the CF_ACCESS_CLIENT_ID / bin/access-token advice to every 403. That includes the Worker's rights refusal from POST /api/import (`apps/control-app/src/router.ts` MirroredAssetError, `json(403, { error, slug, asset, bundle, ... })`).
- BUG-84 requires the operator to be told which file and where it came from, kept distinguishable from other refusals. The story itself records this as a 'Code issue' (story-aacb7060.md ~231-240) and leaves it unfixed; no AC covers it.
- Remediation, per the grant already recorded in COMMENT-8317 (push.ts only):
  1. When a 403 body parses as JSON with a string `asset` field, report a rights refusal: name the asset and bundle (member where present), say the bytes were mirrored from a captured page and cannot be published, say nothing was written, and give no Access advice.
  2. Add an AC under story-aacb7060 for that message.
  3. Add a UAT that drives `run(['push', ...])` against a fetch answering that 403 body. Assert the asset name is present and there is no CF_ACCESS text; also assert a non-JSON 403 still gets the Access advice.
  4. Remove the 'Code issue' note from the story.

**G2. Step 5b, AC-2567 (acceptance_criterion-98f92375, story-39c992d3).**
- `tests/reconciliation-consultant-image-generation-display.workers.test.ts:233-234` checks for 'display' anywhere in the system text plus all tools. The l1 surface v9 already mentions `display` for write_image, so the check passes even if the CreateImage manual drops the field.
- Remediation: assert on the CreateImage tool entry or its surface manual alone (as AC-2568 does at :265-275).

**G3. Step 5b, AC-2569 (acceptance_criterion-9b0c0a93) and AC-2570 (acceptance_criterion-a193c964), story-b3de4571.**
- Both ACs claim the line is rendered as an `<img>` by the chat's sanitiser. Nothing asserts it.
  - `tests/picture-in-the-turn-browser.test.ts:67` replaces the sanitiser with an identity function.
  - `tests/reconciliation-assistant-conversation.test.ts:530-545` asserts only the markdown text.
- Remediation, either:
  - load the real sanitiser in the browser harness and assert the `<img src>` survives; or
  - restate both ACs to claim only the markdown line, and record the CDN sanitiser as an external boundary under Reconciliation Decisions.

**G4. Step 5b, AC-2581 (acceptance_criterion-70b8cb2c, story-a0b20525).**
- The AC claims the catalogue's `item` value is accepted unchanged by both `screenshot` and `edit_image`, and that uid, filename and title spellings resolve.
- `tests/test_reconciliation_library_catalogue.workers.test.ts:486-516` exercises only `screenshot`, by uid and by filename.
- Remediation: in the same hosted turn, add an `edit_image` (or `list_image_edits`) call with `image: <item>`. Assert it resolves the same material and is not refused. Add a `screenshot` by the describer title and assert it resolves to the same uid. Do not narrow the AC: intent (bundle body, REQ-228) requires both spellings and both tools.

## Judgment Calls

- Not failing, recommended:
  - AC-2485 title still says 'bytes inlined' while its body says delivery by script: retitle.
  - `test_UAT_AC2364_the_tail_is_read_in_both_wire_shapes_and_a_quiet_turn_reads_as_absent` exercises only test helpers. Rename it to a non-UAT support test; real-host AC-2364 UATs carry the evidence.
  - Nothing pins that the AC-2566 decode refusal is not re-wrapped: add a negative assertion.
- AC-2585 hosted half reads LIBRARY_DECLARATION and doubles LibraryDeps. Accepted as a structural grant AC: hosted presence and separate place_on_site grant are independently proven through route() in the workers suite.
- Intent-silent choices are recorded under Reconciliation Decisions in each story:
  - BUG-80 numeric bounds;
  - REQ-228 page size 20 and NOT_FOUND hint cap;
  - BUG-76 10-error cap;
  - AC-2594 not adopting the plan's 'no !important' phrasing;
  - BUG-84 'each' narrowed to 'an' offending asset.
  These are resolved decisions, not divergences.
- REQ-228A operator decision (2026-09-11: past conversations readable, WriteTickets withheld) is faithfully captured; not re-litigated.

## Verdict

FAIL. All 8 plan items produced stories and no superseded AC remains active, but:
- G1: a known BUG-84 intent contradiction (push.ts gives Access advice on the rights 403) is recorded as a note rather than fixed and evidenced.
- G2, G3, G4: three active ACs lack distinguishing UAT evidence (AC-2567, AC-2569/AC-2570, AC-2581).
