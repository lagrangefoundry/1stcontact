---
uid: report-4f7fbff8
id: REPORT-12584
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-11-11T02:22:04.365839+00:00'
updated_at: '2026-11-11T02:22:04.365839+00:00'
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
**Stories Reviewed**: 8 (plus STORY-107 story-b3de4571 and STORY-174 story-44d0a572, which plan items 2 and 8 also target)

1 overrides audited, 0 touched a trust boundary.

## Behavior Inventory

26 behaviors identified across the 7 behaviour-carrying commits (BUG-80, REQ-217, BUG-83, BUG-76, REQ-228, BUG-84, REQ-229). The 4 version-bump commits carry no behaviour.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Stored picture delivered via a constant shell URL plus 512 KiB script chunks; a multi-MB JPEG renders | Covered | story-58b2cec4 | AC-2564 |
| 2 | Every driver interaction (lease, navigate, chunks, decode, shot) is wrapped into a bounded ImageNotRenderableError | Covered | story-58b2cec4 | AC-2565; override report-c0389fea closed the lease and shot gap |
| 3 | 64 MiB ceiling checked before the lease; media type sanitised | Covered | story-58b2cec4 | AC-2566 |
| 4 | create_image / write_image return a business-scoped markdown display line | Covered | story-39c992d3, story-b3de4571 | AC-2567, AC-2569 |
| 5 | Surface v9 prose says to paste the line verbatim; the line survives reload | Covered | story-b3de4571 | AC-2570 |
| 6 | No URL factory (1c CLI) means no display line, and the tool still succeeds | Covered | story-39c992d3, story-b3de4571 | AC-2568, AC-2571 |
| 7 | Chat pane bounds an image (max-width 100%, max-height 260px) | Covered, evidence insufficient | story-b3de4571 | AC-2572 UAT is source inspection (G2) |
| 8 | account-chrome v2: labelMode, label element, invariantPresentation projected | Covered | story-179b8c06 | AC-2573 |
| 9 | Required sent/error slots; overlay shows one of form/sent/error; status-blind swap | Covered | story-179b8c06 | AC-2330 and AC-2331 modified in place |
| 10 | Undeclared config/slot keys refused at write; a stored stray key still renders | Covered | story-179b8c06 | AC-2574 |
| 11 | Slot error localisation, unknown-kind listing, every error reported (cap 10 with the remainder counted) | Covered | story-179b8c06 | AC-2575; the cap is recorded as a decision |
| 12 | meta names POST /sign-in for 1c-hosted sites | Covered (doc-only) | story-179b8c06 | Operator decision: no AC |
| 13 | list_library / get_library_item over listMaterial, with filters, a bounded page, total and more | Covered | story-a0b20525 | AC-2576..2581 |
| 14 | place_on_site via promoteToSiteAsset; renames around taken names; NOT_REPUBLISHABLE | Covered | story-a0b20525 | AC-2582..2584 |
| 15 | Separate ReadLibrary and PlaceOnSite grants; absent on the CLI | Covered | story-a0b20525 | AC-2585 |
| 16 | Tickets surface with ReadTickets only; no cross-business reach; transcripts readable | Covered | story-a58a0974 | AC-2586 |
| 17 | No ticket store (1c CLI) means no tickets surface | Covered | story-a58a0974 | AC-2587 |
| 18 | 1c push refuses sha256-matched capture-mirrored bytes, with no override | Covered | story-aacb7060 | AC-2588 |
| 19 | POST /api/import answers 403 before createDraft; 409 stays distinct | Covered | story-aacb7060 | AC-2589 |
| 20 | CLI reports the import route's rights 403 with Cloudflare Access credential advice | Flagged but unresolved | story-aacb7060 | Contradicts BUG-84 (G1) |
| 21 | Promotion applies the recipe and records placed_as | Covered | story-ed976856, story-aacb7060 | AC-2590; STORY-143 wording updated |
| 22 | Recipe change re-promotes in place (Library modal and edit_image share the path) | Covered | story-ed976856 | AC-2591 |
| 23 | Re-promotion overwrites at the recorded name | Covered | story-ed976856 | AC-2592; AC-1711 narrowed with a recorded decision |
| 24 | Recorded name missing from the site is reported and not re-added | Covered | story-ed976856 | AC-2593 |
| 25 | Turn reminder rides the tail of the last user message, not the system field | Covered | story-3cf3d57b | AC-2364 modified |
| 26 | Marked-points hover dims via the hot class without restating the region stamp | Covered | story-44d0a572 | AC-2594; the plan's "no !important" note is correctly rejected with a BUG-83 citation |

