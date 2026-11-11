---
uid: report-bec10d85
id: REPORT-12600
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-11-11T03:38:04.082963+00:00'
updated_at: '2026-11-11T03:38:04.082963+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-374f88d6
  anchor_uid: bundle-374f88d6
  overrides_audited: 2
  trust_boundary_overrides: 0
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: 
**Anchor**: bundle-374f88d6
**Stories Reviewed**: 10 (story-58b2cec4, story-39c992d3, story-b3de4571, story-179b8c06, story-a0b20525, story-a58a0974, story-aacb7060, story-ed976856, story-3cf3d57b, story-44d0a572)

This pass re-checks the previous review, report-e87a1fe5 (FAIL, gaps G1-G4), against HEAD. Since that review, the only non-ticket changes are in `tools/generate/src/cli/push.ts` and three test files, all landed in 4aeb1038ed (fix_reconciliation_review).

## Behavior Inventory

28 behaviours across 7 free-coded features (BUG-80, REQ-217, BUG-83, BUG-76, REQ-228 A/B/C, BUG-84, REQ-229). The 4 version-bump commits carry no behaviour. Item 20 is new since the last review: `1c push` now reports the import route's rights 403 for what it is.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Stored picture delivered by script over a constant shell (AC-2564) | Covered | story-58b2cec4 | |
| 2 | Every driver failure (lease, navigate, delivery, decode, shot) becomes a bounded refusal with no payload (AC-2565) | Covered | story-58b2cec4 | override report-c0389fea |
| 3 | Size ceiling checked before the browser lease; media type sanitised (AC-2566) | Covered | story-58b2cec4 | |
| 4 | create_image returns the display line; the image surface's own manual names `display` only when given the factory (AC-2567) | Covered | story-39c992d3 | G2 resolved |
| 5 | No factory -> no display line (AC-2568, AC-2571) | Covered | story-39c992d3, story-b3de4571 | |
| 6 | write_image display line; surface v9 says paste it verbatim; the line survives in the stored turn after a restart (AC-2569, AC-2570) | Covered | story-b3de4571 | G3 resolved: ACs narrowed to the line; CDN DOMPurify recorded as an external boundary under Reconciliation Decisions |
| 7 | Chat pane bounds images (AC-2572) | Covered | story-b3de4571 | |
| 8 | Reminder rides the tail of the last user message (AC-2364) | Covered | story-3cf3d57b | |
| 9 | Marked-points hover dims the segment (AC-2594) | Covered | story-44d0a572 | |
| 10 | account-chrome@2, sent/error slots, three-part overlay (AC-2331, AC-2330) | Covered | story-179b8c06 | |
| 11 | labelMode / label element / invariantPresentation (AC-2573) | Covered | story-179b8c06 | |
| 12 | Undeclared config/slot keys refused at write; stored strays still render (AC-2574) | Covered | story-179b8c06 | |
| 13 | Slot errors localised, unknown kinds listed, all errors reported (AC-2575) | Covered | story-179b8c06 | |
| 14 | list_library / get_library_item, filters, bounded page (AC-2576..2580) | Covered | story-a0b20525 | |
| 15 | Catalogue item accepted unchanged by screenshot and edit_image; uid, filename and title name the same picture (AC-2581) | Covered | story-a0b20525 | G4 resolved |
| 16 | place_on_site, separate grant, non-republishable refusal, absent without a store (AC-2582..2585) | Covered | story-a0b20525 | |
| 17 | Assistant reads tickets, ReadTickets only, tenant-scoped, absent on the CLI (AC-2586, AC-2587) | Covered | story-a58a0974 | |
| 18 | 1c push refuses capture-mirrored bytes (AC-2588) | Covered | story-aacb7060 | |
| 19 | POST /api/import answers 403 before createDraft (AC-2589) | Covered | story-aacb7060 | |
| 20 | `1c push` reports the route's rights 403 by asset, bundle and member, with no Access or --force advice; other 403s, 401 and redirects keep the Access advice (AC-2589 CLI clause) | Covered | story-aacb7060 | G1 resolved |
| 21 | Promotion applies the recipe and records placed_as; a recipe change replaces in place; a repeat promotion overwrites; a missing placement is reported (AC-2590..2593) | Covered | story-ed976856, story-aacb7060 | |

## Resolution of report-e87a1fe5 gaps

- **G1 (BUG-84 intent contradiction): resolved.**
  - In `push.ts` `pushSite`, a 403 whose body is JSON carrying a string `asset` is reported as a rights refusal. The message names the asset, the bundle and the member, and says nothing was written. It carries no Cloudflare Access or `--force` advice.
  - `rightsRefusal()` never throws. Every other 403, a 401 and a redirect keep the Access advice; a 409 keeps `--force`.
  - AC-2589 gains the clause, and the story's 'Code issue' note is replaced by a RESOLVED decision.
  - Evidence: `test_UAT_AC2589_1c_push_reports_the_import_routes_rights_403_by_asset_and_bundle_without_access_advice` drives `run(['push', ...])` with `fetch` doubled at the HTTP boundary. It covers the rights body, a plain HTML 403 and a JSON 403 with no `asset`, and asserts both that the right text is present and that the wrong text is absent.