## Ungrounded Stories

None found.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Stored-picture screenshot (BUG-80) | story-58b2cec4 | ✓ AC-2564/2565/2566 |
| 2. Picture in the turn (REQ-217) | story-39c992d3, story-b3de4571 | ✓ AC-2567..2572 |
| 3. account-chrome v2 + strict validation (BUG-76) | story-179b8c06 | ✓ AC-2573/2574/2575; AC-2330/2331 modified |
| 4. Library catalogue + place_on_site (REQ-228 B/C) | story-a0b20525 (new) | ✓ AC-2576..2585 |
| 5. Assistant reads tickets (REQ-228 A) | story-a58a0974 | ✓ AC-2586/2587 |
| 6. Mirrored-asset gate (BUG-84) | story-aacb7060 | ✓ AC-2588/2589 |
| 7. Recipe reaches the site (REQ-229) | story-ed976856, story-aacb7060 | ✓ AC-2590..2593 |
| 8. Reminder channel + marked-points hover (BUG-83) | story-3cf3d57b, story-44d0a572 | ✓ AC-2364 modified, AC-2594 |

Every bundle AC has a named UAT, and all of them passed in scoped quality report-3999b38c (277 passed, 0 failed, lint and build clean).

## Supersession Check (Step 4c)

PASS. BUG-76 explicitly supersedes the v1 account-chrome contract. AC-2331 and AC-2330 are each mostly still true, so they are rewritten in place to v2 rather than retired, and this is recorded under Reconciliation Decisions in story-179b8c06. No other active AC still pins sentMessage, the hardcoded error string or "field and submit disabled". AC-2364 is amended for BUG-83's reminder channel, and AC-1807/AC-2376 are confirmed consistent. REQ-229's narrowing of AC-1711 and its lifting of STORY-178's out-of-scope entry are recorded.

## Mode Override Audit

report-c0389fea (code_frozen, story-58b2cec4, rung 1): PASS on all five items.
1. The justification cites in-scope intent: BUG-80 Fix item 2 and AC-2565 case (c).
2. The tip evidence is real: in the pre-fix code, driver.screenshot and factory() sat outside the safeDriverMessage try.
3. The change is confined to the named file. Commit 1d4720bfa6 touches only tools/generate/src/cli/capture/screenshot.ts, as the planner instructions required, and the deliberate decode refusal is not re-wrapped.
4. The named test exists and passes: test_UAT_AC2565_... now carries rejecting-shot and rejecting-lease cases.
5. Trust boundary: none touched. The change only narrows what can escape into a tool result, and conformance passed. The story's technical context records the resolution.

## Judgment Calls

- BUG-76 D5 asks for "every error". The code reports up to 10 and counts the rest. This is recorded as a reconciliation decision with reasoning, and the stated count keeps a cut report from passing as complete. Accepted.
- BUG-84: the refusal names the first offending asset, not every one. The intent says "names the offending asset", so this is consistent and recorded. Accepted.
- STORY-157 still says a drawing is rasterised in a "bare data: shell document" (lines 94 and 154). The shell is now constant and script-fed. The divergence it records (not the site's draft preview) still stands; the wording is slightly stale but not material.
- Pre-existing flags in story-39c992d3 (vendor in the material body, BUG-381) and story-b3de4571 (--alt in the usage text) predate this bundle and are outside its intent scope. Not failed here.
- **G1 is material.** See below.
- **G2 is material.** See below.

## Gaps (for fix_reconciliation_review)

### G1: BUG-84's rights 403 is reported to the operator as a Cloudflare Access credential problem (code defect, recorded but not fixed)
- Intent (bundle-374f88d6, BUG-84 "What must not change"): "The refusal names the offending asset and the bundle member it mirrors, so the operator is told *which* file and *where it came from* rather than that the push was refused". BUG-51's 409 and this refusal "must stay distinguishable".
- Code: tools/generate/src/cli/push.ts:226 sets `refusedByAccess = bounced || res.status === 401 || res.status === 403`. Lines 239-242 then append "The target is behind Cloudflare Access. Set CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET ... Run bin/access-token to provision one." to the Worker's rights 403. The operator is told to fix credentials that are fine.
- story-aacb7060 flags this ("Code issue: the CLI reports the import route's 403 with Cloudflare Access advice") but parks it: "not formalized as a criterion ... recorded so the CLI message can be corrected". A known defect against in-scope intent cannot be left as a note. It is fixed in this run.
- Remediation:
  - (a) Request a rung-1 code_frozen override scoped to tools/generate/src/cli/push.ts. Tell the rights 403 apart from an Access 403 using the response body (the import route's rights refusal carries the `asset` field / JSON shape; an Access 403 does not). For the rights refusal, report the named asset and bundle member and give no Access advice. Leave the 401, redirect, Access-403 and 409 paths unchanged.
  - (b) Add a clause to AC-2588 or AC-2589 (or a new AC under story-aacb7060): when the Worker refuses an import for capture-mirrored bytes, the 1c push error names the asset and its bundle member and carries no Cloudflare Access advice.
  - (c) Extend the UAT: drive the real push client against the real import route (or a fetch double at the HTTP boundary that returns the route's actual 403 body). Assert the message contains the asset name and does not contain "Cloudflare Access". Also assert that a plain Access 403 (no rights body) still gets the advice.
  - (d) Replace the story's "Code issue" paragraph with a RESOLVED note citing the override.

### G2: AC-2572's only UAT is a source-text inspection of builder.css
- tests/reconciliation-assistant-picture-in-the-turn.test.ts:32 reads apps/control-app/src/builder/builder.css with readFileSync. test_UAT_AC2572_an_image_in_a_chat_message_is_bounded_by_the_pane (lines 139-149) then string-matches the text after the first `.builder-chat img` up to the next `}`.
- It never renders anything. Any of these would pass the test while violating the AC: a later, more specific rule (e.g. `.builder-chat .msg img { max-width: none }`), a webui-chat class change so `.builder-chat img` no longer matches a message image, or the stylesheet not being loaded by the builder page at all. Step 5b forbids source-inspection evidence.
- Remediation: rewrite the AC-2572 UAT to render an assistant message containing a large image (for example 3000x2000) inside the builder's chat pane, with builder.css applied as the builder page loads it. Use a real browser through the project's existing Playwright / BrowserDriver seam, skipped visibly where none launches, as AC-2421 does. Assert the image's computed/rendered width is no more than the pane's content width and its rendered height is no more than 260px. Keep it test-only; no production change is needed.

## Verdict

FAIL: Intent fidelity, plan-item accounting, supersession and the override audit all pass, and all 8 plan items produced stories and ACs with passing UATs. Two gaps remain. G1: a BUG-84 behaviour that contradicts intent (the rights 403 is given Access-credential advice in tools/generate/src/cli/push.ts:226,239-242) is recorded in story-aacb7060 but left unfixed. G2: AC-2572 (story-b3de4571) has only source-inspection evidence. The fix loop should address both as specified above.