- **G2 (AC-2567): resolved.**
  - The UAT asserts that the hosted session offers the image tool.
  - It contrasts `imageSurface` built with the material-URL factory (its manual contains `display`) against the same surface built without one (its manual does not). The l1 surface's own mention of `display` can no longer satisfy the check.
- **G3 (AC-2569, AC-2570): resolved by narrowing the claim, and the narrowing is recorded.**
  - Both ACs now claim only the markdown line, its business-scoped URL and bytes, and its verbatim survival in the stored and replayed turn.
  - The markdown-to-`<img>` step (stock parser and DOMPurify loaded from a CDN) is recorded as an external boundary under story-b3de4571 Reconciliation Decisions.
  - REQ-217 itself says the stock sanitiser and the replay path are unchanged, so nothing the operator intended was dropped. AC-2572 still proves in a real browser how an `<img>` in a message is laid out.
- **G4 (AC-2581): resolved without narrowing the AC.**
  - In one hosted turn through `route()`, with the real Images binding and the stubbed describer title, the UAT runs `screenshot` by uid, filename and title, then `edit_image` and `list_image_edits` by item.
  - It asserts that each resolves to the same uid and title and that `edit_image` is not refused.

The quality report report-ba1077fb (commit 38d6fa32d9, which descends from the fix commit 4aeb1038ed) shows lint and build clean, 278 passed and 0 failed. Its filter includes test_UAT_AC2565_, AC2567_, AC2569_, AC2570_, AC2581_ and AC2589_, and every named UAT above is listed as passed.

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

PASS. Nothing changed since report-e87a1fe5:
- AC-2331 and AC-2330 were rewritten in place to account-chrome@2, and no active AC still pins account-chrome@1, sentMessage or the disabled-field completion.
- AC-2364 names the user-message tail.
- No active AC describes data:-wrapper navigation, or promotion copying the original bytes.

This pass's AC edits (AC-2567, 2569, 2570, 2581, 2589) refine claims in place and supersede no sibling.

## Mode Override Audit

2 overrides audited, 0 touched a trust boundary.

**report-d8f8a034** (code_frozen, rung 1, story-aacb7060, push.ts): SOUND.
1. Justification: it rests on in-scope BUG-84 intent (the operator is told which file and where it came from, and the refusal stays distinct from BUG-51's 409). The grant is the planner decision COMMENT-8317 (comment-acabc1df).
2. Scope: since report-e87a1fe5, the only production file changed is `tools/generate/src/cli/push.ts`. `router.ts`, `asset-rights.ts` and `readSitePayload` are unchanged.
3. Instructions: the diff follows the planner's instructions. The rights body is recognised by its string `asset`, the parse is defensive, and the 401, redirect, non-rights 403 and 409 branches are unchanged.
4. Evidence: the code landed in 4aeb1038ed, after the granted head ad91a3f947. The covering UAT passes in report-ba1077fb, and its rights-body case would fail against the old code, which appended the Access advice to every 403.
5. Trust boundary: none. Only the wording of an error the CLI already raised changes. What is pushed or refused, the gate itself and credential handling are untouched.

**report-c0389fea** (code_frozen, rung 1, story-58b2cec4, screenshot.ts): SOUND. This repeats the audit in report-e87a1fe5, and nothing in screenshot.ts has changed since.
- files_touched is [screenshot.ts] only.
- Lease and shot now go through the same bounded refusal; the decode refusal is not wrapped a second time; `finally` still closes the driver.
- test_UAT_AC2565_* passes in report-ba1077fb.
- The change only narrows what reaches the model; no auth, credential or tenant boundary is involved.

## Judgment Calls

These recommendations from report-e87a1fe5 still stand. None is material, so none fails the review:
- Retitle AC-2485: its title still says 'bytes inlined'.
- Rename `test_UAT_AC2364_the_tail_is_read_in_both_wire_shapes...` to a non-UAT support test: it exercises test helpers only, and the real-host AC-2364 UATs carry the evidence.
- Add a negative assertion that the AC-2566 decode refusal is not re-wrapped.

Other judgment calls:
- AC-2567's manual check builds `imageSurface` directly rather than reading the hosted session's tool manual. Accepted: the same UAT proves through `route()` that the hosted result carries the business-scoped line. That line only exists when router.ts supplies the factory, and the factory is exactly what turns on the `display` text.
- Intent-silent choices are recorded under Reconciliation Decisions in each story and are resolved decisions, not divergences:
  - BUG-80 numeric bounds;
  - REQ-228 page size and NOT_FOUND hint cap;
  - BUG-76 error cap;
  - AC-2594 phrasing;
  - BUG-84 narrowing 'each' to 'an' offending asset;
  - the REQ-217 CDN sanitiser boundary.
- The REQ-228A operator decision (past conversations readable, WriteTickets withheld) is captured faithfully.

## Verdict

PASS. Stories accurately and completely document the behaviour surface of BUNDLE-44, consistent with the operator's intent. The BUG-84 CLI divergence that was previously only noted is now fixed under a sound override and evidenced. Every active AC in scope has a passing UAT that distinguishes it, all 8 plan items produced stories, and no superseded AC remains active. A developer reading these stories would have a correct mental model of what this code does.
